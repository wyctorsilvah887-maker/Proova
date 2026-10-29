'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Plus, 
  Layout, 
  Loader2, 
  Settings2, 
  Code, 
  Trash2, 
  ArrowLeft,
  User,
  LogOut,
  Shield,
  Copy,
  Terminal,
  CheckCircle2,
  Monitor,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Search,
  Inbox,
  Sun,
  Moon,
  Gem,
  Info,
  Handshake,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useAuth, useDoc } from '@/firebase';
import { collection, setDoc, serverTimestamp, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

export default function WidgetsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [newWidgetName, setNewWidgetName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const widgetsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'widgets');
  }, [db, user]);

  const { data: widgetsList, loading: widgetsLoading } = useCollection(widgetsQuery);

  const isPremiumUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'Membro Enterprise';
    if (status === 'gold') return 'Membro Gold';
    if (status === 'trial') return 'Período Trial';
    if (status === 'expired') return 'Plano Expirado';
    return 'Plano Base';
  }, [userData]);

  const filteredWidgets = useMemo(() => {
    if (!widgetsList) return [];
    if (!searchTerm.trim()) return widgetsList;
    return widgetsList.filter((w: any) => 
      w.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [widgetsList, searchTerm]);

  const setupProgress = useMemo(() => {
    if (!userData) return { isCollectDone: false, isSetupComplete: false };
    const isLocationDone = !!userData.city && !!userData.state;
    const isGoogleDone = !!userData.googleMapsUrl;
    const isCollectDone = (userData.testimonialsCount || 0) > 0;
    const isWidgetDone = !!(widgetsList && widgetsList.length > 0);
    const isSetupComplete = isLocationDone && isGoogleDone && isCollectDone && isWidgetDone;
    return { isCollectDone, isSetupComplete };
  }, [userData, widgetsList]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleCreateWidget = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newWidgetName.trim() || !db || !user) return;

    setIsCreating(true);
    
    let slug = newWidgetName.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    try {
      const widgetRef = doc(db, 'users', user.uid, 'widgets', slug);
      
      const docSnap = await getDoc(widgetRef);
      if (docSnap.exists()) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 5)}`;
      }

      const finalWidgetRef = doc(db, 'users', user.uid, 'widgets', slug);

      const widgetData = {
        name: newWidgetName.trim(),
        selectedTestimonialIds: [],
        createdAt: serverTimestamp(),
        layout: 'grid', 
        themeColor: '#f97316',
        whatsappEnabled: false,
        whatsappNumber: '',
        externalSiteUrl: '',
        coverImageUrl: '',
        showLogo: true,
      };

      await setDoc(finalWidgetRef, widgetData);
      
      setNewWidgetName('');
      setIsCreating(false);
      setIsCreateDialogOpen(false);
      toast({
        title: "Mural Criado!",
        description: "Configurando seu novo mural embutido...",
      });
      router.push(`/widgetconfig/${slug}`);
      
    } catch (error: any) {
      console.error("Erro ao criar widget:", error);
      toast({
        variant: "destructive",
        title: "Erro na criação",
        description: "Não foi possível criar o mural agora."
      });
      setIsCreating(false);
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!db || !user) return;
    const widgetRef = doc(db, 'users', user.uid, 'widgets', widgetId);
    deleteDoc(widgetRef).then(() => {
      toast({ title: "Mural Removido", description: "O mural foi excluído com sucesso." });
    });
  };

  const copyToClipboard = (text: string, description: string = "Código de instalação") => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${description} copiado para a área de transferência.`,
    });
  };

  if (authLoading || userDataLoading || (user && !userData)) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 sticky top-0 z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center">
          <Link href="/dash" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px] transition-transform group-hover:scale-105">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain hidden dark:block" priority />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[120px] md:max-w-[200px] transition-colors group-hover:text-primary leading-tight">
                    {userData?.companyName || 'Minha Empresa'}
                  </span>
                  <span className={cn(
                    "text-[8px] uppercase tracking-widest font-black leading-tight",
                    userData?.membershipStatus === 'enterprise' ? "text-primary animate-pulse" : "text-muted-foreground"
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
              <DropdownMenuItem 
                onClick={() => setupProgress.isCollectDone && router.push('/widgets')} 
                className={cn(
                  "rounded-xl cursor-pointer font-bold py-2.5 bg-primary/5 text-primary",
                  !setupProgress.isCollectDone && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                <Layout className="mr-2 h-4 w-4 text-primary" />
                <span>Meus Murais</span>
                {!setupProgress.isCollectDone && <Lock className="ml-auto w-3 h-3 opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setupProgress.isSetupComplete && router.push('/private')} 
                className={cn(
                  "rounded-xl cursor-pointer font-bold py-2.5",
                  !setupProgress.isSetupComplete && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                <Inbox className="mr-2 h-4 w-4 text-primary" />
                <span>Inbox Privado</span>
                {!setupProgress.isSetupComplete && <Lock className="ml-auto w-3 h-3 opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Planos de Upgrade</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/pricing')} 
                className="rounded-xl cursor-pointer font-bold py-2.5 opacity-70"
              >
                <Handshake className="mr-2 h-4 w-4 text-primary" />
                <span>Serviços de Parceiros</span>
                <Lock className="ml-auto w-3.5 h-3.5 opacity-60" />
              </DropdownMenuItem>
              
              {userData?.isAdmin && (
                <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-xl cursor-pointer font-bold py-2.5">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  <span>Administração</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl cursor-pointer font-bold py-2.5">{theme === 'light' ? <Moon className="mr-2 h-4 w-4 text-primary" /> : <Sun className="mr-2 h-4 w-4 text-primary" />}<span>Tema</span></DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-pointer font-bold py-2.5"><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Link href="/dash">
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">Meus Murais</h1>
                <Button variant="link" size="sm" onClick={() => setIsTutorialOpen(true)} className="text-[10px] font-bold gap-1 text-primary p-0 h-auto">
                  <Info className="w-3 h-3" /> Tutorial
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Gerencie e publique murais de depoimentos no seu site</p>
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto h-12 rounded-xl shadow-lg font-bold gap-2 text-sm" size="lg">
            <Plus className="w-5 h-5" /> Novo Mural
          </Button>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Buscar mural pelo nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-12 w-full rounded-xl border border-input bg-background pl-11 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all shadow-sm"
          />
        </div>

        <div className="grid gap-4 md:gap-6">
          {widgetsLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Sincronizando seus murais...</p>
            </div>
          ) : filteredWidgets.length > 0 ? (
            filteredWidgets.map((w: any) => (
              <Card key={w.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group rounded-2xl">
                <div className="flex flex-col p-5 md:p-6 gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-4 rounded-2xl hidden md:block group-hover:bg-primary transition-colors">
                        <Layout className="w-6 h-6 text-primary group-hover:text-black transition-colors" />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h3 className="font-black font-headline text-lg md:text-xl truncate group-hover:text-primary transition-colors pr-8 sm:pr-0">{w.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-[9px] h-5 bg-primary/5 text-primary border-none px-2 font-black">
                            {w.selectedTestimonialIds?.length || 0} AVALIAÇÕES
                          </Badge>
                          <Badge variant="outline" className="text-[9px] h-5 uppercase tracking-widest font-black px-2 opacity-60">
                            {w.layout || 'grid'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="absolute right-4 top-4 sm:relative sm:right-0 sm:top-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive h-10 w-10 hover:bg-destructive/10 rounded-xl"
                        onClick={() => handleDeleteWidget(w.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      className="h-14 sm:h-12 rounded-xl text-xs font-black uppercase tracking-widest gap-2 bg-background border border-primary/20 text-primary hover:bg-primary/5 shadow-sm justify-between px-4"
                      onClick={() => router.push(`/widgetconfig/${w.id}`)}
                    >
                      <span className="flex items-center gap-2"><Settings2 className="w-4 h-4" /> Configurar Mural</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-30" />
                    </Button>
                    <Button 
                      variant="secondary"
                      className="h-14 sm:h-12 rounded-xl text-xs font-black uppercase tracking-widest gap-2 bg-muted/50 hover:bg-muted shadow-sm justify-between px-4"
                      onClick={() => { setSelectedWidget(w); setIsDialogOpen(true); }}
                    >
                      <span className="flex items-center gap-2"><Code className="w-4 h-4" /> Obter Código</span>
                      <Copy className="w-3.5 h-3.5 opacity-30" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="py-24 text-center border-2 border-dashed rounded-3xl bg-muted/5 space-y-4">
              <Layout className="w-12 h-12 text-muted-foreground/20 mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-lg">Nenhum mural criado</p>
                <p className="text-sm text-muted-foreground">Comece criando seu primeiro mural de depoimentos para o seu site.</p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="rounded-xl font-bold mt-4 h-12 px-8">
                Criar Agora
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 border-t mt-auto flex flex-col items-center gap-8 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[200px] h-[65px] md:w-[320px] md:h-[105px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="object-contain dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block" priority />
        </div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60">© 2026 Proova Technology</p>
      </footer>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Código de Instalação</DialogTitle>
            <DialogDescription>Copie e cole este script no seu site para exibir o mural.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <div className="relative bg-muted/50 rounded-xl p-4 border group">
                <pre className="text-[10px] font-mono whitespace-pre-wrap break-all">{selectedWidget ? `<script src="${baseUrl}/widget.js?id=${selectedWidget.id}&user=${user?.uid}" defer></script>` : ''}</pre>
                <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8" onClick={() => copyToClipboard(selectedWidget ? `<script src="${baseUrl}/widget.js?id=${selectedWidget.id}&user=${user?.uid}" defer></script>` : '')}>
                   <Copy className="h-4 w-4" />
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Novo Mural de Depoimentos</DialogTitle>
            <DialogDescription>Dê um nome para organizar sua prova social no site.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWidget} className="space-y-4">
            <Input placeholder="Ex: Mural Home Page" value={newWidgetName} onChange={(e) => setNewWidgetName(e.target.value)} required />
            <Button className="w-full h-12 font-bold" disabled={isCreating}>{isCreating ? <Loader2 className="animate-spin" /> : "Criar e Configurar"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
