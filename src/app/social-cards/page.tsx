'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Loader2, 
  Share2, 
  Star, 
  User, 
  MessageSquare,
  Search,
  ChevronRight,
  Plus,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

const TESTIMONIALS_PER_PAGE = 15;

export default function SocialCardsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [visibleLimit, setVisibleLimit] = useState(TESTIMONIALS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState('');

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  // Consulta simplificada para evitar erros de índice composto (assim como na página de métricas)
  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'testimonials');
  }, [db, user]);

  const { data: rawTestimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const filteredTestimonials = useMemo(() => {
    if (!rawTestimonials) return [];
    
    // 1. Filtrar e Ordenar em memória (Resiliente a falta de índices)
    let list = rawTestimonials
      .filter((t: any) => t.status === 'approved')
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

    // 2. Aplicar busca por texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((t: any) => 
        (t.userName?.toLowerCase() || '').includes(term) ||
        (t.text?.toLowerCase() || '').includes(term)
      );
    }

    return list;
  }, [rawTestimonials, searchTerm]);

  const visibleTestimonials = useMemo(() => {
    return filteredTestimonials.slice(0, visibleLimit);
  }, [filteredTestimonials, visibleLimit]);

  const hasMore = filteredTestimonials.length > visibleLimit;

  if (authLoading || (user && testimonialsLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-4 md:px-8 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-4">
          <Link href="/dash">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center">
            <div className="relative w-[180px] h-[60px] md:w-[280px] md:h-[90px]">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain hidden dark:block" priority />
            </div>
          </div>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-12 space-y-8 max-w-7xl mx-auto w-full pt-24 md:pt-40">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">Estúdio de Social Cards</h1>
          <p className="text-muted-foreground font-medium text-sm md:text-lg">Transforme elogios reais em conteúdo magnético para o Instagram.</p>
        </header>

        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Buscar por cliente ou texto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 rounded-xl bg-background border border-border pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTestimonials.length > 0 ? visibleTestimonials.map((t: any) => (
            <Card key={t.id} className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-background flex flex-col group transition-all hover:shadow-xl">
              <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                      {t.userName?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{t.userName}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  {t.videoUrl && <Badge variant="secondary" className="bg-primary/10 text-primary text-[8px] font-black">VÍDEO</Badge>}
                </div>

                <div className="bg-muted/30 p-4 rounded-2xl flex-1">
                  <p className="text-xs text-muted-foreground italic line-clamp-4 leading-relaxed font-medium">"{t.text}"</p>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  <Button 
                    className="w-full h-11 rounded-xl font-bold gap-2 text-xs uppercase tracking-widest bg-primary hover:bg-primary/90"
                    onClick={() => router.push('/dash')}
                  >
                    <Share2 className="w-4 h-4" /> Gerar Card Social
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[3rem] bg-muted/5 opacity-50">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-bold">Nenhum depoimento encontrado.</p>
            </div>
          )}
        </div>

        {hasMore && (
          <div className="flex justify-center py-8">
            <Button 
              variant="secondary" 
              className="h-12 px-10 rounded-full font-black uppercase tracking-widest text-[10px] gap-2"
              onClick={() => setVisibleLimit(prev => prev + TESTIMONIALS_PER_PAGE)}
            >
              Carregar Mais Depoimentos <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      <footer className="py-20 border-t bg-background/50 text-center flex flex-col items-center gap-8">
        <div className="relative w-[180px] h-[60px] opacity-40">
           <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="dark:hidden object-contain" />
           <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="hidden dark:block object-contain" />
        </div>
        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em]">© 2026 Proova Technology - Creative Studio</p>
      </footer>
    </div>
  );
}
