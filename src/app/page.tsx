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
  Skull,
  ShieldAlert,
  TrendingDown,
  ShieldHalf,
  MousePointerClick,
  Users,
  MessageCircle,
  Menu,
  X,
  MessageSquareQuote,
  Check,
  Target
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
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, increment } from "firebase/firestore";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

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
      <div className="flex items-center relative w-[250px] h-[80px] md:w-[430px] md:h-[150px]">
        <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="dark:hidden object-contain" priority />
        <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="hidden dark:block object-contain" priority />
      </div>
      <div className="flex items-center gap-2 md:gap-6">
        <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-transparent" />
        
        <div className="hidden sm:flex items-center gap-6">
          <Link href="/login" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Entrar</Link>
          <Link href="/signup">
            <Button className="font-black uppercase tracking-widest shadow-lg px-4 h-9 text-[9px] rounded-xl">Começar Agora</Button>
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
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/60">Navegação Digital</span>
                </div>
                <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                  {[
                    { id: 'ocusto-do-silencio', label: 'O Custo do Silêncio', icon: Skull },
                    { id: 'maquina-de-dominio', label: 'Máquina de Domínio', icon: ShieldHalf },
                    { id: 'setores-atendidos', label: 'Setores Atendidos', icon: Target },
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
                        { href: '/login', label: 'Entrar' },
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
                        <Button variant="outline" className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[8px]">Acessar Painel</Button>
                      </Link>
                      <Link href="/signup" className="block" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-2xl">Cadastrar Grátis</Button>
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
        <div className="absolute top-[15%] left-[8%] animate-float opacity-35 text-primary">
          <MessageSquareQuote className="w-16 h-16 md:w-24 md:h-24" />
        </div>
        <div className="absolute top-[20%] right-[12%] animate-float-delayed opacity-35 text-primary">
          <Star className="w-12 h-12 md:w-20 md:h-20 fill-current" />
        </div>
        <div className="absolute bottom-[20%] left-[15%] animate-float-delayed opacity-35 text-primary">
          <Users className="w-20 h-20 md:w-32 md:h-32" />
        </div>
        <div className="absolute bottom-[25%] right-[10%] animate-float opacity-35 text-primary">
          <MessageCircle className="w-14 h-14 md:w-28 md:h-28" />
        </div>
      </div>
      
      <div className="container relative z-10 px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className={cn(
            "inline-flex items-center text-primary px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}>
            Sua invisibilidade drena seu lucro
          </div>
          
          <h1 className={cn(
            "text-3xl font-black tracking-tighter sm:text-5xl md:text-7xl font-headline leading-[1] transition-all duration-1000",
            isVisible ? "animate-in fade-in slide-in-from-left-20 opacity-100" : "opacity-0"
          )}>
            Sua empresa é <span className="inline-block relative px-2 bg-gradient-to-r from-primary via-white via-primary to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-text-shine italic">
              INVISÍVEL
            </span>. <br className="hidden sm:block" /> E isso custa uma fortuna.
          </h1>
          
          <p className={cn(
            "max-w-xl mx-auto text-muted-foreground text-sm md:text-xl font-medium leading-relaxed transition-all duration-1000 delay-300",
            isVisible ? "animate-in fade-in slide-in-from-right-20 opacity-100" : "opacity-0"
          )}>
            92% dos clientes ignoram quem não tem avaliações. Enquanto você espera, seus concorrentes usam <strong className="text-foreground">Prova Social</strong> para roubar suas vendas.
          </p>
          
          <div className={cn(
            "flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 transition-all duration-1000 delay-500",
            isVisible ? "animate-in fade-in slide-in-from-bottom-5 opacity-100" : "opacity-0"
          )}>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-11 px-6 rounded-xl text-[9px] font-black shadow-2xl transition-all hover:scale-105 active:scale-95 group bg-primary hover:bg-primary/90 text-white">
                ESTANCAR PERDA DE VENDAS <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Seção de Agitação (O Custo do Silêncio)
 */
const AgitationSection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  return (
    <section id="ocusto-do-silencio" ref={ref} className="w-full py-24 bg-muted/30 dark:bg-zinc-950 text-foreground dark:text-white overflow-hidden relative border-y border-border/50 dark:border-zinc-900/30 min-h-[400px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      <div className="container px-4 mx-auto text-center space-y-16">
        <div className={cn(
          "space-y-4 transition-all duration-1000",
          isVisible ? "animate-in fade-in zoom-in-95 opacity-100" : "opacity-100 sm:opacity-0"
        )}>
          <h2 className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">O Custo do Silêncio</h2>
          <h3 className="text-3xl md:text-5xl font-black font-headline tracking-tighter leading-tight">
            O custo mortal de ser um <span className="inline-block relative px-2 bg-gradient-to-r from-primary via-white via-primary to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-text-shine italic">
              Zé Ninguém
            </span> para o mercado.
          </h3>
          <p className="max-w-2xl mx-auto text-muted-foreground dark:text-zinc-400 text-sm md:text-base font-medium">Cada minuto que você passa sem Prova Social é um cliente que escolhe o seu vizinho.</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          {[
            { 
              icon: Skull, 
              title: "Negócios Locais: O Cemitério do Maps", 
              desc: "Se o seu concorrente tem 50 avaliações e você tem 5, o Google te enterra. Você não existe para quem pesquisa no celular com dinheiro na mão agora.", 
              animate: false 
            },
            { 
              icon: ShieldAlert, 
              title: "Serviços: O Medo do Pix", 
              desc: "Prestadores sem depoimentos parecem amadores. O cliente entra, sente insegurança e fecha com a agência que 'parece' mais oficial. O medo dele é o seu prejuízo.", 
              animate: true 
            },
            { 
              icon: TrendingDown, 
              title: "Agências: A Fraude da Autoridade", 
              desc: "Como vender marketing se a sua própria marca é silenciosa? A falta de casos de sucesso reais mata sua conversão e faz você implorar por cada contrato.", 
              animate: false 
            }
          ].map((item, idx) => (
            <div key={idx} className={cn(
              "space-y-4 transition-all duration-1000",
              isVisible ? "animate-in fade-in slide-in-from-bottom-10 opacity-100" : "opacity-100 sm:opacity-0"
            )} style={{ transitionDelay: `${(idx + 1) * 200}ms` }}>
              <div className="text-primary flex justify-center">
                <item.icon className={cn("w-12 h-12", item.animate && "animate-pulse")} />
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
 * Seção de Pilares (A Máquina de Domínio)
 */
const PillarsSection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  return (
    <section id="maquina-de-dominio" ref={ref} className="w-full py-24 md:py-32 bg-background border-y overflow-hidden min-h-[500px]">
      <div className="container px-4 mx-auto">
        <div className={cn(
          "text-center space-y-4 mb-20 transition-all duration-1000",
          isVisible ? "animate-in fade-in slide-in-from-bottom-10 opacity-100" : "opacity-100 sm:opacity-0"
        )}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">A Máquina de Domínio</h2>
          <h3 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">Retome o <span className="italic text-primary">Controle</span>.</h3>
          <p className="text-muted-foreground font-medium text-sm md:text-lg max-w-2xl mx-auto">Tecnologias de elite integradas para aniquilar objeções e forçar a conversão imediata.</p>
        </div>
        
        <div className="grid gap-10 lg:grid-cols-3 max-w-6xl mx-auto">
          {[
            { icon: MapPin, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', title: 'G-Boost: Domínio Local', desc: 'Inundamos seu perfil com avaliações 5 estrelas reais. Force o algoritmo do Google a aumentar sua chances de aparecer no topo e roubar os cliques da concorrência.', from: 'slide-in-from-left-20' },
            { icon: ShieldHalf, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', title: 'Blindagem de Marca', desc: 'Nosso Reputation Shield intercepta o ódio antes dele virar público. Resolva crises no Inbox Privado e mantenha sua imagem impecável perante o mercado.', from: 'slide-in-from-bottom-20' },
            { icon: MousePointerClick, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', title: 'Vitrines Magnéticas', desc: 'Widgets hipnóticos que aniquilam dúvidas em segundos. Prove que você é a única escolha segura através de murais e carrosséis com design de alto nível.', from: 'slide-in-from-right-20' }
          ].map((pill, idx) => (
            <Card key={idx} className={cn(
              "group relative p-8 md:p-10 rounded-[2.5rem] border-2 bg-card transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_30px_60px_-15px_rgba(249,115,22,0.1)]",
              pill.border,
              isVisible ? `animate-in fade-in ${pill.from} duration-1000 opacity-100` : "opacity-100 sm:opacity-0"
            )} style={{ transitionDelay: `${(idx + 1) * 150}ms` }}>
              <div className="space-y-6 relative z-10">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                  pill.bg, pill.color
                )}>
                  <pill.icon className="w-8 h-8" />
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-2xl font-black font-headline tracking-tight">{pill.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                    {pill.desc}
                  </p>
                </div>

                <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                   <span className={cn("text-[9px] font-black uppercase tracking-widest flex items-center gap-2", pill.color)}>
                     Ativar Tecnologia <ArrowRight className="w-3 h-3" />
                   </span>
                </div>
              </div>
              
              <div className={cn(
                "absolute -bottom-2 -right-2 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full",
                pill.bg
              )} />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
});
PillarsSection.displayName = "PillarsSection";

/**
 * Seção de Versatilidade (Setores Atendidos)
 */
const VersatilitySection = forwardRef<HTMLElement, { isVisible: boolean }>(({ isVisible }, ref) => {
  return (
    <section id="setores-atendidos" ref={ref} className="w-full py-24 md:py-32 overflow-hidden bg-muted/20 min-h-[500px]">
      <div className="container px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className={cn(
            "space-y-8 transition-all duration-1000",
            isVisible ? "animate-in fade-in slide-in-from-left-10 opacity-100" : "opacity-100 sm:opacity-0"
          )}>
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-black font-headline leading-tight tracking-tight">
                Trabalhamos duro para você ser a <span className="text-primary italic">Única Opção</span>.
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground font-medium italic">
                "Enquanto seus competidores dormem, sua reputação trabalha vendendo por você 24 horas por dia."
              </p>
            </div>

            <div className="space-y-6">
              {[
                { icon: MapPin, title: 'Negócios Locais', desc: 'Domine sua região. Faça com que cada pessoa que pesquise no Maps veja sua empresa como a escolha óbvia.' },
                { icon: Zap, title: 'Serviços & SaaS', desc: 'Mostre que outros já validaram seu trabalho e tiveram sucesso total, eliminando o medo da compra.' }
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
            "relative transition-all duration-1000 delay-500",
            isVisible ? "animate-in fade-in slide-in-from-right-10 opacity-100" : "opacity-100 sm:opacity-0"
          )}>
            <div className="absolute -inset-6 bg-primary/20 rounded-[3rem] blur-3xl opacity-20 animate-pulse" />
            <Card className="relative border-none shadow-2xl rounded-[3rem] overflow-hidden bg-card p-6 ring-1 ring-primary/10">
              <div className="space-y-4 p-2">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="bg-background p-6 rounded-[2rem] border shadow-sm flex flex-col gap-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                      </div>
                      <p className="text-xs md:text-sm italic font-bold leading-relaxed">"Eu estava em dúvida entre três opções, mas depois de ver tantos depoimentos reais, fechei com eles. Foi a melhor decisão!"</p>
                      <div className="flex items-center gap-3 border-t pt-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">SV</div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sucesso Verificado via Proova</span>
                      </div>
                   </div>
                 ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
});
VersatilitySection.displayName = "VersatilitySection";

/**
 * Seção de Chamada Final (CTA)
 */
const CTASection = () => {
  const ctaBg = PlaceHolderImages.find(img => img.id === 'cta-bg-photo');
  return (
    <section className="relative w-full py-24 md:py-36 bg-black text-white overflow-hidden">
      {ctaBg && (
        <Image src={ctaBg.imageUrl} alt="CTA Bg" fill className="object-cover opacity-20 grayscale brightness-50" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-red-950/20" />
      
      <div className="container relative z-10 px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-7xl font-black font-headline tracking-tighter leading-[1] animate-in fade-in slide-in-from-bottom-10 duration-1000">
              Vai aceitar ser a <span className="text-primary italic">Segunda Opção</span>?
            </h2>
            <p className="max-w-lg mx-auto text-base md:text-2xl font-medium text-white/80 animate-in fade-in duration-1000 delay-300">
              A cada minuto sem Prova Social, um cliente desiste de você. Retome o controle agora.
            </p>
          </div>
          <div className="flex flex-col items-center gap-5 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-16 md:h-20 px-12 rounded-2xl text-sm md:text-xl font-black shadow-2xl hover:scale-105 transition-all bg-white text-black hover:bg-white/90">
                GARANTIR MEU DOMÍNIO AGORA
              </Button>
            </Link>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
              🔥 ÚLTIMAS VAGAS COM DESCONTO VITALÍCIO DE LANÇAMENTO
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Rodapé Institucional
 */
const Footer = () => {
  return (
    <footer className="py-20 border-t bg-background">
      <div className="container px-4 mx-auto flex flex-col items-center gap-12 text-center">
        <div className="relative w-[200px] h-[60px] opacity-40 grayscale">
           <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="dark:hidden object-contain" />
           <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="hidden dark:block object-contain" />
        </div>
        <div className="space-y-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <Link href="/pricing" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Planos</Link>
            <Link href="/login" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Entrar</Link>
            <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"><Scale className="w-4 h-4" /> Termos</Link>
            <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"><Lock className="w-4 h-4" /> Privacidade</Link>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">
              © 2026 PROOVA TECHNOLOGY - ONDE A CONFIANÇA VIRA CONVERSÃO
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const agitationRef = useRef<HTMLElement>(null);
  const pillarsRef = useRef<HTMLElement>(null);
  const versatilityRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    const heroTimer = setTimeout(() => setIsHeroVisible(true), 100);

    const observerOptions = { 
      threshold: 0.05, // Aumenta levemente a detecção
      rootMargin: "100px 0px 100px 0px" // Carrega 100px antes de entrar na tela
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id === 'ocusto-do-silencio') setIsAgitationVisible(true);
          if (id === 'maquina-de-dominio') setIsPillarsVisible(true);
          if (id === 'setores-atendidos') setIsVersatilityVisible(true);
        }
      });
    }, observerOptions);

    if (agitationRef.current) observer.observe(agitationRef.current);
    if (pillarsRef.current) observer.observe(pillarsRef.current);
    if (versatilityRef.current) observer.observe(versatilityRef.current);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(heroTimer);
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
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body overflow-x-hidden">
      <Navigation 
        isScrolled={isScrolled} 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen} 
        scrollToSection={scrollToSection} 
      />

      <main className="flex-1">
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
        
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
