'use client';

import { useState, useMemo, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Star, 
  Eye,
  MessageSquare,
  MessageCircle,
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
  Clock,
  ListChecks,
  Code,
  Smartphone,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useDoc, useCollection, useAuth } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDoc, serverTimestamp } from 'firebase/firestore';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { ThemeToggle } from '@/components/theme-toggle';
import { LoadingScreen } from '@/components/loading-screen';

type LayoutType = 'grid' | 'mural' | 'carousel' | 'popup';

export default function EmbedEditorPage({ params }: { params: Promise<{ widgetId: string }> }) {
  const { widgetId } = use(params);
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const widgetRef = useMemo(() => (db && user ? doc(db, 'users', user.uid, 'widgets', widgetId) : null), [db, user, widgetId]);
  const { data: widgetData, loading: widgetLoading } = useDoc(widgetRef);

  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'testimonials'), where('status', '==', 'approved'));
  }, [db, user]);

  const { data: approvedTestimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [themeColor, setThemeColor] = useState('#f97316');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [layout, setLayout] = useState<LayoutType>('grid');
  const [isSaving, setIsSaving] = useState(false);
  const [muralIndex, setMuralIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  const isEnterprise = userData?.membershipStatus === 'enterprise';
  const isGoldPlan = isEnterprise || userData?.membershipStatus === 'gold' || userData?.membershipStatus === 'trial';
  const SELECTION_LIMIT = isEnterprise ? Infinity : (isGoldPlan ? 50 : 5);

  const colors = ['#f97316', '#D4AF37', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#e11d48', '#0d9488', '#000000', '#ffffff'];

  useEffect(() => {
    if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (widgetData) {
      setName(widgetData.name || '');
      setSelectedIds(widgetData.selectedTestimonialIds || []);
      setThemeColor(widgetData.themeColor || '#f97316');
      setSecondaryColor(widgetData.secondaryColor || '');
      setLayout(widgetData.layout || 'grid');
    }
  }, [widgetData]);

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

  const handleSave = async () => {
    if (!db || !user || !widgetId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'widgets', widgetId), {
        name,
        selectedTestimonialIds: selectedIds,
        themeColor,
        secondaryColor,
        layout,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Configurações Salvas!", description: "Seu mural foi atualizado com sucesso." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const isRemoving = prev.includes(id);
      if (!isRemoving && prev.length >= SELECTION_LIMIT) {
        toast({ variant: "destructive", title: "Limite atingido", description: `Seu plano permite até ${SELECTION_LIMIT} depoimentos ativos.` });
        return prev;
      }
      return isRemoving ? prev.filter(i => i !== id) : [...prev, id];
    });
  };

  const currentSelection = useMemo(() => {
    return approvedTestimonials?.filter(t => selectedIds.includes(t.id)) || [];
  }, [approvedTestimonials, selectedIds]);

  const visibleTestimonialsPreview = useMemo(() => {
    if (currentSelection.length === 0) return [];
    if (layout === 'mural') {
      const slice = [];
      const count = Math.min(2, currentSelection.length);
      for (let i = 0; i < count; i++) {
        slice.push(currentSelection[(muralIndex + i) % currentSelection.length]);
      }
      return slice;
    }
    if (layout === 'carousel' || layout === 'popup') return [currentSelection[muralIndex % currentSelection.length]];
    return currentSelection;
  }, [currentSelection, layout, muralIndex]);

  const iframeCode = `<iframe src="${baseUrl}/widgetpublic/${user?.uid}/${widgetId}" width="100%" height="600px" style="border:none;" allowtransparency="true"></iframe>`;
  
  const floatingScriptCode = `
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${baseUrl}/widgetpublic/${user?.uid}/${widgetId}';
    iframe.style.position = 'fixed';
    iframe.style.bottom = '20px';
    iframe.style.left = '20px';
    iframe.style.width = '300px';
    iframe.style.height = '130px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    iframe.allowTransparency = 'true';
    document.body.appendChild(iframe);
  })();
</script>`.trim();

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código Copiado!", description: "Cole no seu site para ativar." });
  };

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

  if (authLoading || userDataLoading || widgetLoading || testimonialsLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen flex flex-col font-body w-full overflow-hidden bg-background text-foreground">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[120] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/widgets">
            <button className="h-10 px-2 gap-2 text-muted-foreground hover:text-primary transition-all flex items-center group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Murais</span>
            </button>
          </Link>
          <div className="relative w-[160px] h-[55px] md:w-[320px] md:h-[105px]">
            <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
            <Image src="/logo-proova-dark-mode.gif" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <Button variant="outline" className="hidden sm:flex h-10 md:h-12 px-4 rounded-xl font-bold gap-2 border-primary/20 text-primary hover:bg-primary/5 transition-all" onClick={() => setIsEmbedDialogOpen(true)}>
             <Code className="w-4 h-4" /> Gerar Embed
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex h-10 md:h-12 px-4 md:px-8 rounded-xl font-black uppercase tracking-widest gap-2 shadow-xl bg-primary hover:bg-primary/90 text-white transition-all active:scale-95">
            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Salvar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary transition-all group">
                <User className="w-5 h-5 text-primary group-hover:text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl">
               <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Minha Conta</DropdownMenuLabel>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5"><TrendingUp className="mr-2 h-4 w-4 text-primary" /><span>Dashboard</span></DropdownMenuItem>
               <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl font-bold py-2.5 cursor-pointer"><Gem className="mr-2 h-4 w-4 text-primary" /><span>Plano: <span className="text-primary">{membershipLabel}</span></span></DropdownMenuItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive font-bold py-2.5 cursor-pointer"><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative w-full h-full pt-20 md:pt-28">
        <aside className="w-full sm:w-[340px] bg-background border-r flex flex-col shrink-0 h-full shadow-2xl z-50 overflow-hidden">
          <Tabs defaultValue="visual" className="w-full flex-1 flex flex-col min-h-0">
             <TabsList className="grid grid-cols-3 bg-muted/20 h-14 rounded-none p-0 shrink-0">
                <TabsTrigger value="visual" className="rounded-none h-full text-[9px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-background"><Palette className="w-4 h-4" /> Visual</TabsTrigger>
                <TabsTrigger value="design" className="rounded-none h-full text-[9px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-background"><LayoutGrid className="w-4 h-4" /> Layout</TabsTrigger>
                <TabsTrigger value="selecao" className="rounded-none h-full text-[9px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-background"><ListChecks className="w-4 h-4" /> Seleção</TabsTrigger>
             </TabsList>
             
             <ScrollArea className="flex-1">
                <div className="p-6 space-y-8 pb-20">
                   <TabsContent value="visual" className="mt-0 space-y-8 outline-none">
                      <section className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nome do Mural (Interno)</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold" />
                      </section>

                      <section className="space-y-4">
                         <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Cor da Marca</Label>
                         <div className="flex flex-wrap gap-2.5">
                           {colors.map(c => (
                             <button key={c} onClick={() => setThemeColor(c)} className={cn("w-8 h-8 rounded-full border-2 transition-all hover:scale-110", themeColor === c ? "border-primary ring-4 ring-primary/10" : "border-transparent")} style={{ backgroundColor: c }} />
                           ))}
                         </div>
                      </section>

                      <section className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-muted">
                           <div className="space-y-0.5">
                              <p className="text-[10px] font-black uppercase tracking-tight">Cor Secundária (VIP)</p>
                              <p className="text-[8px] opacity-60 font-medium uppercase">Ativa brilhos e bordas especiais</p>
                           </div>
                           <input type="color" value={secondaryColor || '#ffffff'} onChange={(e) => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-none shadow-md" />
                        </div>
                        {secondaryColor && <button onClick={() => setSecondaryColor('')} className="text-[9px] font-black uppercase text-destructive hover:underline ml-1">Desativar efeitos</button>}
                      </section>
                   </TabsContent>

                   <TabsContent value="design" className="mt-0 space-y-6 outline-none">
                      <section className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Formato de Exibição</Label>
                        <div className="grid grid-cols-2 gap-3">
                           {[
                             { id: 'grid', label: 'Grade VIP', icon: LayoutGrid, desc: 'Scroll Infinito' },
                             { id: 'mural', label: 'Mural', icon: Layout, desc: 'Pinterest Style' },
                             { id: 'carousel', label: 'Carrossel', icon: Play, desc: 'Um por vez' },
                             { id: 'popup', label: 'Notificação', icon: MessageCircle, desc: 'Flutuante' },
                           ].map(l => (
                             <button 
                               key={l.id} 
                               onClick={() => setLayout(l.id as LayoutType)}
                               className={cn(
                                 "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 text-center",
                                 layout === l.id ? "bg-primary/5 border-primary shadow-sm" : "bg-muted/10 border-transparent hover:border-primary/20"
                               )}
                             >
                               <l.icon className={cn("w-5 h-5", layout === l.id ? "text-primary" : "text-muted-foreground")} />
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-tight">{l.label}</p>
                                  <p className="text-[7px] opacity-60 font-medium uppercase">{l.desc}</p>
                               </div>
                             </button>
                           ))}
                        </div>
                      </section>
                   </TabsContent>

                   <TabsContent value="selecao" className="mt-0 space-y-6 outline-none">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] font-black uppercase text-primary">Ativos no Mural</p>
                        <Badge className="bg-primary text-white border-none font-black text-[10px]">{selectedIds.length} / {SELECTION_LIMIT === Infinity ? '∞' : SELECTION_LIMIT}</Badge>
                      </div>

                      <div className="space-y-3">
                        {approvedTestimonials?.map((t: any) => {
                          const isSelected = selectedIds.includes(t.id);
                          return (
                            <div 
                              key={t.id} 
                              onClick={() => toggleSelection(t.id)}
                              className={cn(
                                "p-3 rounded-2xl border-2 transition-all cursor-pointer flex gap-3 items-center group",
                                isSelected ? "bg-primary/5 border-primary shadow-sm" : "bg-muted/10 border-transparent hover:border-primary/20"
                              )}
                            >
                              <div className={cn(
                                "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/30 bg-background"
                              )}>
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                 <p className="font-black text-[10px] uppercase truncate">{t.userName}</p>
                                 <p className="text-[9px] text-muted-foreground italic truncate">"{t.text}"</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                   </TabsContent>
                </div>
             </ScrollArea>
          </Tabs>
        </aside>

        <div className="flex-1 bg-muted/10 overflow-y-auto p-4 md:p-12">
           <div className="max-w-4xl mx-auto space-y-12">
              <header className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary"><Monitor className="w-5 h-5" /></div>
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-60">Simulação de Incorporação</h3>
                 </div>
                 <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/30 text-primary">Live Preview 100% Fiel</Badge>
              </header>

              <div className="bg-background rounded-[3rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.4)] border-[12px] border-muted overflow-hidden relative ring-1 ring-primary/5">
                 <div className="absolute top-0 left-0 w-full h-12 bg-muted/50 border-b flex items-center px-6 gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <div className="ml-4 h-5 flex-1 bg-background rounded-full border border-primary/5 flex items-center px-4">
                       <p className="text-[7px] text-muted-foreground font-mono opacity-40">www.seusite.com.br/depoimentos</p>
                    </div>
                 </div>
                 
                 <div className="pt-16 pb-12 px-6 min-h-[500px] flex flex-col items-center">
                    <div className={cn(
                      "w-full h-full",
                      (layout === 'popup' || layout === 'carousel') ? "max-w-md mx-auto" : (
                        layout === 'mural' ? "grid grid-cols-1 sm:grid-cols-2 gap-12" : "grid grid-cols-1 sm:grid-cols-2 gap-12"
                      ),
                      layout === 'popup' && "flex items-end pb-8"
                    )}>
                      {currentSelection.length === 0 ? (
                        <div className="col-span-full py-20 text-center opacity-10 flex flex-col items-center gap-4 animate-pulse">
                          <Star className="w-16 h-16" />
                          <p className="text-xs font-black uppercase tracking-[0.4em]">Selecione depoimentos para prévia</p>
                        </div>
                      ) : (
                        visibleTestimonialsPreview.map((t, idx) => (
                          <div 
                            key={`${t.id}-${muralIndex}-${idx}`}
                            className={cn(
                              "p-6 rounded-[2rem] bg-card shadow-2xl border-none transition-all duration-700",
                              layout === 'mural' && !isAnimating && (idx % 2 === 0 ? "animate-in slide-in-from-left-4" : "animate-in slide-in-from-right-4"),
                              layout === 'popup' && !isAnimating && "animate-in slide-in-from-bottom-8 zoom-in-95 duration-1000"
                            )}
                            style={{ 
                              boxShadow: secondaryColor ? `0 0 35px ${secondaryColor}30, 0 20px 40px -15px rgba(0,0,0,0.2)` : `0 20px 40px -15px ${themeColor}20`,
                              border: secondaryColor ? `2px solid ${secondaryColor}20` : 'none'
                            }}
                          >
                             <div className="flex items-center gap-4 mb-5">
                                <div className="h-10 w-10 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: secondaryColor ? `${secondaryColor}30` : `${themeColor}30` }}>
                                   <User className="w-5 h-5" style={{ color: secondaryColor ? secondaryColor : themeColor }} />
                                </div>
                                <div className="min-w-0">
                                   <p className="font-black text-[11px] uppercase truncate">{t.userName}</p>
                                   <div className="flex gap-0.5 mt-1">
                                      {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-2.5 h-2.5", s <= t.rating ? "fill-current" : "opacity-10")} style={{ color: themeColor }} />)}
                                   </div>
                                </div>
                             </div>
                             <p className="text-xs font-medium italic leading-relaxed opacity-80">"{t.text}"</p>
                          </div>
                        ))
                      )}
                    </div>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                 <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest gap-2 bg-background border-primary/20 text-primary hover:bg-primary/5" onClick={() => setIsEmbedDialogOpen(true)}>
                    <Code className="w-5 h-5" /> Opções de Instalação
                 </Button>
                 <Button className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest gap-2 bg-foreground text-background hover:opacity-90 shadow-xl" onClick={() => router.push(`/widgetpublic/${user?.uid}/${widgetId}`)}>
                    <Eye className="w-5 h-5" /> Tela Cheia
                 </Button>
              </div>
           </div>
        </div>
      </main>

      <Dialog open={isEmbedDialogOpen} onOpenChange={setIsEmbedDialogOpen}>
         <DialogContent className="rounded-[2.5rem] w-[95vw] sm:max-w-2xl border-none shadow-2xl p-0 overflow-hidden bg-background">
            <div className="h-2 bg-primary w-full" />
            <div className="p-8 space-y-6">
               <DialogHeader className="text-center space-y-3">
                  <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                     <Zap className="w-7 h-7" />
                  </div>
                  <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight">Ativar Prova Social no seu Site</DialogTitle>
                  <DialogDescription className="text-xs font-medium">Escolha o método que melhor se adapta ao seu design.</DialogDescription>
               </DialogHeader>

               <Tabs defaultValue="script" className="w-full">
                  <TabsList className="grid grid-cols-2 h-14 bg-muted/20 p-1 rounded-2xl mb-6">
                     <TabsTrigger value="script" className="rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                        <Smartphone className="w-4 h-4" /> Script Flutuante
                     </TabsTrigger>
                     <TabsTrigger value="iframe" className="rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                        <LayoutGrid className="w-4 h-4" /> Iframe Estático
                     </TabsTrigger>
                  </TabsList>

                  <TabsContent value="script" className="space-y-4 outline-none">
                     <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 space-y-4">
                        <div className="flex items-center gap-2">
                           <Badge className="bg-primary text-white text-[8px] font-black">RECOMENDADO</Badge>
                           <p className="text-[10px] font-black uppercase opacity-60">Instalação via Head</p>
                        </div>
                        <p className="text-xs font-medium leading-relaxed">Este método cria uma **bolha de notificação** que flutua sobre o seu site, ideal para não quebrar o layout e converter visitantes em qualquer página.</p>
                        <div className="bg-zinc-900 p-4 rounded-xl relative group overflow-hidden">
                           <pre className="text-[10px] text-primary/80 font-mono leading-relaxed break-all whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {floatingScriptCode}
                           </pre>
                           <Button 
                             size="sm" 
                             className="absolute top-2 right-2 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white gap-1.5"
                             onClick={() => copyCode(floatingScriptCode)}
                           >
                             <Copy className="w-3.5 h-3.5" /> Copiar
                           </Button>
                        </div>
                        <p className="text-[9px] text-muted-foreground italic font-medium">Cole este código preferencialmente antes da tag de fechamento <code>&lt;/head&gt;</code>.</p>
                     </div>
                  </TabsContent>

                  <TabsContent value="iframe" className="space-y-4 outline-none">
                     <div className="bg-muted/30 p-5 rounded-2xl border border-muted-foreground/10 space-y-4">
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] font-black uppercase opacity-60">Instalação via Bloco HTML</p>
                        </div>
                        <p className="text-xs font-medium leading-relaxed">Use este método se você quiser reservar um espaço específico no corpo do seu site (Ex: Seção de Depoimentos na Home).</p>
                        <div className="bg-zinc-900 p-4 rounded-xl relative group">
                           <pre className="text-[10px] text-zinc-400 font-mono leading-relaxed break-all whitespace-pre-wrap">
                              {iframeCode}
                           </pre>
                           <Button 
                             size="sm" 
                             className="absolute top-2 right-2 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white gap-1.5"
                             onClick={() => copyCode(iframeCode)}
                           >
                             <Copy className="w-3.5 h-3.5" /> Copiar
                           </Button>
                        </div>
                     </div>
                  </TabsContent>
               </Tabs>

               <div className="pt-4 border-t">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                     <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-medium leading-relaxed"><b>Dica Proova:</b> O Script Flutuante é ideal para Landing Pages e sites WordPress, pois aparece automaticamente em todas as páginas sem precisar ajustar o design.</p>
                  </div>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
