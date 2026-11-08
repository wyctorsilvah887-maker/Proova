
'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  Shield, LogOut, ArrowLeft, Loader2, Megaphone, Plus, Trash2, 
  CheckCircle2, AlertCircle, Info, Bell, Save, ChevronDown
} from 'lucide-react';
import { useAuth, useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, doc, setDoc, serverTimestamp, deleteDoc, addDoc, orderBy, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function AdvancedAdminPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { theme, setTheme } = useTheme();
  
  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  if (authLoading || userDataLoading) {
    return <div className="flex h-screen items-center justify-center bg-muted/30"><Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" /></div>;
  }

  if (!userData?.isAdmin) {
    return <div className="flex h-screen items-center justify-center bg-muted/30 px-4"><Card className="w-full max-w-md text-center shadow-xl"><CardHeader><Shield className="w-12 h-12 text-destructive mx-auto mb-4" /><CardTitle>Acesso Negado</CardTitle></CardHeader><CardContent><Button onClick={() => router.push('/dash')} className="w-full">Voltar</Button></CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 font-body text-foreground flex flex-col">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 sticky top-0 z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center">
          <Link href="/admin" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px] transition-transform group-hover:scale-105">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5 h-7">
            <Shield className="w-3 h-3" /> Root Admin
          </Badge>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-8 flex-1 max-w-5xl">
        <div className="flex flex-col gap-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary transition-colors h-8 px-0 font-bold uppercase tracking-widest text-[10px]">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel Admin
            </Button>
          </Link>
          <header className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">Gestão de Avisos</h1>
            <p className="text-muted-foreground text-sm">Crie notificações globais para todos os usuários da plataforma.</p>
          </header>
        </div>

        {/* Announcements management content... */}
      </main>

      <footer className="py-12 border-t mt-auto text-center flex flex-col items-center gap-6">
        <div className="relative w-[180px] h-[60px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="object-contain dark:hidden opacity-30 grayscale" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block opacity-30 grayscale" priority />
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">© 2026 Proova - Root Terminal</p>
      </footer>
    </div>
  );
}
