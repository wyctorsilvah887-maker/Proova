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
  Skull
} from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, increment } from "firebase/firestore";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export default function Home() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Estados para as animações de scroll
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [isAgitationVisible, setIsAgitationVisible] = useState(false);
  const [isPillarsVisible, setIsPillarsVisible] = useState(false);
  const [isVersatilityVisible, setIsVersatilityVisible] = useState(false);

  // Refs para as seções
  const heroRef = useRef(null);
  const agitationRef = useRef(null);
  const pillarsRef = useRef(null);
  const versatilityRef = useRef(null);

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

    // Configuração do Intersection Observer para disparar animações
    const observerOptions = { threshold: 0.1 };
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

    return () => observer.disconnect();
  }, [db]);

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
            <Button className="font-black uppercase tracking-widest shadow-lg px-6 h-10 text-[10px] md:text-xs rounded-xl">Começar Grátis</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION - O PROBLEMA (DOR) */}
        <section ref={heroRef} className="relative w-full py-16 md:py-32 lg:py-48 flex items-center justify-center overflow-hidden">
          {/* Logo Background com cores originais */}
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
                "inline-flex items-center rounded-full bg-red-500/10 px-4 py-1.5 text-[10px] md:text-xs font-black text-red-600 border border-red-500/20 uppercase tracking-[0.2em] backdrop-blur-sm transition-all duration-1000",
                isHeroVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              )}>
                ⚠️ Aviso: Sua invisibilidade digital está matando seu lucro
              </div>
              
              <h1 className={cn(
                "text-4xl font-black tracking-tighter sm:text-6xl md:text-8xl font-headline leading-[0.95] md:leading-[0.9] transition-all duration-1000 delay-300",
                isHeroVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
              )}>
                Seu cliente não <span className="text-primary italic">Confia</span> em você (ainda).
              </h1>
              
              <p className={cn(
                "max-w-3xl mx-auto text-muted-foreground text-base md:text-2xl font-medium leading-relaxed transition-all duration-1000 delay-500",
                isHeroVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
              )}>
                92% dos consumidores ignoram empresas sem avaliações recentes. Enquanto você hesita, seus concorrentes estão roubando seus clientes usando <strong className="text-foreground">Prova Social</strong>.
              </p>
              
              <div className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 transition-all duration-1000 delay-700",
                isHeroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 sm:h-16 md:h-20 px-6 sm:px-10 rounded-2xl text-sm sm:text-lg md:text-xl font-black shadow-[0_20px_50px_-15px_rgba(249,115,22,0.5)] transition-all hover:scale-105 active:scale-95 group">
                    Parar de Perder Dinheiro Agora <ArrowRight className="ml-2 w-4 h-4 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* AGITATION SECTION - AGITANDO A DOR */}
        <section ref={agitationRef} className="w-full py-24 bg-black text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
          <div className="container px-4 mx-auto text-center space-y-16">
            <div className={cn(
              "space-y-4 transition-all duration-1000",
              isAgitationVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}>
              <h2 className="text-primary font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">A Cruel Realidade do Mercado</h2>
              <h3 className="text-3xl md:text-6xl font-black font-headline tracking-tighter">O Custo de ser <span className="text-red-500 italic">Invisível</span>.</h3>
            </div>

            <div className="grid gap-12 lg:grid-cols-3">
              <div className={cn("space-y-6 transition-all duration-1000 delay-300", isAgitationVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
                <div className="text-red-500 flex justify-center"><TrendingDown className="w-12 h-12" /></div>
                <h4 className="text-xl font-bold">O Vácuo das Buscas</h4>
                <p className="text-gray-400 text-sm leading-relaxed">Sem notas 5 estrelas constantes, o Google enterra seu negócio na página 2. Você simplesmente não existe para quem está pronto para comprar agora.</p>
              </div>
              <div className={cn("space-y-6 transition-all duration-1000 delay-500", isAgitationVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
                <div className="text-red-500 flex justify-center"><AlertTriangle className="w-12 h-12" /></div>
                <h4 className="text-xl font-bold">O Terror do Feedback Único</h4>
                <p className="text-gray-400 text-sm leading-relaxed">Um único cliente mal humorado pode destruir sua média e afastar centenas de novos clientes. Você está vulnerável sem uma blindagem de reputação.</p>
              </div>
              <div className={cn("space-y-6 transition-all duration-1000 delay-700", isAgitationVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
                <div className="text-red-500 flex justify-center"><Skull className="w-12 h-12" /></div>
                <h4 className="text-xl font-bold">Hemorragia de Vendas</h4>
                <p className="text-gray-400 text-sm leading-relaxed">Seu tráfego entra no site, sente insegurança e corre para o concorrente que parece "mais confiável". Você está pagando para dar lucro aos outros.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PILLARS SECTION - A SOLUÇÃO (O PROOVA) */}
        <section ref={pillarsRef} className="w-full py-24 md:py-32 bg-muted/20 border-y overflow-hidden">
          <div className="container px-4 mx-auto">
            <div className={cn(
              "text-center space-y-4 mb-20 transition-all duration-1000",
              isPillarsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">A Única Saída</h2>
              <h3 className="text-3xl md:text-6xl font-black font-headline tracking-tighter">O Ecossistema de <span className="italic text-primary">Domínio</span>.</h3>
              <p className="text-muted-foreground font-medium text-sm md:text-xl">Três tecnologias integradas para transformar desconfiança em faturamento recorde.</p>
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
                      Incentivamos seus clientes satisfeitos a inundarem seu Google Maps com notas 5 estrelas. <strong className="text-foreground">Force o Google</strong> a te colocar no topo.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                    <TrendingUp className="w-4 h-4" /> Visibilidade Explosiva
                  </div>
                </div>
              </div>

              {/* Pillar 2: REPUTATION SHIELD */}
              <div className={cn(
                "bg-background border-2 border-orange-500/5 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden duration-1000 delay-500",
                isPillarsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
              )}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500" />
                <div className="space-y-6">
                  <div className="text-orange-600 w-fit transition-all mb-6 group-hover:scale-110 duration-500">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black font-headline">Reputation Shield</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      Filtre críticas antes que elas se tornem públicas. Resolva conflitos no <strong className="text-foreground">Inbox Privado</strong> e blinde sua imagem de ataques externos.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                    <Inbox className="w-4 h-4" /> Blindagem de Marca
                  </div>
                </div>
              </div>

              {/* Pillar 3: CONVERSION PAGES */}
              <div className={cn(
                "bg-background border-2 border-blue-500/5 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden duration-1000 delay-700",
                isPillarsVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
              )}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
                <div className="space-y-6">
                  <div className="text-blue-600 w-fit transition-all mb-6 group-hover:scale-110 duration-500">
                    <Layout className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black font-headline">Páginas de Elite</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      Exiba murais hipnóticos de depoimentos que <strong className="text-foreground">aniquilam a objeção</strong> de compra do seu cliente em segundos.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    <Globe className="w-4 h-4" /> Hipnose de Conversão
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
                    O Proova captura autoridade onde <span className="text-primary italic">importa</span>.
                  </h2>
                  <p className="text-lg text-muted-foreground font-medium italic">
                    "Enquanto seus competidores dormem, sua reputação trabalha 24h por você."
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="flex gap-6 group">
                    <div className="text-primary h-fit group-hover:scale-110 transition-transform duration-500"><MapPin className="w-6 h-6" /></div>
                    <div className="space-y-1">
                      <p className="font-black text-lg">Negócios Locais</p>
                      <p className="text-muted-foreground text-sm font-medium">Domine sua região. Faça com que cada pessoa que pesquise no Maps veja sua empresa como a <strong className="text-foreground">escolha óbvia</strong>.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 group">
                    <div className="text-primary h-fit group-hover:scale-110 transition-transform duration-500"><Sparkles className="w-6 h-6" /></div>
                    <div className="space-y-1">
                      <p className="font-black text-lg">E-commerce & SaaS</p>
                      <p className="text-muted-foreground text-sm font-medium">Reduza o abandono de carrinho. Mostre que centenas de pessoas já validaram seu produto e tiveram <strong className="text-foreground">sucesso absoluto</strong>.</p>
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
                          <p className="text-xs italic font-bold">"Eu estava em dúvida, mas depois de ver tantos elogios, comprei e não me arrependi. Atendimento impecável!"</p>
                          <div className="flex items-center gap-3 border-t pt-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">CV</div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comprador Verificado</span>
                          </div>
                       </div>
                     ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FOUNDER CTA - ABERTURA DE JANELA DE OPORTUNIDADE */}
        <section className="relative w-full py-24 md:py-48 bg-black text-white overflow-hidden">
          {ctaBg && (
            <Image src={ctaBg.imageUrl} alt="CTA Bg" fill className="object-cover opacity-20 grayscale brightness-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-primary/20" />
          
          <div className="container relative z-10 px-4 mx-auto">
            <div className="max-w-4xl mx-auto text-center space-y-10">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-7xl font-black font-headline tracking-tighter leading-[0.95] animate-in fade-in slide-in-from-bottom-20 duration-1000 fill-mode-both">
                  Você vai continuar sendo <span className="text-primary italic">Ignorado</span>?
                </h2>
                <p className="max-w-xl mx-auto text-lg md:text-2xl font-medium text-white/80 animate-in fade-in duration-1000 delay-300 fill-mode-both">
                  O Proova não é apenas um software, é sua arma secreta de vendas. Entre agora ou assista seu concorrente fazer isso primeiro.
                </p>
              </div>
              <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500 fill-mode-both">
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto h-16 md:h-20 px-12 rounded-2xl text-lg md:text-xl font-black shadow-2xl hover:scale-105 transition-all">
                    Garantir Meu Acesso com 50% de Desconto
                  </Button>
                </Link>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                  🔥 OPORTUNIDADE VITALÍCIA PARA OS PRIMEIROS 100 USUÁRIOS
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
                © 2026 PROOVA TECHNOLOGY - A CONFIANÇA É A NOVA MOEDA
              </p>
              <p className="text-[9px] text-primary font-bold uppercase tracking-widest">Tecnologia Brasileira de Alta Conversão</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
