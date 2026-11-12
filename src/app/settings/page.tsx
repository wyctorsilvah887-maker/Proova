'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Building2, 
  MapPin, 
  Globe, 
  Lock, 
  Shield, 
  Mail,
  Fingerprint,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  LogOut,
  TrendingUp,
  Layout,
  Inbox,
  Gem,
  Headphones,
  Moon,
  Sun,
  Settings,
  Briefcase,
  MapPinned,
  Sparkles,
  Zap,
  Link2,
  Info,
  AlertCircle,
  Search,
  Navigation,
  ShieldCheck,
  LayoutGrid as LayoutGridIcon,
  BarChart3,
  ImageIcon,
  X,
  Menu,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger
} from '@/components/ui/sheet';
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc, updateDoc, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoadingScreen } from '@/components/loading-screen';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { searchGooglePlaces } from '@/app/actions/maps-actions';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  // Estados dos Campos
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  
  // Estados para Busca Google
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setCompanyName(userData.companyName || '');
      setCompanySlug(userData.companySlug || '');
      setBusinessType(userData.businessType || '');
      setCity(userData.city || '');
      setState(userData.state || '');
      setGooglePlaceId(userData.googlePlaceId || '');
      setGoogleMapsUrl(userData.googleMapsUrl || '');
    }
  }, [userData]);

  const isAgency = useMemo(() => {
    return userData?.businessType === 'agencia';
  }, [userData]);

  const isPremiumUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const isMapsLinkValid = useMemo(() => {
    if (!googleMapsUrl) return false;
    const url = googleMapsUrl.toLowerCase();
    return url.includes('review') || url.includes('writereview') || url.includes('placeid');
  }, [googleMapsUrl]);
  
  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

  const handleSearchPlaces = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingPlaces(true);
    try {
      const results = await searchGooglePlaces(searchQuery, city || userData?.city, state || userData?.state);
      setSearchResults(results);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro na busca" });
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleSelectPlace = (place: any) => {
    const reviewLink = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
    setGooglePlaceId(place.place_id);
    setGoogleMapsUrl(reviewLink);
    setSearchResults([]);
    setSearchQuery('');
    toast({ 
      title: "Empresa Localizada", 
      description: "Agora clique em 'Salvar Alterações' no topo da página para confirmar o vínculo." 
    });
  };

  const handleConnectGoogle = async () => {
    if (!db || !user || isGoogleConnecting) return;
    setIsGoogleConnecting(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/business.manage');
      provider.setCustomParameters({
        access_type: 'offline',
        prompt: 'consent'
      });

      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        googleConnected: true,
        lastGoogleSync: serverTimestamp()
      });

      toast({ 
        title: "Google Conectado!", 
        description: "Sua conta agora tem permissão para gerir o Perfil da Empresa." 
      });
    } catch (error: any) {
      console.error("Erro ao conectar Google:", error);
      toast({ 
        variant: "destructive", 
        title: "Erro na Conexão", 
        description: "Não foi possível vincular sua conta Google agora." 
      });
    } finally {
      setIsGoogleConnecting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user || !db || !userData) return;
    setIsSaving(true);

    const oldSlug = userData.companySlug;
    const newSlug = companySlug.trim().toLowerCase().replace(/\s+/g, '-');
    const isSlugChanging = newSlug !== oldSlug && newSlug !== '';

    try {
      const batch = writeBatch(db);
      
      // Validação de Slug se houver mudança
      if (isSlugChanging) {
        if (!isPremiumUser) {
          throw new Error("A alteração de link personalizado está disponível apenas nos planos Gold e Enterprise.");
        }
        const slugCheck = await getDoc(doc(db, 'slugs', newSlug));
        if (slugCheck.exists()) {
          throw new Error("Este link já está sendo usado por outra empresa.");
        }
        
        // Registra novo slug e remove o antigo
        batch.set(doc(db, 'slugs', newSlug), { userId: user.uid, type: 'account', createdAt: serverTimestamp() });
        if (oldSlug) batch.delete(doc(db, 'slugs', oldSlug));
      }

      const userUpdate = {
        name: name.trim(),
        companyName: companyName.trim(),
        companySlug: newSlug || oldSlug,
        businessType,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        googlePlaceId: googlePlaceId.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        updatedAt: serverTimestamp()
      };

      batch.update(doc(db, 'users', user.uid), userUpdate);
      await batch.commit();
      
      toast({ title: "Configurações Salvas!", description: "Seu perfil foi atualizado com sucesso." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao Salvar", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  if (authLoading || userDataLoading || (user && !userData)) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
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
          <ThemeToggle className="flex border-none bg-transparent shadow-none hover:bg-transparent" />
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
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all group outline-none focus:ring-0"
                  >
                    <LayoutGridIcon className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100" />
                    <span>Dashboard</span>
                  </button>
                </div>

                <div>
                  <p className="px-3.5 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Ferramentas Proova</p>
                  {[
                    { label: 'Social Cards', href: '/social-cards', icon: ImageIcon },
                    { label: 'Moderação Inbox', href: '/private', icon: Inbox },
                    { label: 'Métricas & ROI', href: '/metrics', icon: BarChart3 },
                  ].map((item: any, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        router.push(item.href);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all group outline-none focus:ring-0"
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100" />
                        <span>{item.label}</span>
                      </div>
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
                      className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all group outline-none focus:ring-0"
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

      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto w-full pt-24 md:pt-32 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-inner shrink-0">
                <Settings className="w-6 h-6" />
              </div>
              Configurações
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Gerencie sua identidade comercial e integrações estratégicas.</p>
          </div>
          <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full md:w-auto h-14 px-10 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl bg-primary hover:bg-primary/90 text-white transition-all active:scale-95">
             {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} Salvar Alterações
          </Button>
        </header>

        <Tabs defaultValue="perfil" className="w-full">
           <TabsList className="bg-background border rounded-2xl h-auto p-1.5 gap-1 mb-8 shadow-sm flex flex-wrap md:flex-row md:h-16">
              <TabsTrigger value="perfil" className="flex-1 min-w-[90px] rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest gap-2 py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all">
                 <User className="w-3.5 h-3.5 md:w-4 md:h-4" /> Perfil
              </TabsTrigger>
              <TabsTrigger value="negocio" className="flex-1 min-w-[90px] rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest gap-2 py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all">
                 <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Negócio
              </TabsTrigger>
              <TabsTrigger value="google" className="flex-1 min-w-[90px] rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest gap-2 py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all">
                 <MapPinned className="w-3.5 h-3.5 md:w-4 md:h-4" /> Google
              </TabsTrigger>
           </TabsList>

           <TabsContent value="perfil" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-background">
                 <CardHeader className="p-6 md:p-8 pb-4">
                    <CardTitle className="text-base md:text-lg font-black uppercase tracking-tight flex items-center gap-2"><Fingerprint className="w-5 h-5 text-primary" /> Dados do Usuário</CardTitle>
                    <CardDescription className="text-xs font-medium">Informações básicas da sua conta de acesso.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-6 md:p-8 pt-4 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase ml-1 opacity-60 flex items-center gap-2">Seu Nome Completo <TooltipProvider><Tooltip><TooltipTrigger><Info className="w-3 h-3" /></TooltipTrigger><TooltipContent><p className="text-[10px] font-bold">Como você será chamado no suporte.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                          <div className="relative group">
                             <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                             <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 pl-11 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold transition-all text-sm" placeholder="Seu Nome" />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase ml-1 opacity-60">E-mail de Acesso (Não alterável)</Label>
                          <div className="relative opacity-60">
                             <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40" />
                             <Input value={userData?.email} disabled className="h-12 pl-11 rounded-xl bg-muted/40 cursor-not-allowed font-bold text-sm" />
                          </div>
                          <p className="text-[9px] text-muted-foreground italic ml-1 leading-tight">O e-mail é sua chave única e não pode ser modificado por segurança.</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-primary/5 ring-1 ring-primary/10">
                 <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
                       <div className="p-4 rounded-3xl bg-primary text-white shadow-lg shadow-primary/20 shrink-0">
                          <Shield className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-sm font-black uppercase tracking-tight">Status do Plano: <span className="text-primary">{membershipLabel}</span></p>
                          <p className="text-xs text-muted-foreground font-medium">Sua conta possui acesso {userData?.membershipStatus === 'base' ? 'limitado' : 'premium'} aos recursos estratégicos.</p>
                       </div>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/pricing')} className="w-full sm:w-auto h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm">Ver Planos e Upgrade</Button>
                 </CardContent>
              </Card>
           </TabsContent>

           <TabsContent value="negocio" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-background">
                 <CardHeader className="p-6 md:p-8 pb-4">
                    <CardTitle className="text-base md:text-lg font-black uppercase tracking-tight flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Identidade Comercial</CardTitle>
                    <CardDescription className="text-xs font-medium">Como sua empresa é vista na web e seus links oficiais.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-6 md:p-8 pt-4 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                       <div className="space-y-8">
                          <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase ml-1 opacity-60">Nome da Empresa</Label>
                             <div className="relative group">
                                <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-12 pl-11 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold transition-all text-sm" />
                             </div>
                          </div>
                          
                          <div className="space-y-3">
                             <div className="flex items-center justify-between ml-1">
                                <Label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-2">Link da Bio (Slug) <Link2 className="w-3 h-3" /></Label>
                                {!isPremiumUser && <Badge variant="secondary" className="text-[8px] font-black bg-primary/10 text-primary border-none px-1.5 h-4">PREMIUM</Badge>}
                             </div>
                             <div className={cn(
                               "flex items-center gap-1 bg-muted/20 rounded-xl px-3 border border-transparent focus-within:ring-2 focus-within:ring-primary/20 transition-all",
                               !isPremiumUser && "opacity-60 grayscale cursor-not-allowed bg-muted/40"
                             )}>
                                <span className="text-[9px] md:text-[10px] font-black opacity-40 uppercase tracking-tighter shrink-0">
                                   <span className="hidden xs:inline">useproova.online</span>/pp/
                                </span>
                                <input 
                                  disabled={!isPremiumUser}
                                  value={companySlug} 
                                  onChange={(e) => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-'))} 
                                  className="h-12 flex-1 bg-transparent border-none focus:ring-0 text-sm font-black text-primary tracking-tight min-w-0" 
                                  placeholder="nome-da-empresa"
                                />
                             </div>
                             <div className="p-4 rounded-2xl bg-muted/30 border border-muted-foreground/10 space-y-1.5 overflow-hidden">
                                <p className="text-[9px] font-black uppercase opacity-40">Visualização do Link:</p>
                                <p className="text-[10px] md:text-[11px] font-bold text-primary truncate">https://useproova.online/pp/{companySlug || 'seu-link'}</p>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-8">
                          <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase ml-1 opacity-60">Setor de Atuação</Label>
                             <Select value={businessType} onValueChange={setBusinessType}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold text-xs shadow-none">
                                   <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-primary/10">
                                   <SelectItem value="agencia" className="font-medium text-xs">🚀 Agência Digital</SelectItem>
                                   <SelectItem value="clinica_estetica" className="font-medium text-xs">✨ Clínica de Estética</SelectItem>
                                   <SelectItem value="harmonizacao" className="font-medium text-xs">💎 Harmonização Facial</SelectItem>
                                   <SelectItem value="biomedico" className="font-medium text-xs">🧬 Biomédico(a) Esteta</SelectItem>
                                   <SelectItem value="esteticista" className="font-medium text-xs">🧴 Esteticista</SelectItem>
                                   <SelectItem value="dentista" className="font-medium text-xs">🦷 Dentista (Harmonização)</SelectItem>
                                   <SelectItem value="dermatologista" className="font-medium text-xs">🏥 Dermatologista</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase ml-1 opacity-60">Cidade</Label>
                                <div className="relative group">
                                   <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                   <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-12 pl-11 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold text-xs" />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase ml-1 opacity-60">Estado (UF)</Label>
                                <Input value={state} maxLength={2} onChange={(e) => setState(e.target.value.toUpperCase())} className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-black text-xs uppercase text-center" placeholder="SP" />
                             </div>
                          </div>
                          
                          <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 rounded-2xl animate-in fade-in zoom-in duration-500 w-full overflow-hidden">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-1" />
                            <div className="flex-1 min-w-0">
                               <AlertTitle className="text-[10px] font-black uppercase tracking-tight">Aviso de Localização</AlertTitle>
                               <AlertDescription className="text-[10px] leading-relaxed font-medium block whitespace-normal break-words">
                                 Ao alterar a cidade ou estado, use a busca na aba <b>Google</b> para revincular sua empresa corretamente.
                               </AlertDescription>
                            </div>
                          </Alert>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </TabsContent>

           <TabsContent value="google" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-background">
                 <CardHeader className="p-6 md:p-8 pb-4">
                    <CardTitle className="text-base md:text-lg font-black uppercase tracking-tight flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Automação G-Boost</CardTitle>
                    <CardDescription className="text-xs font-medium">Conecte seu perfil do Google Maps para impulsionar seu SEO Local.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-6 md:p-8 pt-4 space-y-10">
                    <div className="p-6 rounded-[2rem] bg-muted/5 border-2 border-dashed border-muted-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-6 md:gap-8 relative overflow-hidden group">
                       <div className="flex items-center gap-4 text-center sm:text-left relative z-10">
                          <div className="shrink-0 p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-border/50">
                             <svg className="w-8 h-8" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                             </svg>
                          </div>
                          <div>
                             <p className="text-sm font-black uppercase tracking-tight">Vínculo com Google</p>
                             <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Permissão para gestão do GBP</p>
                          </div>
                       </div>
                       
                       {userData?.googleConnected ? (
                         <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full border border-green-500/20 animate-in zoom-in duration-500">
                            <BadgeCheck className="w-5 h-5 fill-green-500/10" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Conectado</span>
                         </div>
                       ) : (
                         <Button 
                           onClick={handleConnectGoogle} 
                           disabled={isGoogleConnecting}
                           className="w-full sm:w-auto h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] bg-foreground text-background hover:opacity-90 shadow-lg"
                         >
                            {isGoogleConnecting ? <Loader2 className="animate-spin w-4 h-4" /> : "Conectar meu Perfil Google Meu Negócio"}
                         </Button>
                       )}
                    </div>

                    <div className="p-6 rounded-[2rem] bg-primary/5 border-2 border-dashed border-primary/20 flex flex-col sm:flex-row items-center gap-6 md:gap-8 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                       <div className="shrink-0 p-5 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border-2 border-primary/10 relative z-10 transition-transform group-hover:scale-110">
                          <Image src="https://picsum.photos/seed/google-maps-saas/100/100" width={56} height={56} alt="Google Maps" className="grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" data-ai-hint="google maps logo" />
                       </div>
                       <div className="flex-1 space-y-2 text-center sm:text-left relative z-10">
                          <p className="text-base font-black uppercase tracking-tight">Vincular Localização</p>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">O G-Boost redireciona elogios 5 estrelas para o Google. Pesquise sua empresa abaixo para ativar.</p>
                       </div>
                    </div>

                    <div className="space-y-6 pt-4">
                      {googlePlaceId ? (
                        <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-center justify-between group animate-in zoom-in duration-300">
                           <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-green-500/10 text-green-600"><MapPin className="w-6 h-6" /></div>
                              <div>
                                 <p className="text-[10px] font-black uppercase text-green-600 tracking-widest leading-none mb-1">Empresa Vinculada</p>
                                 <p className="text-sm font-black uppercase tracking-tight">{userData?.companyName}</p>
                                 <p className="text-[10px] text-muted-foreground font-mono opacity-60 truncate max-w-[200px]">{googlePlaceId}</p>
                              </div>
                           </div>
                           <Button variant="ghost" onClick={() => { setGooglePlaceId(''); setGoogleMapsUrl(''); }} className="text-destructive hover:bg-destructive/10 text-[9px] font-black uppercase tracking-widest h-8 px-3 rounded-lg">Desvincular</Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <div className="relative group">
                              <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                              <Input 
                                placeholder="Digite o nome da sua empresa no Google Maps..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchPlaces()}
                                className="h-14 pl-12 pr-12 rounded-2xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold text-sm"
                              />
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={handleSearchPlaces}
                                disabled={isSearchingPlaces || !searchQuery.trim()}
                                className="absolute right-2 top-2 h-10 w-10 rounded-xl hover:bg-primary/10 text-primary"
                              >
                                {isSearchingPlaces ? <Loader2 className="animate-spin" /> : <Navigation className="w-5 h-5" />}
                              </Button>
                           </div>

                           <div className="grid gap-3">
                              {searchResults.map((place) => (
                                <Card 
                                  key={place.place_id} 
                                  className="border-2 border-transparent hover:border-primary/20 cursor-pointer transition-all bg-muted/10 group active:scale-[0.98]"
                                  onClick={() => handleSelectPlace(place)}
                                >
                                  <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4 min-w-0">
                                       <div className="p-2.5 rounded-xl bg-background group-hover:bg-primary/10 transition-colors shrink-0 shadow-sm"><MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary" /></div>
                                       <div className="min-w-0">
                                          <p className="text-xs font-black uppercase truncate">{place.name}</p>
                                          <p className="text-[10px] text-muted-foreground truncate opacity-70 font-medium">{place.address}</p>
                                       </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:translate-x-1 group-hover:opacity-100 transition-all shrink-0" />
                                  </div>
                                </Card>
                              ))}
                              {isSearchingPlaces && (
                                <div className="py-12 text-center animate-pulse">
                                   <Loader2 className="animate-spin w-8 h-8 text-primary mx-auto mb-3" />
                                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Consultando Google Satélite...</p>
                                </div>
                              )}
                           </div>
                        </div>
                      )}
                    </div>

                    <Card className="rounded-[2rem] border-none bg-muted/20 p-8">
                       <div className="flex items-start gap-6">
                          <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0"><ShieldCheck className="w-6 h-6" /></div>
                          <div className="space-y-3">
                             <h4 className="text-sm font-black uppercase tracking-widest">Protocolo de SEO Local</h4>
                             <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                A Proova automatiza a geração de autoridade. Ao selecionar sua empresa, nós vinculamos seu <b>Place ID</b> oficial, garantindo que cada elogio 5 estrelas tenha o potencial de virar uma estrela real no seu perfil do Google Business. Isso aumenta drasticamente sua relevância nas buscas locais.
                             </p>
                          </div>
                       </div>
                    </Card>
                 </CardContent>
              </Card>
           </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
