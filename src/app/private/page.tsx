
'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  LogOut,
  User,
  Loader2,
  Star,
  Clock,
  Layout,
  TrendingUp,
  Shield,
  MessageSquareOff,
  Inbox,
  Trash2,
  Mail,
  ArrowLeft,
  Sun,
  Moon,
  Gem,
  CheckCircle2,
  EyeOff,
  Sparkles,
  MessageSquare,
  Handshake,
  Lock,
  Globe,
  Headphones
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, deleteDoc, updateDoc, getDocs, limit, arrayUnion, where, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

export default function PrivateInboxPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

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

  const handleApproveTestimonial = async (id: string) => {
    if (!db || !user || isProcessing) return;
    setIsProcessing(id);
    
    try {
      const testimonialRef = doc(db, 'users', user.uid, 'testimonials', id);
      await updateDoc(testimonialRef, { status: 'approved' });
      
      const widgetsRef = collection(db, 'users', user.uid, 'widgets');
      const widgetsSnap = await getDocs(query(widgetsRef, limit(1)));
      if (!widgetsSnap.empty) {
        await updateDoc(widgetsSnap.docs[0].ref, {
          selectedTestimonialIds: arrayUnion(id)
        });
      }
      
      toast({ title: "Publicado!", description: "Depoimento aprovado e injetado no mural." });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro na aprovação" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePromoteToPublic = async (feedback: any) => {
    if (!db || !user || isProcessing) return;
    setIsProcessing(feedback.id);

    try {
      const testimonialsRef = collection(db, 'users', user.uid, 'testimonials');
      const newTestimonialData = {
        userName: feedback.userName,
        userEmail: feedback.userEmail || '',
        rating: feedback.rating,
        text: feedback.text,
        videoUrl: feedback.videoUrl || null,
        status: 'approved',
        createdAt: serverTimestamp(),
        source: 'cloned_from_private'
      };
      
      const newDocRef = await addDoc(testimonialsRef, newTestimonialData);

      const widgetsRef = collection(db, 'users', user.uid, 'widgets');
      const widgetsSnap = await getDocs(query(widgetsRef, limit(1)));
      if (!widgetsSnap.empty) {
        await updateDoc(widgetsSnap.docs[0].ref, {
          selectedTestimonialIds: arrayUnion(newDocRef.id)
        });
      }

      await deleteDoc(doc(db, 'users', user.uid, 'private_feedbacks', feedback.id));

      toast({ title: "Feedback Promovido!", description: "O item foi clonado para os depoimentos públicos e aprovado." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erro na clonagem" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleArchiveTestimonial = async (id: string) => {
    if (!db || !user || isProcessing) return;
    setIsProcessing(id);
    try {
      const testimonialRef = doc(db, 'users', user.uid, 'testimonials', id);
      await updateDoc(testimonialRef, { status: 'archived' });
      toast({ title: "Arquivado", description: "O depoimento foi removido da fila." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao arquivar" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!db || !user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'private_feedbacks', id));
      toast({ title: "Removido", description: "O feedback foi excluído permanentemente." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao remover" });
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
        <div className="flex items-center">
          <Link href="/dash" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px] transition-transform group-hover:scale-105">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex border-none bg-transparent shadow-none hover:bg-transparent" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 focus-visible:ring-0 shadow-none">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[120px] md:max-w-[200px] group-hover:text-primary transition-colors leading-tight">
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
              <DropdownMenuItem onClick={() => router.push('/private')} className="rounded-xl cursor-pointer font-bold py-2.5 bg-primary/5 text-primary">
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

      <main className="flex-1 p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full pt-24 md:pt-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dash">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary transition-all bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent shadow-none border-none select-none"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
                <Inbox className="w-8 h-8 text-primary" /> Moderação Unificada
              </h1>
              <p className="text-sm text-muted-foreground">Gerencie tudo o que entra na sua marca.</p>
            </div>
          </div>
        </header>

        {/* Tabs and list... */}
      </main>

      <footer className="py-12 border-t mt-auto flex flex-col items-center gap-8 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[220px] h-[75px] md:w-[340px] md:h-[105px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="object-contain object-center dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain object-center hidden dark:block" priority />
        </div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60">© 2026 Proova Technology</p>
      </footer>
    </div>
  );
}
