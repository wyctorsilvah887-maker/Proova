import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Nota e quantidade de avaliações do Google de uma empresa, para a página pública.
 * Recebe o uid do dono (nunca um placeId: não vira proxy aberto da nossa chave) e guarda
 * o resultado em cache por 6 horas, então visitas repetidas não geram custo.
 */
const TTL_MS = 6 * 60 * 60 * 1000;
const memo = new Map<string, { at: number; value: { rating: number; count: number } | null }>();

export async function GET(req: Request) {
  const uid = new URL(req.url).searchParams.get('uid') || '';
  if (!/^[A-Za-z0-9]{10,64}$/.test(uid)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ rating: null, count: 0 });

  const hit = memo.get(uid);
  if (hit && Date.now() - hit.at < TTL_MS) return respond(hit.value);

  try {
    const snap = await adminDb().doc(`users/${uid}`).get();
    const placeId = snap.data()?.googlePlaceId;
    if (!snap.exists || typeof placeId !== 'string' || !/^[A-Za-z0-9_-]{10,200}$/.test(placeId)) {
      memo.set(uid, { at: Date.now(), value: null });
      return respond(null);
    }
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'rating,userRatingCount' },
      next: { revalidate: 21600 },
    });
    if (!res.ok) return respond(null);
    const data = await res.json();
    const rating = Number(data?.rating);
    const count = Number(data?.userRatingCount);
    const value = rating > 0 && count > 0 ? { rating, count } : null;
    memo.set(uid, { at: Date.now(), value });
    return respond(value);
  } catch (e) {
    console.error('[google-rating] falhou:', (e as Error).message);
    return respond(null);
  }
}

function respond(value: { rating: number; count: number } | null) {
  return NextResponse.json(value ?? { rating: null, count: 0 }, {
    headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' },
  });
}
