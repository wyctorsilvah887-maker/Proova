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
  ListChecks,
  Eye,
  FileVideo
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetDescription,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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

  const isVideoLogo = useMemo(() => {
    if (!logoUrl) return false;
    const url = logoUrl.toLowerCase();
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
  }, [logoUrl]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-background relative">
      <div className="absolute top-4 right-4 z-[100] lg:hidden">
        {onClose && (
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-background border shadow-lg flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 border-b bg-muted/10 shrink-0 space-y-4 pt-8 md:pt-4">
        <div className="flex items-center justify-between">
          <Link href="/dash">
            <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground hover:text-primary hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:ring-0 transition-all h-8">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Painel Dash</span>
            </Button>
          </Link>
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-black uppercase tracking-widest">Configurações</h2>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Personalize sua vitrine Proova</p>
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full flex-1 flex flex-col min-h-0">
        <div className="w-full border-b bg-background/50 backdrop-blur-sm sticky top-0 z-20 overflow-hidden">
          <div 
            ref={tabsScrollRef}
            className="w-full overflow-x-auto scrollbar-hide flex items-center"
          >
            <TabsList className="flex w-max justify-start rounded-none bg-transparent h-14 px-2 shrink-0 gap-1">
              {[
                { id: 'geral', label: 'Visual', icon: Palette },
                { id: 'selecao', label: 'Seleção', icon: ListChecks, badge: selectedIds.length },
                { id: 'conteudo', label: 'Conteúdo', icon: Type, locked: !isGoldPlan },
                { id: 'automacao', label: 'Automação', icon: Zap, locked: !isEnterprise },
                { id: 'design', label: 'Layout', icon: LayoutGrid },
                { id: 'social', label: 'Contato', icon: MessageCircle },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1.5 px-5 h-full rounded-none border-b-2 border-transparent transition-all min-w-[70px]",
                    "data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary",
                    "hover:text-primary/70"
                  )}
                >
                  <div className="relative">
                    <tab.icon className="w-4 h-4" />
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[7px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full ring-2 ring-background">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                    {tab.label}
                    {tab.locked && <Lock className="w-2.5 h-2.5 opacity-50" />}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-8 pb-10">
             <TabsContent value="geral" className="mt-0 space-y-8 outline-none">
                <section className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Identidade de Marca (Logo/GIF/Vídeo)</Label>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-20 h-20 rounded-3xl border-2 border-dashed border-primary/20 flex items-center justify-center bg-primary/5 overflow-hidden group cursor-pointer relative shadow-inner",
                      isUploading && "opacity-50"
                    )} onClick={() => logoInputRef.current?.click()}>
                      {logoUrl ? (
                        isVideoLogo ? (
                          <video src={logoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                        ) : (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        )
                      ) : (
                        isUploading ? <Loader2 className="animate-spin text-primary" /> : <Upload className="w-6 h-6 text-primary" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <Palette className="w-4 h-4 text-white" />
                      </div>
                      <input type="file" ref={logoInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => onFileSelect(e, 'logo')} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-bold uppercase tracking-tight">Mídia de Identidade</p>
                      <p className="text-[10px] text-muted-foreground leading-tight font-medium">Aceitamos Imagem, GIF ou Vídeo curto.</p>
                      {logoUrl && <button onClick={() => setLogoUrl('')} className="text-[10px] font-black uppercase text-destructive hover:underline pt-1 transition-all">Remover</button>}
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Cor Principal (Marca)</Label>
                   <div className="flex flex-wrap gap-2.5">
                     {colors.map(c => (
                       <button key={c} onClick={() => setThemeColor(c)} className={cn("w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-sm", themeColor === c ? "border-primary scale-110 ring-4 ring-primary/10" : "border-transparent")} style={{ backgroundColor: c }} />
                     ))}
                     <div className="relative group">
                       <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-8 h-8 rounded-full border-2 border-transparent cursor-pointer overflow-hidden p-0 opacity-0 absolute inset-0 z-10" />
                       <div className="w-8 h-8 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-muted/20 group-hover:bg-primary/10 transition-colors"><Plus className="w-4 h-4 text-primary" /></div>
                     </div>
                   </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Link da Página</Label>
                    {!isGoldPlan && <Lock className="w-3 h-3 text-muted-foreground opacity-40" />}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 bg-muted/20 rounded-xl px-4 border border-transparent focus-within:ring-2 focus-within:ring-primary/20 transition-all",
                    !isGoldPlan && "opacity-60 cursor-not-allowed bg-muted/40"
                  )}>
                    <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">/pp/</span>
                    <input 
                      disabled={!isGoldPlan}
                      value={currentSlug} 
                      onChange={(e) => setSlugEdit(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
                      className="h-12 flex-1 bg-transparent border-none focus:ring-0 text-xs font-mono font-bold" 
                    />
                  </div>
                </section>
             </TabsContent>

             <TabsContent value="selecao" className="mt-0 space-y-6 outline-none">
                <div className="flex items-center justify-between mb-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Seu Acervo</Label>
                    <p className="text-[9px] text-muted-foreground font-medium">Selecione para exibir</p>
                  </div>
                  <Badge variant="secondary" className="font-black h-6 text-[10px] bg-primary text-white border-none px-2">
                    {selectedIds.length} / {SELECTION_LIMIT === Infinity ? '∞' : SELECTION_LIMIT}
                  </Badge>
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
                          "p-4 rounded-2xl border-2 transition-all cursor-pointer flex gap-4 items-start relative group",
                          isSelected ? "bg-primary/5 border-primary shadow-sm" : "bg-muted/10 border-transparent hover:border-primary/20"
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all shadow-sm",
                          isSelected ? "bg-primary border-primary" : "border-muted-foreground/30 bg-background"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-black text-[11px] uppercase truncate tracking-tight">{t.userName}</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed italic line-clamp-2 font-medium">"{t.text}"</p>
                          {t.videoUrl && <Badge variant="outline" className="text-[7px] h-4 px-1 font-black uppercase border-primary/30 text-primary mt-1">VÍDEO REVIEW</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
             </TabsContent>

             <TabsContent value="conteudo" className="mt-0 space-y-8 outline-none">
               {!isGoldPlan ? (
                 <div className="p-8 text-center bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 space-y-5">
                   <div className="mx-auto w-14 h-14 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary shadow-inner"><Gem className="w-7 h-7" /></div>
                   <div className="space-y-2">
                     <h4 className="text-sm font-black uppercase tracking-tight">Conteúdo VIP Ativado</h4>
                     <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Assine o plano Gold para liberar edição rica de texto, cores personalizadas e seções ilimitadas.</p>
                   </div>
                   <Button onClick={() => router.push('/pricing')} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[9px] bg-primary shadow-lg hover:bg-primary/90">Garantir Acesso Gold</Button>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <section className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Título de Impacto (Herói)</Label>
                      <RichTextEditor value={heroTitle} onChange={setHeroTitle} allowColor={isGoldPlan} placeholder="Ex: O que dizem sobre nossa marca" />
                    </section>
                    <section className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Subtítulo de Apoio</Label>
                      <RichTextEditor value={heroSubtitle} onChange={setHeroSubtitle} allowColor={isGoldPlan} placeholder="Ex: Milhares de clientes satisfeitos pelo Brasil" />
                    </section>
                    <section className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Título da Seção de Depoimentos</Label>
                      <Input value={testimonialsTitle} onChange={(e) => setTestimonialsTitle(e.target.value)} placeholder="Ex: Relatos Reais" className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs font-bold" />
                    </section>

                    <section className="space-y-4 pt-4">
                       <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Seções Customizadas</h4>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setCustomSections([...customSections, { id: Date.now().toString(), title: 'Nova Seção', subtitle: '', content: 'Conteúdo da seção...', buttonText: '', buttonUrl: '', variant: 'light' }])}
                            className="h-8 rounded-lg text-[9px] font-black uppercase gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar
                          </Button>
                       </div>
                       
                       <Accordion type="single" collapsible className="space-y-2">
                         {customSections.map((section, index) => (
                           <AccordionItem key={section.id} value={section.id} className="border bg-muted/10 rounded-2xl px-4 overflow-hidden shadow-sm">
                             <AccordionTrigger className="hover:no-underline text-xs font-black uppercase tracking-tight py-4">
                               Seção {index + 1}: {section.title.replace(/<[^>]*>?/gm, '').substring(0, 15)}...
                             </AccordionTrigger>
                             <AccordionContent className="space-y-4 pb-6">
                                <div className="space-y-2">
                                   <Label className="text-[9px] font-black uppercase">Título</Label>
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
                                   <Label className="text-[9px] font-black uppercase">Texto</Label>
                                   <Textarea value={section.content} onChange={(e) => {
                                      const newSections = [...customSections];
                                      newSections[index].content = e.target.value;
                                      setCustomSections(newSections);
                                   }} className="rounded-xl min-h-[100px] text-xs" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                   <div className="space-y-2">
                                      <Label className="text-[9px] font-black uppercase">Botão</Label>
                                      <Input value={section.buttonText} onChange={(e) => {
                                         const newSections = [...customSections];
                                         newSections[index].buttonText = e.target.value;
                                         setCustomSections(newSections);
                                      }} placeholder="Opcional" className="h-10 rounded-xl text-xs" />
                                   </div>
                                   <div className="space-y-2">
                                      <Label className="text-[9px] font-black uppercase">URL</Label>
                                      <Input value={section.buttonUrl} onChange={(e) => {
                                         const newSections = [...customSections];
                                         newSections[index].buttonUrl = e.target.value;
                                         setCustomSections(newSections);
                                      }} placeholder="https://..." className="h-10 rounded-xl text-xs" />
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[9px] font-black uppercase">Estilo</Label>
                                   <Select value={section.variant} onValueChange={(val: any) => {
                                      const newSections = [...customSections];
                                      newSections[index].variant = val;
                                      setCustomSections(newSections);
                                   }}>
                                      <SelectTrigger className="h-10 rounded-xl text-xs font-bold">
                                         <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-xl">
                                         <SelectItem value="light">Claro</SelectItem>
                                         <SelectItem value="dark">Escuro</SelectItem>
                                         <SelectItem value="accent">Marca</SelectItem>
                                      </SelectContent>
                                   </Select>
                                </div>
                                <button 
                                  onClick={() => setCustomSections(customSections.filter((_, i) => i !== index))}
                                  className="w-full h-10 rounded-xl text-destructive hover:bg-destructive/10 text-[9px] font-black uppercase gap-2 border border-transparent transition-colors mt-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                </button>
                             </AccordionContent>
                           </AccordionItem>
                         ))}
                       </Accordion>
                    </section>
                 </div>
               )}
             </TabsContent>

             <TabsContent value="automacao" className="mt-0 space-y-8 outline-none">
               {!isEnterprise ? (
                 <div className="p-8 text-center bg-orange-500/5 rounded-[2.5rem] border-2 border-dashed border-orange-500/20 space-y-5">
                   <div className="mx-auto w-14 h-14 bg-orange-500/10 rounded-[1.5rem] flex items-center justify-center text-orange-600 shadow-inner"><Zap className="w-7 h-7" /></div>
                   <div className="space-y-2">
                     <h4 className="text-sm font-black uppercase tracking-tight">Fluxos Hands-Free Enterprise</h4>
                     <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Publique elogios automaticamente baseados em suas regras estratégicas de nota e volume de texto.</p>
                   </div>
                   <Button onClick={() => router.push('/pricing')} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[9px] bg-orange-500 hover:bg-orange-600 shadow-lg text-white transition-all active:scale-95">Fazer Upgrade</Button>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <section className="space-y-4">
                       <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-muted/20 border border-muted shadow-sm">
                          <div className="space-y-1">
                             <p className="text-xs font-black uppercase tracking-tight">Auto-Publish Ativo</p>
                             <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">Postagem automática por critérios</p>
                          </div>
                          <Switch checked={autoPublishEnabled} onCheckedChange={setAutoPublishEnabled} />
                       </div>

                       {autoPublishEnabled && (
                         <div className="space-y-8 p-5 rounded-[2rem] border-2 border-dashed border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-3 duration-500">
                            <div className="space-y-4">
                               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-70">
                                  <span>Nota Mínima</span>
                                  <span className="text-primary">{autoPublishMinRating} Estrelas</span>
                               </div>
                               <Slider value={[autoPublishMinRating]} min={1} max={5} step={1} onValueChange={(val) => setAutoPublishMinRating(val[0])} />
                            </div>
                            <div className="space-y-4">
                               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-70">
                                  <span>Tamanho Mínimo</span>
                                  <span className="text-primary">{autoPublishMinChars} Caracteres</span>
                               </div>
                               <Slider value={[autoPublishMinChars]} min={0} max={200} step={10} onValueChange={(val) => setAutoPublishMinChars(val[0])} />
                            </div>
                         </div>
                       )}
                    </section>
                 </div>
               )}
             </TabsContent>

             <TabsContent value="design" className="mt-0 space-y-8 outline-none">
                <section className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Layout dos Depoimentos</Label>
                   <div className="grid grid-cols-2 gap-3.5">
                     {[
                       { id: 'grid', label: 'Grade VIP', icon: LayoutGrid, desc: 'Clássico e sólido' },
                       { id: 'mural', label: 'Mural', icon: Layout, desc: 'Dinâmico Pinterest' },
                       { id: 'carousel', label: 'Carrossel', icon: Play, desc: 'Foco um a um' },
                       { id: 'popup', label: 'Destaque', icon: MessageCircle, desc: 'O melhor por vez' },
                     ].map(l => (
                       <button 
                         key={l.id} 
                         onClick={() => setLayout(l.id as LayoutType)}
                         className={cn(
                           "flex flex-col items-center justify-center p-5 rounded-[1.5rem] border-2 transition-all gap-2 text-center shadow-sm",
                           layout === l.id ? "bg-primary/5 border-primary shadow-inner" : "bg-muted/20 border-transparent hover:border-primary/20"
                         )}
                       >
                         <l.icon className={cn("w-6 h-6", layout === l.id ? "text-primary" : "text-muted-foreground")} />
                         <div className="space-y-0.5">
                            <p className="text-xs font-black uppercase tracking-tight">{l.label}</p>
                            <p className="text-[8px] opacity-60 font-medium leading-none uppercase">{l.desc}</p>
                         </div>
                       </button>
                     ))}
                   </div>
                </section>
                
                <section className="space-y-4">
                  <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-muted/20 border border-muted">
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-tight">Cor Secundária (Efeitos)</p>
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">Ativa brilhos e bordas VIP</p>
                    </div>
                    <div className="relative">
                       <input type="color" value={secondaryColor || '#ffffff'} onChange={(e) => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded-full border-2 border-transparent cursor-pointer shadow-md" />
                    </div>
                  </div>
                  {secondaryColor && <button onClick={() => setSecondaryColor('')} className="text-[9px] font-black uppercase text-destructive hover:underline ml-1 transition-all">Desativar Efeitos</button>}
                </section>
             </TabsContent>

             <TabsContent value="social" className="mt-0 space-y-8 outline-none">
                <section className="space-y-4">
                   <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-green-500/5 border border-green-500/20 shadow-sm">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600"><MessageCircle className="w-5 h-5" /></div>
                         <p className="text-xs font-black uppercase tracking-tight">Botão WhatsApp</p>
                      </div>
                      <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
                   </div>
                   {whatsappEnabled && (
                     <div className="space-y-4 p-5 rounded-[2rem] border-2 border-dashed border-green-500/30 bg-green-500/5 animate-in fade-in slide-in-from-top-3">
                        <div className="space-y-2.5">
                           <Label className="text-[9px] font-black uppercase ml-1 opacity-60">Seu WhatsApp (Ex: 11999998888)</Label>
                           <Input placeholder="Apenas números..." value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="h-12 rounded-xl bg-background border-green-500/20 focus:ring-green-500/20 font-bold" />
                        </div>
                     </div>
                   )}
                </section>

                <section className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Site Oficial (Botão Rodapé)</Label>
                   <div className="space-y-4">
                      <Input value={externalSiteButtonText} onChange={(e) => setExternalSiteButtonText(e.target.value)} placeholder="Texto do botão" className="h-11 rounded-xl" />
                      <Input value={externalSiteUrl} onChange={(e) => setExternalSiteUrl(e.target.value)} placeholder="https://www.seusite.com.br" className="h-11 rounded-xl" />
                   </div>
                </section>

                <section className="space-y-5">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Configurações de Rodapé</Label>
                   <div className="space-y-4">
                      <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Copyright" className="h-11 rounded-xl" />
                      <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-muted/10 border border-muted">
                        <p className="text-[10px] font-black uppercase tracking-tight">Exibir Powered by Proova</p>
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
    const isSlugChanging = newSlug !== oldSlug && newSlug !== '';

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

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isGif = file.type === 'image/gif';

    if (isVideo || isGif) {
      if (!user || !storage || !activeSlug) return;
      setIsUploading(true);
      try {
        const storageRef = ref(storage, `users/${user.uid}/pp/${activeSlug}/${type}_${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file, { contentType: file.type });
        const url = await getDownloadURL(storageRef);
        setLogoUrl(url);
        toast({ title: "Mídia Processada", description: "Identidade dinâmica aplicada com sucesso." });
      } catch (err) {
        toast({ variant: "destructive", title: "Erro no processamento" });
      } finally {
        setIsUploading(false);
      }
    } else {
      const reader = new FileReader();
      reader.addEventListener('load', () => { 
        setTempImage(reader.result as string); 
        setCropType(type); 
      });
      reader.readAsDataURL(file);
    }
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

  const isVideoLogo = useMemo(() => {
    if (!logoUrl) return false;
    const url = logoUrl.toLowerCase();
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
  }, [logoUrl]);

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
            onClick={() => router.push(`/pp/${activeSlug}`)}
          >
            <Eye className="w-4 h-4" />
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
        <aside className="hidden lg:flex w-[340px] bg-background border-r flex flex-col shrink-0 h-full shadow-2xl z-50 pt-4">
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

        <div className="flex-1 overflow-y-auto bg-muted/10 p-4 sm:p-8 flex flex-col">
           <div className="max-w-6xl mx-auto space-y-8 flex-1 flex flex-col w-full h-full">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
                 <div className="space-y-1">
                    <h2 className="text-2xl font-black font-headline tracking-tighter uppercase">Editor de Página Pública</h2>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Visualize suas alterações em tempo real.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                      <SheetTrigger asChild>
                         <Button variant="outline" className="lg:hidden h-12 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-primary/20 text-primary shadow-sm bg-background"><Palette className="w-4 h-4" /> Menu de Edição</Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0 w-full sm:max-w-xs border-none shadow-2xl overflow-hidden">
                         <SheetHeader className="sr-only">
                           <SheetTitle>Painel de Edição VIP</SheetTitle>
                           <SheetDescription>Configurações avançadas da sua página de autoridade.</SheetDescription>
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

              <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-8 md:py-12">
                  <div className="w-full max-w-sm flex flex-col gap-3 shrink-0 mb-6 px-1">
                    <div className="flex items-center gap-2.5 opacity-60">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Monitor className="w-4 h-4" /></div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Live Preview</h3>
                    </div>
                  </div>
                  
                  <div className="relative w-full max-w-[360px] flex-1 bg-background rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border-[10px] border-muted overflow-hidden flex flex-col aspect-[9/19] scale-[0.85] sm:scale-100 transition-all duration-700 ring-1 ring-primary/5">
                    <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
                        <header className="p-8 text-center space-y-6 shrink-0 pt-12">
                          {logoUrl && (
                             isVideoLogo ? (
                               <div className="w-24 h-24 mx-auto rounded-[2rem] overflow-hidden shadow-2xl border-4 border-background ring-1 ring-primary/10 relative">
                                 <video src={logoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                 <div className="absolute top-2 right-2 bg-black/40 p-1 rounded-full"><FileVideo className="w-3 h-3 text-white" /></div>
                               </div>
                             ) : (
                               <div className="w-24 h-24 mx-auto rounded-[2rem] overflow-hidden shadow-2xl border-4 border-background ring-1 ring-primary/10 bg-background">
                                 <img src={logoUrl} className="w-full h-full object-cover" />
                               </div>
                             )
                          )}
                          <div className="space-y-4">
                              <div className="text-2xl font-black leading-[1.1] tracking-tighter" dangerouslySetInnerHTML={{ __html: heroTitle || 'Seu Título' }} />
                              <div className="text-[11px] text-muted-foreground font-medium italic opacity-80 leading-relaxed px-2" dangerouslySetInnerHTML={{ __html: heroSubtitle }} />
                          </div>
                        </header>

                        <div className="ml-auto flex items-center gap-2 md:gap-4 px-8">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-10 md:h-12 px-1.5 md:px-2 gap-1.5 md:gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                                <div className="flex flex-col items-end relative">
                                  <span className="text-[10px] md:text-xs font-bold truncate max-w-[70px] sm:max-w-[120px] transition-colors group-hover:text-primary leading-tight">
                                    {userData?.companyName || 'Empresa'}
                                  </span>
                                  <div className="flex flex-col items-end gap-0">
                                    <span className={cn(
                                      "text-[6px] sm:text-[8px] uppercase tracking-widest font-black leading-tight text-primary",
                                      userData?.membershipStatus === 'enterprise' && "animate-pulse"
                                    )}>
                                      {userData?.membershipStatus?.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20"><User className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>
                              </Button>
                            </DropdownMenuTrigger>
                          </DropdownMenu>
                        </div>

                        <main className="p-8 space-y-8 flex-1">
                          <div className={cn("grid gap-6", "grid-cols-1")}>
                              {visibleTestimonialsPreview.map((t, idx) => (
                                <div 
                                  key={`${t.id}-${idx}-${muralIndex}`} 
                                  className={cn(
                                    "p-6 rounded-[2.5rem] bg-card shadow-2xl border-none animate-in fade-in zoom-in-95 duration-1000",
                                    layout === 'mural' && (idx % 2 === 0 ? "slide-in-from-left-6" : "slide-in-from-right-6")
                                  )}
                                  style={{ 
                                    boxShadow: secondaryColor ? `0 0 30px ${secondaryColor}30, 0 10px 40px -10px rgba(0,0,0,0.1)` : `0 15px 40px -15px ${themeColor}25`,
                                    border: secondaryColor ? `2px solid ${secondaryColor}20` : 'none'
                                  }}
                                >
                                  <div className="flex items-center gap-4 mb-5">
                                      <div className="h-10 w-10 rounded-full border flex items-center justify-center shrink-0 bg-transparent transition-colors duration-700" style={{ borderColor: secondaryColor ? `${secondaryColor}30` : `${themeColor}30` }}>
                                        <User className="w-5 h-5" style={{ color: secondaryColor ? secondaryColor : themeColor }} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-black text-[11px] uppercase truncate max-w-[100px] tracking-tight leading-none">{t.userName}</p>
                                        <div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-2.5 h-2.5", s <= t.rating ? "fill-current" : "opacity-10")} style={{ color: secondaryColor ? secondaryColor : themeColor }} />)}</div>
                                      </div>
                                  </div>
                                  <p className="text-xs font-bold italic opacity-80 leading-relaxed tracking-tight">"{t.text}"</p>
                                </div>
                              ))}
                          </div>
                        </main>
                    </div>
                  </div>
              </div>
           </div>
        </div>
      </main>

      <Dialog open={!!tempImage} onOpenChange={(open) => !open && setTempImage(null)}>
        <DialogContent className="sm:max-w-2xl h-[70vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-6 bg-background border-b shrink-0"><DialogTitle className="font-black uppercase tracking-tight">Recortar Identidade</DialogTitle></DialogHeader>
          <div className="flex-1 relative bg-black">{tempImage && <Cropper image={tempImage} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={(a, p) => setCroppedAreaPixels(p)} onZoomChange={setZoom} />}</div>
          <div className="p-6 border-t bg-background shrink-0 space-y-6">
            <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(vals) => setZoom(vals[0])} />
            <DialogFooter className="gap-3"><Button variant="ghost" onClick={() => setTempImage(null)} className="font-bold uppercase text-xs">Cancelar</Button><Button onClick={handleConfirmCrop} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary shadow-lg">Confirmar Recorte</Button></DialogFooter>
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