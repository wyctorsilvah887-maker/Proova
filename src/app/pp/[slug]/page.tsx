'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  doc, 
  onSnapshot,
} from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Star, User, Loader2, MessageSquare, MessageCircle, Globe, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ThemeToggle } from '@/components/theme-toggle';

export default function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = use(params);
  const db = useFirestore();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [ppData, setPPData] = useState<any>(null);
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [muralIndex, setMuralIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [isStandalone, setIsStandalone] = useState(false);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }
  }, []);

  // Busca o dono do slug no Cartório Global de forma resiliente
  useEffect(() => {
    async function resolveSlug() {
      if (!db || !rawSlug) return;
      
      try {
        setIsLoading(true);
        const slug = decodeURIComponent(rawSlug).toLowerCase().trim();
        
        // 1. Busca na coleção global de slugs (Cartório)
        const slugQuery = query(collection(db, 'slugs'), where('__name__', '==', slug), limit(1));
        const slugSnap = await getDocs(slugQuery);
        
        if (!slugSnap.empty) {
          const sData = slugSnap.docs[0].data();
          const uid = sData.userId;
          setTargetUserId(uid);

          // 2. Busca o nome da empresa e dados básicos no perfil do usuário
          const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', uid), limit(1)));
          if (!userSnap.empty) {
            setCompanyName(userSnap.docs[0].data().companyName);
          }
        }
      } catch (err) {
        console.error("Erro ao resolver slug:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    resolveSlug();
  }, [db, rawSlug]);

  // Carrega as configurações da PP e Testemunhos
  useEffect(() => {
    if (!db || !targetUserId || !rawSlug) return;

    const slug = decodeURIComponent(rawSlug).toLowerCase().trim();
    const ppRef = doc(db, 'users', targetUserId, 'pp', slug);
    
    const unsubPP = onSnapshot(ppRef, (docSnap) => {
      if (docSnap.exists()) {
        setPPData(docSnap.data());
      }
    });

    const testimonialsRef = collection(db, 'users', targetUserId, 'testimonials');
    const tQuery = query(testimonialsRef, where('status', '==', 'approved'));
    
    const unsubTestimonials = onSnapshot(tQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllTestimonials(docs);
    });

    return () => {
      unsubPP();
      unsubTestimonials();
    };
  }, [db, targetUserId, rawSlug]);

  const filteredTestimonials = useMemo(() => {
    if (!ppData || !allTestimonials.length) return [];
    const selectedIds = ppData.selectedTestimonialIds || [];
    return allTestimonials.filter(t => selectedIds.includes(t.id));
  }, [ppData, allTestimonials]);

  // Extração de variáveis com fallbacks seguros
  const layout = ppData?.layout || 'grid';
  const themeColor = ppData?.themeColor || '#f97316';
  const secondaryColor = ppData?.secondaryColor || '#ffffff';
  const whatsappEnabled = ppData?.whatsappEnabled || false;
  const whatsappNumber = ppData?.whatsappNumber || '';
  const externalSiteUrl = ppData?.externalSiteUrl || '';
  const logoUrl = ppData?.logoUrl || '';
  const customSections = ppData?.customSections || [];
  
  const heroTitle = ppData?.heroTitle || `O que dizem sobre ${companyName || 'nós'}`;
  const heroSubtitle = ppData?.heroSubtitle || '';
  const testimonialsTitle = ppData?.testimonialsTitle || '';
  const footerText = ppData?.footerText || `${new Date().getFullYear()} ${companyName || ''}`;
  const showProovaBranding = ppData?.showLogo !== false;

  // Lógica de rotação para layouts estáticos
  useEffect(() => {
    if ((layout === 'mural' || layout === 'grid') && filteredTestimonials.length > 5) {
      const interval = setInterval(() => setMuralIndex(prev => (prev + 1) % filteredTestimonials.length), 7000);
      return () => clearInterval(interval);
    }
  }, [layout, filteredTestimonials]);

  // Lógica de auto-play para carrossel
  useEffect(() => {
    if (!api || layout !== 'carousel') return;
    const interval = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [api, layout]);

  const visibleDisplayPool = useMemo(() => {
    if (filteredTestimonials.length === 0) return [];
    if (layout === 'mural' || layout === 'grid') {
      const slice = [];
      const count = Math.min(5, filteredTestimonials.length);
      for (let i = 0; i < count; i++) {
        const idx = (muralIndex + i) % filteredTestimonials.length;
        slice.push(filteredTestimonials[idx]);
      }
      return slice;
    }
    return filteredTestimonials;
  }, [filteredTestimonials, muralIndex, layout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 font-body">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    );
  }

  const hasValidLogo = logoUrl && logoUrl.startsWith('http');

  const TestimonialCard = ({ t, index = 0 }: { t: any, index?: number }) => {
    const side = (index + muralIndex) % 2 === 0 ? 'left' : 'right';
    return (
      <Card 
        key={`${t.id}-${muralIndex}`}
        className={cn(
          "bg-card rounded-xl p-6 shadow-sm animate-in duration-700 ease-out fill-both",
          side === 'left' ? "slide-in-from-left-full fade-in" : "slide-in-from-right-full fade-in"
        )}
        style={{ 
          borderTopWidth: layout !== 'popup' ? '4px' : '0',
          borderTopColor: layout !== 'popup' ? themeColor : 'transparent',
          borderLeftWidth: layout === 'popup' ? '4px' : '0',
          borderLeftColor: layout === 'popup' ? themeColor : 'transparent',
          backgroundColor: secondaryColor && secondaryColor !== '#ffffff' ? `${secondaryColor}20` : undefined,
          boxShadow: `0 10px 30px -15px ${themeColor}30`
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full shrink-0" style={{ backgroundColor: secondaryColor && secondaryColor !== '#ffffff' ? `${secondaryColor}30` : `${themeColor}15` }}>
              <User className="w-4 h-4" style={{ color: themeColor }} />
            </div>
            <span className="font-bold text-sm text-foreground">{t.userName}</span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: t.rating || 5 }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-current" style={{ color: themeColor }} />
            ))}
          </div>
          {t.text && t.text !== '(Depoimento em Vídeo)' && (
            <p className="text-foreground/80 italic text-sm leading-relaxed">"{t.text}"</p>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background font-body flex flex-col relative overflow-x-hidden text-foreground">
      {!isStandalone && (
        <nav className="h-16 border-b flex items-center px-6 justify-between bg-background/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            {showProovaBranding && (
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">PROOVA</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
               <Link href="/dash"><Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase tracking-widest gap-2"><ArrowLeft className="w-3 h-3" /> Dashboard</Button></Link>
            ) : (
               <Link href="/"><Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase tracking-widest">Início</Button></Link>
            )}
          </div>
        </nav>
      )}

      <div className="flex-1 flex flex-col">
        {!targetUserId ? (
           <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
             <Globe className="w-12 h-12 text-muted-foreground/20" />
             <h2 className="text-xl font-bold">Página não encontrada</h2>
             <p className="text-muted-foreground text-sm">Este link pode ter sido alterado ou está disponível.</p>
           </div>
        ) : (
          <div className="w-full max-w-full mx-auto flex-1 flex flex-col">
            <header className="px-6 text-center space-y-8 py-24 sm:py-32">
              <div className="space-y-6">
                {hasValidLogo && (
                  <div className="flex justify-center">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 relative">
                      <img src={logoUrl} className="w-full h-full object-cover rounded-[2.5rem] shadow-2xl border-4 border-background" alt="Logo Empresa" />
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <h1 
                    className="text-4xl sm:text-7xl font-black tracking-tighter text-foreground leading-[1.05] max-w-5xl mx-auto"
                    dangerouslySetInnerHTML={{ __html: heroTitle }}
                  />
                  {heroSubtitle && (
                    <div 
                      className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto font-medium leading-relaxed italic"
                      dangerouslySetInnerHTML={{ __html: heroSubtitle }}
                    />
                  )}
                </div>
              </div>
            </header>

            {/* SEÇÕES CUSTOMIZADAS */}
            <div className="w-full">
              {customSections.map((section: any) => (
                <section 
                  key={section.id} 
                  className={cn(
                    "py-24 px-6 text-center",
                    section.variant === 'accent' ? "text-white" : (section.variant === 'dark' ? "bg-black text-white" : "bg-muted/5")
                  )}
                  style={{ backgroundColor: section.variant === 'accent' ? themeColor : undefined }}
                >
                  <div className="max-w-4xl mx-auto space-y-8">
                    <div className="space-y-4">
                      <h2 className="text-3xl sm:text-5xl font-black tracking-tight">{section.title}</h2>
                      {section.subtitle && <p className="text-base font-bold">{section.subtitle}</p>}
                    </div>
                    <p className="text-base sm:text-xl leading-relaxed opacity-90 font-medium">{section.content}</p>
                    {section.buttonText && (
                      <div className="pt-8">
                        <a href={section.buttonUrl || '#'} className="inline-block" target="_blank" rel="noopener noreferrer">
                          <Button 
                            size="lg" 
                            className={cn(
                              "h-16 px-10 rounded-2xl text-lg font-black gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95",
                              section.variant === 'accent' ? "bg-white text-black hover:bg-white/90" : ""
                            )}
                            style={{ backgroundColor: section.variant !== 'accent' ? themeColor : undefined }}
                          >
                            {section.buttonText} <ArrowRight className="w-5 h-5" />
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>

            {testimonialsTitle && (
              <div className="text-center py-20">
                <h2 className="text-3xl sm:text-4xl font-black font-headline uppercase tracking-widest" style={{ color: themeColor }}>
                  {testimonialsTitle}
                </h2>
              </div>
            )}

            <main className="px-6 pb-20 space-y-12 flex-1 w-full max-w-[1600px] mx-auto">
              {filteredTestimonials.length === 0 ? (
                <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                  <MessageSquare className="w-12 h-12" />
                  <p className="text-[9px] font-black uppercase">Aguardando depoimentos</p>
                </div>
              ) : (
                <div className="w-full">
                  {layout === 'mural' && (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
                      {visibleDisplayPool.map((t, i) => (
                        <div key={`${t.id}-${muralIndex}-${i}`} className="break-inside-avoid mb-6">
                          <TestimonialCard t={t} index={i} />
                        </div>
                      ))}
                    </div>
                  )}
                  {layout === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:columns-4 gap-6">
                      {visibleDisplayPool.map((t, i) => (
                        <TestimonialCard key={`${t.id}-${muralIndex}-${i}`} t={t} index={i} />
                      ))}
                    </div>
                  )}
                  {layout === 'carousel' && (
                    <Carousel setApi={setApi} opts={{ loop: true }} className="w-full max-w-5xl mx-auto">
                      <CarouselContent>
                        {filteredTestimonials.map((t, i) => (
                          <CarouselItem key={t.id} className="p-4 md:basis-1/2 lg:basis-1/3">
                            <TestimonialCard t={t} index={i} />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  )}
                  {layout === 'popup' && (
                    <div className="max-w-md mx-auto">
                      <TestimonialCard t={filteredTestimonials[muralIndex % filteredTestimonials.length]} />
                    </div>
                  )}
                </div>
              )}
            </main>

            <footer className="mt-auto px-6 py-20 text-center space-y-12 border-t bg-muted/5">
              {externalSiteUrl && (
                <a 
                  href={externalSiteUrl.startsWith('http') ? externalSiteUrl : `https://${externalSiteUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-12 py-6 rounded-full text-white text-[14px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all" 
                  style={{ backgroundColor: themeColor }}
                >
                  Visitar Site Oficial <Globe className="w-5 h-5" />
                </a>
              )}
              <div className="flex flex-col items-center gap-2 opacity-30">
                <p className="text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                  <span>©</span> {footerText}
                </p>
                {showProovaBranding && (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">POWERED BY PROOVA</span>
                  </div>
                )}
              </div>
            </footer>
          </div>
        )}
      </div>

      {whatsappEnabled && whatsappNumber && (
        <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="fixed bottom-8 right-8 z-[100] bg-green-500 text-white p-6 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all">
          <MessageCircle className="w-8 h-8 fill-current" />
        </a>
      )}
    </div>
  );
}
