'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Star, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Página pública do Widget (Embed VIP)
 * Renderiza apenas o mural de depoimentos de forma limpa e otimizada para ser usada em Iframes.
 */
export default function WidgetPublicPage({ params }: { params: Promise<{ userId: string, widgetId: string }> }) {
  const { userId, widgetId } = use(params);
  const db = useFirestore();

  const [widgetData, setWidgetData] = useState<any>(null);
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [muralIndex, setMuralIndex] = useState(0);

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

  // Lógica de rotação para layouts dinâmicos
  useEffect(() => {
    if (layout === 'mural' && filteredTestimonials.length > 0) {
      const interval = setInterval(() => setMuralIndex(prev => (prev + 1) % filteredTestimonials.length), 6000);
      return () => clearInterval(interval);
    }
  }, [layout, filteredTestimonials]);

  const visibleTestimonials = useMemo(() => {
    if (layout !== 'mural' || filteredTestimonials.length === 0) return filteredTestimonials;
    const slice = [];
    const count = Math.min(2, filteredTestimonials.length);
    for (let i = 0; i < count; i++) {
      slice.push(filteredTestimonials[(muralIndex + i) % filteredTestimonials.length]);
    }
    return slice;
  }, [filteredTestimonials, muralIndex, layout]);

  if (!widgetData) return null;

  return (
    <div className="min-h-screen bg-transparent p-4 font-body overflow-hidden">
      <div className={cn(
        "grid gap-6 w-full",
        layout === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : 
        layout === 'mural' ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
      )}>
        {visibleTestimonials.map((t) => (
          <Card 
            key={t.id}
            className="bg-[#111111] rounded-[2.5rem] p-8 border-none shadow-2xl transition-all duration-700 hover:scale-[1.02]"
            style={{ 
              boxShadow: `0 20px 40px -20px ${themeColor}25`,
            }}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg rotate-3 shrink-0" style={{ backgroundColor: themeColor }}>
                    {t.userName?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-white tracking-tight truncate max-w-[120px]">{t.userName}</p>
                    <div className="flex items-center gap-1.5">
                       <CheckCircle2 className="w-2.5 h-2.5 text-green-500 fill-green-500/20" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Verificado</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("w-3 h-3", s <= (t.rating || 5) ? "fill-current" : "opacity-20")} style={{ color: themeColor }} />
                  ))}
                </div>
              </div>

              {t.text && t.text !== '(Depoimento em Vídeo)' && (
                <div className="relative">
                  <span className="absolute -top-3 -left-2 text-5xl opacity-10 font-serif select-none pointer-events-none" style={{ color: themeColor }}>“</span>
                  <p className="text-zinc-200 font-medium text-base leading-relaxed italic relative z-10 px-2">
                    {t.text}
                  </p>
                </div>
              )}

              <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
                </span>
                <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
