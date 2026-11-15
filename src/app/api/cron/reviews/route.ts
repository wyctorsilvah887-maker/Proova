import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { AUTO_FETCH_PLANS } from '@/lib/reviews/types';
import { safeEqual, startSyncForUser } from '@/lib/reviews/sync';

export const maxDuration = 60;

/** Chamado 1x por dia pelo Vercel Cron (Authorization: Bearer CRON_SECRET). */
export async function GET(req: Request) {
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
  return NextResponse.json({ ok: true, started, failed, skipped });
}
