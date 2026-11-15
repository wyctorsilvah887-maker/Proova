/**
 * Validação de empresa/link do Google informado pelo usuário.
 * O link é aberto pelos clientes finais, então só aceitamos endereços do Google (nada de domínios arbitrários).
 */

const PLACE_ID_RE = /^[A-Za-z0-9_-]{10,200}$/;

export function isValidPlaceId(id: unknown): id is string {
  return typeof id === 'string' && PLACE_ID_RE.test(id);
}

export function reviewLinkFor(placeId: string) {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

function isAllowedHost(host: string, pathname: string) {
  const h = host.toLowerCase();
  if (h === 'g.page' || h === 'share.google' || h === 'maps.app.goo.gl') return true;
  if (h === 'goo.gl') return pathname.startsWith('/maps');
  return /(^|\.)google\.(com|com\.br)$/.test(h);
}

export type ParsedGoogleLink = { url: string; placeId: string | null };

/** Retorna o link normalizado (e o place id, quando houver) ou null se não for um link do Google válido. */
export function parseGoogleLink(input: string): ParsedGoogleLink | null {
  let raw = (input || '').trim();
  if (!raw || raw.length > 600) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = `https://${raw}`;

  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (u.username || u.password) return null;
  if (!isAllowedHost(u.hostname, u.pathname)) return null;

  const pid = u.searchParams.get('placeid') || u.searchParams.get('place_id');
  if (pid && isValidPlaceId(pid)) return { url: reviewLinkFor(pid), placeId: pid };

  u.protocol = 'https:';
  u.hash = '';
  return { url: u.toString(), placeId: null };
}
