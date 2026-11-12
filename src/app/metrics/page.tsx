'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  BarChart3, 
  Loader2, 
  TrendingUp,
  User,
  LogOut,
  Inbox,
  Gem,
  Star,
  MousePointer2,
  Mail,
  Lock,
  Globe,
  MessageCircle,
  Zap,
  TrendingDown,
  Headphones,
  Settings,
  LayoutGrid as LayoutGridIcon,
  ImageIcon,
  BarChart3 as BarChart3Icon,
  Menu
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { LoadingScreen } from '@/components/loading-screen';

export default function MetricsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('7');
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const isPremiumUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'testimonials');
  }, [db, user]);

  const { data: rawTestimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  const pendingTestimonialsCount = useMemo(() => {
    if (!rawTestimonials) return 0;
    return rawTestimonials.filter((t: any) => t.status === 'pending').length;
  }, [rawTestimonials]);

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
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

  if (authLoading || userDataLoading || testimonialsLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
      <header className="bg-background border-b h-16 md:h-20 flex items-center px-2 md:px-4 fixed top-0 w-full z-[120] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-2 flex-1">
          <button 
            ref={toggleButtonRef}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="h-10 w-10 rounded-xl hover:bg-primary/5 text-primary border border-primary/10 transition-all flex items-center justify-center focus:outline-none z-[150] relative"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
              <line x1="4" y1="7" x2="20" y2="7" className={cn("origin-center transition-all", isMenuOpen ? "translate-y-[5px] rotate-45" : "")} />
              <line x1="4" y1="12" x2="20" y2="12" className={cn("origin-center transition-all", isMenuOpen ? "opacity-0" : "")} />
              <line x1="4" y1="17" x2="20" y2="17" className={cn("origin-center transition-all", isMenuOpen ? "-translate-y-[5px] -rotate-45" : "")} />
            </svg>
          </button>
          <Link href="/dash" className="flex items-center group -ml-2">
            <div className="relative w-[140px] h-[46px] md:w-[280px] md:h-[90px]">
              <Image src="/logo-proova-white-mode.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-landing-dark-mode.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="flex border-none bg-transparent shadow-none hover:bg-transparent focus-visible:ring-0" />
        </div>
      </header>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
        <SheetContent 
          side="left" 
          className="w-full max-w-[300px] border-none shadow-2xl bg-background p-0 flex flex-col h-[100dvh] overflow-hidden z-[110]"
          onPointerDownOutside={(e) => {
            if (toggleButtonRef.current?.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de Navegação</SheetTitle>
            <SheetDescription>Acesse as funcionalidades e configurações da sua conta Proova.</SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col pt-20">
            <div className="p-6 border-b bg-muted/10 shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 shadow-inner">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black uppercase tracking-tight truncate">{userData?.companyName}</p>
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary">{membershipLabel}</span>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-4 py-6 space-y-8">
                <div>
                  <p className="px-3.5 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Navegação Principal</p>
                  <button 
                    onClick={() => { router.push('/dash'); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all group outline-none focus:ring-0"
                  >
                    <LayoutGridIcon className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100" />
                    <span>Dashboard</span>
                  </button>
                </div>

                <div>
                  <p className="px-3.5 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Ferramentas Proova</p>
                  {[
                    { label: 'Social Cards', href: '/social-cards', icon: ImageIcon },
                    { label: 'Moderação Inbox', href: '/private', icon: Inbox, badge: pendingTestimonialsCount },
                    { label: 'Métricas & ROI', href: '/metrics', icon: BarChart3Icon },
                  ].map((item: any, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        router.push(item.href);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all group outline-none focus:ring-0"
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge > 0 && <Badge className="bg-destructive text-white h-4 px-1.5 text-[8px]">{item.badge}</Badge>}
                    </button>
                  ))}
                </div>

                <div>
                  <p className="px-3.5 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Suporte & Conta</p>
                  {[
                    { label: 'Suporte VIP', href: '/support', icon: Headphones },
                    { label: 'Configurações', href: '/settings', icon: Settings },
                  ].map((item: any, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        router.push(item.href);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all group outline-none focus:ring-0"
                    >
                      <item.icon className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <div className="p-4 border-t shrink-0">
               <Button 
                 variant="ghost" 
                 className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/10 font-black uppercase tracking-widest text-[9px] gap-2"
                 onClick={() => signOut(auth)}
               >
                  <LogOut className="w-4 h-4" /> Sair da Conta
               </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1 p-4 md:p-8 space-y-12 max-w-7xl mx-auto w-full pt-24 md:pt-32 pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-4">
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

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Performance G-Boost</h2>
          </div>
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume Total</p>
                <BarChart3 className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{stats.total}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Depoimentos aprovados</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Média Geral</p>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{stats.avgRating}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Estrelas (Rating)</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliques no Maps</p>
                <MousePointer2 className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{userData?.googleRedirectCount || 0}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Encaminhados G-Boost</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-primary/5 border border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Conversão G-Boost Estimada</p>
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

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Performance Link in Bio</h2>
          </div>
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visitas Link in Bio</p>
                <Globe className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{userData?.ppVisitCount || 0}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Visualizações da página</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliques WhatsApp</p>
                <MessageCircle className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{userData?.whatsappClickCount || 0}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Intenções de contato</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-green-500/5 border border-green-500/10 col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Conversão Link in Bio</p>
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

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
             <CardHeader className="p-6 pb-0">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume de Coleta (30 dias)</CardTitle>
             </CardHeader>
             <CardContent className="p-6 h-[300px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                   <BarChart data={stats.chartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                      <YAxis hide />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
                   </BarChart>
                </ChartContainer>
             </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
             <CardHeader className="p-6 pb-0">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qualidade do Feedback</CardTitle>
             </CardHeader>
             <CardContent className="p-6 h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
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
                <div className="absolute flex flex-col items-center">
                   <p className="text-2xl font-black">{stats.avgRating}</p>
                   <p className="text-[8px] font-bold uppercase opacity-40">Score</p>
                </div>
             </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

