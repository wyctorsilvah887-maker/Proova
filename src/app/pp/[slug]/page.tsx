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
  getDoc
} from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Star, User, Loader2, MessageSquare, MessageCircle, Globe, ArrowRight, ArrowLeft, CheckCircle2, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  useEffect(() => {
    async function resolveSlug() {
      if (!db || !rawSlug) return;
      
      try {
        setIsLoading(true);
        const slug = decodeURIComponent(rawSlug).toLowerCase().trim();
        
        const slugRef = doc(db, 'slugs', slug);
        const slugSnap = await getDoc(slugRef);
        
        if (slugSnap.exists()) {
          const sData = slugSnap.data();
          const uid = sData.userId;
          setTargetUserId(uid);

          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setCompanyName(userSnap.data().companyName);
          }
        } else {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('companySlug', '==', slug), limit(1));
          const userQuerySnap = await getDocs(q);
          
          if (!userQuerySnap.empty) {
            setTargetUserId(userQuerySnap.docs[0].id);
            setCompanyName(userQuerySnap.docs[0].data().companyName);
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

  const layout = ppData?.layout || 'grid';
  const themeColor = ppData?.themeColor || '#f97316';
  const secondaryColor = ppData?.secondaryColor || ''; 
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

  const TestimonialCard = ({ t, index = 0 }: { t: any, index?: number }) => {
    const side = (index + muralIndex) % 2 === 0 ? 'left' : 'right';
    
    return (
      <Card 
        key={`${t.id}-${muralIndex}`}
        className={cn(
          "bg-card rounded-[2.5rem] p-6 sm:p-8 shadow-2xl transition-all duration-500 hover:scale-[1.02] animate-in fill-both border-none",
          side === 'left' ? "slide-in-from-left-full fade-in" : "slide-in-from-right-full fade-in"
        )}
        style={{ 
          boxShadow: `0 20px 40px -20px ${themeColor}25`,
          border: secondaryColor ? `2px solid ${secondaryColor}` : 'none'
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
               <video 
                 src={t.videoUrl} 
                 className="w-full h-full object-cover" 
                 muted 
                 loop 
                 playsInline 
                 autoPlay
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
                {logoUrl && (
                  <div className="flex justify-center">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 relative">
                      <img src={logoUrl} className="w-full h-full object-cover rounded-[2.5rem] shadow-xl border-4 border-background" alt="Logo" />
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <h1 
                    className="text-4xl sm:text-7xl font-black tracking-tighter text-foreground leading-[1.05] max-w-5xl mx-auto"
                    dangerouslySetInnerHTML={{ __html: heroTitle || `O que dizem sobre ${companyName}` }}
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

            <div className="w-full mb-12">
              {customSections.map((section: any) => (
                <section 
                  key={section.id} 
                  className={cn(
                    "py-24 px-6 text-center mb-12",
                    section.variant === 'accent' ? "text-white" : (section.variant === 'dark' ? "bg-black text-white" : "bg-muted/5")
                  )}
                  style={{ backgroundColor: section.variant === 'accent' ? themeColor : undefined }}
                >
                  <div className="max-w-4xl mx-auto space-y-8">
                    <div className="space-y-4">
                      <h2 className="text-3xl sm:text-5xl font-black tracking-tight">{section.title}</h2>
                      {section.subtitle && <div className="text-base font-bold" dangerouslySetInnerHTML={{ __html: section.subtitle }} />}
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

            <main className="px-6 pb-20 space-y-12 flex-1 w-full max-w-[1600px] mx-auto">
              {filteredTestimonials.length === 0 ? (
                <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                  <MessageSquare className="w-12 h-12" />
                  <p className="text-[9px] font-black uppercase">Aguardando depoimentos</p>
                </div>
              ) : (
                <div className="w-full">
                  {layout === 'mural' && (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-12">
                      {visibleDisplayPool.map((t, i) => (
                        <div key={`${t.id}-${muralIndex}-${i}`} className="break-inside-avoid mb-12">
                          <TestimonialCard t={t} index={i} />
                        </div>
                      ))}
                    </div>
                  )}
                  {layout === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
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
        <a 
          href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-3.5 rounded-full shadow-[0_10px_25px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
          title="Fale conosco via WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.348-.883-.788-1.48-1.76-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.187-1.622c1.736.946 3.7 1.444 5.703 1.445h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  );
}
