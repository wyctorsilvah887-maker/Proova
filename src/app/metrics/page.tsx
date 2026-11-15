'use client';

import { AppSideMenu } from '@/components/app-menu';
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
  Menu,
  CircleHelp
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { OnboardingTour, type TourStep } from '@/components/onboarding-tour';
import { usePageTour } from '@/hooks/use-page-tour';

function HelpTip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="O que significa?" className="text-muted-foreground/50 hover:text-primary transition-colors">
          <CircleHelp className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 rounded-2xl p-4 text-xs font-medium leading-relaxed">{text}</PopoverContent>
    </Popover>
  );
}

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
  const tour = usePageTour(userDocRef, userData, 'metricsTourDone');
  const tourSteps: TourStep[] = useMemo(() => [
    { title: 'Entenda seus resultados 📊', text: 'Esta página mostra o impacto da sua prova social. Em 1 minuto você vai saber o que cada número quer dizer. Toque no ícone ? de qualquer card para rever a explicação.' },
    { target: 'm-period', title: 'Período', text: 'Escolha 7 dias, 30 dias ou todo o período. O filtro vale para depoimentos, nota média e o gráfico de coleta.' },
    { target: 'm-gboost', title: 'Performance G-Boost', text: 'Mostra quantos depoimentos você coletou, a nota média e quantos pacientes foram encaminhados para avaliar você no Google. Os cliques são acumulados desde o início.' },
    { target: 'm-bio', title: 'Performance Link in Bio', text: 'Acompanha sua página pública: visitas, cliques no WhatsApp e a taxa de visitantes que viraram contato.' },
    { target: 'm-charts', title: 'Gráficos', text: 'À esquerda, quantos depoimentos chegaram por dia. À direita, a distribuição das notas: quanto mais 5 estrelas, melhor a percepção da sua clínica.' },
    { target: 'm-report', title: 'Relatório por e-mail', text: 'Receba o resumo completo de performance na sua caixa de entrada (planos Premium e PRO).' },
  ], []);

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
      allTime: 0,
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
      allTime: approved.length,
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
    if (status === 'gold') return 'PREMIUM';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

  if (authLoading || userDataLoading || testimonialsLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
      {tour.open && <OnboardingTour steps={tourSteps} onFinish={tour.finish} />}
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
            <div className="relative w-[140px] h-[46px] md:w-[280px] md:h-[93px]">
              <Image src="/logo-proovaai-whitemode.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/logo-proovaai-darkmode.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="flex border-none bg-transparent shadow-none hover:bg-transparent focus-visible:ring-0" />
        </div>
      </header>

      <AppSideMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} toggleRef={toggleButtonRef} companyName={userData?.companyName} membershipLabel={membershipLabel} pendingCount={pendingTestimonialsCount} />

      <main className="flex-1 p-4 md:p-8 space-y-12 max-w-7xl mx-auto w-full pt-24 md:pt-32 pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="w-6 h-6" />
                </div>
                Proova AI Analytics
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Análise de impacto e conversão da sua autoridade digital.</p>
              <button type="button" onClick={tour.start} className="mt-1 text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1.5"><CircleHelp className="w-3.5 h-3.5" /> Como ler esta página</button>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
            <div data-tour="m-period" className="w-full sm:w-48">
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
              data-tour="m-report"
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

        <section data-tour="m-gboost" className="space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Performance G-Boost</h2>
          </div>
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <div className="flex items-center gap-1.5"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume Total</p><HelpTip text="Quantos depoimentos de pacientes foram aprovados no período escolhido." /></div>
                <BarChart3 className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{stats.total}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Depoimentos aprovados</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <div className="flex items-center gap-1.5"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Média Geral</p><HelpTip text="Nota média (de 1 a 5 estrelas) dos depoimentos aprovados no período escolhido." /></div>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{stats.avgRating}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Estrelas (Rating)</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <div className="flex items-center gap-1.5"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliques no Maps</p><HelpTip text="Quantos pacientes foram encaminhados ao seu perfil do Google para deixar uma avaliação pública. Contagem acumulada desde o início." /></div>
                <MousePointer2 className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{userData?.googleRedirectCount || 0}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Encaminhados G-Boost</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-primary/5 border border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <div className="flex items-center gap-1.5"><p className="text-[10px] font-black uppercase tracking-widest text-primary">Conversão G-Boost Estimada</p><HelpTip text="Proporção entre os pacientes encaminhados ao Google e os depoimentos coletados (acumulado). Quanto maior, mais pacientes estão indo avaliar você no Google." /></div>
                <TrendingUp className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black text-primary">
                  {stats.allTime > 0 ? Math.min(100, Math.round(((userData?.googleRedirectCount || 0) / stats.allTime) * 100)) : 0}%
                </div>
                <p className="text-[9px] text-primary/60 uppercase font-bold">Cliques no Google ÷ depoimentos (acumulado)</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section data-tour="m-bio" className="space-y-6">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Performance Link in Bio</h2>
          </div>
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <div className="flex items-center gap-1.5"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visitas Link in Bio</p><HelpTip text="Quantas vezes a sua página pública (Link in Bio) foi aberta. Contagem acumulada." /></div>
                <Globe className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{userData?.ppVisitCount || 0}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Visualizações da página</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <div className="flex items-center gap-1.5"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliques WhatsApp</p><HelpTip text="Quantas pessoas tocaram no botão de WhatsApp da sua página pública. Contagem acumulada." /></div>
                <MessageCircle className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4">
                <div className="text-2xl font-black">{userData?.whatsappClickCount || 0}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Intenções de contato</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-green-500/5 border border-green-500/10 col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
                <div className="flex items-center gap-1.5"><p className="text-[10px] font-black uppercase tracking-widest text-green-600">Conversão Link in Bio</p><HelpTip text="Entre os visitantes da sua página pública, a porcentagem que clicou para falar com você no WhatsApp." /></div>
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

        <section data-tour="m-charts" className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
             <CardHeader className="p-6 pb-0">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume de Coleta ({period === 'all' ? 'últimos 30 dias' : `${period} dias`})</CardTitle>
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
             <CardContent className="p-6 h-[300px] flex items-center justify-center relative">
                {stats.pieData.length === 0 ? (
                  <p className="text-xs font-bold text-muted-foreground text-center">Ainda não há depoimentos neste período.</p>
                ) : (
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
                )}
                {stats.pieData.length > 0 && (
                <div className="absolute flex flex-col items-center pointer-events-none">
                   <p className="text-2xl font-black">{stats.avgRating}</p>
                   <p className="text-[8px] font-bold uppercase opacity-40">Score</p>
                </div>
                )}
             </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
