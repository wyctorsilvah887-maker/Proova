'use client';

import { useState, useMemo, useEffect } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc, updateDoc, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
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
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { searchGooglePlaces } from '@/app/actions/maps-actions';

export default function SettingsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

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
    if (status === 'enterprise') return 'ENTERPRISE';
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
      <header className="bg-background border-b h-16 md:h-24 flex items-center px-4 md:px-6 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3">
          <Link href="/dash" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[180px] h-[60px] md:w-[320px] md:h-[105px]">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-dark-mode.gif" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex border-none bg-transparent shadow-none hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:ring-0" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 md:h-14 px-1.5 md:px-3 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                <div className="flex flex-col items-end relative">
                  <span className="text-[10px] md:sm font-black truncate max-w-[120px] sm:max-w-[200px] group-hover:text-primary leading-tight uppercase tracking-tight transition-colors">
                    {userData?.companyName || 'Minha Empresa'}
                  </span>
                  <div className="flex flex-col items-end gap-0">
                    <span className={cn(
                      "text-[6px] sm:text-[8px] uppercase tracking-widest font-black leading-tight text-primary",
                      userData?.membershipStatus === 'enterprise' && "animate-pulse"
                    )}>
                      {membershipLabel}
                    </span>
                    {isMapsLinkValid && (
                      <div className="flex items-center gap-1 mt-0.5 animate-in fade-in duration-500">
                        <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[5px] md:text-[7px] font-black uppercase text-green-500 tracking-widest leading-none">G-Boost Ativo</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span>Dash</span>
              </DropdownMenuItem>
              {isAgency && (
                <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5">
                  <Layout className="mr-2 h-4 w-4 text-primary" />
                  <span>Meus Murais</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push('/private')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Inbox className="mr-2 h-4 w-4 text-primary" />
                <span>Inbox Privado</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/support')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Headphones className="mr-2 h-4 w-4 text-primary" />
                <span>Suporte Proova</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Upgrade</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl cursor-pointer font-bold py-2.5">{theme === 'light' ? <Moon className="mr-2 h-4 w-4 text-primary" /> : <Sun className="mr-2 h-4 w-4 text-primary" />}<span>Tema</span></DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-pointer font-bold py-2.5"><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto w-full pt-20 md:pt-32 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
             <Link href="/dash" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group w-fit">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-[10px] font-black uppercase tracking-widest">Voltar ao Painel</span>
             </Link>
             <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-inner shrink-0">
                    <Settings className="w-6 h-6" />
                  </div>
                  Configurações
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">Gerencie sua identidade comercial e integrações estratégicas.</p>
             </div>
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
                    <div className="p-6 rounded-[2rem] bg-primary/5 border-2 border-dashed border-primary/20 flex flex-col sm:flex-row items-center gap-6 md:gap-8 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                       <div className="shrink-0 p-5 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border-2 border-primary/10 relative z-10 transition-transform group-hover:scale-110">
                          <Image src="https://picsum.photos/seed/google-maps-saas/100/100" width={56} height={56} alt="Google Maps" className="grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" data-ai-hint="google maps logo" />
                       </div>
                       <div className="flex-1 space-y-2 text-center sm:text-left relative z-10">
                          <p className="text-base font-black uppercase tracking-tight">Vincular Empresa</p>
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
