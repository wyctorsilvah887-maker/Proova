'use client';

import { useEffect } from "react";
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
  Sparkles
} from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, increment } from "firebase/firestore";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();

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
      <header className="px-4 lg:px-8 h-20 md:h-28 flex items-center justify-between border-b sticky top-0 bg-background/80 backdrop-blur-md z-[100] animate-in fade-in duration-700">
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
        {/* HERO SECTION */}
        <section className="relative w-full py-16 md:py-32 lg:py-48 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-1000">
            <div className="relative w-full h-full max-w-5xl opacity-[0.25] dark:opacity-[0.35]">
              <Image 
                src="/Logotipo%20PROOVA%20white%20mode%201.png" 
                alt="Logo Background Light" 
                fill 
                className="dark:hidden object-contain" 
                priority 
              />
              <Image 
                src="/Logotipo%20PROOVA%20dark%20mode%201.png" 
                alt="Logo Background Dark" 
                fill 
                className="hidden dark:block object-contain" 
                priority 
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
          </div>
          
          <div className="container relative z-10 px-4 mx-auto">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-[10px] md:text-xs font-black text-primary border border-primary/20 uppercase tracking-[0.2em] backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
                💎 Onde a confiança vira lucro real
              </div>
              
              <h1 className="text-4xl font-black tracking-tighter sm:text-6xl md:text-8xl font-headline leading-[0.95] md:leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                Transforme elogios em <span className="text-primary italic">Vendas</span>.
              </h1>
              
              <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-2xl font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                Domine o <strong>SEO Local no Google</strong>, proteja sua imagem e feche mais negócios com o ecossistema definitivo de prova social.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-16 md:h-20 px-6 sm:px-10 rounded-2xl text-sm sm:text-lg md:text-xl font-black shadow-[0_20px_50px_-15px_rgba(249,115,22,0.5)] transition-all hover:scale-105 active:scale-95 group whitespace-nowrap">
                    Ativar Minha Máquina de Vendas <ArrowRight className="ml-2 w-4 h-4 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-700">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Setup em 2 Minutos</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Sem Cartão de Crédito</span>
              </div>
            </div>
          </div>
        </section>

        {/* THE THREE PILLARS */}
        <section className="w-full py-24 md:py-32 bg-muted/20 border-y overflow-hidden">
          <div className="container px-4 mx-auto">
            <div className="text-center space-y-4 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Os Pilares do Sucesso</h2>
              <h3 className="text-3xl md:text-6xl font-black font-headline tracking-tighter">O Ecossistema <span className="italic">Proova</span>.</h3>
              <p className="text-muted-foreground font-medium text-sm md:text-xl">Três tecnologias integradas para escalar sua autoridade.</p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Pillar 1: G-BOOST */}
              <div className="bg-background border-2 border-primary/5 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-primary/10 text-primary w-fit group-hover:bg-primary group-hover:text-black transition-all">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black font-headline">G-Boost: SEO Local</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      O sistema detecta elogios 5 estrelas e incentiva o redirecionamento imediato para o seu <strong>Google Maps</strong>. Suba nas buscas organicamente.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                    <TrendingUp className="w-4 h-4" /> 2x Mais Visibilidade
                  </div>
                </div>
              </div>

              {/* Pillar 2: REPUTATION SHIELD */}
              <div className="bg-background border-2 border-orange-500/5 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500" />
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-600 w-fit group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black font-headline">Reputation Shield</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      Feedbacks críticos (1-3 estrelas) são filtrados para o seu <strong>Inbox Privado</strong>. Resolva o problema internamente antes que vire uma reclamação pública.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                    <Inbox className="w-4 h-4" /> Proteção de Imagem
                  </div>
                </div>
              </div>

              {/* Pillar 3: CONVERSION PAGES */}
              <div className="bg-background border-2 border-blue-500/5 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 w-fit group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <Layout className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black font-headline">Páginas de Elite</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      Crie seu <strong>Link na Bio VIP</strong> e Murais Masonry. Use a pressão social para reduzir o tempo de decisão do seu cliente em até 70%.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    <Globe className="w-4 h-4" /> Conversão Social Ativa
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VERSATILITY SECTION */}
        <section className="w-full py-24 md:py-48 overflow-hidden">
          <div className="container px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-6xl font-black font-headline leading-tight tracking-tight">
                    Para quem vende no <span className="text-primary">balcão</span> ou na <span className="text-primary">nuvem</span>.
                  </h2>
                  <p className="text-lg text-muted-foreground font-medium italic">
                    "O Proova captura autoridade onde seu cliente estiver."
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <div className="bg-primary/10 p-4 rounded-2xl text-primary h-fit"><MapPin className="w-6 h-6" /></div>
                    <div className="space-y-1">
                      <p className="font-black text-lg">Negócios Locais</p>
                      <p className="text-muted-foreground text-sm font-medium">Gere o <strong>Cartaz de Balcão (PDF)</strong> com QR Code e domine sua região no Google Maps.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                    <div className="bg-primary/10 p-4 rounded-2xl text-primary h-fit"><Sparkles className="w-6 h-6" /></div>
                    <div className="space-y-1">
                      <p className="font-black text-lg">Produtos Digitais & SaaS</p>
                      <p className="text-muted-foreground text-sm font-medium">Use nossos <strong>Widgets Masonry</strong> para injetar prova social direto na sua Landing Page.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">
                    <div className="bg-primary/10 p-4 rounded-2xl text-primary h-fit"><MousePointer2 className="w-6 h-6" /></div>
                    <div className="space-y-1">
                      <p className="font-black text-lg">Profissionais Liberais</p>
                      <p className="text-muted-foreground text-sm font-medium">Link na Bio VIP com <strong>Página Pública</strong>. Seus elógios rotacionando 24h por dia no Instagram.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-3xl opacity-30 animate-pulse" />
                <Card className="relative border-none shadow-2xl rounded-[3rem] overflow-hidden bg-card p-2 md:p-4 ring-1 ring-primary/10">
                  <div className="space-y-3 p-4">
                     {[1, 2, 3].map((i) => (
                       <div key={i} className="bg-background p-6 rounded-[2rem] border shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 200}ms` }}>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                          </div>
                          <p className="text-xs italic font-bold">"Experiência incrível, o atendimento superou as expectativas!"</p>
                          <div className="flex items-center gap-3 border-t pt-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">C{i}</div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliente Verificado</span>
                          </div>
                       </div>
                     ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FOUNDER CTA */}
        <section className="relative w-full py-24 md:py-48 bg-black text-white overflow-hidden">
          {ctaBg && (
            <Image src={ctaBg.imageUrl} alt="CTA Bg" fill className="object-cover opacity-20 grayscale brightness-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-primary/20" />
          
          <div className="container relative z-10 px-4 mx-auto animate-in fade-in duration-1000">
            <div className="max-w-4xl mx-auto text-center space-y-10">
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <h2 className="text-4xl md:text-7xl font-black font-headline tracking-tighter leading-[0.95]">
                  Seja um Membro Fundador da <span className="text-primary italic">Proova</span>.
                </h2>
                <p className="max-w-xl mx-auto text-lg md:text-2xl font-medium text-white/80">
                  Garanta <strong>50% de desconto vitalício</strong> e desbloqueie o poder da prova social profissional hoje mesmo.
                </p>
              </div>
              <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto h-16 md:h-20 px-12 rounded-2xl text-lg md:text-xl font-black shadow-2xl hover:scale-105 transition-all">
                    Reservar Minha Vaga com Desconto
                  </Button>
                </Link>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                  Oferta limitada para os primeiros 100 usuários
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t bg-background animate-in fade-in duration-1000">
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
