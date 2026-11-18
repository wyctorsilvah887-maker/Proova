import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { AUTO_FETCH_PLANS } from '@/lib/reviews/types';
import { safeEqual, startSyncForUser, purgeExpiredReviews } from '@/lib/reviews/sync';
import { Timestamp } from 'firebase-admin/firestore';

export const maxDuration = 60;

/** Chamado 1x por dia pelo Vercel Cron (Authorization: Bearer CRON_SECRET). */
export async function GET(req: Request) {
  const t0 = Date.now();
  const auth = req.headers.get('authorization') || '';
  if (!safeEqual(auth.replace(/^Bearer /, ''), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const snap = await adminDb().collection('users').where('membershipStatus', 'in', [...AUTO_FETCH_PLANS]).get();
  let started = 0, failed = 0, skipped = 0;
  const MIN_GAP_MS = 12 * 60 * 60 * 1000; // não repete quem acabou de atualizar (ex.: "Atualizar agora")
  // Quem está há mais tempo sem atualizar vai primeiro (se o tempo acabar, o resto fica para o dia seguinte).
  const queue = snap.docs
    .filter((d) => !!d.data().googlePlaceId)
    .filter((d) => {
      const last = d.data().lastReviewSyncAt?.toMillis?.() ?? 0;
      if (Date.now() - last < MIN_GAP_MS) { skipped++; return false; }
      return true;
    })
    .sort((a, b) => (a.data().lastReviewSyncAt?.toMillis?.() ?? 0) - (b.data().lastReviewSyncAt?.toMillis?.() ?? 0));

  const CONCURRENCY = 6;
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    await Promise.all(queue.slice(i, i + CONCURRENCY).map(async (doc) => {
      const u = doc.data();
      try {
        await startSyncForUser(doc.id, u.googlePlaceId, !u.reviewsBackfilled);
        started++;
      } catch (e) {
        failed++;
        console.error('[cron reviews]', doc.id, (e as Error).message);
      }
    }));
  }

  // Retenção: apaga avaliações do Google com mais de 30 dias (de qualquer usuário que já sincronizou, mesmo sem plano ativo agora).
  let purged = 0;
  try {
    const everSynced = await adminDb().collection('users').where('lastReviewSyncAt', '>', Timestamp.fromMillis(0)).select().get();
    for (let i = 0; i < everSynced.docs.length; i += 10) {
      if (Date.now() - t0 > 50_000) break; // sobra tempo para o resto no dia seguinte
      const counts = await Promise.all(everSynced.docs.slice(i, i + 10).map((d) => purgeExpiredReviews(d.id).catch((e) => { console.error('[cron purge]', d.id, (e as Error).message); return 0; })));
      purged += counts.reduce((a, b) => a + b, 0);
    }
  } catch (e) {
    console.error('[cron purge] falhou:', (e as Error).message);
  }
  return NextResponse.json({ ok: true, started, failed, skipped, purged });
}
