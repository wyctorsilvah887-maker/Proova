'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  Search,
  Inbox,
  Sun,
  Moon,
  Gem,
  Handshake,
  Lock,
  AlertTriangle,
  Headphones,
  Settings,
  LayoutGrid as LayoutGridIcon,
  ImageIcon,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useUser, useFirestore, useCollection, useAuth, useDoc } from '@/firebase';
import { collection, setDoc, serverTimestamp, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoadingScreen } from '@/components/loading-screen';

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
  const [widgetToDelete, setWidgetToDelete] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const widgetsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'widgets');
  }, [db, user]);

  const { data: widgetsList, loading: widgetsLoading } = useCollection(widgetsQuery);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    return 'PLANO BASE';
  }, [userData]);

  const filteredWidgets = useMemo(() => {
    if (!widgetsList) return [];
    if (!searchTerm.trim()) return widgetsList;
    return widgetsList.filter((w: any) => 
      w.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [widgetsList, searchTerm]);

  useEffect(() => {
    if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
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

      await setDoc(doc(db, 'users', user.uid, 'widgets', slug), {
        name: newWidgetName.trim(),
        selectedTestimonialIds: [],
        createdAt: serverTimestamp(),
        layout: 'grid', 
        themeColor: '#f97316',
        showLogo: true,
      });
      
      setNewWidgetName('');
      setIsCreating(false);
      setIsCreateDialogOpen(false);
      toast({ title: "Mural Criado!", description: "Configurando agora..." });
      router.push(`/widgetconfig/${slug}`);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro na criação" });
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!db || !user || !widgetToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'widgets', widgetToDelete.id));
      toast({ title: "Mural Removido" });
      setWidgetToDelete(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Erro na exclusão" });
    }
  };

  const copyEmbedCode = (wId: string) => {
    const script = `
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${baseUrl}/widgetpublic/${user?.uid}/${wId}';
    iframe.style.position = 'fixed';
    iframe.style.bottom = '20px';
    iframe.style.left = '20px';
    iframe.style.width = '350px';
    iframe.style.height = '180px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    iframe.allowTransparency = 'true';
    document.body.appendChild(iframe);
  })();
</script>`.trim();

    navigator.clipboard.writeText(script);
    toast({ 
      title: "Código Copiado!", 
      description: "Cole este script no <head> do seu site para ativar as notificações flutuantes." 
    });
  };

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
            onPointerDown={(e) => { e.preventDefault(); setIsMenuOpen(!isMenuOpen); }}
            className="h-10 w-10 rounded-xl hover:bg-primary/5 text-primary border border-primary/10 transition-all flex items-center justify-center focus:outline-none z-[150] relative"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
              <line x1="4" y1="7" x2="20" y2="7" className={cn("origin-center transition-all", isMenuOpen ? "translate-y-[5px] rotate-45" : "")} />
              <line x1="4" y1="12" x2="20" y2="12" className={cn("origin-center transition-all", isMenuOpen ? "opacity-0" : "")} />
              <line x1="4" y1="17" x2="20" y2="17" className={cn("origin-center transition-all", isMenuOpen ? "-translate-y-[5px] -rotate-45" : "")} />
            </svg>
          </button>
          <Link href="/dash" className="flex items-center group -ml-2">
            <div className="relative w-[140px] h-[46px] md:w-[280px] md:h-[93px]">
              <Image src="/logo-proovaai-whitemode.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/logo-proovaai-darkmode.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="flex border-none bg-transparent shadow-none hover:bg-transparent" />
        </div>
      </header>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
        <SheetContent side="left" className="w-full max-w-[300px] border-none shadow-2xl bg-background p-0 flex flex-col h-[100dvh] overflow-hidden z-[110]">
          <SheetHeader className="sr-only"><SheetTitle>Menu</SheetTitle><SheetDescription>Navegação</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-y-auto flex flex-col pt-20">
            <div className="p-6 border-b bg-muted/10 shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner"><User className="w-6 h-6 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black uppercase tracking-tight truncate">{userData?.companyName}</p>
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary">{membershipLabel}</span>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="px-4 py-6 space-y-8">
                <div>
                  <p className="px-3.5 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Navegação</p>
                  <button onClick={() => { router.push('/dash'); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase transition-all group outline-none">
                    <LayoutGridIcon className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100" />
                    <span>Dashboard</span>
                  </button>
                </div>
              </div>
            </ScrollArea>
            <div className="p-4 border-t shrink-0"><Button variant="ghost" className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/10 font-black uppercase tracking-widest text-[9px] gap-2" onClick={() => signOut(auth)}><LogOut className="w-4 h-4" /> Sair</Button></div>
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full pt-24 md:pt-32 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tighter uppercase">Meus Murais</h1>
            <p className="text-muted-foreground text-sm font-medium">Gerencie seus murais de prova social.</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="h-12 rounded-xl font-black uppercase tracking-widest gap-2 shadow-xl bg-primary hover:bg-primary/90 text-white"><Plus className="w-5 h-5" /> Criar Novo</Button>
        </header>

        <div className="relative group">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input placeholder="Filtrar meus murais..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-11 pl-10 rounded-xl bg-background border-primary/10 focus:ring-primary/20 text-xs font-bold" />
        </div>

        {widgetsLoading ? (
          <div className="py-24 flex justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary/30" /></div>
        ) : filteredWidgets.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] opacity-30 bg-muted/20"><Layout className="w-16 h-16 mb-4" /><p className="text-sm font-black uppercase tracking-widest">Nenhum mural configurado</p></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {filteredWidgets.map((w: any) => (
               <Card key={w.id} className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-card">
                  <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors w-full" />
                  <CardHeader className="p-6 pb-2">
                     <div className="flex items-center justify-between"><Badge variant="secondary" className="text-[7px] font-black uppercase h-4 px-1.5">{w.layout}</Badge></div>
                     <CardTitle className="text-lg font-black uppercase tracking-tight truncate mt-2">{w.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-2 space-y-4">
                     <div className="flex flex-col gap-2">
                        <Button onClick={() => router.push(`/widgetconfig/${w.id}`)} className="w-full h-10 rounded-xl font-bold uppercase text-[9px] bg-foreground text-background hover:opacity-90 gap-2"><Settings2 className="w-3.5 h-3.5" /> Configurar</Button>
                        <div className="grid grid-cols-2 gap-2">
                           <Button 
                             variant="outline" 
                             className="h-9 rounded-xl font-bold text-[8px] gap-1.5 border-primary/20 text-primary" 
                             onClick={() => copyEmbedCode(w.id)}
                           >
                             <Code className="w-3 h-3" /> Embed
                           </Button>
                           <Button variant="ghost" className="h-9 rounded-xl font-bold text-[8px] gap-1.5 text-destructive" onClick={() => setWidgetToDelete(w)}><Trash2 className="w-3 h-3" /> Excluir</Button>
                        </div>
                     </div>
                  </CardContent>
               </Card>
             ))}
          </div>
        )}
      </main>

      <footer className="py-12 border-t mt-auto text-center flex flex-col items-center gap-6">
        <div className="relative w-[180px] h-[60px] opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <Image src="/logo-proovaai-whitemode.png" alt="Logo Gray" fill className="object-contain dark:hidden" />
          <Image src="/logo-proovaai-darkmode.png" alt="Logo Gray" fill className="object-contain hidden dark:block" />
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">© 2026 Proova - Gestão Estratégica</p>
      </footer>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
         <DialogContent className="rounded-[2.5rem] w-[95vw] sm:max-w-md border-none shadow-2xl p-8">
            <DialogHeader className="text-center space-y-3"><DialogTitle className="text-xl font-black uppercase tracking-tight">Novo Mural Proova</DialogTitle><DialogDescription className="text-xs font-medium">Dê um nome para identificar este mural.</DialogDescription></DialogHeader>
            <form onSubmit={handleCreateWidget} className="space-y-6 pt-4">
               <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Identificação Interna</Label><Input placeholder="Ex: Mural da Home" value={newWidgetName} onChange={(e) => setNewWidgetName(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold" required autoFocus /></div>
               <Button type="submit" disabled={isCreating || !newWidgetName.trim()} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2 bg-primary shadow-xl">{isCreating ? <Loader2 className="animate-spin" /> : <Plus className="w-5 h-5" />} Criar Mural</Button>
            </form>
         </DialogContent>
      </Dialog>

      <AlertDialog open={!!widgetToDelete} onOpenChange={() => setWidgetToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
          <AlertDialogHeader className="text-center space-y-4"><div className="mx-auto w-fit p-4 rounded-3xl bg-destructive/10 text-destructive"><AlertTriangle className="w-10 h-10" /></div><div className="space-y-2"><AlertDialogTitle className="text-xl font-black uppercase">Excluir Mural?</AlertDialogTitle><AlertDialogDescription className="text-xs font-medium">Esta ação é irreversível.</AlertDialogDescription></div></AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-4"><AlertDialogCancel className="h-12 rounded-xl font-bold border-none bg-muted">Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} className="h-12 rounded-xl font-bold bg-destructive text-white">Confirmar Exclusão</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
