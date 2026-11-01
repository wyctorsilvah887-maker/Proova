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
  X
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
import { signOut } from 'firebase/auth';
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <div className="relative group">
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

const TestimonialCard = ({ t, themeColor, secondaryColor, index = 0, muralIndex = 0 }: { t: any, themeColor: string, secondaryColor: string, index?: number, muralIndex?: number }) => {
  const hasSecondary = !!secondaryColor && secondaryColor !== 'transparent';
  const side = (index + muralIndex) % 2 === 0 ? 'left' : 'right';
  
  return (
    <Card 
      className={cn(
        "bg-card rounded-[2.5rem] p-6 sm:p-8 shadow-2xl transition-all duration-700 hover:scale-[1.02] border-none",
        "animate-in fade-in duration-700 ease-out fill-both",
        side === 'left' ? "slide-in-from-left-12" : "slide-in-from-right-12"
      )}
      style={{ 
        boxShadow: `0 20px 40px -20px ${themeColor}25`,
        border: hasSecondary ? `2px solid ${secondaryColor}` : 'none'
      }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg rotate-3 shrink-0" style={{ backgroundColor: themeColor }}>
              {t.userName?.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm text-foreground tracking-tight truncate max-w-[120px]">{t.userName}</p>
              <div className="flex items-center gap-1.5">
                 <CheckCircle2 className="w-2.5 h-2.5 text-green-500 fill-green-500/20" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Verificado</span>
              </div>
            </div>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn("w-3 h-3", s <= (t.rating || 5) ? "fill-current" : "opacity-20")} style={{ color: themeColor }} />
            ))}
          </div>
        </div>

        {t.videoUrl && (
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl group ring-1 ring-white/10">
             <video src={t.videoUrl} className="w-full h-full object-cover" muted loop playsInline autoPlay />
             <div className="absolute bottom-3 left-3 flex items-center gap-2">
               <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                 <p className="text-[8px] text-white font-black uppercase tracking-widest flex items-center gap-1.5">
                   <Play className="w-2 h-2 fill-white" /> Vídeo Review
                 </p>
               </div>
             </div>
          </div>
        )}

        {t.text && t.text !== '(Depoimento em Vídeo)' && (
          <div className="relative">
            <span className="absolute -top-3 -left-2 text-5xl opacity-10 font-serif select-none pointer-events-none" style={{ color: themeColor }}>“</span>
            <p className="text-foreground/90 font-medium text-sm sm:text-base leading-relaxed italic relative z-10 px-2">
              {t.text}
            </p>
          </div>
        )}

        <div className="pt-5 border-t border-muted-foreground/10 flex items-center justify-between">
          <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
          </span>
          <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
        </div>
      </div>
    </Card>
  );
};

const PublicPageSettings = ({ 
  themeColor, setThemeColor,
  secondaryColor, setSecondaryColor,
  layout, setLayout,
  logoUrl, setLogoUrl,
  heroTitle, setHeroTitle,
  heroSubtitle, setHeroSubtitle,
  footerText, setFooterText,
  showLogo, setShowLogo,
  customSections, setCustomSections,
  onFileSelect,
  isUploading,
  handleSave,
  isSaving,
  isGoldPlan,
  logoInputRef,
  currentSlug, setSlugEdit,
  onClose
}: any) => {
  const colors = ['#f97316', '#D4AF37', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#e11d48', '#0d9488', '#7c3aed', '#475569', '#000000', '#ffffff'];
  const router = useRouter();

  const addSection = () => {
    if (!isGoldPlan) return;
    setCustomSections((prev: CustomSection[]) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        title: 'Nova Seção de Destaque',
        subtitle: '',
        content: 'Conteúdo descritivo aqui...',
        buttonText: '',
        buttonUrl: '',
        variant: 'light'
      }
    ]);
  };

  const removeSection = (id: string) => {
    setCustomSections((prev: CustomSection[]) => prev.filter(s => s.id !== id));
  };

  const updateSection = (id: string, field: keyof CustomSection, value: string) => {
    setCustomSections((prev: CustomSection[]) => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-background">
      <div className="p-4 border-b bg-muted/10 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/dash" className="group">
            <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground hover:text-primary transition-all h-8">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-[10px] font-black uppercase tracking-widest">Dash</span>
            </Button>
          </Link>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden h-8 w-8 rounded-full"><X className="w-4 h-4" /></Button>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="w-full shadow-lg h-12 rounded-xl font-bold gap-2 text-sm">
          {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          Salvar Página
        </Button>
      </div>

      <Tabs defaultValue="geral" className="w-full flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-2 shrink-0">
          <TabsTrigger value="geral" className="text-xs font-bold uppercase tracking-widest">Visual</TabsTrigger>
          <TabsTrigger value="conteudo" className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            Conteúdo {!isGoldPlan && <Lock className="w-2.5 h-2.5 opacity-40" />}
          </TabsTrigger>
          <TabsTrigger value="design" className="text-xs font-bold uppercase tracking-widest">Layout</TabsTrigger>
          <TabsTrigger value="social" className="text-xs font-bold uppercase tracking-widest">Bio</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-8 pb-10">
            <TabsContent value="geral" className="mt-0 space-y-8">
              <div className="space-y-4 text-center">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-left ml-1">Logotipo</Label>
                <div 
                  onClick={() => !isUploading && logoInputRef.current?.click()}
                  className="aspect-square w-24 border-2 border-dashed rounded-2xl flex items-center justify-center bg-muted/20 overflow-hidden mx-auto cursor-pointer group transition-all hover:bg-muted/30"
                >
                  {isUploading ? <Loader2 className="animate-spin text-primary" /> : (logoUrl ? <img src={logoUrl} className="w-full h-full object-cover rounded-xl" alt="Logo" /> : <Upload className="text-muted-foreground group-hover:text-primary transition-colors" />)}
                </div>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => onFileSelect(e, 'logo')} />
              </div>

              <div className="space-y-6 pt-4 border-t">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-1">
                  <Palette className="w-3 h-3 text-primary" /> Cor Primária
                </Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button key={color} onClick={() => setThemeColor(color)} className={cn("w-7 h-7 rounded-full border-2 transition-transform hover:scale-110", themeColor === color ? "border-foreground" : "border-transparent shadow-inner")} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>

              <div className={cn("space-y-6 pt-6 border-t", !isGoldPlan && "opacity-40 grayscale pointer-events-none")}>
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-1">
                  <Palette className="w-3 h-3 text-primary" /> Cor Secundária (Bordas) {!isGoldPlan && <Lock className="w-2.5 h-2.5 ml-1" />}
                </Label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSecondaryColor('')} 
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center bg-muted/20 relative overflow-hidden", 
                      !secondaryColor ? "border-foreground shadow-lg" : "border-transparent shadow-inner"
                    )}
                  >
                    <div className="absolute inset-0 bg-white dark:bg-zinc-800" />
                    <div className="absolute inset-0 flex items-center justify-center"><div className="w-px h-full bg-red-500 rotate-45" /></div>
                  </button>
                  {colors.map((color) => (
                    <button key={color} onClick={() => setSecondaryColor(color)} className={cn("w-7 h-7 rounded-full border-2 transition-transform hover:scale-110", secondaryColor === color ? "border-foreground" : "border-transparent shadow-inner")} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conteudo" className="mt-0">
              {!isGoldPlan ? (
                <div className="py-16 px-4 text-center space-y-6 bg-primary/5 rounded-3xl border border-dashed border-primary/20 m-2">
                   <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit"><Gem className="w-8 h-8 text-primary" /></div>
                   <div className="space-y-2">
                     <h3 className="text-sm font-black uppercase tracking-tight">Recurso Premium</h3>
                     <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[200px] mx-auto">Edição de textos ilimitada e seções no-code exclusivas Gold/Enterprise.</p>
                   </div>
                   <Button className="w-full font-black uppercase tracking-widest text-[10px] h-11 rounded-xl" onClick={() => router.push('/pricing')}>Upgrade Agora</Button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Título Hero</Label>
                    <RichTextEditor value={heroTitle} onChange={setHeroTitle} allowColor={isGoldPlan} placeholder="O que dizem sobre nós..." />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subtítulo Hero</Label>
                    <RichTextEditor value={heroSubtitle} onChange={setHeroSubtitle} allowColor={isGoldPlan} placeholder="Texto persuasivo..." className="min-h-[60px]" />
                  </div>

                  <div className="space-y-6 pt-6 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Seções Extras</Label>
                      <Button variant="outline" size="sm" onClick={addSection} className="h-7 text-[9px] font-black uppercase gap-1"><Plus className="w-3 h-3" /> Adicionar</Button>
                    </div>
                    <div className="space-y-4">
                      {customSections.map((section: CustomSection) => (
                        <Card key={section.id} className="border bg-muted/5 overflow-hidden">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="item-1" className="border-none">
                              <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/10">
                                 <AccordionTrigger className="hover:no-underline py-1 flex-1">
                                   <span className="text-[10px] font-black uppercase truncate">{section.title}</span>
                                 </AccordionTrigger>
                                 <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSection(section.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                              <AccordionContent className="p-3 space-y-4 pb-4">
                                <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase opacity-50">Título</Label><Input value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} className="h-8 text-[11px]" /></div>
                                <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase opacity-50">Subtítulo</Label><RichTextEditor value={section.subtitle} allowColor={isGoldPlan} onChange={(val) => updateSection(section.id, 'subtitle', val)} className="min-h-[50px]" /></div>
                                <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase opacity-50">Conteúdo</Label><Textarea value={section.content} onChange={(e) => updateSection(section.id, 'content', e.target.value)} className="text-[11px] min-h-[60px]" /></div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase opacity-50">Texto Botão</Label><Input value={section.buttonText} onChange={(e) => updateSection(section.id, 'buttonText', e.target.value)} className="h-8 text-[11px]" /></div>
                                  <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase opacity-50">Link Botão</Label><Input value={section.buttonUrl} onChange={(e) => updateSection(section.id, 'buttonUrl', e.target.value)} className="h-8 text-[11px]" /></div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Copy do Rodapé</Label>
                      <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">©</span>
                        <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} className="h-10 text-xs font-medium pl-7" />
                      </div>
                    </div>
                    <div className={cn("flex items-center justify-between p-3 bg-muted/10 rounded-xl", !isGoldPlan && "opacity-50 grayscale")}>
                      <div className="space-y-0.5"><Label className="text-[11px] font-bold">Marca Proova</Label><p className="text-[9px] text-muted-foreground">Exibir "Powered by Proova"</p></div>
                      <Switch checked={showLogo} onCheckedChange={setShowLogo} disabled={!isGoldPlan} />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="design" className="mt-0 space-y-6">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Estilo de Mural</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'grid', icon: Layout, label: 'Grade Estática', isGold: false },
                  { id: 'mural', icon: LayoutGrid, label: 'Mural Dinâmico (Swap)', isGold: true },
                  { id: 'carousel', icon: Play, label: 'Carrossel Dinâmico', isGold: true },
                  { id: 'popup', icon: MessageSquare, label: 'Notificação VIP', isGold: true },
                ].map((item) => {
                   const isLocked = item.isGold && !isGoldPlan;
                   return (
                    <button 
                      key={item.id}
                      disabled={isLocked}
                      onClick={() => setLayout(item.id as LayoutType)} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left", 
                        layout === item.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/20",
                        isLocked && "opacity-40 grayscale cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                         <item.icon className={cn("w-4 h-4", layout === item.id ? "text-primary" : "text-muted-foreground")} />
                         <span className="text-xs font-bold">{item.label}</span>
                      </div>
                      {isLocked ? <Lock className="w-3 h-3 text-muted-foreground" /> : (layout === item.id && <Check className="w-3.5 h-3.5 text-primary" />)}
                    </button>
                   );
                })}
              </div>
            </TabsContent>

            <TabsContent value="social" className="mt-0 space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 ml-1"><Globe className="w-3 h-3" /> Link da Bio (Slug)</Label>
                <div className="flex items-center gap-1 bg-muted/20 rounded-xl px-3 border border-transparent focus-within:border-primary/20 transition-all">
                  <span className="text-[10px] font-bold opacity-40">/pp/</span>
                  <input value={currentSlug} onChange={(e) => setSlugEdit(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-'))} className="h-10 flex-1 bg-transparent border-none focus:ring-0 text-xs font-mono font-bold" />
                </div>
              </div>
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
  const { data: ppData, loading: ppLoading } = useDoc(ppRef);

  const isEnterprise = userData?.membershipStatus === 'enterprise';
  const isGoldPlan = isEnterprise || userData?.membershipStatus === 'gold' || userData?.membershipStatus === 'trial';
  const SELECTION_LIMIT = isEnterprise ? Infinity : (isGoldPlan ? 50 : 10);

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
  const [footerText, setFooterText] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [slugEdit, setSlugEdit] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [muralIndex, setMuralIndex] = useState(0);

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
      setFooterText(ppData.footerText || '');
      setShowLogo(ppData.showLogo !== undefined ? ppData.showLogo : true);
      setCustomSections(ppData.customSections || []);
    }
  }, [ppData]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if ((layout === 'mural' || layout === 'popup') && selectedIds.length > 0) {
      const interval = setInterval(() => setMuralIndex(prev => (prev + 1) % selectedIds.length), 6000);
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
        themeColor, secondaryColor, layout, logoUrl, heroTitle, heroSubtitle, footerText, showLogo,
        customSections: customSections || [],
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
      const count = Math.min(4, currentSelection.length);
      for (let i = 0; i < count; i++) {
        const idx = (muralIndex + i) % currentSelection.length;
        slice.push(currentSelection[idx]);
      }
      return slice;
    }
    
    if (layout === 'grid') return currentSelection;
    if (layout === 'popup') return [currentSelection[muralIndex % currentSelection.length]];
    return currentSelection;
  }, [currentSelection, layout, muralIndex]);

  if (authLoading || userDataLoading || testimonialsLoading) return <div className="flex h-screen items-center justify-center bg-muted/30"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body w-full overflow-hidden text-foreground">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 sticky top-0 z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/dash">
            <Button variant="ghost" size="sm" className="h-10 px-2 gap-2 text-muted-foreground hover:text-primary transition-all rounded-xl">
               <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Voltar</span>
            </Button>
          </Link>
          <div className="flex items-center group">
            <div className="relative w-[160px] h-[55px] md:w-[320px] md:h-[105px]">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain hidden dark:block" priority />
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <Button onClick={handleSave} disabled={isSaving || isUploading} className="hidden sm:flex h-12 px-6 rounded-xl font-bold gap-2 shadow-lg">{isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Salvar</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 md:h-12 px-2 gap-2 rounded-xl focus:ring-0 focus-visible:ring-0 outline-none data-[state=open]:bg-transparent shadow-none">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[120px]">{userData?.companyName}</span>
                  <span className={cn("text-[8px] uppercase tracking-widest font-black", isEnterprise ? "text-primary animate-pulse" : "text-muted-foreground")}>{isEnterprise ? 'Enterprise' : (isGoldPlan ? 'Gold' : 'Base')}</span>
                </div>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors"><User className="w-4 h-4" /></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl bg-background border">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl font-bold"><TrendingUp className="mr-2 h-4 w-4 text-primary" />Dash</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl font-bold"><Gem className="mr-2 h-4 w-4 text-primary" />Upgrade</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5 opacity-70"><Handshake className="mr-2 h-4 w-4 text-primary" /><span>Parceiros</span><Lock className="ml-auto w-3.5 h-3.5 opacity-60" /></DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl font-bold">{theme === 'light' ? <Moon className="mr-2 h-4 w-4 text-primary" /> : <Sun className="mr-2 h-4 w-4 text-primary" />}Tema</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive font-bold"><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative w-full flex-row">
        <Sheet>
          <aside className="hidden lg:flex w-80 bg-background border-r flex-col shrink-0 h-full">
            <PublicPageSettings 
              themeColor={themeColor} setThemeColor={setThemeColor} secondaryColor={secondaryColor} setSecondaryColor={setSecondaryColor}
              layout={layout} setLayout={setLayout} logoUrl={logoUrl} setLogoUrl={setLogoUrl}
              heroTitle={heroTitle} setHeroTitle={setHeroTitle} heroSubtitle={heroSubtitle} setHeroSubtitle={setHeroSubtitle}
              footerText={footerText} setFooterText={setFooterText} showLogo={showLogo} setShowLogo={setShowLogo}
              customSections={customSections} setCustomSections={setCustomSections} onFileSelect={onFileSelect}
              isUploading={isUploading} handleSave={handleSave} isSaving={isSaving} isGoldPlan={isGoldPlan}
              logoInputRef={logoInputRef} currentSlug={slugEdit} setSlugEdit={setSlugEdit}
            />
          </aside>

          <div className="flex-1 overflow-y-auto bg-muted/10 p-4 sm:p-8">
            <div className="max-w-5xl mx-auto space-y-8 pb-32">
              <div className="flex items-center justify-between">
                <SheetTrigger asChild>
                  <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors animate-pulse outline-none"><Monitor className="w-4 h-4" /> EDITAR</button>
                </SheetTrigger>
                <div className="flex items-center gap-2 bg-background border px-3 py-1 rounded-full shadow-sm">
                   <span className="text-[10px] font-bold opacity-50 uppercase">Link:</span>
                   <span className="text-[10px] font-mono font-black text-primary">/pp/{activeSlug}</span>
                </div>
              </div>

              <div className="relative bg-background rounded-[2.5rem] shadow-2xl min-h-[600px] flex flex-col overflow-hidden ring-1 ring-primary/5">
                <div className="flex-1 flex flex-col pt-24 pb-12">
                  <div className="px-8 sm:px-12 text-center space-y-6 mb-12">
                    {logoUrl && (
                      <div className="mx-auto w-20 h-20 relative"><img src={logoUrl} className="w-full h-full object-cover rounded-[2.5rem] shadow-lg border-2 border-background" alt="Logo" /></div>
                    )}
                    <div className="space-y-4">
                      <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[1.1] max-w-4xl mx-auto text-foreground" dangerouslySetInnerHTML={{ __html: heroTitle || `O que dizem sobre ${userData?.companyName}` }} />
                      {heroSubtitle && <div className="text-foreground text-sm font-bold max-w-2xl mx-auto italic leading-relaxed" dangerouslySetInnerHTML={{ __html: heroSubtitle }} />}
                    </div>
                  </div>

                  <div className="w-full mb-12">
                    {customSections.map((section: CustomSection) => (
                      <div key={section.id} className={cn("py-16 px-8 sm:px-12 text-center space-y-4 mb-12", section.variant === 'accent' ? "text-white" : (section.variant === 'dark' ? "bg-black text-white" : "bg-muted/5"))} style={{ backgroundColor: section.variant === 'accent' ? themeColor : undefined }}>
                        <div className="max-w-3xl mx-auto space-y-4">
                          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{section.title}</h2>
                          {section.subtitle && <div className="text-[11px] font-bold leading-relaxed" dangerouslySetInnerHTML={{ __html: section.subtitle }} />}
                          <p className="text-xs sm:text-sm leading-relaxed opacity-90 font-medium">{section.content}</p>
                          {section.buttonText && <div className="pt-4"><Button className={cn("h-11 px-8 rounded-xl font-bold shadow-lg", section.variant === 'accent' ? "bg-white text-black" : "")} style={{ backgroundColor: section.variant !== 'accent' ? themeColor : undefined }}>{section.buttonText} <ArrowRight className="w-4 h-4" /></Button></div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={cn(
                    "px-6 sm:px-12 w-full max-w-[1400px] mx-auto py-12 pb-32",
                    layout === 'popup' ? "max-w-sm mx-auto flex flex-col gap-12" : (
                      layout === 'mural' 
                        ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-12" 
                        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12"
                    )
                  )}>
                    {visibleTestimonialsPreview.length > 0 ? visibleTestimonialsPreview.map((t, i) => (
                      <div key={`${t.id}-${muralIndex}-${i}`} className="mb-12 break-inside-avoid">
                        <TestimonialCard t={t} themeColor={themeColor} secondaryColor={secondaryColor} index={i} muralIndex={muralIndex} />
                      </div>
                    )) : <div className="col-span-full py-12 text-center opacity-20 italic text-sm">Selecione depoimentos abaixo.</div>}
                  </div>

                  <div className="mt-auto pt-16 px-8 text-center space-y-2 opacity-50">
                    <p className="text-[9px] font-black uppercase tracking-widest">© {footerText || `${new Date().getFullYear()} ${userData?.companyName}`}</p>
                    {showLogo && <span className="text-[7px] font-black tracking-[0.2em]">POWERED BY PROOVA</span>}
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="selection" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-0 group">
                      <div className="flex items-center justify-between w-full pr-6">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-hover:text-primary transition-colors"><MessageSquare className="w-4 h-4" /> Depoimentos Aprovados ({approvedTestimonials?.length || 0})</h2>
                        <Badge variant="outline" className="text-[9px] h-5 font-black uppercase">{selectedIds.length} / {isEnterprise ? '∞' : SELECTION_LIMIT} ATIVOS</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {approvedTestimonials?.map((t: any) => {
                          const isSelected = selectedIds.includes(t.id);
                          return (
                            <div key={t.id} onClick={() => toggleSelection(t.id)} className={cn("cursor-pointer transition-all rounded-xl border-2 p-4 bg-background group", isSelected ? "border-primary bg-primary/5" : "border-transparent shadow-sm hover:border-primary/20")}>
                              <div className="flex items-start gap-3">
                                <div className={cn("mt-1 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>{isSelected && <Check className="w-2.5 h-2.5 text-white" />}</div>
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
          <SheetContent side="left" className="p-0 w-80 border-none">
            <SheetHeader className="sr-only"><SheetTitle>Configurações</SheetTitle><SheetDescription>Ajuste sua página.</SheetDescription></SheetHeader>
             <PublicPageSettings 
              themeColor={themeColor} setThemeColor={setThemeColor} secondaryColor={secondaryColor} setSecondaryColor={setSecondaryColor}
              layout={layout} setLayout={setLayout} logoUrl={logoUrl} setLogoUrl={setLogoUrl}
              heroTitle={heroTitle} setHeroTitle={setHeroTitle} heroSubtitle={heroSubtitle} setHeroSubtitle={setHeroSubtitle}
              footerText={footerText} setFooterText={setFooterText} showLogo={showLogo} setShowLogo={setShowLogo}
              customSections={customSections} setCustomSections={setCustomSections} onFileSelect={onFileSelect}
              isUploading={isUploading} handleSave={handleSave} isSaving={isSaving} isGoldPlan={isGoldPlan}
              logoInputRef={logoInputRef} currentSlug={slugEdit} setSlugEdit={setSlugEdit}
            />
          </SheetContent>
        </Sheet>
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
