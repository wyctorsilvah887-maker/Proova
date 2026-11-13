'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query, where, getDoc } from 'firebase/firestore';
import { Star, CheckCircle2, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Página pública do Widget (Embed VIP)
 * Comportamento de Notificação Compacta (Bubble)
 * Otimizado para espaços pequenos com fundo 100% transparente e opacidade de leitura elevada (98%).
 */
export default function WidgetPublicPage({ params }: { params: Promise<{ userId: string, widgetId: string }> }) {
  const { userId, widgetId } = use(params);
  const db = useFirestore();

  const [widgetData, setWidgetData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Forçar transparência absoluta IMEDIATA e impedir qualquer flash de cor
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    const setTransparent = () => {
      root.style.setProperty('background', 'transparent', 'important');
      root.style.setProperty('background-color', 'transparent', 'important');
      body.style.setProperty('background', 'transparent', 'important');
      body.style.setProperty('background-color', 'transparent', 'important');
      body.style.setProperty('opacity', '1', 'important');
    };

    setTransparent();
    const interval = setInterval(setTransparent, 50);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!db || !userId || !widgetId) return;

    const fetchUser = async () => {
      const uSnap = await getDoc(doc(db, 'users', userId));
      if (uSnap.exists()) setUserData(uSnap.data());
    };
    fetchUser();

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
    return filtered.length > 0 ? filtered : allTestimonials.slice(0, 10);
  }, [widgetData, allTestimonials]);

  const themeColor = widgetData?.themeColor || '#f97316';
  const companyName = userData?.companyName || 'nossa empresa';

  // Lógica de rotação da "Bolha" (Fica 6.5s visível, 3.5s oculta)
  useEffect(() => {
    if (filteredTestimonials.length === 0) return;

    const cycle = () => {
      setIsVisible(true);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
        }, 800);
      }, 6500);
    };

    const initialTimer = setTimeout(cycle, 1000);
    const interval = setInterval(cycle, 10000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [filteredTestimonials.length]);

  if (isLoading || !widgetData || filteredTestimonials.length === 0) {
    return (
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { background: transparent !important; background-color: transparent !important; opacity: 0 !important; }
      ` }} />
    );
  }

  const t = filteredTestimonials[currentIndex];

  return (
    <div className="h-screen w-full bg-transparent p-2 font-body overflow-hidden flex items-end justify-start">
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { background: transparent !important; background-color: transparent !important; }
      ` }} />
      
      {t && (
        <div 
          className={cn(
            "w-full max-w-[280px] transition-all duration-700 ease-in-out",
            isVisible 
              ? "animate-in fade-in slide-in-from-bottom-4 duration-1000" 
              : "animate-out fade-out slide-out-to-bottom-4 duration-700 opacity-0"
          )}
        >
          <Card 
            className="rounded-2xl p-3 bg-white/98 dark:bg-zinc-950/98 backdrop-blur-md text-black dark:text-white border-none relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5 shadow-2xl"
          >
            <div className="flex gap-2.5 items-start">
              <div 
                className="h-9 w-9 rounded-full border flex items-center justify-center shrink-0 bg-muted/10" 
                style={{ borderColor: themeColor + '30' }}
              >
                <User className="w-4 h-4" style={{ color: themeColor }} />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-[10px] truncate uppercase tracking-tight">{t.userName}</span>
                    <div className="flex shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={cn("w-2 h-2 fill-current", s <= (t.rating || 5) ? "" : "opacity-10")} 
                          style={{ color: '#fbbf24' }} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[8px] font-bold text-muted-foreground leading-tight">
                    avaliou a <span className="text-foreground">{companyName}</span>
                  </p>
                </div>
                
                {t.text && t.text !== '(Depoimento em Vídeo)' && (
                  <p className="opacity-80 font-medium italic tracking-tight text-[9px] leading-tight line-clamp-2 pt-0.5">
                    "{t.text}"
                  </p>
                )}

                <div className="pt-1.5 flex items-center gap-1 opacity-30">
                  <CheckCircle2 className="w-2 h-2 text-green-500" />
                  <span className="text-[6px] font-black uppercase tracking-widest">Verificado</span>
                </div>
              </div>
            </div>
            
            <div 
              className="absolute bottom-0 left-0 h-0.5 opacity-20 transition-all duration-[6500ms] ease-linear"
              style={{ 
                width: isVisible ? '100%' : '0%',
                backgroundColor: themeColor
              }}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
