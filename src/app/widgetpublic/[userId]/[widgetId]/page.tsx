'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Star, CheckCircle2, Clock, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Página pública do Widget (Embed VIP)
 * Comportamento de Notificação Flutuante (Bubble)
 */
export default function WidgetPublicPage({ params }: { params: Promise<{ userId: string, widgetId: string }> }) {
  const { userId, widgetId } = use(params);
  const db = useFirestore();

  const [widgetData, setWidgetData] = useState<any>(null);
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
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

  const themeColor = widgetData?.themeColor || '#f97316';
  const secondaryColor = widgetData?.secondaryColor || '';

  // Lógica de Ciclo da Notificação (Entra -> Fica -> Sai -> Próximo)
  useEffect(() => {
    if (filteredTestimonials.length === 0) return;

    // Inicia o ciclo
    setIsVisible(true);

    const cycle = setInterval(() => {
      // 1. Inicia Saída
      setIsVisible(false);

      // 2. Espera a animação de saída e troca o index
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
        // 3. Inicia Entrada do próximo
        setIsVisible(true);
      }, 1000); // Tempo para o card sumir e trocar

    }, 8000); // Fica visível por ~7s + 1s de transição

    return () => clearInterval(cycle);
  }, [filteredTestimonials.length]);

  if (isLoading || !widgetData || filteredTestimonials.length === 0) {
    return null;
  }

  const t = filteredTestimonials[currentIndex];
  const hasSecondary = !!secondaryColor && secondaryColor !== 'transparent';

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 font-body overflow-hidden flex items-end justify-center sm:justify-start">
      {t && (
        <div 
          className={cn(
            "w-full max-w-[320px] transition-all duration-700 ease-in-out",
            isVisible 
              ? "animate-in fade-in slide-in-from-bottom-8 duration-1000" 
              : "animate-out fade-out slide-out-to-bottom-8 duration-700 opacity-0"
          )}
        >
          <Card 
            className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-black text-black dark:text-white border-none relative overflow-hidden"
            style={{ 
              boxShadow: hasSecondary 
                ? `0 0 25px ${secondaryColor}40, 0 15px 40px -10px rgba(0,0,0,0.15)` 
                : `0 10px 30px -10px ${themeColor}20`,
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="h-8 w-8 rounded-full border flex items-center justify-center shrink-0 bg-muted/20" 
                  style={{ borderColor: hasSecondary ? `${secondaryColor}40` : `${themeColor}40` }}
                >
                  <User className="w-4 h-4" style={{ color: hasSecondary ? secondaryColor : themeColor }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-[11px] sm:text-[12px] tracking-tight truncate uppercase leading-none">{t.userName}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current", s <= (t.rating || 5) ? "" : "opacity-10")} 
                        style={{ color: hasSecondary ? secondaryColor : themeColor }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {t.text && t.text !== '(Depoimento em Vídeo)' && (
                <p className="opacity-75 font-bold italic tracking-tight text-[10px] leading-relaxed line-clamp-3">
                  "{t.text}"
                </p>
              )}

              <div className="pt-3 border-t border-muted/20 flex items-center justify-between opacity-50">
                <span className="text-[7px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Agora'}
                </span>
                <span className="text-[7px] font-black uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                  Verificado
                </span>
              </div>
            </div>
            
            {/* Indicador de tempo/progresso na base (opcional, mas dá um toque premium) */}
            <div 
              className="absolute bottom-0 left-0 h-0.5 bg-primary/30 transition-all duration-[7000ms] ease-linear"
              style={{ width: isVisible ? '100%' : '0%' }}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
