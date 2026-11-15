/**
 * Limite de tentativas no navegador (login e cadastro).
 * É uma trava de uso, não uma barreira de segurança: quem chama o Firebase direto não passa por aqui.
 * A proteção de verdade contra força bruta é o bloqueio do próprio Firebase Authentication
 * (erro auth/too-many-requests), que esta trava complementa.
 */
export interface LimiterConfig { key: string; max: number; windowMs: number }

/** Mantém só as tentativas ainda dentro da janela. */
export function recent(timestamps: number[], now: number, windowMs: number): number[] {
  return timestamps.filter((t) => Number.isFinite(t) && now - t < windowMs && t <= now);
}

/** Diz se pode tentar agora; se não, em quanto tempo libera. */
export function checkLimit(timestamps: number[], now: number, cfg: Pick<LimiterConfig, 'max' | 'windowMs'>):
  { allowed: true } | { allowed: false; retryInMs: number } {
  const live = recent(timestamps, now, cfg.windowMs).sort((a, b) => a - b);
  if (live.length < cfg.max) return { allowed: true };
  // libera quando a tentativa mais antiga que ainda conta sair da janela
  const unblockAt = live[live.length - cfg.max] + cfg.windowMs;
  return { allowed: false, retryInMs: Math.max(0, unblockAt - now) };
}

export function formatWait(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return s < 60 ? `${s} segundos` : `${Math.ceil(s / 60)} minuto${Math.ceil(s / 60) > 1 ? 's' : ''}`;
}

// ---- armazenamento (navegador; nunca lança) ----
export function loadAttempts(key: string): number[] {
  try {
    const raw = window.localStorage.getItem(`rl:${key}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch { return []; }
}

export function saveAttempts(key: string, timestamps: number[]) {
  try { window.localStorage.setItem(`rl:${key}`, JSON.stringify(timestamps.slice(-20))); } catch {}
}

/** Registra uma tentativa agora. */
export function recordAttempt(cfg: LimiterConfig, now = Date.now()) {
  saveAttempts(cfg.key, [...recent(loadAttempts(cfg.key), now, cfg.windowMs), now]);
}

export function clearAttempts(key: string) {
  try { window.localStorage.removeItem(`rl:${key}`); } catch {}
}

/** Pode tentar agora? */
export function canAttempt(cfg: LimiterConfig, now = Date.now()) {
  return checkLimit(loadAttempts(cfg.key), now, cfg);
}

export const LOGIN_LIMIT: LimiterConfig = { key: 'login-fail', max: 5, windowMs: 15 * 60 * 1000 };
export const SIGNUP_LIMIT: LimiterConfig = { key: 'signup', max: 5, windowMs: 15 * 60 * 1000 };
