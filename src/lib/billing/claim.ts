import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

/** Regras puras do "resgate de plano" (cliente que pagou com outro e-mail). */
export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const SEND_COOLDOWN_MS = 60 * 1000;
export const MAX_SENDS_PER_HOUR = 5;

export function normalizeEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const e = v.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254 ? e : null;
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** O código só vale para este usuário e este e-mail. */
export function hashCode(uid: string, email: string, code: string): string {
  return createHash('sha256').update(`${uid}:${email}:${code}`).digest('hex');
}

export function codeMatches(expectedHash: string, uid: string, email: string, code: string): boolean {
  const a = Buffer.from(expectedHash, 'hex'), b = Buffer.from(hashCode(uid, email, code), 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface SendState { lastSentMs?: number; windowStartMs?: number; sendCount?: number }

/** Limita envios: 1 por minuto e no máximo 5 por hora. */
export function checkSendLimit(s: SendState, nowMs = Date.now()):
  { ok: true; next: Required<SendState> } | { ok: false; retryInSeconds: number } {
  if (s.lastSentMs && nowMs - s.lastSentMs < SEND_COOLDOWN_MS) {
    return { ok: false, retryInSeconds: Math.ceil((SEND_COOLDOWN_MS - (nowMs - s.lastSentMs)) / 1000) };
  }
  const inWindow = s.windowStartMs != null && nowMs - s.windowStartMs < 3_600_000;
  const count = inWindow ? (s.sendCount || 0) : 0;
  if (count >= MAX_SENDS_PER_HOUR) {
    return { ok: false, retryInSeconds: Math.ceil((3_600_000 - (nowMs - (s.windowStartMs as number))) / 1000) };
  }
  return { ok: true, next: { lastSentMs: nowMs, windowStartMs: inWindow ? (s.windowStartMs as number) : nowMs, sendCount: count + 1 } };
}
