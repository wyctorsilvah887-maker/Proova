/**
 * Origem do visitante (primeiro toque). Guarda utm_source/medium/campaign no navegador e é gravada
 * em users/{uid}.attribution no cadastro. Só roda nas páginas de marketing (não nas páginas públicas
 * dos clientes, para não marcar pacientes como origem de cadastro).
 */
const KEY = 'proova_attr_v1';
const MARKETING_PATHS = ['/', '/pricing', '/signup', '/login'];

export type Attribution = {
  source: string;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  landing: string;
  firstSeenAt: string;
};

const clean = (v: string | null | undefined) => {
  const s = String(v || '').trim().toLowerCase().replace(/[^a-z0-9_.\-]/g, '-').replace(/-+/g, '-').slice(0, 40);
  return s || null;
};

const SOURCE_BY_HOST: Array<[RegExp, string]> = [
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)(facebook\.com|fb\.com)$/, 'facebook'],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, 'whatsapp'],
  [/(^|\.)linkedin\.com$/, 'linkedin'],
  [/(^|\.)(google\.[a-z.]+|bing\.com)$/, 'busca'],
];

function sourceFromReferrer(): string {
  try {
    if (!document.referrer) return 'direto';
    const host = new URL(document.referrer).hostname;
    if (host === window.location.hostname) return 'direto';
    for (const [re, name] of SOURCE_BY_HOST) if (re.test(host)) return name;
    return `site:${clean(host.replace(/^www\./, ''))}`;
  } catch { return 'direto'; }
}

export function captureAttribution() {
  try {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const hasUtm = !!params.get('utm_source');
    if (!hasUtm && !MARKETING_PATHS.includes(window.location.pathname)) return;
    if (localStorage.getItem(KEY)) return; // primeiro toque vale
    const attr: Attribution = {
      source: clean(params.get('utm_source')) || sourceFromReferrer(),
      medium: clean(params.get('utm_medium')),
      campaign: clean(params.get('utm_campaign')),
      content: clean(params.get('utm_content')),
      landing: window.location.pathname.slice(0, 60),
      firstSeenAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(attr));
  } catch { /* storage bloqueado: segue sem origem */ }
}

/** Origem guardada neste navegador, pronta para gravar no cadastro (ou null). */
export function getAttribution(): Attribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch { return null; }
}
