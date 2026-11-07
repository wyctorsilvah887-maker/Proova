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
  ChevronDown,
  Mail,
  Lock,
  Shield,
  Globe,
  MessageCircle,
  Zap,
  TrendingDown,
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
import { doc, collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { sendWeeklyPerformanceReport } from '@/app/actions/report-actions';
import { ThemeToggle } from '@/components/theme-toggle';

export default function MetricsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('7');
  const [isSendingReport, setIsSendingReport] = useState(false);

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

  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'testimonials');
  }, [db, user]);

  const { data: rawTestimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const handleSendWeeklyReport = async () => {
    if (!user) return;
    if (!isPremiumUser) {
      router.push('/pricing');
      return;
    }
    setIsSendingReport(true);
    try {
      const result = await sendWeeklyPerformanceReport(user.uid);
      if (result.success) {
        toast({ 
          title: "Relatório Enviado!", 
          description: "Os dados de performance foram enviados para o seu e-mail." 
        });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) { 
      toast({ variant: "destructive", title: "Erro", description: e.message }); 
    } finally { 
      setIsSendingReport(false); 
    }
  };

  const stats = useMemo(() => {
    if (!rawTestimonials) return { 
      total: 0, 
      avgRating: "0.0", 
      chartData: [], 
      pieData: []
    };

    const approved = rawTestimonials
      .filter((t: any) => t.status === 'approved')
      .sort((a: any, b: any) => {
        const da = a.createdAt?.toDate?.() || new Date(0);
        const db = b.createdAt?.toDate?.() || new Date(0);
        return db.getTime() - da.getTime();
      });

    const now = new Date();
    const days = period === 'all' ? 365 : parseInt(period);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const filtered = approved.filter((t: any) => {
      const date = t.createdAt?.toDate?.() || new Date();
      return period === 'all' || date >= cutoff;
    });

    const sum = filtered.reduce((acc, t: any) => acc + (t.rating || 0), 0);
    const avg = filtered.length > 0 ? (sum / filtered.length).toFixed(1) : "0.0";

    const lastNDays = Array.from({ length: days > 30 ? 30 : days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - ((days > 30 ? 30 : days) - 1 - i));
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
    }));

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
  }, [rawTestimonials, period]);

  const ppConversionRate = useMemo(() => {
    const visits = userData?.ppVisitCount || 0;
    const clicks = userData?.whatsappClickCount || 0;
    if (visits === 0) return 0;
    return Math.round((clicks / visits) * 100);
  }, [userData]);

  const chartConfig: ChartConfig = {
    count: {
      label: "Depoimentos",
      color: "hsl(var(--primary))",
    }
  };

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'ENTERPRISE';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
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
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center">
          <Link href="/dash" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[160px] h-[52px] md:w-[240px] md:h-[78px] transition-transform group-hover:scale-105">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex border-none bg-transparent shadow-none hover:bg-transparent active:bg-transparent focus-visible:ring-0" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 h-12 px-2 rounded-xl hover:bg-primary/5 group transition-all outline-none shadow-none focus-visible:ring-0">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[150px] transition-colors group-hover:text-primary leading-tight">
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
              <DropdownMenuItem className="rounded-xl font-bold py-2.5 opacity-50 cursor-not-allowed">
                <Handshake className="mr-2 h-4 w-4 text-primary" />
                <span>Parceiros</span>
                <Lock className="ml-auto w-3.5 h-3.5 opacity-60" />
              </DropdownMenuItem>
              
              {userData?.isAdmin && (
                <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-xl cursor-pointer font-bold py-2.5">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  <span>Administração</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl cursor-pointer font-bold py-2.5">
                {theme === 'light' ? <Moon className="mr-2 h-4 w-4 text-primary" /> : <Sun className="mr-2 h-4 w-4 text-primary" />}
                <span>Alternar Tema</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-bold font-bold py-2.5">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-12 max-w-7xl mx-auto w-full pt-24 md:pt-32">
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
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Análise de impacto e conversão da sua autoridade digital.</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
                <SelectTrigger className="h-11 rounded-xl bg-background border-primary/20 text-[11px] font-bold uppercase tracking-wider focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent align="end" className="rounded-xl">
                  <SelectItem value="7" className="text-xs font-medium">Últimos 7 dias</SelectItem>
                  <SelectItem value="30" className="text-xs font-medium">Últimos 30 dias</SelectItem>
                  <SelectItem value="all" className="text-xs font-medium">Todo o período</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button 
              onClick={handleSendWeeklyReport} 
              disabled={isSendingReport} 
              className={cn(
                "text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline disabled:opacity-50 transition-all",
                isPremiumUser ? "text-primary" : "text-muted-foreground opacity-50"
              )}
            >
              {isSendingReport ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />} 
              {!isPremiumUser && <Lock className="w-2.5 h-2.5" />} 
              Relatório Completo por E-mail
            </button>
          </div>
        </header>

        {/* SECTION 1: Elogios e G-Boost */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Performance G-Boost</h2>
          </div>
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
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliques no Maps</CardTitle>
                <MousePointer2 className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{userData?.googleRedirectCount || 0}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Encaminhados G-Boost</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-primary/5 border border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Conversão G-Boost Estimada</CardTitle>
                <TrendingUp className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black text-primary">
                  {userData?.googleRedirectCount && stats.total && stats.total > 0 ? ((userData.googleRedirectCount / stats.total) * 100).toFixed(0) : 0}%
                </div>
                <p className="text-[9px] text-primary/60 uppercase font-bold">Elogios vs Cliques</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 2: Link in Bio Performance */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Performance Link in Bio</h2>
          </div>
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visitas Link in Bio</CardTitle>
                <Globe className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{userData?.ppVisitCount || 0}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Visualizações da página</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliques WhatsApp</CardTitle>
                <MessageCircle className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{userData?.whatsappClickCount || 0}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Intenções de contato</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-green-500/5 border border-green-500/10 col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-green-600">Conversão Link in Bio</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="flex items-end gap-3">
                  <div className="text-3xl font-black text-green-600">{ppConversionRate}%</div>
                  <Badge variant="outline" className="mb-1 text-[8px] font-black uppercase bg-green-500/10 text-green-600 border-none">Taxa de Lead</Badge>
                </div>
                <p className="text-[9px] text-green-600/60 uppercase font-bold mt-1">Visitas que se tornaram contatos reais</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-background p-6 md:p-8">
            <CardHeader className="p-0 mb-8">
              <div className="flex items-center gap-3 mb-2">
                 <div className="bg-primary/10 p-2 rounded-xl text-primary"><Calendar className="w-5 h-5" /></div>
                 <CardTitle className="text-lg font-black font-headline">Fluxo de Coleta</CardTitle>
              </div>
              <CardDescription className="text-xs">Volume diário de novos elogios capturados.</CardDescription>
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
                 <CardTitle className="text-lg font-black font-headline">Qualidade da Reputação</CardTitle>
              </div>
              <CardDescription className="text-xs">Distribuição percentual das notas enviadas.</CardDescription>
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
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-3xl font-black">{stats.avgRating}</span>
                       <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">SCORE</span>
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
                   <Gem className="w-4 h-4 text-primary" /> Consultoria Proova
                 </h3>
                 <p className="text-sm text-muted-foreground max-w-2xl">
                   {ppConversionRate < 10 && userData?.ppVisitCount > 50 
                     ? "Notamos muitas visitas no seu Link in Bio, mas poucos contatos. Tente mudar o título hero para algo mais chamativo ou reorganize seus melhores depoimentos no topo." 
                     : "Sua performance está estável. Continue gerando novos Social Cards para manter o tráfego fluindo do Instagram para a sua Página Pública."}
                 </p>
               </div>
               <Link href="/ppeditor">
                 <button className="h-12 px-8 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg active:scale-95">
                   Otimizar Link in Bio
                 </button>
               </Link>
            </div>
          </Card>
        </section>
      </main>

      <footer className="py-12 border-t mt-auto flex flex-col items-center gap-8 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[240px] h-[78px] md:w-[320px] md:h-[105px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="object-contain object-center dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain object-center hidden dark:block" priority />
        </div>
        <p className="text-[9px] text-muted-foreground uppercase font-black opacity-60">© 2026 Proova Technology - Business Intelligence v1.1</p>
      </footer>
    </div>
  );
}
