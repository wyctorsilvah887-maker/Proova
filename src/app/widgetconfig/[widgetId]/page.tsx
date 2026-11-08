
'use client';

import { useState, useMemo, useEffect, use } from 'react';
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
  LayoutGrid,
  Play,
  CheckCircle2,
  Monitor,
  Copy,
  Layout,
  Palette,
  ChevronDown,
  LogOut,
  TrendingUp,
  Gem,
  Shield,
  Sun,
  Moon,
  Zap,
  Settings2,
  Sparkles,
  ExternalLink,
  Lock,
  X,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useDoc, useCollection, useAuth } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from '@/components/ui/switch';
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
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';

export default function EmbedEditorPage({ params }: { params: Promise<{ widgetId: string }> }) {
  const { widgetId } = use(params);
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const widgetRef = useMemo(() => (db && user ? doc(db, 'users', user.uid, 'widgets', widgetId) : null), [db, user, widgetId]);
  const { data: widgetData, loading: widgetLoading } = useDoc(widgetRef);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

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

  if (authLoading || widgetLoading || userDataLoading || (user && !userData)) {
    return <div className="flex h-screen items-center justify-center bg-muted/30"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></div>;
  }

  return (
    <div className="h-screen flex flex-col font-body w-full overflow-hidden bg-background">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/widgets">
            <Button variant="ghost" size="sm" className="h-10 px-2 gap-2 text-muted-foreground hover:text-primary transition-all border-none shadow-none bg-transparent hover:bg-transparent focus:bg-transparent focus-visible:ring-0 rounded-xl shadow-none">
               <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Voltar</span>
            </Button>
          </Link>
          <div className="relative w-[160px] h-[52px] md:w-[240px] md:h-[78px]">
            <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
            <Image src="/logo-proova-dark-mode.gif" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="hidden sm:flex" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-1 md:px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[80px] group-hover:text-primary leading-tight">{userData?.companyName || 'Minha Empresa'}</span>
                  <div className="flex flex-col items-end gap-0">
                    <span className={cn(
                      "text-[7px] sm:text-[8px] uppercase tracking-widest font-black leading-tight text-primary",
                      userData?.membershipStatus === 'enterprise' ? "animate-pulse" : ""
                    )}>{membershipLabel}</span>
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
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-pointer font-bold py-2.5"><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.push('/widgets')} className="font-bold h-10 md:h-12 px-4 rounded-xl shadow-lg">Concluído</Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row pt-20 md:pt-28 overflow-hidden">
        <aside className="w-full md:w-80 bg-background border-r flex flex-col shrink-0">
           <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
                 <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tight">{widgetData?.name}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Editor de Mural Embutido</p>
                 </div>
                 
                 <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">Em breve: Edição completa de cores e layouts diretamente para widgets embutidos.</p>
                 </div>
              </div>
           </ScrollArea>
        </aside>

        <div className="flex-1 bg-muted/10 p-4 md:p-12 overflow-y-auto">
           <div className="max-w-4xl mx-auto space-y-8">
              <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden aspect-video bg-black flex flex-col items-center justify-center text-center p-12 space-y-4">
                 <div className="p-4 rounded-3xl bg-white/5 border border-white/10"><Monitor className="w-12 h-12 text-white/40" /></div>
                 <h3 className="text-white font-black uppercase tracking-tight text-xl">Visualização do Site</h3>
                 <p className="text-white/40 text-xs font-medium max-w-sm">Esta é a área onde seu mural aparecerá. No momento ele está configurado para o layout <b>{widgetData?.layout}</b>.</p>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Button variant="outline" className="h-14 rounded-2xl font-black uppercase tracking-widest gap-2 border-primary/20 text-primary hover:bg-primary/5">
                    <Palette className="w-5 h-5" /> Temas Proova
                 </Button>
                 <Button className="h-14 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl bg-primary hover:bg-primary/90">
                    <Copy className="w-5 h-5" /> Copiar Código Embed
                 </Button>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
