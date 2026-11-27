'use client';

import { GoogleButton } from "@/components/google-button";
import { useEffect, useState, useRef, forwardRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { 
  Star, 
  Zap, 
  Loader2, 
  ArrowRight, 
  MapPin, 
  Scale, 
  Lock,
  Globe,
  TrendingUp,
  ShieldCheck,
  MousePointerClick,
  Users,
  MessageCircle,
  Menu,
  X,
  MessageSquareQuote,
  Check,
  Target,
  Building2,
  Rocket,
  Shield,
  ChevronDown,
  Gem,
  Sparkles,
  Stethoscope,
  HeartPulse,
  AlertTriangle,
  Bot,
  BrainCircuit,
  Layout,
  LayoutGrid,
  Play,
  Pause
} from "lucide-react";
import { 
  Sheet as SheetUI, 
  SheetContent as SheetContentUI, 
  SheetTrigger as SheetTriggerUI, 
  SheetClose as SheetCloseUI, 
  SheetHeader as SheetHeaderUI, 
  SheetTitle as SheetTitleUI, 
  SheetDescription as SheetDescriptionUI 
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/firebase";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/loading-screen";
import { Aurora, Reveal, ScrollProgress, TiltCard } from "@/components/landing-fx";
import { FactsStrip, HeroNotifications, RatingSimulator } from "@/components/landing-demo";

// --- SUB-COMPONENTS ---

const Navigation = ({ isScrolled, isMenuOpen, setIsMenuOpen, scrollToSection }: any) => {
  return (
    <header className={cn(
      "px-4 lg:px-8 h-20 flex items-center justify-between fixed top-0 w-full z-[100] transition-all duration-300",
      (isScrolled || isMenuOpen)
        ? "bg-background/95 backdrop-blur-md border-b shadow-sm" 
        : "bg-transparent border-b-transparent"
    )}>
      <nav className="flex items-center w-full justify-between max-w-7xl mx-auto">
        <div className="flex items-center">
          <Link href="/" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[66px] md:w-[320px] md:h-[106px] transition-transform group-hover:scale-105">
              <Image 
                src="/logo-proovaai-whitemode.png" 
                alt="Logo Proova Light" 
                fill 
                className="dark:hidden object-contain object-left" 
                priority 
              />
              <Image 
                src="/logo-proovaai-darkmode.png" 
                alt="Logo Proova Dark" 
                fill 
                className="hidden dark:block object-contain object-left" 
                priority 
              />
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-transparent" />
          
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/login" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Acesso Membro</Link>
            <GoogleButton cta="nav" label="Entrar com Google" className="font-black uppercase tracking-widest shadow-lg px-4 h-9 text-[9px] rounded-xl gap-2 bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-100" />
          </div>

          <div className="sm:hidden">
            <SheetUI open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTriggerUI asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 transition-all">
                  {isMenuOpen ? (
                    <X className="w-5 h-5 text-primary rotate-12 transition-transform duration-300" />
                  ) : (
                    <Menu className="w-5 h-5 text-primary transition-transform duration-300" />
                  )}
                </Button>
              </SheetTriggerUI>
              <SheetContentUI 
                side="right" 
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="fixed inset-0 top-20 h-[calc(100vh-5rem)] w-screen p-0 border-none bg-background z-[90] translate-x-0 translate-y-0 left-0 [&>button]:hidden"
              >
                <SheetHeaderUI className="sr-only">
                  <SheetTitleUI>Menu de Navegação</SheetTitleUI>
                  <SheetDescriptionUI>Acesse as seções principais da plataforma Proova.</SheetDescriptionUI>
                </SheetHeaderUI>
                <div className="flex flex-col h-full bg-background">
                  <div className="p-4 flex items-center justify-between shrink-0">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/60">Gestão de Reputação</span>
                  </div>
                  <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {[
                      { id: 'como-funciona', label: 'Como funciona', icon: Play },
                      { id: 'simulador', label: 'Teste na prática', icon: MousePointerClick },
                      { id: 'valor-reputacao', label: 'Reputação Local', icon: TrendingUp },
                      { id: 'metodologia', label: 'Gestão via IA', icon: Bot },
                      { id: 'planos', label: 'Planos SaaS', icon: Gem },
                    ].map((item) => (
                      <SheetCloseUI asChild key={item.id}>
                        <button 
                          onClick={() => scrollToSection(item.id)}
                          className="w-full flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors py-3.5 text-left"
                        >
                          <div className="p-2 rounded-lg bg-primary/5 text-primary">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className="flex items-center gap-1">
                            <span className="text-primary font-black opacity-40">#</span>
                            {item.label}
                          </span>
                        </button>
                      </SheetCloseUI>
                    ))}
                    
                    <div className="pt-8 space-y-6">
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/10">
                        {[
                          { href: '/pricing', label: 'Planos' },
                          { href: '/login', label: 'Login' },
                          { href: '/terms', label: 'Termos de Uso' },
                          { href: '/privacy', label: 'Política de Privacidade' },
                        ].map((link) => (
                          <Link 
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors py-2 px-1"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <Link href="/login" className="block" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="outline" className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[8px]">Acessar Dashboard</Button>
                        </Link>
                        <GoogleButton cta="menu-mobile" label="Continuar com Google" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-2xl gap-3 bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-100" />
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContentUI>
            </SheetUI>
          </div>
        </div>
      </nav>
    </header>
  );
};

const HeroSection = ({ isVisible, scrollToSection }: { isVisible: boolean; scrollToSection: (id: string) => void }) => {
  return (
    <section className="relative w-full pb-10 md:pb-16 flex items-center justify-center overflow-hidden pt-8 md:pt-16">
      <Aurora />
      <div className="container relative z-10 px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <header>
            <div className={cn(
              "inline-flex items-center text-primary px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-1000 bg-primary/5 rounded-full border border-primary/10 mb-6",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            )}>
              Reputação online para clínicas e profissionais da saúde
            </div>

            <h1 className={cn(
              "text-3xl font-extrabold tracking-tight sm:text-4xl md:text-6xl font-headline leading-[1.1] transition-all duration-1000",
              isVisible ? "animate-in fade-in slide-in-from-left-20 opacity-100" : "opacity-0"
            )}>
              Mais avaliações{" "}
              <span className="inline-block relative bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">
                5 estrelas.
              </span>
              <br className="hidden sm:block" /> Críticas resolvidas antes de virarem problema.
            </h1>
          </header>

          <p className={cn(
            "max-w-2xl mx-auto text-muted-foreground text-sm md:text-xl font-medium leading-relaxed transition-all duration-1000 delay-300",
            isVisible ? "animate-in fade-in slide-in-from-right-20 opacity-100" : "opacity-0"
          )}>
            Envie um link para o cliente avaliar em 1 minuto. Elogios viram prova social, críticas chegam só para você com alerta no celular e a IA deixa a resposta do Google pronta.
          </p>

          <div className={cn(
            "flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 transition-all duration-1000 delay-500",
            isVisible ? "animate-in fade-in slide-in-from-bottom-5 opacity-100" : "opacity-0"
          )}>
            <GoogleButton cta="hero" label="Continuar com Google" className="relative overflow-hidden w-full sm:w-auto h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest gap-3 shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/50 active:scale-95 bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-100" />
            <Button type="button" variant="outline" onClick={() => scrollToSection('como-funciona')} className="w-full sm:w-auto h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest gap-2">
              <Play className="w-4 h-4 fill-current" /> Ver como funciona
            </Button>
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-[11px] md:text-xs font-bold text-muted-foreground">
            {["Cadastro em 1 toque", "Garantia de 7 dias", "Pronto em 1 minuto"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" />{t}</li>
            ))}
          </ul>

          <p className="text-[10px] md:text-xs text-muted-foreground font-medium">
            Ao continuar, você aceita os <Link href="/terms" className="underline hover:text-primary">Termos de Uso</Link> e a <Link href="/privacy" className="underline hover:text-primary">Política de Privacidade</Link>. Prefere e-mail? <Link href="/signup" data-cta="hero-email" className="underline hover:text-primary">Criar conta com e-mail</Link>
          </p>

          <HeroNotifications />
        </div>
      </div>
    </section>
  );
};

const HowItWorksVideo = () => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  // Toca só quando está visível na tela (economiza dados no celular).
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  return (
    <section id="como-funciona" className="w-full pb-16 md:pb-24">
      <Reveal className="container px-4 mx-auto max-w-5xl space-y-6">
        <div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden border bg-zinc-950 shadow-2xl shadow-primary/10 ring-1 ring-primary/10 transition-transform duration-500 hover:scale-[1.01]">
          <video
            ref={ref}
            className="w-full aspect-video block"
            src="/video/como-funciona.mp4"
            poster="/video/como-funciona-poster.webp"
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Vídeo mostrando como o Proova AI funciona em 5 passos"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <button type="button" onClick={toggle} aria-label={playing ? 'Pausar vídeo' : 'Reproduzir vídeo'} className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur flex items-center justify-center hover:bg-black/80 transition-colors">
            {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
        </div>
        <p className="text-center text-xs md:text-sm text-muted-foreground font-medium">Veja o fluxo completo em menos de 1 minuto: do link de coleta à resposta com IA.</p>
      </Reveal>
    </section>
  );
};

const AgitationSection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  return (
    <section id="valor-reputacao" ref={ref} className="w-full py-24 bg-muted/30 dark:bg-[hsl(220_8%_7%)] text-foreground dark:text-white overflow-hidden relative border-y border-border/50 dark:border-zinc-900/30 min-h-[400px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      
      <div className="container px-4 mx-auto text-center space-y-16">
        <header className={cn(
          "space-y-4 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <h2 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight leading-tight">
            Uma avaliação ruim pode custar pacientes. <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-1">O Proova te dá o controle.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground dark:text-zinc-400 text-sm md:text-base font-medium">Hoje, quem fica insatisfeito vai direto para o Google e você só descobre depois. Com o Proova, você ouve o cliente primeiro, resolve a tempo e ainda ganha prova social com quem gostou.</p>
        </header>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Críticas só para você",
              desc: "Notas de 1 a 3 estrelas chegam a um inbox privado, com alerta no celular e resposta em 1 toque pelo WhatsApp. Você resolve antes de virar problema.",
              color: "text-primary"
            },
            {
              icon: Bot,
              title: "Respostas do Google prontas",
              desc: "A IA (Gemini) lê cada avaliação do Google da sua ficha e escreve uma resposta profissional e ética. Você revisa, copia e publica em segundos.",
              color: "text-primary"
            },
            {
              icon: Star,
              title: "Elogios viram prova social",
              desc: "Depoimentos aprovados ganham página pública, cards prontos para Instagram e convite para o cliente avaliar também no Google.",
              color: "text-primary"
            }
          ].map((item, idx) => (
            <TiltCard key={idx} className="rounded-3xl"><article className={cn(
              "space-y-4 rounded-3xl border border-transparent hover:border-primary/30 bg-background/40 dark:bg-zinc-900/40 py-8 transition-all duration-1000",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )} style={{ transitionDelay: `${(idx + 1) * 200}ms` }}>
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-primary/5 text-primary transition-transform duration-300 group-hover/tilt:scale-110 group-hover/tilt:-rotate-3">
                  <item.icon className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-xl font-bold font-headline px-4">{item.title}</h3>
              <p className="text-muted-foreground dark:text-zinc-500 text-sm leading-relaxed font-medium px-6">{item.desc}</p>
            </article></TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
});
AgitationSection.displayName = "AgitationSection";

const PillarsSection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  return (
    <section id="metodologia" ref={ref} className="w-full py-20 md:py-24 bg-background border-y overflow-hidden">
      <div className="container px-4 mx-auto">
        <header className={cn(
          "text-center space-y-4 mb-14 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <h2 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight">
            Comece em 3 passos <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">e deixe o Proova trabalhar.</span>
          </h2>
        </header>
        
        <div className="max-w-4xl mx-auto relative px-4 md:px-0">
          <div className="relative space-y-12 md:space-y-16">
            <div aria-hidden className="absolute left-[21px] md:left-[26px] top-6 bottom-6 w-px bg-border" />
            <div aria-hidden className={cn("absolute left-[21px] md:left-[26px] top-6 bottom-6 w-px origin-top bg-gradient-to-b from-primary to-primary/0 transition-transform duration-[1800ms] ease-out", isVisible ? "scale-y-100" : "scale-y-0")} />
            {[
              { number: '01', title: 'Crie sua conta e envie o link de coleta', desc: 'Em 1 minuto você tem um link e um QR Code de balcão. Envie pelo WhatsApp logo após o atendimento, quando a experiência está fresca.' },
              { number: '02', title: 'Receba elogios e críticas, cada um no lugar certo', desc: 'Elogios vão para sua página pública e para os cards do Instagram. Críticas chegam ao Inbox privado com alerta, para você responder em 1 toque.' },
              { number: '03', title: 'Conecte sua ficha do Google e responda com IA', desc: 'Informe sua empresa pelo Google Maps (sem senha) e receba as avaliações com resposta sugerida pela IA, no tom da sua clínica.' }
            ].map((step, idx) => (
              <div key={idx} className={cn(
                "flex items-start gap-8 md:gap-16 relative transition-all duration-1000", 
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              )} style={{ transitionDelay: `${idx * 200}ms` }}>
                <div className="flex flex-col items-center shrink-0 w-11 md:w-[52px]">
                  <div className="relative z-10 flex h-11 w-11 md:h-[52px] md:w-[52px] items-center justify-center rounded-full border-2 border-primary/30 bg-background text-sm md:text-lg font-black font-headline text-primary shadow-lg shadow-primary/10 transition-transform duration-300 hover:scale-110">
                    {step.number}
                  </div>
                </div>
                <article className="space-y-3 md:space-y-4 pt-1 md:pt-2 flex-1">
                  <h3 className="text-lg md:text-2xl font-bold font-headline tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed font-medium max-w-2xl">
                    {step.desc}
                  </p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});
PillarsSection.displayName = "PillarsSection";

const VersatilitySection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  const items = [
    { icon: Bot, title: 'IA Pilot', desc: 'Respostas inteligentes geradas para cada avaliação, economizando o tempo da sua equipe.' },
    { icon: LayoutGrid, title: 'Bio Link Studio', desc: 'Personalize cores, layouts e seções para que sua página de depoimentos reflita a identidade da sua clínica.' },
    { icon: Star, title: 'Página Pública de Autoridade', desc: 'Um link único e profissional que reúne seus melhores depoimentos e facilita o contato de novos pacientes.' },
  ];
  return (
    <section id="setores" ref={ref} className="w-full py-20 md:py-24 bg-muted/20 border-b">
      <div className="container px-4 mx-auto max-w-5xl">
        <header className={cn("text-center space-y-3 mb-12 transition-all duration-700", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
          <h2 className="text-3xl md:text-4xl font-extrabold font-headline leading-tight tracking-tight">
            Sua <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">Página de Autoridade</span> para o Link da Bio.
          </h2>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-muted-foreground font-medium">
            Centralize seus melhores depoimentos e facilite o contato de novos pacientes através de um link único e profissional.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item, idx) => (
            <TiltCard key={idx} className="rounded-2xl h-full"><article className={cn("h-full rounded-2xl border bg-card p-6 space-y-3 transition-all duration-700 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")} style={{ transitionDelay: `${idx * 120}ms` }}>
              <div className="inline-flex p-2.5 rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover/tilt:scale-110 group-hover/tilt:-rotate-3"><item.icon className="w-5 h-5" /></div>
              <h3 className="font-bold text-base font-headline">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </article></TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
});
VersatilitySection.displayName = "VersatilitySection";

const PricingSection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  const plans = [
    {
      id: 'premium',
      name: "Proova AI Premium",
      price: "R$ 59,90",
      period: "/mês",
      description: "Para clínicas e profissionais que querem responder todas as avaliações com agilidade.",
      highlight: true,
      benefits: [
        "Respostas prontas via IA para cada avaliação",
        "Busca automática das avaliações do Google",
        "Página Pública VIP",
        "G-Boost (estratégia de SEO local)",
        "Social Cards Studio (post e story)",
        "Relatórios de performance automáticos",
        "Inbox privado (Shield)",
      ],
    },
    {
      id: 'pro',
      name: "Proova AI PRO",
      price: "R$ 119,99",
      period: "/mês",
      description: "Para quem quer o máximo de personalização e acompanhamento.",
      highlight: false,
      benefits: [
        "Tudo do Proova AI Premium",
        "Coleta de vídeo reviews 4K",
        "Suporte VIP dedicado com consultor",
        "Métricas de ROI avançadas",
        "Design de página ultra customizado",
        "Consultoria de reputação mensal",
        "Domínio próprio (sob consulta)",
      ],
    },
  ];

  return (
    <section id="planos" ref={ref} className="w-full py-20 md:py-24 bg-background border-b">
      <div className="container px-4 mx-auto max-w-6xl">
        <header className={cn("text-center space-y-3 mb-12 transition-all duration-700", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
          <h2 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight">Planos e <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">preços</span></h2>
          <p className="text-sm md:text-base text-muted-foreground font-medium">Garantia de 7 dias com reembolso integral e cancelamento quando quiser.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
          {plans.map((plan, idx) => (
            <Reveal key={plan.id} delay={idx * 120} className="h-full"><TiltCard className="h-full rounded-2xl" max={11}><div style={{ transformStyle: "preserve-3d" }} className={cn("relative flex h-full flex-col rounded-2xl border border-b-[6px] p-6 md:p-8 bg-gradient-to-b from-card to-muted/60 transition-shadow duration-300 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.35),0_34px_60px_-28px_hsl(var(--primary)/0.45),0_14px_26px_-14px_rgb(0_0_0/0.35)] hover:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.4),0_50px_80px_-30px_hsl(var(--primary)/0.6),0_20px_34px_-14px_rgb(0_0_0/0.45)]", plan.highlight ? "border-primary/60 border-b-primary ring-1 ring-primary/30" : "border-b-border")}>
              {plan.highlight && (
                <span style={{ transform: "translateZ(50px)" }} className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">Mais escolhido</span>
              )}
              <h3 style={{ transform: "translateZ(26px)" }} className="text-lg font-bold font-headline">{plan.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground font-medium min-h-[2.5rem]">{plan.description}</p>
              <p style={{ transform: "translateZ(44px)" }} className="mt-4 flex items-baseline gap-1 drop-shadow-[0_8px_10px_rgb(0_0_0/0.15)]">
                <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                <span className="text-sm text-muted-foreground font-medium">{plan.period}</span>
              </p>
              <ul style={{ transform: "translateZ(14px)" }} className="mt-6 space-y-3 flex-1">
                {plan.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm font-medium">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <div style={{ transform: "translateZ(34px)" }} className="mt-8 block">
                <GoogleButton cta={`plano-${plan.id}`} label="Garantir meu acesso" logo={false} variant={plan.highlight ? "default" : "outline"} className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wide gap-2" />
              </div>
            </div></TiltCard></Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground font-medium">Entre com o Google, escolha o plano e pague com o mesmo e-mail da conta: o acesso é ativado na hora.</p>
      </div>
    </section>
  );
});
PricingSection.displayName = "PricingSection";

const FAQ_ITEMS = [
  { q: "O Proova AI tem plano grátis ou teste?", a: "Não. O Proova AI é 100% pago, a partir de R$ 59,90 por mês. Para você contratar sem medo, os planos têm garantia de 7 dias com reembolso integral: se não gostar, devolvemos o valor." },
  { q: "Meu cliente precisa baixar algum app ou criar conta?", a: "Não. Ele abre o link no celular, escolhe as estrelas, escreve (ou envia uma foto) e envia. Leva menos de 1 minuto." },
  { q: "As críticas ficam escondidas do público?", a: "Notas de 1 a 3 estrelas dadas pelo seu link de coleta vão para o seu Inbox privado e não aparecem na sua página. O Proova não impede ninguém de avaliar no Google: ele te dá a chance de ouvir e resolver antes. A nota média do seu painel inclui todas as avaliações, inclusive as críticas." },
  { q: "O cliente autoriza a publicação do depoimento?", a: "Sim. Antes de enviar, o cliente marca um aceite autorizando a publicação do depoimento e do nome. A autorização fica registrada em cada depoimento e você remove quando ele pedir." },
  { q: "Preciso dar a senha da minha conta do Google?", a: "Não. Você informa sua empresa pelo Google Maps e o Proova lê as avaliações públicas da sua ficha." },
  { q: "O Proova publica as respostas por mim?", a: "Hoje a IA prepara a resposta e você copia e publica em segundos, com controle total do que vai ao ar. A publicação automática chegará com a integração oficial do Google." },
  { q: "Como funcionam os alertas de críticas?", a: "Quando chega um feedback crítico, nos planos Premium e PRO você recebe e-mail e push no celular, e o Inbox já mostra o contato do cliente e uma mensagem pronta para o WhatsApp." },
  { q: "A IA responde avaliações antigas?", a: "A primeira busca do Google traz os últimos 30 dias e, depois, só as mais recentes. Nos depoimentos antigos você pode pedir uma sugestão de resposta no painel." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem multa. O cancelamento pode ser feito pelo e-mail contato@useproovaai.com.br." },
  { q: "E se eu não gostar de um plano pago?", a: "Você tem 7 dias de garantia: peça o reembolso integral direto no painel, em Configurações." },
];

const FaqSection = () => (
  <section id="perguntas" className="w-full py-16 md:py-20 bg-muted/20">
    <div className="container max-w-2xl mx-auto px-4 space-y-8">
      <header className="text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold font-headline tracking-tight">Perguntas <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-1">frequentes</span></h2>
      </header>
      <div className="space-y-2">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="group rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/30 open:border-primary/40 open:shadow-md">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs md:text-sm font-bold">
              {item.q}
              <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="pt-2 text-xs md:text-sm text-muted-foreground font-medium leading-relaxed group-open:animate-in group-open:fade-in group-open:slide-in-from-top-1 duration-300">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => {
  return (
    <footer className="py-20 border-t bg-background">
      <div className="container px-4 mx-auto flex flex-col items-center gap-12 text-center">
        <div className="relative w-[200px] h-[60px] opacity-40 grayscale">
           <Image src="/logo-proovaai-whitemode.png" alt="Logo Proova Footer Light" fill className="dark:hidden object-contain" />
           <Image src="/logo-proovaai-darkmode.png" alt="Logo Proova Footer Dark" fill className="hidden dark:block object-contain" />
        </div>
        <nav className="space-y-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <Link href="/pricing" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Planos SaaS</Link>
            <Link href="/login" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Login Membro</Link>
            <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"><Scale className="w-4 h-4" /> Termos de Uso</Link>
            <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"><Lock className="w-4 h-4" /> Política de Privacidade</Link>
          </div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">© 2026 PROOVA TECHNOLOGY - GESTÃO DE REPUTAÇÃO E IA</p>
        </nav>
      </div>
    </footer>
  );
};

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [isAgitationVisible, setIsAgitationVisible] = useState(false);
  const [isPillarsVisible, setIsPillarsVisible] = useState(false);
  const [isVersatilityVisible, setIsVersatilityVisible] = useState(false);
  const [isPricingVisible, setIsPricingVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  const agitationRef = useRef<HTMLElement>(null);
  const pillarsRef = useRef<HTMLElement>(null);
  const versatilityRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Injeta o widget apenas na Landing Page com ciclo de vida controlado
    const iframe = document.createElement('iframe');
    iframe.id = 'proova-mural-widget';
    iframe.src = 'https://www.useproovaai.com.br/widgetpublic/EE6Mqdqq4Pc4maNgFy7rNq52ms13/primeiromuralproova';
    iframe.style.position = 'fixed';
    iframe.style.bottom = '20px';
    iframe.style.left = '20px';
    iframe.style.width = '300px';
    iframe.style.height = '130px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    iframe.allowTransparency = 'true';
    document.body.appendChild(iframe);

    // Cleanup: Remove o widget ao navegar para outra página
    return () => {
      const existingIframe = document.getElementById('proova-mural-widget');
      if (existingIframe) {
        existingIframe.remove();
      }
    };
  }, []);

  useEffect(() => {
    const f = document.getElementById('proova-mural-widget');
    if (f) f.style.bottom = showSticky && window.innerWidth < 768 ? '84px' : '20px';
  }, [showSticky]);

  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 20); setShowSticky(window.scrollY > 650); };
    window.addEventListener("scroll", handleScroll);
    
    const fallbackTimer = setTimeout(() => {
      setIsHeroVisible(true);
      setIsAgitationVisible(true);
      setIsPillarsVisible(true);
      setIsVersatilityVisible(true);
      setIsPricingVisible(true);
    }, 1500);

    const observerOptions = { 
      threshold: 0.05,
      rootMargin: '0px 0px -50px 0px' 
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id === 'valor-reputacao') setIsAgitationVisible(true);
          if (id === 'metodologia') setIsPillarsVisible(true);
          if (id === 'setores') setIsVersatilityVisible(true);
          if (id === 'planos') setIsPricingVisible(true);
        }
      });
    }, observerOptions);

    if (agitationRef.current) observer.observe(agitationRef.current);
    if (pillarsRef.current) observer.observe(pillarsRef.current);
    if (versatilityRef.current) observer.observe(versatilityRef.current);
    if (pricingRef.current) observer.observe(pricingRef.current);

    setIsHeroVisible(true);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace('/dash');
  }, [user, loading, router]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      setTimeout(() => {
        const yOffset = -100;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        window.history.pushState(null, '', `#${id}`);
      }, 300);
    }
  };

  if (loading || user) return <LoadingScreen />;

  return (
    <div id="landing-root" className="flex flex-col min-h-screen bg-background text-foreground font-body overflow-x-hidden">
      <ScrollProgress />
      <Navigation isScrolled={isScrolled} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} scrollToSection={scrollToSection} />
      <main className="flex-1 pt-20">
        <HeroSection isVisible={isHeroVisible} scrollToSection={scrollToSection} />
        <HowItWorksVideo />
        <FactsStrip />
        <RatingSimulator />
        <AgitationSection ref={agitationRef} isVisible={isAgitationVisible} />
        <PillarsSection ref={pillarsRef} isVisible={isPillarsVisible} />
        <VersatilitySection ref={versatilityRef} isVisible={isVersatilityVisible} />
        <PricingSection ref={pricingRef} isVisible={isPricingVisible} />
        <FaqSection />
        
        <section id="cta-final-section" className="relative w-full py-20 md:py-28 bg-[hsl(220_8%_6%)] text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220_8%_4%)] via-[hsl(220_8%_6%)]/80 to-primary/10" />
          <div aria-hidden className="pointer-events-none absolute -top-20 right-10 h-72 w-72 rounded-full bg-primary/25 blur-[100px] animate-orb-slow" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-orange-500/15 blur-[100px] animate-orb-slow [animation-delay:-8s]" />
          <div className="container relative z-10 px-4 mx-auto text-center space-y-10">
            <header className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold font-headline tracking-tight leading-tight">
                Sua próxima avaliação 5 estrelas <span className="text-primary italic">começa com um link.</span>
              </h2>
              <p className="max-w-lg mx-auto text-sm md:text-lg font-medium text-white/80">
                Entre com o Google em 1 toque, ative seu plano, envie o primeiro link de coleta hoje e veja quem aprova (e quem precisa de atenção) antes de ir para o Google.
              </p>
            </header>
            <GoogleButton cta="cta-final" label="Continuar com Google" size="lg" className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-xl text-sm md:text-base font-bold gap-3 shadow-2xl shadow-primary/30 hover:scale-105 hover:shadow-primary/50 active:scale-95 transition-all bg-white text-black hover:bg-white/90 border-none" />
            <p className="text-xs md:text-sm font-bold text-white/70">Cadastro em 1 toque • Garantia de 7 dias com reembolso integral</p>
          </div>
        </section>
      </main>
      <Footer />
      <div className={cn("fixed inset-x-0 bottom-0 z-[60] md:hidden border-t bg-background/95 backdrop-blur px-4 py-3 transition-transform duration-300", showSticky ? "translate-y-0" : "translate-y-full")}>
        <GoogleButton cta="barra-mobile" label="Continuar com Google" className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-widest gap-3 bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-100" />
      </div>
    </div>
  );
}
