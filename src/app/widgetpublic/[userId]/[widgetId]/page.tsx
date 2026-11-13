'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Star, CheckCircle2, Clock, Play, User, Bot, X } from 'lucide-react';
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
 * Otimizada para ser compacta e adaptável ao tamanho do conteúdo.
 * Projetada especificamente para ser embutida via iFrame em sites externos ou via Script Flutuante.
 */
export default function WidgetPublicPage({ params }: { params: Promise<{ userId: string, widgetId: string }> }) {
  const { userId, widgetId } = use(params);
  const db = useFirestore();

  const [widgetData, setWidgetData] = useState<any>(null);
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [muralIndex, setMuralIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [api, setApi] = useState<CarouselApi>();

  // Carrega configurações e depoimentos
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
    const filtered = allTestimonials.filter(t => selectedIds.includes(t.id));
    // Se não houver selecionados, mostrar os últimos 5
    return filtered.length > 0 ? filtered : allTestimonials.slice(0, 5);
  }, [widgetData, allTestimonials]);

  const layout = widgetData?.layout || 'grid';
  const themeColor = widgetData?.themeColor || '#f97316';
  const secondaryColor = widgetData?.secondaryColor || '';

  // Efeito de rotação para layouts de notificação/mural
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
    const hasSecondary = !!secondaryColor && secondaryColor !== 'transparent' && secondaryColor !== '';
    const isPopup = layout === 'popup';
    
    return (
      <div className={cn("flex flex-col gap-3 w-full", isPopup && "max-w-[320px]")}>
        <Card 
          key={t.id}
          className={cn(
            "rounded-2xl p-4 sm:p-5 transition-all duration-700 w-full max-w-full bg-white dark:bg-black text-black dark:text-white border-none h-auto relative z-10",
            layout === 'mural' && !isAnimating && (side === 'left' ? "animate-in fade-in slide-in-from-left-4 duration-700" : "animate-in fade-in slide-in-from-right-4 duration-700"),
            isPopup && !isAnimating && "animate-in fade-in slide-in-from-bottom-8 zoom-in-95 duration-1000",
            isPopup && isAnimating && "animate-out fade-out slide-out-to-bottom-4 duration-500"
          )}
          style={{ 
            boxShadow: hasSecondary 
              ? `0 0 25px ${secondaryColor}40, 0 15px 40px -10px rgba(0,0,0,0.15)` 
              : `0 10px 30px -10px ${themeColor}20`,
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full border flex items-center justify-center shrink-0 bg-muted/20" style={{ borderColor: hasSecondary ? `${secondaryColor}40` : `${themeColor}40` }}>
                <User className="w-4 h-4" style={{ color: hasSecondary ? secondaryColor : themeColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                   <p className="font-black text-[11px] sm:text-[12px] tracking-tight truncate uppercase leading-none">{t.userName}</p>
                   {isPopup && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-2" />}
                </div>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current transition-all duration-700", i < (t.rating || 5) ? "" : "opacity-10")} style={{ color: hasSecondary ? secondaryColor : themeColor }} />
                  ))}
                </div>
              </div>
            </div>

            {t.videoUrl && (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 group">
                 <video src={t.videoUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" muted loop playsInline autoPlay />
                 <div className="absolute bottom-2 left-2">
                   <div className="bg-black/60 backdrop-blur-xl px-2 py-1 rounded-full border border-white/10 shadow-2xl">
                     <p className="text-[7px] text-white font-black uppercase tracking-widest flex items-center gap-1.5">
                       <Play className="w-2 h-2 fill-white" /> Vídeo Review
                     </p>
                   </div>
                 </div>
              </div>
            )}

            {t.text && t.text !== '(Depoimento em Vídeo)' && (
              <div className="relative">
                <p className={cn(
                  "opacity-75 font-bold leading-relaxed italic tracking-tight whitespace-pre-wrap",
                  isPopup ? "text-[10px] sm:text-[12px] line-clamp-3" : "text-[11px] sm:text-[13px]"
                )}>
                  "{t.text}"
                </p>
              </div>
            )}

            {!isPopup && (
              <div className="pt-3 border-t border-muted/20 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 opacity-50" />
                  <span className="text-[7px] font-black uppercase tracking-widest">
                    {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Agora'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest">Verificado</span>
                </div>
              </div>
            )}
          </div>
        </Card>
        
        {t.aiReply && !isPopup && (
          <div className="pl-4 sm:pl-8 -mt-1 animate-in fade-in slide-in-from-top-1 duration-1000">
            <div className="bg-muted/10 border-l-2 rounded-r-xl p-3 space-y-1" style={{ borderColor: themeColor }}>
              <div className="flex items-center gap-1.5">
                <Bot className="w-2.5 h-2.5 text-primary" />
                <span className="text-[7px] font-black uppercase tracking-widest text-primary">Resposta</span>
              </div>
              <p className="text-[10px] font-medium leading-relaxed opacity-80">{t.aiReply}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 font-body overflow-hidden">
      <div className="w-full h-full flex flex-col items-center justify-center">
        {filteredTestimonials.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-10 animate-pulse">
            <Star className="w-10 h-10 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aguardando Prova Social</p>
          </div>
        ) : (
          <div className={cn(
            "w-full max-w-4xl mx-auto flex justify-center",
            layout === 'popup' && "h-full items-end sm:items-center"
          )}>
            {layout === 'grid' && (
              <div className="relative h-full w-full overflow-hidden">
                <div className="animate-marquee-vertical flex flex-col gap-6">
                  {[...filteredTestimonials, ...filteredTestimonials].map((t, i) => (
                    <TestimonialCard key={`${t.id}-${i}`} t={t} index={i} />
                  ))}
                </div>
              </div>
            )}

            {layout === 'mural' && (
              <div className="columns-1 sm:columns-2 gap-6 w-full space-y-12">
                {visibleTestimonials.map((t, i) => (
                  <div key={`${t.id}-${muralIndex}-${i}`} className="break-inside-avoid mb-12 flex justify-center">
                    <TestimonialCard t={t} index={i} />
                  </div>
                ))}
              </div>
            )}

            {layout === 'carousel' && (
              <div className="w-full flex items-center justify-center py-6 h-full">
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
              <div className="flex items-center justify-center w-full max-w-xs mx-auto animate-in fade-in duration-500">
                <TestimonialCard t={filteredTestimonials[muralIndex % filteredTestimonials.length]} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
