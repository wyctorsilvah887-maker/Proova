import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendFeedbackAlert } from '@/lib/feedback-alert';
import { normalizeBrWhatsapp } from '@/lib/whatsapp';

const WINDOW_MS = 30 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * O cliente que deu nota baixa deixa (opcionalmente) um contato para a clínica retornar.
 * Público de propósito (sem login). Proteções: só vale para um depoimento recém-criado (30 min),
 * de nota baixa, uma única vez, e o contato precisa ser um e-mail ou WhatsApp válido.
 */
export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  const { targetUserId, testimonialId, collection } = body || {};
  const raw = typeof body?.contact === 'string' ? body.contact.trim().slice(0, 120) : '';
  const ids = [targetUserId, testimonialId];
  if (ids.some((v) => typeof v !== 'string' || !v || v.length > 128 || v.includes('/'))) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const colName = collection === 'private_feedbacks' ? 'private_feedbacks' : 'testimonials';

  const wa = normalizeBrWhatsapp(raw);
  const contact = EMAIL_RE.test(raw) ? raw.toLowerCase() : wa ? `+${wa}` : null;
  if (!contact) return NextResponse.json({ error: 'invalid_contact' }, { status: 400 });

  try {
    const db = adminDb();
    const ref = db.doc(`users/${targetUserId}/${colName}/${testimonialId}`);
    const snap = await ref.get();
    const t = snap.data();
    if (!t) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const created = t.createdAt?.toMillis?.() ?? 0;
    if (!created || Date.now() - created > WINDOW_MS) return NextResponse.json({ error: 'expired' }, { status: 410 });
    if (t.contactInfo) return NextResponse.json({ error: 'already_sent' }, { status: 409 });
    if ((t.rating ?? 5) > 3) return NextResponse.json({ error: 'not_allowed' }, { status: 403 });

    await ref.update({ contactInfo: contact, contactAt: new Date() });

    const owner = (await db.doc(`users/${targetUserId}`).get()).data();
    const status = owner?.membershipStatus;
    if (owner && (status === 'gold' || status === 'enterprise' || status === 'trial')) {
      await sendFeedbackAlert({
        ownerEmail: owner.email,
        companyName: owner.companyName || '',
        clientName: t.userName || 'Cliente',
        rating: t.rating,
        clientContact: contact,
        kind: 'contact',
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[feedback-contact]', (e as Error).message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
