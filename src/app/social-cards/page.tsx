'use client';

import { AppSideMenu } from '@/components/app-menu';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Loader2, 
  Share2, 
  Star, 
  User, 
  MessageSquare,
  Search,
  LogOut,
  Inbox,
  Gem,
  Sun,
  Moon,
  Headphones,
  Download,
  Quote,
  CheckCircle2,
  Play,
  Zap,
  Check,
  Palette,
  Sparkles,
  LayoutGrid as LayoutGridIcon,
  BarChart3,
  Settings,
  ImageIcon,
  Menu,
  Lock,
  CircleHelp,
  Square,
  RectangleVertical,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger
} from '@/components/ui/sheet';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useCollection, useDoc, useAuth } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';
import { toPng } from 'html-to-image';
import { toast as shadcnToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/loading-screen';
import { ScrollBar } from '@/components/ui/scroll-area';
import { getAvailableTemplates, type TemplateMetadata } from '@/app/actions/template-actions';
import { SocialCardArt, CARD_SIZES, type CardFormat } from '@/components/social-card-art';
import { OnboardingTour, type TourStep } from '@/components/onboarding-tour';
import { usePageTour } from '@/hooks/use-page-tour';
import { ppPlanOf, ppCaps } from '@/lib/pp-plans';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Templates Dinâmicos
  const [availableTemplates, setAvailableTemplates] = useState<TemplateMetadata[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  const shareCardRef = useRef<HTMLDivElement>(null);
  const dialogVideoRef = useRef<HTMLVideoElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const tour = usePageTour(userDocRef, userData, 'cardsTourDone');

  // Marca da clínica (logo e nome) vem da página pública do usuário.
  const ppRef = useMemo(() => (db && user && userData?.companySlug ? doc(db, 'users', user.uid, 'pp', userData.companySlug) : null), [db, user, userData?.companySlug]);
  const { data: ppData } = useDoc(ppRef);
  const caps = useMemo(() => ppCaps(ppPlanOf(userData?.membershipStatus)), [userData?.membershipStatus]);
  const showProova = caps.removeBranding ? ppData?.showLogo !== false : true;

  const [format, setFormat] = useState<CardFormat>('feed');
  const [skipLogo, setSkipLogo] = useState(false);
  const [vw, setVw] = useState(420);
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    on(); window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const cardSize = CARD_SIZES[format];
  // Escala só na tela: cabe na largura do dialog e numa altura razoável. O PNG sai sempre em 1080 px de largura.
  const cardScale = Math.min(1, (Math.min(vw, 448) - 48) / cardSize.w, (format === 'story' ? 500 : 460) / cardSize.h);

  const tourSteps: TourStep[] = useMemo(() => [
    { title: 'Social Card Studio ✨', text: 'Aqui você transforma depoimentos aprovados em artes prontas para Instagram, Stories e outras redes. Vamos ver como funciona.' },
    { target: 'cards-search', title: 'Encontre o depoimento', text: 'Pesquise pelo nome do cliente ou por um trecho do relato.' },
    { target: 'cards-grid', title: 'Escolha e toque em "Criar Card"', text: 'Ao tocar, abre o estúdio: você escolhe o formato (Quadrado, Feed ou Story), o template e baixa a arte pronta em alta qualidade.' },
    { title: 'Sua marca no card', text: 'O card leva o nome e o logo da sua clínica (definidos no editor da página pública) e a nota real do cliente. Templates VIP são dos planos Premium e PRO.' },
  ] as TourStep[], []);

  const isPremiumUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'testimonials');
  }, [db, user]);

  const { data: rawTestimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  // Carrega templates
  useEffect(() => {
    async function loadTemplates() {
      setIsLoadingTemplates(true);
      const templates = await getAvailableTemplates();
      setAvailableTemplates(templates);
      if (templates.length > 0) {
        setSelectedTemplateId(templates[0].id);
      }
      setIsLoadingTemplates(false);
    }
    loadTemplates();
  }, []);

  const allApprovedTestimonials = useMemo(() => {
    if (!rawTestimonials) return [];
    return rawTestimonials
      .filter((t: any) => t.status === 'approved')
      .sort((a: any, b: any) => {
        const da = a.createdAt?.toDate?.() || new Date(0);
        const db = b.createdAt?.toDate?.() || new Date(0);
        return db.getTime() - da.getTime();
      });
  }, [rawTestimonials]);

  const filteredTestimonials = useMemo(() => {
    const list = allApprovedTestimonials;
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter((t: any) => 
      t.userName?.toLowerCase().includes(term) || 
      t.text?.toLowerCase().includes(term)
    );
  }, [allApprovedTestimonials, searchTerm]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isShareDialogOpen && selectedTestimonialForShare?.videoUrl && dialogVideoRef.current) {
      dialogVideoRef.current.load();
    }
  }, [isShareDialogOpen, selectedTestimonialForShare]);

  const activeTemplate = useMemo(() => {
    return availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];
  }, [selectedTemplateId, availableTemplates]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'PREMIUM';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

  const openShareDialog = (testimonial: any) => {
    setSelectedTestimonialForShare(testimonial);
    if (availableTemplates.length > 0) {
      setSelectedTemplateId(availableTemplates[0].id);
    }
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
      const opts = { pixelRatio: 1080 / cardSize.w, width: cardSize.w, height: cardSize.h, cacheBust: true, backgroundColor: undefined, style: { transform: 'none', borderRadius: '0' } };
      let dataUrl: string;
      try {
        dataUrl = await toPng(shareCardRef.current, opts as any);
      } catch (e) {
        // Logo hospedado sem CORS pode impedir a exportação: refaz sem o logo.
        setSkipLogo(true);
        await new Promise((r) => setTimeout(r, 250));
        dataUrl = await toPng(shareCardRef.current, opts as any);
      }
      const link = document.createElement('a');
      link.download = `proova-card-${String(selectedTestimonialForShare.userName || 'cliente').toLowerCase().replace(/\s+/g, '-')}-${format}.png`;
      link.href = dataUrl;
      link.click();
      shadcnToast({ title: "Card Gerado!", description: `Arte ${cardSize.label} (${cardSize.ratio}) pronta para as redes sociais.` });
    } catch (err) {
      shadcnToast({ variant: "destructive", title: "Erro ao exportar" });
    } finally {
      setIsExportingCard(false);
      setSkipLogo(false);
    }
  };

  const handleTemplateClick = (tpl: TemplateMetadata) => {
    const isVip = tpl.id.toLowerCase().includes('vip');
    if (isVip && !isPremiumUser) {
      shadcnToast({
        variant: "destructive",
        title: "Recurso Premium",
        description: "Templates VIP estão disponíveis apenas nos planos Proova AI Premium e PRO."
      });
      router.push('/pricing');
      return;
    }
    setSelectedTemplateId(tpl.id);
  };

  if (authLoading || (user && (testimonialsLoading || !userData))) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-hidden">
      <header className="bg-background border-b h-16 md:h-20 flex items-center px-2 md:px-4 fixed top-0 w-full z-[120] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-2 flex-1">
          <button 
            ref={toggleButtonRef}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="h-10 w-10 rounded-xl hover:bg-primary/5 text-primary border border-primary/10 transition-all flex items-center justify-center focus:outline-none z-[150] relative"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
              <line x1="4" y1="7" x2="20" y2="7" className={cn("origin-center transition-all", isMenuOpen ? "translate-y-[5px] rotate-45" : "")} />
              <line x1="4" y1="12" x2="20" y2="12" className={cn("origin-center transition-all", isMenuOpen ? "opacity-0" : "")} />
              <line x1="4" y1="17" x2="20" y2="17" className={cn("origin-center transition-all", isMenuOpen ? "-translate-y-[5px] -rotate-45" : "")} />
            </svg>
          </button>
          <Link href="/dash" className="flex items-center group -ml-2">
            <div className="relative w-[140px] h-[46px] md:w-[280px] md:h-[93px]">
              <Image src="/logo-proovaai-whitemode.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/logo-proovaai-darkmode.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="flex border-none bg-transparent shadow-none hover:bg-transparent focus:bg-transparent" />
        </div>
      </header>

      {tour.open && <OnboardingTour steps={tourSteps} onFinish={tour.finish} />}
      <AppSideMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} toggleRef={toggleButtonRef} companyName={userData?.companyName} membershipLabel={membershipLabel} isAdmin={userData?.isAdmin === true} pendingCount={allApprovedTestimonials.filter(t => t.status === 'pending').length} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-32 pb-20">
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
          <header className="space-y-4">
             <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter uppercase">Social Card Studio</h1>
             <p className="text-muted-foreground text-sm md:text-lg font-medium leading-relaxed max-w-2xl">Transforme depoimentos de texto em artes de alta autoridade para o seu Instagram.</p>
             <button type="button" onClick={tour.start} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1.5"><CircleHelp className="w-3.5 h-3.5" /> Como funciona</button>
          </header>

          <div className="relative group" data-tour="cards-search">
            <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Pesquisar por nome do cliente ou trecho do relato..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 pl-12 rounded-2xl bg-background border-primary/10 focus:ring-primary/20 font-bold text-sm shadow-sm"
            />
          </div>

          <div data-tour="cards-grid" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTestimonials.length === 0 ? (
              <div className="col-span-full py-32 text-center opacity-30 border-2 border-dashed rounded-[3rem] bg-muted/10">
                <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">Nenhum depoimento qualificado</p>
              </div>
            ) : (
              filteredTestimonials.map((t: any) => (
                <Card key={t.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer group bg-card overflow-hidden active:scale-[0.98]" onClick={() => openShareDialog(t)}>
                   <CardContent className="p-6 space-y-5">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner"><User className="w-5 h-5" /></div>
                            <p className="text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{t.userName}</p>
                         </div>
                         <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3.5 h-3.5", s <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />)}</div>
                      </div>
                      <div className="relative">
                         <Quote className="absolute -top-2 -left-2 w-6 h-6 text-primary/10 rotate-180" />
                         <p className="text-xs italic leading-relaxed text-muted-foreground line-clamp-3 font-medium px-2">"{t.text}"</p>
                      </div>
                      <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2 bg-foreground text-background group-hover:bg-primary group-hover:text-white transition-all shadow-lg">
                         <Share2 className="w-4 h-4" /> Criar Card
                      </Button>
                   </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl p-0 overflow-hidden bg-background max-h-[92vh] flex flex-col">
          <DialogHeader className="p-4 sm:p-8 pb-2 text-center shrink-0">
            <div className="flex items-center justify-center gap-2 mb-1">
               <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
               <DialogTitle className="text-lg sm:text-xl font-black font-headline uppercase tracking-tight">Social Design Studio</DialogTitle>
            </div>
            <DialogDescription className="text-[10px] sm:text-xs font-medium">Selecione um template e gere sua arte para post.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-6 flex flex-col items-center gap-4 sm:gap-6 scrollbar-hide">
            <div className="w-full shrink-0">
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 sm:mb-3 ml-1">Templates Disponíveis:</p>
              {isLoadingTemplates ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin h-5 w-5 text-primary" /></div>
              ) : (
                <ScrollArea className="w-full whitespace-nowrap rounded-xl border p-2 bg-muted/20">
                  <div className="flex w-max space-x-3 p-1">
                    {availableTemplates.map((tpl) => {
                      const isVip = tpl.id.toLowerCase().includes('vip');
                      const isLocked = isVip && !isPremiumUser;
                      return (
                        <button
                          key={tpl.id}
                          onClick={() => handleTemplateClick(tpl)}
                          className={cn(
                            "relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all border-2",
                            selectedTemplateId === tpl.id ? "border-primary bg-primary/5 shadow-md" : "border-transparent hover:border-primary/20",
                            isLocked && "grayscale opacity-80"
                          )}
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shadow-inner overflow-hidden relative bg-black">
                            <Image src={tpl.imageUrl} alt={tpl.name} fill className="object-cover" />
                            {isLocked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Lock className="w-4 h-4 text-white" /></div>}
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter">{tpl.name}</span>
                            {isVip && <Badge className="h-3 text-[5px] font-black uppercase bg-primary/20 text-primary border-none px-1">VIP</Badge>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </div>

            <div className="w-full shrink-0">
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">Formato:</p>
              <div className="grid grid-cols-3 gap-2">
                {([['square', Square], ['feed', RectangleVertical], ['story', Smartphone]] as const).map(([f, Icon]) => (
                  <button key={f} type="button" onClick={() => setFormat(f)}
                    className={cn("flex flex-col items-center gap-0.5 rounded-xl border-2 py-2 transition-all", format === f ? "border-primary bg-primary/5 shadow-md" : "border-transparent bg-muted/30 hover:border-primary/20")}>
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-wide">{CARD_SIZES[f].label}</span>
                    <span className="text-[8px] font-bold text-muted-foreground">{CARD_SIZES[f].ratio}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full flex justify-center py-1 shrink-0">
              <div className="overflow-hidden shadow-2xl rounded-2xl transition-all" style={{ width: cardSize.w * cardScale, height: cardSize.h * cardScale }}>
                <SocialCardArt
                  ref={shareCardRef}
                  testimonial={selectedTestimonialForShare}
                  imageUrl={activeTemplate?.imageUrl}
                  background={activeTemplate?.style.background}
                  lightText={activeTemplate?.style.color === '#ffffff'}
                  format={format}
                  companyName={userData?.companyName}
                  logoUrl={skipLogo ? null : ppData?.logoUrl}
                  showProova={showProova}
                  anchor={activeTemplate?.anchor}
                  style={{ transform: `scale(${cardScale})` }}
                />
              </div>
            </div>

            <Button 
              className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest shadow-2xl gap-3 transition-all active:scale-95 text-[10px] sm:text-xs bg-primary hover:bg-primary/90 text-white"
              onClick={handleDownloadContent}
              disabled={isExportingCard || availableTemplates.length === 0}
            >
              {isExportingCard ? <Loader2 className="animate-spin h-5 w-5" /> : <Download className="w-4 h-4 sm:w-5 sm:h-5" />}
              {selectedTestimonialForShare?.videoUrl ? 'Baixar Vídeo Review' : 'Gerar Arte PNG'}
            </Button>
          </div>
          
          <DialogFooter className="p-4 sm:p-6 bg-muted/30 border-t flex flex-col items-center text-center shrink-0">
            <p className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary" /> Dica: use o formato Story para postar direto nos Stories e aumentar seu alcance.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
