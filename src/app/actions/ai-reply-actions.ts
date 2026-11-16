'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { generateReply } from '@/ai/reply';
import { reserveAiReplies, releaseAiReplies, QUOTA_MESSAGE } from '@/lib/ai-quota';

/**
 * Regerar resposta por IA no painel. Exige login (ID token), usa os dados da empresa do próprio
 * banco (não confia no que o navegador manda) e consome a cota mensal do plano.
 */
export async function regenerateReplyAction(
  idToken: string,
  input: { authorName: string; testimonialText: string; rating: number },
): Promise<{ reply: string; remaining: number; limit: number }> {
  let uid: string;
  try { uid = (await adminAuth().verifyIdToken(idToken)).uid; }
  catch { throw new Error('Sessão expirada. Entre novamente.'); }

  const snap = await adminDb().doc(`users/${uid}`).get();
  if (!snap.exists) throw new Error('Conta não encontrada.');
  const user = snap.data()!;

  const quota = await reserveAiReplies(uid, user.membershipStatus, 1);
  if (!quota.ok) throw new Error(QUOTA_MESSAGE);

  const rating = Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5)));
  try {
    const reply = await generateReply({
      authorName: String(input.authorName || 'Cliente').slice(0, 80),
      rating,
      text: String(input.testimonialText || '').slice(0, 2000),
      companyName: user.companyName || '',
      businessType: user.businessType,
      contactWhatsapp: user.contactWhatsapp || undefined,
    });
    return { reply, remaining: quota.remaining, limit: quota.limit };
  } catch (e) {
    await releaseAiReplies(uid, 1);
    throw e;
  }
}
