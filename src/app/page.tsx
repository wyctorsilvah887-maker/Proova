'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  ArrowRight, 
  MapPin, 
  Inbox, 
  Layout, 
  Scale, 
  Lock,
  Globe,
  TrendingUp,
  MousePointer2,
  Sparkles,
  AlertTriangle,
  TrendingDown,
  Skull,
  ShieldAlert,
  Ghost
} from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, increment } from "firebase/firestore";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export default function Home() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [isAgitationVisible, setIsAgitationVisible] = useState(false);
  const [isPillarsVisible, setIsPillarsVisible] = useState(false);
  const [isVersatilityVisible, setIsVersatilityVisible] = useState(false);

  const heroRef = useRef(null);
  const agitationRef = useRef(null);
  const pillarsRef = useRef(null);
  const versatilityRef = useRef(null);

  // Efeito isolado para rastreio (precisa do db)
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

  // Efeito isolado para animações (NÃO depende do db)
  useEffect(() => {
    const observerOptions = { threshold: 0 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === heroRef.current) setIsHeroVisible(true);
          if (entry.target === agitationRef.current) setIsAgitationVisible(true);
          if (entry.target === pillarsRef.current) setIsPillarsVisible(true);
          if (entry.target === versatilityRef.current) setIsVersatilityVisible(true);
        }
      });
    }, observerOptions);

    if (heroRef.current) observer.observe(heroRef.current);
    if (agitationRef.current) observer.observe(agitationRef.current);
    if (pillarsRef.current) observer.observe(pillarsRef.current);
    if (versatilityRef.current) observer.observe(versatilityRef.current);

    // Forçar visibilidade da Hero no mount se já estiver no topo
    setIsHeroVisible(true);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dash');
    }
  }, [user, loading, router]);

  const ctaBg = PlaceHolderImages.find(img => img.id === 'cta-bg-photo');

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body overflow-x-hidden">
      <header className="px-4 lg:px-8 h-20 md:h-28 flex items-center justify-between border-b sticky top-0 bg-background/80 backdrop-blur-md z-[100]">
        <div className="flex items-center relative w-[180px] h-[50px] md:w-[280px] md:h-[85px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="dark:hidden object-contain" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="hidden dark:block object-contain" priority />
        </div>
        <div className="flex items-center gap-2 md:gap-6">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:block text-sm font-black uppercase tracking-widest hover:text-primary transition-colors">Entrar</Link>
          <Link href="/signup">
            <Button className="font-black uppercase tracking-widest shadow-lg px-6 h-10 text-[10px] md:text-xs rounded-xl">Começar Agora</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION - A DOR AGUDA */}
        <section ref={heroRef} className="relative w-full py-16 md:py-32 lg:py-48 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-full h-full max-w-5xl opacity-[0.25] dark:opacity-[0.35]">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo BG" fill className="dark:hidden object-contain" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo BG" fill className="hidden dark:block object-contain" priority />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
          </div>
          
          <div className="container relative z-10 px-4 mx-auto">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              <div className={cn(
                "inline-flex items-center rounded-full bg-red-600 text-white px-4 py-1.5 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all duration-1000",
                isHeroVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              )}>
                <ShieldAlert className="w-3 h-3 mr-2 animate-pulse" /> Atenção: Sua invisibilidade está drenando seu lucro
              </div>
              
              <h1 className={cn(
                "text-4xl font-black tracking-tighter sm:text-6xl md:text-8xl font-headline leading-[0.95] md:leading-[0.9] transition-all duration-1000 delay-300 fill-mode-both",
                isHeroVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
              )}>
                Sua empresa é <span className="text-red-600 italic">INVISÍVEL</span>. E isso custa caro.
              </h1>
              
              <p className={cn(
                "max-w-3xl mx-auto text-muted-foreground text-base md:text-2xl font-medium leading-relaxed transition-all duration-1000 delay-500 fill-mode-both",
                isHeroVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
              )}>
                92% dos clientes ignoram quem não tem avaliações. Enquanto você espera, seus concorrentes usam <strong className="text-foreground">Prova Social</strong> para roubar suas vendas.
              </p>
              
              <div className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 transition-all duration-1000 delay-700 fill-mode-both",
                isHeroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 sm:h-20 px-6 sm:px-10 rounded-2xl text-[12px] sm:text-lg md:text-xl font-black shadow-[0_20px_50px_-15px_rgba(249,115,22,0.5)] transition-all hover:scale-105 active:scale-95 group">
                    ESTANCAR PERDA DE VENDAS AGORA <ArrowRight className="ml-2 w-4 h-4 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* AGITATION SECTION - CUTUCANDO A FERIDA */}
        <section ref={agitationRef} className="w-full py-24 bg-zinc-950 text-white overflow-hidden relative border-y border-red-900/30">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />
          <div className="container px-4 mx-auto text-center space-y-16">
            <div className={cn(
              "space-y-4 transition-all duration-1000",
              isAgitationVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}>
              <h2 className="text-primary font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">O Abismo Digital</h2>
              <h3 className="text-3xl md:text-6xl font-black font-headline tracking-tighter">O preço de ser um <span className="text-red-600 italic">Zé Ninguém</span> no Google.</h3>
            </div>

            <div className="grid gap-12 lg:grid-cols-3">
              <div className={cn("space-y-6 transition-all duration-1000 delay-300", isAgitationVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
                <div className="text-red-600 flex justify-center"><Ghost className="w-12 h-12" /></div>
                <h4 className="text-xl font-bold font-headline">O Fantasma da Página 2</h4>
                <p className="text-zinc-400 text-sm leading-relaxed font-medium">Sem notas 5 estrelas constantes, o algoritmo te enterra. Você não existe para quem tem dinheiro na mão e quer comprar agora.</p>
              </div>
              <div className={cn("space-y-6 transition-all duration-1000 delay-500", isAgitationVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
                <div className="text-red-600 flex justify-center"><AlertTriangle className="w-12 h-12 animate-pulse" /></div>
                <h4 className="text-xl font-bold font-headline">A Fraqueza de uma Crítica</h4>
                <p className="text-zinc-400 text-sm leading-relaxed font-medium">Um único cliente mal humorado pode destruir sua reputação se você não tiver uma blindagem. Você está à mercê do acaso.</p>
              </div>
              <div className={cn("space-y-6 transition-all duration-1000 delay-700", isAgitationVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
                <div className="text-red-600 flex justify-center"><TrendingDown className="w-12 h-12" /></div>
                <h4 className="text-xl font-bold font-headline">Hemorragia de Lucro</h4>
                <p className="text-zinc-400 text-sm leading-relaxed font-medium">O cliente entra no seu site, sente medo e corre para o concorrente "mais confiável". Você paga pelo tráfego e ele leva a venda.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PILLARS SECTION - A ÚNICA SOLUÇÃO REAL */}
        <section ref={pillarsRef} className="w-full py-24 md:py-32 bg-muted/20 border-y overflow-hidden">
          <div className="container px-4 mx-auto">
            <div className={cn(
              "text-center space-y-4 mb-20 transition-all duration-1000",
              isPillarsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">A Máquina de Domínio</h2>
              <h3 className="text-3xl md:text-6xl font-black font-headline tracking-tighter">Retome o <span className="italic text-primary">Controle</span>.</h3>
              <p className="text-muted-foreground font-medium text-sm md:text-xl">Três tecnologias integradas para aniquilar objeções e forçar a conversão.</p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Pillar 1: G-BOOST */}
              <div className={cn(
                "bg-background border-2 border-primary/5 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden duration-1000 delay-300",
                isPillarsVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
              )}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                <div className="space-y-6">
                  <div className="text-primary w-fit transition-all mb-6 group-hover:scale-110 duration-500">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black font-headline">G-Boost: SEO Local</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      Incentivamos seus clientes satisfeitos a inundarem seu Maps com 5 estrelas. <strong className="text-foreground">Force o Google</strong> a te colocar no topo do bairro.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                    <TrendingUp className="w-4 h-4" /> Autoridade Regional
                  </div>
                </div>
              </div>

              {/* Pillar 2: REPUTATION SHIELD */}
              <div className={cn(
                "bg-background border-2 border-orange-500/5 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden duration-1000 delay-500",
                isPillarsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
              )}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-600" />
                <div className="space-y-6">
                  <div className="text-orange-600 w-fit transition-all mb-6 group-hover:scale-110 duration-500">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black font-headline">Reputation Shield</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      Filtre críticas antes que virem um problema. Resolva crises no <strong className="text-foreground">Inbox Privado</strong> e mantenha sua imagem impecável 24h por dia.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                    <Inbox className="w-4 h-4" /> Blindagem de Imagem
                  </div>
                </div>
              </div>

              {/* Pillar 3: CONVERSION PAGES */}
              <div className={cn(
                "bg-background border-2 border-blue-500/5 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden duration-1000 delay-700",
                isPillarsVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
              )}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />
                <div className="space-y-6">
                  <div className="text-blue-600 w-fit transition-all mb-6 group-hover:scale-110 duration-500">
                    <Layout className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black font-headline">Páginas de Elite</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      Widgets hipnóticos que <strong className="text-foreground">aniquilam dúvidas</strong>. Prove que você é a escolha certa em menos de 3 segundos de navegação.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    <Globe className="w-4 h-4" /> Hipnose de Vendas
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VERSATILITY SECTION */}
        <section ref={versatilityRef} className="w-full py-24 md:py-48 overflow-hidden bg-background">
          <div className="container px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className={cn("space-y-10 transition-all duration-1000", isVersatilityVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20")}>
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-6xl font-black font-headline leading-tight tracking-tight">
                    Trabalhamos duro para você ser a <span className="text-primary italic">Única Opção</span>.
                  </h2>
                  <p className="text-lg text-muted-foreground font-medium italic">
                    "Enquanto seus competidores dormem, sua reputação trabalha vendendo por você."
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="flex gap-6 group">
                    <div className="text-primary h-fit group-hover:scale-110 transition-transform duration-500"><MapPin className="w-6 h-6" /></div>
                    <div className="space-y-1">
                      <p className="font-black text-lg font-headline">Negócios Locais</p>
                      <p className="text-muted-foreground text-sm font-medium">Domine sua região. Faça com que cada pessoa que pesquise no Maps veja sua empresa como a <strong className="text-foreground">escolha óbvia</strong>.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 group">
                    <div className="text-primary h-fit group-hover:scale-110 transition-transform duration-500"><Sparkles className="w-6 h-6" /></div>
                    <div className="space-y-1">
                      <p className="font-black text-lg font-headline">Serviços & SaaS</p>
                      <p className="text-muted-foreground text-sm font-medium">Destrua a barreira da desconfiança. Mostre que outros já validaram seu trabalho e tiveram <strong className="text-foreground">sucesso total</strong>.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={cn("relative transition-all duration-1000 delay-500", isVersatilityVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20")}>
                <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-3xl opacity-30 animate-pulse" />
                <Card className="relative border-none shadow-2xl rounded-[3rem] overflow-hidden bg-card p-2 md:p-4 ring-1 ring-primary/10">
                  <div className="space-y-3 p-4">
                     {[1, 2, 3].map((i) => (
                       <div key={i} className="bg-background p-6 rounded-[2rem] border shadow-sm flex flex-col gap-4 animate-pulse" style={{ animationDelay: `${i * 300}ms` }}>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                          </div>
                          <p className="text-xs italic font-bold">"Eu estava em dúvida, mas depois de ver tantos depoimentos, fechei sem medo. Experiência incrível!"</p>
                          <div className="flex items-center gap-3 border-t pt-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">SV</div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sucesso Verificado</span>
                          </div>
                       </div>
                     ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA - O ÚLTIMO CHAMADO */}
        <section className="relative w-full py-24 md:py-48 bg-black text-white overflow-hidden">
          {ctaBg && (
            <Image src={ctaBg.imageUrl} alt="CTA Bg" fill className="object-cover opacity-20 grayscale brightness-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-red-950/20" />
          
          <div className="container relative z-10 px-4 mx-auto">
            <div className="max-w-4xl mx-auto text-center space-y-10">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-7xl font-black font-headline tracking-tighter leading-[0.95] animate-in fade-in slide-in-from-bottom-20 duration-1000 fill-mode-both">
                  Vai aceitar ser a <span className="text-primary italic">Segunda Opção</span>?
                </h2>
                <p className="max-w-xl mx-auto text-lg md:text-2xl font-medium text-white/80 animate-in fade-in duration-1000 delay-300 fill-mode-both">
                  A cada minuto que você passa sem Prova Social, um cliente desiste de você. Tome o controle agora.
                </p>
              </div>
              <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500 fill-mode-both">
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto h-16 md:h-20 px-12 rounded-2xl text-[12px] sm:text-lg md:text-xl font-black shadow-2xl hover:scale-105 transition-all">
                    GARANTIR MEU DOMÍNIO COM 50% OFF
                  </Button>
                </Link>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                  🔥 ÚLTIMAS VAGAS COM DESCONTO VITALÍCIO
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t bg-background">
        <div className="container px-4 mx-auto flex flex-col items-center gap-12 text-center">
          <div className="relative w-[200px] h-[60px] opacity-40 grayscale">
             <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="dark:hidden object-contain" />
             <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="hidden dark:block object-contain" />
          </div>
          <div className="space-y-8">
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              <Link href="/pricing" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Preços</Link>
              <Link href="/login" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Entrar</Link>
              <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"><Scale className="w-3.5 h-3.5" /> Termos</Link>
              <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Privacidade</Link>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] md:text-xs text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">
                © 2026 PROOVA TECHNOLOGY - DOMÍNIO E REPUTAÇÃO
              </p>
              <p className="text-[9px] text-primary font-bold uppercase tracking-widest">Tecnologia Brasileira de Alta Performance</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
