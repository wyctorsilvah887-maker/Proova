'use client';

import { Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LinkShareBoxProps {
  url: string;
  label: string;
  shareMessage: string;
  onCopy: (text: string, description: string) => void;
  /** Chamado quando o usuário toca em "WhatsApp" (conta como link enviado). */
  onShare?: () => void;
}

/** Caixa com o link visível (sem estourar o card), copiar, abrir e enviar por WhatsApp. */
export function LinkShareBox({ url, label, shareMessage, onCopy, onShare }: LinkShareBoxProps) {
  const waHref = `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${url}`)}`;
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border border-primary/15 bg-muted/30 p-1.5 pl-4 min-w-0">
        <p className="flex-1 min-w-0 truncate font-mono text-xs font-bold text-foreground/80" title={url}>{url}</p>
        <Button size="sm" onClick={() => onCopy(url, label)} className="h-10 shrink-0 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2">
          <Copy className="w-4 h-4" /> Copiar
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" className="h-12 rounded-xl border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest gap-2">
          <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={onShare}><MessageCircle className="w-4 h-4" /> WhatsApp</a>
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-xl border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /> Abrir</a>
        </Button>
      </div>
    </div>
  );
}
