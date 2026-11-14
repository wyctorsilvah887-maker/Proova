import { timingSafeEqual } from 'node:crypto';

/** Comparação de segredos sem vazar tempo de resposta. */
export function safeEqual(a: string | null | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
