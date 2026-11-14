import { NextResponse } from 'next/server';
import { ingestDataset, safeEqual } from '@/lib/reviews/sync';

export const maxDuration = 60;

/** Recebe o aviso da Apify de que a busca terminou e grava as avaliações. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  if (!safeEqual(url.searchParams.get('secret'), process.env.APIFY_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const uid = url.searchParams.get('uid');
  let datasetId: string | undefined;
  try {
    const body = await req.json();
    datasetId = body?.resource?.defaultDatasetId;
  } catch {}
  if (!uid || !datasetId) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  try {
    const result = await ingestDataset(uid, datasetId);
    console.log('[reviews] webhook', uid, result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[reviews] webhook falhou:', (e as Error).message);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
