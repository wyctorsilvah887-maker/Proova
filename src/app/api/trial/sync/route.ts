import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { TRIAL_MS } from '@/lib/trial';

/**
 * Chamada pelo painel a cada abertura. Autenticada pelo ID token.
 *  - conta no plano Base que nunca fez teste → inicia o teste de 14 dias (status 'trial');
 *  - teste vencido → status 'expired'.
 * Roda no servidor (Admin SDK): o cliente não consegue forjar o status nem estender a data.
 */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  let uid: string;
  try { uid = (await adminAuth().verifyIdToken(token)).uid; }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const db = adminDb();
  const ref = db.doc(`users/${uid}`);
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const u = snap.data();
    if (!u) return { status: 'none' };
    const status = (u.membershipStatus as string | undefined) || 'base';
    const now = Date.now();
    if ((status === 'base' || status === 'lead') && !u.trialUsed) {
      const ends = Timestamp.fromMillis(now + TRIAL_MS);
      tx.update(ref, { membershipStatus: 'trial', trialUsed: true, trialStartedAt: FieldValue.serverTimestamp(), trialEndsAt: ends, planUpdatedAt: FieldValue.serverTimestamp() });
      return { status: 'trial', trialEndsAt: ends.toMillis() };
    }
    if (status === 'trial') {
      const endsMs = u.trialEndsAt?.toMillis?.();
      if (endsMs && endsMs <= now) {
        tx.update(ref, { membershipStatus: 'expired', planUpdatedAt: FieldValue.serverTimestamp() });
        return { status: 'expired' };
      }
      return { status: 'trial', trialEndsAt: endsMs ?? null };
    }
    return { status };
  });
  return NextResponse.json(result);
}
