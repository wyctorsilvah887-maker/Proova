'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Star, 
  Eye,
  MessageSquare,
  Check,
  User,
  LayoutGrid,
  Play,
  CheckCircle2,
  Monitor,
  Copy,
  Layout,
  Palette,
  ChevronDown,
  LogOut,
  TrendingUp,
  Gem,
  Shield,
  Sun,
  Moon,
  Zap,
  Settings2,
  Sparkles,
  ExternalLink,
  Lock,
  X,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useDoc, useCollection, useAuth } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

type LayoutType = 'mural' | 'carousel' | 'grid' | 'popup';

const TestimonialCardPreview = ({ 
  t, 
  themeColor, 
  secondaryColor, 
  isPopup = false, 
  isAnimating = false, 
  index = 0, 
  muralIndex = 0 
}: { 
  t: any, 
  themeColor: string, 
  secondaryColor: string, 
  isPopup?: boolean, 
  isAnimating?: boolean, 
  index?: number, 
  muralIndex?: number 
}) => {
  const side = (index + muralIndex) % 2 === 0 ? 'left' : 'right';
  const hasSecondary = !!secondaryColor && secondaryColor !== 'transparent' && secondaryColor !== '';

  return (
    <Card 
      key={`${t.id}-${muralIndex}`}
      className={cn(
        "rounded-[1.5rem] p-4 text-left transition-all duration-700 w-full bg-white dark:bg-black text-black dark:text-white",
        !isPopup && (side === 'left' ? "animate-in fade-in slide-in-from-left-4" : "animate-in fade-in slide-in-from-right-4"),
        isPopup && !isAnimating && "animate-in fade-in zoom-in-95 duration-1000",
        isPopup && isAnimating && "animate-out fade-out zoom-out-95 duration-1000"
      )}
      style={{ 
        border: hasSecondary ? 'none' : '1px solid rgba(0,0,0,0.05)',
        boxShadow: hasSecondary 
          ? `0 0 25px ${secondaryColor}50, 0 10px 30px -10px rgba(0,0,0,0.15)` 
          : `0 10px 30px -10px ${themeColor}15`,
      }}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full border flex items-center justify-center shrink-0 bg-muted/20" style={{ borderColor: hasSecondary ? `${secondaryColor}40` : `${themeColor}40` }}>
            <User className="w-3.5 h-3.5" style={{ color: hasSecondary ? secondaryColor : themeColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[11px] tracking-tight truncate uppercase leading-none">{t.userName}</p>
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("w-2.5 h-2.5 fill-current", i < (t.rating || 5) ? "" : "opacity-10")} style={{ color: hasSecondary ? secondaryColor : themeColor }} />
              ))}
            </div>
          </div>
        </div>

        {t.text && t.text !== '(Depoimento em Vídeo)' && (
          <p className="italic text-[11px] sm:text-xs leading-relaxed opacity-70 font-medium tracking-tight">"{t.text}"</p>
        )}
        
        <div className="pt-2 border-t border-muted/20 flex items-center justify-between opacity-50">
           <div className="flex items-center gap-1">
             <Clock className="w-2.5 h-2.5" />
             <span className="text-[7px] font-black uppercase tracking-widest">Agora</span>
           </div>
           <div className="flex items-center gap-1">
             <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
             <span className="text-[7px] font-black uppercase tracking-widest">Verificado</span>
           </div>
        </div>
      </div>
    </Card>
  );
};

const EmbedSettings = ({ 
  layout, setLayout, 
  themeColor, setThemeColor,
  secondaryColor, setSecondaryColor,
  autoPublishEnabled, setAutoPublishEnabled,
  autoPublishMinRating, setAutoPublishMinRating,
  autoPublishMinChars, setAutoPublishMinChars,
  isGoldPlan,
  onClose
}: any) => {
  const colors = ['#f97316', '#D4AF37', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#e11d48', '#0d9488', '#7c3aed', '#475569', '#000000', '#ffffff'];

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-background border-r">
      <div className="p-4 border-b bg-muted/10 shrink-0 flex items-center justify-between">
        <Link href="/widgets">
          <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground hover:text-primary transition-all border-none shadow-none bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:ring-0 select-none h-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden text-muted-foreground h-8 w-8 rounded-full"><X className="w-4 h-4" /></Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-8 pb-10">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 ml-1">
              <Zap className="w-3 h-3" /> Automação Inteligente
            </Label>
            
            <div className="p-4 rounded-2xl border bg-primary/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Auto-Publish</Label>
                  <p className="text-[9px] text-muted-foreground">Publicar novos elogios automaticamente</p>
                </div>
                <Switch checked={autoPublishEnabled} onCheckedChange={setAutoPublishEnabled} />
              </div>

              {autoPublishEnabled && (
                <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase opacity-60">Nota Mínima</Label>
                    <div className="flex gap-1">
                      {[3, 4, 5].map((val) => (
                        <Button 
                          key={val} 
                          variant={autoPublishMinRating === val ? 'default' : 'outline'} 
                          size="sm" 
                          className="flex-1 h-7 text-[10px] font-bold rounded-lg"
                          onClick={() => setAutoPublishMinRating(val)}
                        >
                          {val} Estrelas
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase opacity-60">Caracteres Mínimos ({autoPublishMinChars})</Label>
                    <Input 
                      type="number" 
                      value={autoPublishMinChars} 
                      onChange={(e) => setAutoPublishMinChars(parseInt(e.target.value) || 0)}
                      className="h-8 text-xs rounded-lg"
                      min={0}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Formato do Mural</Label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'grid', icon: Layout, label: 'Grade Padrão', isGold: false },
                { id: 'mural', icon: LayoutGrid, label: 'Mural Masonry', isGold: true },
                { id: 'carousel', icon: Play, label: 'Carrossel Dinâmico', isGold: true },
                { id: 'popup', icon: MessageSquare, label: 'Popup de Prova Social', isGold: true },
              ].map((item) => {
                const isLocked = item.isGold && !isGoldPlan;
                return (
                  <button 
                    key={item.id}
                    disabled={isLocked}
                    onClick={() => setLayout(item.id as LayoutType)} 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all", 
                      layout === item.id ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/20",
                      isLocked && "opacity-50 grayscale cursor-not-allowed bg-muted/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-4 h-4", layout === item.id ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-bold", layout === item.id ? "text-primary" : "text-foreground")}>{item.label}</span>
                    </div>
                    {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t">
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-1">
                <Palette className="w-3 h-3 text-primary" /> Cor da Marca
              </Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button key={color} onClick={() => setThemeColor(color)} className={cn("w-7 h-7 rounded-full border-2 transition-transform", themeColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-80 shadow-inner")} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t">
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-1">
                <Palette className="w-3 h-3 text-primary" /> Efeito Bordas Neon
              </Label>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setSecondaryColor('')} 
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-transform flex items-center justify-center bg-muted/20 relative overflow-hidden", 
                    !secondaryColor ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-80"
                  )}
                  title="Nenhum Efeito"
                >
                  <div className="absolute inset-0 bg-card" />
                  <div className="absolute inset-0 flex items-center justify-center"><div className="w-px h-full bg-red-500 rotate-45" /></div>
                </button>
                {colors.map((color) => (
                  <button key={color} onClick={() => setSecondaryColor(color)} className={cn("w-7 h-7 rounded-full border-2 transition-transform", secondaryColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-80 shadow-inner")} style={{ backgroundColor: color }} />
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground italic ml-1">Escolha uma cor para ativar o brilho neon nas bordas.</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default function EmbedEditorPage({ params }: { params: Promise<{ widgetId: string }> }) {
  const { widgetId } = use(params);
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const widgetRef = useMemo(() => (db && user ? doc(db, 'users', user.uid, 'widgets', widgetId) : null), [db, user, widgetId]);
  const { data: widgetData, loading: widgetLoading } = useDoc(widgetRef);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const status = useMemo(() => {
    if (!userData) return 'base';
    return (userData.membershipStatus || 'base').toLowerCase();
  }, [userData]);

  const isEnterprise = status === 'enterprise';
  const isGold = status === 'gold';
  const isTrial = status === 'trial';
  
  const SELECTION_LIMIT = isEnterprise ? Infinity : ((isGold || isTrial) ? 50 : 5);
  const isGoldPlan = isGold || isTrial || isEnterprise;

  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'testimonials'), where('status', '==', 'approved'));
  }, [db, user]);

  const { data: approvedTestimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutType>('grid'); 
  const [themeColor, setThemeColor] = useState('#f97316');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [autoPublishMinRating, setAutoPublishMinRating] = useState(5);
  const [autoPublishMinChars, setAutoPublishMinChars] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Estados para animação do preview
  const [muralIndex, setMuralIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
      const checkMobile = () => setIsMobile(window.innerWidth < 1024);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  useEffect(() => {
    if (widgetData) {
      setSelectedIds(widgetData.selectedTestimonialIds || []);
      setLayout(widgetData.layout || 'grid');
      setThemeColor(widgetData.themeColor || '#f97316');
      setSecondaryColor(widgetData.secondaryColor || '');
      setAutoPublishEnabled(widgetData.autoPublishEnabled || false);
      setAutoPublishMinRating(widgetData.autoPublishMinRating || 5);
      setAutoPublishMinChars(widgetData.autoPublishMinChars || 0);
    }
  }, [widgetData]);

  // Efeito de animação do preview igual ao widgetpublic
  useEffect(() => {
    if ((layout === 'mural' || layout === 'popup' || layout === 'carousel') && selectedIds.length > 0) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setMuralIndex(prev => (prev + 1) % selectedIds.length);
          setIsAnimating(false);
        }, 500);
      }, layout === 'popup' ? 8000 : 6000);
      return () => clearInterval(interval);
    }
  }, [layout, selectedIds]);

  const currentSelection = useMemo(() => {
    return approvedTestimonials?.filter(t => selectedIds.includes(t.id)) || [];
  }, [approvedTestimonials, selectedIds]);

  const visibleTestimonialsPreview = useMemo(() => {
    if (currentSelection.length === 0) return [];
    
    if (layout === 'mural') {
      const slice = [];
      const count = Math.min(2, currentSelection.length);
      for (let i = 0; i < count; i++) {
        const idx = (muralIndex + i) % currentSelection.length;
        slice.push(currentSelection[idx]);
      }
      return slice;
    }
    
    if (layout === 'carousel' || layout === 'popup') {
      return [currentSelection[muralIndex % currentSelection.length]];
    }
    
    return currentSelection;
  }, [currentSelection, layout, muralIndex]);

  const handleSave = async () => {
    if (!widgetRef) return;
    setIsSaving(true);
    updateDoc(widgetRef, {
      selectedTestimonialIds: selectedIds,
      layout,
      themeColor,
      secondaryColor,
      autoPublishEnabled,
      autoPublishMinRating,
      autoPublishMinChars
    }).then(() => {
      setIsSaving(false);
      setIsCodeDialogOpen(true);
    }).catch(() => setIsSaving(false));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const isRemoving = prev.includes(id);
      if (!isRemoving && prev.length >= SELECTION_LIMIT) {
        toast({
          variant: "destructive",
          title: `Limite de Seleção`,
          description: `Seu plano permite até ${SELECTION_LIMIT} depoimentos por mural.`,
        });
        return prev;
      }
      return isRemoving ? prev.filter(i => i !== id) : [...prev, id];
    });
  };

  const embedCode = `<iframe src="${baseUrl}/widgetpublic/${user?.uid}/${widgetId}" width="100%" height="600px" style="border:none;" allowtransparency="true"></iframe>`;

  if (authLoading || widgetLoading || testimonialsLoading || (user && !userData)) {
    return <div className="flex h-screen items-center justify-center bg-muted/30"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  const sidebarProps = { 
    layout, setLayout, themeColor, setThemeColor, secondaryColor, setSecondaryColor,
    autoPublishEnabled, setAutoPublishEnabled, autoPublishMinRating, setAutoPublishMinRating, autoPublishMinChars, setAutoPublishMinChars,
    isGoldPlan,
    onClose: () => setIsSidebarOpen(false)
  };

  const isMapsLinkValid = !!userData?.googleMapsUrl;
  const membershipLabelDisplay = isEnterprise ? 'ENTERPRISE' : (isGold ? 'GOLD' : (isTrial ? 'TRIAL' : 'PLANO BASE'));

  return (
    <div className="h-screen flex flex-col font-body w-full overflow-hidden bg-background">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/widgets">
            <Button variant="ghost" size="sm" className="h-10 px-2 gap-2 text-muted-foreground hover:text-primary hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:ring-0 rounded-xl shadow-none">
               <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Voltar</span>
            </Button>
          </Link>
          <div className="relative w-[160px] h-[52px] md:w-[240px] md:h-[78px]">
            <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
            <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex h-9 md:h-12 px-2 md:px-4 rounded-xl font-bold gap-1.5 md:gap-2 border-primary/20 text-primary hover:bg-primary/5 shadow-sm text-[10px] md:text-sm"
            onClick={() => window.open(`/widgetpublic/${user?.uid}/${widgetId}`, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden xs:inline">Visualizar</span>
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="flex h-9 md:h-12 px-3 md:px-6 rounded-xl font-bold gap-1.5 md:gap-2 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] md:text-sm"
          >
            {isSaving ? <Loader2 className="animate-spin h-3.5 w-3.5 md:h-4 md:w-4" /> : <Save className="h-3.5 w-3.5 md:h-4 md:w-4" />} <span className="hidden xs:inline">Salvar</span>
          </Button>
          <ThemeToggle className="hidden sm:flex" />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative w-full h-full pt-24 md:pt-32">
        <aside className={cn("hidden lg:flex w-80 bg-background border-r flex-col h-full transition-all duration-300", !isSidebarOpen && "w-0 opacity-0 -ml-80")}>
          <EmbedSettings {...sidebarProps} />
        </aside>

        <Sheet open={isSidebarOpen && isMobile} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0 w-80 border-none">
            <SheetHeader className="sr-only">
              <SheetTitle>Configurações do Mural</SheetTitle>
              <SheetDescription>Ajuste o layout, automações e cores do seu mural.</SheetDescription>
            </SheetHeader>
            <EmbedSettings {...sidebarProps} />
          </SheetContent>
        </Sheet>

        <div className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors outline-none"><Monitor className="w-4 h-4" /> EDITAR</button>
              <div className="flex items-center gap-2 bg-background border px-3 py-1 rounded-full shadow-sm">
                <span className="text-[10px] font-bold opacity-50 uppercase">Widget ID:</span>
                <span className="text-[10px] font-mono font-black text-primary">{widgetId}</span>
              </div>
            </div>
            
            <div className="relative border shadow-2xl bg-muted/10 p-8 md:p-12 rounded-[3rem] min-h-[400px] flex items-center justify-center ring-1 ring-primary/5">
              <div className="w-full max-w-lg">
                {visibleTestimonialsPreview.length > 0 ? (
                  <div className={cn(
                    "grid gap-6", 
                    layout === 'grid' ? "grid-cols-1 md:grid-cols-2" : (
                      layout === 'mural' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                    )
                  )}>
                    {visibleTestimonialsPreview.map((t: any, i: number) => (
                      <div key={`${t.id}-${muralIndex}-${i}`} className="flex justify-center">
                        <TestimonialCardPreview 
                          t={t} 
                          themeColor={themeColor} 
                          secondaryColor={secondaryColor} 
                          isPopup={layout === 'popup'} 
                          isAnimating={isAnimating}
                          index={i}
                          muralIndex={muralIndex}
                        />
                      </div>
                    ))}
                  </div>
                ) : <div className="text-center opacity-30 italic text-sm">Selecione depoimentos abaixo para gerar a visualização.</div>}
              </div>
            </div>

            <div className="space-y-6 pt-12 border-t">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="testimonials" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-0 group">
                    <div className="flex items-center justify-between w-full pr-6">
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-hover:text-primary transition-colors"><MessageSquare className="w-4 h-4" /> Depoimentos Disponíveis</h2>
                      <Badge variant="outline" className="text-[9px] h-5 font-black uppercase px-2">{selectedIds.length} / {isEnterprise ? '∞' : SELECTION_LIMIT} ATIVOS</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {approvedTestimonials?.map((t: any) => {
                        const isSelected = selectedIds.includes(t.id);
                        return (
                          <div key={t.id} onClick={() => toggleSelection(t.id)} className={cn("cursor-pointer transition-all rounded-xl border-2 p-4 bg-background group", isSelected ? "border-primary bg-primary/5" : "border-transparent shadow-sm hover:border-primary/20")}>
                            <div className="flex items-start gap-3">
                              <div className={cn("mt-1 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-[11px] block truncate group-hover:text-primary transition-colors">{t.userName}</span>
                                {t.text && t.text !== '(Depoimento em Vídeo)' && <p className="text-[10px] text-muted-foreground italic line-clamp-1 mt-1">"{t.text}"</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4 text-green-600"><CheckCircle2 className="w-8 h-8" /></div>
            <DialogTitle className="text-2xl font-black font-headline">Mural Pronto!</DialogTitle>
            <DialogDescription>Copie o código abaixo e cole no seu site.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative bg-muted/50 rounded-xl p-4 border border-primary/20 group">
              <pre className="text-[10px] font-mono text-foreground break-all whitespace-pre-wrap">{embedCode}</pre>
              <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8 hover:bg-primary hover:text-white transition-all" onClick={() => { navigator.clipboard.writeText(embedCode); toast({ title: "Copiado!" }); }}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <DialogFooter><Button className="w-full font-black h-12 rounded-xl" onClick={() => setIsCodeDialogOpen(false)}>Concluído</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
