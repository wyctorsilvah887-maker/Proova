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
  AlertCircle
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

  const isPremiumUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const isMapsLinkValid = !!userData?.googleMapsUrl;
  
  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'ENTERPRISE';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

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
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/dash">
            <Button variant="ghost" size="sm" className="h-10 px-2 gap-2 text-muted-foreground hover:text-primary hover:bg-transparent active:bg-primary/10 transition-all border-none shadow-none bg-transparent rounded-xl">
               <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Voltar</span>
            </Button>
          </Link>
          <div className="flex items-center group -ml-2">
            <div className="relative w-[180px] h-[60px] md:w-[320px] md:h-[105px]">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-dark-mode.gif" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-1 md:px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[120px] group-hover:text-primary leading-tight">
                    {userData?.companyName || 'Minha Empresa'}
                  </span>
                  <div className="flex flex-col items-end gap-0">
                    <span className={cn(
                      "text-[7px] sm:text-[8px] uppercase tracking-widest font-black leading-tight",
                      userData?.membershipStatus === 'enterprise' ? "text-primary animate-pulse" : "text-muted-foreground"
                    )}>
                      {membershipLabel}
                    </span>
                    {isMapsLinkValid && <span className="text-[5px] sm:text-[6px] font-black uppercase text-green-500 tracking-tighter leading-none">G-Boost Ativo</span>}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors"><User className="w-4 h-4" /></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span>Dash</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Layout className="mr-2 h-4 w-4 text-primary" />
                <span>Meus Murais</span>
              </DropdownMenuItem>
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

      <main className="flex-1 p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full pt-24 md:pt-36 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
             <Link href="/dash" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group w-fit">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-[10px] font-black uppercase tracking-widest">Voltar ao Painel</span>
             </Link>
             <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-inner">
                    <Settings className="w-6 h-6" />
                  </div>
                  Configurações
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">Gerencie sua identidade comercial e integrações estratégicas.</p>
             </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={isSaving} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl bg-primary hover:bg-primary/90 text-white transition-all active:scale-95">
             {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} Salvar Alterações
          </Button>
        </header>

        <Tabs defaultValue="perfil" className="w-full">
           <TabsList className="bg-background border rounded-2xl h-16 p-1.5 gap-2 mb-10 shadow-sm">
              <TabsTrigger value="perfil" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all">
                 <User className="w-4 h-4" /> Perfil
              </TabsTrigger>
              <TabsTrigger value="negocio" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all">
                 <Building2 className="w-4 h-4" /> Negócio
              </TabsTrigger>
              <TabsTrigger value="google" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all">
                 <MapPinned className="w-4 h-4" /> Google G-Boost
              </TabsTrigger>
           </TabsList>

           <TabsContent value="perfil" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-background">
                 <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Fingerprint className="w-5 h-5 text-primary" /> Dados do Usuário</CardTitle>
                    <CardDescription className="text-xs font-medium">Informações básicas da sua conta de acesso.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-8 pt-4 space-y-6">
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase ml-1 opacity-60 flex items-center gap-2">Seu Nome Completo <TooltipProvider><Tooltip><TooltipTrigger><Info className="w-3 h-3" /></TooltipTrigger><TooltipContent><p className="text-[10px] font-bold">Como você será chamado no suporte.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                          <div className="relative group">
                             <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                             <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 pl-11 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold transition-all" placeholder="Seu Nome" />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase ml-1 opacity-60">E-mail de Acesso (Não alterável)</Label>
                          <div className="relative opacity-60">
                             <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40" />
                             <Input value={userData?.email} disabled className="h-12 pl-11 rounded-xl bg-muted/40 cursor-not-allowed font-bold" />
                          </div>
                          <p className="text-[9px] text-muted-foreground italic ml-1">O e-mail é sua chave única e não pode ser modificado por segurança.</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-primary/5 ring-1 ring-primary/10">
                 <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                       <div className="p-4 rounded-3xl bg-primary text-white shadow-lg shadow-primary/20">
                          <Shield className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-sm font-black uppercase tracking-tight">Status do Plano: <span className="text-primary">{membershipLabel}</span></p>
                          <p className="text-xs text-muted-foreground font-medium">Sua conta possui acesso {userData?.membershipStatus === 'base' ? 'limitado' : 'premium'} aos recursos estratégicos.</p>
                       </div>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/pricing')} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm">Ver Planos e Upgrade</Button>
                 </CardContent>
              </Card>
           </TabsContent>

           <TabsContent value="negocio" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-background">
                 <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Identidade Comercial</CardTitle>
                    <CardDescription className="text-xs font-medium">Como sua empresa é vista na web e seus links oficiais.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-8 pt-4 space-y-10">
                    <div className="grid md:grid-cols-2 gap-10">
                       <div className="space-y-8">
                          <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase ml-1 opacity-60">Nome da Empresa</Label>
                             <div className="relative group">
                                <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-12 pl-11 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold transition-all" />
                             </div>
                          </div>
                          
                          <div className="space-y-3">
                             <div className="flex items-center justify-between ml-1">
                                <Label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-2">Link da Bio (Slug) <Link2 className="w-3 h-3" /></Label>
                                {!isPremiumUser && <Badge variant="secondary" className="text-[8px] font-black bg-primary/10 text-primary border-none">PREMIUM</Badge>}
                             </div>
                             <div className={cn(
                               "flex items-center gap-1 bg-muted/20 rounded-xl px-3 border border-transparent focus-within:ring-2 focus-within:ring-primary/20 transition-all",
                               !isPremiumUser && "opacity-60 grayscale cursor-not-allowed bg-muted/40"
                             )}>
                                <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">useproova.online/pp/</span>
                                <input 
                                  disabled={!isPremiumUser}
                                  value={companySlug} 
                                  onChange={(e) => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-'))} 
                                  className="h-12 flex-1 bg-transparent border-none focus:ring-0 text-sm font-black text-primary tracking-tight" 
                                  placeholder="nome-da-empresa"
                                />
                             </div>
                             <div className="p-4 rounded-2xl bg-muted/30 border border-muted-foreground/10 space-y-1.5">
                                <p className="text-[9px] font-black uppercase opacity-40">Visualização do Link:</p>
                                <p className="text-[11px] font-bold text-primary truncate">https://useproova.online/pp/{companySlug || 'seu-link'}</p>
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
                                   <SelectItem value="academia" className="font-medium text-xs">🏋️ Academia / Studio</SelectItem>
                                   <SelectItem value="agencia" className="font-medium text-xs">🚀 Agência Digital</SelectItem>
                                   <SelectItem value="barbearia" className="font-medium text-xs">💈 Barbearia / Salão</SelectItem>
                                   <SelectItem value="clinica" className="font-medium text-xs">🏥 Clínica / Médica</SelectItem>
                                   <SelectItem value="restaurante" className="font-medium text-xs">🍔 Gastronomia</SelectItem>
                                   <SelectItem value="servicos" className="font-medium text-xs">🛠️ Prestador de Serviços</SelectItem>
                                   <SelectItem value="estetica" className="font-medium text-xs">✨ Estética / Spa</SelectItem>
                                   <SelectItem value="outros" className="font-medium text-xs">📦 Outros Setores</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
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
                          
                          <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 rounded-2xl animate-in fade-in zoom-in duration-500">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-[10px] font-black uppercase tracking-tight">Aviso de Localização</AlertTitle>
                            <AlertDescription className="text-[10px] leading-relaxed font-medium">
                              Se você alterar a cidade ou o estado, será necessário pesquisar e vincular sua empresa novamente no <b>G-Boost</b>. Esses dados são essenciais para identificarmos seu local no Google.
                            </AlertDescription>
                          </Alert>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </TabsContent>

           <TabsContent value="google" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-background">
                 <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Automação G-Boost</CardTitle>
                    <CardDescription className="text-xs font-medium">O motor de redirecionamento automático para o Google Maps.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-8 pt-4 space-y-10">
                    <div className="p-6 rounded-[2rem] bg-primary/5 border-2 border-dashed border-primary/20 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                       <div className="shrink-0 p-5 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border-2 border-primary/10 relative z-10 transition-transform group-hover:scale-110">
                          <Image src="https://picsum.photos/seed/google-maps-saas/100/100" width={56} height={56} alt="Google Maps" className="grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" data-ai-hint="google maps logo" />
                       </div>
                       <div className="flex-1 space-y-2 text-center sm:text-left relative z-10">
                          <p className="text-base font-black uppercase tracking-tight">O que é o G-Boost?</p>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">Ao receber um elogio 5 estrelas, o Proova detecta a nota alta e convida seu cliente a clicar em um botão que o leva direto para o seu perfil no Google Maps, injetando avaliações positivas no maior buscador do mundo e subindo seu SEO Local.</p>
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10 pt-4">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase ml-1 opacity-60 flex items-center gap-2">Google Place ID <TooltipProvider><Tooltip><TooltipTrigger><Info className="w-3 h-3" /></TooltipTrigger><TooltipContent><p className="text-[10px] font-bold max-w-xs">Identificador único do seu local no Google. Usado para auditoria de fotos e horários.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                          <Input value={googlePlaceId} onChange={(e) => setGooglePlaceId(e.target.value)} placeholder="ChIJN1t_tDeuEmsRUsoy..." className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-mono text-xs font-bold" />
                          <p className="text-[9px] text-muted-foreground italic font-medium ml-1">Encontre seu ID no <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" className="text-primary hover:underline">Place ID Finder</a>.</p>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase ml-1 opacity-60 flex items-center gap-2">Link Direto de Avaliação <Zap className="w-3 h-3 text-primary" /></Label>
                          <Input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="https://search.google.com/local/writereview?placeid=..." className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-mono text-xs font-bold" />
                          <p className="text-[9px] text-muted-foreground italic font-medium ml-1">Este é o link que abre a caixa de texto do Google já com as estrelas vazias.</p>
                       </div>
                    </div>

                    <Card className="rounded-3xl border-none bg-muted/20 p-6">
                       <div className="flex items-start gap-4">
                          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-1" />
                          <div className="space-y-2">
                             <h4 className="text-xs font-black uppercase tracking-widest">Protocolo de Performance</h4>
                             <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                                Certifique-se de que o seu link contém o parâmetro <code className="bg-primary/10 text-primary px-1.5 rounded font-black">writereview</code>. Isso reduz o atrito e garante que o cliente não precise clicar em botões adicionais para começar a escrever o depoimento no Google.
                             </p>
                          </div>
                       </div>
                    </Card>
                 </CardContent>
              </Card>
           </TabsContent>
        </Tabs>
      </main>

      <footer className="py-12 border-t mt-auto flex flex-col items-center gap-8 bg-background/50 text-center shrink-0">
        <div className="flex items-center gap-2 relative w-[240px] h-[78px] md:w-[320px] md:h-[105px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="object-contain object-center dark:hidden opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700" priority unoptimized />
          <Image src="/logo-proova-dark-mode.gif" alt="Logo Footer" fill className="object-contain object-center hidden dark:block opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700" priority unoptimized />
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-60">© 2026 Proova Technology - Creative Studio</p>
          <p className="text-[8px] text-muted-foreground/40 font-bold uppercase">Account Management Suite v2.1.0-Release</p>
        </div>
      </footer>
    </div>
  );
}
