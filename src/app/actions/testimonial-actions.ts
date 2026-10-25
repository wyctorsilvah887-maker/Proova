
'use server';

import { headers } from 'next/headers';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp, doc, updateDoc, increment, getDoc, arrayUnion, limit } from 'firebase/firestore';
import { Resend } from 'resend';

/**
 * Verifica o limite de requisições no Firestore de forma index-safe (Filtro único).
 */
async function checkRateLimit(actionName: string) {
  const { firestore } = initializeFirebase();
  const headerList = await headers();
  const ip = (headerList.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
  
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const rateLimitRef = collection(firestore, 'rate_limits');
  
  // Consulta com APENAS UM filtro para evitar erro de índice composto
  const q = query(
    rateLimitRef,
    where('ip', '==', ip)
  );
  
  const snap = await getDocs(q);
  
  // Filtra por ação e tempo em memória
  const recentRequests = snap.docs.filter(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() || new Date(0);
    return data.action === actionName && createdAt > oneMinuteAgo;
  });
  
  if (recentRequests.length >= 15) {
    throw new Error('Limite de envios excedido. Tente novamente em instantes.');
  }

  await addDoc(rateLimitRef, {
    ip,
    action: actionName,
    createdAt: serverTimestamp()
  });
}

/**
 * Verifica se o texto contém palavras positivas para curadoria.
 */
function hasPositiveWords(text: string): boolean {
  const positiveWords = [
    'recomendo', 'excelente', 'parabéns', 'ótimo', 'otimo', 'amei', 'melhor', 
    'perfeito', 'incrível', 'incrivel', 'atencioso', 'rápido', 'rapido', 'nota 10'
  ];
  const lowerText = text.toLowerCase();
  return positiveWords.some(word => lowerText.includes(word));
}

/**
 * Envia um alerta de feedback crítico para o dono do negócio.
 */
async function sendCriticalFeedbackAlert(ownerEmail: string, feedbackData: any, companyName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !ownerEmail) return;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'Proova Alerts <proova@proova.wsstudioscompany.com.br>',
      to: [ownerEmail],
      subject: `⚠️ Feedback Crítico Recebido - ${companyName}`,
      html: `
        <div style="font-family: sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #ef4444; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Alerta de Reputação</h1>
          </div>
          <div style="padding: 30px;">
            <p>Olá,</p>
            <p>Você recebeu um novo feedback de <strong>${feedbackData.rating} estrelas</strong> no seu Inbox Privado.</p>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <p style="margin: 0; font-style: italic;">"${feedbackData.text}"</p>
              <p style="margin-top: 15px; font-size: 13px; color: #6b7280;">— ${feedbackData.userName} (${feedbackData.userEmail || 'E-mail não informado'})</p>
            </div>
            <p>Recomendamos entrar em contato com o cliente para resolver a situação antes que ela se torne uma reclamação pública.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://proova.wsstudioscompany.com.br'}/private" style="background-color: #1f2937; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver no Painel Proova</a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Erro ao enviar e-mail de alerta:", err);
  }
}

/**
 * Notifica o dono sobre um depoimento aguardando curadoria.
 */
async function sendCuratorshipAlert(ownerEmail: string, testimonialData: any, companyName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !ownerEmail) return;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'Proova Curadoria <proova@proova.wsstudioscompany.com.br>',
      to: [ownerEmail],
      subject: `✨ Novo Elogio para Curadoria - ${companyName}`,
      html: `
        <div style="font-family: sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #f97316; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Elogio Qualificado!</h1>
          </div>
          <div style="padding: 30px;">
            <p>Olá,</p>
            <p>Um cliente deixou um depoimento que atende aos seus critérios de qualidade e está aguardando aprovação para ir ao ar.</p>
            <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316; margin: 20px 0;">
              <p style="margin: 0; font-style: italic;">"${testimonialData.text}"</p>
              <p style="margin-top: 15px; font-size: 13px; color: #9a3412;">— ${testimonialData.userName}</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://proova.wsstudioscompany.com.br'}/dash" style="background-color: #f97316; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2);">Aprovar e Publicar agora</a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Erro ao enviar e-mail de curadoria:", err);
  }
}

/**
 * Salva um depoimento com lógica de Auto-Curadoria e Fila de Revisão.
 */
export async function submitTestimonialAction(data: {
  targetUserId: string;
  destination: 'public' | 'private';
  userName: string;
  userEmail: string;
  rating: number;
  text: string;
}) {
  try {
    // 1. Check Rate Limit (Index-safe)
    await checkRateLimit('submit_testimonial');
    
    const { firestore } = initializeFirebase();
    
    // Status inicial: Publicos entram como 'pending' para curadoria, privados entram como 'approved'
    const initialStatus = data.destination === 'public' ? 'pending' : 'approved';

    const testimonialData = {
      userName: data.userName.trim(),
      userEmail: data.userEmail.trim().toLowerCase(),
      rating: data.rating,
      text: data.text.trim(),
      status: initialStatus,
      createdAt: serverTimestamp(),
    };

    const collectionName = data.destination === 'public' ? 'testimonials' : 'private_feedbacks';
    const feedbacksRef = collection(firestore, 'users', data.targetUserId, collectionName);

    // 2. Incrementa o contador do usuário PRIMEIRO para garantir que conte no Dash
    const userRef = doc(firestore, 'users', data.targetUserId);
    await updateDoc(userRef, {
      testimonialsCount: increment(1)
    });

    // 3. Salva o depoimento
    const docRef = await addDoc(feedbacksRef, testimonialData);
    const testimonialId = docRef.id;

    // 4. Busca dados do usuário para alertas
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();

      if (data.destination === 'private' || data.rating <= 3) {
        await sendCriticalFeedbackAlert(userData.email, testimonialData, userData.companyName);
      } 
      else if (data.destination === 'public' && data.rating >= 4 && data.text.length >= 20) {
        await sendCuratorshipAlert(userData.email, testimonialData, userData.companyName);
      }
    }

    // 5. LÓGICA DE SINCRONIZAÇÃO AUTOMÁTICA (Index-safe)
    if (data.destination === 'public') {
      const widgetsRef = collection(firestore, 'users', data.targetUserId, 'widgets');
      const widgetsSnap = await getDocs(widgetsRef);

      let wasAutoPublished = false;

      const updatePromises = widgetsSnap.docs.map(async (wDoc) => {
        const widget = wDoc.data();
        if (!widget.autoPublishEnabled) return;

        const minRating = widget.autoPublishMinRating || 5;
        const minChars = widget.autoPublishMinChars || 0;

        if (testimonialData.rating >= minRating && testimonialData.text.length >= minChars) {
          wasAutoPublished = true;
          await updateDoc(wDoc.ref, {
            selectedTestimonialIds: arrayUnion(testimonialId)
          });
        }
      });

      await Promise.all(updatePromises);

      if (wasAutoPublished) {
        await updateDoc(docRef, { status: 'approved' });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Testimonial Submission Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Aprova um depoimento da fila de revisão e o publica no widget principal.
 */
export async function approveTestimonialAction(userId: string, testimonialId: string) {
  try {
    const { firestore } = initializeFirebase();
    const testimonialRef = doc(firestore, 'users', userId, 'testimonials', testimonialId);
    
    await updateDoc(testimonialRef, { status: 'approved' });

    const widgetsRef = collection(firestore, 'users', userId, 'widgets');
    const widgetsSnap = await getDocs(query(widgetsRef, limit(1)));
    
    if (!widgetsSnap.empty) {
      await updateDoc(widgetsSnap.docs[0].ref, {
        selectedTestimonialIds: arrayUnion(testimonialId)
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("Erro ao aprovar:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Arquiva um depoimento (remove da fila sem deletar).
 */
export async function archiveTestimonialAction(userId: string, testimonialId: string) {
  try {
    const { firestore } = initializeFirebase();
    const testimonialRef = doc(firestore, 'users', userId, 'testimonials', testimonialId);
    await updateDoc(testimonialRef, { status: 'archived' });
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao arquivar:", err);
    return { success: false, error: err.message };
  }
}
