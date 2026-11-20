import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { bumpEvent } from '@/lib/analytics-server';

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|uptime|curl|wget|python|node-fetch|axios/i;

/**
 * Conta uma abertura do link de coleta (/c/[slug]). Público de propósito (o cliente final não tem login):
 * só incrementa, só se a empresa existir, ignora bots (inclusive o robô de pré-visualização do WhatsApp)
 * e o navegador manda no máximo 1x por sessão. O dono vê o número dele em /metrics; o admin vê o total.
 */
export async function POST(req: Request) {
  if (BOT.test(req.headers.get('user-agent') || '')) return NextResponse.json({ ok: true, skipped: 'bot' });
  let targetUserId = '';
  try {
    const body = await req.json();
    targetUserId = typeof body?.targetUserId === 'string' ? body.targetUserId : '';
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!targetUserId || targetUserId.length > 128 || targetUserId.includes('/')) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  try {
    const ref = adminDb().doc(`users/${targetUserId}`);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    await ref.update({ collectionViewCount: FieldValue.increment(1) });
    await bumpEvent('collection_view', 'direto', true).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[collection-view]', (e as Error).message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
