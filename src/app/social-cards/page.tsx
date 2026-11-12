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
  Zap,
  Check,
  Palette,
  Sparkles,
  X,
  LayoutGrid as LayoutGridIcon,
  BarChart3,
  Settings,
  ImageIcon,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetDescription 
} from '@/components/ui/sheet';
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { ScrollBar } from '@/components/ui/scroll-area';
import { getAvailableTemplates, type TemplateMetadata } from '@/app/actions/template-actions';

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

  const isPremiumUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const isMapsLinkValid = useMemo(() => {
    if (!userData?.googleMapsUrl) return false;
    const url = userData.googleMapsUrl.toLowerCase();
    return url.includes('review') || url.includes('writereview') || url.includes('placeid');
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

  const isAgency = useMemo(() => {
    return userData?.businessType === 'agencia';
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
      
      const dataUrl = await toPng(shareCardRef.current, { 
        quality: 1.0, 
        pixelRatio: 3, 
        backgroundColor: null, 
        style: { borderRadius: '0' }
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

  const handleTemplateClick = (tpl: TemplateMetadata) => {
    const isVip = tpl.id.toLowerCase().includes('vip');
    if (isVip && !isPremiumUser) {
      shadcnToast({
        variant: "destructive",
        title: "Recurso Premium",
        description: "Templates VIP estão disponíveis apenas nos planos Gold e Enterprise."
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
            <div className="relative w-[140px] h-[46px] md:w-[280px] md:h-[90px]">
              <Image src="/logo-proova-white-mode.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-landing-dark-mode.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex border-none bg-transparent shadow-none hover:bg-transparent focus:bg-transparent" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 md:h-12 px-1.5 md:px-3 gap-2 rounded-xl focus:ring-0 shadow-none hover:bg-transparent">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] md:text-sm font-black truncate max-w-[120px] transition-colors group-hover:text-primary uppercase tracking-tight">{userData?.companyName || 'Empresa'}</span>
                  <div className="flex flex-col items-end gap-0">
                    <span className={cn(
                      "text-[6px] md:text-[8px] uppercase tracking-widest font-black text-primary leading-tight",
                      userData?.membershipStatus === 'enterprise' && "animate-pulse"
                    )}>
                      {membershipLabel}
                    </span>
                    {isMapsLinkValid && <span className="text-[5px] md:text-[6px] font-black uppercase text-green-500 tracking-tighter leading-none animate-pulse">G-Boost Ativo</span>}
                  </div>
                </div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><User className="w-4 h-4" /></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <LayoutGridIcon className="mr-2 h-4 w-4 text-primary" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Settings className="mr-2 h-4 w-4 text-primary" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive font-bold py-2.5 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
        <SheetContent 
          side="left" 
          className="w-full max-w-[300px] border-none shadow-2xl bg-background p-0 flex flex-col h-[100dvh] overflow-hidden z-[110]"
          onPointerDownOutside={(e) => {
            if (toggleButtonRef.current?.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de Navegação</SheetTitle>
            <SheetDescription>Acesse as funcionalidades e configurações da sua conta Proova.</SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col pt-20">
            <div className="p-6 border-b bg-muted/10 shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 shadow-inner">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black uppercase tracking-tight truncate">{userData?.companyName}</p>
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary">{membershipLabel}</span>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-4 py-6 space-y-8">
                <div>
                  <p className="px-3.5 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Navegação Principal</p>
                  <button 
                    onClick={() => { router.push('/dash'); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all group"
                  >
                    <LayoutGridIcon className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100" />
                    <span>Dashboard</span>
                  </button>
                </div>

                <div>
                  <p className="px-3.5 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Ferramentas Proova</p>
                  {[
                    { label: 'Social Cards', href: '/social-cards', icon: ImageIcon, active: true },
                    { label: 'Moderação Inbox', href: '/private', icon: Inbox, badge: allApprovedTestimonials.filter(t => t.status === 'pending').length },
                    { label: 'Métricas & ROI', href: '/metrics', icon: BarChart3 },
                  ].map((item: any, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        router.push(item.href);
                        setIsMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3.5 rounded-xl transition-all group",
                        item.active ? "bg-primary/10 text-primary" : "hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className={cn("w-4 h-4", item.active ? "text-primary" : "text-primary opacity-60 group-hover:opacity-100")} />
                        <span className={cn(item.active ? "text-[10px] font-black uppercase tracking-widest" : "")}>{item.label}</span>
                      </div>
                      {item.badge > 0 && <Badge className="bg-destructive text-white h-4 px-1.5 text-[8px]">{item.badge}</Badge>}
                    </button>
                  ))}
                </div>

                <div>
                  <p className="px-3.5 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Suporte & Conta</p>
                  {[
                    { label: 'Suporte VIP', href: '/support', icon: Headphones },
                    { label: 'Configurações', href: '/settings', icon: Settings },
                  ].map((item: any, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        router.push(item.href);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all group"
                    >
                      <item.icon className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <div className="p-4 border-t shrink-0">
               <Button 
                 variant="ghost" 
                 className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/10 font-black uppercase tracking-widest text-[9px] gap-2"
                 onClick={() => signOut(auth)}
               >
                  <LogOut className="w-4 h-4" /> Sair da Conta
               </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-32 pb-20">
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
          <header className="space-y-4">
             <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter uppercase">Social Card Studio</h1>
             <p className="text-muted-foreground text-sm md:text-lg font-medium leading-relaxed max-w-2xl">Transforme depoimentos de texto em artes de alta autoridade para o seu Instagram.</p>
          </header>

          <div className="relative group">
            <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Pesquisar por nome do cliente ou trecho do relato..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 pl-12 rounded-2xl bg-background border-primary/10 focus:ring-primary/20 font-bold text-sm shadow-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                         <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3.5 h-3.5", s <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted/20")} />)}</div>
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

            <div className="w-full flex justify-center py-1 shrink-0">
              <div 
                ref={shareCardRef}
                className={cn(
                  "relative overflow-hidden shadow-2xl transition-all duration-700",
                  "w-[min(92vw,400px)] aspect-square rounded-[2rem] sm:rounded-[2.5rem] flex flex-col items-center"
                )}
                style={{ backgroundColor: activeTemplate?.style.background || '#000000' }}
              >
                   {activeTemplate?.imageUrl && <div className="absolute inset-0 z-0"><Image src={activeTemplate.imageUrl} alt="Bg" fill className="object-cover" priority /></div>}
                   <div className="relative z-10 w-full flex flex-col h-full justify-between items-center p-6 sm:p-12">
                      <div className="text-center space-y-1 mt-2 sm:mt-4">
                        <p className={cn("text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em]", activeTemplate?.style.color === '#ffffff' ? "text-white/80" : "text-black/80")}>RELATO DE CLIENTE</p>
                      </div>
                      <div className="flex-1 flex flex-col justify-center items-center w-full py-2 text-center">
                        <div className="flex justify-center gap-1 mb-3 sm:mb-4">
                            {[1,2,3,4,5].map((_, i) => <Star key={i} className="w-4 h-4 sm:w-7 sm:h-7 fill-[#fbbf24] text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />)}
                        </div>
                        <div className="relative w-full max-w-[90%] sm:max-w-[85%]">
                          <Quote className={cn("absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-4 h-4 sm:w-5 sm:h-5 opacity-20 rotate-180", activeTemplate?.style.color === '#ffffff' ? "text-white" : "text-black")} />
                          <div className={cn("p-4 sm:p-7 rounded-[1.5rem] sm:rounded-[1.8rem] shadow-2xl ring-1", activeTemplate?.style.color === '#ffffff' ? "bg-white/5 backdrop-blur-xl border-white/10 ring-white/5" : "bg-black/5 backdrop-blur-md border-black/5 ring-black/5")}>
                            <p className={cn("font-black font-headline leading-tight italic tracking-tight", activeTemplate?.style.color === '#ffffff' ? "text-white" : "text-black", (selectedTestimonialForShare?.text?.length || 0) > 180 ? "text-[9px] sm:text-xs" : (selectedTestimonialForShare?.text?.length || 0) > 120 ? "text-[10px] sm:text-sm" : (selectedTestimonialForShare?.text?.length || 0) > 80 ? "text-xs sm:text-base" : "text-base sm:text-xl")}>"{selectedTestimonialForShare?.text}"</p>
                          </div>
                          <Quote className={cn("absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-4 h-4 sm:w-5 sm:h-5 opacity-20", activeTemplate?.style.color === '#ffffff' ? "text-white" : "text-black")} />
                        </div>
                      </div>
                      <div className={cn("w-full pt-3 sm:pt-4 mb-2 sm:mb-4", activeTemplate?.style.color === '#ffffff' ? "border-t border-white/10" : "border-t border-black/10")}>
                          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                            <p className={cn("font-black text-[9px] sm:text-xs uppercase tracking-[0.3em]", activeTemplate?.style.color === '#ffffff' ? "text-white" : "text-black")}>{selectedTestimonialForShare?.userName}</p>
                            <div className={cn("px-3 sm:px-4 py-0.5 sm:py-1 rounded-full border inline-flex items-center gap-1 sm:gap-1.5 backdrop-blur-md shadow-sm", activeTemplate?.style.color === '#ffffff' ? "bg-primary/20 border-primary/30" : "bg-primary/10 border-primary/20")}>
                                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary fill-primary/5" />
                                <p className={cn("text-[5px] sm:text-[7px] font-black uppercase tracking-[0.15em]", activeTemplate?.style.color === '#ffffff' ? "text-white" : "text-black")}>coletado via Proova</p>
                            </div>
                          </div>
                      </div>
                   </div>
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
              <Zap className="w-3 h-3 text-primary" /> Dica: Poste este card no seu Story para aumentar seu alcance.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
