'use server';

import { headers } from 'next/headers';
import { initializeFirebase } from '@/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, limit, where } from 'firebase/firestore';
import { Resend } from 'resend';
import { generateReplyAction } from '@/ai/flows/generate-reply-flow';

/**
 * Verifica o limite de requisições.
 */
async function checkRateLimit(actionName: string) {
  const { firestore } = initializeFirebase();
  const headerList = await headers();
  const ip = (headerList.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
  
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const rateLimitRef = collection(firestore, 'rate_limits');
  
  const q = query(rateLimitRef, where('ip', '==', ip), limit(50));
  const snap = await getDocs(q);
  
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
 * Envia um alerta de feedback crítico.
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
      html: `<p>Olá, você recebeu um feedback de ${feedbackData.rating} estrelas.</p><p>"${feedbackData.text}"</p>`,
    });
  } catch (err) { console.error(err); }
}

/**
 * Salva um depoimento com resposta automática via IA.
 */
export async function submitTestimonialAction(data: {
  targetUserId: string;
  destination: 'public' | 'private';
  userName: string;
  userEmail: string;
  rating: number;
  text: string;
  videoUrl?: string;
  photoUrl?: string;
}) {
  try {
    await checkRateLimit('submit_testimonial');
    const { firestore } = initializeFirebase();
    
    const userRef = doc(firestore, 'users', data.targetUserId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("Empresa não localizada.");
    
    const userData = userSnap.data();
    const status = userData.membershipStatus || 'base';
    const isPremium = status === 'gold' || status === 'enterprise' || status === 'trial';

    // Piloto Automático: gera resposta por IA. Se a IA falhar, o depoimento é salvo sem resposta.
    let aiReply = null;
    if (isPremium) {
      try {
        const { reply } = await generateReplyAction({
          authorName: data.userName,
          testimonialText: data.text || (data.videoUrl ? '[Depoimento em Vídeo]' : ''),
          rating: data.rating,
          companyName: userData.companyName,
          businessType: userData.businessType
        });
        aiReply = reply;
      } catch (error) {
        console.error('Falha ao gerar resposta automática por IA:', error);
      }
    }

    const initialStatus = 'approved';

    const testimonialData = {
      userName: data.userName.trim(),
      userEmail: data.userEmail.trim().toLowerCase(),
      rating: data.rating,
      text: data.text.trim(),
      videoUrl: data.videoUrl || null,
      photoUrl: data.photoUrl || null,
      status: initialStatus,
      aiReply: aiReply,
      createdAt: serverTimestamp(),
    };

    const collectionName = data.destination === 'public' ? 'testimonials' : 'private_feedbacks';
    const feedbacksRef = collection(firestore, 'users', data.targetUserId, collectionName);

    await updateDoc(userRef, { testimonialsCount: increment(1) });
    await addDoc(feedbacksRef, testimonialData);

    // Alertas por e-mail (Premium)
    if (isPremium) {
      if (data.destination === 'private' || data.rating <= 3) {
        await sendCriticalFeedbackAlert(userData.email, testimonialData, userData.companyName);
      }
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
