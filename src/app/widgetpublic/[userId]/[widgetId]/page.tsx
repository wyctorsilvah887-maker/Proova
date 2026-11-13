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

  useEffect(() => {
    if (!db || !userId || !widgetId) return;

    // Busca dados da empresa para o texto da notificação
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
  const secondaryColor = widgetData?.secondaryColor || '';
  const companyName = userData?.companyName || 'nossa empresa';

  // Lógica de Ciclo da Notificação (Entra -> Fica -> Sai -> Próximo)
  useEffect(() => {
    if (filteredTestimonials.length === 0) return;

    const showNext = () => {
      setIsVisible(true);
      
      // Tempo visível
      setTimeout(() => {
        setIsVisible(false);
        // Espera animação de saída e muda o index
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
        }, 800);
      }, 7000);
    };

    showNext();
    const interval = setInterval(showNext, 9000); // 7s visível + 2s transição/espera

    return () => clearInterval(interval);
  }, [filteredTestimonials.length]);

  if (isLoading || !widgetData || filteredTestimonials.length === 0) {
    return null;
  }

  const t = filteredTestimonials[currentIndex];
  const hasSecondary = !!secondaryColor && secondaryColor !== 'transparent';

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-6 font-body overflow-hidden flex items-end justify-center sm:justify-start">
      {t && (
        <div 
          className={cn(
            "w-full max-w-[280px] sm:max-w-[320px] transition-all duration-700 ease-in-out",
            isVisible 
              ? "animate-in fade-in slide-in-from-bottom-6 duration-1000" 
              : "animate-out fade-out slide-out-to-bottom-6 duration-700 opacity-0"
          )}
        >
          <Card 
            className="rounded-2xl p-3.5 bg-white dark:bg-zinc-950 text-black dark:text-white border-none relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
            style={{ 
              boxShadow: hasSecondary 
                ? `0 0 20px ${secondaryColor}30, 0 10px 30px -10px rgba(0,0,0,0.15)` 
                : `0 12px 24px -10px rgba(0,0,0,0.12)`,
            }}
          >
            <div className="flex gap-3 items-start">
              {/* Avatar Compacto */}
              <div 
                className="h-9 w-9 rounded-full border flex items-center justify-center shrink-0 bg-muted/10" 
                style={{ borderColor: hasSecondary ? `${secondaryColor}30` : `${themeColor}30` }}
              >
                <User className="w-4 h-4" style={{ color: hasSecondary ? secondaryColor : themeColor }} />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                {/* Cabeçalho da Notificação */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-[11px] truncate uppercase tracking-tight">{t.userName}</span>
                    <div className="flex shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={cn("w-2.5 h-2.5 fill-current", s <= (t.rating || 5) ? "" : "opacity-10")} 
                          style={{ color: '#fbbf24' }} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground leading-tight">
                    avaliou a <span className="text-foreground">{companyName}</span>
                  </p>
                </div>
                
                {/* Prévia do Depoimento */}
                {t.text && t.text !== '(Depoimento em Vídeo)' && (
                  <p className="opacity-80 font-medium italic tracking-tight text-[10px] leading-snug line-clamp-2 pt-1">
                    "{t.text}"
                  </p>
                )}

                {/* Selo de Verificação Discreto */}
                <div className="pt-2 flex items-center gap-1 opacity-40">
                  <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                  <span className="text-[7px] font-black uppercase tracking-[0.1em]">Depoimento Verificado</span>
                </div>
              </div>
            </div>
            
            {/* Barra de Progresso Suave */}
            <div 
              className="absolute bottom-0 left-0 h-0.5 opacity-20 transition-all duration-[7000ms] ease-linear"
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
