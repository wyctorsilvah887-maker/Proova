import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Registra que um cliente foi encaminhado ao Google (botão "Avaliar também no Google").
 * Mede o encaminhamento, não a avaliação publicada. Público de propósito (o cliente final não tem login),
 * por isso só incrementa e só se a empresa existir e tiver link do Google configurado.
 */
export async function POST(req: Request) {
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
    if (!snap.exists || !snap.data()?.googleMapsUrl) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    await ref.update({ googleRedirectCount: FieldValue.increment(1) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[google-click]', (e as Error).message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
