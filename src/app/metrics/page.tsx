'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  BarChart3, 
  Loader2, 
  TrendingUp,
  User,
  LogOut,
  Inbox,
  Layout,
  Gem,
  Handshake,
  Sun,
  Moon,
  Star,
  MousePointer2,
  Calendar,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartConfig
} from '@/components/ui/chart';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MetricsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('7');

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'testimonials'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: testimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const stats = useMemo(() => {
    if (!testimonials) return { 
      total: 0, 
      avgRating: 0, 
      chartData: [], 
      pieData: [],
      growth: 0 
    };

    const now = new Date();
    const days = period === 'all' ? 365 : parseInt(period);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const filtered = testimonials.filter((t: any) => {
      const date = t.createdAt?.toDate?.() || new Date();
      return period === 'all' || date >= cutoff;
    });

    const sum = filtered.reduce((acc, t: any) => acc + (t.rating || 0), 0);
    const avg = filtered.length > 0 ? (sum / filtered.length).toFixed(1) : "0.0";

    const lastNDays = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });

    const dayCounts = filtered.reduce((acc: any, t: any) => {
      const date = (t.createdAt?.toDate?.() || new Date()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const chartData = lastNDays.map(date => ({
      date,
      count: dayCounts[date] || 0
    })).slice(-(period === '7' ? 7 : 14));

    const ratings = filtered.reduce((acc: any, t: any) => {
      const r = t.rating || 5;
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});

    const pieData = [
      { name: '5 Estrelas', value: ratings[5] || 0, color: 'hsl(var(--primary))' },
      { name: '4 Estrelas', value: ratings[4] || 0, color: 'rgba(249, 115, 22, 0.6)' },
      { name: '3 Estrelas ou menos', value: (ratings[3] || 0) + (ratings[2] || 0) + (ratings[1] || 0), color: 'rgba(249, 115, 22, 0.2)' },
    ].filter(d => d.value > 0);

    return {
      total: filtered.length,
      avgRating: avg,
      chartData,
      pieData
    };
  }, [testimonials, period]);

  const chartConfig: ChartConfig = {
    count: {
      label: "Depoimentos",
      color: "hsl(var(--primary))",
    },
  };

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'Membro Enterprise';
    if (status === 'gold') return 'Membro Gold';
    if (status === 'trial') return 'Período Trial';
    if (status === 'expired') return 'Plano Expirado';
    return 'Plano Base';
  }, [userData]);

  if (authLoading || userDataLoading || testimonialsLoading) {
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

      <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-4">
            <Link 
              href="/dash" 
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group w-fit"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-[10px] font-black uppercase tracking-widest">Voltar ao Painel</span>
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="w-6 h-6" />
                </div>
                Proova Analytics
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">O ROI da sua confiança em números reais.</p>
            </div>
          </div>

          <div className="w-full sm:w-48">
            <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
              <SelectTrigger className="h-11 rounded-xl bg-background border-primary/20 text-[11px] font-bold uppercase tracking-wider focus:ring-primary/20">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent align="end" className="rounded-xl">
                <SelectItem value="7" className="text-xs font-medium">Últimos 7 dias</SelectItem>
                <SelectItem value="30" className="text-xs font-medium">Últimos 30 dias</SelectItem>
                <SelectItem value="all" className="text-xs font-medium">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume Total</CardTitle>
              <MessageSquare className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4">
              <div className="text-2xl font-black">{stats.total}</div>
              <p className="text-[9px] text-muted-foreground uppercase font-bold">Depoimentos aprovados</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Média Geral</CardTitle>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4">
              <div className="text-2xl font-black">{stats.avgRating}</div>
              <p className="text-[9px] text-muted-foreground uppercase font-bold">Estrelas (Rating)</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">G-Boost</CardTitle>
              <MousePointer2 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4">
              <div className="text-2xl font-black">{userData?.googleRedirectCount || 0}</div>
              <p className="text-[9px] text-muted-foreground uppercase font-bold">Cliques no Maps</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-primary/5 border border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Conversão Estimada</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4">
              <div className="text-2xl font-black text-primary">
                {userData?.googleRedirectCount && stats.total ? ((userData.googleRedirectCount / stats.total) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-[9px] text-primary/60 uppercase font-bold">Elogios vs Cliques</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-background p-6 md:p-8">
            <CardHeader className="p-0 mb-8">
              <div className="flex items-center gap-3 mb-2">
                 <div className="bg-primary/10 p-2 rounded-xl text-primary"><Calendar className="w-5 h-5" /></div>
                 <CardTitle className="text-lg font-black font-headline">Fluxo de Coleta</CardTitle>
              </div>
              <CardDescription className="text-xs">Número de novos elogios recebidos por dia no período.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[300px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))" 
                      radius={[6, 6, 0, 0]} 
                      barSize={period === '7' ? 40 : 20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-background p-6 md:p-8">
            <CardHeader className="p-0 mb-8">
              <div className="flex items-center gap-3 mb-2">
                 <div className="bg-primary/10 p-2 rounded-xl text-primary"><Star className="w-5 h-5" /></div>
                 <CardTitle className="text-lg font-black font-headline">Índice de Satisfação</CardTitle>
              </div>
              <CardDescription className="text-xs">Distribuição percentual das notas enviadas pelos seus clientes.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex flex-col sm:flex-row items-center justify-center gap-8 h-[300px]">
              {stats.pieData.length > 0 ? (
                <>
                  <div className="relative w-[200px] h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-3xl font-black">{stats.avgRating}</span>
                       <span className="text-[9px] uppercase font-black text-muted-foreground">SCORE</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {stats.pieData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tight">{item.name}</span>
                          <span className="text-xs font-bold opacity-60">{item.value} depoimentos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground opacity-30 italic">
                  <Star className="w-12 h-12 mb-2" />
                  <p className="text-sm">Sem dados para o gráfico</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <section className="pt-8">
          <Card className="border-none shadow-sm rounded-3xl bg-muted/30 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
               <div className="space-y-1">
                 <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                   <Gem className="w-4 h-4 text-primary" /> Dica de Reputação
                 </h3>
                 <p className="text-sm text-muted-foreground max-w-2xl">
                   {Number(stats.avgRating) >= 4.8 
                     ? "Sua nota é excelente! Que tal investir em novos murais para converter os visitantes do seu site ainda mais rápido?" 
                     : "Sua nota está boa, mas lembre-se: clientes 5 estrelas são os que mais tendem a te recomendar. Foque em pedir o G-Boost para eles."}
                 </p>
               </div>
               <Link href="/widgets">
                 <button className="h-12 px-8 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg active:scale-95">
                   Gerenciar Meus Murais
                 </button>
               </Link>
            </div>
          </Card>
        </section>
      </main>

      <footer className="py-12 border-t mt-auto flex flex-col items-center gap-8 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[220px] h-[75px] md:w-[340px] md:h-[105px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="object-contain dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block" priority />
        </div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60">© 2026 Proova Technology - Business Intelligence v1.0</p>
      </footer>
    </div>
  );
}