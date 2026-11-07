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
 * Renderiza apenas o mural de depoimentos de forma limpa e otimizada para ser usada em Iframes.
 * Otimizada para temas menores e dispositivos móveis.
 * Sem scroll e com centralização estratégica.
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

    // Escuta as configurações do widget
    const widgetRef = doc(db, 'users', userId, 'widgets', widgetId);
    const unsubWidget = onSnapshot(widgetRef, (docSnap) => {
      if (docSnap.exists()) setWidgetData(docSnap.data());
    });

    // Escuta os depoimentos aprovados
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

  // Lógica de rotação para layouts dinâmicos (Mural e Popup)
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

  // Lógica de auto-scroll para Carrossel
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
          "rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 border-none shadow-2xl transition-all duration-700 hover:scale-[1.02] w-full max-w-full",
          layout === 'grid' && "animate-in fade-in zoom-in-95 duration-500",
          layout === 'mural' && !isAnimating && (side === 'left' ? "animate-in fade-in slide-in-from-left-8 duration-700" : "animate-in fade-in slide-in-from-right-8 duration-700"),
          layout === 'popup' && !isAnimating && "animate-in fade-in zoom-in-90 duration-1000"
        )}
        style={{ 
          backgroundColor: secondaryColor || '#111111',
          boxShadow: `0 20px 40px -20px ${themeColor}25`,
        }}
      >
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-[10px] sm:text-sm shadow-lg rotate-3 shrink-0" style={{ backgroundColor: themeColor }}>
                {t.userName?.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-black text-[11px] sm:text-sm text-white tracking-tight truncate max-w-[80px] sm:max-w-[120px]">{t.userName}</p>
                <div className="flex items-center gap-1">
                   <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-green-500 fill-green-500/20" />
                   <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-500">Verificado</span>
                </div>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3", s <= (t.rating || 5) ? "fill-current" : "opacity-20")} style={{ color: themeColor }} />
              ))}
            </div>
          </div>

          {t.videoUrl && (
            <div className="relative aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
               <video src={t.videoUrl} className="w-full h-full object-cover" muted loop playsInline autoPlay />
               <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                 <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-white/10">
                   <p className="text-[6px] sm:text-[8px] text-white font-black uppercase tracking-widest flex items-center gap-1 sm:gap-1.5">
                     <Play className="w-1.5 h-1.5 sm:w-2 sm:h-2 fill-white" /> Vídeo
                   </p>
                 </div>
               </div>
            </div>
          )}

          {t.text && t.text !== '(Depoimento em Vídeo)' && (
            <div className="relative">
              <span className="absolute -top-2 -left-1 sm:-top-3 sm:-left-2 text-3xl sm:text-5xl opacity-10 font-serif select-none pointer-events-none" style={{ color: themeColor }}>“</span>
              <p className="text-zinc-200 font-medium text-xs sm:text-base leading-relaxed italic relative z-10 px-1 sm:px-2">
                {t.text}
              </p>
            </div>
          )}

          <div className="pt-4 sm:pt-5 border-t border-white/5 flex items-center justify-between">
            <span className="text-[7px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-1 sm:gap-1.5">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
            </span>
            <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen h-screen bg-transparent p-2 sm:p-4 font-body overflow-hidden">
      <div className="w-full h-full flex flex-col items-center justify-center">
        {filteredTestimonials.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-20">
            <Star className="w-12 h-12 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Aguardando Prova Social</p>
          </div>
        ) : (
          <div className="w-full max-w-full">
            {layout === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {visibleTestimonials.map((t, i) => (
                  <TestimonialCard key={t.id} t={t} index={i} />
                ))}
              </div>
            )}

            {layout === 'mural' && (
              <div className={cn(
                "grid gap-4 sm:gap-10 transition-all duration-500",
                visibleTestimonials.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-sm mx-auto"
              )}>
                {visibleTestimonials.map((t, i) => (
                  <div key={`${t.id}-${muralIndex}`} className="flex justify-center">
                    <TestimonialCard t={t} index={i} />
                  </div>
                ))}
              </div>
            )}

            {layout === 'carousel' && (
              <Carousel setApi={setApi} opts={{ loop: true }} className="w-full max-w-[280px] sm:max-w-md mx-auto">
                <CarouselContent>
                  {filteredTestimonials.map((t, i) => (
                    <CarouselItem key={t.id} className="p-2 basis-full">
                      <TestimonialCard t={t} index={i} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            )}

            {layout === 'popup' && (
              <div className="flex items-center justify-center w-full max-w-sm mx-auto animate-in fade-in zoom-in duration-700">
                <TestimonialCard t={filteredTestimonials[muralIndex]} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
