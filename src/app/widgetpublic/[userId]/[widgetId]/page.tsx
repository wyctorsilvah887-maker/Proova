'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Star, CheckCircle2, Clock, Play, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

/**
 * Página pública do Widget (Embed VIP)
 * Otimizada para ser "miúda" e ultra-minimalista, com suporte a Scroll Vertical Infinito no layout Grade.
 */
export default function WidgetPublicPage({ params }: { params: Promise<{ userId: string, widgetId: string }> }) {
  const { userId, widgetId } = use(params);
  const db = useFirestore();

  const [widgetData, setWidgetData] = useState<any>(null);
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [muralIndex, setMuralIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!db || !userId || !widgetId) return;

    const widgetRef = doc(db, 'users', userId, 'widgets', widgetId);
    const unsubWidget = onSnapshot(widgetRef, (docSnap) => {
      if (docSnap.exists()) setWidgetData(docSnap.data());
    });

    const testimonialsRef = collection(db, 'users', userId, 'testimonials');
    const tQuery = query(testimonialsRef, where('status', '==', 'approved'));
    const unsubTestimonials = onSnapshot(tQuery, (snapshot) => {
      setAllTestimonials(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubWidget(); unsubTestimonials(); };
  }, [db, userId, widgetId]);

  const filteredTestimonials = useMemo(() => {
    if (!widgetData || !allTestimonials.length) return [];
    const selectedIds = widgetData.selectedTestimonialIds || [];
    return allTestimonials.filter(t => selectedIds.includes(t.id));
  }, [widgetData, allTestimonials]);

  const layout = widgetData?.layout || 'grid';
  const themeColor = widgetData?.themeColor || '#f97316';
  const secondaryColor = widgetData?.secondaryColor || '';

  useEffect(() => {
    if ((layout === 'mural' || layout === 'popup') && filteredTestimonials.length > 0) {
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

  const visibleTestimonials = useMemo(() => {
    if (filteredTestimonials.length === 0) return [];
    
    if (layout === 'mural') {
      const slice = [];
      const count = Math.min(2, filteredTestimonials.length);
      for (let i = 0; i < count; i++) {
        const idx = (muralIndex + i) % filteredTestimonials.length;
        slice.push(filteredTestimonials[idx]);
      }
      return slice;
    }
    
    if (layout === 'popup' || layout === 'carousel') {
      return [filteredTestimonials[muralIndex % filteredTestimonials.length]];
    }
    
    return filteredTestimonials;
  }, [filteredTestimonials, muralIndex, layout]);

  if (!widgetData) return null;

  const TestimonialCard = ({ t, index = 0 }: { t: any, index?: number }) => {
    const side = (index + muralIndex) % 2 === 0 ? 'left' : 'right';
    const hasSecondary = !!secondaryColor && secondaryColor !== 'transparent';
    
    return (
      <Card 
        key={t.id}
        className={cn(
          "rounded-2xl p-4 border-none transition-all duration-700 w-full max-w-full bg-white dark:bg-black text-black dark:text-white",
          layout === 'mural' && !isAnimating && (side === 'left' ? "animate-in fade-in slide-in-from-left-4 duration-700" : "animate-in fade-in slide-in-from-right-4 duration-700"),
          layout === 'popup' && !isAnimating && "animate-in fade-in zoom-in-90 duration-1000"
        )}
        style={{ 
          border: hasSecondary ? `2px solid ${secondaryColor}` : 'none',
          boxShadow: hasSecondary 
            ? `0 0 15px ${secondaryColor}40, 0 10px 30px -10px rgba(0,0,0,0.1)` 
            : `0 10px 30px -10px ${themeColor}15`,
        }}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full border flex items-center justify-center shrink-0 bg-muted/20" style={{ borderColor: `${themeColor}40` }}>
              <User className="w-3.5 h-3.5" style={{ color: themeColor }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-[10px] sm:text-[11px] tracking-tight truncate uppercase leading-none">{t.userName}</p>
              <div className="flex gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("w-2 h-2 sm:w-2.5 sm:h-2.5 fill-current transition-all duration-700", s <= (t.rating || 5) ? "" : "opacity-10")} style={{ color: themeColor }} />
                ))}
              </div>
            </div>
          </div>

          {t.videoUrl && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 group">
               <video src={t.videoUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" muted loop playsInline autoPlay />
               <div className="absolute bottom-2 left-2">
                 <div className="bg-black/60 backdrop-blur-xl px-2 py-1 rounded-full border border-white/10 shadow-2xl">
                   <p className="text-[6px] text-white font-black uppercase tracking-widest flex items-center gap-1.5">
                     <Play className="w-1.5 h-1.5 fill-white" /> Vídeo
                   </p>
                 </div>
               </div>
            </div>
          )}

          {t.text && t.text !== '(Depoimento em Vídeo)' && (
            <div className="relative">
              <p className="opacity-70 font-bold text-[10px] sm:text-[12px] leading-relaxed italic tracking-tight line-clamp-3">
                "{t.text}"
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-muted/20 flex items-center justify-between opacity-50">
            <div className="flex items-center gap-1">
               <Clock className="w-2.5 h-2.5 opacity-50" />
               <span className="text-[6px] font-black uppercase tracking-widest">
                 {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Agora'}
               </span>
            </div>
            <div className="flex items-center gap-1">
               <CheckCircle2 className="w-2 h-2 text-green-500" />
               <span className="text-[6px] font-black uppercase tracking-widest">Verificado</span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen h-screen bg-transparent p-4 sm:p-6 pt-12 sm:pt-16 font-body overflow-hidden">
      <div className="w-full h-full flex flex-col items-center">
        {filteredTestimonials.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-10 animate-pulse">
            <Star className="w-10 h-10 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aguardando Prova Social</p>
          </div>
        ) : (
          <div className="w-full h-full">
            {layout === 'grid' && (
              <div className="relative h-full w-full overflow-hidden">
                <div className="animate-marquee-vertical flex flex-col gap-6">
                  {/* Duplicamos a lista para criar o efeito de loop infinito */}
                  {[...filteredTestimonials, ...filteredTestimonials].map((t, i) => (
                    <TestimonialCard key={`${t.id}-${i}`} t={t} index={i} />
                  ))}
                </div>
              </div>
            )}

            {layout === 'mural' && (
              <div className={cn(
                "grid gap-6 transition-all duration-700",
                visibleTestimonials.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-xs mx-auto"
              )}>
                {visibleTestimonials.map((t, i) => (
                  <div key={`${t.id}-${muralIndex}`} className="flex justify-center">
                    <TestimonialCard t={t} index={i} />
                  </div>
                ))}
              </div>
            )}

            {layout === 'carousel' && (
              <div className="w-full flex items-center justify-center py-6">
                <Carousel setApi={setApi} opts={{ loop: true }} className="w-full max-w-[280px] sm:max-w-md mx-auto">
                  <CarouselContent>
                    {filteredTestimonials.map((t, i) => (
                      <CarouselItem key={t.id} className="p-2 basis-full">
                        <TestimonialCard t={t} index={i} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            )}

            {layout === 'popup' && (
              <div className="flex-1 flex items-center justify-center w-full max-w-xs mx-auto h-full">
                <TestimonialCard t={filteredTestimonials[muralIndex]} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
