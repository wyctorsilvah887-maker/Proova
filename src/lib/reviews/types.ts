/** Avaliação do Google já normalizada, independente da fonte (Apify hoje, Google Business Profile depois). */
export interface NormalizedReview {
  reviewId: string;
  authorName: string;
  rating: number; // 1..5
  text: string; // pode ser vazio (só estrelas)
  publishedAt: string | null; // ISO
  reviewUrl: string | null;
  ownerReply: string | null; // resposta do dono, se já existir
  placeId: string | null;
}

export type ReviewStatus = 'pending' | 'copied' | 'dismissed' | 'replied';

/** Documento salvo em users/{uid}/googleReviews/{reviewId}. */
export interface StoredReview extends NormalizedReview {
  status: ReviewStatus;
  aiReply: string | null;
  source: 'apify' | 'google_business_profile';
  fetchedAt: unknown; // Timestamp do servidor
  expireAt?: unknown; // fetchedAt + 30 dias; depois disso a avaliação é apagada automaticamente
  copiedAt?: unknown;
}

/** Contrato que toda fonte de avaliações precisa cumprir. */
export interface ReviewSource {
  name: StoredReview['source'];
}

/** Por quanto tempo uma avaliação do Google fica guardada (e visível no painel) antes de ser apagada. */
export const REVIEW_RETENTION_DAYS = 30;
export const REVIEW_RETENTION_MS = REVIEW_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** Planos que recebem a busca automática ('trial' só por compatibilidade com contas antigas; não é mais vendido). */
export const AUTO_FETCH_PLANS = ['gold', 'enterprise', 'trial'] as const;
