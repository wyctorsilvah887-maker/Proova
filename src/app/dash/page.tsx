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
  Settings2,
  Globe,
  Rocket,
  MapPinned,
  Handshake,
  Play
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
import { doc, collection, query, updateDoc, orderBy, limit, where, getDocs, Timestamp, serverTimestamp, arrayUnion } from 'firebase/firestore';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from 'next-themes';
import { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';
import { getGooglePlaceDetails, searchGooglePlaces } from '@/app/actions/maps-actions';
import { sendWeeklyPerformanceReport } from '@/app/actions/report-actions';

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
  
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('7');
  const [isQrDialogOpenManual, setIsQrDialogOpenManual] = useState(false);
  const [isGoogleMapsDialogOpen, setIsGoogleMapsDialogOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [configMode, setConfigMode] = useState<'location' | 'maps'>('location');
  
  const [newGoogleMapsUrl, setNewGoogleMapsUrl] = useState('');
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Estados para Busca de Local
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const isPremiumUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const isEnterpriseUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'enterprise';
  }, [userData]);

  const widgetsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'widgets');
  }, [db, user]);
  const { data: widgetsList } = useCollection(widgetsQuery);

  const announcementsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'announcements');
  }, [db]);
  
  const { data: announcementsList } = useCollection(announcementsQuery);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);

  const currentAnnouncement = useMemo(() => {
    if (!announcementsList) return null;
    return (announcementsList as any[])
      .filter((a: any) => a.isActive)
      .sort((a: any, b: any) => {
        const da = a.createdAt?.toDate?.() || new Date(0);
        const db = b.createdAt?.toDate?.() || new Date(0);
        return db.getTime() - da.getTime();
      })[0] || null;
  }, [announcementsList]);

  const allTestimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'testimonials');
  }, [db, user]);
  const { data: allFetchedTestimonials, loading: testimonialsLoading } = useCollection(allTestimonialsQuery);

  const pendingTestimonialsCount = useMemo(() => {
    return (allFetchedTestimonials || []).filter((t: any) => t.status === 'pending').length;
  }, [allFetchedTestimonials]);

  const approvedTestimonials = useMemo(() => {
    return (allFetchedTestimonials || [])
      .filter((t: any) => t.status === 'approved')
      .sort((a: any, b: any) => {
        const da = a.createdAt?.toDate?.() || new Date(0);
        const db = b.createdAt?.toDate?.() || new Date(0);
        return db.getTime() - da.getTime();
      });
  }, [allFetchedTestimonials]);

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

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const setupSteps = useMemo(() => {
    const s0 = { 
      id: 'location', 
      label: 'Localização', 
      completed: !!userData?.city, 
      unlocked: true, 
      action: () => {
        setConfigMode('location');
        setIsGoogleMapsDialogOpen(true);
      } 
    };
    const s1 = { 
      id: 'google', 
      label: 'Google Maps', 
      completed: !!userData?.googleMapsUrl, 
      unlocked: s0.completed, 
      action: () => {
        setConfigMode('maps');
        setIsGoogleMapsDialogOpen(true);
      } 
    };
    const s2 = { id: 'collect', label: 'Coleta Ativa', completed: (userData?.testimonialsCount || 0) > 0, unlocked: s1.completed, action: () => copyToClipboard(`${baseUrl}/c/${userData?.companySlug}`, "Link de coleta") };
    const s3 = { id: 'widget', label: 'Primeiro Mural', completed: !!(widgetsList && widgetsList.length > 0), unlocked: s2.completed, action: () => router.push('/widgets') };
    return [s0, s1, s2, s3];
  }, [userData, widgetsList, baseUrl, router]);

  const completedStepsCount = setupSteps.filter(s => s.completed).length;
  const progressPercentage = (completedStepsCount / setupSteps.length) * 100;
  const isSetupComplete = completedStepsCount === setupSteps.length;
  const isCollectDone = setupSteps.find(s => s.id === 'collect')?.completed;
  const isGoogleDone = setupSteps.find(s => s.id === 'google')?.completed;

  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    async function runAudit() {
      if (!isSetupComplete || !userData) return;
      setIsAuditing(true);
      const results: AuditItem[] = [];

      if (pendingTestimonialsCount > 0) {
        results.push({ 
          id: 'curatorship-pending', 
          label: 'Elogios para Aprovar', 
          status: 'critical', 
          description: `Você tem ${pendingTestimonialsCount} novos elogios que ainda não estão no seu site.`, 
          actionLabel: 'Ir para Curadoria', 
          action: () => router.push('/private'), 
          icon: Sparkles 
        });
      }

      const mapsUrl = userData.googleMapsUrl || '';
      const isReviewLink = mapsUrl.includes('writereview') || mapsUrl.includes('local/writereview');
      
      if (!mapsUrl) {
        results.push({ id: 'maps-unlinked', label: 'Google Maps Desconectado', status: 'critical', description: 'Sua empresa não está recebendo redirecionamentos.', actionLabel: 'Vincular Agora', action: () => { setConfigMode('maps'); setIsGoogleMapsDialogOpen(true); }, icon: MapPin });
      } else if (!isReviewLink) {
        results.push({ id: 'maps-invalid', label: 'Link de Avaliação Indireto', status: 'attention', description: 'Seu link atual não abre direto na caixa de texto do Google.', actionLabel: 'Corrigir Link', action: () => { setConfigMode('maps'); setIsGoogleMapsDialogOpen(true); }, icon: ShieldAlert });
      }

      // Auditoria Avançada (Consultor Proova - Apenas Enterprise)
      if (userData.googlePlaceId && isEnterpriseUser) {
        const details = await getGooglePlaceDetails(userData.googlePlaceId);
        if (details) {
          if (!details.hasPhotos) results.push({ id: 'profile-photos', label: 'Perfil Sem Fotos', status: 'attention', description: 'Empresas com fotos recebem 42% mais cliques no Maps.', actionLabel: 'Adicionar Fotos', action: () => window.open(`https://www.google.com/maps/place/?q=place_id:${userData.googlePlaceId}`, '_blank'), icon: Camera });
          if (!details.hasHours) results.push({ id: 'profile-hours', label: 'Horário Pendente', status: 'attention', description: 'Clientes evitam empresas sem horário de funcionamento.', actionLabel: 'Configurar no Google', action: () => window.open(`https://business.google.com/`, '_blank'), icon: Timer });
        }
      }

      setAuditItems(results);
      setIsAuditing(false);
    }
    runAudit();
  }, [isSetupComplete, userData, widgetsList, pendingTestimonialsCount, router, isEnterpriseUser]);

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

  const handleUpdateGoogleMapsUrl = async () => {
    if (!db || !user || isUpdatingUrl) return;
    setIsUpdatingUrl(true);
    updateDoc(doc(db, 'users', user.uid), { googleMapsUrl: newGoogleMapsUrl.trim() })
      .then(() => { toast({ title: "Link Atualizado" }); setIsGoogleMapsDialogOpen(false); })
      .finally(() => setIsUpdatingUrl(false));
  };

  const handleSearchPlaces = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingPlaces(true);
    try {
      const results = await searchGooglePlaces(searchQuery, city || userData?.city, state || userData?.state);
      setSearchResults(results);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro na busca" });
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleSelectPlace = async (place: any) => {
    if (!db || !user || isUpdatingUrl) return;
    setIsUpdatingUrl(true);
    
    const reviewLink = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        googlePlaceId: place.place_id,
        googleMapsUrl: reviewLink,
        city: city || userData?.city || '',
        state: state || userData?.state || ''
      });
      toast({ title: "Empresa Vinculada!", description: "Seu G-Boost está ativo." });
      setIsGoogleMapsDialogOpen(false);
      setSearchResults([]);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao salvar" });
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!db || !user || !city || !state) return;
    setIsUpdatingUrl(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { city, state });
      toast({ title: "Localização Salva" });
      setIsGoogleMapsDialogOpen(false); 
      setSearchQuery('');
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao salvar local" });
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  useEffect(() => {
    if (isGoogleMapsDialogOpen && userData) {
      setCity(userData.city || '');
      setState(userData.state || '');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isGoogleMapsDialogOpen, userData]);

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
    if (!isPremiumUser) {
      router.push('/pricing');
      return;
    }
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
                  <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[120px] leading-tight">{userData?.companyName || 'Minha Empresa'}</span>
                  <span className={cn("text-[8px] uppercase tracking-widest font-black leading-tight", userData?.membershipStatus === 'enterprise' ? "text-primary animate-pulse" : "text-muted-foreground")}>{membershipLabel}</span>
                </div>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors"><User className="w-4 h-4" /></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5 bg-primary/5 text-primary">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span>Dash</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => isCollectDone && router.push('/widgets')} 
                className={cn(
                  "rounded-xl cursor-pointer font-bold py-2.5",
                  !isCollectDone && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                <Layout className="mr-2 h-4 w-4 text-primary" />
                <span>Meus Widgets</span>
                {!isCollectDone && <Lock className="ml-auto w-3 h-3 opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => isSetupComplete && router.push('/private')} 
                className={cn(
                  "rounded-xl cursor-pointer font-bold py-2.5",
                  !isSetupComplete && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                <Inbox className="mr-2 h-4 w-4 text-primary" />
                <span>Inbox Privado</span>
                {!isSetupComplete && <Lock className="ml-auto w-3 h-3 opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Upgrade</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/partners')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Handshake className="mr-2 h-4 w-4 text-primary" />
                <span>Serviços de Parceiros</span>
              </DropdownMenuItem>

              {userData?.isAdmin && (
                <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-xl cursor-pointer font-bold py-2.5">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  <span>Administração</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl cursor-pointer font-bold py-2.5">{theme === 'light' ? <Moon className="mr-2 h-4 w-4 text-primary" /> : <Sun className="mr-2 h-4 w-4 text-primary" />}<span>Tema</span></DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-pointer font-bold py-2.5"><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* CHECKLIST DE MISSÕES (ONBOARDING) */}
        {!isSetupComplete && (
          <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-black uppercase tracking-widest">Missões de Sucesso Proova</h2>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[10px]">
                  {completedStepsCount} / {setupSteps.length} COMPLETAS
                </Badge>
             </div>
             
             <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-background">
                <div className="p-6 md:p-8 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Progresso do Setup</span>
                      <span className="text-primary">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2.5 bg-muted" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {setupSteps.map((step, idx) => (
                      <div 
                        key={step.id}
                        onClick={() => step.unlocked && step.action()}
                        className={cn(
                          "relative p-4 rounded-2xl border-2 transition-all cursor-pointer group",
                          step.completed 
                            ? "bg-primary/5 border-primary/20" 
                            : (step.unlocked ? "bg-background border-dashed border-muted-foreground/30 hover:border-primary/50" : "bg-muted/30 border-transparent opacity-40 cursor-not-allowed")
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                            step.completed ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                          )}>
                            {step.completed ? <Check className="w-4 h-4" /> : <span className="text-xs font-black">{idx + 1}</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-tight truncate">{step.label}</p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">{step.completed ? 'Concluído' : (step.unlocked ? 'Pendente' : 'Bloqueado')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             </Card>
          </section>
        )}

        {isSetupComplete && auditItems.length > 0 && (
          <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {isEnterpriseUser ? "Auditoria Consultiva Proova" : "Ações de Reputação"}
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {auditItems.map((item) => (
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
              ))}
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
              <div className="space-y-0.5">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Resumo {period !== 'all' ? `(${period}d)` : ''}</CardTitle>
                <button 
                  onClick={handleSendWeeklyReport} 
                  disabled={isSendingReport} 
                  className={cn(
                    "text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline disabled:opacity-50",
                    isPremiumUser ? "text-primary" : "text-muted-foreground opacity-50"
                  )}
                >
                  {isSendingReport ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Mail className="w-2.5 h-2.5" />} 
                  {!isPremiumUser && <Lock className="w-2 h-2" />} 
                  Enviar Relatório
                </button>
              </div>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1"><div className="text-xl md:text-3xl font-bold">{filteredMetrics.count} <span className="text-sm md:text-lg font-medium text-muted-foreground">avaliações</span></div><Badge variant="secondary" className="border-none text-[8px] md:text-[10px] h-4 md:h-5 px-1.5 font-black bg-primary/10 text-primary">{filteredMetrics.trendLabel}</Badge></div>
          </Card>
          
          <div className="relative h-full group">
             <div 
               onClick={() => { setConfigMode('maps'); setIsGoogleMapsDialogOpen(true); }} 
               className="absolute top-2 right-4 px-2 py-0.5 z-40 bg-primary text-white text-[7px] font-black uppercase rounded-full shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center gap-1 border-none"
             >
               <Edit3 className="w-2 h-2" /> Editar
             </div>
             <Card className="border-none shadow-sm h-full rounded-2xl p-4 md:p-6 space-y-4 relative flex flex-col justify-center overflow-visible">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Cliques Google</CardTitle>
                <MousePointer2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xl md:text-2xl font-bold">{userData?.googleRedirectCount || 0}</div>
                {userData?.googleMapsUrl ? <Badge variant="secondary" className="text-[8px] md:text-[10px] h-4 md:h-5 bg-primary/10 text-primary border-none">G-Boost Ativo</Badge> : <Badge variant="outline" className="text-[8px] h-4 md:h-5 opacity-50 uppercase font-black">Pendente</Badge>}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">Visitantes redirecionados ao Maps.</p>
            </Card>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" disabled={!isGoogleDone} onClick={() => copyToClipboard(collectionLink, "Link de coleta")} className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all"><Link2 className="w-5 h-5 text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Copiar Link</span></Button>
            <Button variant="outline" disabled={!isGoogleDone} onClick={() => setIsQrDialogOpenManual(true)} className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all"><QrCode className="w-5 h-5 text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Ver Cartaz</span></Button>
            <Button variant="outline" disabled={!isCollectDone} onClick={() => router.push('/widgets')} className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all"><Layout className="w-5 h-5 text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Meus Murais</span></Button>
            <Button variant="outline" disabled={!isSetupComplete} onClick={() => router.push('/private')} className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all relative">
              <Inbox className="w-5 h-5 text-primary" />
              {pendingTestimonialsCount > 0 && (
                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-lg animate-in zoom-in duration-300">
                  {pendingTestimonialsCount}
                </span>
              )}
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Ver Inbox</span>
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-lg md:text-xl font-bold font-headline tracking-tight">Últimos Depoimentos Publicados</h2>
            </div>
            <Link href={isSetupComplete ? "/private" : "#"} onClick={(e) => !isSetupComplete && e.preventDefault()}>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!isSetupComplete}
                className={cn(
                  "rounded-full gap-2 text-[10px] h-7 border border-primary/20 text-primary hover:bg-primary/5 relative",
                  !isSetupComplete && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                {isSetupComplete ? <Inbox className="w-3 h-3" /> : <Lock className="w-3 h-3" />} 
                Ver Inbox Unificado
                {isSetupComplete && pendingTestimonialsCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 px-1.5 text-[8px] font-black animate-pulse">
                    {pendingTestimonialsCount} NOVOS
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
          <div className="grid gap-3 md:gap-4">
            {testimonialsLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div> : filteredMetrics.displayList.length > 0 ? filteredMetrics.displayList.map((t: any) => (
              <Card key={t.id} className="border-none shadow-sm overflow-hidden rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
                <div className="flex items-start gap-4">
                  {t.videoUrl ? (
                    <div 
                      className={cn(
                        "relative rounded-lg overflow-hidden bg-black shrink-0 border border-primary/10 transition-all hidden sm:block",
                        playingVideoId === t.id ? "w-48 h-32 md:w-64 md:h-40" : "w-16 h-12 md:w-24 md:h-16 cursor-pointer hover:border-primary/30"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingVideoId(playingVideoId === t.id ? null : t.id);
                      }}
                    >
                      {playingVideoId === t.id ? (
                        <video 
                          src={t.videoUrl} 
                          className="w-full h-full object-contain"
                          autoPlay
                          controls
                          playsInline
                          controlsList="nodownload noplaybackrate noremoteplayback"
                          disablePictureInPicture
                          disableRemotePlayback
                        />
                      ) : (
                        <>
                          <video 
                            src={t.videoUrl} 
                            className="w-full h-full object-cover opacity-60"
                            muted
                            autoPlay
                            loop
                            playsInline
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-white drop-shadow-lg" />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="bg-primary/10 p-2 rounded-xl hidden sm:block"><User className="w-4 h-4 text-primary" /></div>
                  )}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-col space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs truncate">{t.userName}</span>
                        {t.videoUrl && <Badge variant="secondary" className="h-4 px-1 text-[7px] font-black uppercase bg-primary/10 text-primary border-none">Vídeo</Badge>}
                      </div>
                      <div className="flex gap-0.5">{Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-primary text-primary" />)}</div>
                    </div>
                    <p className="text-[10px] md:text-xs text-foreground italic line-clamp-2">"{t.text}"</p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                  <div className="flex items-center gap-1 text-[8px] md:text-[10px] text-muted-foreground font-medium"><Clock className="w-3 h-3" />{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}</div>
                </div>
              </Card>
            )) : <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/10 opacity-40"><MessageSquare className="w-10 h-10 mx-auto mb-3" /><p className="text-sm">Nenhum depoimento publicado ainda.</p></div>}
          </div>
        </section>
      </main>

      <footer className="py-12 border-t mt-auto flex flex-col items-center gap-8 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[200px] h-[65px] md:w-[320px] md:h-[105px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="object-contain dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block" priority />
        </div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60">© 2026 Proova Technology</p>
      </footer>

      <Dialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl overflow-hidden p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 pt-16 pb-4 shrink-0 bg-background">
            <DialogTitle className="text-2xl font-black font-headline flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" /> Guia Estratégico Proova
            </DialogTitle>
            <DialogDescription>Domine as ferramentas que aceleram sua autoridade.</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
            <div className="space-y-8">
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 group-hover:bg-primary group-hover:text-white transition-colors"><Inbox className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Inbox de Moderação Unificado</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Centralizamos tudo o que entra: elógios para aprovar e feedbacks privados. É sua torre de comando de reputação.</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 group-hover:bg-primary group-hover:text-white transition-colors"><ShieldCheck className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Consultor Proova</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Seu auditor de SEO Local. Ele avisa sobre falhas no link do Google, elogios pendentes de aprovação ou horários desatualizados.</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 group-hover:bg-primary group-hover:text-white transition-colors"><BarChart3 className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Resumos e Filtros</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Filtre seus resultados por períodos (7d, 30d ou Total) para entender o ritmo de crescimento da sua prova social.</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 group-hover:bg-primary group-hover:text-white transition-colors"><MousePointer2 className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Cliques e G-Boost</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Monitore quantos clientes o Proova enviou diretamente para o seu perfil no Google Maps para te avaliar 5 estrelas.</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 group-hover:bg-primary group-hover:text-white transition-colors"><Zap className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Ações Rápidas</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Acessos rápidos para copiar seu link, baixar o cartaz de balcão ou gerenciar seus murais embutidos.</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 group-hover:bg-primary group-hover:text-white transition-colors"><Mail className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Relatórios por E-mail</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Receba uma auditoria de performance semanal no seu e-mail clicando em "Enviar Relatório" no card de Resumo.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 pt-4 pb-8 bg-background border-t shrink-0">
            <Button className="w-full font-black h-12 rounded-2xl shadow-xl" onClick={() => setIsTutorialOpen(false)}>Dominar Meu Painel</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* DIALOGO DE CONFIGURAÇÃO DE BUSINESS (Maps + Location) */}
      <Dialog open={isGoogleMapsDialogOpen} onOpenChange={setIsGoogleMapsDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl overflow-hidden p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-2 pt-10 shrink-0 bg-background">
            <DialogTitle className="text-2xl font-black font-headline flex items-center gap-2">
              <MapPinned className="w-6 h-6 text-primary" /> {configMode === 'location' ? 'Localização' : 'Perfil Comercial'}
            </DialogTitle>
            <DialogDescription>
              {configMode === 'location' ? 'Defina a cidade onde seu negócio opera.' : 'Conecte sua empresa ao Google Business.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 scrollbar-hide">
            
            {/* TELA 1: LOCALIZAÇÃO */}
            {configMode === 'location' && (
              <section className="space-y-4 pt-2 animate-in fade-in zoom-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Cidade</Label>
                    <Input 
                      placeholder="Ex: São Paulo" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                      className="h-10 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Estado (UF)</Label>
                    <Input 
                      placeholder="Ex: SP" 
                      value={state} 
                      maxLength={2}
                      onChange={(e) => setState(e.target.value.toUpperCase())} 
                      className="h-10 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs uppercase"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleUpdateLocation} 
                  disabled={!city || !state || isUpdatingUrl}
                  className="w-full h-12 rounded-xl font-bold text-sm shadow-md gap-2"
                >
                  {isUpdatingUrl ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                  Confirmar e Salvar
                </Button>
              </section>
            )}

            {/* TELA 2: BUSCA NO GOOGLE */}
            {configMode === 'maps' && (
              <section className="space-y-4 pt-2 animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                  <div className="relative group">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Nome da sua empresa no Google" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchPlaces()}
                      className="h-11 pl-10 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs"
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleSearchPlaces}
                      disabled={isSearchingPlaces || !searchQuery}
                      className="absolute right-1 top-1 h-9 rounded-lg hover:bg-primary/10 text-primary"
                    >
                      {isSearchingPlaces ? <Loader2 className="animate-spin w-4 h-4" /> : <Navigation className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* RESULTADOS DA BUSCA */}
                <div className="space-y-2">
                  {searchResults.map((place) => (
                    <Card 
                      key={place.place_id}
                      className="border-2 border-transparent hover:border-primary/20 cursor-pointer transition-all bg-muted/10 group"
                      onClick={() => handleSelectPlace(place)}
                    >
                      <div className="p-3 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-background group-hover:bg-primary/10 transition-colors">
                          <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black truncate">{place.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate opacity-70">{place.address}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Card>
                  ))}
                  
                  {isSearchingPlaces && (
                    <div className="py-8 text-center">
                      <Loader2 className="animate-spin w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Consultando Satélite...</p>
                    </div>
                  )}
                  
                  {searchResults.length === 0 && !isSearchingPlaces && searchQuery && (
                    <div className="py-6 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                      <p className="text-[10px] text-muted-foreground font-medium">Empresa não listada? Refine o nome.</p>
                    </div>
                  )}
                </div>

                <section className="space-y-3 pt-4 border-t opacity-60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Como funciona o G-Boost?</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    O Proova detecta elogios 5 estrelas e redireciona o cliente para este local no Google. Isso sobe sua posição nas buscas e atrai novos clientes organicamente.
                  </p>
                </section>
              </section>
            )}
          </div>

          <div className="p-6 bg-background border-t shrink-0">
            <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground" onClick={() => setIsGoogleMapsDialogOpen(false)}>
              Fechar Configurações
            </Button>
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
