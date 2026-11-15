'use server';

import { initializeFirebase } from '@/firebase';
import { checkRateLimit } from '@/lib/rate-limit';
import { collection, query, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, limit, where } from 'firebase/firestore';
import { sendFeedbackAlert } from '@/lib/feedback-alert';
import { generateReplyAction } from '@/ai/flows/generate-reply-flow';

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
    await checkRateLimit('submit_testimonial', 15, 'Limite de envios excedido. Tente novamente em instantes.');
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
          testimonialText: data.text?.trim() || (data.videoUrl ? '[Depoimento em Vídeo]' : '[Avaliação apenas com nota]'),
          rating: data.rating,
          companyName: userData.companyName,
          businessType: userData.businessType,
          contactWhatsapp: userData.contactWhatsapp || undefined,
        });
        aiReply = reply;
      } catch (error) {
        console.error('Falha ao gerar resposta automática por IA:', error);
      }
    }

    // Avaliação só com nota (sem texto/mídia) não vai direto para a página pública: fica na moderação.
    const hasContent = !!(data.text?.trim() || data.videoUrl || data.photoUrl);
    const initialStatus = hasContent ? 'approved' : 'pending';

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
    };

    const collectionName = data.destination === 'public' ? 'testimonials' : 'private_feedbacks';
    const feedbacksRef = collection(firestore, 'users', data.targetUserId, collectionName);

    await updateDoc(userRef, { testimonialsCount: increment(1) });
    const created = await addDoc(feedbacksRef, testimonialData);

    // Alertas por e-mail (Premium)
    if (isPremium) {
      if (data.destination === 'private' || data.rating <= 3) {
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
