import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { isValidPlaceId, parseGoogleLink, reviewLinkFor } from '@/lib/google-place';

/**
 * Salva (ou remove) a empresa do Google do usuário logado.
 * Aceita { placeId } (vindo da busca), { url } (link colado manualmente) ou { clear: true }.
 * Grava pelo servidor para não depender das regras do Firestore e validar o link.
 */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let uid: string;
  try { uid = (await adminAuth().verifyIdToken(token)).uid; }
  catch (e) {
    console.error('[google-place] token recusado:', (e as Error).message);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  const update: Record<string, unknown> = {};
  if (body?.clear === true) {
    update.googlePlaceId = '';
    update.googleMapsUrl = '';
  } else if (body?.placeId !== undefined) {
    if (!isValidPlaceId(body.placeId)) return NextResponse.json({ error: 'invalid_place' }, { status: 400 });
    update.googlePlaceId = body.placeId;
    update.googleMapsUrl = reviewLinkFor(body.placeId);
  } else if (typeof body?.url === 'string') {
    const parsed = parseGoogleLink(body.url);
    if (!parsed) return NextResponse.json({ error: 'invalid_link' }, { status: 400 });
    update.googleMapsUrl = parsed.url;
    update.googlePlaceId = parsed.placeId || '';
  } else {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  // Cidade/UF opcionais enviados junto (ex.: preenchidos antes de buscar a empresa).
  const city = typeof body?.city === 'string' ? body.city.trim().slice(0, 80) : '';
  const state = typeof body?.state === 'string' ? body.state.trim().toUpperCase() : '';
  if (city && /^[A-Z]{2}$/.test(state)) { update.city = city; update.state = state; }

  try {
    await adminDb().doc(`users/${uid}`).update({ ...update, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true, googlePlaceId: update.googlePlaceId ?? null, googleMapsUrl: update.googleMapsUrl ?? null });
  } catch (e) {
    console.error('[google-place] falha ao gravar:', (e as Error).message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
