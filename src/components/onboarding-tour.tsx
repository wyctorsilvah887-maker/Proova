'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TourStep = {
  /** Valor do atributo data-tour do elemento em destaque. Sem target = bolha centralizada. */
  target?: string;
  title: string;
  text: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const BUBBLE_W = 340;

export function OnboardingTour({
  steps,
  onFinish,
}: {
  steps: TourStep[];
  onFinish: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });

  // Ignora passos cujo alvo não existe na tela (ex.: card de missões já concluído).
  const [available, setAvailable] = useState<TourStep[]>(steps);

  useEffect(() => {
    setMounted(true);
    setAvailable(
      steps.filter((s) => !s.target || document.querySelector(`[data-tour="${s.target}"]`))
    );
  }, [steps]);

  const step = available[index];
  const isLast = index === available.length - 1;

  const measure = useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight });
    if (!step?.target) return setRect(null);
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Rola até o alvo e mede.
  useLayoutEffect(() => {
    if (!mounted || !step) return;
    if (step.target) {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    measure();
    const t = window.setTimeout(measure, 350); // após a rolagem suave
    return () => window.clearTimeout(t);
  }, [mounted, step, measure]);

  useEffect(() => {
    if (!mounted) return;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [mounted, measure]);

  const next = useCallback(() => (isLast ? onFinish() : setIndex((i) => i + 1)), [isLast, onFinish]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFinish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onFinish]);

  // Posição da bolha: abaixo do alvo se couber, senão acima; centralizada se não há alvo.
  const bubbleStyle = useMemo(() => {
    const w = Math.min(BUBBLE_W, vp.w - 24);
    if (!rect) {
      return { width: w, left: Math.max(12, (vp.w - w) / 2), top: Math.max(12, vp.h / 2 - 110) };
    }
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - w / 2), vp.w - w - 12);
    const below = rect.top + rect.height + PAD + 14;
    const fitsBelow = below + 210 < vp.h;
    const top = fitsBelow ? below : Math.max(12, rect.top - PAD - 14 - 200);
    return { width: w, left, top };
  }, [rect, vp]);

  if (!mounted || !step || available.length === 0) return null;

  const hole = rect
    ? {
        top: Math.max(0, rect.top - PAD),
        left: Math.max(0, rect.left - PAD),
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  const panel = 'fixed bg-black/55 backdrop-blur-[6px] transition-all duration-300';

  return createPortal(
    <div className="fixed inset-0 z-[400]" role="dialog" aria-modal="true" aria-label="Tour de boas-vindas">
      {/* Fundo desfocado em volta do alvo (o alvo fica nítido) */}
      {hole ? (
        <>
          <div className={panel} style={{ top: 0, left: 0, right: 0, height: hole.top }} />
          <div className={panel} style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div className={panel} style={{ top: hole.top, left: 0, width: hole.left, height: hole.height }} />
          <div className={panel} style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          <div
            className="fixed rounded-2xl ring-2 ring-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.25)] pointer-events-none transition-all duration-300"
            style={hole}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-[6px]" />
      )}

      {/* Bolha de informações */}
      <div
        key={index}
        className="fixed rounded-3xl border border-primary/20 bg-card p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        style={bubbleStyle}
      >
        <button
          type="button"
          onClick={onFinish}
          aria-label="Pular tour"
          className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-[9px] font-black uppercase tracking-widest text-primary">
          Passo {index + 1} de {available.length}
        </p>
        <h3 className="mt-1 pr-6 text-lg font-black font-headline tracking-tight">{step.title}</h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{step.text}</p>

        <div className="mt-4 flex items-center gap-1.5">
          {available.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-5 bg-primary' : 'w-1.5 bg-primary/25'
              )}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onFinish}
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            Pular
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={prev} className="rounded-xl gap-1">
                <ChevronLeft className="h-4 w-4" /> Voltar
              </Button>
            )}
            <Button type="button" size="sm" onClick={next} className="rounded-xl gap-1 font-black">
              {isLast ? 'Começar' : 'Próximo'} {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
