'use server';

import { initializeFirebase } from '@/firebase';
import { checkRateLimit } from '@/lib/rate-limit';
import { collection, query, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, limit, where } from 'firebase/firestore';
import { sendFeedbackAlert } from '@/lib/feedback-alert';
import { generateReply } from '@/ai/reply';
import { reserveAiReplies, releaseAiReplies } from '@/lib/ai-quota';
import { notifyOwnerNewFeedback } from '@/lib/inbox-alert';

/** Versão do texto de autorização exibido no formulário de coleta (mude ao alterar o texto). */
const CONSENT_TEXT_VERSION = '2026-11-v1';

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
  /** Autorização do cliente final para publicar o depoimento (obrigatória no envio público). */
  publishConsent?: boolean;
  mediaConsent?: boolean;
}) {
  try {
    await checkRateLimit('submit_testimonial', 15, 'Limite de envios excedido. Tente novamente em instantes.');
    const { firestore } = initializeFirebase();
    
    if (data.destination === 'public' && data.publishConsent !== true) {
      throw new Error('É necessário autorizar a publicação do depoimento para enviar.');
    }

    const userRef = doc(firestore, 'users', data.targetUserId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("Empresa não localizada.");
    
    const userData = userSnap.data();
    const status = userData.membershipStatus || 'base';
    const isPremium = status === 'gold' || status === 'enterprise' || status === 'trial';

    // Piloto Automático: gera resposta por IA. Se a IA falhar, o depoimento é salvo sem resposta.
    let aiReply = null;
    if (isPremium) {
      let reserved = false;
      try {
        // Cota mensal: se estourar, o depoimento é salvo normalmente, só sem resposta automática.
        reserved = (await reserveAiReplies(data.targetUserId, status, 1)).ok;
        if (reserved) {
          aiReply = await generateReply({
            authorName: data.userName,
            text: data.text?.trim() || (data.videoUrl ? '[Depoimento em Vídeo]' : '[Avaliação apenas com nota]'),
            rating: data.rating,
            companyName: userData.companyName,
            businessType: userData.businessType,
            contactWhatsapp: userData.contactWhatsapp || undefined,
          });
        }
      } catch (error) {
        console.error('Falha ao gerar resposta automática por IA:', error);
        if (reserved) await releaseAiReplies(data.targetUserId, 1);
      }
    }

    // Reputation Shield: notas de 1 a 3 estrelas NÃO vão para a página pública; caem no Inbox Privado do dono.
    const isShield = data.destination === 'private' || data.rating <= 3;
    // Avaliação só com nota (sem texto/mídia) não vai direto para a página pública: fica na moderação.
    const hasContent = !!(data.text?.trim() || data.videoUrl || data.photoUrl);
    const initialStatus = isShield ? 'new' : (hasContent ? 'approved' : 'pending');

    // Nota baixa: a resposta da IA vira rascunho (não aparece na página pública até o dono aprovar).
    const isLowRating = data.rating <= 3;
    const testimonialData = {
      userName: data.userName?.trim() || 'Cliente',
      userEmail: data.userEmail.trim().toLowerCase(),
      rating: data.rating,
      text: data.text.trim(),
      videoUrl: data.videoUrl || null,
      photoUrl: data.photoUrl || null,
      status: initialStatus,
      aiReply: isLowRating ? null : aiReply,
      aiReplyDraft: isLowRating ? aiReply : null,
      createdAt: serverTimestamp(),
      // Registro da autorização dada pelo cliente final (data e versão do texto exibido no formulário).
      consent: data.destination === 'public'
        ? { publish: true, media: data.mediaConsent === true, textVersion: CONSENT_TEXT_VERSION, at: serverTimestamp() }
        : null,
    };

    const collectionName = isShield ? 'private_feedbacks' : 'testimonials';
    const feedbacksRef = collection(firestore, 'users', data.targetUserId, collectionName);

    await updateDoc(userRef, { testimonialsCount: increment(1) });
    const created = await addDoc(feedbacksRef, testimonialData);

    // Ativação: 1ª avaliação recebida pela empresa (alimenta o funil em /admin/growth)
    if (!(userData.testimonialsCount > 0)) {
      try {
        const { bumpEvent } = await import('@/lib/analytics-server');
        await bumpEvent('first_feedback', userData.attribution?.source || 'direto', true);
        const { adminDb } = await import('@/lib/firebase-admin');
        const { FieldValue } = await import('firebase-admin/firestore');
        await adminDb().doc(`users/${data.targetUserId}`).update({ firstFeedbackAt: FieldValue.serverTimestamp() });
      } catch { /* métrica nunca bloqueia o envio */ }
    }
    // Ativação: 1º depoimento que chegou a ficar público (aprovado direto, com texto ou mídia)
    if (initialStatus === 'approved' && !userData.firstApprovedAt) {
      try {
        const { bumpEvent } = await import('@/lib/analytics-server');
        const { adminDb } = await import('@/lib/firebase-admin');
        const { FieldValue } = await import('firebase-admin/firestore');
        await adminDb().doc(`users/${data.targetUserId}`).update({ firstApprovedAt: FieldValue.serverTimestamp() });
        await bumpEvent('first_approved', userData.attribution?.source || 'direto', true);
      } catch { /* métrica nunca bloqueia o envio */ }
    }

    // Aviso no Inbox (contador + push nos planos pagos) e e-mail (Premium)
    if (isShield) await notifyOwnerNewFeedback(data.targetUserId, { clientName: testimonialData.userName, rating: data.rating, push: isPremium });
    if (isPremium) {
      if (isShield) {
        await sendFeedbackAlert({
          ownerEmail: userData.email,
          companyName: userData.companyName,
          clientName: testimonialData.userName,
          rating: data.rating,
          text: testimonialData.text,
          clientEmail: testimonialData.userEmail,
          kind: 'new',
        });
      }
    }
    
    return { success: true, id: created.id, collection: collectionName };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
