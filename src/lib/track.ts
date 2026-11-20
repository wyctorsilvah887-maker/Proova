import { getAttribution } from '@/lib/attribution';

const KEY = 'proova_ev_v1';
const OFF = 'proova_notrack';

/** Marca este navegador para não contar visitas (usado pelo admin). */
export function disableTracking() { try { localStorage.setItem(OFF, '1'); } catch { /* ignore */ } }

/** Envia um evento do funil. Conta 1 "único" por evento por dia neste navegador. Nunca quebra a tela. */
export function trackEvent(event: string, cta?: string) {
  try {
    if (typeof window === 'undefined' || localStorage.getItem(OFF)) return;
    const today = new Date().toISOString().slice(0, 10);
    let state: { d: string; e: string[] } = { d: today, e: [] };
    try { const raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw?.d === today) state = raw; } catch { /* ignore */ }
    const u = !state.e.includes(event);
    if (u) { state.e.push(event); localStorage.setItem(KEY, JSON.stringify(state)); }
    const payload = JSON.stringify({ e: event, u, s: getAttribution()?.source || 'direto', ...(cta ? { c: cta } : {}) });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    else fetch('/api/track', { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
  } catch { /* analytics nunca derruba o app */ }
}
