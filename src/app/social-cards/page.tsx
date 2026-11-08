
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  LogOut,
  TrendingUp,
  Layout,
  Inbox,
  Gem,
  Handshake,
  Sun,
  Moon,
  Lock,
  Shield,
  BadgeCheck,
  Headphones,
  Download,
  Quote,
  CheckCircle2,
  Play,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useUser, useFirestore, useCollection, useDoc, useAuth } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toPng } from 'html-to-image';
import { toast as shadcnToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/loading-screen';

export default function SocialCardsPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTestimonialForShare, setSelectedTestimonialForShare] = useState<any>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isExportingCard, setIsExportingCard] = useState(false);
  const [cardVariant, setCardVariant] = useState<'dark' | 'orange'>('dark');
  
  const shareCardRef = useRef<HTMLDivElement>(null);
  const dialogVideoRef = useRef<HTMLVideoElement>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'testimonials'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: rawTestimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  const filteredTestimonials = useMemo(() => {
    if (!rawTestimonials) return [];
    if (!searchTerm.trim()) return rawTestimonials;
    const term = searchTerm.toLowerCase();
    return rawTestimonials.filter((t: any) => 
      t.userName?.toLowerCase().includes(term) || 
      t.text?.toLowerCase().includes(term)
    );
  }, [rawTestimonials, searchTerm]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isShareDialogOpen && selectedTestimonialForShare?.videoUrl && dialogVideoRef.current) {
      dialogVideoRef.current.load();
    }
  }, [isShareDialogOpen, selectedTestimonialForShare]);

  const isMapsLinkValid = useMemo(() => {
    if (!userData?.googleMapsUrl) return false;
    const url = userData.googleMapsUrl.toLowerCase();
    return url.includes('review') || url.includes('writereview') || url.includes('placeid');
  }, [userData]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'ENTERPRISE';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

  const openShareDialog = (testimonial: any) => {
    setSelectedTestimonialForShare(testimonial);
    const variants: ('dark' | 'orange')[] = ['dark', 'orange'];
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];
    setCardVariant(randomVariant);
    setIsShareDialogOpen(true);
  };

  const handleDownloadContent = async () => {
    if (!selectedTestimonialForShare) return;

    if (selectedTestimonialForShare.videoUrl) {
      setIsExportingCard(true);
      shadcnToast({ title: "Processando Vídeo", description: "Iniciando download... aguarde." });
      try {
        const link = document.createElement('a');
        link.href = selectedTestimonialForShare.videoUrl;
        link.download = `proova-video-${selectedTestimonialForShare.userName.toLowerCase().replace(/\s+/g, '-')}.mp4`;
        link.target = "_blank";
        link.click();
      } catch (err) {
        shadcnToast({ variant: "destructive", title: "Erro no download" });
      } finally {
        setIsExportingCard(false);
      }
      return;
    }

    setIsExportingCard(true);
    try {
      if (!shareCardRef.current) return;
      const dataUrl = await toPng(shareCardRef.current, { 
        quality: 1.0, 
        pixelRatio: 3, 
        backgroundColor: 'rgba(0,0,0,0)', 
        style: { borderRadius: '2.5rem' }
      });
      const link = document.createElement('a');
      link.download = `proova-card-${selectedTestimonialForShare.userName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      shadcnToast({ title: "Card Gerado!", description: "Sua arte está pronta para as redes sociais." });
    } catch (err) {
      shadcnToast({ variant: "destructive", title: "Erro ao exportar" });
    } finally {
      setIsExportingCard(false);
    }
  };

  if (authLoading || (user && (testimonialsLoading || !userData))) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
      <header className="bg-background border-b h-16 md:h-24 flex items-center px-4 md:px-6 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/dash">
            <Button variant="ghost" size="sm" className="h-10 px-2 gap-2 text-muted-foreground hover:text-primary transition-all rounded-xl shadow-none">
               <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Painel Dash</span>
            </Button>
          </Link>
          <div className="flex items-center group -ml-2">
            <div className="relative w-[160px] h-[55px] md:w-[320px] md:h-[105px]">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-dark-mode.gif" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="hidden sm:flex" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 md:h-12 px-1.5 md:px-3 gap-2 rounded-xl focus:ring-0 shadow-none hover:bg-transparent">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] md:text-sm font-black truncate max-w-[120px] transition-colors group-hover:text-primary uppercase tracking-tight">{userData?.companyName || 'Empresa'}</span>
                  <span className="text-[6px] md:text-[8px] uppercase tracking-widest font-black text-muted-foreground">{membershipLabel}</span>
                </div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><User className="w-4 h-4" /></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5"><TrendingUp className="mr-2 h-4 w-4 text-primary" /><span>Dash</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5"><Layout className="mr-2 h-4 w-4 text-primary" /><span>Murais</span></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive font-bold py-2.5"><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-8 max-w-6xl mx-auto w-full pt-24 md:pt-32">
        <header className="space-y-4">
           <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">Social Cards Studio</h1>
           <p className="text-muted-foreground text-sm md:text-lg font-medium leading-relaxed">Selecione um depoimento para criar uma arte profissional para o seu Instagram.</p>
        </header>

        <div className="relative group">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Buscar por nome ou conteúdo do elogio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pl-10 rounded-xl bg-background border-primary/10 focus:ring-primary/20 text-xs font-bold"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTestimonials.length === 0 ? (
            <div className="col-span-full py-24 text-center opacity-30 border-2 border-dashed rounded-[3rem]">
              <MessageSquare className="w-12 h-12 mx-auto mb-4" />
              <p className="text-sm font-black uppercase">Nenhum depoimento encontrado</p>
            </div>
          ) : (
            filteredTestimonials.map((t: any) => (
              <Card key={t.id} className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group bg-card overflow-hidden" onClick={() => openShareDialog(t)}>
                 <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors"><User className="w-4 h-4" /></div>
                          <p className="text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{t.userName}</p>
                       </div>
                       <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3 h-3", s <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted/20")} />)}</div>
                    </div>
                    <p className="text-xs italic leading-relaxed text-muted-foreground line-clamp-3">"{t.text}"</p>
                    <Button className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[9px] gap-2 bg-foreground text-background group-hover:bg-primary group-hover:text-white transition-all">
                       <Share2 className="w-3.5 h-3.5" /> Gerar Arte
                    </Button>
                 </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl p-0 overflow-hidden bg-background max-h-[96vh] flex flex-col">
          <DialogHeader className="p-6 sm:p-8 pb-2 text-center shrink-0">
            <div className="flex items-center justify-center gap-2 mb-1">
               <Share2 className="w-4 h-4 text-primary" />
               <DialogTitle className="text-lg sm:text-xl font-black font-headline uppercase tracking-tight">Story Post Premium</DialogTitle>
            </div>
            <DialogDescription className="text-xs">Gere uma arte profissional para seu Instagram.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 flex flex-col items-center gap-6 scrollbar-hide">
            <div className="w-full flex justify-center py-2 shrink-0">
              <div 
                ref={shareCardRef}
                className={cn(
                  "relative overflow-hidden shadow-2xl transition-all duration-700",
                  "w-[min(88vw,400px)] aspect-square rounded-[2.5rem] flex flex-col items-center"
                )}
                style={{ 
                  backgroundImage: cardVariant === 'dark' 
                      ? 'linear-gradient(160deg, #050505 0%, #1a1a1a 60%, #f97316 160%)'
                      : 'linear-gradient(160deg, #f97316 0%, #ea580c 70%, #ffffff 180%)',
                  backgroundColor: cardVariant === 'dark' ? '#000000' : '#f97316'
                }}
              >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                   <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -ml-16 -mb-16" />

                   <div className="relative z-10 w-full flex flex-col h-full justify-between items-center p-14 sm:p-16">
                      <div className="text-center space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white opacity-40">PROOVA TECHNOLOGY</p>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">RELATO DE CLIENTE</p>
                      </div>

                      <div className="flex-1 flex flex-col justify-center items-center w-full py-4 text-center">
                        <div className="flex justify-center gap-1.5 mb-6">
                            {[1,2,3,4,5].map((_, i) => (
                              <Star key={i} className="w-6 h-6 sm:w-7 sm:h-7 fill-[#fbbf24] text-[#fbbf24] drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                            ))}
                        </div>
                        
                        <div className="relative w-full max-w-[90%]">
                          <Quote className="absolute -top-4 -left-3 w-6 h-6 text-white opacity-20 rotate-180" />
                          <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl">
                            <p className={cn(
                              "font-black font-headline leading-tight italic text-white tracking-tight",
                              (selectedTestimonialForShare?.text?.length || 0) > 150 ? "text-sm" : "text-xl sm:text-2xl"
                            )}>
                              "{selectedTestimonialForShare?.text}"
                            </p>
                          </div>
                          <Quote className="absolute -bottom-4 -right-3 w-6 h-6 text-white opacity-20" />
                        </div>
                      </div>

                      <div className="w-full pt-6 border-t border-white/10">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-white font-black text-[11px] sm:text-xs uppercase tracking-[0.3em]">{selectedTestimonialForShare?.userName}</p>
                            <div className="bg-primary/20 px-4 py-1.5 rounded-full border border-primary/30 inline-flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                <p className="text-[7px] sm:text-[8px] text-white font-black uppercase tracking-[0.15em]">Feedback Verificado</p>
                            </div>
                          </div>
                      </div>
                   </div>
              </div>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-2xl gap-3 transition-all active:scale-95 text-xs bg-primary hover:bg-primary/90 text-white"
              onClick={handleDownloadContent}
              disabled={isExportingCard}
            >
              {isExportingCard ? <Loader2 className="animate-spin h-5 w-5" /> : <Download className="w-5 h-5" />}
              {selectedTestimonialForShare?.videoUrl ? 'Baixar Vídeo Review' : 'Baixar Arte PNG'}
            </Button>
          </div>
          
          <DialogFooter className="p-6 bg-muted/30 border-t flex flex-col items-center text-center shrink-0">
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary" /> Dica: Poste este card no seu Story e marque o cliente para aumentar seu alcance.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
