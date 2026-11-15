import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRefundEligibility } from '@/lib/billing/refund';

/** O cliente logado pede reembolso. A devolução do dinheiro é feita por você na Cakto. */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  let uid: string;
  try { uid = (await adminAuth().verifyIdToken(token)).uid; }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const body = await req.json().catch(() => ({}));
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';

  const db = adminDb();
  const user = (await db.doc(`users/${uid}`).get()).data();
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const planMs = user.planUpdatedAt?.toMillis?.() ?? null;
  const check = checkRefundEligibility(user.membershipStatus, planMs);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 403 });

  const open = await db.collection('refund_requests').where('uid', '==', uid).where('status', '==', 'pending').limit(1).get();
  if (!open.empty) return NextResponse.json({ error: 'ja_solicitado' }, { status: 409 });

  await db.collection('refund_requests').add({
    uid,
    email: user.email || null,
    companyName: user.companyName || null,
    plan: user.membershipStatus,
    reason,
    windowUnknown: check.windowUnknown,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true });
}
