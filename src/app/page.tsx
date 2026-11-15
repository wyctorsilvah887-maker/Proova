'use client';

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
  LayoutGrid
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
                        <Link href="/signup" className="block" onClick={() => setIsMenuOpen(false)}>
                          <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-2xl">Ativar Licença</Button>
                        </Link>
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

const HeroSection = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <section className="relative w-full pb-12 md:pb-24 flex items-center justify-center overflow-hidden border-b min-h-[75vh] pt-8 md:pt-16">
      
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
              "text-3xl font-extrabold tracking-tight sm:text-4xl md:text-6xl font-headline leading-[1.1] transition-all duration-1000",
              isVisible ? "animate-in fade-in slide-in-from-left-20 opacity-100" : "opacity-0"
            )}>
              Respostas prontas para suas avaliações no <br className="hidden sm:block" />
              <span className="inline-block relative bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">
                Google Meu Negócio
              </span> com IA
            </h1>
          </header>
          
          <p className={cn(
            "max-w-2xl mx-auto text-muted-foreground text-sm md:text-xl font-medium leading-relaxed transition-all duration-1000 delay-300",
            isVisible ? "animate-in fade-in slide-in-from-right-20 opacity-100" : "opacity-0"
          )}>
            Veja as avaliações da sua empresa no Google, receba a resposta pronta da IA (Gemini) e gerencie sua prova social em um só painel. Feito para profissionais da saúde.
          </p>
          
          <div className={cn(
            "flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 transition-all duration-1000 delay-500",
            isVisible ? "animate-in fade-in slide-in-from-bottom-5 opacity-100" : "opacity-0"
          )}>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-14 px-8 rounded-2xl text-[10px] font-black shadow-2xl transition-all hover:scale-105 active:scale-95 group bg-primary hover:bg-primary/90 text-white">
                COMEÇAR AGORA <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
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
          <h2 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight leading-tight">
            Gestão Unificada de <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-1">Autoridade Digital.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground dark:text-zinc-400 text-sm md:text-base font-medium">O Proova lê as avaliações do Google da sua empresa, prepara a resposta com IA e reúne todos os seus depoimentos em um só painel, para você escalar seu ranking orgânico com dados reais.</p>
        </header>

        <div className="grid gap-12 lg:grid-cols-3">
          {[
            { 
              icon: MapPin, 
              title: "Inbox Unificado", 
              desc: "Receba alertas instantâneos de cada novo depoimento enviado pelo seu link de coleta Proova e modere tudo em um único inbox unificado.", 
              color: "text-primary"
            },
            { 
              icon: Bot, 
              title: "Respostas Prontas com IA", 
              desc: "Nossa IA (Gemini) analisa o sentimento da avaliação e gera respostas profissionais e éticas em segundos, prontas para você revisar, copiar e publicar.", 
              color: "text-primary" 
            },
            { 
              icon: Zap, 
              title: "Estratégia G-Boost", 
              desc: "Aumente seu volume de avaliações 5 estrelas no Google através do nosso fluxo de redirecionamento inteligente.", 
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
    <section id="metodologia" ref={ref} className="w-full py-20 md:py-24 bg-background border-y overflow-hidden">
      <div className="container px-4 mx-auto">
        <header className={cn(
          "text-center space-y-4 mb-14 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <h2 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight">
            Como o Proova <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">Automatiza sua Reputação.</span>
          </h2>
        </header>
        
        <div className="max-w-4xl mx-auto relative px-4 md:px-0">
          <div className="space-y-12 md:space-y-16">
            {[
              { number: '01', title: '01. Conecte sua ficha do Google', desc: 'Informe sua empresa pelo Google Maps e o Proova passa a ler as avaliações públicas da sua ficha, sem precisar da senha da sua conta.' },
              { number: '02', title: '02. IA Generativa (Gemini)', desc: 'O Proova utiliza modelos avançados de IA para preparar respostas com empatia, mantendo o tom de voz da sua marca.' },
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
            <article key={idx} className={cn("rounded-2xl border bg-card p-6 space-y-3 transition-all duration-700", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")} style={{ transitionDelay: `${idx * 120}ms` }}>
              <div className="inline-flex p-2.5 rounded-xl bg-primary/10 text-primary"><item.icon className="w-5 h-5" /></div>
              <h3 className="font-bold text-base font-headline">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </article>
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
      price: "R$ 147",
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
      price: "R$ 270",
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
      <div className="container px-4 mx-auto max-w-4xl">
        <header className={cn("text-center space-y-3 mb-12 transition-all duration-700", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
          <h2 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight">Planos e <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">preços</span></h2>
          <p className="text-sm md:text-base text-muted-foreground font-medium">Garantia de 7 dias com reembolso integral. Cancele quando quiser.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          {plans.map((plan) => (
            <div key={plan.id} className={cn("relative flex flex-col rounded-2xl border p-6 md:p-8", plan.highlight ? "border-primary shadow-lg bg-card" : "bg-card")}>
              {plan.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">Mais escolhido</span>
              )}
              <h3 className="text-lg font-bold font-headline">{plan.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground font-medium min-h-[2.5rem]">{plan.description}</p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                <span className="text-sm text-muted-foreground font-medium">{plan.period}</span>
              </p>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm font-medium">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block">
                <Button className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wide gap-2" variant={plan.highlight ? "default" : "outline"}>
                  Garantir meu acesso <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground font-medium">Crie sua conta gratuitamente e contrate o plano em seguida, com o mesmo e-mail.</p>
      </div>
    </section>
  );
});
PricingSection.displayName = "PricingSection";

const FAQ_ITEMS = [
  { q: "Preciso dar a senha da minha conta do Google?", a: "Não. Você informa sua empresa pelo Google Maps e o Proova lê as avaliações públicas da sua ficha." },
  { q: "O Proova publica as respostas por mim?", a: "Hoje a IA prepara a resposta e você copia e publica em segundos, com controle total do que vai ao ar. A publicação automática chegará com a integração oficial do Google." },
  { q: "Como funcionam os alertas?", a: "Cada novo depoimento enviado pelo seu link de coleta Proova chega ao seu inbox unificado com alerta instantâneo, para você moderar antes de publicar." },
  { q: "Com que frequência as avaliações do Google são atualizadas?", a: "Automaticamente uma vez por dia e, quando você quiser, na hora pelo botão \"Atualizar agora\" (planos pagos)." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem multa. O cancelamento pode ser feito pelo e-mail contato@useproovaai.com.br." },
  { q: "E se eu não gostar?", a: "Você tem 7 dias de garantia: peça o reembolso integral direto no painel, em Configurações." },
];

const FaqSection = () => (
  <section id="perguntas" className="w-full py-16 md:py-20 bg-muted/20">
    <div className="container max-w-2xl mx-auto px-4 space-y-8">
      <header className="text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold font-headline tracking-tight">Perguntas <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-1">frequentes</span></h2>
      </header>
      <div className="space-y-2">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="group rounded-xl border bg-card px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs md:text-sm font-bold">
              {item.q}
              <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="pt-2 text-xs md:text-sm text-muted-foreground font-medium leading-relaxed">{item.a}</p>
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
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body overflow-x-hidden">
      <Navigation isScrolled={isScrolled} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} scrollToSection={scrollToSection} />
      <main className="flex-1 pt-20">
        <HeroSection isVisible={isHeroVisible} />
        <AgitationSection ref={agitationRef} isVisible={isAgitationVisible} />
        <PillarsSection ref={pillarsRef} isVisible={isPillarsVisible} />
        <VersatilitySection ref={versatilityRef} isVisible={isVersatilityVisible} />
        <PricingSection ref={pricingRef} isVisible={isPricingVisible} />
        <FaqSection />
        
        <section className="relative w-full py-20 md:py-28 bg-zinc-950 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-primary/10" />
          <div className="container relative z-10 px-4 mx-auto text-center space-y-10">
            <header className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold font-headline tracking-tight leading-tight">
                Gestão de Reputação com <span className="text-primary italic">IA ao seu lado.</span>
              </h2>
              <p className="max-w-lg mx-auto text-sm md:text-lg font-medium text-white/80">
                Assuma a liderança regional através da prova social estratégica e IA.
              </p>
            </header>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-xl text-sm md:text-base font-bold shadow-2xl hover:scale-105 transition-all bg-white text-black hover:bg-white/90">
                CRIAR MINHA CONTA AGORA
              </Button>
            </Link>
            <p className="text-xs md:text-sm font-bold text-white/70">Garantia de 7 dias com reembolso integral • Cancele quando quiser</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
