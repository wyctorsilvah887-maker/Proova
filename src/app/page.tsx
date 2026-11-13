
'use client';

import { useEffect, useState, useRef, forwardRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
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
  LayoutGrid
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/firebase";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/loading-screen";
import { PlaceHolderImages } from "@/lib/placeholder-images";

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
            <Link href="/signup">
              <Button className="font-black uppercase tracking-widest shadow-lg px-4 h-9 text-[9px] rounded-xl">Iniciar Estratégia</Button>
            </Link>
          </div>

          <div className="sm:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 transition-all">
                  {isMenuOpen ? (
                    <X className="w-5 h-5 text-primary rotate-12 transition-transform duration-300" />
                  ) : (
                    <Menu className="w-5 h-5 text-primary transition-transform duration-300" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="fixed inset-0 top-20 h-[calc(100vh-5rem)] w-screen p-0 border-none bg-background z-[90] translate-x-0 translate-y-0 left-0 [&>button]:hidden"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu de Navegação</SheetTitle>
                  <SheetDescription>Acesse as seções principais da plataforma Proova.</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col h-full bg-background">
                  <div className="p-4 flex items-center justify-between shrink-0">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/60">Gestão de Reputação</span>
                  </div>
                  <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {[
                      { id: 'valor-reputacao', label: 'Reputação Local', icon: TrendingUp },
                      { id: 'metodologia', label: 'Gestão via IA', icon: Bot },
                      { id: 'planos', label: 'Planos SaaS', icon: Gem },
                    ].map((item) => (
                      <SheetClose asChild key={item.id}>
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
                      </SheetClose>
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
                        <Link href="/signup" className="block" onClick={() => setIsMenuOpen(false)}>
                          <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-2xl">Ativar Licença</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
};

const HeroSection = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <section className="relative w-full pb-12 md:pb-24 flex items-center justify-center overflow-hidden border-b min-h-[75vh] pt-8 md:pt-16">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-[15%] left-[8%] animate-float opacity-20 text-primary">
          <BrainCircuit className="w-16 h-16 md:w-24 md:h-24" />
        </div>
        <div className="absolute top-[20%] right-[12%] animate-float-delayed opacity-20 text-primary">
          <HeartPulse className="w-12 h-12 md:w-20 md:h-20" />
        </div>
        <div className="absolute bottom-[20%] left-[15%] animate-float-delayed opacity-20 text-primary">
          <Shield className="w-20 h-20 md:w-32 md:h-32" />
        </div>
      </div>
      
      <div className="container relative z-10 px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <header>
            <div className={cn(
              "inline-flex items-center text-primary px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-1000 bg-primary/5 rounded-full border border-primary/10 mb-6",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            )}>
              SaaS DE GESTÃO DE REPUTAÇÃO E AUTOMAÇÃO COM IA
            </div>
            
            <h1 className={cn(
              "text-3xl font-black tracking-tighter sm:text-5xl md:text-7xl font-headline leading-[1] transition-all duration-1000",
              isVisible ? "animate-in fade-in slide-in-from-left-20 opacity-100" : "opacity-0"
            )}>
              Automatize suas respostas no <br className="hidden sm:block" />
              <span className="inline-block relative bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">
                Google Meu Negócio
              </span> com IA
            </h1>
          </header>
          
          <p className={cn(
            "max-w-2xl mx-auto text-muted-foreground text-sm md:text-xl font-medium leading-relaxed transition-all duration-1000 delay-300",
            isVisible ? "animate-in fade-in slide-in-from-right-20 opacity-100" : "opacity-0"
          )}>
            Integração oficial com Google Business Profile, Automação de Respostas via Gemini e Gestão Estratégica de Prova Social para Profissionais da Saúde.
          </p>
          
          <div className={cn(
            "flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 transition-all duration-1000 delay-500",
            isVisible ? "animate-in fade-in slide-in-from-bottom-5 opacity-100" : "opacity-0"
          )}>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-14 px-8 rounded-2xl text-[10px] font-black shadow-2xl transition-all hover:scale-105 active:scale-95 group bg-primary hover:bg-primary/90 text-white">
                AUTOMATIZAR MINHAS AVALIAÇÕES <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const AgitationSection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  return (
    <section id="valor-reputacao" ref={ref} className="w-full py-24 bg-muted/30 dark:bg-zinc-950 text-foreground dark:text-white overflow-hidden relative border-y border-border/50 dark:border-zinc-900/30 min-h-[400px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      
      <div className="container px-4 mx-auto text-center space-y-16">
        <header className={cn(
          "space-y-4 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter leading-tight">
            Gestão Unificada de <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-1">Autoridade Digital.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground dark:text-zinc-400 text-sm md:text-base font-medium">O Proova se conecta diretamente ao Perfil da sua Empresa no Google para monitorar, responder e escalar seu ranking orgânico através de dados reais.</p>
        </header>

        <div className="grid gap-12 lg:grid-cols-3">
          {[
            { 
              icon: MapPin, 
              title: "Monitoramento GBP", 
              desc: "Receba alertas instantâneos de novas avaliações no Google Maps e gerencie toda a sua reputação em um único painel centralizado.", 
              color: "text-primary"
            },
            { 
              icon: Bot, 
              title: "Respostas Automáticas", 
              desc: "Nossa IA (Gemini) analisa o sentimento do depoimento e gera respostas profissionais e éticas em segundos, mantendo seu perfil ativo.", 
              color: "text-primary" 
            },
            { 
              icon: Zap, 
              title: "Estratégia G-Boost", 
              desc: "Aumente drasticamente seu volume de avaliações 5 estrelas no Google através do nosso fluxo de redirecionamento inteligente.", 
              color: "text-primary" 
            }
          ].map((item, idx) => (
            <article key={idx} className={cn(
              "space-y-4 transition-all duration-1000",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )} style={{ transitionDelay: `${(idx + 1) * 200}ms` }}>
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-primary/5 text-primary">
                  <item.icon className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-xl font-bold font-headline px-4">{item.title}</h3>
              <p className="text-muted-foreground dark:text-zinc-500 text-sm leading-relaxed font-medium px-6">{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
});
AgitationSection.displayName = "AgitationSection";

const PillarsSection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  return (
    <section id="metodologia" ref={ref} className="w-full py-24 md:py-32 bg-background border-y overflow-hidden min-h-[500px]">
      <div className="container px-4 mx-auto">
        <header className={cn(
          "text-center space-y-4 mb-24 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">
            Como o Proova <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">Automatiza sua Reputação.</span>
          </h2>
        </header>
        
        <div className="max-w-4xl mx-auto relative px-4 md:px-0">
          <div className="space-y-20 md:space-y-32">
            {[
              { number: '01', title: '01. Conexão com Google', desc: 'Integração via API oficial para ler e gerir o perfil da sua clínica no Google Business Profile de forma segura.' },
              { number: '02', title: '02. IA Generativa (Gemini)', desc: 'O Proova utiliza modelos avançados de IA para responder pacientes com empatia, mantendo o tom de voz da sua marca.' },
              { number: '03', title: '03. Link in Bio de Autoridade', desc: 'Transforme sua biografia do Instagram em um hub de conversão com uma vitrine dinâmica de depoimentos e botão de contato direto.' }
            ].map((step, idx) => (
              <div key={idx} className={cn(
                "flex items-start gap-8 md:gap-16 relative transition-all duration-1000", 
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              )} style={{ transitionDelay: `${idx * 200}ms` }}>
                <div className="flex flex-col items-center shrink-0 w-11">
                  <div className="text-lg md:text-3xl font-black font-headline text-primary">
                    {step.number.split('.')[0]}
                  </div>
                </div>
                <article className="space-y-3 md:space-y-4 pt-1 md:pt-2 flex-1">
                  <h3 className="text-xl md:text-4xl font-black font-headline tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-xl leading-relaxed font-medium max-w-2xl">
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
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [api]);

  const slides = useMemo(() => [
    {
      light: PlaceHolderImages.find(img => img.id === 'app-mobile-light')?.imageUrl || "/pagnappmobile-whitemode.webp",
      dark: PlaceHolderImages.find(img => img.id === 'app-mobile-dark')?.imageUrl || "/pagnappmobile-darkmode.webp"
    },
    {
      light: PlaceHolderImages.find(img => img.id === 'app-mobile-light-2')?.imageUrl || "/pagnappmobile-whitemode2.webp",
      dark: PlaceHolderImages.find(img => img.id === 'app-mobile-dark-2')?.imageUrl || "/pagnappmobile-darkmode2.webp"
    }
  ], []);

  return (
    <section id="setores" ref={ref} className="w-full py-24 md:py-32 overflow-hidden bg-muted/20 min-h-[500px]">
      <div className="container px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className={cn("space-y-8 transition-all duration-1000", isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10")}>
            <header className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-black font-headline leading-tight tracking-tight">
                Sua <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-3">Página de Autoridade</span> para o Link da Bio.
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground font-medium">
                Nossa tecnologia permite que você centralize seus melhores depoimentos e facilite o contato de novos pacientes através de um link único e profissional.
              </p>
            </header>

            <div className="space-y-6">
              {[
                { icon: Bot, title: 'IA Pilot', desc: 'Respostas inteligentes geradas automaticamente para economizar tempo da sua equipe.' },
                { icon: LayoutGrid, title: 'Bio Link Studio', desc: 'Personalize cores, layouts e seções para que sua página de depoimentos reflita a identidade da sua clínica.' }
              ].map((item, idx) => (
                <article key={idx} className="flex gap-6 group">
                  <item.icon className="w-7 h-7 text-primary shrink-0 group-hover:scale-110 transition-transform duration-500" />
                  <div className="space-y-1">
                    <p className="font-black text-xl font-headline">{item.title}</p>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{item.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className={cn(
            "relative transition-all duration-1000 delay-500 flex flex-col items-center lg:hidden", 
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="absolute -inset-6 bg-primary/20 rounded-[3rem] blur-3xl opacity-20 animate-pulse" />
            <div className="relative w-full max-w-lg">
              <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
                <CarouselContent>
                  {slides.map((slide, index) => (
                    <CarouselItem key={index}>
                      <div className="relative w-full aspect-[4/5] md:aspect-square lg:aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-primary/10">
                        <Image 
                          src={slide.light} 
                          alt={`Demonstração ${index + 1} Light`} 
                          fill 
                          className="object-cover dark:hidden"
                          priority={index === 0}
                        />
                        <Image 
                          src={slide.dark} 
                          alt={`Demonstração ${index + 1} Dark`} 
                          fill 
                          className="object-cover hidden dark:block"
                          priority={index === 0}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
});
VersatilitySection.displayName = "VersatilitySection";

const PricingSection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'gold',
      name: "Plano Gold",
      price: "R$ 147",
      period: "/mês",
      description: "Aceleração de Vendas",
      icon: Bot,
      highlight: true,
      benefits: [
        "Página Pública VIP",
        "Automação de Respostas via IA",
        "G-Boost (Estratégia de SEO Local)",
        "Social Cards Studio (Post/Story)",
        "Relatórios de Performance Automáticos",
        "Inbox Privado (Shield)"
      ]
    },
    {
      id: 'pro',
      name: "Plano PRO",
      price: "R$ 270",
      period: "/mês",
      description: "Domínio de Mercado",
      icon: Zap,
      highlight: false,
      benefits: [
        "Tudo do Plano Gold + Exclusivos",
        "Coleta de Vídeo Reviews 4K",
        "Suporte VIP Dedicado com Consultor",
        "Métricas de ROI Avançadas",
        "Design de Página Ultra Customizado",
        "Consultoria de Reputação Mensal",
        "Uplink para Domínio Próprio (sob consulta)"
      ]
    }
  ];

  return (
    <section id="planos" ref={ref} className="w-full py-24 md:py-32 bg-background overflow-hidden min-h-[500px] border-t">
      <div className="container px-4 mx-auto max-w-4xl">
        <header className={cn("text-center space-y-4 mb-16 transition-all duration-1000", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
          <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">
            Níveis de <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">Automação Estratégica.</span>
          </h2>
        </header>

        <div className="space-y-4">
          {plans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            return (
              <Collapsible key={plan.id} open={isExpanded} onOpenChange={() => setExpandedPlan(isExpanded ? null : plan.id)} className="w-full">
                <Card className={cn("relative overflow-hidden border-none shadow-xl transition-all duration-300 rounded-3xl", plan.highlight ? "bg-primary text-white" : "bg-card text-card-foreground hover:bg-muted/30 border")}>
                  <CollapsibleTrigger asChild>
                    <div className="p-6 cursor-pointer select-none">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 flex-1 w-full sm:w-auto">
                          <div className={cn("p-3 rounded-2xl shrink-0 transition-transform duration-500", plan.highlight ? "bg-white/10" : "bg-primary/10")}>
                            <plan.icon className={cn("w-6 h-6", plan.highlight ? "text-white" : "text-primary")} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3>
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-70", plan.highlight ? "text-white" : "text-primary")}>{plan.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto">
                          <div className="text-right">
                            <p className="text-xl font-black leading-none">{plan.price}</p>
                            <p className="text-[10px] font-bold uppercase opacity-60">{plan.period}</p>
                          </div>
                          <div className={cn("p-2 rounded-full transition-transform duration-300", isExpanded && "rotate-180", plan.highlight ? "bg-white/10" : "bg-muted")}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className={cn("px-6 pb-6 pt-2 space-y-6", plan.highlight ? "border-t border-white/10" : "border-t border-border")}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                        {plan.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className={cn("mt-1 p-0.5 rounded-full shrink-0", plan.highlight ? "bg-white/20" : "bg-primary/10")}>
                              <Check className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-bold leading-relaxed">{benefit}</span>
                          </div>
                        ))}
                      </div>
                      <Link href="/signup" className="w-full">
                        <Button className={cn("w-full h-14 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-tight sm:tracking-normal shadow-2xl transition-all active:scale-95 gap-2", plan.highlight ? "bg-white text-primary hover:bg-zinc-100" : "bg-primary text-white hover:bg-primary/90")}>
                          Garantir meu acesso <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </section>
  );
});
PricingSection.displayName = "PricingSection";

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

  const agitationRef = useRef<HTMLElement>(null);
  const pillarsRef = useRef<HTMLElement>(null);
  const versatilityRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    // Fallback de segurança
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

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Proova AI",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "127"
    },
    "offers": {
      "@type": "Offer",
      "price": "147.00",
      "priceCurrency": "BRL"
    },
    "description": "Responda avaliações do Google automaticamente com Inteligência Artificial, aumente sua nota no Maps e atraia mais clientes locais."
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Proova Technology",
    "url": "https://useproova.online",
    "logo": "https://useproova.online/logo-proovaai-whitemode.png",
    "sameAs": [
      "https://instagram.com/proovaai"
    ]
  };

  if (loading || user) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body overflow-x-hidden">
      <Script id="proova-bubble-widget">
        {`(function() { var iframe = document.createElement('iframe'); iframe.src = 'https://www.useproovaai.com.br/widgetpublic/EE6Mqdqq4Pc4maNgFy7rNq52ms13/primeiromuralproova'; iframe.style.position = 'fixed'; iframe.style.bottom = '20px'; iframe.style.left = '20px'; iframe.style.width = '300px'; iframe.style.height = '130px'; iframe.style.border = 'none'; iframe.style.zIndex = '999999'; iframe.allowTransparency = 'true'; document.body.appendChild(iframe); })();`}
      </Script>

      {/* Schema Markup Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <Navigation isScrolled={isScrolled} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} scrollToSection={scrollToSection} />
      <main className="flex-1 pt-20">
        <HeroSection isVisible={isHeroVisible} />
        <AgitationSection ref={agitationRef} isVisible={isAgitationVisible} />
        <PillarsSection ref={pillarsRef} isVisible={isPillarsVisible} />
        <VersatilitySection ref={versatilityRef} isVisible={isVersatilityVisible} />
        
        <section className="relative w-full py-24 md:py-36 bg-black text-white overflow-hidden">
          <Image src="https://picsum.photos/seed/ctabg88/1920/1080" alt="Chamada para Ação Final" fill className="object-cover opacity-20 grayscale brightness-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-primary/10" />
          <div className="container relative z-10 px-4 mx-auto text-center space-y-10">
            <header className="space-y-4">
              <h2 className="text-4xl md:text-7xl font-black font-headline tracking-tighter leading-[1]">
                Gestão de Reputação em <span className="text-primary italic">Piloto Automático.</span>
              </h2>
              <p className="max-w-lg mx-auto text-base md:text-2xl font-medium text-white/80">
                Assuma a liderança regional através da prova social estratégica e IA.
              </p>
            </header>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-16 md:h-20 px-12 rounded-2xl text-sm md:text-xl font-black shadow-2xl hover:scale-105 transition-all bg-white text-black hover:bg-white/90">
                CRIAR MINHA CONTA AGORA
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
