
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
  Headphones
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
  const [widgetToDelete, setWidgetToDelete] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  const isMapsLinkValid = useMemo(() => {
    if (!userData?.googleMapsUrl) return false;
    const url = userData.googleMapsUrl.toLowerCase();
    return url.includes('review') || url.includes('writereview') || url.includes('placeid');
  }, [userData]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'ENTERPRISE';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
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

  const handleConfirmDelete = async () => {
    if (!db || !user || !widgetToDelete) return;
    
    try {
      const widgetRef = doc(db, 'users', user.uid, 'widgets', widgetToDelete.id);
      await deleteDoc(widgetRef);
      toast({ title: "Mural Removido", description: "O mural foi excluído com sucesso." });
      setWidgetToDelete(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Erro na exclusão", description: "Não foi possível remover o mural agora." });
    }
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
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-4">
          <Link href="/dash">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-primary transition-all border-none shadow-none bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:ring-0 select-none"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center group -ml-2">
            <div className="relative w-[160px] h-[52px] md:w-[240px] md:h-[78px] transition-transform group-hover:scale-105">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex border-none bg-transparent shadow-none hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:ring-0" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-1 md:px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] md:text-xs font-bold truncate max-w-[80px] sm:max-w-[150px] transition-colors group-hover:text-primary leading-tight">
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
              <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5 bg-primary/5 text-primary">
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

      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full pt-24 md:pt-32">
        {/* Widget list content... */}
      </main>

      <footer className="py-12 border-t mt-auto flex flex-col items-center gap-8 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[240px] h-[78px] md:w-[320px] md:h-[105px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="object-contain object-center dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain object-center hidden dark:block" priority />
        </div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60">© 2026 Proova Technology</p>
      </footer>
    </div>
  );
}
