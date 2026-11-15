import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { isEligiblePlan, startSyncForUser } from '@/lib/reviews/sync';

const COOLDOWN_MS = 15 * 60 * 1000;

/** "Atualizar agora": o dono logado pede uma busca imediata (com intervalo mínimo). */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Configuração do servidor (chave do Firebase) separada de token inválido, para o erro real aparecer nos logs.
  let auth: ReturnType<typeof adminAuth>;
  try { auth = adminAuth(); }
  catch (e) {
    console.error('[reviews refresh] firebase-admin mal configurado:', (e as Error).message);
    return NextResponse.json({ error: 'server_config' }, { status: 500 });
  }
  let uid: string;
  try { uid = (await auth.verifyIdToken(token)).uid; }
  catch (e) {
    console.error('[reviews refresh] token recusado:', (e as any)?.code, (e as Error).message);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const user = (await adminDb().doc(`users/${uid}`).get()).data();
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!isEligiblePlan(user.membershipStatus)) return NextResponse.json({ error: 'plan' }, { status: 403 });
  if (!user.googlePlaceId) return NextResponse.json({ error: 'no_place' }, { status: 400 });

  const last = user.lastReviewSyncAt?.toMillis?.() ?? 0;
  const wait = COOLDOWN_MS - (Date.now() - last);
  if (wait > 0) return NextResponse.json({ error: 'cooldown', retryInSeconds: Math.ceil(wait / 1000) }, { status: 429 });

  try {
    await startSyncForUser(uid, user.googlePlaceId, !user.reviewsBackfilled);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[reviews refresh]', (e as Error).message);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
