'use client';

import { useEffect, useState } from 'react';
import { Bell, Bot, Check, ExternalLink, Inbox, MessageCircle, ShieldCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountUp, Reveal, TiltCard } from '@/components/landing-fx';

/** Estrelas preenchidas (só visual). */
const Stars = ({ n, className }: { n: number; className?: string }) => (
  <span className={cn('inline-flex gap-0.5', className)} aria-label={`${n} estrelas`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={cn('w-3.5 h-3.5', i <= n ? 'fill-primary text-primary' : 'text-muted-foreground/30')} />
    ))}
  </span>
);

/** Avisos que se alternam no topo da landing, mostrando o que o Proova faz no dia a dia. */
export function HeroNotifications() {
  const items = [
    { icon: Star, tag: 'Nova avaliação', text: 'Mariana deixou 5 estrelas: "Atendimento incrível!"', tone: 'text-primary bg-primary/10' },
    { icon: ShieldCheck, tag: 'Crítica protegida', text: 'Feedback de 2 estrelas chegou só para você, com alerta no celular.', tone: 'text-amber-600 bg-amber-500/10' },
    { icon: Bot, tag: 'IA pronta', text: 'Resposta do Google sugerida. Revise e publique em segundos.', tone: 'text-primary bg-primary/10' },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 3200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const it = items[i];
  return (
    <div className="mx-auto mt-8 h-[76px] w-full max-w-md" aria-live="polite">
      <div key={i} className="animate-pop flex items-center gap-3 rounded-2xl border bg-card/90 backdrop-blur px-4 py-3 text-left shadow-xl shadow-primary/5">
        <div className={cn('shrink-0 p-2.5 rounded-xl', it.tone)}><it.icon className="w-5 h-5" /></div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{it.tag}</p>
          <p className="text-xs font-semibold leading-snug text-foreground/90">{it.text}</p>
        </div>
      </div>
    </div>
  );
}

/** Números que a gente pode afirmar (do próprio produto), com contagem animada. */
export function FactsStrip() {
  const facts = [
    { node: <CountUp to={0} prefix="R$ " />, label: 'para começar, sem cartão' },
    { node: <><CountUp to={1} /> min</>, label: 'para o cliente avaliar' },
    { node: <><CountUp to={7} /> dias</>, label: 'de garantia nos planos pagos' },
    { node: <CountUp to={100} suffix="%" />, label: 'das notas do seu link entram na média, até as críticas' },
  ];
  return (
    <section aria-label="Resumo" className="w-full pb-14 md:pb-20">
      <div className="container px-4 mx-auto max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border bg-border shadow-sm">
          {facts.map((f, idx) => (
            <Reveal key={f.label} delay={idx * 90} className="bg-card p-5 md:p-6 text-center">
              <div className="text-2xl md:text-4xl font-black font-headline tracking-tight text-primary">{f.node}</div>
              <p className="mt-1 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">{f.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Simulador: o visitante escolhe as estrelas e vê para onde a avaliação vai, como no app. */
export function RatingSimulator() {
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(5);
  const shown = hover || rating;
  const critical = shown <= 3;

  return (
    <section id="simulador" className="w-full py-20 md:py-24 bg-muted/30 border-y">
      <div className="container px-4 mx-auto max-w-5xl">
        <Reveal className="text-center space-y-3 mb-10 md:mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Teste na prática</p>
          <h2 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight">
            Toque nas estrelas e veja <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">para onde a avaliação vai.</span>
          </h2>
          <p className="max-w-xl mx-auto text-sm md:text-base text-muted-foreground font-medium">É assim que o seu cliente avalia e é assim que o Proova decide o destino de cada nota.</p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          {/* O que o cliente vê */}
          <Reveal>
            <TiltCard className="h-full rounded-3xl border bg-card p-6 md:p-8 shadow-xl">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-4">O que o seu cliente vê</p>
              <h3 className="text-lg md:text-xl font-bold font-headline leading-tight">Como foi o seu atendimento?</h3>
              <div className="mt-5 flex items-center justify-center gap-1.5 md:gap-2" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                    onMouseEnter={() => setHover(n)}
                    onClick={() => setRating(n)}
                    className="p-1 transition-transform duration-150 hover:scale-125 active:scale-90 outline-none focus-visible:ring-2 ring-primary rounded-lg"
                  >
                    <Star className={cn('w-9 h-9 md:w-11 md:h-11 transition-all duration-200', n <= shown ? 'fill-primary text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.45)]' : 'text-muted-foreground/30')} />
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground font-medium min-h-[84px]">
                {critical ? 'Sinto muito pela experiência. Conte o que aconteceu para a equipe resolver.' : 'Que bom! Conte em poucas palavras o que você mais gostou.'}
              </div>
              <div className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground font-medium">
                <Check className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" /> O cliente autoriza a publicação antes de enviar. Sem app e sem cadastro.
              </div>
            </TiltCard>
          </Reveal>

          {/* O que o dono recebe */}
          <Reveal delay={120}>
            <TiltCard className="h-full rounded-3xl border bg-card p-6 md:p-8 shadow-xl">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-4">O que acontece no Proova</p>
              <div key={critical ? 'c' : 'p'} className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-4">
                {critical ? (
                  <>
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600"><Bell className="w-5 h-5 animate-pop" /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">Alerta no seu celular</p>
                        <p className="text-sm font-bold leading-snug">Nova crítica de {shown} estrela{shown > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-1">
                      <Inbox className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm font-medium leading-relaxed"><b>Chega só para você</b>, no Inbox privado. Não aparece na sua página pública.</p>
                    </div>
                    <div className="flex items-start gap-3 p-1">
                      <MessageCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm font-medium leading-relaxed">Responda em 1 toque pelo WhatsApp, com mensagem pronta. Resolva antes de virar problema.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border bg-background p-4 shadow-sm">
                      <Stars n={shown} />
                      <p className="mt-2 text-sm font-semibold leading-snug">"Atendimento excelente, voltarei com certeza!"</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliente · depoimento autorizado</p>
                    </div>
                    <div className="flex items-start gap-3 p-1">
                      <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm font-medium leading-relaxed"><b>Vira prova social</b>: sua página pública e cards prontos para o Instagram.</p>
                    </div>
                    <div className="flex items-start gap-3 p-1">
                      <ExternalLink className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm font-medium leading-relaxed">O cliente é convidado a deixar a avaliação também no Google.</p>
                    </div>
                  </>
                )}
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
