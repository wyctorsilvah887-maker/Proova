
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Star, User, Loader2, Globe, ArrowLeft, CheckCircle2, Clock, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

export default function PPClient({ slug }: { slug: string }) {
  const db = useFirestore();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [ppData, setPPData] = useState<any>(null);
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [muralIndex, setMuralIndex] = useState(0);
  const [isStandalone, setIsStandalone] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }
  }, []);

  useEffect(() => {
    async function resolveSlug() {
      if (!db || !slug) return;
      try {
        setIsLoading(true);
        const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('companySlug', '==', decodedSlug), limit(1));
        const userQuerySnap = await getDocs(q);
        if (!userQuerySnap.empty) {
          setTargetUserId(userQuerySnap.docs[0].id);
          setCompanyName(userQuerySnap.docs[0].data().companyName);
        }
      } catch (err) {
        console.error("Erro ao resolver slug:", err);
      } finally {
        setIsLoading(false);
      }
    }
    resolveSlug();
  }, [db, slug]);

  useEffect(() => {
    if (!db || !targetUserId || !slug) return;
    const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();
    const ppRef = doc(db, 'users', targetUserId, 'pp', decodedSlug);
    const unsubPP = onSnapshot(ppRef, (docSnap) => {
      if (docSnap.exists()) setPPData(docSnap.data());
    });
    const testimonialsRef = collection(db, 'users', targetUserId, 'testimonials');
    const tQuery = query(testimonialsRef, where('status', '==', 'approved'));
    const unsubTestimonials = onSnapshot(tQuery, (snapshot) => {
      setAllTestimonials(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubPP(); unsubTestimonials(); };
  }, [db, targetUserId, slug]);

  const filteredTestimonials = useMemo(() => {
    if (!ppData || !allTestimonials.length) return [];
    const selectedIds = ppData.selectedTestimonialIds || [];
    return allTestimonials.filter(t => selectedIds.includes(t.id));
  }, [ppData, allTestimonials]);

  const layout = ppData?.layout || 'grid';
  const themeColor = ppData?.themeColor || '#f97316';
  const logoUrl = ppData?.logoUrl || '';
  const heroTitle = ppData?.heroTitle || `O que dizem sobre ${companyName || 'nós'}`;

  useEffect(() => {
    if ((layout === 'mural' || layout === 'popup' || layout === 'carousel') && filteredTestimonials.length > 0) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setMuralIndex(prev => (prev + 1) % filteredTestimonials.length);
          setIsAnimating(false);
        }, 1000); 
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [layout, filteredTestimonials]);

  const visibleDisplayPool = useMemo(() => {
    if (filteredTestimonials.length === 0) return [];
    if (layout === 'mural') {
      const slice = [];
      for (let i = 0; i < Math.min(2, filteredTestimonials.length); i++) {
        slice.push(filteredTestimonials[(muralIndex + i) % filteredTestimonials.length]);
      }
      return slice;
    }
    if (layout === 'carousel' || layout === 'popup') return [filteredTestimonials[muralIndex % filteredTestimonials.length]];
    return filteredTestimonials;
  }, [filteredTestimonials, muralIndex, layout]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background font-body flex flex-col relative overflow-x-hidden text-foreground">
      {!isStandalone && (
        <nav className="h-16 border-b flex items-center px-6 justify-between bg-background/95 backdrop-blur-md sticky top-0 z-[60] shadow-sm">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">PROOVA</span>
          <div className="flex items-center gap-4"><ThemeToggle />{user ? <Link href="/dash"><Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase gap-2"><ArrowLeft className="w-3 3" /> Dashboard</Button></Link> : <Link href="/"><Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase">Início</Button></Link>}</div>
        </nav>
      )}
      <div className="flex-1 flex flex-col">
        {!targetUserId ? <div className="flex-1 flex flex-col items-center justify-center p-6 opacity-30"><Globe className="w-12 h-12 mb-4" /><h2 className="text-xl font-bold">Página não encontrada</h2></div> : (
          <div className="w-full max-w-full mx-auto flex-1 flex flex-col">
            <header className="px-6 text-center py-24 sm:py-32 space-y-8">
              {logoUrl && <div className="flex justify-center"><img src={logoUrl} className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-[2.5rem] shadow-xl" /></div>}
              <div className="text-4xl sm:text-7xl font-black tracking-tighter leading-[1.1] max-w-4xl mx-auto" dangerouslySetInnerHTML={{ __html: heroTitle }} />
            </header>
            <main className="px-6 pb-32 max-w-[1600px] mx-auto w-full">
              <div className={cn("w-full", (layout === 'popup' || layout === 'carousel') ? "max-w-md mx-auto" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12")}>
                {visibleDisplayPool.map((t, i) => (
                  <Card key={t.id} className="bg-card rounded-[2.5rem] p-6 shadow-2xl border-none">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-xs" style={{ backgroundColor: themeColor }}>{t.userName?.substring(0,2).toUpperCase()}</div><p className="font-bold text-xs">{t.userName}</p></div>
                        <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3 h-3", s <= (t.rating || 5) ? "fill-current" : "opacity-20")} style={{ color: themeColor }} />)}</div>
                      </div>
                      <p className="text-sm italic">"{t.text}"</p>
                    </div>
                  </Card>
                ))}
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
