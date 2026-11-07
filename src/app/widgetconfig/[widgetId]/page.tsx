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
  Lock,
  Zap,
  Settings2,
  Sparkles
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

const TestimonialCardPreview = ({ t, themeColor }: { t: any, themeColor: string }) => {
  return (
    <Card 
      className="bg-[#111111] rounded-[2.5rem] p-6 border-none shadow-xl text-left"
      style={{ 
        boxShadow: `0 10px 30px -15px ${themeColor}30`,
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-white font-black text-sm rotate-3 shrink-0" style={{ backgroundColor: themeColor }}>
              {t.userName?.substring(0, 2).toUpperCase()}
            </div>
            <p className="font-bold text-xs text-white truncate max-w-[100px]">{t.userName}</p>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-2.5 h-2.5 fill-current" style={{ color: themeColor }} />
            ))}
          </div>
        </div>
        {t.text && t.text !== '(Depoimento em Vídeo)' && (
          <p className="italic text-[10px] line-clamp-3 text-zinc-300">"{t.text}"</p>
        )}
      </div>
    </Card>
  );
};

const EmbedSettings = ({ 
  layout, setLayout, 
  themeColor, setThemeColor,
  autoPublishEnabled, setAutoPublishEnabled,
  autoPublishMinRating, setAutoPublishMinRating,
  autoPublishMinChars, setAutoPublishMinChars,
  handleSave, isSaving,
  isGoldPlan,
  onClose
}: any) => {
  const colors = ['#f97316', '#D4AF37', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#e11d48', '#0d9488', '#7c3aed', '#475569', '#000000', '#ffffff'];

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-background border-r">
      <div className="p-4 border-b bg-muted/10 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
           <Link href="/widgets">
            <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground hover:text-primary transition-all border-none shadow-none bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:ring-0 select-none h-8">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden text-muted-foreground">
            Fechar
          </Button>
        </div>
        
        <Button onClick={handleSave} disabled={isSaving} className="w-full shadow-lg h-12 rounded-xl font-bold gap-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95">
          {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          Salvar Mural
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-8 pb-10">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Zap className="w-3 h-3" /> Automação Inteligente
            </Label>
            
            <div className="p-4 rounded-2xl border bg-primary/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Auto-Publish</Label>
                  <p className="text-[9px] text-muted-foreground">Publicar novos elogios sem aprovação manual</p>
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
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Formato do Mural</Label>
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
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Palette className="w-3 h-3 text-primary" /> Cor da Marca
              </Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button key={color} onClick={() => setThemeColor(color)} className={cn("w-7 h-7 rounded-full border-2 transition-transform", themeColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-80 shadow-inner")} style={{ backgroundColor: color }} />
                ))}
              </div>
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
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [autoPublishMinRating, setAutoPublishMinRating] = useState(5);
  const [autoPublishMinChars, setAutoPublishMinChars] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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
      setAutoPublishEnabled(widgetData.autoPublishEnabled || false);
      setAutoPublishMinRating(widgetData.autoPublishMinRating || 5);
      autoPublishMinChars !== undefined && setAutoPublishMinChars(widgetData.autoPublishMinChars || 0);
    }
  }, [widgetData]);

  const currentSelection = useMemo(() => {
    return approvedTestimonials?.filter(t => selectedIds.includes(t.id)) || [];
  }, [approvedTestimonials, selectedIds]);

  const handleSave = async () => {
    if (!widgetRef) return;
    setIsSaving(true);
    updateDoc(widgetRef, {
      selectedTestimonialIds: selectedIds,
      layout,
      themeColor,
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
    layout, setLayout, themeColor, setThemeColor, 
    autoPublishEnabled, setAutoPublishEnabled, autoPublishMinRating, setAutoPublishMinRating, autoPublishMinChars, setAutoPublishMinChars,
    handleSave, isSaving, isGoldPlan,
    onClose: () => setIsSidebarOpen(false)
  };

  return (
    <div className="h-screen flex flex-col font-body w-full overflow-hidden bg-background">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-4">
          <Link href="/widgets">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-all border-none shadow-none"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="relative w-[160px] h-[52px] md:w-[240px] md:h-[78px]">
            <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
            <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="hidden sm:flex h-12 px-6 rounded-xl font-bold gap-2 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground">
            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Salvar Mural
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative w-full h-full pt-24 md:pt-32">
        <aside className={cn("hidden lg:flex w-80 bg-background border-r flex-col h-full", !isSidebarOpen && "w-0 opacity-0 -ml-80")}>
          <EmbedSettings {...sidebarProps} />
        </aside>

        <Sheet open={isSidebarOpen && isMobile} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0 w-80 border-none">
            <SheetHeader className="sr-only">
              <SheetTitle>Configurações do Mural</SheetTitle>
              <SheetDescription>Ajuste o layout, automações e cores do seu mural de depoimentos.</SheetDescription>
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
            
            <div className="relative border shadow-xl bg-muted/20 p-8 rounded-[2rem] min-h-[400px] flex items-center justify-center ring-1 ring-primary/5">
              <div className="w-full max-w-2xl">
                {currentSelection.length > 0 ? (
                  <div className={cn("grid gap-4", layout === 'grid' || layout === 'mural' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                    {currentSelection.slice(0, 4).map((t: any) => <TestimonialCardPreview key={t.id} t={t} themeColor={themeColor} />)}
                  </div>
                ) : <div className="text-center opacity-30 italic text-sm">Selecione depoimentos abaixo.</div>}
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
                          <div key={t.id} onClick={() => toggleSelection(t.id)} className={cn("cursor-pointer transition-all rounded-xl border-2 p-4 bg-background", isSelected ? "border-primary bg-primary/5" : "border-transparent shadow-sm hover:border-primary/20")}>
                            <div className="flex items-start gap-3">
                              <div className={cn("mt-1 w-4 h-4 rounded-md border flex items-center justify-center shrink-0", isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-[11px] block truncate">{t.userName}</span>
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
            <div className="relative bg-muted/50 rounded-xl p-4 border border-primary/20">
              <pre className="text-[10px] font-mono text-foreground break-all whitespace-pre-wrap">{embedCode}</pre>
              <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8" onClick={() => { navigator.clipboard.writeText(embedCode); toast({ title: "Copiado!" }); }}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <DialogFooter><Button className="w-full font-black h-12 rounded-xl" onClick={() => setIsCodeDialogOpen(false)}>Concluído</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
