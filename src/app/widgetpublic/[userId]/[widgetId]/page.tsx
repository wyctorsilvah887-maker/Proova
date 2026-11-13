
'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Star, CheckCircle2, Clock, Play, User, Bot, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { LoadingScreen } from '@/components/loading-screen';

/**
 * Página pública do Widget (Embed VIP)
 * Otimizada para ser compacta e adaptável.
 */
export default function WidgetPublicPage({ params }: { params: Promise<{ userId: string, widgetId: string }> }) {
  const { userId, widgetId } = use(params);
  const db = useFirestore();

  const [widgetData, setWidgetData] = useState<any>(null);
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [muralIndex, setMuralIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db || !userId || !widgetId) return;

    const widgetRef = doc(db, 'users', userId, 'widgets', widgetId);
    const unsubWidget = onSnapshot(widgetRef, (docSnap) => {
      if (docSnap.exists()) {
        setWidgetData(docSnap.data());
      }
      setIsLoading(false);
    }, () => setIsLoading(false));

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
    return filtered.length > 0 ? filtered : allTestimonials.slice(0, 5);
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
        slice.push(filteredTestimonials[(muralIndex + i) % filteredTestimonials.length]);
      }
      return slice;
    }
    if (layout === 'popup' || layout === 'carousel') return [filteredTestimonials[muralIndex % filteredTestimonials.length]];
    return filteredTestimonials;
  }, [filteredTestimonials, muralIndex, layout]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (!widgetData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-transparent opacity-10">
        <p className="text-[10px] font-black uppercase">Mural não encontrado</p>
      </div>
    );
  }

  const TestimonialCard = ({ t, index = 0 }: { t: any, index?: number }) => {
    const side = (index + muralIndex) % 2 === 0 ? 'left' : 'right';
    const hasSecondary = !!secondaryColor && secondaryColor !== 'transparent';
    const isPopup = layout === 'popup';
    
    return (
      <div className={cn("flex flex-col gap-3 w-full", isPopup && "max-w-[320px]")}>
        <Card 
          className={cn(
            "rounded-2xl p-4 sm:p-5 transition-all duration-700 w-full max-w-full bg-white dark:bg-black text-black dark:text-white border-none h-auto relative z-10",
            layout === 'mural' && !isAnimating && (side === 'left' ? "animate-in fade-in slide-in-from-left-4 duration-700" : "animate-in fade-in slide-in-from-right-4 duration-700"),
            isPopup && !isAnimating && "animate-in fade-in slide-in-from-bottom-8 zoom-in-95 duration-1000",
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
                <p className="font-black text-[11px] sm:text-[12px] tracking-tight truncate uppercase leading-none">{t.userName}</p>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current", i < (t.rating || 5) ? "" : "opacity-10")} style={{ color: hasSecondary ? secondaryColor : themeColor }} />
                  ))}
                </div>
              </div>
            </div>
            {t.text && t.text !== '(Depoimento em Vídeo)' && (
              <p className={cn("opacity-75 font-bold italic tracking-tight whitespace-pre-wrap", isPopup ? "text-[10px] line-clamp-3" : "text-[11px]")}>"{t.text}"</p>
            )}
            <div className="pt-3 border-t border-muted/20 flex items-center justify-between opacity-50">
              <span className="text-[7px] font-black uppercase tracking-widest flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}</span>
              <span className="text-[7px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5 text-green-500" />Verificado</span>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 font-body overflow-hidden">
      <div className="w-full h-full flex flex-col items-center justify-center">
        {filteredTestimonials.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10 animate-pulse"><Star className="w-10 h-10 mb-4" /><p className="text-[10px] font-black uppercase">Aguardando Depoimentos</p></div>
        ) : (
          <div className={cn("w-full max-w-4xl mx-auto flex justify-center", layout === 'popup' && "h-full items-end sm:items-center")}>
            {layout === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                {filteredTestimonials.map((t, i) => <TestimonialCard key={t.id} t={t} index={i} />)}
              </div>
            )}
            {layout === 'mural' && (
              <div className="columns-1 sm:columns-2 gap-6 w-full space-y-12">
                {visibleTestimonials.map((t, i) => <div key={`${t.id}-${muralIndex}-${i}`} className="break-inside-avoid mb-12 flex justify-center"><TestimonialCard t={t} index={i} /></div>)}
              </div>
            )}
            {layout === 'carousel' && (
              <div className="w-full flex items-center justify-center py-6 h-full">
                <Carousel setApi={setApi} opts={{ loop: true }} className="w-full max-w-[280px] sm:max-w-md mx-auto">
                  <CarouselContent>{filteredTestimonials.map((t, i) => <CarouselItem key={t.id} className="p-2 basis-full"><TestimonialCard t={t} index={i} /></CarouselItem>)}</CarouselContent>
                </Carousel>
              </div>
            )}
            {layout === 'popup' && <div className="flex items-center justify-center w-full max-w-xs mx-auto animate-in fade-in duration-500"><TestimonialCard t={filteredTestimonials[muralIndex % filteredTestimonials.length]} /></div>}
          </div>
        )}
      </div>
    </div>
  );
}
