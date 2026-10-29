'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  BarChart3, 
  Loader2, 
  Construction, 
  Hammer,
  Shield,
  TrendingUp,
  User,
  LogOut,
  Inbox,
  Layout,
  Gem,
  Handshake,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

export default function MetricsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'Membro Enterprise';
    if (status === 'gold') return 'Membro Gold';
    if (status === 'trial') return 'Período Trial';
    if (status === 'expired') return 'Plano Expirado';
    return 'Plano Base';
  }, [userData]);

  if (authLoading || userDataLoading) {
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
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 h-12 px-2 rounded-xl hover:bg-primary/5 group transition-all outline-none">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[150px] leading-tight">
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
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span>Painel Principal</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Layout className="mr-2 h-4 w-4 text-primary" />
                <span>Meus Murais</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/private')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Inbox className="mr-2 h-4 w-4 text-primary" />
                <span>Inbox Privado</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Upgrade</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/partners')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Handshake className="mr-2 h-4 w-4 text-primary" />
                <span>Parceiros</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl cursor-pointer font-bold py-2.5">
                {theme === 'light' ? <Moon className="mr-2 h-4 w-4 text-primary" /> : <Sun className="mr-2 h-4 w-4 text-primary" />}
                <span>Alternar Tema</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-pointer font-bold py-2.5">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40 bg-primary/10 rounded-full flex items-center justify-center border-4 border-dashed border-primary/20">
            <BarChart3 className="w-16 h-16 md:w-20 md:h-20 text-primary opacity-20 absolute" />
            <Hammer className="w-12 h-12 md:w-16 md:h-16 text-primary animate-bounce" />
            <Construction className="w-6 h-6 text-primary absolute bottom-4 right-4" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter leading-tight">
              Métricas e <span className="text-primary italic">Analytics</span>.
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg font-medium leading-relaxed">
              Estamos construindo um motor de BI ultra potente para você acompanhar o ROI da sua prova social em tempo real.
            </p>
          </div>

          <Card className="border-none shadow-xl rounded-[2rem] bg-card overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Em desenvolvimento:</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm font-medium opacity-60">
                    <TrendingUp className="w-4 h-4 text-primary" /> Taxa de Conversão dos Widgets
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium opacity-60">
                    <Shield className="w-4 h-4 text-primary" /> Monitoramento de Saúde da Marca
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium opacity-60">
                    <BarChart3 className="w-4 h-4 text-primary" /> Cliques por Localização Geográfica
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <Link href="/dash">
                  <button className="w-full h-12 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg">
                    <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-40">
            Proova BI v1.0 - Coming Soon
          </p>
        </div>
      </main>

      <footer className="py-12 border-t mt-auto flex flex-col items-center gap-8 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[200px] h-[65px] md:w-[320px] md:h-[105px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="object-contain dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block" priority />
        </div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60">© 2026 Proova Technology</p>
      </footer>
    </div>
  );
}
