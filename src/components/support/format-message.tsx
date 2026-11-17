import type { ReactNode } from 'react';

/**
 * Formata o texto das mensagens do suporte sem usar HTML cru:
 * **negrito**, linha inteira em *itálico* e links http(s)/www viram elementos React.
 */
const TOKEN = /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|www\.[^\s)]+)/g;

function inline(text: string): ReactNode[] {
  return text.split(TOKEN).filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i} className="font-black text-primary">{part.slice(2, -2)}</strong>;
    }
    if (/^(https?:\/\/|www\.)/.test(part)) {
      const clean = part.replace(/[.,;:!?]+$/, '');
      const trailing = part.slice(clean.length);
      const href = clean.startsWith('www.') ? `https://${clean}` : clean;
      return (
        <span key={i}>
          <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2 break-all">{clean}</a>
          {trailing}
        </span>
      );
    }
    return part;
  });
}

export function formatMessage(text: string): ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const m = /^\*(?!\*)(.+)\*$/.exec(line.trim());
    return (
      <span key={i} className={m ? 'italic opacity-70 text-[0.92em]' : undefined}>
        {inline(m ? m[1] : line)}
        {i < lines.length - 1 ? '\n' : null}
      </span>
    );
  });
}
