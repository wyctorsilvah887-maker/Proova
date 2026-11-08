
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
  ChevronRight
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
  onClose
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
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden h-8 w-8 rounded-full"><X className="w-4 h-4" /></Button>
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
            {/* Tab contents... */}
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

  if (authLoading || userDataLoading || testimonialsLoading) return <div className="flex h-screen items-center justify-center bg-muted/30"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

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
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
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
        <aside className="hidden lg:flex w-80 bg-background border-r flex-col shrink-0 h-full">
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
          />
        </aside>

        <div className="flex-1 overflow-y-auto bg-muted/10 p-4 sm:p-8">
          {/* Editor contents... */}
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
