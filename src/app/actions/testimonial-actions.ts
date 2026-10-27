'use server';

import { headers } from 'next/headers';
import { initializeFirebase } from '@/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, limit, where } from 'firebase/firestore';
import { Resend } from 'resend';

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
      html: `<p>Um elogio qualificado está aguardando sua aprovação.</p><p>"${testimonialData.text}"</p>`,
    });
  } catch (err) { console.error(err); }
}

/**
 * Salva um depoimento.
 */
export async function submitTestimonialAction(data: {
  targetUserId: string;
  destination: 'public' | 'private';
  userName: string;
  userEmail: string;
  rating: number;
  text: string;
  videoUrl?: string;
}) {
  try {
    await checkRateLimit('submit_testimonial');
    const { firestore } = initializeFirebase();
    const initialStatus = data.destination === 'public' ? 'pending' : 'approved';

    const testimonialData = {
      userName: data.userName.trim(),
      userEmail: data.userEmail.trim().toLowerCase(),
      rating: data.rating,
      text: data.text.trim(),
      videoUrl: data.videoUrl || null,
      status: initialStatus,
      createdAt: serverTimestamp(),
    };

    const collectionName = data.destination === 'public' ? 'testimonials' : 'private_feedbacks';
    const feedbacksRef = collection(firestore, 'users', data.targetUserId, collectionName);

    const userRef = doc(firestore, 'users', data.targetUserId);
    await updateDoc(userRef, { testimonialsCount: increment(1) });
    await addDoc(feedbacksRef, testimonialData);

    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const status = userData.membershipStatus || 'base';
      const isPremium = status === 'gold' || status === 'enterprise' || status === 'trial';

      // Alertas por e-mail são benefícios Premium
      if (isPremium) {
        if (data.destination === 'private' || data.rating <= 3) {
          await sendCriticalFeedbackAlert(userData.email, testimonialData, userData.companyName);
        } else if (data.destination === 'public' && data.rating >= 4 && data.text.length >= 20) {
          await sendCuratorshipAlert(userData.email, testimonialData, userData.companyName);
        }
      }
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
