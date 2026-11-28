/**
 * Cache do último acesso neste navegador, só para personalizar a tela de login (computador).
 * Guarda poucos dados comuns (nome, empresa, e-mail, plano, contagem de avaliações, data). Nunca senha nem token.
 * "Não é você?" apaga tudo. Falha em silêncio se o navegador bloquear o armazenamento.
 */
const KEY = 'proova_last_session_v1';
const SESSION_FLAG = 'proova_session_started';

export type LastSession = {
  name: string;          // primeiro nome
  company: string;
  email: string;
  plan: string;          // rótulo: Premium, PRO, Teste, Sem plano
  testimonials: number;
  lastLoginAt: number;   // ms
};

export function readLastSession(): LastSession | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw.email !== 'string' || !raw.email) return null;
    return raw as LastSession;
  } catch { return null; }
}

export function clearLastSession() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Atualiza o cache com o perfil atual. A data do login muda só no 1º registro de cada sessão do navegador. */
export function saveLastSession(u: any) {
  try {
    if (!u?.email) return;
    const prev = readLastSession();
    let newSession = false;
    try { newSession = !sessionStorage.getItem(SESSION_FLAG); if (newSession) sessionStorage.setItem(SESSION_FLAG, '1'); } catch { /* ignore */ }
    const st = u.membershipStatus || 'base';
    const plan = u.isAdmin === true ? 'Admin' : st === 'gold' ? 'Premium' : st === 'enterprise' ? 'PRO' : st === 'trial' ? 'Teste' : 'Sem plano';
    const entry: LastSession = {
      name: String(u.name || '').trim().split(/\s+/)[0] || '',
      company: String(u.companyName || '').trim(),
      email: String(u.email).toLowerCase(),
      plan,
      testimonials: Number(u.testimonialsCount) || 0,
      lastLoginAt: newSession || !prev ? Date.now() : prev.lastLoginAt,
    };
    localStorage.setItem(KEY, JSON.stringify(entry));
  } catch { /* ignore */ }
}

/** "w••••@gmail.com" */
export function maskEmail(email: string): string {
  const [u, d] = email.split('@');
  if (!d) return email;
  return `${u.slice(0, 1)}${'•'.repeat(Math.max(2, Math.min(5, u.length - 1)))}@${d}`;
}

/** "hoje", "ontem", "há 3 dias", "há 2 semanas"... */
export function timeAgoPt(ms: number, now = Date.now()): string {
  const days = Math.floor((now - ms) / 86400000);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  if (days < 30) { const w = Math.floor(days / 7); return `há ${w} ${w === 1 ? 'semana' : 'semanas'}`; }
  const m = Math.floor(days / 30);
  return `há ${m} ${m === 1 ? 'mês' : 'meses'}`;
}
