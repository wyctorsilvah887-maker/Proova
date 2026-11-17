'use client';

import { Copy, Headphones, Rocket, Shield, Globe, Smartphone, Gem, Check, Clock, XCircle, MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { PPPlan } from '@/lib/pp-plans';

export const SUPPORT_TOPICS = [
  { key: '1', label: 'G-Boost', hint: 'Mais avaliações no Google', icon: Rocket },
  { key: '2', label: 'Inbox Privado', hint: 'Críticas e contato do cliente', icon: Shield },
  { key: '3', label: 'Link in Bio', hint: 'Sua página pública', icon: Globe },
  { key: '4', label: 'Social Cards', hint: 'Artes para Instagram', icon: Smartphone },
  { key: '5', label: 'Planos', hint: 'O que cada plano libera', icon: Gem },
] as const;

const PRIORITY: Record<PPPlan, { title: string; detail: string }> = {
  pro: { title: 'Fila prioritária', detail: 'Seu atendimento passa na frente.' },
  premium: { title: 'Fila de espera', detail: 'Atendido por ordem de chegada.' },
  free: { title: 'Atendimento padrão', detail: 'Resposta em até 2 horas, em horário comercial.' },
};

interface Props {
  plan: PPPlan;
  planLabel: string;
  ticket: any | null;
  isHumanPresent: boolean;
  busy?: boolean;
  onTopic: (key: string) => void;
  onEnd: () => void;
}

function fmtDate(ts: any) {
  const d: Date | null = ts?.toDate ? ts.toDate() : null;
  return d ? d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
}

function Step({ done, active, label }: { done: boolean; active?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('h-6 w-6 rounded-full flex items-center justify-center border-2 shrink-0',
        done ? 'bg-primary border-primary text-primary-foreground' : active ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground/40')}>
        {done ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3 h-3" />}
      </div>
      <span className={cn('text-xs font-bold', done || active ? 'text-foreground' : 'text-muted-foreground/60')}>{label}</span>
    </div>
  );
}

/** Painel lateral do suporte (desktop) / gaveta (celular): plano, ticket, tópicos e encerrar. */
export function SupportInfoPanel({ plan, planLabel, ticket, isHumanPresent, busy, onTopic, onEnd }: Props) {
  const p = PRIORITY[plan];
  const copy = async () => {
    try { await navigator.clipboard.writeText(ticket.id); toast({ title: 'Protocolo copiado' }); }
    catch { toast({ variant: 'destructive', title: 'Não foi possível copiar' }); }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seu atendimento</p>
          <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">{planLabel}</Badge>
        </div>
        <div>
          <p className="text-sm font-black">{p.title}</p>
          <p className="text-xs font-medium text-muted-foreground leading-relaxed">{p.detail}</p>
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-5 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ticket</p>
        {ticket ? (
          <>
            <div className="rounded-2xl bg-muted/40 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Protocolo</p>
                <p className="font-mono text-xs font-bold truncate">{ticket.id}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copy} aria-label="Copiar protocolo"><Copy className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-3">
              <Step done label="Ticket aberto" />
              <Step done={isHumanPresent} active={!isHumanPresent} label={isHumanPresent ? 'Atendente no chat' : 'Aguardando atendente'} />
            </div>
            {fmtDate(ticket.createdAt) && <p className="text-[10px] font-medium text-muted-foreground">Aberto em {fmtDate(ticket.createdAt)}</p>}
          </>
        ) : (
          <>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">Nenhum ticket aberto. Se o assistente não resolver, fale com um atendente.</p>
            <Button className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2" disabled={busy} onClick={() => onTopic('6')}>
              <Headphones className="w-4 h-4" /> Falar com atendente
            </Button>
          </>
        )}
      </section>

      <section className="rounded-3xl border bg-card p-3 space-y-1">
        <p className="px-2 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <MessageCircleQuestion className="w-3.5 h-3.5" /> Dúvidas comuns
        </p>
        {SUPPORT_TOPICS.map(({ key, label, hint, icon: Icon }) => (
          <button key={key} onClick={() => onTopic(key)} disabled={busy}
            className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-muted/50 transition-colors disabled:opacity-50">
            <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span>
            <span className="min-w-0">
              <span className="block text-xs font-black">{label}</span>
              <span className="block text-[10px] font-medium text-muted-foreground truncate">{hint}</span>
            </span>
          </button>
        ))}
      </section>

      <button onClick={onEnd}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-destructive/20 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-destructive/70 hover:bg-destructive/5 hover:text-destructive transition-colors">
        <XCircle className="w-3.5 h-3.5" /> Encerrar atendimento
      </button>
      <p className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pt-1">Powered by Proova AI</p>
    </div>
  );
}
