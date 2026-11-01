'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Star, 
  Eye,
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
  Link2,
  Copy,
  ExternalLink,
  ChevronDown,
  LogOut,
  TrendingUp,
  Inbox,
  Gem,
  Shield,
  Sun,
  Moon,
  Type,
  Plus,
  ArrowRight,
  Lock,
  Sparkles,
  Settings2,
  Handshake,
  X,
  Pipette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useDoc, useCollection, useStorage, useAuth } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDocs, limit, serverTimestamp, setDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

type LayoutType = 'mural' | 'carousel' | 'grid' | 'popup';

interface CustomSection {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  buttonText: string;
  buttonUrl: string;
  variant: 'light' | 'dark' | 'accent';
}

/**
 * RichTextEditor - Editor de texto rico com seletor RGB e estabilidade de cursor para mobile.
 */
const RichTextEditor = ({ value, onChange, placeholder, themeColor }: { value: string, onChange: (val: string) => void, placeholder?: string, themeColor: string }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const lastHtml = useRef(value);

  useEffect(() => {
    if (editorRef.current && !isFocused && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
      lastHtml.current = value;
    }
  }, [value, isFocused]);

  const handleSelection = () => {
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
      const newHtml = editorRef.current.innerHTML;
      lastHtml.current = newHtml;
      onChange(newHtml);
    }
  };

  const clearFormat = () => {
    document.execCommand('removeFormat');
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      lastHtml.current = newHtml;
      onChange(newHtml);
    }
  };

  const handleInput = (e: any) => {
    const newHtml = e.currentTarget.innerHTML;
    lastHtml.current = newHtml;
    onChange(newHtml);
  };

  return (
    <div className="relative group">
      <input 
        type="color" 
        ref={colorInputRef} 
        className="sr-only" 
        onChange={(e) => applyColor(e.target.value)} 
      />
      
      {showToolbar && (
        <div 
          className="fixed z-[999] flex items-center gap-2 p-2 bg-zinc-900 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl -translate-x-1/2 animate-in fade-in zoom-in duration-200"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
          <button 
            title="Escolher Cor RGB"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-primary transition-all group"
            onMouseDown={(e) => {
              e.preventDefault();
              colorInputRef.current?.click();
            }}
          >
            <Pipette className="w-5 h-5 text-white group-hover:text-black" />
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-1" />
          
          <button 
             className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
             onMouseDown={(e) => {
                e.preventDefault();
                clearFormat();
             }}
          >
            Limpar
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'text' } as any}
        onContextMenu={(e) => {
          const selection = window.getSelection();
          if (selection && selection.toString().length > 0) {
            e.preventDefault();
          }
        }}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          setShowToolbar(false);
        }}
        onSelect={handleSelection}
        className="min-h-[100px] p-6 rounded-[1.5rem] bg-muted/20 border-2 border-transparent focus:border-primary/30 outline-none text-sm font-bold leading-relaxed transition-all cursor-text shadow-inner"
      />
      
      {!value && !isFocused && (
        <p className="absolute top-6 left-6 text-muted-foreground opacity-40 pointer-events-none text-sm font-medium italic">
          {placeholder || 'Digite algo...'}
        </p>
      )}
    </div>
  );
};

const TestimonialCard = ({ t, themeColor, secondaryColor, index = 0, muralIndex = 0 }: { t: any, themeColor: string, secondaryColor: string, index?: number, muralIndex?: number }) => {
  const side = (index + muralIndex) % 2 === 0 ? 'left' : 'right';
  
  return (
    <Card 
      key={`${t.id}-${muralIndex}`}
      className={cn(
        "bg-card rounded-xl p-6 shadow-sm animate-in duration-700 ease-out fill-both",
        side === 'left' ? "slide-in-from-left-full fade-in" : "slide-in-from-right-full fade-in"
      )}
      style={{ 
        borderTopWidth: '4px',
        borderTopColor: themeColor,
        backgroundColor: secondaryColor && secondaryColor !== '#ffffff' ? `${secondaryColor}20` : undefined,
        boxShadow: `0 10px 30px -15px ${themeColor}30`
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full shrink-0" style={{ backgroundColor: secondaryColor && secondaryColor !== '#ffffff' ? `${secondaryColor}30` : `${themeColor}15` }}>
            <User className="w-4 h-4" style={{ color: themeColor }} />
          </div>
          <span className="font-bold text-sm text-foreground">{t.userName}</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: t.rating || 5 }).map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-current" style={{ color: themeColor }} />
          ))}
        </div>
        {t.text && t.text !== '(Depoimento em Vídeo)' && (
          <p className="text-foreground/80 italic text-sm leading-relaxed">"{t.text}"</p>
        )}
      </div>
    </Card>
  );
};

const PublicPageSettings = ({ 
  themeColor, setThemeColor,
  secondaryColor, setSecondaryColor,
  whatsappEnabled, setWhatsappEnabled,
  whatsappNumber, setWhatsappNumber,
  externalSiteUrl, setExternalSiteUrl,
  layout, setLayout,
  logoUrl, setLogoUrl,
  heroTitle, setHeroTitle,
  heroSubtitle, setHeroSubtitle,
  testimonialsTitle, setTestimonialsTitle,
  footerText, setFooterText,
  showLogo, setShowLogo,
  customSections, setCustomSections,
  onFileSelect,
  isUploading,
  handleSave,
  isSaving,
  isEnterprise,
  isGoldPlan,
  logoInputRef,
  currentSlug, setSlugEdit
}: any) => {
  const colors = Array.from(new Set(['#f97316', '#D4AF37', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#e11d48', '#0d9488', '#7c3aed', '#475569', '#000000', '#ffffff']));

  const presets = [
    { name: 'Classic', primary: '#f97316', secondary: '#ffffff' },
    { name: 'Midnight', primary: '#D4AF37', secondary: '#000000' },
    { name: 'Ocean', primary: '#3b82f6', secondary: '#f8fafc' },
    { name: 'Forest', primary: '#10b981', secondary: '#064e3b' },
  ];

  const applyPreset = (p: any) => {
    setThemeColor(p.primary);
    if (isGoldPlan) {
      setSecondaryColor(p.secondary);
    }
    toast({ title: `Tema ${p.name} aplicado!` });
  };

  const addSection = () => {
    const newSection: CustomSection = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Nova Seção de Destaque',
      subtitle: 'Chamada secundária persuasiva',
      content: 'Conte aqui um pouco mais sobre seu diferencial ou uma oferta especial para seu cliente.',
      buttonText: 'Saiba Mais',
      buttonUrl: '',
      variant: 'light'
    };
    setCustomSections([...customSections, newSection]);
  };

  const removeSection = (id: string) => {
    setCustomSections(customSections.filter((s: CustomSection) => s.id !== id));
  };

  const updateSection = (id: string, field: keyof CustomSection, value: string) => {
    setCustomSections(customSections.map((s: CustomSection) => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-background">
      <div className="p-4 border-b bg-muted/10 shrink-0 space-y-4">
        <Link href="/dash" className="w-full">
          <Button variant="ghost" className="w-full justify-start gap-3 h-10 px-2 group">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Voltar ao Dash</span>
          </Button>
        </Link>
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="w-full shadow-lg h-12 rounded-xl font-bold gap-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground">
          {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          Salvar Página Pública
        </Button>
      </div>

      <Tabs defaultValue="geral" className="w-full flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-2 shrink-0">
          <TabsTrigger value="geral" className="text-xs">Visual</TabsTrigger>
          <TabsTrigger value="conteudo" className="text-xs flex items-center gap-1.5">
            Conteúdo {!isEnterprise && <Lock className="w-2.5 h-2.5 opacity-40" />}
          </TabsTrigger>
          <TabsTrigger value="design" className="text-xs">Layout</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Identidade</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-8 pb-10">
            <TabsContent value="geral" className="mt-0 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Logotipo Empresa</Label>
                  {logoUrl && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setLogoUrl('')}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div 
                  onClick={() => !isUploading && logoInputRef.current?.click()}
                  className="aspect-square w-24 border-2 border-dashed rounded-2xl flex items-center justify-center bg-muted/20 overflow-hidden relative group mx-auto cursor-pointer"
                >
                  {isUploading ? <Loader2 className="animate-spin text-primary" /> : (logoUrl ? <img src={logoUrl} className="w-full h-full object-cover rounded-xl" alt="Logo" /> : <Upload className="text-muted-foreground" />)}
                </div>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => onFileSelect(e, 'logo')} />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" /> Estilos Rápidos (Presets)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((p) => (
                    <Button 
                      key={p.name}
                      variant="outline"
                      className="h-10 text-[10px] font-black uppercase tracking-widest rounded-xl border-muted-foreground/10 hover:border-primary transition-all p-0 overflow-hidden relative group"
                      onClick={() => applyPreset(p)}
                    >
                      <div className="absolute inset-0 flex">
                        <div className="flex-1" style={{ backgroundColor: p.primary }} />
                        <div className="flex-1" style={{ backgroundColor: p.secondary }} />
                      </div>
                      <span className="relative z-10 bg-background/80 px-2 py-0.5 rounded-full shadow-sm border border-border group-hover:bg-background transition-colors">{p.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Palette className="w-3 h-3 text-primary" /> Cor Principal
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button key={color} onClick={() => setThemeColor(color)} className={cn("w-7 h-7 rounded-full border-2 transition-transform", themeColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-80 shadow-inner")} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t">
                <div className={cn("space-y-4", !isGoldPlan && "opacity-40 grayscale pointer-events-none")}>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Palette className="w-3 h-3 text-primary" /> Cor Secundária (Gold)
                    {!isGoldPlan && <Lock className="w-2.5 h-2.5" />}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button key={color} onClick={() => setSecondaryColor(color)} className={cn("w-7 h-7 rounded-full border-2 transition-transform", secondaryColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-80 shadow-inner")} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conteudo" className="mt-0">
              {isEnterprise ? (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Type className="w-3 h-3 text-primary" /> Título Principal (Hero)
                    </Label>
                    <RichTextEditor value={heroTitle} onChange={setHeroTitle} themeColor={themeColor} placeholder="Ex: O que dizem sobre nós..." />
                    <p className="text-[9px] text-primary font-bold italic bg-primary/5 p-2 rounded-lg border border-primary/10">
                      💡 Selecione o texto para ativar o seletor de cores RGB.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subtítulo Hero</Label>
                    <RichTextEditor value={heroSubtitle} onChange={setHeroSubtitle} themeColor={themeColor} placeholder="Uma breve descrição impactante..." />
                  </div>

                  <div className="space-y-6 pt-6 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Seções Adicionais</Label>
                      <Button variant="outline" size="sm" onClick={addSection} className="h-7 text-[10px] font-black uppercase gap-1 rounded-lg">
                        <Plus className="w-3 h-3" /> Adicionar
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {customSections.map((section: CustomSection, idx: number) => (
                        <Card key={section.id} className="border shadow-sm overflow-hidden bg-muted/5">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="item-1" className="border-none">
                              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/10">
                                 <AccordionTrigger className="hover:no-underline py-0 flex-1">
                                   <span className="text-[10px] font-black uppercase truncate pr-2">{section.title || `Seção ${idx + 1}`}</span>
                                 </AccordionTrigger>
                                 <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeSection(section.id)}>
                                   <Trash2 className="w-3.5 h-3.5" />
                                 </Button>
                              </div>
                              <AccordionContent className="p-3 space-y-3 pb-4">
                                <div className="space-y-1.5">
                                  <Label className="text-[9px] font-bold uppercase opacity-50">Título</Label>
                                  <Input value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} className="h-8 text-[11px]" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[9px] font-bold uppercase opacity-50">Subtítulo</Label>
                                  <Input value={section.subtitle} onChange={(e) => updateSection(section.id, 'subtitle', e.target.value)} className="h-8 text-[11px]" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[9px] font-bold uppercase opacity-50">Texto do Bloco</Label>
                                  <Textarea value={section.content} onChange={(e) => updateSection(section.id, 'content', e.target.value)} className="text-[11px] min-h-[60px]" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-bold uppercase opacity-50">Texto Botão</Label>
                                    <Input value={section.buttonText} onChange={(e) => updateSection(section.id, 'buttonText', e.target.value)} className="h-8 text-[11px]" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-bold uppercase opacity-50">Link Botão</Label>
                                    <Input value={section.buttonUrl} onChange={(e) => updateSection(section.id, 'buttonUrl', e.target.value)} className="h-8 text-[11px]" />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[9px] font-bold uppercase opacity-50">Estilo do Bloco</Label>
                                  <Select value={section.variant} onValueChange={(val) => updateSection(section.id, 'variant', val as any)}>
                                    <SelectTrigger className="h-8 text-[11px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="light">Fundo Claro</SelectItem>
                                      <SelectItem value="dark">Fundo Escuro</SelectItem>
                                      <SelectItem value="accent">Fundo Marca</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Título da Seção de Depoimentos</Label>
                    <Input value={testimonialsTitle} onChange={(e) => setTestimonialsTitle(e.target.value)} placeholder="Ex: Experiência de quem confia" className="text-xs" />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rodapé Copyright</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground select-none">©</span>
                      <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="2026 Sua Empresa" className="text-xs pl-7 h-10" />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                     <div className="flex items-center justify-between p-3 bg-muted/10 rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-[11px] font-bold">Exibir Marca Proova</Label>
                        <p className="text-[9px] text-muted-foreground">Ativar rodapé "Powered by Proova"</p>
                      </div>
                      <Switch checked={showLogo} onCheckedChange={setShowLogo} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 bg-primary/5 rounded-2xl m-2 border border-primary/10 border-dashed">
                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <Gem className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 px-2">
                    <h3 className="text-sm font-black uppercase tracking-tight">Recurso Enterprise</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                      A personalização total de textos e seções ilimitadas estão disponíveis apenas no plano <span className="font-bold text-primary">Enterprise</span>.
                    </p>
                  </div>
                  <Button size="sm" className="h-9 px-6 font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg" onClick={() => router.push('/pricing')}>Fazer Upgrade</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="design" className="mt-0 space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estilo de Exibição</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'grid', icon: Layout, label: 'Grade Estática', isGold: false },
                    { id: 'mural', icon: LayoutGrid, label: 'Mural Masonry', isGold: true },
                    { id: 'carousel', icon: Play, label: 'Carrossel Dinâmico', isGold: true },
                    { id: 'popup', icon: MessageSquare, label: 'Notificação', isGold: true },
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
            </TabsContent>

            <TabsContent value="social" className="mt-0 space-y-6">
              <div className="space-y-6 p-4 border rounded-xl bg-muted/5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Endereço da Página (Slug)
                  </Label>
                  <div className="flex items-center gap-1 bg-background rounded-lg px-3 border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <span className="text-[10px] font-bold opacity-40">/pp/</span>
                    <input 
                      placeholder="seu-link-unico"
                      value={currentSlug} 
                      onChange={(e) => setSlugEdit(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-'))} 
                      className="h-10 flex-1 bg-transparent border-none focus:ring-0 text-xs font-mono font-bold"
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground italic">Este é o link que você usará no seu Instagram.</p>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-xl bg-muted/5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Botão WhatsApp</Label>
                  <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
                </div>
                {whatsappEnabled && (
                  <Input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="Número WhatsApp" className="h-10" />
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">URL do Site Oficial</Label>
                <Input value={externalSiteUrl} onChange={(e) => setExternalSiteUrl(e.target.value)} placeholder="https://seusite.com.br" />
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

  const membershipStatus = userData?.membershipStatus;
  const isEnterprise = membershipStatus === 'enterprise';
  const isGoldPlan = isEnterprise || membershipStatus === 'gold' || membershipStatus === 'trial';
  const SELECTION_LIMIT = isEnterprise ? Infinity : (isGoldPlan ? 50 : 10);

  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'testimonials'), where('status', '==', 'approved'));
  }, [db, user]);

  const { data: approvedTestimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [themeColor, setThemeColor] = useState('#f97316');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [layout, setLayout] = useState<LayoutType>('grid'); 
  const [logoUrl, setLogoUrl] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [externalSiteUrl, setExternalSiteUrl] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [testimonialsTitle, setTestimonialsTitle] = useState('');
  const [footerText, setFooterText] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [slugEdit, setSlugEdit] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [muralIndex, setMuralIndex] = useState(0);
  const [baseUrl, setBaseUrl] = useState('');

  const [tempImage, setTempImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'logo' | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
  }, []);

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
      setSecondaryColor(ppData.secondaryColor || '#ffffff');
      setLayout(ppData.layout || 'grid');
      setLogoUrl(ppData.logoUrl || '');
      setWhatsappEnabled(ppData.whatsappEnabled || false);
      setWhatsappNumber(ppData.whatsappNumber || '');
      setExternalSiteUrl(ppData.externalSiteUrl || '');
      setHeroTitle(ppData.heroTitle || '');
      setHeroSubtitle(ppData.heroSubtitle || '');
      setTestimonialsTitle(ppData.testimonialsTitle || '');
      setFooterText(ppData.footerText || '');
      setShowLogo(ppData.showLogo !== undefined ? ppData.showLogo : true);
      setCustomSections(ppData.customSections || []);
    } else if (!ppLoading && activeSlug && user && db) {
      const tryInitPP = async () => {
        const widgetsRef = collection(db, 'users', user.uid, 'widgets');
        const snap = await getDocs(query(widgetsRef, limit(1)));
        const baseData = !snap.empty ? snap.docs[0].data() : {};
        
        await setDoc(doc(db, 'users', user.uid, 'pp', activeSlug), {
          ...baseData,
          createdAt: serverTimestamp()
        }, { merge: true });
      };
      tryInitPP();
    }
  }, [ppData, ppLoading, activeSlug, user, db]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if ((layout === 'mural' || layout === 'grid') && selectedIds.length > 5) {
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
        if (!newSlug) throw new Error("O link da página não pode ser vazio.");
        
        const slugCheck = await getDoc(doc(db, 'slugs', newSlug));
        if (slugCheck.exists()) {
          throw new Error("Este link já está sendo utilizado por outro usuário.");
        }

        batch.set(doc(db, 'slugs', newSlug), {
          userId: user.uid,
          type: 'pp',
          createdAt: serverTimestamp()
        });

        if (oldSlug) {
          batch.delete(doc(db, 'slugs', oldSlug));
          batch.delete(doc(db, 'users', user.uid, 'pp', oldSlug));
        }

        batch.update(doc(db, 'users', user.uid), { companySlug: newSlug });
      }

      const targetSlug = isSlugChanging ? newSlug : oldSlug;
      const targetPPRef = doc(db, 'users', user.uid, 'pp', targetSlug);

      const configData = {
        selectedTestimonialIds: selectedIds,
        themeColor,
        secondaryColor,
        layout,
        logoUrl,
        whatsappEnabled,
        whatsappNumber,
        externalSiteUrl,
        heroTitle,
        heroSubtitle,
        testimonialsTitle,
        footerText,
        showLogo,
        customSections,
        updatedAt: serverTimestamp()
      };

      batch.set(targetPPRef, configData, { merge: true });

      await batch.commit();
      
      if (isSlugChanging) {
        setActiveSlug(newSlug);
        toast({ title: "Link Atualizado!", description: `Sua nova página é /pp/${newSlug}` });
      } else {
        toast({ title: "Página Pública Salva!" });
      }
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
    reader.addEventListener('load', () => {
      setTempImage(reader.result as string);
      setCropType(type);
    });
    reader.readAsDataURL(file);
  };

  const handleConfirmCrop = async () => {
    if (!tempImage || !cropType || !user || !storage || !croppedAreaPixels || !activeSlug) return;
    setIsUploading(true);
    setTempImage(null);
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels, cropType);
      const storageRef = ref(storage, `users/${user.uid}/pp/${activeSlug}/${cropType}_${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, croppedBlob);
      const url = await getDownloadURL(snapshot.ref);
      setLogoUrl(url);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro no processamento" });
    } finally {
      setIsUploading(false);
      setCropType(null);
    }
  };

  if (authLoading || ppLoading || userDataLoading || testimonialsLoading || !activeSlug) {
    return <div className="flex h-screen items-center justify-center bg-muted/30"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  const sidebarProps = { 
    themeColor, setThemeColor, secondaryColor, setSecondaryColor,
    whatsappEnabled, setWhatsappEnabled, whatsappNumber, setWhatsappNumber,
    externalSiteUrl, setExternalSiteUrl, layout, setLayout, logoUrl, setLogoUrl,
    heroTitle, setHeroTitle, heroSubtitle, setHeroSubtitle,
    testimonialsTitle, setTestimonialsTitle, footerText, setFooterText,
    showLogo, setShowLogo, customSections, setCustomSections,
    onFileSelect, isUploading, handleSave, isSaving, isEnterprise, isGoldPlan, logoInputRef,
    currentSlug: slugEdit, setSlugEdit
  };

  const visibleTestimonialsPreview = approvedTestimonials?.filter(t => selectedIds.includes(t.id)).slice(0, 5) || [];

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const isRemoving = prev.includes(id);
      if (!isRemoving && prev.length >= SELECTION_LIMIT) {
        toast({
          variant: "destructive",
          title: `Limite de Seleção`,
          description: `Seu plano atual permite até ${SELECTION_LIMIT} depoimentos ativos por mural.`,
        });
        return prev;
      }
      return isRemoving ? prev.filter(i => i !== id) : [...prev, id];
    });
  };

  const copyToClipboardFunc = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body w-full overflow-hidden text-foreground">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 sticky top-0 z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3 flex-1">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 group transition-all text-primary hover:text-primary/80">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl transition-all bg-transparent group-hover:bg-primary/5">
                  <Monitor className="h-6 w-6" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest leading-none">EDITAR</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 border-none">
              <SheetHeader className="sr-only">
                <SheetTitle>Configurações da Página Pública</SheetTitle>
              </SheetHeader>
              <PublicPageSettings {...sidebarProps} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px]">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain hidden dark:block" priority />
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Button onClick={handleSave} disabled={isSaving || isUploading} className="hidden sm:flex h-12 px-6 rounded-xl font-bold gap-2 shadow-lg">
            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Salvar Página
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl border h-10 w-10"><User className="w-5 h-5 text-primary" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl">
               <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl font-bold py-2.5"><TrendingUp className="mr-2 h-4 w-4 text-primary" />Dash</DropdownMenuItem>
               <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive font-bold py-2.5"><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative w-full flex-row">
        <aside className="hidden lg:flex w-80 bg-background border-r flex-col shrink-0">
          <PublicPageSettings {...sidebarProps} />
        </aside>

        <div className="flex-1 overflow-y-auto bg-muted/10 p-4 sm:p-8">
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Eye className="w-4 h-4" /> Preview da Página Pública
              </h2>
              <div className="flex items-center gap-2 bg-background border px-3 py-1 rounded-full shadow-sm">
                 <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Link:</span>
                 <span className="text-[10px] font-mono font-black text-primary">/pp/{activeSlug}</span>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboardFunc(`${baseUrl}/pp/${activeSlug}`)}>
                   <Copy className="w-3 h-3" />
                 </Button>
              </div>
            </div>

            <div className="relative bg-background rounded-[2.5rem] shadow-2xl min-h-[600px] flex flex-col overflow-hidden border border-primary/5">
              <div className="flex-1 flex flex-col pt-24 pb-12">
                <div className="px-8 sm:px-12 text-center space-y-6 mb-12">
                  {logoUrl && (
                    <div className="mx-auto w-24 h-24 relative">
                      <img src={logoUrl} className="w-full h-full object-cover rounded-[2rem] shadow-lg border-2 border-background" alt="Logo" />
                    </div>
                  )}
                  <div className="space-y-4">
                    <h1 
                      className="text-4xl sm:text-6xl font-black tracking-tighter leading-[1.1] max-w-4xl mx-auto text-foreground"
                      dangerouslySetInnerHTML={{ __html: heroTitle || `O que dizem sobre ${userData?.companyName}` }}
                    />
                    {heroSubtitle && (
                      <div 
                        className="text-foreground text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed italic"
                        dangerouslySetInnerHTML={{ __html: heroSubtitle }}
                      />
                    )}
                  </div>
                </div>

                <div className="w-full space-y-0">
                  {customSections.map((section: CustomSection) => (
                    <div 
                      key={section.id} 
                      className={cn(
                        "py-16 px-8 sm:px-12 text-center space-y-6",
                        section.variant === 'accent' ? "text-white" : (section.variant === 'dark' ? "bg-black text-white" : "bg-muted/5")
                      )}
                      style={{ backgroundColor: section.variant === 'accent' ? themeColor : undefined }}
                    >
                      <div className="max-w-3xl mx-auto space-y-4">
                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{section.title}</h2>
                        {section.subtitle && <p className="text-sm font-bold italic">{section.subtitle}</p>}
                        <p className="text-xs sm:text-sm leading-relaxed opacity-90 font-medium">{section.content}</p>
                        {section.buttonText && (
                          <div className="pt-4">
                            <Button 
                              size="lg" 
                              className={cn(
                                "h-12 px-8 rounded-xl font-bold gap-2 shadow-lg",
                                section.variant === 'accent' ? "bg-white text-black hover:bg-white/90" : ""
                              )}
                              style={{ backgroundColor: section.variant !== 'accent' ? themeColor : undefined }}
                            >
                              {section.buttonText} <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {testimonialsTitle && (
                  <div className="text-center py-12">
                    <h2 className="text-2xl sm:text-3xl font-black font-headline uppercase tracking-widest" style={{ color: themeColor }}>
                      {testimonialsTitle}
                    </h2>
                  </div>
                )}

                <div className={cn(
                  "px-8 sm:px-12 w-full max-w-5xl mx-auto",
                  layout === 'popup' ? "max-w-sm mx-auto" : (layout === 'grid' || layout === 'mural' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex justify-center")
                )}>
                  {visibleTestimonialsPreview.length > 0 ? (
                    layout === 'popup' ? (
                      <TestimonialCard t={visibleTestimonialsPreview[0]} themeColor={themeColor} secondaryColor={secondaryColor} />
                    ) : (
                      visibleTestimonialsPreview.map((t, i) => (
                        <TestimonialCard key={`${t.id}-${muralIndex}-${i}`} t={t} themeColor={themeColor} secondaryColor={secondaryColor} index={i} muralIndex={muralIndex} />
                      ))
                    )
                  ) : (
                    <div className="col-span-full py-12 text-center opacity-20 italic text-sm">
                      Selecione depoimentos abaixo para o preview.
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-16 px-8 text-center space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 flex items-center justify-center gap-1">
                    <span>©</span> {footerText || `${new Date().getFullYear()} ${userData?.companyName || 'Sua Empresa'}`}
                  </p>
                  {showLogo && (
                    <div className="flex items-center justify-center gap-1.5 opacity-20">
                      <span className="text-[8px] font-black uppercase tracking-[0.3em]">POWERED BY PROOVA</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-12 border-t">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="selection" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-0 group">
                    <div className="flex items-center justify-between w-full pr-6">
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                        <MessageSquare className="w-4 h-4" /> Depoimentos Aprovados ({approvedTestimonials?.length || 0})
                      </h2>
                      <Badge variant="outline" className="text-[9px] h-5 font-black uppercase">
                        {selectedIds.length} / {isEnterprise ? '∞' : SELECTION_LIMIT} SELECIONADOS
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {approvedTestimonials?.map((t: any) => {
                        const isSelected = selectedIds.includes(t.id);
                        return (
                          <div 
                            key={t.id} 
                            onClick={() => toggleSelection(t.id)} 
                            className={cn(
                              "cursor-pointer transition-all rounded-xl border-2 p-4 bg-background", 
                              isSelected ? "border-primary bg-primary/5" : "border-transparent shadow-sm hover:border-muted-foreground/10"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn("mt-1 w-4 h-4 rounded-md border flex items-center justify-center shrink-0", isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/30")}>
                                {isSelected && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-[11px] block truncate">{t.userName}</span>
                                {t.text && t.text !== '(Depoimento em Vídeo)' && (
                                  <p className="text-[10px] text-muted-foreground italic line-clamp-1 mt-1">"{t.text}"</p>
                                )}
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

      <Dialog open={!!tempImage} onOpenChange={(open) => !open && setTempImage(null)}>
        <DialogContent className="sm:max-w-2xl h-[70vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none">
          <div className="flex-1 relative bg-black">
            {tempImage && (
              <Cropper image={tempImage} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={(a, p) => setCroppedAreaPixels(p)} onZoomChange={setZoom} />
            )}
          </div>
          <div className="p-6 border-t bg-background shrink-0 space-y-6">
            <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(vals) => setZoom(vals[0])} />
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setTempImage(null)}>Cancelar</Button>
              <Button onClick={handleConfirmCrop} className="font-bold">Salvar Logotipo</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function getCroppedImg(imageSrc: string, pixelCrop: any, type: string): Promise<Blob> {
  const image = new (window as any).Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error();
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9));
}
