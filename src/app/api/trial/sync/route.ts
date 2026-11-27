import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Chamada pelo painel de contas que ainda estão em um teste ANTIGO ('trial'): se a data de fim já passou,
 * marca a conta como 'expired'. Não inicia teste nenhum (o Proova é 100% pago). Autenticada pelo ID token.
 */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  let uid: string;
  try { uid = (await adminAuth().verifyIdToken(token)).uid; }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const ref = adminDb().doc(`users/${uid}`);
  const snap = await ref.get();
  const u = snap.data();
  if (!u) return NextResponse.json({ status: 'none' });
  const status = (u.membershipStatus as string | undefined) || 'base';
  if (status === 'trial') {
    const endsMs = u.trialEndsAt?.toMillis?.();
    if (!endsMs || endsMs <= Date.now()) {
      await ref.update({ membershipStatus: 'expired', planUpdatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ status: 'expired' });
    }
  }
  return NextResponse.json({ status });
}
