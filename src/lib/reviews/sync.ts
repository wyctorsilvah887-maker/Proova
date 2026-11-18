import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { timingSafeEqual } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';
import { generateReply } from '@/ai/reply';
import { reserveAiReplies, releaseAiReplies } from '@/lib/ai-quota';
import { startApifyRun, fetchDatasetReviews } from './apify';
import { AUTO_FETCH_PLANS, REVIEW_RETENTION_MS } from './types';

const MAX_NEW_PER_RUN = 20;

export function isEligiblePlan(status: unknown): boolean {
  return typeof status === 'string' && (AUTO_FETCH_PLANS as readonly string[]).includes(status);
}

/** Comparação de segredos sem vazar tempo de resposta. */
export function safeEqual(a: string | null | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function appUrl(): string {
  return (process.env.APP_URL || 'https://useproovaai.com.br').replace(/\/$/, '');
}

/** Inicia a busca na Apify para um usuário. O resultado volta pelo webhook. */
export async function startSyncForUser(uid: string, placeId: string, firstTime: boolean) {
  const secret = process.env.APIFY_WEBHOOK_SECRET;
  if (!secret) throw new Error('APIFY_WEBHOOK_SECRET não configurado.');
  const webhookUrl = `${appUrl()}/api/webhooks/apify?uid=${encodeURIComponent(uid)}&secret=${encodeURIComponent(secret)}`;
  const { runId } = await startApifyRun({
    placeId,
    webhookUrl,
    maxReviews: MAX_NEW_PER_RUN,
    startDate: firstTime ? '30 days' : '3 days',
  });
  await adminDb().doc(`users/${uid}`).update({ lastReviewSyncAt: FieldValue.serverTimestamp(), lastReviewRunId: runId });
  return runId;
}

/** Salva avaliações novas (sem resposta do dono) com rascunho da IA. Devolve quantas entraram. */
export async function ingestDataset(uid: string, datasetId: string): Promise<{ saved: number; skipped: number }> {
  const db = adminDb();
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) throw new Error('Usuário não encontrado.');
  const user = userSnap.data()!;
  if (!isEligiblePlan(user.membershipStatus)) return { saved: 0, skipped: 0 };

  const all = await fetchDatasetReviews(datasetId);
  const open = all.filter((r) => !r.ownerReply);
  const col = db.collection(`users/${uid}/googleReviews`);
  const existing = open.length ? await db.getAll(...open.map((r) => col.doc(r.reviewId.replace(/\//g, '_')))) : [];
  const fresh = open.filter((_, i) => !existing[i].exists).slice(0, MAX_NEW_PER_RUN);

  let saved = 0;
  for (let i = 0; i < fresh.length; i += 3) {
    await Promise.all(fresh.slice(i, i + 3).map(async (r) => {
      let aiReply: string | null = null;
      let reserved = false;
      try {
        // Cota mensal de IA: estourou, a avaliação entra sem rascunho (a IA pode ser pedida depois no painel).
        reserved = (await reserveAiReplies(uid, user.membershipStatus, 1)).ok;
        if (reserved) aiReply = await generateReply({
          authorName: r.authorName, rating: r.rating, text: r.text,
          companyName: user.companyName || '', businessType: user.businessType, contactWhatsapp: user.contactWhatsapp || undefined,
        });
      } catch (e) {
        console.error('[reviews] IA falhou, salvando sem rascunho:', (e as Error).message);
        if (reserved) await releaseAiReplies(uid, 1);
      }
      await col.doc(r.reviewId.replace(/\//g, '_')).create({
        ...r, status: 'pending', aiReply, source: 'apify', fetchedAt: FieldValue.serverTimestamp(),
        expireAt: Timestamp.fromMillis(Date.now() + REVIEW_RETENTION_MS),
      }).then(() => { saved++; }).catch((e) => { if (e?.code !== 6) throw e; }); // 6 = já existe
    }));
  }
  // A busca dos últimos 30 dias só conta como feita depois que o resultado chegou com sucesso.
  await db.doc(`users/${uid}`).update({ reviewsBackfilled: true }).catch(() => {});
  return { saved, skipped: all.length - saved };
}

/**
 * Apaga as avaliações do Google guardadas há mais de 30 dias (de um usuário).
 * Devolve quantas foram removidas. Chamada pelo cron diário.
 */
export async function purgeExpiredReviews(uid: string): Promise<number> {
  const db = adminDb();
  const cutoff = Timestamp.fromMillis(Date.now() - REVIEW_RETENTION_MS);
  const snap = await db.collection(`users/${uid}/googleReviews`).where('fetchedAt', '<', cutoff).limit(300).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}
