import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { isEligiblePlan, startSyncForUser } from '@/lib/reviews/sync';

const COOLDOWN_MS = 15 * 60 * 1000;

/** "Atualizar agora": o dono logado pede uma busca imediata (com intervalo mínimo). */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  let uid: string;
  try { uid = (await adminAuth().verifyIdToken(token)).uid; }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const user = (await adminDb().doc(`users/${uid}`).get()).data();
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!isEligiblePlan(user.membershipStatus)) return NextResponse.json({ error: 'plan' }, { status: 403 });
  if (!user.googlePlaceId) return NextResponse.json({ error: 'no_place' }, { status: 400 });

  const last = user.lastReviewSyncAt?.toMillis?.() ?? 0;
  const wait = COOLDOWN_MS - (Date.now() - last);
  if (wait > 0) return NextResponse.json({ error: 'cooldown', retryInSeconds: Math.ceil(wait / 1000) }, { status: 429 });

  try {
    await startSyncForUser(uid, user.googlePlaceId, !user.lastReviewSyncAt);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[reviews refresh]', (e as Error).message);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
