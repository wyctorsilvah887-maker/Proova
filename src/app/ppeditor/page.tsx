'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Star, 
  MessageSquare,
  Check,
  User,
  Monitor,
  CheckCircle2,
  Upload,
  Palette,
  LayoutGrid,
  Play,
  Layout,
  Trash2,
  Globe,
  Info,
  LogOut,
  TrendingUp,
  Inbox,
  Gem,
  Sun,
  Moon,
  Type,
  Plus,
  ArrowRight,
  Lock,
  Sparkles,
  Pipette,
  Clock,
  ChevronDown,
  Handshake,
  X,
  MessageCircle,
  Link2,
  Bell,
  ExternalLink,
  Zap,
  ChevronLeft,
  ChevronRight,
  ListChecks
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useDoc, useCollection, useStorage, useAuth } from '@/firebase';
import { 
  doc, 
  collection, 
  query, 
  where, 
  serverTimestamp, 
  getDoc, 
  writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from '@/components/ui/slider';
import Cropper from 'react-easy-crop';
import { useTheme } from 'next-themes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingScreen } from '@/components/loading-screen';

type LayoutType = 'grid' | 'mural' | 'carousel' | 'popup';

interface CustomSection {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  buttonText: string;
  buttonUrl: string;
  variant: 'light' | 'dark' | 'accent';
}

const RichTextEditor = ({ value, onChange, placeholder, className, allowColor }: { value: string, onChange: (val: string) => void, placeholder?: string, className?: string, allowColor: boolean }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isFocused && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isFocused]);

  const handleSelection = () => {
    if (!allowColor) return;
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0 && editorRef.current?.contains(selection.anchorNode)) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setToolbarPos({
          top: rect.top + window.scrollY - 65,
          left: rect.left + rect.width / 2
        });
        setShowToolbar(true);
      } catch (e) {
        setShowToolbar(false);
      }
    } else {
      setShowToolbar(false);
    }
  };

  const applyColor = (color: string) => {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, color);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const clearFormat = () => {
    document.execCommand('removeFormat');
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div 
      className="relative group"
      onContextMenu={(e) => e.preventDefault()}
    >
      <input type="color" ref={colorInputRef} className="sr-only" onChange={(e) => applyColor(e.target.value)} />
      
      {showToolbar && allowColor && (
        <div 
          className="fixed z-[999] flex items-center gap-2 p-2 bg-zinc-900 border border-white/10 shadow-2xl rounded-2xl -translate-x-1/2 animate-in fade-in zoom-in duration-200"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
          <button 
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-primary transition-all group"
            onMouseDown={(e) => { e.preventDefault(); colorInputRef.current?.click(); }}
          >
            <Pipette className="w-5 h-5 text-white group-hover:text-black" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button 
             className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
             onMouseDown={(e) => { e.preventDefault(); clearFormat(); }}
          >
            Limpar
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e: any) => onChange(e.currentTarget.innerHTML)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => { setIsFocused(false); setShowToolbar(false); }}
        onSelect={handleSelection}
        className={cn(
          "min-h-[80px] p-4 rounded-2xl bg-muted/20 border-2 border-transparent focus:border-primary/30 outline-none text-sm font-bold leading-relaxed transition-all cursor-text",
          className
        )}
      />
      
      {!value && !isFocused && (
        <p className="absolute top-4 left-4 text-muted-foreground opacity-40 pointer-events-none text-xs font-medium italic">
          {placeholder || 'Digite aqui...'}
        </p>
      )}
    </div>
  );
};

const PublicPageSettings = ({ 
  themeColor, setThemeColor,
  secondaryColor, setSecondaryColor,
  layout, setLayout,
  logoUrl, setLogoUrl,
  heroTitle, setHeroTitle,
  heroSubtitle, setHeroSubtitle,
  testimonialsTitle, setTestimonialsTitle,
  footerText, setFooterText,
  showLogo, setShowLogo,
  whatsappEnabled, setWhatsappEnabled,
  whatsappNumber, setWhatsappNumber,
  externalSiteUrl, setExternalSiteUrl,
  externalSiteButtonText, setExternalSiteButtonText,
  customSections, setCustomSections,
  autoPublishEnabled, setAutoPublishEnabled,
  autoPublishMinRating, setAutoPublishMinRating,
  autoPublishMinChars, setAutoPublishMinChars,
  onFileSelect,
  isUploading,
  isGoldPlan,
  isEnterprise,
  logoInputRef,
  currentSlug, setSlugEdit,
  onClose,
  approvedTestimonials,
  selectedIds,
  toggleSelection,
  SELECTION_LIMIT
}: any) => {
  const colors = ['#f97316', '#D4AF37', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#e11d48', '#0d9488', '#7c3aed', '#475569', '#000000', '#ffffff'];
  const router = useRouter();
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (tabsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-background">
      <div className="p-4 border-b bg-muted/10 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/dash">
            <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground hover:text-primary hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:ring-0 transition-all h-8">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Painel Dash</span>
            </Button>
          </Link>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full flex-1 flex flex-col min-h-0">
        <div className="w-full border-b relative">
          {showLeftArrow && (
            <div className="absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-background to-transparent flex items-center justify-start pl-1 pointer-events-none">
              <ChevronLeft className="w-4 h-4 text-primary animate-pulse" />
            </div>
          )}
          {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-background to-transparent flex items-center justify-end pr-1 pointer-events-none">
              <ChevronRight className="w-4 h-4 text-primary animate-pulse" />
            </div>
          )}
          <div 
            ref={tabsScrollRef}
            className="w-full overflow-x-auto scrollbar-hide"
          >
            <TabsList className="flex w-max justify-start rounded-none bg-transparent h-12 px-2 shrink-0">
              <TabsTrigger value="geral" className="text-[10px] font-bold uppercase tracking-widest px-3">Visual</TabsTrigger>
              <TabsTrigger value="selecao" className="text-[10px] font-bold uppercase tracking-widest px-3 flex items-center gap-1.5">
                Seleção <Badge variant="secondary" className="h-4 px-1 text-[8px] border-none">{selectedIds.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="conteudo" className="text-[10px] font-bold uppercase tracking-widest px-3 flex items-center gap-1.5">
                Conteúdo {!isGoldPlan && <Lock className="w-2.5 h-2.5 opacity-40" />}
              </TabsTrigger>
              <TabsTrigger value="automacao" className="text-[10px] font-bold uppercase tracking-widest px-3 flex items-center gap-1.5">
                Automação {!isEnterprise && <Lock className="w-2.5 h-2.5 opacity-40" />}
              </TabsTrigger>
              <TabsTrigger value="design" className="text-[10px] font-bold uppercase tracking-widest px-3">Layout</TabsTrigger>
              <TabsTrigger value="social" className="text-[10px] font-bold uppercase tracking-widest px-3">Contato/Info</TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-8 pb-10">
             <TabsContent value="geral" className="mt-0 space-y-8">
                <section className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Foto de Capa / Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-20 h-20 rounded-3xl border-2 border-dashed border-primary/20 flex items-center justify-center bg-primary/5 overflow-hidden group cursor-pointer relative",
                      isUploading && "opacity-50"
                    )} onClick={() => logoInputRef.current?.click()}>
                      {logoUrl ? <Image src={logoUrl} alt="Logo" fill className="object-cover" /> : <Upload className="w-6 h-6 text-primary" />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <Palette className="w-4 h-4 text-white" />
                      </div>
                      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => onFileSelect(e, 'logo')} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-bold">Identidade Visual</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">Escolha uma foto quadrada (1:1) para sua vitrine.</p>
                      {logoUrl && <button onClick={() => setLogoUrl('')} className="text-[10px] font-black uppercase text-destructive hover:underline pt-1">Remover</button>}
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Paleta de Cores</Label>
                   <div className="flex flex-wrap gap-2">
                     {colors.map(c => (
                       <button key={c} onClick={() => setThemeColor(c)} className={cn("w-8 h-8 rounded-full border-2 transition-all hover:scale-110", themeColor === c ? "border-primary scale-110 ring-2 ring-primary/20" : "border-transparent")} style={{ backgroundColor: c }} />
                     ))}
                     <div className="relative group">
                       <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-8 h-8 rounded-full border-2 border-transparent cursor-pointer overflow-hidden p-0 opacity-0 absolute inset-0" />
                       <div className="w-8 h-8 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-muted/20 group-hover:bg-primary/10 transition-colors pointer-events-none"><Plus className="w-4 h-4 text-primary" /></div>
                     </div>
                   </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Link da Página</Label>
                    {!isGoldPlan && <Lock className="w-3 h-3 text-muted-foreground opacity-40" />}
                  </div>
                  <div className="flex items-center gap-1 bg-muted/20 rounded-xl px-3 border border-transparent focus-within:ring-2 focus-within:ring-primary/20 transition-all opacity-80">
                    <span className="text-[10px] font-bold opacity-40">/pp/</span>
                    <input 
                      disabled={!isGoldPlan}
                      value={currentSlug} 
                      onChange={(e) => setSlugEdit(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
                      className="h-10 flex-1 bg-transparent border-none focus:ring-0 text-xs font-mono" 
                    />
                  </div>
                  {!isGoldPlan && <p className="text-[9px] text-muted-foreground italic font-medium">Troca de slug disponível apenas nos planos pagos.</p>}
                </section>
             </TabsContent>

             <TabsContent value="selecao" className="mt-0 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Escolher Depoimentos</Label>
                  <Badge variant="secondary" className="font-black h-5 text-[8px]">{selectedIds.length} / {SELECTION_LIMIT === Infinity ? '∞' : SELECTION_LIMIT}</Badge>
                </div>
                
                <div className="space-y-3">
                  {approvedTestimonials?.length === 0 ? (
                    <div className="py-12 text-center opacity-30 bg-muted/10 rounded-2xl border-2 border-dashed border-primary/10">
                      <MessageSquare className="w-8 h-8 mx-auto mb-3" />
                      <p className="text-[9px] font-black uppercase tracking-widest">Nenhum depoimento aprovado</p>
                    </div>
                  ) : approvedTestimonials?.map((t: any) => {
                    const isSelected = selectedIds.includes(t.id);
                    return (
                      <div 
                        key={t.id} 
                        onClick={() => toggleSelection(t.id)}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all cursor-pointer flex gap-3 items-start relative group",
                          isSelected ? "bg-primary/5 border-primary shadow-sm" : "bg-muted/10 border-transparent hover:border-primary/20"
                        )}
                      >
                        <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all", isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-black text-[10px] uppercase truncate">{t.userName}</p>
                          <p className="text-[9px] text-muted-foreground leading-relaxed italic line-clamp-2">"{t.text}"</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
             </TabsContent>

             <TabsContent value="conteudo" className="mt-0 space-y-8">
               {!isGoldPlan ? (
                 <div className="p-8 text-center bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 space-y-4">
                   <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Gem className="w-6 h-6" /></div>
                   <h4 className="text-sm font-black uppercase tracking-tight">Conteúdo Customizado Premium</h4>
                   <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Assine o plano Gold para liberar edição rica com cores, fontes e seções ilimitadas na sua página.</p>
                   <Button onClick={() => router.push('/pricing')} className="h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[9px] bg-primary shadow-lg">Ver Planos</Button>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <section className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Título da Seção Herói (Principal)</Label>
                      <RichTextEditor value={heroTitle} onChange={setHeroTitle} allowColor={isGoldPlan} placeholder="Ex: O que dizem sobre nossa marca" />
                    </section>
                    <section className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Subtítulo Herói</Label>
                      <RichTextEditor value={heroSubtitle} onChange={setHeroSubtitle} allowColor={isGoldPlan} placeholder="Ex: Milhares de clientes satisfeitos pelo Brasil" />
                    </section>
                    <section className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Título da Seção de Depoimentos</Label>
                      <Input value={testimonialsTitle} onChange={(e) => setTestimonialsTitle(e.target.value)} placeholder="Ex: Relatos Reais" className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs font-bold" />
                    </section>

                    <section className="space-y-4 pt-4">
                       <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Seções Personalizadas</h4>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setCustomSections([...customSections, { id: Date.now().toString(), title: 'Nova Seção', subtitle: '', content: 'Conteúdo da seção...', buttonText: '', buttonUrl: '', variant: 'light' }])}
                            className="h-8 rounded-lg text-[9px] font-black uppercase gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Seção
                          </Button>
                       </div>
                       
                       <Accordion type="single" collapsible className="space-y-2">
                         {customSections.map((section, index) => (
                           <AccordionItem key={section.id} value={section.id} className="border bg-muted/10 rounded-2xl px-4 overflow-hidden">
                             <AccordionTrigger className="hover:no-underline text-xs font-black uppercase tracking-tight py-4">
                               Seção {index + 1}: {section.title.replace(/<[^>]*>?/gm, '').substring(0, 20)}...
                             </AccordionTrigger>
                             <AccordionContent className="space-y-4 pb-6">
                                <div className="space-y-2">
                                   <Label className="text-[9px] font-black uppercase">Título da Seção</Label>
                                   <Input value={section.title} onChange={(e) => {
                                      const newSections = [...customSections];
                                      newSections[index].title = e.target.value;
                                      setCustomSections(newSections);
                                   }} className="h-10 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[9px] font-black uppercase">Subtítulo</Label>
                                   <RichTextEditor value={section.subtitle} onChange={(val) => {
                                      const newSections = [...customSections];
                                      newSections[index].subtitle = val;
                                      setCustomSections(newSections);
                                   }} allowColor={isGoldPlan} placeholder="Subtítulo opcional" />
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[9px] font-black uppercase">Texto de Conteúdo</Label>
                                   <Textarea value={section.content} onChange={(e) => {
                                      const newSections = [...customSections];
                                      newSections[index].content = e.target.value;
                                      setCustomSections(newSections);
                                   }} className="rounded-xl min-h-[100px]" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                   <div className="space-y-2">
                                      <Label className="text-[9px] font-black uppercase">Texto Botão</Label>
                                      <Input value={section.buttonText} onChange={(e) => {
                                         const newSections = [...customSections];
                                         newSections[index].buttonText = e.target.value;
                                         setCustomSections(newSections);
                                      }} placeholder="Opcional" className="h-10 rounded-xl" />
                                   </div>
                                   <div className="space-y-2">
                                      <Label className="text-[9px] font-black uppercase">URL Botão</Label>
                                      <Input value={section.buttonUrl} onChange={(e) => {
                                         const newSections = [...customSections];
                                         newSections[index].buttonUrl = e.target.value;
                                         setCustomSections(newSections);
                                      }} placeholder="https://..." className="h-10 rounded-xl" />
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[9px] font-black uppercase">Estilo Visual</Label>
                                   <Select value={section.variant} onValueChange={(val: any) => {
                                      const newSections = [...customSections];
                                      newSections[index].variant = val;
                                      setCustomSections(newSections);
                                   }}>
                                      <SelectTrigger className="h-10 rounded-xl">
                                         <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                         <SelectItem value="light">Claro (Padrão)</SelectItem>
                                         <SelectItem value="dark">Escuro (Inverso)</SelectItem>
                                         <SelectItem value="accent">Destaque (Cor da Marca)</SelectItem>
                                      </SelectContent>
                                   </Select>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  onClick={() => setCustomSections(customSections.filter((_, i) => i !== index))}
                                  className="w-full h-10 rounded-xl text-destructive hover:bg-destructive/10 text-[9px] font-black uppercase gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remover Esta Seção
                                </Button>
                             </AccordionContent>
                           </AccordionItem>
                         ))}
                       </Accordion>
                    </section>
                 </div>
               )}
             </TabsContent>

             <TabsContent value="automacao" className="mt-0 space-y-8">
               {!isEnterprise ? (
                 <div className="p-8 text-center bg-orange-500/5 rounded-[2rem] border-2 border-dashed border-orange-500/20 space-y-4">
                   <div className="mx-auto w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600"><Zap className="w-6 h-6" /></div>
                   <h4 className="text-sm font-black uppercase tracking-tight">Fluxos Hands-Free VIP</h4>
                   <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">O plano Enterprise permite que o Proova publique elogios automaticamente baseados em suas regras de nota e tamanho de texto.</p>
                   <Button onClick={() => router.push('/pricing')} className="h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[9px] bg-orange-500 hover:bg-orange-600 shadow-lg text-white">Fazer Upgrade</Button>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <section className="space-y-4">
                       <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20">
                          <div className="space-y-1">
                             <p className="text-xs font-black uppercase tracking-tight">Auto-Publish Ativo</p>
                             <p className="text-[9px] text-muted-foreground font-medium">Publicar automaticamente elogios qualificados.</p>
                          </div>
                          <Switch checked={autoPublishEnabled} onCheckedChange={setAutoPublishEnabled} />
                       </div>

                       {autoPublishEnabled && (
                         <div className="space-y-6 p-4 rounded-2xl border-2 border-dashed border-primary/20 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="space-y-3">
                               <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
                                  <span>Nota Mínima</span>
                                  <span className="text-primary">{autoPublishMinRating} Estrelas</span>
                               </div>
                               <Slider value={[autoPublishMinRating]} min={1} max={5} step={1} onValueChange={(val) => setAutoPublishMinRating(val[0])} />
                            </div>
                            <div className="space-y-3">
                               <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
                                  <span>Tamanho Mínimo</span>
                                  <span className="text-primary">{autoPublishMinChars} Caracteres</span>
                               </div>
                               <Slider value={[autoPublishMinChars]} min={0} max={200} step={10} onValueChange={(val) => setAutoPublishMinChars(val[0])} />
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted/30 p-3 rounded-lg leading-relaxed">
                               ✨ O sistema publicará instantaneamente elogios com {autoPublishMinRating} ou mais estrelas e que possuam pelo menos {autoPublishMinChars} caracteres de texto.
                            </p>
                         </div>
                       )}
                    </section>
                 </div>
               )}
             </TabsContent>

             <TabsContent value="design" className="mt-0 space-y-8">
                <section className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Layout dos Depoimentos</Label>
                   <div className="grid grid-cols-2 gap-3">
                     {[
                       { id: 'grid', label: 'Grade VIP', icon: LayoutGrid, desc: 'Visualização clássica e robusta' },
                       { id: 'mural', label: 'Mural Masonry', icon: Layout, desc: 'Estilo dinâmico estilo Pinterest' },
                       { id: 'carousel', label: 'Carrossel', icon: Play, desc: 'Foco um a um (Horizontal)' },
                       { id: 'popup', label: 'Destaque Único', icon: MessageCircle, desc: 'Apenas o melhor elogio por vez' },
                     ].map(l => (
                       <button 
                         key={l.id} 
                         onClick={() => setLayout(l.id as LayoutType)}
                         className={cn(
                           "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 text-center",
                           layout === l.id ? "bg-primary/5 border-primary shadow-inner" : "bg-muted/20 border-transparent hover:border-primary/20"
                         )}
                       >
                         <l.icon className={cn("w-6 h-6", layout === l.id ? "text-primary" : "text-muted-foreground")} />
                         <div className="space-y-0.5">
                            <p className="text-sm font-black uppercase tracking-tight">{l.label}</p>
                            <p className="text-[8px] opacity-60 font-medium leading-none">{l.desc}</p>
                         </div>
                       </button>
                     ))}
                   </div>
                </section>
                
                <section className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20">
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-tight">Cores Dinâmicas Secundárias</p>
                      <p className="text-[9px] text-muted-foreground font-medium">Ativa efeitos de borda e brilho contrastante.</p>
                    </div>
                    <div className="relative group">
                       <input type="color" value={secondaryColor || '#ffffff'} onChange={(e) => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded-full border-2 border-transparent cursor-pointer" />
                    </div>
                  </div>
                  {secondaryColor && <button onClick={() => setSecondaryColor('')} className="text-[9px] font-black uppercase text-destructive ml-1">Desativar Efeito Secundário</button>}
                </section>
             </TabsContent>

             <TabsContent value="social" className="mt-0 space-y-8">
                <section className="space-y-4">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <MessageCircle className="w-4 h-4 text-green-500" />
                         <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Botão WhatsApp</Label>
                      </div>
                      <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
                   </div>
                   {whatsappEnabled && (
                     <div className="space-y-4 p-4 rounded-2xl border-2 border-dashed border-green-500/20 bg-green-500/5 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase">Seu Número com DDD</Label>
                           <Input placeholder="Ex: 11999998888" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="h-10 rounded-xl" />
                        </div>
                        <p className="text-[8px] font-bold text-green-700 uppercase leading-relaxed">
                           🚀 O botão flutuante aparecerá no canto da página, facilitando o contato direto após o cliente ler os depoimentos.
                        </p>
                     </div>
                   )}
                </section>

                <section className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Site Oficial (Redirecionamento)</Label>
                   <div className="space-y-3">
                      <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase">Texto do Botão no Rodapé</Label>
                         <Input value={externalSiteButtonText} onChange={(e) => setExternalSiteButtonText(e.target.value)} placeholder="Ex: Visitar Loja Virtual" className="h-10 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase">URL do seu Site</Label>
                         <Input value={externalSiteUrl} onChange={(e) => setExternalSiteUrl(e.target.value)} placeholder="https://..." className="h-10 rounded-xl" />
                      </div>
                   </div>
                </section>

                <section className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Rodapé</Label>
                   <div className="space-y-3">
                      <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase">Texto Copyright</Label>
                         <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Ex: 2026 Minha Empresa" className="h-10 rounded-xl" />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-tight">Selo Proova</p>
                          <p className="text-[8px] text-muted-foreground font-medium">Exibir "Powered by Proova" no rodapé.</p>
                        </div>
                        <Switch checked={showLogo} onCheckedChange={setShowLogo} />
                      </div>
                   </div>
                </section>
             </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default function PPEditorPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const storage = useStorage();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const ppRef = useMemo(() => {
    if (!db || !user || !activeSlug) return null;
    return doc(db, 'users', user.uid, 'pp', activeSlug);
  }, [db, user, activeSlug]);
  const { data: ppData } = useDoc(ppRef);

  const isEnterprise = userData?.membershipStatus === 'enterprise';
  const isGoldPlan = isEnterprise || userData?.membershipStatus === 'gold' || userData?.membershipStatus === 'trial';
  const SELECTION_LIMIT = isEnterprise ? Infinity : (isGoldPlan ? 50 : 5);

  const isMapsLinkValid = useMemo(() => {
    if (!userData?.googleMapsUrl) return false;
    const url = userData.googleMapsUrl.toLowerCase();
    return url.includes('review') || url.includes('writereview') || url.includes('placeid');
  }, [userData]);

  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'testimonials'), where('status', '==', 'approved'));
  }, [db, user]);

  const { data: approvedTestimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [themeColor, setThemeColor] = useState('#f97316');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [layout, setLayout] = useState<LayoutType>('grid'); 
  const [logoUrl, setLogoUrl] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [testimonialsTitle, setTestimonialsTitle] = useState('');
  const [footerText, setFooterText] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [externalSiteUrl, setExternalSiteUrl] = useState('');
  const [externalSiteButtonText, setExternalSiteButtonText] = useState('');
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [autoPublishMinRating, setAutoPublishMinRating] = useState(5);
  const [autoPublishMinChars, setAutoPublishMinChars] = useState(0);
  const [slugEdit, setSlugEdit] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [muralIndex, setMuralIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [tempImage, setTempImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'logo' | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData?.companySlug) {
      setActiveSlug(userData.companySlug);
      setSlugEdit(userData.companySlug);
    }
  }, [userData]);

  useEffect(() => {
    if (ppData) {
      setSelectedIds(ppData.selectedTestimonialIds || []);
      setThemeColor(ppData.themeColor || '#f97316');
      setSecondaryColor(ppData.secondaryColor || '');
      setLayout(ppData.layout || 'grid');
      setLogoUrl(ppData.logoUrl || '');
      setHeroTitle(ppData.heroTitle || '');
      setHeroSubtitle(ppData.heroSubtitle || '');
      setTestimonialsTitle(ppData.testimonialsTitle || '');
      setFooterText(ppData.footerText || '');
      setShowLogo(ppData.showLogo !== undefined ? ppData.showLogo : true);
      setWhatsappEnabled(ppData.whatsappEnabled || false);
      setWhatsappNumber(ppData.whatsappNumber || '');
      setExternalSiteUrl(ppData.externalSiteUrl || '');
      setExternalSiteButtonText(ppData.externalSiteButtonText || '');
      setCustomSections(ppData.customSections || []);
      setAutoPublishEnabled(ppData.autoPublishEnabled || false);
      setAutoPublishMinRating(ppData.autoPublishMinRating || 5);
      setAutoPublishMinChars(ppData.autoPublishMinChars || 0);
    }
  }, [ppData]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

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
    if (!user || !db || !userData) return;
    setIsSaving(true);
    const oldSlug = userData.companySlug;
    const newSlug = slugEdit.trim().toLowerCase();
    const isSlugChanging = newSlug !== oldSlug;

    try {
      const batch = writeBatch(db);
      if (isSlugChanging) {
        if (!newSlug) throw new Error("Link vazio.");
        const slugCheck = await getDoc(doc(db, 'slugs', newSlug));
        if (slugCheck.exists()) throw new Error("Link em uso.");
        batch.set(doc(db, 'slugs', newSlug), { userId: user.uid, type: 'pp', createdAt: serverTimestamp() });
        if (oldSlug) {
          batch.delete(doc(db, 'slugs', oldSlug));
          batch.delete(doc(db, 'users', user.uid, 'pp', oldSlug));
        }
        batch.update(doc(db, 'users', user.uid), { companySlug: newSlug });
      }
      const targetSlug = isSlugChanging ? newSlug : (oldSlug || 'minha-pagina');
      const targetPPRef = doc(db, 'users', user.uid, 'pp', targetSlug);
      batch.set(targetPPRef, {
        selectedTestimonialIds: selectedIds,
        themeColor, secondaryColor, layout, logoUrl, heroTitle, heroSubtitle, testimonialsTitle, footerText, showLogo,
        whatsappEnabled, whatsappNumber, externalSiteUrl, externalSiteButtonText,
        customSections: customSections || [],
        autoPublishEnabled, autoPublishMinRating, autoPublishMinChars,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await batch.commit();
      if (isSlugChanging) setActiveSlug(newSlug);
      toast({ title: "Configuração Salva!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => { setTempImage(reader.result as string); setCropType(type); });
    reader.readAsDataURL(file);
  };

  const handleConfirmCrop = async () => {
    if (!tempImage || !cropType || !user || !storage || !croppedAreaPixels || !activeSlug) return;
    setIsUploading(true); setTempImage(null);
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels, cropType);
      const storageRef = ref(storage, `users/${user.uid}/pp/${activeSlug}/${cropType}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, croppedBlob);
      const url = await getDownloadURL(storageRef);
      setLogoUrl(url);
    } catch (err) { toast({ variant: "destructive", title: "Erro no upload" }); } finally { setIsUploading(false); setCropType(null); }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const isRemoving = prev.includes(id);
      if (!isRemoving && prev.length >= SELECTION_LIMIT) { toast({ variant: "destructive", title: "Limite atingido" }); return prev; }
      return isRemoving ? prev.filter(i => i !== id) : [...prev, id];
    });
  };

  const currentSelection = approvedTestimonials?.filter(t => selectedIds.includes(t.id)) || [];

  const visibleTestimonialsPreview = useMemo(() => {
    if (currentSelection.length === 0) return [];
    
    if (layout === 'mural') {
      const slice = [];
      const count = 2; 
      for (let i = 0; i < Math.min(count, currentSelection.length); i++) {
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

  if (authLoading || userDataLoading || testimonialsLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body w-full overflow-hidden text-foreground">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/dash">
            <Button variant="ghost" size="sm" className="h-10 px-2 gap-2 text-muted-foreground hover:text-primary hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:ring-0 rounded-xl shadow-none">
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
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <Button 
            variant="outline"
            className="flex h-10 md:h-12 px-3 md:px-6 rounded-xl font-bold gap-2 border-primary/20 text-primary hover:bg-primary/5 shadow-sm transition-all active:scale-95"
            onClick={() => window.open(`/pp/${activeSlug}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden xs:inline">Abrir Página</span>
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isUploading} 
            className="flex h-10 md:h-12 px-3 md:px-6 rounded-xl font-bold gap-2 shadow-lg bg-primary hover:bg-primary/90 text-white transition-all active:scale-95"
          >
            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Salvar
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative w-full h-full pt-24 md:pt-32">
        <aside className="hidden lg:flex w-80 bg-background border-r flex flex-col shrink-0 h-full">
          <PublicPageSettings 
            themeColor={themeColor} setThemeColor={setThemeColor} secondaryColor={secondaryColor} setSecondaryColor={setSecondaryColor}
            layout={layout} setLayout={setLayout} logoUrl={logoUrl} setLogoUrl={setLogoUrl}
            heroTitle={heroTitle} setHeroTitle={setHeroTitle} heroSubtitle={heroSubtitle} setHeroSubtitle={setHeroSubtitle}
            testimonialsTitle={testimonialsTitle} setTestimonialsTitle={setTestimonialsTitle}
            footerText={footerText} setFooterText={setFooterText} showLogo={showLogo} setShowLogo={setShowLogo}
            whatsappEnabled={whatsappEnabled} setWhatsappEnabled={setWhatsappEnabled}
            whatsappNumber={whatsappNumber} setWhatsappNumber={setWhatsappNumber}
            externalSiteUrl={externalSiteUrl} setExternalSiteUrl={setExternalSiteUrl}
            externalSiteButtonText={externalSiteButtonText} setExternalSiteButtonText={setExternalSiteButtonText}
            customSections={customSections} setCustomSections={setCustomSections} 
            autoPublishEnabled={autoPublishEnabled} setAutoPublishEnabled={setAutoPublishEnabled}
            autoPublishMinRating={autoPublishMinRating} setAutoPublishMinRating={setAutoPublishMinRating}
            autoPublishMinChars={autoPublishMinChars} setAutoPublishMinChars={setAutoPublishMinChars}
            onFileSelect={onFileSelect}
            isUploading={isUploading} isGoldPlan={isGoldPlan} isEnterprise={isEnterprise}
            logoInputRef={logoInputRef} currentSlug={slugEdit} setSlugEdit={setSlugEdit}
            approvedTestimonials={approvedTestimonials}
            selectedIds={selectedIds}
            toggleSelection={toggleSelection}
            SELECTION_LIMIT={SELECTION_LIMIT}
          />
        </aside>

        <div className="flex-1 overflow-y-auto bg-muted/10 p-4 sm:p-8">
           <div className="max-w-6xl mx-auto space-y-8 flex flex-col h-full">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
                 <div className="space-y-1">
                    <h2 className="text-2xl font-black font-headline tracking-tighter">Editor de Página Pública</h2>
                    <p className="text-xs text-muted-foreground font-medium">Configure o visual e selecione os melhores depoimentos para sua vitrine.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                      <SheetTrigger asChild>
                         <Button variant="outline" className="lg:hidden h-11 rounded-xl font-bold gap-2"><Palette className="w-4 h-4" /> Estilo & Depoimentos</Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0 w-full sm:max-w-sm">
                         <SheetHeader className="sr-only">
                           <SheetTitle>Editor de Configurações</SheetTitle>
                           <SheetDescription>Ajuste o visual e a seleção de depoimentos da sua página pública.</SheetDescription>
                         </SheetHeader>
                         <PublicPageSettings 
                            themeColor={themeColor} setThemeColor={setThemeColor} secondaryColor={secondaryColor} setSecondaryColor={setSecondaryColor}
                            layout={layout} setLayout={setLayout} logoUrl={logoUrl} setLogoUrl={setLogoUrl}
                            heroTitle={heroTitle} setHeroTitle={setHeroTitle} heroSubtitle={heroSubtitle} setHeroSubtitle={setHeroSubtitle}
                            testimonialsTitle={testimonialsTitle} setTestimonialsTitle={setTestimonialsTitle}
                            footerText={footerText} setFooterText={setFooterText} showLogo={showLogo} setShowLogo={setShowLogo}
                            whatsappEnabled={whatsappEnabled} setWhatsappEnabled={setWhatsappEnabled}
                            whatsappNumber={whatsappNumber} setWhatsappNumber={setWhatsappNumber}
                            externalSiteUrl={externalSiteUrl} setExternalSiteUrl={setExternalSiteUrl}
                            externalSiteButtonText={externalSiteButtonText} setExternalSiteButtonText={setExternalSiteButtonText}
                            customSections={customSections} setCustomSections={setCustomSections} 
                            autoPublishEnabled={autoPublishEnabled} setAutoPublishEnabled={setAutoPublishEnabled}
                            autoPublishMinRating={autoPublishMinRating} setAutoPublishMinRating={setAutoPublishMinRating}
                            autoPublishMinChars={autoPublishMinChars} setAutoPublishMinChars={setAutoPublishMinChars}
                            onFileSelect={onFileSelect}
                            isUploading={isUploading} isGoldPlan={isGoldPlan} isEnterprise={isEnterprise}
                            logoInputRef={logoInputRef} currentSlug={slugEdit} setSlugEdit={setSlugEdit}
                            onClose={() => setIsSheetOpen(false)}
                            approvedTestimonials={approvedTestimonials}
                            selectedIds={selectedIds}
                            toggleSelection={toggleSelection}
                            SELECTION_LIMIT={SELECTION_LIMIT}
                          />
                      </SheetContent>
                    </Sheet>
                 </div>
              </header>

              <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-4">
                  <div className="w-full max-w-sm flex flex-col gap-3 shrink-0 mb-4">
                    <div className="flex items-center gap-2 px-1">
                      <Monitor className="w-4 h-4 text-primary" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60">Pré-visualização ao vivo</h3>
                    </div>
                  </div>
                  
                  <div className="relative w-full max-w-[360px] flex-1 bg-background rounded-[3rem] shadow-2xl border-[8px] border-muted overflow-hidden flex flex-col aspect-[9/19]">
                    <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
                        <header className="p-8 text-center space-y-6 shrink-0">
                          {logoUrl && <img src={logoUrl} className="w-20 h-20 mx-auto rounded-2xl object-cover shadow-lg border-2 border-background" />}
                          <div className="space-y-2">
                              <div className="text-xl font-black leading-tight" dangerouslySetInnerHTML={{ __html: heroTitle || 'Seu Título Aqui' }} />
                              <div className="text-[10px] text-muted-foreground font-medium italic opacity-80" dangerouslySetInnerHTML={{ __html: heroSubtitle }} />
                          </div>
                        </header>

                        {customSections.map(s => (
                          <section key={s.id} className={cn("p-8 text-center space-y-4 shrink-0", s.variant === 'accent' ? "text-white" : (s.variant === 'dark' ? "bg-black text-white" : "bg-muted/5"))} style={{ backgroundColor: s.variant === 'accent' ? themeColor : undefined }}>
                            <h4 className="text-sm font-black uppercase">{s.title}</h4>
                            <p className="text-[10px] leading-relaxed opacity-80">{s.content}</p>
                          </section>
                        ))}

                        <main className="p-6 space-y-6 flex-1">
                          {testimonialsTitle && <h3 className="text-center font-black uppercase tracking-tight text-xs" style={{ color: themeColor }}>{testimonialsTitle}</h3>}
                          <div className={cn("grid gap-4", (layout === 'popup' || layout === 'carousel' || layout === 'mural') ? "grid-cols-1" : "grid-cols-1")}>
                              {visibleTestimonialsPreview.map((t, idx) => (
                                <div 
                                  key={`${t.id}-${idx}-${muralIndex}`} 
                                  className={cn(
                                    "p-4 rounded-3xl bg-card shadow-lg border-none animate-in fade-in zoom-in-95 duration-700",
                                    layout === 'mural' && (idx % 2 === 0 ? "slide-in-from-left-4" : "slide-in-from-right-4")
                                  )}
                                  style={{ 
                                    boxShadow: secondaryColor ? `0 0 20px ${secondaryColor}40` : `0 10px 30px -10px ${themeColor}20`,
                                    border: secondaryColor ? `1px solid ${secondaryColor}40` : 'none'
                                  }}
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                      <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-black text-[10px]" style={{ backgroundColor: themeColor }}>{t.userName?.substring(0,2).toUpperCase()}</div>
                                      <div>
                                        <p className="font-black text-[10px] uppercase truncate max-w-[80px] leading-none">{t.userName}</p>
                                        <div className="flex gap-0.5 mt-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-2 h-2", s <= t.rating ? "fill-current" : "opacity-10")} style={{ color: themeColor }} />)}</div>
                                      </div>
                                  </div>
                                  <p className="text-[10px] font-bold italic opacity-70 leading-relaxed">"{t.text}"</p>
                                </div>
                              ))}
                              {currentSelection.length === 0 && <div className="py-10 text-center opacity-20"><Star className="w-8 h-8 mx-auto" /><p className="text-[8px] font-black uppercase tracking-widest mt-2">Nenhum item selecionado</p></div>}
                          </div>
                        </main>

                        <footer className="p-10 text-center space-y-4 border-t bg-muted/5 mt-auto shrink-0">
                          <div className="flex flex-col items-center gap-1.5 opacity-30">
                              <p className="text-[8px] font-bold uppercase tracking-widest">© {footerText || 'Proova'}</p>
                              {showLogo && <span className="text-[6px] font-black uppercase tracking-[0.3em]">Powered by Proova</span>}
                          </div>
                        </footer>
                    </div>
                  </div>
              </div>
           </div>
        </div>
      </main>

      <Dialog open={!!tempImage} onOpenChange={(open) => !open && setTempImage(null)}>
        <DialogContent className="sm:max-w-2xl h-[70vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none">
          <DialogHeader className="p-6 bg-background border-b shrink-0"><DialogTitle>Recortar Logo</DialogTitle></DialogHeader>
          <div className="flex-1 relative bg-black">{tempImage && <Cropper image={tempImage} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={(a, p) => setCroppedAreaPixels(p)} onZoomChange={setZoom} />}</div>
          <div className="p-6 border-t bg-background shrink-0 space-y-6">
            <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(vals) => setZoom(vals[0])} />
            <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setTempImage(null)}>Cancelar</Button><Button onClick={handleConfirmCrop} className="font-bold">Salvar Logo</Button></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function getCroppedImg(imageSrc: string, pixelCrop: any, type: string): Promise<Blob> {
  const image = new (window as any).Image(); image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));
  const canvas = document.createElement('canvas'); canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error();
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9));
}
