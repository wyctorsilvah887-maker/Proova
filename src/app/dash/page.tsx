'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  CheckCircle2, 
  MessageSquare,
  LogOut,
  User,
  Loader2,
  Share2,
  Copy,
  Link2,
  Star,
  Clock,
  Layout,
  LayoutGrid,
  Plus,
  QrCode,
  Download,
  MapPin,
  TrendingUp,
  Shield,
  Edit3,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  TrendingDown,
  Info,
  Monitor,
  Inbox,
  Save,
  Gem,
  ExternalLink,
  Lock,
  AlertTriangle,
  Fingerprint,
  X,
  Megaphone,
  Search,
  Building2,
  Navigation,
  AlertCircle,
  ImageIcon,
  Quote,
  Share,
  Zap,
  MessageCircle,
  Circle,
  Check,
  Calendar,
  Trophy,
  PartyPopper,
  MousePointer2,
  BarChart3,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Timer,
  CheckCircle,
  EyeOff,
  Sparkles,
  Settings2
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { doc, collection, query, updateDoc, orderBy, limit, where, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from 'next-themes';
import { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';
import { searchGooglePlaces, getGooglePlaceDetails } from '@/app/actions/maps-actions';
import { sendWeeklyPerformanceReport } from '@/app/actions/report-actions';
import { approveTestimonialAction, archiveTestimonialAction } from '@/app/actions/testimonial-actions';

interface AuditItem {
  id: string;
  label: string;
  status: 'ok' | 'attention' | 'critical';
  description: string;
  actionLabel: string;
  action: () => void;
  icon: any;
}

export default function DashPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [baseUrl, setBaseUrl] = useState('');
  
  // Period Filtering State
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('7');
  
  // Dialog States
  const [isQrDialogOpenManual, setIsQrDialogOpenManual] = useState(false);
  const [isGoogleMapsDialogOpen, setIsGoogleMapsDialogOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSlugDialogOpen, setIsSlugDialogOpen] = useState(false);
  const [isSocialCardDialogOpen, setIsSocialCardDialogOpen] = useState(false);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  
  // Feature States
  const [newGoogleMapsUrl, setNewGoogleMapsUrl] = useState('');
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<'light' | 'dark'>('light');
  const [selectedTestimonialForCard, setSelectedTestimonialForCard] = useState<any>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [isSharingCard, setIsSharingCard] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [isProcessingCuratorship, setIsProcessingCuratorship] = useState<string | null>(null);

  // Google Search States
  const [googleStep, setGoogleStep] = useState<'info' | 'location' | 'search' | 'manual'>('info');
  const [userCity, setUserCity] = useState('');
  const [userState, setUserState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placeResults, setPlaceResults] = useState<any[]>([]);

  // Audit State
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);

  // Slug States
  const [tempSlug, setTempSlug] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  // Fetch Widgets
  const widgetsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'widgets');
  }, [db, user]);
  const { data: widgetsList } = useCollection(widgetsQuery);

  // Fetch Announcements (SÓ ORDERBY PARA EVITAR ÍNDICE COMPOSTO)
  const announcementsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10));
  }, [db]);
  
  const { data: rawAnnouncements } = useCollection(announcementsQuery);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);

  const currentAnnouncement = useMemo(() => {
    if (!rawAnnouncements) return null;
    return rawAnnouncements.filter((a: any) => a.isActive)[0] || null;
  }, [rawAnnouncements]);

  // Fetch Private Feedbacks
  const privateFeedbacksQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'private_feedbacks');
  }, [db, user]);
  const { data: privateFeedbacksList } = useCollection(privateFeedbacksQuery);

  // Fetch All Testimonials (SÓ ORDERBY PARA EVITAR ÍNDICE COMPOSTO)
  const allTestimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'testimonials'), orderBy('createdAt', 'desc'), limit(100));
  }, [db, user]);
  const { data: allFetchedTestimonials, loading: testimonialsLoading } = useCollection(allTestimonialsQuery);

  // Filtragem de Curadoria e Publicados em memória
  const pendingTestimonials = useMemo(() => {
    return allFetchedTestimonials?.filter((t: any) => t.status === 'pending') || [];
  }, [allFetchedTestimonials]);

  const approvedTestimonials = useMemo(() => {
    return allFetchedTestimonials?.filter((t: any) => t.status === 'approved') || [];
  }, [allFetchedTestimonials]);

  const isProPlan = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'Membro Enterprise';
    if (status === 'gold') return 'Membro Gold';
    if (status === 'trial') return 'Período Trial';
    if (status === 'expired') return 'Plano Expirado';
    return 'Plano Base';
  }, [userData]);

  useEffect(() => {
    if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
  }, []);

  const displayDomain = useMemo(() => {
    if (!baseUrl) return 'proova.wsstudioscompany.com.br';
    try { return new URL(baseUrl).hostname; } catch (e) { return 'proova.wsstudioscompany.com.br'; }
  }, [baseUrl]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const setupSteps = useMemo(() => {
    const s0 = { id: 'location', label: 'Localização', completed: !!userData?.city, unlocked: true, action: () => { setGoogleStep('location'); setIsGoogleMapsDialogOpen(true); } };
    const s1 = { id: 'google', label: 'Google Maps', completed: !!userData?.googleMapsUrl, unlocked: s0.completed, action: () => setIsGoogleMapsDialogOpen(true) };
    const s2 = { id: 'collect', label: 'Coleta Ativa', completed: (userData?.testimonialsCount || 0) > 0, unlocked: s1.completed, action: () => copyToClipboard(`${baseUrl}/c/${userData?.companySlug}`, "Link de coleta") };
    const s3 = { id: 'widget', label: 'Primeiro Mural', completed: !!(widgetsList && widgetsList.length > 0), unlocked: s2.completed, action: () => router.push('/widgets') };
    return [s0, s1, s2, s3];
  }, [userData, widgetsList, baseUrl, router]);

  const completedStepsCount = setupSteps.filter(s => s.completed).length;
  const progressPercentage = (completedStepsCount / setupSteps.length) * 100;
  const isSetupComplete = completedStepsCount === setupSteps.length;
  const isCollectDone = setupSteps.find(s => s.id === 'collect')?.completed;
  const isGoogleDone = setupSteps.find(s => s.id === 'google')?.completed;

  // Lógica do Auditor Consultivo
  useEffect(() => {
    async function runAudit() {
      if (!isSetupComplete || !userData || isAuditing) return;
      setIsAuditing(true);
      const results: AuditItem[] = [];
      const mapsUrl = userData.googleMapsUrl || '';
      const isReviewLink = mapsUrl.includes('writereview') || mapsUrl.includes('local/writereview');
      
      if (!mapsUrl) {
        results.push({ id: 'maps-unlinked', label: 'Google Maps Desconectado', status: 'critical', description: 'Sua empresa não está recebendo redirecionamentos.', actionLabel: 'Vincular Agora', action: () => setIsGoogleMapsDialogOpen(true), icon: MapPin });
      } else if (!isReviewLink) {
        results.push({ id: 'maps-invalid', label: 'Link de Avaliação Indireto', status: 'attention', description: 'Seu link atual não abre direto na caixa de texto do Google.', actionLabel: 'Corrigir Link', action: () => setIsGoogleMapsDialogOpen(true), icon: ShieldAlert });
      }

      if (userData.googlePlaceId) {
        const details = await getGooglePlaceDetails(userData.googlePlaceId);
        if (details) {
          if (!details.hasPhotos) results.push({ id: 'profile-photos', label: 'Perfil Sem Fotos', status: 'attention', description: 'Empresas com fotos recebem 42% mais cliques no Maps.', actionLabel: 'Dica: Adicionar 5 fotos', action: () => window.open(`https://www.google.com/maps/place/?q=place_id:${userData.googlePlaceId}`, '_blank'), icon: Camera });
          if (!details.hasHours) results.push({ id: 'profile-hours', label: 'Horário Pendente', status: 'attention', description: 'Clientes evitam empresas sem horário de funcionamento.', actionLabel: 'Configurar no Google', action: () => window.open(`https://business.google.com/`, '_blank'), icon: Timer });
        }
      }

      const publicCount = userData.testimonialsCount || 0;
      const privateCount = privateFeedbacksList?.length || 0;
      if (privateCount > 0 && publicCount === 0) results.push({ id: 'feedback-imbalance', label: 'Elogios Ocultos', status: 'critical', description: `Você tem ${privateCount} feedbacks no privado e nada no site.`, actionLabel: 'Publicar Melhores', action: () => router.push('/widgets'), icon: MessageSquare });

      setAuditItems(results);
      setIsAuditing(false);
    }
    runAudit();
  }, [isSetupComplete, userData, widgetsList, privateFeedbacksList, router]);

  const handleApproveTestimonial = async (id: string) => {
    if (!user || isProcessingCuratorship) return;
    setIsProcessingCuratorship(id);
    try {
      const res = await approveTestimonialAction(user.uid, id);
      if (res.success) toast({ title: "Publicado!" }); else throw new Error(res.error);
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); } finally { setIsProcessingCuratorship(null); }
  };

  const handleArchiveTestimonial = async (id: string) => {
    if (!user || isProcessingCuratorship) return;
    setIsProcessingCuratorship(id);
    try {
      const res = await archiveTestimonialAction(user.uid, id);
      if (res.success) toast({ title: "Arquivado" }); else throw new Error(res.error);
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); } finally { setIsProcessingCuratorship(null); }
  };

  const filteredMetrics = useMemo(() => {
    const testimonials = approvedTestimonials;
    const now = new Date();
    if (period === 'all') return { count: userData?.testimonialsCount || 0, displayList: testimonials.slice(0, 5), trendLabel: 'Total acumulado' };
    const days = parseInt(period);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const periodTestimonials = testimonials.filter(t => (t.createdAt?.toDate?.() || new Date()) >= cutoff);
    return { count: periodTestimonials.length, displayList: periodTestimonials.slice(0, 5), trendLabel: `Últimos ${days} dias` };
  }, [approvedTestimonials, period, userData]);

  const copyToClipboard = (text: string, description: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${description} copiado.` });
  };

  const handleUpdateGoogleMapsUrl = async (customUrl?: string, placeId?: string) => {
    if (!db || !user || isUpdatingUrl) return;
    setIsUpdatingUrl(true);
    const finalUrl = customUrl || newGoogleMapsUrl;
    updateDoc(doc(db, 'users', user.uid), { googleMapsUrl: finalUrl.trim(), googlePlaceId: placeId || userData?.googlePlaceId || '' })
      .then(() => { toast({ title: "Link Atualizado" }); setIsGoogleMapsDialogOpen(false); setGoogleStep('info'); })
      .finally(() => setIsUpdatingUrl(false));
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF();
      pdf.text('CARTAZ PROOVA', 105, 20, { align: 'center' });
      pdf.text(userData?.companyName || 'Sua Empresa', 105, 40, { align: 'center' });
      pdf.save(`cartaz-proova-${userData?.companySlug}.pdf`);
      toast({ title: "PDF Gerado!" });
    } catch (err) { toast({ variant: "destructive", title: "Erro no PDF" }); } finally { setIsGeneratingPdf(false); }
  };

  const handleSendWeeklyReport = async () => {
    if (!user) return;
    setIsSendingReport(true);
    try {
      const result = await sendWeeklyPerformanceReport(user.uid);
      if (result.success) toast({ title: "Relatório Enviado!" }); else throw new Error(result.error);
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); } finally { setIsSendingReport(false); }
  };

  if (authLoading || userDataLoading || (user && !userData)) {
    return <div className="flex h-screen items-center justify-center bg-muted/30"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></div>;
  }

  const collectionLink = `${baseUrl}/c/${userData?.companySlug}`;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
      {/* GLOBAL ANNOUNCEMENT BANNER */}
      {currentAnnouncement && !isAnnouncementDismissed && (
        <div className={cn(
          "w-full py-3 flex items-center relative overflow-hidden transition-all duration-500 z-[100] border-b border-white/10",
          currentAnnouncement.type === 'info' && "bg-blue-600 text-white",
          currentAnnouncement.type === 'warning' && "bg-orange-500 text-white",
          currentAnnouncement.type === 'success' && "bg-green-600 text-white",
          currentAnnouncement.type === 'destructive' && "bg-red-600 text-white"
        )}>
          <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
          <div className="flex-1 overflow-hidden flex items-center relative z-10 px-4">
            <Megaphone className="w-4 h-4 mr-3 shrink-0" />
            <span className="font-black uppercase tracking-widest text-[11px] mr-2">{currentAnnouncement.title}:</span>
            <p className="text-[11px] md:text-sm font-bold opacity-95 truncate">{currentAnnouncement.message}</p>
          </div>
          <button onClick={() => setIsAnnouncementDismissed(true)} className="p-2.5 mr-2 rounded-full hover:bg-white/10 transition-colors shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[120px] transition-colors group-hover:text-primary leading-tight">{userData?.companyName || 'Minha Empresa'}</span>
                  <span className={cn("text-[8px] uppercase tracking-widest font-black leading-tight", userData?.membershipStatus === 'enterprise' ? "text-primary animate-pulse" : "text-muted-foreground")}>{membershipLabel}</span>
                </div>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 transition-colors"><User className="w-4 h-4" /></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5 bg-primary/5 text-primary"><TrendingUp className="mr-2 h-4 w-4" /><span>Dash</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5"><Layout className="mr-2 h-4 w-4 text-primary" /><span>Meus Widgets</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/private')} className="rounded-xl cursor-pointer font-bold py-2.5"><Inbox className="mr-2 h-4 w-4 text-primary" /><span>Inbox Privado</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5"><Gem className="mr-2 h-4 w-4 text-primary" /><span>Upgrade</span></DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl cursor-pointer font-bold py-2.5">{theme === 'light' ? <Moon className="mr-2 h-4 w-4 text-primary" /> : <Sun className="mr-2 h-4 w-4 text-primary" />}<span>Tema</span></DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-pointer font-bold py-2.5"><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        {!isSetupComplete && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-1000">
            <Card className="border-none shadow-xl overflow-hidden rounded-[2rem] bg-card p-5 md:p-8 space-y-4 md:space-y-6">
              <div className="space-y-1 md:space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm md:text-lg font-black font-headline uppercase tracking-tight flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Missões de Sucesso</h2>
                  <span className="text-xs md:text-sm font-black text-primary">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-muted rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {setupSteps.map((step) => (
                  <div key={step.id} onClick={step.unlocked && !step.completed ? step.action : undefined} className={cn("flex items-center gap-3 p-3 rounded-2xl border transition-all", step.completed ? "bg-green-500/5 border-green-500/20 opacity-80" : step.unlocked ? "bg-background border-primary/20 hover:border-primary cursor-pointer shadow-sm" : "bg-muted/30 border-muted opacity-40 grayscale cursor-not-allowed")}>
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", step.completed ? "bg-green-500 text-white shadow-lg" : step.unlocked ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted border border-border")}>
                      {step.completed ? <Check className="w-4 h-4 stroke-[3]" /> : <Circle className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0"><span className={cn("text-[11px] font-bold uppercase tracking-tight block truncate", step.completed ? "text-green-600 line-through opacity-60" : "text-foreground")}>{step.label}</span></div>
                    {step.unlocked && !step.completed && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {pendingTestimonials.length > 0 && (
          <section className="space-y-4 animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2"><Sparkles className="w-4 h-4 animate-pulse" /> Fila de Curadoria Inteligente</h2>
              <Badge className="bg-primary text-white text-[8px] font-black h-5">{pendingTestimonials.length} PENDENTES</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {pendingTestimonials.map((t: any) => (
                <Card key={t.id} className="border-2 border-primary/20 shadow-lg bg-card overflow-hidden rounded-2xl p-5 md:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl"><User className="w-5 h-5 text-primary" /></div>
                    <div className="space-y-1"><p className="font-bold text-sm">{t.userName}</p><div className="flex gap-0.5">{Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}</div></div>
                  </div>
                  <p className="text-xs md:text-sm italic leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-xl border-l-4 border-primary">"{t.text}"</p>
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 h-11 rounded-xl font-bold gap-2 shadow-md" disabled={!!isProcessingCuratorship} onClick={() => handleApproveTestimonial(t.id)}>{isProcessingCuratorship === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Publicar no Site</Button>
                    <Button variant="outline" className="h-11 rounded-xl font-bold" disabled={!!isProcessingCuratorship} onClick={() => handleArchiveTestimonial(t.id)}><EyeOff className="w-4 h-4" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {isSetupComplete && (
          <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /><h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Auditoria Consultiva Proova</h2></div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {auditItems.length > 0 ? auditItems.map((item) => (
                <Card key={item.id} className={cn("border-none shadow-sm overflow-hidden rounded-2xl relative", item.status === 'critical' ? "bg-destructive/5" : "bg-orange-500/5")}>
                  <div className={cn("absolute top-0 left-0 w-1.5 h-full", item.status === 'critical' ? "bg-destructive" : "bg-orange-500")} />
                  <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                    <div className="flex gap-3">
                      <div className={cn("p-2 rounded-xl shrink-0", item.status === 'critical' ? "bg-destructive/10 text-destructive" : "bg-orange-500/10 text-orange-600")}><item.icon className="w-5 h-5" /></div>
                      <div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-tight">{item.label}</p><p className="text-[11px] text-muted-foreground leading-snug">{item.description}</p></div>
                    </div>
                    <Button size="sm" variant="secondary" className="w-full text-[10px] font-black uppercase h-8 rounded-lg shadow-sm" onClick={item.action}>{item.actionLabel} <ArrowRight className="ml-1 w-3 h-3" /></Button>
                  </CardContent>
                </Card>
              )) : (
                <Card className="md:col-span-2 lg:col-span-3 border-none shadow-sm bg-green-500/5 overflow-hidden rounded-2xl p-6 flex items-center gap-4">
                  <div className="bg-green-500/10 p-3 rounded-full text-green-600"><PartyPopper className="w-8 h-8" /></div>
                  <div className="space-y-1"><h3 className="font-black font-headline text-green-700">Tudo impecável!</h3><p className="text-sm text-green-600/80 font-medium">Sua conta passou em todos os testes de saúde digital e SEO local.</p></div>
                </Card>
              )}
            </div>
          </section>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-3"><h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">Painel de Controle</h1><Button variant="ghost" size="sm" onClick={() => setIsTutorialOpen(true)} className="rounded-full gap-1.5 text-[10px] font-bold h-7 border border-primary/20 text-primary hover:bg-primary/5"><Info className="w-3.5 h-3.5" /> Tutorial</Button></div>
            <p className="text-xs md:text-base text-muted-foreground">Gestão de prova social dinâmica</p>
          </div>
          <div className="w-full sm:w-48">
            <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
              <SelectTrigger className="h-11 rounded-xl bg-background border-primary/20 text-[11px] font-bold uppercase tracking-wider focus:ring-primary/20"><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent align="end" className="rounded-xl"><SelectItem value="7" className="text-xs font-medium">Últimos 7 dias</SelectItem><SelectItem value="30" className="text-xs font-medium">Últimos 30 dias</SelectItem><SelectItem value="all" className="text-xs font-medium">Todo o período</SelectItem></SelectContent>
            </Select>
          </div>
        </header>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          <Card className="border-none shadow-sm overflow-hidden rounded-2xl p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Resumo {period !== 'all' ? `(${period}d)` : ''}</CardTitle><button onClick={handleSendWeeklyReport} disabled={isSendingReport} className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline disabled:opacity-50">{isSendingReport ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Mail className="w-2.5 h-2.5" />} Enviar Relatório</button></div>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1"><div className="text-xl md:text-3xl font-bold">{filteredMetrics.count} <span className="text-sm md:text-lg font-medium text-muted-foreground">avaliações</span></div><Badge variant="secondary" className="border-none text-[8px] md:text-[10px] h-4 md:h-5 px-1.5 font-black bg-primary/10 text-primary">{filteredMetrics.trendLabel}</Badge></div>
          </Card>
          <Card className="border-none shadow-sm overflow-hidden rounded-2xl p-4 md:p-6 space-y-4 relative group">
            <div onClick={() => { setNewGoogleMapsUrl(userData?.googleMapsUrl || ''); setGoogleStep(userData?.googleMapsUrl ? 'manual' : 'info'); setIsGoogleMapsDialogOpen(true); }} className="absolute -top-2 right-4 z-40 bg-primary text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-all flex items-center gap-1.5 ring-2 ring-white">Editar</div>
            <div className="flex items-center justify-between"><CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Cliques Google</CardTitle><MousePointer2 className="h-4 w-4 text-primary" /></div>
            <div className="flex items-center gap-2"><div className="text-xl md:text-2xl font-bold">{userData?.googleRedirectCount || 0}</div>{userData?.googleMapsUrl ? <Badge variant="secondary" className="text-[8px] md:text-[10px] h-4 md:h-5 bg-primary/10 text-primary border-none">G-Boost Ativo</Badge> : <Badge variant="outline" className="text-[8px] h-4 md:h-5 opacity-50 uppercase font-black">Pendente</Badge>}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Visitantes redirecionados ao Maps.</p>
          </Card>
        </div>

        <section className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" disabled={!isGoogleDone} onClick={() => copyToClipboard(collectionLink, "Link de coleta")} className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all"><Link2 className="w-5 h-5 text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Copiar Link</span></Button>
            <Button variant="outline" disabled={!isGoogleDone} onClick={() => setIsQrDialogOpenManual(true)} className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all"><QrCode className="w-5 h-5 text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Ver Cartaz</span></Button>
            <Button variant="outline" disabled={!isCollectDone} onClick={() => router.push('/widgets')} className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all"><Layout className="w-5 h-5 text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Meus Murais</span></Button>
            <Button variant="outline" disabled={!isSetupComplete} onClick={() => router.push('/private')} className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all"><Inbox className="w-5 h-5 text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Ver Inbox</span></Button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /><h2 className="text-lg md:text-xl font-bold font-headline tracking-tight">Depoimentos Publicados</h2></div><Link href="/private"><Button variant="outline" size="sm" className="rounded-full gap-2 text-[10px] h-7 border-primary/20 text-primary hover:bg-primary/5"><Inbox className="w-3 h-3" /> Inbox Privado</Button></Link></div>
          <div className="grid gap-3 md:gap-4">
            {testimonialsLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div> : filteredMetrics.displayList.length > 0 ? filteredMetrics.displayList.map((t: any) => (
              <Card key={t.id} className="border-none shadow-sm overflow-hidden rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-xl hidden sm:block"><User className="w-4 h-4 text-primary" /></div>
                  <div className="space-y-1 min-w-0"><div className="flex flex-col space-y-0.5"><span className="font-bold text-xs truncate">{t.userName}</span><div className="flex gap-0.5">{Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-primary text-primary" />)}</div></div><p className="text-[10px] md:text-xs text-foreground italic line-clamp-2">"{t.text}"</p></div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0"><div className="flex items-center gap-1 text-[8px] md:text-[10px] text-muted-foreground font-medium"><Clock className="w-3 h-3" />{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}</div></div>
              </Card>
            )) : <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/10 opacity-40"><MessageSquare className="w-10 h-10 mx-auto mb-3" /><p className="text-sm">Nenhum depoimento publicado ainda.</p></div>}
          </div>
        </section>
      </main>

      <footer className="py-12 border-t mt-auto flex flex-col items-center gap-8 bg-background/50 text-center"><div className="relative w-[180px] h-[60px] opacity-40 grayscale"><Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain dark:hidden" /><Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain hidden dark:block" /></div><p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-30">© 2026 Proova Technology</p></footer>

      {/* DIALOGS SIMPLIFICADOS */}
      <Dialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl overflow-hidden p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 pt-16 pb-4 shrink-0 bg-background"><DialogTitle className="text-2xl font-black font-headline">Guia Estratégico</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1 p-8 pt-0 space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0"><Sparkles className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold">Fila de Curadoria</p><p className="text-xs text-muted-foreground leading-relaxed">Depoimentos qualificados aparecem aqui. Com 1 clique, eles vão direto para seu site.</p></div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0"><ShieldCheck className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold">Consultor Proova</p><p className="text-xs text-muted-foreground leading-relaxed">Seu auditor de SEO local. Ele avisa sobre fotos ausentes e falhas de conversão no Google.</p></div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0"><Inbox className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold">Inbox Privado</p><p className="text-xs text-muted-foreground leading-relaxed">Resolva críticas em sigilo e evite danos à sua imagem pública.</p></div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 pt-4 pb-8 bg-background border-t"><Button className="w-full font-black h-12 rounded-2xl shadow-xl" onClick={() => setIsTutorialOpen(false)}>Dominar Meu Painel</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isGoogleMapsDialogOpen} onOpenChange={setIsGoogleMapsDialogOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md"><DialogHeader><DialogTitle className="text-2xl font-black font-headline flex items-center gap-2"><MapPin className="w-6 h-6 text-primary" /> Google Business</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-xs text-muted-foreground text-center">Configuraremos seu link oficial para turbinar seu SEO Local.</p>
            <Input placeholder="Link Direto do Google Maps" value={newGoogleMapsUrl} onChange={(e) => setNewGoogleMapsUrl(e.target.value)} className="h-12 rounded-xl" />
            <Button className="w-full font-black h-12 rounded-xl shadow-xl" onClick={() => handleUpdateGoogleMapsUrl()} disabled={isUpdatingUrl || !newGoogleMapsUrl}>Salvar Link</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isQrDialogOpenManual} onOpenChange={setIsQrDialogOpenManual}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl p-8 space-y-6 text-center">
          <DialogTitle className="text-2xl font-black font-headline">Cartaz de Balcão</DialogTitle>
          <div className="p-6 bg-white rounded-3xl shadow-inner border-4 border-primary/10 flex justify-center"><QRCodeSVG value={collectionLink} size={180} level="H" /></div>
          <Button className="w-full h-14 rounded-2xl text-lg font-black shadow-xl gap-2" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>{isGeneratingPdf ? <Loader2 className="animate-spin" /> : <Download className="w-5 h-5" />}Baixar PDF</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
