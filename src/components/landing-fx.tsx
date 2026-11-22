'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Respeita quem pediu menos movimento no sistema. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Marca como "visto" quando o elemento entra na tela (uma vez). */
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    const t = setTimeout(() => setSeen(true), 2500); // rede de segurança: nunca deixa conteúdo escondido
    return () => { io.disconnect(); clearTimeout(t); };
  }, [threshold]);
  return { ref, seen };
}

/** Entrada suave ao rolar (sobe + aparece). `delay` em ms cria o efeito em cascata. */
export function Reveal({ children, delay = 0, className, as: Tag = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'article' | 'section' }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const show = seen || reduced;
  const Comp = Tag as any;
  return (
    <Comp
      ref={ref}
      className={cn('transition-[opacity,transform] duration-700 ease-out will-change-transform', show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8', className)}
      style={{ transitionDelay: show ? `${delay}ms` : '0ms' } as CSSProperties}
    >
      {children}
    </Comp>
  );
}

/** Card que inclina em 3D com o mouse e tem um brilho que segue o cursor (só em telas com mouse). */
export function TiltCard({ children, className, max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || reduced || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateY(-4px)`;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ''; };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ transformStyle: 'preserve-3d' }}
      className={cn('group/tilt relative transition-transform duration-200 ease-out will-change-transform', className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover/tilt:opacity-100 transition-opacity duration-300"
        style={{ background: 'radial-gradient(260px circle at var(--mx,50%) var(--my,50%), hsl(var(--primary) / 0.14), transparent 60%)' }}
      />
      {children}
    </div>
  );
}

/** Número que sobe até o valor quando aparece na tela. */
export function CountUp({ to, prefix = '', suffix = '', duration = 1400, decimals = 0 }: { to: number; prefix?: string; suffix?: string; duration?: number; decimals?: number }) {
  const { ref, seen } = useInView<HTMLSpanElement>(0.4);
  const reduced = usePrefersReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (reduced) { setV(to); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, reduced, to, duration]);
  return <span ref={ref} className="tabular-nums">{prefix}{v.toFixed(decimals).replace('.', ',')}{suffix}</span>;
}

/** Barra fina no topo que mostra quanto da página já foi lida. */
export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setP(h > 0 ? Math.min(1, window.scrollY / h) : 0);
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div aria-hidden className="fixed top-0 left-0 right-0 h-[3px] z-[110] pointer-events-none">
      <div className="h-full origin-left bg-gradient-to-r from-primary via-orange-300 to-primary" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

/** Fundo do topo: luzes laranja flutuando (o pontilhado vem do fundo da página). */
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[720px] max-w-[140vw] rounded-full bg-primary/20 blur-[110px] animate-orb" />
      <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-orange-400/15 blur-[90px] animate-orb-slow" />
      <div className="absolute top-20 -right-24 h-72 w-72 rounded-full bg-amber-300/15 blur-[90px] animate-orb-slow [animation-delay:-6s]" />
    </div>
  );
}
