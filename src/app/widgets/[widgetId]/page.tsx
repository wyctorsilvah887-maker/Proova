'use client';

import { useState, useMemo, useEffect, use, useRef } from 'react';
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
  Monitor,
  CheckCircle2,
  Upload,
  Palette,
  LayoutGrid,
  Play,
  Layout,
  Trash2,
  Globe,
  HelpCircle,
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
  Settings,
  MoreVertical,
  Lock,
  MapPin,
  Sparkles,
  Settings2,
  Handshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useDoc, useCollection, useStorage, useAuth } from '@/firebase';
import { doc, updateDoc, collection, query, where } from 'firebase/firestore';
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
import Image from 'next/image';

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

const TestimonialCard = ({ t, themeColor, secondaryColor, index = 0, muralIndex = 0 }: { t: any, themeColor: string, secondaryColor: string, index?: number, muralIndex?: number }) => {
  const side = (index + muralIndex) % 2 === 0 ? 'left' : 'right';
  
  return (
    <Card 
      key={`${t.id}-${muralIndex}`}
      className={cn(
        "bg-card shadow-lg border-none text-left overflow-hidden transition-all duration-700 p-4",
        "border-t-4 animate-in duration-700 ease-out fill-both",
        side === 'left' ? "slide-in-from-left-full fade-in" : "slide-in-from-right-full fade-in"
      )} 
      style={{ 
        borderTopColor: themeColor,
        boxShadow: `0 10px 30px -15px ${themeColor}30`,
        backgroundColor: secondaryColor && secondaryColor !== '#ffffff' ? `${secondaryColor}20` : undefined
      }}
    >
      <div className="flex flex-col space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full shrink-0" style={{ backgroundColor: secondaryColor && secondaryColor !== '#ffffff' ? `${secondaryColor}30` : `${themeColor}15` }}>
            <User className="w-4 h-4" style={{ color: themeColor }} />
          </div>
          <span className="font-bold text-foreground leading-tight truncate text-xs">{t.userName}</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: t.rating || 5 }).map((_, i) => (
            <Star key={i} className="fill-primary text-primary w-3 h-3" style={{ color: themeColor, fill: themeColor }} />
          ))}
        </div>
        {t.text && t.text !== '(Depoimento em Vídeo)' && (
          <p className="text-foreground/80 italic leading-relaxed text-xs line-clamp-4">"{t.text}"</p>
        )}
      </div>
    </Card>
  );
};

const PublicPageSettings = ({ 
  widgetName, setWidgetName,
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
  isGoldPlan
}: any) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const colors = ['#f97316', '#D4AF37', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#e11d48', '#0d9488', '#7c3aed', '#475569', '#000000', '#ffffff'];

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
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="w-full shadow-lg h-12 font-bold gap-2 text-sm">
          {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="geral" className="w-full flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-2 shrink-0">
          <TabsTrigger value="geral" className="text-xs">Visual</TabsTrigger>
          <TabsTrigger value="conteudo" className="text-xs flex items-center gap-1.5">
            Conteúdo {!isEnterprise && <Lock className="w-2.5 h-2.5 opacity-40" />}
          </TabsTrigger>
          <TabsTrigger value="design" className="text-xs">Layout</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
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
                  {isUploading ? <Loader2 className="animate-spin text-primary" /> : (logoUrl ? <img src={logoUrl} className="w-full h-full object-cover rounded-xl" /> : <Upload className="text-muted-foreground" />)}
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
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Type className="w-3 h-3 text-primary" /> Título Principal (Hero)
                    </Label>
                    <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="Ex: O que dizem sobre nós" className="text-xs" />
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subtítulo Hero</Label>
                    <Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Uma breve descrição impactante..." className="text-xs min-h-[80px]" />
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
                      {customSections.length === 0 && (
                        <p className="text-[10px] text-muted-foreground text-center py-4 italic">Nenhuma seção adicional.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Título da Seção de Depoimentos</Label>
                    <Input value={testimonialsTitle} onChange={(e) => setTestimonialsTitle(e.target.value)} placeholder="Ex: Experiência de quem confia" className="text-xs" />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Texto do Rodapé</Label>
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
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 bg-primary/5 rounded-2xl m-2 border border-primary/10 border-dashed animate-in fade-in zoom-in duration-300">
                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <Gem className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 px-2">
                    <h3 className="text-sm font-black uppercase tracking-tight">Recurso Enterprise</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                      A personalização total de textos, seções no-code ilimitadas e o modo White Label estão disponíveis apenas no plano <span className="font-bold text-primary">Enterprise</span>.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="h-9 px-6 font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg mt-2" 
                    onClick={() => router.push('/pricing')}
                  >
                    Fazer Upgrade
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="design" className="mt-0 space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome da Página (Interno)</Label>
                <Input value={widgetName} onChange={(e) => setWidgetName(e.target.value)} />
              </div>
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
                {!isGoldPlan && (
                  <p className="text-[10px] text-primary font-bold text-center bg-primary/5 p-2 rounded-lg border border-primary/10">
                    🚀 Layouts premium liberados no Período Trial e Gold
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="social" className="mt-0 space-y-6">
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
              <div className="space-y-3 pt-4 border-t opacity-60">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-3 h-3 text-primary" />
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Google Maps</Label>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-dashed text-[10px] text-muted-foreground">
                  O link do Google Maps é global e deve ser configurado diretamente no <strong>Dashboard Principal</strong> para refletir em todas as suas páginas.
                </div>
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default function PublicPageEditorPage({ params }: { params: Promise<{ widgetId: string }> }) {
  const { widgetId } = use(params);
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const storage = useStorage();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const widgetRef = useMemo(() => (db && user ? doc(db, 'users', user.uid, 'widgets', widgetId) : null), [db, user, widgetId]);
  const { data: widgetData, loading: widgetLoading } = useDoc(widgetRef);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const membershipStatus = userData?.membershipStatus;
  const isEnterprise = membershipStatus === 'enterprise';
  const isGold = membershipStatus === 'gold';
  const isTrial = membershipStatus === 'trial';
  
  const SELECTION_LIMIT = isEnterprise ? Infinity : ((isGold || isTrial) ? 50 : 10);
  const isGoldPlan = isGold || isTrial || isEnterprise;

  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'testimonials'), where('status', '==', 'approved'));
  }, [db, user]);

  const { data: approvedTestimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  const [widgetName, setWidgetName] = useState('');
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

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [muralIndex, setMuralIndex] = useState(0);
  const [baseUrl, setBaseUrl] = useState('');
  const [showAll, setShowAll] = useState(false);

  const [tempImage, setTempImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'logo' | 'cover' | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (widgetData) {
      setWidgetName(widgetData.name || '');
      setSelectedIds(widgetData.selectedTestimonialIds || []);
      setThemeColor(widgetData.themeColor || '#f97316');
      setSecondaryColor(widgetData.secondaryColor || '#ffffff');
      setLayout(widgetData.layout || 'grid');
      setLogoUrl(widgetData.logoUrl || '');
      setWhatsappEnabled(widgetData.whatsappEnabled || false);
      setWhatsappNumber(widgetData.whatsappNumber || '');
      setExternalSiteUrl(widgetData.externalSiteUrl || '');
      
      setHeroTitle(widgetData.heroTitle || '');
      setHeroSubtitle(widgetData.heroSubtitle || '');
      setTestimonialsTitle(widgetData.testimonialsTitle || '');
      setFooterText(widgetData.footerText || '');
      setShowLogo(widgetData.showLogo !== undefined ? widgetData.showLogo : true);
      setCustomSections(widgetData.customSections || []);
    }
  }, [widgetData]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if ((layout === 'mural' || layout === 'grid') && selectedIds.length > 5) {
      const interval = setInterval(() => setMuralIndex(prev => (prev + 1) % selectedIds.length), 6000);
      return () => clearInterval(interval);
    }
  }, [layout, selectedIds]);

  const publicPageLink = useMemo(() => {
    if (!baseUrl || !userData || !widgetId) return '';
    const slug = userData.companySlug || userData.companyName?.toLowerCase().replace(/\s+/g, '-') || '';
    return `${baseUrl}/pp/${slug}/${widgetId}`;
  }, [baseUrl, userData, widgetId]);

  const copyToClipboard = (text: string, description: string = "Link da Página Pública") => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${description} copiado para a área de transferência.`,
    });
  };

  const currentTestimonials = useMemo(() => {
    return approvedTestimonials?.filter(t => selectedIds.includes(t.id)) || [];
  }, [approvedTestimonials, selectedIds]);

  const visibleTestimonials = useMemo(() => {
    if (currentTestimonials.length === 0) return [];
    
    if (layout === 'mural' || layout === 'grid') {
      const slice = [];
      const count = Math.min(5, currentTestimonials.length);
      for (let i = 0; i < count; i++) {
        const idx = (muralIndex + i) % currentTestimonials.length;
        slice.push(currentTestimonials[idx]);
      }
      return slice;
    }
    
    return currentTestimonials.slice(0, 5);
  }, [currentTestimonials, muralIndex, layout]);

  const selectableTestimonials = useMemo(() => {
    if (!approvedTestimonials) return [];
    return approvedTestimonials;
  }, [approvedTestimonials]);

  const displayedTestimonialsSelection = useMemo(() => {
    return showAll ? selectableTestimonials : selectableTestimonials.slice(0, 10);
  }, [selectableTestimonials, showAll]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
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
    if (!tempImage || !cropType || !user || !storage || !croppedAreaPixels) return;
    setIsUploading(true);
    setTempImage(null);
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels, cropType);
      const extension = cropType === 'cover' ? 'png' : 'jpg';
      const storageRef = ref(storage, `users/${user.uid}/widgets/${widgetId}/${cropType}_${Date.now()}.${extension}`);
      const snapshot = await uploadBytes(storageRef, croppedBlob);
      const url = await getDownloadURL(snapshot.ref);
      if (cropType === 'logo') setLogoUrl(url);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro no processamento" });
    } finally {
      setIsUploading(false);
      setCropType(null);
    }
  };

  const handleSave = async () => {
    if (!widgetRef) return;
    setIsSaving(true);
    
    const cleanedSections = customSections.map(s => ({
      id: s.id,
      title: s.title || '',
      subtitle: s.subtitle || '',
      content: s.content || '',
      buttonText: s.buttonText || '',
      buttonUrl: s.buttonUrl || '',
      variant: s.variant || 'light'
    }));

    updateDoc(widgetRef, {
      name: (widgetName || '').trim(),
      selectedTestimonialIds: selectedIds || [],
      themeColor: themeColor || '#f97316',
      secondaryColor: secondaryColor || '#ffffff',
      layout: layout || 'grid',
      logoUrl: logoUrl || '',
      whatsappEnabled: !!whatsappEnabled,
      whatsappNumber: whatsappNumber || '',
      externalSiteUrl: externalSiteUrl || '',
      heroTitle: heroTitle || '',
      heroSubtitle: heroSubtitle || '',
      testimonialsTitle: testimonialsTitle || '',
      footerText: footerText || '',
      showLogo: showLogo !== undefined ? showLogo : true,
      customSections: cleanedSections
    }).then(() => {
      setIsSaving(false);
      toast({ title: "Alterações Salvas", description: "Sua página pública foi atualizada com sucesso." });
    }).catch((err) => {
      console.error("Save Error:", err);
      setIsSaving(false);
      toast({ variant: "destructive", title: "Erro ao Salvar", description: "Verifique sua conexão e tente novamente." });
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const isRemoving = prev.includes(id);
      if (!isRemoving && prev.length >= SELECTION_LIMIT) {
        toast({
          variant: "destructive",
          title: `Limite de Seleção`,
          description: `Seu plano atual permite até ${SELECTION_LIMIT} depoimentos ativos por página.`,
        });
        return prev;
      }
      return isRemoving ? prev.filter(i => i !== id) : [...prev, id];
    });
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const hasValidLogo = logoUrl && logoUrl.startsWith('http');

  const sidebarProps = { 
    widgetName, setWidgetName, themeColor, setThemeColor, secondaryColor, setSecondaryColor,
    whatsappEnabled, setWhatsappEnabled, whatsappNumber, setWhatsappNumber,
    externalSiteUrl, setExternalSiteUrl,
    layout, setLayout, logoUrl, setLogoUrl,
    heroTitle, setHeroTitle, heroSubtitle, setHeroSubtitle,
    testimonialsTitle, setTestimonialsTitle, footerText, setFooterText,
    showLogo, setShowLogo, customSections, setCustomSections,
    onFileSelect, isUploading, handleSave, isSaving, isEnterprise, isGoldPlan
  };

  const membershipLabel = isEnterprise ? 'Membro Enterprise' : (isGold ? 'Membro Gold' : (isTrial ? 'Período Trial' : 'Plano Base'));

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body w-full overflow-hidden text-foreground">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 sticky top-0 z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3 flex-1">
          <Sheet>
            <SheetTrigger asChild>
              <button 
                className={cn(
                  "flex flex-col items-center justify-center gap-1 group transition-all text-primary hover:text-primary/80"
                )}
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-xl transition-all bg-transparent group-hover:bg-primary/5">
                  <Monitor className="h-6 w-6" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest leading-none">Editar</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 border-none">
              <SheetHeader className="sr-only">
                <SheetTitle>Configurações da Página Pública</SheetTitle>
                <SheetDescription>Ajuste o visual e as redes sociais da sua página.</SheetDescription>
              </SheetHeader>
              <PublicPageSettings {...sidebarProps} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px] transition-transform group-hover:scale-105">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain hidden dark:block" priority />
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[120px] transition-colors group-hover:text-primary leading-tight">
                    {userData?.companyName || 'Minha Empresa'}
                  </span>
                  <span className={cn(
                    "text-[8px] uppercase tracking-widest font-black leading-tight",
                    isEnterprise ? "text-primary animate-pulse" : "text-muted-foreground"
                  )}>
                    {membershipLabel}
                  </span>
                </div>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                  <User className="w-4 h-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs font-headline font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span>Dash</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Layout className="mr-2 h-4 w-4 text-primary" />
                <span>Meus Widgets</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/private')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Inbox className="mr-2 h-4 w-4 text-primary" />
                <span>Inbox Privado</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Planos de Upgrade</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/partners')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Handshake className="mr-2 h-4 w-4 text-primary" />
                <span>Serviços de Parceiros</span>
              </DropdownMenuItem>
              
              {userData?.isAdmin && (
                <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-xl cursor-pointer font-bold py-2.5">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  <span>Administração</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="rounded-xl cursor-pointer font-bold py-2.5"
              >
                {theme === 'light' ? (
                  <Moon className="mr-2 h-4 w-4 text-primary" />
                ) : (
                  <Sun className="mr-2 h-4 w-4 text-primary" />
                )}
                <span>Alternar Tema</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-bold py-2.5">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative w-full flex-row">
        <aside className="hidden lg:flex w-80 bg-background border-r flex-col shrink-0">
          <PublicPageSettings {...sidebarProps} />
        </aside>

        <div className="flex-1 overflow-y-auto bg-muted/10 p-4 sm:p-8">
          <div className="max-w-none mx-auto space-y-8 pb-20">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link href="/dash" className="inline-block group">
                <Button variant="ghost" className="gap-2 px-0 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Voltar ao Dash</span>
                </Button>
              </Link>
              
              <div className="flex items-center gap-2 bg-background border rounded-xl p-1.5 shadow-sm max-w-md w-full">
                <div className="flex-1 px-3">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter mb-0.5">Link da Página Pública</p>
                  <Input 
                    readOnly 
                    value={publicPageLink} 
                    className="h-6 border-none bg-transparent p-0 text-[11px] font-mono focus-visible:ring-0"
                  />
                </div>
                <div className="flex gap-1 pr-1">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg"
                    onClick={() => copyToClipboard(publicPageLink, "Link da Página Pública")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg border-primary/20 text-primary"
                    asChild
                  >
                    <a href={publicPageLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Eye className="w-4 h-4" /> Preview Dinâmico (Máx. 5 Visíveis)
              </h2>
              <Button variant="link" size="sm" onClick={() => setIsTutorialOpen(true)} className="text-[10px] font-bold gap-1 text-primary p-0 h-auto">
                <Info className="w-3 h-3" /> Ver Tutorial
              </Button>
            </div>

            <div className="relative border-none shadow-2xl bg-background rounded-[2.5rem] min-h-[600px] flex flex-col overflow-hidden ring-1 ring-primary/5">
              <div className={cn("p-8 sm:p-12 space-y-12 flex-1 flex flex-col", "pt-24 pb-20")}>
                <div className="text-center space-y-6">
                  {hasValidLogo && (
                    <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 relative">
                      <img src={logoUrl} className="w-full h-full object-cover rounded-[2.5rem] shadow-xl border-background" alt="Logo" />
                    </div>
                  )}
                  <div className="space-y-4">
                    <h1 className="text-4xl sm:text-7xl font-black tracking-tighter text-foreground leading-[1.1] max-w-4xl mx-auto">
                      {heroTitle || `O que dizem sobre ${userData?.companyName}`}
                    </h1>
                    {heroSubtitle && (
                      <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto font-medium">
                        {heroSubtitle}
                      </p>
                    )}
                  </div>
                </div>

                {customSections.map((section: CustomSection) => (
                  <div 
                    key={section.id} 
                    className={cn(
                      "py-16 px-8 sm:px-12 rounded-[2rem] text-center space-y-6 border-none",
                      section.variant === 'accent' ? "text-white" : "bg-muted/10"
                    )}
                    style={{ 
                      backgroundColor: section.variant === 'accent' ? themeColor : undefined,
                      color: section.variant === 'accent' ? '#ffffff' : undefined,
                      border: section.variant === 'accent' ? 'none' : '1px solid rgba(0,0,0,0.05)'
                    }}
                  >
                    <div className="space-y-4 max-w-3xl mx-auto">
                      <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{section.title}</h2>
                      <p className="text-lg font-bold opacity-80 italic">{section.subtitle}</p>
                      <p className="text-sm sm:text-base leading-relaxed opacity-90">{section.content}</p>
                      {section.buttonText && (
                        <div className="pt-4">
                          <Button 
                            className={cn(
                              "h-12 px-8 rounded-xl font-bold gap-2 shadow-lg",
                              section.variant === 'accent' ? "bg-white text-foreground hover:bg-white/90" : ""
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

                {testimonialsTitle && (
                  <div className="pt-12 pb-4 text-center">
                    <h2 className="text-2xl font-black font-headline uppercase tracking-widest" style={{ color: themeColor }}>
                      {testimonialsTitle}
                    </h2>
                  </div>
                )}

                <div className={cn(
                  "w-full max-w-[1400px] mx-auto",
                  layout === 'popup' ? "flex justify-center" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                )}>
                  {visibleTestimonials.length > 0 ? (
                    layout === 'popup' ? (
                      <TestimonialCard t={visibleTestimonials[0]} themeColor={themeColor} secondaryColor={secondaryColor} />
                    ) : (
                      visibleTestimonials.map((t, i) => (
                        <TestimonialCard 
                          key={`${t.id}-${muralIndex}-${i}`} 
                          t={t} 
                          themeColor={themeColor} 
                          secondaryColor={secondaryColor} 
                          index={i} 
                          muralIndex={muralIndex} 
                        />
                      ))
                    )
                  ) : (
                    <div className="col-span-full py-20 text-center opacity-30 italic text-sm">Selecione depoimentos para o preview.</div>
                  )}
                </div>

                <div className="mt-auto pt-16 pb-8 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 flex items-center justify-center gap-1">
                    <span>©</span> {footerText || `${new Date().getFullYear()} ${userData?.companyName || 'Sua Empresa'}`}
                  </p>
                  {showLogo && (
                    <div className="mt-4 flex items-center justify-center gap-1.5 opacity-20">
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
                        <MessageSquare className="w-4 h-4" /> Depoimentos Disponíveis ({selectableTestimonials.length})
                      </h2>
                      <Badge variant="outline" className={cn("text-[9px] h-5 font-black uppercase px-2", selectedIds.length >= SELECTION_LIMIT && !isEnterprise ? "text-destructive border-destructive" : "text-primary border-primary/20")}>
                        {selectedIds.length} / {isEnterprise ? '∞' : SELECTION_LIMIT} SELECIONADOS
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {displayedTestimonialsSelection.map((t: any) => {
                        const isSelected = selectedIds.includes(t.id);
                        const isAtLimit = selectedIds.length >= SELECTION_LIMIT && !isEnterprise;
                        const isDisabled = !isSelected && isAtLimit;

                        return (
                          <div 
                            key={t.id} 
                            onClick={() => !isDisabled && toggleSelection(t.id)} 
                            className={cn(
                              "cursor-pointer transition-all rounded-xl border-2 p-4 bg-background relative", 
                              isSelected ? "border-primary bg-primary/5 shadow-md" : "border-transparent shadow-sm hover:border-muted-foreground/10",
                              isDisabled && "opacity-40 cursor-not-allowed grayscale"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn("mt-1 w-4 h-4 rounded-md border flex items-center justify-center shrink-0", isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-[11px] block truncate">{t.userName}</span>
                                {t.text && t.text !== '(Depoimento em Vídeo)' && (
                                  <p className="text-[10px] text-muted-foreground italic line-clamp-2 mt-1">"{t.text}"</p>
                                )}
                              </div>
                            </div>
                            {isDisabled && (
                              <div className="absolute inset-0 flex items-center justify-center bg-background/20 rounded-xl">
                                <Lock className="w-4 h-4 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {!showAll && selectableTestimonials.length > 10 && (
                        <div className="col-span-full mt-6 flex justify-center">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowAll(true)} 
                            className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5 font-bold h-11 px-8"
                          >
                            Mostrar Todos <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen}>
        <DialogContent className="rounded-[2rem] md:rounded-[2.5rem] w-[92vw] sm:w-full sm:max-w-lg border-none shadow-2xl overflow-hidden p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 md:p-10 pt-10 md:pt-14 pb-4 bg-background shrink-0">
            <DialogTitle className="text-xl md:text-2xl font-black font-headline flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-primary" /> Página Pública VIP
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm pl-8">
              Transforme seu link da bio em um canal de alta conversão.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="space-y-8 md:space-y-10 py-6 px-5 md:px-10 overflow-x-hidden">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Identidade e Estilo</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Clique no ícone de monitor para abrir o painel lateral. Use os <strong>Estilos Rápidos</strong> para aplicar um tema profissional instantaneamente. Envie seu logo para personalizar a cabeceira.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <Type className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Conteúdo Persuasivo</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Edite o <strong>Título Principal (Hero)</strong> para algo impactante. Membros Enterprise podem adicionar seções no-code ilimitadas com botões de chamada para ação (CTA).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Curadoria de Elogios</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Selecione manualmente os melhores depoimentos no painel abaixo do preview. O sistema fará um rodízio dinâmico dos seus top 5 selecionados.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Publicação e Bio</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Salve as alterações e copie a URL da página no topo. Este é o link ideal para o seu <strong>Instagram, TikTok ou WhatsApp</strong> para provar autoridade 24h por dia.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 md:p-10 pt-4 pb-8 md:pb-10 bg-background border-t shrink-0">
            <Button className="w-full font-black h-12 rounded-2xl shadow-xl" onClick={() => setIsTutorialOpen(false)}>Começar Customização</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tempImage} onOpenChange={(open) => !open && setTempImage(null)}>
        <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none">
          <DialogHeader className="p-6 bg-background border-b sr-only">
            <DialogTitle>Recortar Imagem</DialogTitle>
            <DialogDescription>Ajuste o enquadramento da sua imagem.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 relative bg-black">
            {tempImage && (
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                aspect={cropType === 'logo' ? 1 : 21 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="p-6 border-t bg-background shrink-0 space-y-6">
            <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(vals) => setZoom(vals[0])} />
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setTempImage(null)}>Cancelar</Button>
              <Button onClick={handleConfirmCrop} className="font-bold">Salvar Corte 4K</Button>
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
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), type === 'cover' ? 'image/png' : 'image/jpeg', 0.9));
}
