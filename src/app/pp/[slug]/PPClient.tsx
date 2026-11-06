
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  doc, 
  onSnapshot
} from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Star, User, Loader2, Globe, ArrowLeft, CheckCircle2, Clock, Play, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

export default function PPClient({ slug }: { slug: string }) {
  const db = useFirestore();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [ppData, setPPData] = useState<any>(null);
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [muralIndex, setMuralIndex] = useState(0);
  const [isStandalone, setIsStandalone] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }
  }, []);

  useEffect(() => {
    async function resolveSlug() {
      if (!db || !slug) return;
      try {
        setIsLoading(true);
        const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('companySlug', '==', decodedSlug), limit(1));
        const userQuerySnap = await getDocs(q);
        if (!userQuerySnap.empty) {
          setTargetUserId(userQuerySnap.docs[0].id);
          setCompanyName(userQuerySnap.docs[0].data().companyName);
        }
      } catch (err) {
        console.error("Erro ao resolver slug:", err);
      } finally {
        setIsLoading(false);
      }
    }
    resolveSlug();
  }, [db, slug]);

  useEffect(() => {
    if (!db || !targetUserId || !slug) return;
    const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();
    const ppRef = doc(db, 'users', targetUserId, 'pp', decodedSlug);
    const unsubPP = onSnapshot(ppRef, (docSnap) => {
      if (docSnap.exists()) setPPData(docSnap.data());
    });
    const testimonialsRef = collection(db, 'users', targetUserId, 'testimonials');
    const tQuery = query(testimonialsRef, where('status', '==', 'approved'));
    const unsubTestimonials = onSnapshot(tQuery, (snapshot) => {
      setAllTestimonials(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubPP(); unsubTestimonials(); };
  }, [db, targetUserId, slug]);

  const filteredTestimonials = useMemo(() => {
    if (!ppData || !allTestimonials.length) return [];
    const selectedIds = ppData.selectedTestimonialIds || [];
    return allTestimonials.filter(t => selectedIds.includes(t.id));
  }, [ppData, allTestimonials]);

  const layout = ppData?.layout || 'grid';
  const themeColor = ppData?.themeColor || '#f97316';
  const secondaryColor = ppData?.secondaryColor || '';
  const logoUrl = ppData?.logoUrl || '';
  const heroTitle = ppData?.heroTitle || `O que dizem sobre ${companyName || 'nós'}`;
  const heroSubtitle = ppData?.heroSubtitle || '';
  const testimonialsTitle = ppData?.testimonialsTitle || '';
  const footerText = ppData?.footerText || `${new Date().getFullYear()} ${companyName || ''}`;
  const showProovaBranding = ppData?.showLogo !== false;
  const whatsappEnabled = ppData?.whatsappEnabled || false;
  const whatsappNumber = ppData?.whatsappNumber || '';
  const externalSiteUrl = ppData?.externalSiteUrl || '';
  const externalSiteButtonText = ppData?.externalSiteButtonText || 'Visitar Site Oficial';
  const customSections = ppData?.customSections || [];

  useEffect(() => {
    if ((layout === 'mural' || layout === 'popup' || layout === 'carousel') && filteredTestimonials.length > 0) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setMuralIndex(prev => (prev + 1) % filteredTestimonials.length);
          setIsAnimating(false);
        }, 500); 
      }, layout === 'popup' ? 8000 : 6000);
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
    if (layout === 'mural') {
      const slice = [];
      for (let i = 0; i < Math.min(2, filteredTestimonials.length); i++) {
        slice.push(filteredTestimonials[(muralIndex + i) % filteredTestimonials.length]);
      }
      return slice;
    }
    if (layout === 'carousel' || layout === 'popup') return [filteredTestimonials[muralIndex % filteredTestimonials.length]];
    return filteredTestimonials;
  }, [filteredTestimonials, muralIndex, layout]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  const TestimonialCard = ({ t, index = 0 }: { t: any, index?: number }) => {
    const hasSecondary = !!secondaryColor && secondaryColor !== 'transparent' && secondaryColor !== '#ffffff';
    const side = (index + muralIndex) % 2 === 0 ? 'left' : 'right';

    return (
      <Card 
        key={`${t.id}-${muralIndex}`}
        className={cn(
          "bg-card rounded-[2.5rem] p-6 sm:p-8 shadow-2xl transition-all duration-700 hover:scale-[1.02] border-none w-full",
          "animate-in fade-in duration-700 ease-out fill-both",
          side === 'left' ? "slide-in-from-left-12" : "slide-in-from-right-12"
        )}
        style={{ 
          boxShadow: `0 20px 40px -20px ${themeColor}25`,
          border: hasSecondary ? `2px solid ${secondaryColor}` : 'none'
        }}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg rotate-3 shrink-0" style={{ backgroundColor: themeColor }}>
                {t.userName?.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-black text-sm text-foreground tracking-tight truncate max-w-[120px]">{t.userName}</p>
                <div className="flex items-center gap-1.5">
                   <CheckCircle2 className="w-2.5 h-2.5 text-green-500 fill-green-500/20" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Verificado</span>
                </div>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn("w-3 h-3", s <= (t.rating || 5) ? "fill-current" : "opacity-20")} style={{ color: themeColor }} />
              ))}
            </div>
          </div>

          {t.videoUrl && (
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl group ring-1 ring-white/10">
               <video src={t.videoUrl} className="w-full h-full object-cover" muted loop playsInline autoPlay />
               <div className="absolute bottom-3 left-3 flex items-center gap-2">
                 <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                   <p className="text-[8px] text-white font-black uppercase tracking-widest flex items-center gap-1.5">
                     <Play className="w-2 h-2 fill-white" /> Vídeo Review
                   </p>
                 </div>
               </div>
            </div>
          )}

          {t.text && t.text !== '(Depoimento em Vídeo)' && (
            <div className="relative">
              <span className="absolute -top-3 -left-2 text-5xl opacity-10 font-serif select-none pointer-events-none" style={{ color: themeColor }}>“</span>
              <p className="text-foreground/90 font-medium text-sm sm:text-base leading-relaxed italic relative z-10 px-2">
                {t.text}
              </p>
            </div>
          )}

          <div className="pt-5 border-t border-muted-foreground/10 flex items-center justify-between">
            <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
            </span>
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background font-body flex flex-col relative overflow-x-hidden text-foreground">
      {!isStandalone && (
        <nav className="h-16 border-b flex items-center px-6 justify-between bg-background/95 backdrop-blur-md sticky top-0 z-[60] shadow-sm">
          <div className="flex items-center gap-2">
             {showProovaBranding && <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">PROOVA</span>}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link href="/dash">
                <Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase gap-2">
                  <ArrowLeft className="w-3 h-3" /> Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase">Início</Button>
              </Link>
            )}
          </div>
        </nav>
      )}

      <div className="flex-1 flex flex-col">
        {!targetUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 opacity-30">
            <Globe className="w-12 h-12 mb-4" />
            <h2 className="text-xl font-bold uppercase tracking-widest">Página não localizada</h2>
          </div>
        ) : (
          <div className="w-full max-w-full mx-auto flex-1 flex flex-col">
            <header className="px-6 text-center py-24 sm:py-32 space-y-8">
              {logoUrl && (
                <div className="flex justify-center">
                  <img src={logoUrl} className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-[2.5rem] shadow-xl border-4 border-background" alt="Logo" />
                </div>
              )}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-7xl font-black tracking-tighter leading-[1.05] max-w-5xl mx-auto" dangerouslySetInnerHTML={{ __html: heroTitle }} />
                {heroSubtitle && (
                  <div className="text-muted-foreground text-lg sm:text-2xl max-w-3xl mx-auto font-medium leading-relaxed italic opacity-80" dangerouslySetInnerHTML={{ __html: heroSubtitle }} />
                )}
              </div>
            </header>

            <div className="w-full">
              {customSections.map((section: any) => (
                <section key={section.id} className={cn("py-24 px-6 text-center", section.variant === 'accent' ? "text-white" : (section.variant === 'dark' ? "bg-black text-white" : "bg-muted/5"))} style={{ backgroundColor: section.variant === 'accent' ? themeColor : undefined }}>
                  <div className="max-w-4xl mx-auto space-y-8">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight">{section.title}</h2>
                    {section.subtitle && (
                       <div className="text-base sm:text-xl leading-relaxed opacity-90 font-bold" dangerouslySetInnerHTML={{ __html: section.subtitle }} />
                    )}
                    <p className="text-base sm:text-xl leading-relaxed opacity-90 font-medium">{section.content}</p>
                    {section.buttonText && (
                      <div className="pt-8">
                        <a href={section.buttonUrl || '#'} className="inline-block" target="_blank" rel="noopener noreferrer">
                          <Button size="lg" className={cn("h-16 px-10 rounded-2xl text-lg font-black gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95", section.variant === 'accent' ? "bg-white text-black hover:bg-white/90" : "")} style={{ backgroundColor: section.variant !== 'accent' ? themeColor : undefined }}>
                            {section.buttonText} <ArrowRight className="w-5 h-5" />
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <main className="px-6 pb-32 max-w-[1600px] mx-auto w-full pt-12 space-y-12">
              {testimonialsTitle && (
                <div className="text-center">
                   <h2 className="text-2xl sm:text-4xl font-black font-headline uppercase tracking-tight" style={{ color: themeColor }}>{testimonialsTitle}</h2>
                </div>
              )}

              <div className={cn(
                "w-full", 
                (layout === 'popup' || layout === 'carousel') ? "max-w-md mx-auto" : (
                   layout === 'mural' 
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-12" 
                    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12"
                )
              )}>
                {layout === 'carousel' ? (
                  <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
                    <CarouselContent>
                      {filteredTestimonials.map((t, i) => (
                        <CarouselItem key={t.id} className="p-4">
                           <TestimonialCard t={t} index={i} />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                ) : (
                  visibleDisplayPool.map((t, i) => (
                    <div key={`${t.id}-${muralIndex}-${i}`} className="flex justify-center">
                      <TestimonialCard t={t} index={i} />
                    </div>
                  ))
                )}
              </div>
            </main>

            <footer className="mt-auto px-6 py-24 text-center space-y-12 border-t bg-muted/5">
              {externalSiteUrl && (
                <a href={externalSiteUrl.startsWith('http') ? externalSiteUrl : `https://${externalSiteUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-12 py-6 rounded-full text-white text-[14px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all" style={{ backgroundColor: themeColor }}>
                  {externalSiteButtonText} <Globe className="w-5 h-5" />
                </a>
              )}
              <div className="flex flex-col items-center gap-2 opacity-30">
                <p className="text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1"><span>©</span> {footerText}</p>
                {showProovaBranding && (
                  <div className="flex items-center justify-center gap-1.5 mt-4">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">POWERED BY PROOVA</span>
                  </div>
                )}
              </div>
            </footer>
          </div>
        )}
      </div>

      {whatsappEnabled && whatsappNumber && (
        <a 
          href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-[0_15px_30px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
          title="Fale conosco via WhatsApp"
        >
          <div className="absolute -inset-2 bg-[#25D366]/20 rounded-full animate-ping group-hover:hidden" />
          <MessageCircle className="w-7 h-7 fill-current" />
        </a>
      )}
    </div>
  );
}
