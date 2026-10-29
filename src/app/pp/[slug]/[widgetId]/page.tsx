'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useFirestore } from '@/firebase';
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
import { Star, User, Loader2, MessageSquare, MessageCircle, Globe, ArrowRight } from 'lucide-react';
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

export default function PublicPage({ params }: { params: Promise<{ slug: string, widgetId: string }> }) {
  const { slug: rawSlug, widgetId } = use(params);
  const db = useFirestore();

  const [isLoading, setIsLoading] = useState(true);
  const [companyData, setCompanyData] = useState<any>(null);
  const [widgetData, setWidgetData] = useState<any>(null);
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [muralIndex, setMuralIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  // Busca Ultra Resiliente pela empresa
  useEffect(() => {
    async function findCompany() {
      if (!db || !rawSlug) return;
      
      try {
        setIsLoading(true);
        const decodedSlug = decodeURIComponent(rawSlug).toLowerCase();
        
        // 1. Tentar busca direta por Document ID (UID)
        const docSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', rawSlug), limit(1)));
        
        if (!docSnap.empty) {
          setTargetUserId(docSnap.docs[0].id);
          setCompanyData(docSnap.docs[0].data());
          return;
        }

        // 2. Variações do Slug para garantir match (trata + como espaço ou hífen)
        const variations = [
          decodedSlug, // odonto+saude-teixeira
          decodedSlug.replace(/\+/g, '-'), // odonto-saude-teixeira (padrão proova)
          decodedSlug.replace(/\+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-'),
          decodedSlug.replace(/-/g, '+'),
        ];

        // Remover duplicatas
        const uniqueVariations = Array.from(new Set(variations));

        for (const v of uniqueVariations) {
          const q = query(collection(db, 'users'), where('companySlug', '==', v), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setTargetUserId(snap.docs[0].id);
            setCompanyData(snap.docs[0].data());
            return;
          }
        }

        // 3. Fallback final: Busca por nome aproximado (se a URL tiver espaços convertidos)
        const probableName = decodedSlug.replace(/[+-]/g, ' ');
        const q3 = query(collection(db, 'users'), where('companyName', '>=', probableName), limit(10));
        const snap3 = await getDocs(q3);
        const match = snap3.docs.find(d => d.data().companyName.toLowerCase() === probableName.toLowerCase());
        if (match) {
          setTargetUserId(match.id);
          setCompanyData(match.data());
          return;
        }
        
      } catch (err) {
        console.error("Erro ao localizar empresa:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    findCompany();
  }, [db, rawSlug]);

  // Carregar dados do Widget e Testemunhos após encontrar o targetUserId
  useEffect(() => {
    if (!db || !targetUserId || !widgetId) return;

    const widgetRef = doc(db, 'users', targetUserId, 'widgets', widgetId);
    const unsubWidget = onSnapshot(widgetRef, (docSnap) => {
      if (docSnap.exists()) {
        setWidgetData(docSnap.data());
      } else {
        setWidgetData(null);
      }
    });

    const testimonialsRef = collection(db, 'users', targetUserId, 'testimonials');
    const tQuery = query(testimonialsRef, where('status', '==', 'approved'));
    const unsubTestimonials = onSnapshot(tQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllTestimonials(docs);
    });

    return () => {
      unsubWidget();
      unsubTestimonials();
    };
  }, [db, targetUserId, widgetId]);

  const filteredTestimonials = useMemo(() => {
    if (!widgetData || !allTestimonials.length) return [];
    const selectedIds = widgetData.selectedTestimonialIds || [];
    return allTestimonials.filter(t => selectedIds.includes(t.id));
  }, [widgetData, allTestimonials]);

  // SEO LOCAL - JSON-LD Calculation
  const seoJsonLd = useMemo(() => {
    if (!companyData || filteredTestimonials.length === 0) return null;

    const avgRating = filteredTestimonials.reduce((acc, t) => acc + (t.rating || 5), 0) / filteredTestimonials.length;

    return {
      "@context": "https://schema.org/",
      "@type": "LocalBusiness",
      "name": companyData.companyName,
      "image": widgetData?.logoUrl || "",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": avgRating.toFixed(1),
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": filteredTestimonials.length,
        "reviewCount": filteredTestimonials.length
      },
      "review": filteredTestimonials.slice(0, 10).map(t => ({
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": t.rating || 5,
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": t.userName
        },
        "reviewBody": t.text,
        "datePublished": t.createdAt?.toDate ? t.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }))
    };
  }, [companyData, widgetData, filteredTestimonials]);

  const layout = widgetData?.layout || 'mural';
  const themeColor = widgetData?.themeColor || '#f97316';
  const secondaryColor = widgetData?.secondaryColor || '#ffffff';
  const whatsappEnabled = widgetData?.whatsappEnabled || false;
  const whatsappNumber = widgetData?.whatsappNumber || '';
  const externalSiteUrl = widgetData?.externalSiteUrl || '';
  const logoUrl = widgetData?.logoUrl || '';
  const customSections = widgetData?.customSections || [];
  
  // Link do Google Maps centralizado no perfil da empresa
  const googleMapsUrl = companyData?.googleMapsUrl || null;
  
  const heroTitle = widgetData?.heroTitle || `O que dizem sobre ${companyData?.companyName || 'nós'}`;
  const heroSubtitle = widgetData?.heroSubtitle || '';
  const testimonialsTitle = widgetData?.testimonialsTitle || '';
  const footerText = widgetData?.footerText || `${new Date().getFullYear()} ${companyData?.companyName || ''}`;
  const showProovaBranding = widgetData?.showLogo !== false;

  // Efeito de rotação limitado a 5 visíveis
  useEffect(() => {
    if ((layout === 'mural' || layout === 'grid') && filteredTestimonials.length > 5) {
      const interval = setInterval(() => setMuralIndex(prev => (prev + 1) % filteredTestimonials.length), 7000);
      return () => clearInterval(interval);
    }
  }, [layout, filteredTestimonials]);

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
      {/* Dynamic SEO JSON-LD Script */}
      {seoJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seoJsonLd) }}
        />
      )}

      <nav className="h-16 border-b flex items-center px-6 justify-between bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {showProovaBranding && (
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">PROOVA</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/"><Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase tracking-widest">Início</Button></Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col">
        {!targetUserId ? (
           <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
             <MessageSquare className="w-12 h-12 text-muted-foreground/20" />
             <h2 className="text-xl font-bold">Empresa não localizada</h2>
             <p className="text-muted-foreground text-sm">Verifique se o link está correto ou se a empresa ainda está ativa.</p>
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
                  <h1 className="text-4xl sm:text-7xl font-black tracking-tighter text-foreground leading-[1.05] max-w-5xl mx-auto">
                    {heroTitle}
                  </h1>
                  {heroSubtitle && (
                    <p className="text-muted-foreground text-lg sm:text-2xl max-w-3xl mx-auto font-medium leading-relaxed italic opacity-80">
                      {heroSubtitle}
                    </p>
                  )}
                </div>
              </div>
            </header>

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
                      {section.subtitle && <p className="text-xl font-bold opacity-80">{section.subtitle}</p>}
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