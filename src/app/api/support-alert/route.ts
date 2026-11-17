import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { notifyAdminsNewTicket } from '@/lib/support-alert';
import { ppPlanOf } from '@/lib/pp-plans';

export const maxDuration = 30;

/**
 * Chamada pelo app logo depois que o usuário abre um ticket. Exige login (ID token) e só avisa
 * os admins se o ticket for do próprio usuário, e uma única vez por ticket.
 */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let uid: string;
  try { uid = (await adminAuth().verifyIdToken(token)).uid; } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }
  const ticketId = body?.ticketId;
  if (typeof ticketId !== 'string' || !ticketId || ticketId.length > 128 || ticketId.includes('/')) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  try { await checkRateLimit('support_alert', 6); } catch { return NextResponse.json({ error: 'rate_limited' }, { status: 429 }); }

  const db = adminDb();
  const ref = db.doc(`support_tickets/${ticketId}`);
  let ticket: FirebaseFirestore.DocumentData | undefined;
  let first = false;
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      ticket = snap.data();
      if (!ticket || ticket.userId !== uid || ticket.adminNotifiedAt) return;
      tx.update(ref, { adminNotifiedAt: new Date() });
      first = true;
    });
  } catch (e) {
    console.error('[support-alert api]', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
  if (!ticket || ticket.userId !== uid) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!first) return NextResponse.json({ ok: true, already: true });

  const plan = ppPlanOf(ticket.membershipStatus);
  await notifyAdminsNewTicket({
    ticketId,
    userName: String(ticket.userName || 'Usuário Proova').slice(0, 80),
    planLabel: plan === 'pro' ? 'PRO' : plan === 'premium' ? 'PREMIUM' : 'BASE',
  });
  return NextResponse.json({ ok: true });
}
