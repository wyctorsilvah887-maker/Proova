import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { checkSendLimit, CODE_TTL_MS, generateCode, hashCode, normalizeEmail } from '@/lib/billing/claim';
import { sendClaimCodeEmail } from '@/lib/billing/email';

/**
 * Passo 1 do resgate: o cliente informa o e-mail usado na compra.
 * A resposta é sempre a mesma, exista ou não uma compra, para ninguém descobrir quem comprou.
 */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  let uid: string;
  try { uid = (await adminAuth().verifyIdToken(token)).uid; }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const email = normalizeEmail((await req.json().catch(() => ({})))?.email);
  if (!email) return NextResponse.json({ error: 'email_invalido' }, { status: 400 });

  const db = adminDb();
  const ref = db.doc(`claim_codes/${uid}`);
  const state = (await ref.get()).data() || {};

  const limit = checkSendLimit({
    lastSentMs: state.lastSentAt?.toMillis?.(),
    windowStartMs: state.windowStartAt?.toMillis?.(),
    sendCount: state.sendCount,
  });
  if (!limit.ok) return NextResponse.json({ error: 'limite', retryInSeconds: limit.retryInSeconds }, { status: 429 });

  const rate = {
    lastSentAt: Timestamp.fromMillis(limit.next.lastSentMs),
    windowStartAt: Timestamp.fromMillis(limit.next.windowStartMs),
    sendCount: limit.next.sendCount,
  };

  const open = await db.collection('pending_plans').where('email', '==', email).where('status', '==', 'open').limit(1).get();
  if (open.empty) {
    await ref.set(rate, { merge: true }); // conta a tentativa mesmo sem compra
    return NextResponse.json({ ok: true });
  }

  const code = generateCode();
  await ref.set({
    ...rate,
    email,
    codeHash: hashCode(uid, email, code),
    expiresAt: Timestamp.fromMillis(Date.now() + CODE_TTL_MS),
    attempts: 0,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await sendClaimCodeEmail(email, code);
  return NextResponse.json({ ok: true });
}
