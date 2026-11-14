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
  let started = 0, failed = 0;
  for (const doc of snap.docs) {
    const u = doc.data();
    if (!u.googlePlaceId) continue;
    try {
      await startSyncForUser(doc.id, u.googlePlaceId, !u.lastReviewSyncAt);
      started++;
    } catch (e) {
      failed++;
      console.error('[cron reviews]', doc.id, (e as Error).message);
    }
  }
  return NextResponse.json({ ok: true, started, failed });
}
