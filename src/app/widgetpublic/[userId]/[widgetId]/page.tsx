'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Star, CheckCircle2, Clock, Play } from 'lucide-react';
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
 * Renderiza o mural de depoimentos com visual Premium VIP.
 * Otimizada para temas menores e dispositivos móveis.
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
    
    return (
      <Card 
        key={t.id}
        className={cn(
          "rounded-[2.5rem] p-6 sm:p-10 border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-700 hover:scale-[1.02] w-full max-w-full ring-1 ring-white/5",
          layout === 'grid' && "animate-in fade-in zoom-in-95 duration-500",
          layout === 'mural' && !isAnimating && (side === 'left' ? "animate-in fade-in slide-in-from-left-8 duration-700" : "animate-in fade-in slide-in-from-right-8 duration-700"),
          layout === 'popup' && !isAnimating && "animate-in fade-in zoom-in-90 duration-1000"
        )}
        style={{ 
          backgroundColor: secondaryColor || '#111111',
          boxShadow: `0 30px 70px -20px ${themeColor}30, 0 20px 40px -20px rgba(0,0,0,0.5)`,
        }}
      >
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-2.5 w-2.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.4)]" style={{ backgroundColor: themeColor }} />
              <div className="min-w-0">
                <p className="font-black text-[13px] sm:text-lg text-white tracking-tighter truncate max-w-[120px] sm:max-w-[180px] uppercase">{t.userName}</p>
                <div className="flex items-center gap-1.5">
                   <CheckCircle2 className="w-3 h-3 text-green-500 fill-green-500/10" />
                   <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Feedback Verificado</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn("w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current transition-all duration-700", s <= (t.rating || 5) ? "drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" : "opacity-10")} style={{ color: themeColor }} />
              ))}
            </div>
          </div>

          {t.videoUrl && (
            <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-black shadow-3xl ring-1 ring-white/10 group">
               <video src={t.videoUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" muted loop playsInline autoPlay />
               <div className="absolute bottom-4 left-4">
                 <div className="bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-2xl">
                   <p className="text-[8px] sm:text-[10px] text-white font-black uppercase tracking-[0.25em] flex items-center gap-2">
                     <Play className="w-2.5 h-2.5 fill-white" /> Cinema Review
                   </p>
                 </div>
               </div>
            </div>
          )}

          {t.text && t.text !== '(Depoimento em Vídeo)' && (
            <div className="relative px-2">
              <span className="absolute -top-6 -left-3 text-6xl sm:text-8xl opacity-[0.03] font-serif select-none pointer-events-none italic" style={{ color: themeColor }}>“</span>
              <p className="text-zinc-200 font-bold text-sm sm:text-xl leading-relaxed italic relative z-10 tracking-tight drop-shadow-sm">
                {t.text}
              </p>
            </div>
          )}

          <div className="pt-6 sm:pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500">
               <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50" />
               <span className="text-[8px] sm:text-[11px] font-black uppercase tracking-[0.3em]">
                 {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recent Post'}
               </span>
            </div>
            <div className="flex items-center gap-1">
               <div className="h-1 w-4 rounded-full opacity-20" style={{ backgroundColor: themeColor }} />
               <div className="h-1 w-1 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen h-screen bg-transparent p-4 sm:p-10 font-body overflow-hidden">
      <div className="w-full h-full flex flex-col items-center justify-center">
        {filteredTestimonials.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-20 animate-pulse">
            <Star className="w-16 h-16 mb-6" />
            <p className="text-[12px] font-black uppercase tracking-[0.4em]">Aguardando Prova Social de Elite</p>
          </div>
        ) : (
          <div className="w-full max-w-full">
            {layout === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-12">
                {visibleTestimonials.map((t, i) => (
                  <TestimonialCard key={t.id} t={t} index={i} />
                ))}
              </div>
            )}

            {layout === 'mural' && (
              <div className={cn(
                "grid gap-10 sm:gap-16 transition-all duration-700",
                visibleTestimonials.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-lg mx-auto"
              )}>
                {visibleTestimonials.map((t, i) => (
                  <div key={`${t.id}-${muralIndex}`} className="flex justify-center">
                    <TestimonialCard t={t} index={i} />
                  </div>
                ))}
              </div>
            )}

            {layout === 'carousel' && (
              <div className="w-full flex items-center justify-center py-10">
                <Carousel setApi={setApi} opts={{ loop: true }} className="w-full max-w-[320px] sm:max-w-xl mx-auto">
                  <CarouselContent>
                    {filteredTestimonials.map((t, i) => (
                      <CarouselItem key={t.id} className="p-4 basis-full">
                        <TestimonialCard t={t} index={i} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            )}

            {layout === 'popup' && (
              <div className="flex items-center justify-center w-full max-w-lg mx-auto animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000">
                <TestimonialCard t={filteredTestimonials[muralIndex]} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
