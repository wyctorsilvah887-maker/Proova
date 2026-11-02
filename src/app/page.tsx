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

  const agitationRef = useRef(null);
  const pillarsRef = useRef(null);
  const versatilityRef = useRef(null);

  useEffect(() => {
    // Ativa Hero com pequeno delay para garantir que comece oculta
    const timer = setTimeout(() => setIsHeroVisible(true), 100);

    const observerOptions = { 
      threshold: 0.1,
      rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === agitationRef.current) setIsAgitationVisible(true);
          if (entry.target === pillarsRef.current) setIsPillarsVisible(true);
          if (entry.target === versatilityRef.current) setIsVersatilityVisible(true);
          observer.unobserve(entry.target); // Ativa apenas uma vez
        }
      });
    }, observerOptions);

    if (agitationRef.current) observer.observe(agitationRef.current);
    if (pillarsRef.current) observer.observe(pillarsRef.current);
    if (versatilityRef.current) observer.observe(versatilityRef.current);

    return () => {
      clearTimeout(timer);
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
      <header className="px-4 lg:px-8 h-20 flex items-center justify-between border-b sticky top-0 bg-background/80 backdrop-blur-md z-[100]">
        <div className="flex items-center relative w-[160px] h-[45px] md:w-[220px] md:h-[65px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="dark:hidden object-contain" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="hidden dark:block object-contain" priority />
        </div>
        <div className="flex items-center gap-2 md:gap-6">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:block text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Entrar</Link>
          <Link href="/signup">
            <Button className="font-black uppercase tracking-widest shadow-lg px-4 h-9 text-[9px] rounded-xl">Começar Agora</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION - COMPACTA E PERSUASIVA */}
        <section className="relative w-full py-12 md:py-20 lg:py-28 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-full h-full max-w-xl opacity-[0.2] dark:opacity-[0.3]">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo BG" fill className="dark:hidden object-contain" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo BG" fill className="hidden dark:block object-contain" priority />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
          </div>
          
          <div className="container relative z-10 px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className={cn(
                "inline-flex items-center rounded-full bg-primary text-white px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-xl transition-all duration-1000",
                isHeroVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              )}>
                <ShieldAlert className="w-3.5 h-3.5 mr-2 animate-pulse" /> Atenção: Sua invisibilidade drena seu lucro
              </div>
              
              <h1 className={cn(
                "text-3xl font-black tracking-tighter sm:text-5xl md:text-7xl font-headline leading-[1.05] transition-all duration-1000",
                isHeroVisible ? "animate-in fade-in slide-in-from-left-20 opacity-100" : "opacity-0"
              )}>
                Sua empresa é <span className="text-primary italic">INVISÍVEL</span>. <br className="hidden sm:block" /> E isso custa uma fortuna.
              </h1>
              
              <p className={cn(
                "max-w-xl mx-auto text-muted-foreground text-sm md:text-xl font-medium leading-relaxed transition-all duration-1000 delay-300",
                isHeroVisible ? "animate-in fade-in slide-in-from-right-20 opacity-100" : "opacity-0"
              )}>
                92% dos clientes ignoram quem não tem avaliações. Enquanto você espera, seus concorrentes usam <strong className="text-foreground">Prova Social</strong> para roubar suas vendas.
              </p>
              
              <div className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 transition-all duration-1000 delay-500",
                isHeroVisible ? "animate-in fade-in slide-in-from-bottom-5 opacity-100" : "opacity-0"
              )}>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-2xl text-[10px] sm:text-sm font-black shadow-2xl transition-all hover:scale-105 active:scale-95 group bg-primary hover:bg-primary/90">
                    ESTANCAR PERDA DE VENDAS <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* AGITATION SECTION - O ABISMO */}
        <section ref={agitationRef} className="w-full py-24 bg-zinc-950 text-white overflow-hidden relative border-y border-red-900/30">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />
          <div className="container px-4 mx-auto text-center space-y-16">
            <div className={cn(
              "space-y-4 transition-all duration-1000",
              isAgitationVisible ? "animate-in fade-in zoom-in-95 opacity-100" : "opacity-0"
            )}>
              <h2 className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">O Abismo Digital</h2>
              <h3 className="text-3xl md:text-5xl font-black font-headline tracking-tighter leading-tight">O preço de ser um <span className="text-red-600 italic">Zé Ninguém</span> no Google.</h3>
            </div>

            <div className="grid gap-12 lg:grid-cols-3">
              {[
                { icon: Ghost, title: "O Fantasma da Página 2", desc: "Sem notas 5 estrelas constantes, o algoritmo te enterra. Você não existe para quem tem dinheiro na mão." },
                { icon: AlertTriangle, title: "A Fraqueza de uma Crítica", desc: "Um único cliente mal humorado pode destruir sua reputação se você não tiver uma blindagem ativa.", animate: true },
                { icon: TrendingDown, title: "Hemorragia de Lucro", desc: "O cliente entra, sente medo e corre para o concorrente. Você paga pelo anúncio e ele leva a venda." }
              ].map((item, idx) => (
                <div key={idx} className={cn(
                  "space-y-4 transition-all duration-1000",
                  isAgitationVisible ? `animate-in fade-in slide-in-from-bottom-10 opacity-100 delay-[${(idx+1)*200}ms]` : "opacity-0"
                )}>
                  <div className="text-red-600 flex justify-center">
                    <item.icon className={cn("w-12 h-12", item.animate && "animate-pulse")} />
                  </div>
                  <h4 className="text-xl font-bold font-headline">{item.title}</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PILLARS SECTION - A SOLUÇÃO */}
        <section ref={pillarsRef} className="w-full py-24 md:py-32 bg-muted/20 border-y overflow-hidden">
          <div className="container px-4 mx-auto">
            <div className={cn(
              "text-center space-y-4 mb-20 transition-all duration-1000",
              isPillarsVisible ? "animate-in fade-in slide-in-from-bottom-10 opacity-100" : "opacity-0"
            )}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">A Máquina de Domínio</h2>
              <h3 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">Retome o <span className="italic text-primary">Controle</span>.</h3>
              <p className="text-muted-foreground font-medium text-sm md:text-lg max-w-2xl mx-auto">Tecnologias integradas para aniquilar objeções e forçar a conversão imediata.</p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3">
              {[
                { icon: MapPin, color: 'text-primary', bar: 'bg-primary', title: 'G-Boost: SEO Local', desc: 'Incentivamos seus clientes satisfeitos a inundarem seu Maps com 5 estrelas. Force o Google a te colocar no topo.', from: 'slide-in-from-left-20' },
                { icon: ShieldCheck, color: 'text-orange-600', bar: 'bg-orange-600', title: 'Reputation Shield', desc: 'Filtre críticas antes que virem um problema. Resolva crises no Inbox Privado e mantenha sua imagem impecável.', from: 'slide-in-from-bottom-20' },
                { icon: Layout, color: 'text-blue-600', bar: 'bg-blue-600', title: 'Páginas de Elite', desc: 'Widgets hipnóticos que aniquilam dúvidas. Prove que você é a escolha certa em segundos com designs exclusivos.', from: 'slide-in-from-right-20' }
              ].map((pill, idx) => (
                <div key={idx} className={cn(
                  "bg-card border-2 border-primary/5 rounded-[2.5rem] p-10 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden",
                  isPillarsVisible ? `animate-in fade-in ${pill.from} duration-1000 opacity-100 delay-[${(idx+1)*200}ms]` : "opacity-0"
                )}>
                  <div className={cn("absolute top-0 left-0 w-full h-1.5", pill.bar)} />
                  <div className="space-y-5">
                    <pill.icon className={cn("w-10 h-10 group-hover:scale-110 transition-transform duration-500", pill.color)} />
                    <h4 className="text-2xl font-black font-headline">{pill.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      {pill.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VERSATILITY SECTION */}
        <section ref={versatilityRef} className="w-full py-24 md:py-32 overflow-hidden bg-background">
          <div className="container px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 md:gap-24 items-center">
              <div className={cn(
                "space-y-8 transition-all duration-1000",
                isVersatilityVisible ? "animate-in fade-in slide-in-from-left-10 opacity-100" : "opacity-0"
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
                    { icon: Sparkles, title: 'Serviços & SaaS', desc: 'Mostre que outros já validaram seu trabalho e tiveram sucesso total, eliminando o medo da compra.' }
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
                isVersatilityVisible ? "animate-in fade-in slide-in-from-right-10 opacity-100" : "opacity-0"
              )}>
                <div className="absolute -inset-6 bg-primary/20 rounded-[3rem] blur-3xl opacity-20 animate-pulse" />
                <Card className="relative border-none shadow-2xl rounded-[3rem] overflow-hidden bg-card p-6 ring-1 ring-primary/10">
                  <div className="space-y-4 p-2">
                     {[1, 2, 3].map((i) => (
                       <div key={i} className="bg-background p-6 rounded-[2rem] border shadow-sm flex flex-col gap-4 animate-pulse" style={{ animationDelay: `${i * 300}ms` }}>
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

        {/* FINAL CTA */}
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
      </main>

      <footer className="py-20 border-t bg-background">
        <div className="container px-4 mx-auto flex flex-col items-center gap-12 text-center">
          <div className="relative w-[200px] h-[60px] opacity-40 grayscale">
             <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="dark:hidden object-contain" />
             <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="hidden dark:block object-contain" />
          </div>
          <div className="space-y-8">
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              <Link href="/pricing" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Preços</Link>
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
    </div>
  );
}
