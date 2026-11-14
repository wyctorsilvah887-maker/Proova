import type { NormalizedReview } from './types';

const ACTOR = 'compass~google-maps-reviews-scraper';
const API = 'https://api.apify.com/v2';

type Json = Record<string, any>;

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function toReview(r: Json, placeId: string | null): NormalizedReview | null {
  const reviewId = str(r.reviewId);
  if (!reviewId) return null;
  const rating = Number(r.stars ?? r.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;
  return {
    reviewId,
    authorName: str(r.name) ?? 'Cliente',
    rating: Math.round(rating),
    text: str(r.text) ?? '',
    publishedAt: str(r.publishedAtDate),
    reviewUrl: str(r.reviewUrl),
    ownerReply: str(r.responseFromOwnerText),
    placeId: str(r.placeId) ?? placeId,
  };
}

/**
 * Aceita os dois formatos que o ator pode devolver:
 * - um item por lugar, com `reviews: []` dentro;
 * - um item por avaliação (formato plano).
 * Itens inválidos são ignorados; duplicados (mesmo reviewId) removidos.
 */
export function normalizeApifyItems(items: unknown): NormalizedReview[] {
  if (!Array.isArray(items)) return [];
  const out = new Map<string, NormalizedReview>();
  for (const item of items as Json[]) {
    if (!item || typeof item !== 'object') continue;
    const candidates: Array<[Json, string | null]> = Array.isArray(item.reviews)
      ? item.reviews.map((r: Json): [Json, string | null] => [r, str(item.placeId)])
      : [[item, str(item.placeId)]];
    for (const [raw, placeId] of candidates) {
      const review = raw && typeof raw === 'object' ? toReview(raw, placeId) : null;
      if (review && !out.has(review.reviewId)) out.set(review.reviewId, review);
    }
  }
  return [...out.values()];
}

export interface RunOptions {
  placeId: string;
  webhookUrl: string; // já com uid e segredo na query
  maxReviews?: number;
  startDate?: string; // ex.: "3 days"
}

/** Corpo + query da chamada que inicia a execução do ator. */
export function buildRunRequest(opts: RunOptions) {
  const body = {
    placeIds: [opts.placeId],
    maxReviews: opts.maxReviews ?? 20,
    reviewsSort: 'newest',
    reviewsStartDate: opts.startDate ?? '30 days',
    language: 'pt-BR',
    personalData: true,
  };
  const webhooks = Buffer.from(
    JSON.stringify([{ eventTypes: ['ACTOR.RUN.SUCCEEDED'], requestUrl: opts.webhookUrl }])
  ).toString('base64');
  return { body, webhooks };
}

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error('APIFY_TOKEN não configurado.');
  return t;
}

/** Inicia a busca de forma assíncrona; o resultado chega no webhook. */
export async function startApifyRun(opts: RunOptions): Promise<{ runId: string }> {
  const { body, webhooks } = buildRunRequest(opts);
  const res = await fetch(`${API}/actors/${ACTOR}/runs?webhooks=${encodeURIComponent(webhooks)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Apify ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return { runId: json.data.id };
}

/** Lê o resultado de uma execução pelo id do dataset. */
export async function fetchDatasetReviews(datasetId: string): Promise<NormalizedReview[]> {
  const res = await fetch(`${API}/datasets/${encodeURIComponent(datasetId)}/items?clean=true&format=json`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) throw new Error(`Apify dataset ${res.status}`);
  return normalizeApifyItems(await res.json());
}
