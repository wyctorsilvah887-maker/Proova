'use client';

import { useEffect, useState, useRef, forwardRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
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
  Gem
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
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, increment } from "firebase/firestore";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/loading-screen";

// --- SUB-COMPONENTS ---

/**
 * Componente de Navegação Superior e Menu Mobile
 */
const Navigation = ({ isScrolled, isMenuOpen, setIsMenuOpen, scrollToSection }: any) => {
  return (
    <header className={cn(
      "px-4 lg:px-8 h-20 flex items-center justify-between fixed top-0 w-full z-[100] transition-all duration-300",
      (isScrolled || isMenuOpen)
        ? "bg-background/95 backdrop-blur-md border-b shadow-sm" 
        : "bg-transparent border-b-transparent"
    )}>
      <div className="flex items-center">
        <Link href="/" className="flex items-center group -ml-2 md:-ml-4">
          <div className="relative w-[200px] h-[66px] md:w-[320px] md:h-[106px] transition-transform group-hover:scale-105">
            <Image 
              src="/logo-proova-landing-white-mode.png" 
              alt="Logo Proova Light" 
              fill 
              className="dark:hidden object-contain object-left" 
              priority 
            />
            <Image 
              src="/logo-proova-landing-dark-mode.png" 
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
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/60">Navegação Estratégica</span>
                </div>
                <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                  {[
                    { id: 'valor-reputacao', label: 'Valor da Reputação', icon: TrendingUp },
                    { id: 'metodologia', label: 'Metodologia Proova', icon: ShieldCheck },
                    { id: 'planos', label: 'Planos Estratégicos', icon: Gem },
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
                        { href: '/terms', label: 'Termos' },
                        { href: '/privacy', label: 'Privacidade' },
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
                        <Button variant="outline" className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[8px]">Painel de Gestão</Button>
                      </Link>
                      <Link href="/signup" className="block" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-2xl">Ativar Licença Gratuita</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

/**
 * Seção Principal (Hero)
 */
const HeroSection = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <section className="relative w-full pb-12 md:pb-24 flex items-center justify-center overflow-hidden border-b min-h-[75vh] pt-32">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[8%] animate-float opacity-20 text-primary">
          <MessageSquareQuote className="w-16 h-16 md:w-24 md:h-24" />
        </div>
        <div className="absolute top-[20%] right-[12%] animate-float-delayed opacity-20 text-primary">
          <Star className="w-12 h-12 md:w-20 md:h-20 fill-current" />
        </div>
        <div className="absolute bottom-[20%] left-[15%] animate-float-delayed opacity-20 text-primary">
          <Shield className="w-20 h-20 md:w-32 md:h-32" />
        </div>
        <div className="absolute bottom-[25%] right-[10%] animate-float opacity-20 text-primary">
          <Building2 className="w-14 h-14 md:w-28 md:h-28" />
        </div>
      </div>
      
      <div className="container relative z-10 px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className={cn(
            "inline-flex items-center text-primary px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}>
            A autoridade da sua marca é o seu maior ativo de vendas
          </div>
          
          <h1 className={cn(
            "text-3xl font-black tracking-tighter sm:text-5xl md:text-7xl font-headline leading-[1] transition-all duration-1000",
            isVisible ? "animate-in fade-in slide-in-from-left-20 opacity-100" : "opacity-0"
          )}>
            Implemente uma Engenharia de <br className="hidden sm:block" />
            <span className="inline-block relative bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-3">
              CONFIANÇA
            </span> imediata.
          </h1>
          
          <p className={cn(
            "max-w-xl mx-auto text-muted-foreground text-sm md:text-xl font-medium leading-relaxed transition-all duration-1000 delay-300",
            isVisible ? "animate-in fade-in slide-in-from-right-20 opacity-100" : "opacity-0"
          )}>
            Utilize a Proova para consolidar sua reputação digital e transformar depoimentos reais em um motor de conversão de alta performance.
          </p>
          
          <div className={cn(
            "flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 transition-all duration-1000 delay-500",
            isVisible ? "animate-in fade-in slide-in-from-bottom-5 opacity-100" : "opacity-0"
          )}>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-11 px-8 rounded-xl text-[9px] font-black shadow-2xl transition-all hover:scale-105 active:scale-95 group bg-primary hover:bg-primary/90 text-white">
                CONSOLIDAR MINHA AUTORIDADE <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Seção de Agitação (O Valor da Reputação)
 */
const AgitationSection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  return (
    <section id="valor-reputacao" ref={ref} className="w-full py-24 bg-muted/30 dark:bg-zinc-950 text-foreground dark:text-white overflow-hidden relative border-y border-border/50 dark:border-zinc-900/30 min-h-[400px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      
      <div className="container px-4 mx-auto text-center space-y-16">
        <div className={cn(
          "space-y-4 transition-all duration-1000",
          isVisible ? "animate-in fade-in zoom-in-95 opacity-100" : "opacity-0"
        )}>
          <h2 className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">A Ciência da Reputação Digital</h2>
          <h3 className="text-3xl md:text-5xl font-black font-headline tracking-tighter leading-tight">
            Seja a <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-3">Referência</span> absoluta do seu mercado.
          </h3>
          <p className="max-w-2xl mx-auto text-muted-foreground dark:text-zinc-400 text-sm md:text-base font-medium">A ausência de prova social gera incerteza. A incerteza interrompe a venda.</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          {[
            { 
              icon: MapPin, 
              title: "SEO Local e Visibilidade", 
              desc: "Aumente sua relevância no Google Maps. Perfis com alto volume de avaliações 5 estrelas são priorizados pelo algoritmo, capturando a demanda qualificada da sua região.", 
              animate: true,
              color: "text-primary"
            },
            { 
              icon: ShieldCheck, 
              title: "Segurança na Decisão", 
              desc: "Elimine o atrito no checkout. Exibir depoimentos verificados reduz a percepção de risco e acelera o ciclo de decisão do seu cliente final.", 
              animate: true,
              color: "text-primary" 
            },
            { 
              icon: TrendingUp, 
              title: "Autoridade Consolidada", 
              desc: "Deixe de ser apenas mais um no mercado. Com a Proova, sua marca transmite solidez e sucesso contínuo, atraindo parcerias e contratos de maior valor.", 
              animate: false,
              color: "text-primary" 
            }
          ].map((item, idx) => (
            <div key={idx} className={cn(
              "space-y-4 transition-all duration-1000",
              isVisible ? "animate-in fade-in slide-in-from-bottom-10 opacity-100" : "opacity-0"
            )} style={{ transitionDelay: `${(idx + 1) * 200}ms` }}>
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-primary/5 text-primary">
                  <item.icon 
                    className={cn(
                      "w-10 h-10", 
                      item.animate && "animate-pulse"
                    )} 
                  />
                </div>
              </div>
              <h4 className="text-xl font-bold font-headline px-4">{item.title}</h4>
              <p className="text-muted-foreground dark:text-zinc-500 text-sm leading-relaxed font-medium px-6">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
AgitationSection.displayName = "AgitationSection";

/**
 * Seção de Pilares (Metodologia Proova)
 */
const PillarsSection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const steps = [
    { 
      number: '01', 
      title: 'Estratégia G-Boost', 
      desc: 'Integração direta com o ecossistema Google para maximizar o volume de avaliações positivas no seu perfil comercial, elevando seu rankeamento orgânico.' 
    },
    { 
      number: '02', 
      title: 'Protocolo Reputation Shield', 
      desc: 'Blindagem de marca através de um canal de feedback privado. Resolva intercorrências internamente e preserve sua imagem pública imaculada.' 
    },
    { 
      number: '03', 
      title: 'Hub de Autoridade Digital', 
      desc: 'Uma Landing Page estratégica para o seu link da bio, reunindo seus depoimentos mais impactantes em uma interface de alta performance projetada para converter tráfego social em vendas.' 
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const triggerPoint = windowHeight * 0.5;
      const currentPos = triggerPoint - rect.top;
      const totalHeight = rect.height;
      const progress = currentPos / totalHeight;
      
      setScrollProgress(Math.max(0, Math.min(1, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="metodologia" ref={sectionRef} className="w-full py-24 md:py-32 bg-background border-y overflow-hidden min-h-[500px]">
      <div className="container px-4 mx-auto">
        <div className={cn(
          "text-center space-y-4 mb-24 transition-all duration-1000",
          isVisible ? "animate-in fade-in slide-in-from-bottom-10 opacity-100" : "opacity-0"
        )}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Metodologia Proova</h2>
          <h3 className={cn(
            "text-3xl md:text-5xl font-black font-headline tracking-tighter"
          )}>
            O Padrão Ouro em <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto]">Reputação.</span>
          </h3>
          <p className="text-muted-foreground font-medium text-sm md:text-lg max-w-2xl mx-auto">Uma infraestrutura completa para gerir, proteger e exibir a força da sua marca.</p>
        </div>
        
        <div className="max-w-4xl mx-auto relative px-4 md:px-0">
          <div className="space-y-20 md:space-y-32">
            {steps.map((step, idx) => {
              const stepTrigger = idx / (steps.length - 1);
              const isActive = scrollProgress >= stepTrigger - 0.1;

              return (
                <div 
                  key={idx} 
                  className={cn(
                    "flex items-start gap-8 md:gap-16 relative transition-all duration-300",
                    isVisible ? "animate-in fade-in opacity-100" : "opacity-0"
                  )}
                >
                  <div className="flex flex-col items-center shrink-0 w-11">
                    <div className={cn(
                      "text-lg md:text-3xl font-black font-headline transition-all duration-300 mb-1.5",
                      isActive ? "text-primary scale-110" : "text-foreground/10"
                    )}>
                      {step.number}
                    </div>
                  </div>

                  <div className={cn(
                    "space-y-3 md:space-y-4 pt-1 md:pt-2 transition-all duration-300 flex-1",
                    isActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-20 grayscale"
                  )}>
                    <h4 className={cn(
                      "text-xl md:text-4xl font-black font-headline tracking-tight transition-colors duration-300",
                      isActive ? "text-foreground" : "text-foreground/40"
                    )}>
                      {step.title}
                    </h4>
                    <p className={cn(
                      "text-muted-foreground text-sm md:text-xl leading-relaxed font-medium max-w-2xl transition-opacity duration-300",
                      isActive ? "opacity-100" : "opacity-40"
                    )}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});
PillarsSection.displayName = "PillarsSection";

/**
 * Seção de Versatilidade (Mural embutido via Iframe)
 */
const VersatilitySection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  return (
    <section id="setores" ref={ref} className="w-full py-24 md:py-32 overflow-hidden bg-muted/20 min-h-[500px]">
      <div className="container px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className={cn(
            "space-y-8 transition-all duration-1000",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
          )}>
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-black font-headline leading-tight tracking-tight">
                Consolide sua marca como a <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-3">Única Opção</span> viável.
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground font-medium italic">
                "No mercado moderno, a confiança não é um detalhe — é a moeda que dita o seu volume de vendas."
              </p>
            </div>

            <div className="space-y-6">
              {[
                { icon: Building2, title: 'Ecossistema Corporativo', desc: 'Estruture a autoridade da sua rede de franquias ou unidades locais com dashboards unificados de performance.' },
                { icon: Target, title: 'Serviços de Alto Ticket', desc: 'Reduza a resistência de compra em serviços premium exibindo validações de clientes satisfeitos em tempo real.' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-6 group">
                  <item.icon className="w-7 h-7 text-primary shrink-0 group-hover:scale-110 transition-transform duration-500" />
                  <div className="space-y-1">
                    <p className="font-black text-xl font-headline">{item.title}</p>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(
            "relative transition-all duration-1000 delay-500 flex flex-col items-center",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="absolute -inset-6 bg-primary/20 rounded-[3rem] blur-3xl opacity-20 animate-pulse" />
            <Card className="relative border-none shadow-2xl rounded-[3rem] overflow-hidden bg-card ring-1 ring-primary/10 w-full h-[600px]">
              <iframe 
                src="https://www.useproova.online/widgetpublic/EE6Mqdqq4Pc4maNgFy7rNq52ms13/primeiromuralproova" 
                width="100%" 
                height="600px" 
                style={{ border: 'none' }} 
                allowtransparency="true"
              ></iframe>
            </Card>
            
            <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-1000 relative z-20">
              <Link 
                href="/c/proova" 
                className="inline-flex items-center justify-center gap-2 group cursor-pointer text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all py-2 px-4 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 shadow-sm"
              >
                Quer aparecer na nossa página? Deixe sua experiência usando o Proova
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
VersatilitySection.displayName = "VersatilitySection";

/**
 * Seção de Planos e Estratégias (Pricing)
 */
const PricingSection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'base',
      name: "Plano Base",
      price: "Grátis",
      period: "/sempre",
      description: "Fundação de Reputação",
      icon: Shield,
      highlight: false,
      benefits: [
        "1 Mural de Depoimentos",
        "5 Depoimentos Ativos no Link in Bio",
        "Inbox Privado (Filtro de Feedbacks Críticos)",
        "QR Code de Balcão",
        "Link de Coleta Padrão"
      ]
    },
    {
      id: 'gold',
      name: "Plano Gold",
      price: "R$ 49,90",
      period: "/mês",
      description: "Aceleração de Vendas",
      icon: Star,
      highlight: true,
      benefits: [
        "Murais Ilimitados",
        "50 Depoimentos Ativos",
        "G-Boost (Ranqueamento no Google Maps)",
        "Editor VIP Link in Bio",
        "Auto-Publish (Publicação Automática de Depoimentos)",
        "Relatórios de Performance Semanais",
        "Suporte VIP"
      ]
    },
    {
      id: 'enterprise',
      name: "Plano Enterprise",
      price: "R$ 97",
      period: "/mês",
      description: "Domínio de Mercado",
      icon: Zap,
      highlight: false,
      benefits: [
        "Tudo do Gold + Recursos Exclusivos",
        "Vídeo Reviews 4K de Alto Impacto",
        "Depoimentos Ativos Ilimitados",
        "Suporte VIP Dedicado no App",
        "Design de Página Ultra Customizado",
        "Análise Preditiva de Conversão"
      ]
    }
  ];

  return (
    <section id="planos" ref={ref} className="w-full py-24 md:py-32 bg-background overflow-hidden min-h-[500px] border-t">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className={cn(
          "text-center space-y-4 mb-16 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Níveis de Estratégia</h2>
          <h3 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">
            Escolha o seu Nível de <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto]">Autoridade.</span>
          </h3>
          <p className="text-muted-foreground font-medium text-sm md:text-lg max-w-2xl mx-auto">Invista na reputação que acelera suas vendas.</p>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            return (
              <Collapsible
                key={plan.id}
                open={isExpanded}
                onOpenChange={() => setExpandedPlan(isExpanded ? null : plan.id)}
                className="w-full"
              >
                <Card 
                  className={cn(
                    "relative overflow-hidden border-none shadow-xl transition-all duration-300 rounded-3xl",
                    plan.highlight ? "bg-primary text-white" : "bg-card text-card-foreground hover:bg-muted/30 border"
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <div className="p-6 cursor-pointer select-none">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 flex-1 w-full sm:w-auto">
                          <div className={cn(
                            "p-3 rounded-2xl shrink-0 transition-transform duration-500",
                            plan.highlight ? "bg-white/10" : "bg-primary/10"
                          )}>
                            <plan.icon className={cn("w-6 h-6", plan.highlight ? "text-white" : "text-primary")} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className={cn(
                                "text-xl font-black uppercase tracking-tight",
                                plan.id === 'gold' && "inline-block bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-200 to-white animate-text-shine bg-[length:200%_auto]"
                              )}>{plan.name}</h3>
                              {plan.highlight && (
                                <Badge className="bg-white text-primary text-[8px] font-black uppercase h-4 px-1.5 border-none">POPULAR</Badge>
                              )}
                            </div>
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-70", plan.highlight ? "text-white" : "text-primary")}>
                              {plan.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto">
                          <div className="text-right">
                            <p className="text-xl font-black leading-none">{plan.price}</p>
                            <p className="text-[10px] font-bold uppercase opacity-60">{plan.period}</p>
                          </div>
                          <div className={cn(
                            "p-2 rounded-full transition-transform duration-300",
                            isExpanded && "rotate-180",
                            plan.highlight ? "bg-white/10" : "bg-muted"
                          )}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className={cn(
                      "px-6 pb-6 pt-2 space-y-6",
                      plan.highlight ? "border-t border-white/10" : "border-t border-border"
                    )}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                        {plan.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className={cn(
                              "mt-1 p-0.5 rounded-full shrink-0",
                              plan.highlight ? "bg-white/20" : "bg-primary/10"
                            )}>
                              <Check className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-bold leading-relaxed">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        <Link href="/signup" className="w-full">
                          <Button 
                            className={cn(
                              "w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 gap-2",
                              plan.highlight 
                                ? "bg-white text-primary hover:bg-zinc-100" 
                                : "bg-primary text-white hover:bg-primary/90"
                            )}
                          >
                            Garantir Acesso <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
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

/**
 * Rodapé Institucional
 */
const Footer = () => {
  return (
    <footer className="py-20 border-t bg-background">
      <div className="container px-4 mx-auto flex flex-col items-center gap-12 text-center">
        <div className="relative w-[200px] h-[60px] opacity-40 grayscale">
           <Image 
             src="/logo-proova-landing-white-mode.png" 
             alt="Logo Proova Footer Light" 
             fill 
             className="dark:hidden object-contain" 
           />
           <Image 
             src="/logo-proova-landing-dark-mode.png" 
             alt="Logo Proova Footer Dark" 
             fill 
             className="hidden dark:block object-contain" 
           />
        </div>
        <div className="space-y-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <Link href="/pricing" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Planos</Link>
            <Link href="/login" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Login Membro</Link>
            <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"><Scale className="w-4 h-4" /> Termos</Link>
            <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"><Lock className="w-4 h-4" /> Privacidade</Link>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">
              © 2026 PROOVA TECHNOLOGY - INTELIGÊNCIA EM REPUTAÇÃO E CONVERSÃO
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- MAIN PAGE ---

export default function Home() {
  const { user, loading } = useUser();
  const db = useFirestore();
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    const heroTimer = setTimeout(() => setIsHeroVisible(true), 100);

    const observerOptions = { 
      threshold: 0, 
      root: null,
      rootMargin: "20% 0px 20% 0px" 
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

    const fallbackTimer = setTimeout(() => {
      setIsAgitationVisible(true);
      setIsPillarsVisible(true);
      setIsVersatilityVisible(true);
      setIsPricingVisible(true);
    }, 2500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(heroTimer);
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!db) return;
    const trackVisit = async () => {
      try {
        const hasVisited = sessionStorage.getItem('proova_visited');
        if (!hasVisited) {
          const statsRef = doc(db, 'platform_stats', 'landing_page');
          await setDoc(statsRef, { visitorCount: increment(1) }, { merge: true });
          sessionStorage.setItem('proova_visited', 'true');
        }
      } catch (err) {
        console.warn("Falha silenciosa ao rastrear visita:", err);
      }
    };
    trackVisit();
  }, [db]);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dash');
    }
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

  if (loading || user) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body overflow-x-hidden">
      <Navigation 
        isScrolled={isScrolled} 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen} 
        scrollToSection={scrollToSection} 
      />

      <main className="flex-1 pt-20">
        <HeroSection isVisible={isHeroVisible} />
        
        <AgitationSection 
          ref={agitationRef} 
          isVisible={isAgitationVisible} 
        />
        
        <PillarsSection 
          ref={pillarsRef} 
          isVisible={isPillarsVisible} 
        />
        
        <VersatilitySection 
          ref={versatilityRef} 
          isVisible={isVersatilityVisible} 
        />

        <PricingSection 
          ref={pricingRef}
          isVisible={isPricingVisible}
        />
        
        <section className="relative w-full py-24 md:py-36 bg-black text-white overflow-hidden">
          <Image src="https://picsum.photos/seed/ctabg88/1920/1080" alt="CTA Bg" fill className="object-cover opacity-20 grayscale brightness-50" data-ai-hint="tech abstract" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-primary/10" />
          
          <div className="container relative z-10 px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center space-y-10">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-7xl font-black font-headline tracking-tighter leading-[1]">
                  Pronto para elevar o <span className="text-primary italic">Patamar</span> da sua marca?
                </h2>
                <p className="max-w-lg mx-auto text-base md:text-2xl font-medium text-white/80">
                  Assuma a liderança do seu setor através da prova social estratégica.
                </p>
              </div>
              <div className="flex flex-col items-center gap-5">
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto h-16 md:h-20 px-12 rounded-2xl text-sm md:text-xl font-black shadow-2xl hover:scale-105 transition-all bg-white text-black hover:bg-white/90">
                    GARANTIR MEU ACESSO ESTRATÉGICO
                  </Button>
                </Link>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                  ⭐ Junte-se a centenas de empresas que dominam seu nicho com a Proova.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
