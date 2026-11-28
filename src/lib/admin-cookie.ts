/** Cookie assinado que prova "este navegador é de um administrador" para o middleware (Edge) e para a API (Node). */
export const ADMIN_COOKIE = 'proova_adm';
export const ADMIN_COOKIE_MAX_AGE = 12 * 3600; // segundos

export function adminCookieSecret(): string {
  return process.env.ADMIN_COOKIE_SECRET || process.env.CRON_SECRET || '';
}

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signAdminCookie(uid: string, secret: string, now = Date.now()): Promise<string> {
  const exp = Math.floor(now / 1000) + ADMIN_COOKIE_MAX_AGE;
  return `${uid}.${exp}.${await hmacHex(secret, `${uid}.${exp}`)}`;
}

export async function verifyAdminCookie(value: string | undefined, secret: string, now = Date.now()): Promise<boolean> {
  if (!value || !secret) return false;
  const [uid, exp, sig] = value.split('.');
  if (!uid || !exp || !sig || Number(exp) * 1000 < now) return false;
  const expected = await hmacHex(secret, `${uid}.${exp}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
