'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Star, CheckCircle2, Link2, ShieldCheck, Zap, Loader2, ArrowRight, MapPin, Inbox, Layout, Scale, Lock } from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, increment } from "firebase/firestore";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Rastreamento de Conversão: Contador de Visitantes Únicos (por sessão)
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
        console.warn("Falha silenciosa ao rastrear visita (possível bloqueador ou permissão):", err);
      }
    };

    trackVisit();
  }, [db]);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dash');
    }
  }, [user, loading, router]);

  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-saas');
  const heroBg = PlaceHolderImages.find(img => img.id === 'hero-bg-photo');
  const ctaBg = PlaceHolderImages.find(img => img.id === 'cta-bg-photo');
  
  const avatars = [
    PlaceHolderImages.find(img => img.id === 'avatar-1'),
    PlaceHolderImages.find(img => img.id === 'avatar-2'),
    PlaceHolderImages.find(img => img.id === 'avatar-3'),
  ];

  const testimonials = [
    {
      name: "Dra. Juliana S.",
      company: "Clínica OdontoLife",
      text: "Minha visibilidade no Google Maps dobrou desde que comecei a usar o Proova para redirecionar os elogios 5 estrelas.",
      avatar: avatars[0]
    },
    {
      name: "Marcos R.",
      company: "SaaS Builder",
      text: "O Mural Masonry na minha Landing Page deu uma cara profissional que eu não conseguia antes. A conversão subiu 30%.",
      avatar: avatars[1]
    },
    {
      name: "Carla T.",
      company: "Boutique Fashion",
      text: "O Inbox Privado me salvou. Resolvi dois problemas de clientes insatisfeitos antes de virarem reclamações públicas.",
      avatar: avatars[2]
    }
  ];

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body overflow-x-hidden">
      <header className="px-2 lg:px-4 h-20 md:h-28 flex items-center justify-between border-b sticky top-0 bg-background/80 backdrop-blur-md z-[100]">
        <div className="flex items-center font-bold text-xl tracking-tight relative w-[220px] h-[75px] md:w-[340px] md:h-[105px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="dark:hidden object-contain" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="hidden dark:block object-contain" priority />
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          <Link href="/pricing" className="hidden sm:block text-sm font-bold hover:text-primary transition-colors">Planos</Link>
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="font-bold">Entrar</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="font-bold shadow-lg px-4 h-9 text-xs md:text-sm">Cadastro Grátis</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative w-full py-12 md:py-32 lg:py-48 flex items-center justify-center overflow-hidden">
          {heroBg && (
            <div className="absolute inset-0 z-0">
              <Image 
                src={heroBg.imageUrl} 
                alt="Background" 
                fill 
                priority 
                className="object-cover opacity-20 dark:opacity-10 grayscale-[50%]"
                data-ai-hint={heroBg.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
            </div>
          )}
          
          <div className="container relative z-10 px-4 md:px-6 mx-auto">
            <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1.2fr_1fr] items-center">
              <div className="flex flex-col justify-center space-y-6 md:space-y-8 text-center lg:text-left">
                <div className="space-y-4 md:space-y-6">
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-[10px] md:text-sm font-bold text-primary border border-primary/20 mx-auto lg:mx-0 w-fit backdrop-blur-sm">
                    💎 Onde a confiança vira lucro
                  </div>
                  <h1 className="text-3xl font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline max-w-[800px] leading-[1.1] md:leading-[1.05]">
                    Transforme elogios em <span className="text-primary italic">Máquinas de Vendas</span>.
                  </h1>
                  <h2 className="max-w-[600px] text-muted-foreground text-base md:text-xl lg:text-2xl/relaxed mx-auto lg:mx-0 font-medium leading-relaxed">
                    Colete depoimentos, domine o <strong>SEO Local no Google</strong> e proteja sua marca com o ecossistema definitivo de prova social.
                  </h2>
                </div>
                
                <div className="space-y-4 flex flex-col items-center lg:items-start">
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto h-14 md:h-16 px-6 md:px-10 rounded-2xl text-lg md:text-xl font-black shadow-[0_20px_40px_-15px_rgba(249,115,22,0.4)] transition-all hover:scale-105 active:scale-95 group"
                    >
                      Começar Gratuitamente <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Setup em 2 min</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Sem Cartão</span>
                  </div>
                </div>
              </div>
              
              <div className="relative group mx-auto lg:mx-0 w-full max-w-[550px] lg:max-w-none px-4 sm:px-0">
                <div className="absolute -inset-2 md:-inset-4 bg-primary/20 rounded-[2rem] md:rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border-4 md:border-8 border-background shadow-2xl bg-card">
                  {heroImage && (
                    <Image
                      src={heroImage.imageUrl}
                      alt="Dashboard Proova"
                      fill
                      priority
                      className="object-cover transition duration-500 group-hover:scale-105"
                      data-ai-hint={heroImage.imageHint}
                    />
                  )}
                  <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 bg-background/95 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border shadow-2xl border-primary/10">
                    <div className="flex gap-1 mb-2 md:mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-xs md:text-base italic mb-3 md:mb-4 font-bold text-foreground">"Ficamos em 1º no Google Maps após usar o redirecionamento do Proova!"</p>
                    <div className="flex items-center gap-3 border-t pt-3 md:pt-4">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center text-[8px] md:text-[10px] font-black text-primary border border-primary/20">JD</div>
                      <div className="flex flex-col">
                        <span className="text-[10px] md:text-xs font-black">João D.</span>
                        <span className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Dono de Negócio Local</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ECOSYSTEM FEATURES */}
        <section className="w-full py-16 md:py-32 bg-muted/30 relative">
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6 text-center mb-12 md:mb-16">
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tighter sm:text-4xl md:text-5xl font-headline">
                  O Ecossistema <span className="text-primary italic">Proova</span>.
                </h2>
                <p className="max-w-[800px] text-muted-foreground text-sm md:text-xl font-medium">
                  Três pilares projetados para escalar sua autoridade e proteger sua imagem.
                </p>
              </div>
            </div>
            
            <div className="grid gap-6 md:gap-8 md:grid-cols-3">
              <div className="bg-card border rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="h-1.5 w-full bg-primary absolute top-0 left-0" />
                <div className="space-y-4 md:space-y-6">
                  <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-primary/5 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-all">
                    <MapPin className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black font-headline">Boost no Google</h3>
                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed font-medium">
                    Detectamos elogios 4 e 5 estrelas e incentivamos o cliente a replicar a nota no seu <strong>Google Business</strong>. SEO Local no piloto automático.
                  </p>
                </div>
              </div>

              <div className="bg-card border rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="h-1.5 w-full bg-primary absolute top-0 left-0" />
                <div className="space-y-4 md:space-y-6">
                  <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-primary/5 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-all">
                    <Inbox className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black font-headline">Reputation Shield</h3>
                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed font-medium">
                    Feedbacks críticos (1-3 estrelas) caem no seu <strong>Inbox Privado</strong>. Resolva o problema internamente e evite reclamações públicas.
                  </p>
                </div>
              </div>

              <div className="bg-card border rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="h-1.5 w-full bg-primary absolute top-0 left-0" />
                <div className="space-y-4 md:space-y-6">
                  <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-primary/5 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-all">
                    <Layout className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black font-headline">Widgets de Elite</h3>
                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed font-medium">
                    Murais Masonry, Carrosséis dinâmicos e Popups de conversão. Instale no seu site em minutos com um único snippet de código.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VERSATILITY SECTION */}
        <section className="w-full py-16 md:py-32 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6 md:space-y-8">
                <div className="space-y-4">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight font-headline">
                    Para quem vende no <span className="text-primary">balcão</span> ou na <span className="text-primary">nuvem</span>.
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground font-medium">
                    90% dos seus clientes buscam prova social antes de comprar. Nós capturamos essa autoridade onde quer que você esteja.
                  </p>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <div className="flex gap-4">
                    <div className="bg-green-500/10 p-3 rounded-xl text-green-600 h-fit shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-base md:text-lg">Negócios Locais</p>
                      <p className="text-muted-foreground text-xs md:text-sm">Restaurantes, clínicas e lojas. Gere o <strong>Cartaz de Balcão (PDF)</strong> com QR Code e domine sua região.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-xl text-blue-600 h-fit shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-base md:text-lg">Produtos Digitais & SaaS</p>
                      <p className="text-muted-foreground text-xs md:text-sm">Landing Pages e Apps. Use o <strong>Popup de Notificação</strong> para provar que pessoas reais estão usando seu produto.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl text-primary h-fit shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-base md:text-lg">Link na Bio VIP</p>
                      <p className="text-muted-foreground text-xs md:text-sm">Use sua <strong>Página Pública</strong> com slug personalizado no Instagram. Seus elogios rotacionando 24h por dia.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative mt-8 md:mt-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-[2rem] md:rounded-[3rem] blur opacity-25"></div>
                <Card className="relative border-none shadow-2xl rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-muted/20 p-2">
                  <div className="grid grid-cols-1 gap-2 p-1 md:p-2">
                    {testimonials.map((t, i) => (
                      <div key={i} className="bg-background p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 200}ms` }}>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-2.5 h-2.5 md:w-3 md:h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-[10px] md:text-xs italic font-medium text-foreground mb-3 md:mb-4">"{t.text}"</p>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[7px] md:text-[8px] font-black text-primary uppercase">{t.name.substring(0, 2)}</div>
                          <div className="flex flex-col">
                            <span className="text-[10px] md:text-xs font-black">{t.name}</span>
                            <span className="text-[7px] md:text-[8px] text-muted-foreground uppercase font-black tracking-widest">{t.company}</span>
                          </div>
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
        <section className="relative w-full py-20 md:py-48 bg-primary text-primary-foreground overflow-hidden">
          {ctaBg && (
            <div className="absolute inset-0 z-0">
              <Image 
                src={ctaBg.imageUrl} 
                alt="Footer Background" 
                fill 
                className="object-cover opacity-15 grayscale brightness-[0.2]"
                data-ai-hint={ctaBg.imageHint}
              />
              <div className="absolute inset-0 bg-primary/60 backdrop-blur-[2px]" />
            </div>
          )}
          
          <div className="container relative z-10 px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-8 md:space-y-10 text-center">
              <div className="space-y-4 md:space-y-6">
                <h2 className="text-3xl font-black tracking-tighter sm:text-5xl md:text-6xl font-headline leading-[1.1] max-w-4xl">
                  Seja um Membro Fundador da <span className="italic">Proova</span>.
                </h2>
                <p className="max-w-[700px] text-primary-foreground/90 text-base md:text-2xl font-medium mx-auto px-4">
                  Garanta <strong>50% de desconto vitalício</strong> e desbloqueie o poder da prova social profissional hoje.
                </p>
              </div>
              <div className="w-full max-w-sm mx-auto space-y-4 px-4">
                <Link href="/pricing">
                  <Button size="lg" variant="secondary" className="w-full h-14 md:h-16 text-lg md:text-xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-transform rounded-2xl">
                    Ver Planos e Reservar Vaga
                  </Button>
                </Link>
                <p className="text-[9px] md:text-xs text-primary-foreground/70 uppercase tracking-[0.2em] font-black">
                  Vagas limitadas para os primeiros 100 inscritos.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 md:py-20 border-t bg-background relative z-10">
        <div className="container px-4 md:px-6 mx-auto flex flex-col justify-center items-center gap-10 text-center">
          <div className="flex items-center gap-2 relative w-[220px] h-[75px] md:w-[340px] md:h-[105px]">
             <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="dark:hidden object-contain" />
             <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="hidden dark:block object-contain" />
          </div>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
              <Link href="/pricing" className="text-[10px] md:text-xs font-bold hover:text-primary transition-colors uppercase tracking-widest">Preços</Link>
              <Link href="/signup" className="text-[10px] md:text-xs font-bold hover:text-primary transition-colors uppercase tracking-widest">Começar</Link>
              <Link href="/login" className="text-[10px] md:text-xs font-bold hover:text-primary transition-colors uppercase tracking-widest">Login</Link>
              <Link href="/terms" className="text-[10px] md:text-xs font-bold hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1"><Scale className="w-3 h-3" /> Termos</Link>
              <Link href="/privacy" className="text-[10px] md:text-xs font-bold hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1"><Lock className="w-3 h-3" /> Privacidade</Link>
            </div>
            <p className="text-[10px] md:text-sm text-muted-foreground font-bold italic">"Onde a confiança vira conversão."</p>
            <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-[0.2em] md:tracking-[0.3em] font-black opacity-40">
              © 2026 PROOVA TECHNOLOGY
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
