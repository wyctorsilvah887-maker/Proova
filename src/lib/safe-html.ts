/**
 * Sanitizador de HTML por lista de permissão (sem dependências), para textos formatados
 * escritos pelo dono (títulos da página pública). Mantém só formatação simples: negrito, itálico,
 * sublinhado, quebra de linha e <span>/<mark> com cor. Todo o resto (script, iframe, eventos on*,
 * links, imagens, estilos com url()) é removido; o texto é sempre escapado.
 */
const ALLOWED_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 's', 'br', 'p', 'div', 'span', 'mark', 'font']);
const ALLOWED_STYLE_PROPS = new Set(['color', 'background-color', 'font-weight', 'font-style', 'text-decoration']);
const SAFE_STYLE_VALUE = /^[#a-zA-Z0-9(),.%\s-]+$/;
const ENTITY = /&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi;

function escapeText(t: string) {
  // Preserva entidades já existentes (&amp; &nbsp; ...) e escapa o resto.
  const parts: string[] = [];
  let last = 0;
  for (const m of t.matchAll(ENTITY)) {
    parts.push(t.slice(last, m.index).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    parts.push(m[0]);
    last = (m.index ?? 0) + m[0].length;
  }
  parts.push(t.slice(last).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  return parts.join('');
}

function cleanStyle(style: string): string {
  const out: string[] = [];
  for (const decl of style.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim().toLowerCase();
    const val = decl.slice(i + 1).trim();
    if (!ALLOWED_STYLE_PROPS.has(prop) || !val || !SAFE_STYLE_VALUE.test(val) || /url|expression|javascript/i.test(val)) continue;
    out.push(`${prop}: ${val}`);
  }
  return out.join('; ');
}

export function sanitizeHtml(input: unknown): string {
  if (typeof input !== 'string' || !input) return '';
  const src = input.slice(0, 5000);
  let out = '';
  let pos = 0;
  const tagRe = /<\/?[a-zA-Z][^<>]*>/g;
  for (const m of src.matchAll(tagRe)) {
    out += escapeText(src.slice(pos, m.index));
    pos = (m.index ?? 0) + m[0].length;
    const tag = m[0];
    const closing = tag.startsWith('</');
    const name = (tag.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/)?.[1] || '').toLowerCase();
    if (!ALLOWED_TAGS.has(name)) continue;
    if (closing) { if (name !== 'br') out += `</${name}>`; continue; }
    if (name === 'br') { out += '<br>'; continue; }
    let attrs = '';
    const styleMatch = tag.match(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i);
    if (styleMatch) {
      const css = cleanStyle(styleMatch[2] ?? styleMatch[3] ?? '');
      if (css) attrs += ` style="${css.replace(/"/g, '')}"`;
    }
    if (name === 'font') {
      const color = tag.match(/\scolor\s*=\s*["']?(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)["']?/i)?.[1];
      if (color) attrs += ` color="${color}"`;
    }
    out += `<${name}${attrs}>`;
  }
  out += escapeText(src.slice(pos));
  return out;
}

/** Aceita só http(s), mailto e tel (domínio sem protocolo vira https://). Qualquer outra coisa vira "#". */
export function safeUrl(u: unknown): string {
  if (typeof u !== 'string') return '#';
  const v = u.trim();
  if (!v || v === '#') return '#';
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return '#'; // javascript:, data:, vbscript: ...
  return `https://${v.replace(/^\/+/, '')}`;
}
