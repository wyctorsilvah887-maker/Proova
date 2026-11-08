
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Check, 
  ArrowRight, 
  Zap, 
  Star, 
  Shield, 
  ArrowLeft, 
  User, 
  LogOut, 
  TrendingUp, 
  Layout, 
  Inbox, 
  Gem, 
  Sun, 
  Moon,
  Loader2,
  Lock,
  Sparkles,
  ChevronDown,
  Handshake,
  BadgeCheck,
  Headphones
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from '@/components/theme-toggle';

export default function PricingPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [cachedUserData, setCachedUserData] = useState<any>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const cached = localStorage.getItem(`proova_user_profile_${user.uid}`);
      if (cached) {
        try {
          setCachedUserData(JSON.parse(cached));
        } catch (e) {
          console.error("Erro ao ler cache:", e);
        }
      }
    }
  }, [user]);

  const effectiveUserData = userData || cachedUserData;

  const status = useMemo(() => {
    if (!user) return 'guest';
    return (effectiveUserData?.membershipStatus || 'base').toLowerCase();
  }, [user, effectiveUserData]);

  const membershipLabel = useMemo(() => {
    if (status === 'enterprise') return 'ENTERPRISE';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    if (status === 'guest') return 'Visitante';
    return 'PLANO BASE';
  }, [status]);

  if (authLoading || (user && !effectiveUserData)) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></div>;
  }

  return (
    <div className="min-h-screen bg-background font-body text-foreground flex flex-col overflow-x-hidden">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[100] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-4">
          <Link href={user ? "/dash" : "/"}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-all border-none shadow-none bg-transparent hover:bg-transparent select-none"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex items-center group -ml-2">
            <div className="relative w-[160px] h-[52px] md:w-[240px] md:h-[78px] transition-transform group-hover:scale-105">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex" />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 px-1 md:px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold truncate max-w-[80px] group-hover:text-primary leading-tight">{effectiveUserData?.companyName || 'Empresa'}</span>
                    <span className="text-[7px] uppercase tracking-widest font-black text-muted-foreground">{membershipLabel}</span>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors"><User className="w-4 h-4" /></div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl bg-background border">
                <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-1" />
                <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl font-bold py-2.5 cursor-pointer">Dashboard</DropdownMenuItem>
                <DropdownMenuSeparator className="mx-1" />
                <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive font-bold py-2.5 cursor-pointer">Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <main className="flex-1 pt-32 pb-24 px-4 container max-w-4xl mx-auto flex flex-col">
        {/* Pricing content... */}
      </main>

      <footer className="py-20 border-t bg-background/50 flex flex-col items-center gap-8 text-center">
        <div className="relative w-[180px] h-[60px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="dark:hidden object-contain opacity-30 grayscale" />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="hidden dark:block object-contain opacity-30 grayscale" />
        </div>
        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">© 2026 PROOVA TECHNOLOGY - ESTRATÉGIA EM REPUTAÇÃO</p>
      </footer>
    </div>
  );
}
