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
  Play,
  Video,
  VideoIcon,
  Eye,
  Settings
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
import { toPng } from 'html-to-image';
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
  const [isPublicPageChoiceOpen, setIsPublicPageChoiceOpen] = useState(false);
  const [isCollectLinkChoiceOpen, setIsCollectLinkChoiceOpen] = useState(false);
  const [configMode, setConfigMode] = useState<'location' | 'maps' | 'business'>('location');
  
  const [newGoogleMapsUrl, setNewGoogleMapsUrl] = useState('');
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Estados para Social Cards
  const [selectedTestimonialForShare, setSelectedTestimonialForShare] = useState<any>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isExportingCard, setIsExportingCard] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const dialogVideoRef = useRef<HTMLVideoElement>(null);

  // Estados para Busca de Local e Identidade
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [companyNameEdit, setCompanyNameEdit] = useState('');
  const [companySlugEdit, setCompanySlugEdit] = useState('');

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

  const widgetsListQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'widgets');
  }, [db, user]);
  const { data: widgetsList } = useCollection(widgetsListQuery);

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

  useEffect(() => {
    if (isShareDialogOpen && selectedTestimonialForShare?.videoUrl && dialogVideoRef.current) {
      dialogVideoRef.current.load();
    }
  }, [isShareDialogOpen, selectedTestimonialForShare]);

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
    const s2 = { id: 'collect', label: 'Coleta Ativa', completed: (userData?.testimonialsCount || 0) > 0, unlocked: s1.completed, action: () => setIsCollectLinkChoiceOpen(true) };
    const s3 = { id: 'widget', label: 'Primeiro Mural', completed: !!(widgetsList && widgetsList.length > 0), unlocked: s2.completed, action: () => router.push('/widgets') };
    return [s0, s1, s2, s3];
  }, [userData, widgetsList, router]);

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
      await updateDoc(db, 'users', user.uid, { city, state });
      toast({ title: "Localização Salva" });
      setIsGoogleMapsDialogOpen(false); 
      setSearchQuery('');
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao salvar local" });
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  const handleUpdateBusinessInfo = async () => {
    if (!db || !user || !companyNameEdit || !companySlugEdit) return;
    setIsUpdatingUrl(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { 
        companyName: companyNameEdit.trim(), 
        companySlug: companySlugEdit.trim().toLowerCase().replace(/\s+/g, '-') 
      });
      toast({ title: "Identidade Atualizada", description: "Seu link de coleta foi modificado." });
      setIsGoogleMapsDialogOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao salvar identidade" });
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
      setCompanyNameEdit(userData.companyName || '');
      setCompanySlugEdit(userData.companySlug || '');
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

  const handleDownloadComposedVideo = async () => {
    if (!selectedTestimonialForShare || !dialogVideoRef.current || !shareCardRef.current) return;

    setIsExportingCard(true);
    toast({ title: "Processando Vídeo VIP", description: "Gravando moldura digital... aguarde." });

    try {
      const videoEl = dialogVideoRef.current;
      const cardEl = shareCardRef.current;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Falha ao iniciar motor gráfico");

      const size = 720;
      canvas.width = size;
      canvas.height = size;

      const stream = (canvas as any).captureStream(30);
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(videoEl);
      const destination = audioCtx.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioCtx.destination);
      
      destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e: any) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `proova-social-video-${selectedTestimonialForShare.userName.toLowerCase().replace(/\s+/g, '-')}.mp4`;
        link.click();
        setIsExportingCard(false);
        toast({ title: "Vídeo Gerado!", description: "Seu depoimento com moldura está pronto." });
      };

      videoEl.currentTime = 0;
      videoEl.muted = false;
      
      const cardImage = await toPng(cardEl, { 
        pixelRatio: 2,
        filter: (node) => {
          const el = node as HTMLElement;
          return el.tagName !== 'VIDEO' && el.id !== 'video-overlay-badge';
        }
      });
      
      const frameImg = new (window as any).Image();
      frameImg.src = cardImage;
      await new Promise(r => frameImg.onload = r);

      recorder.start();

      const renderLoop = () => {
        if (videoEl.paused || videoEl.ended) {
          if (recorder.state === 'recording') recorder.stop();
          return;
        }

        ctx.drawImage(frameImg, 0, 0, size, size);

        const vWidth = size * 0.85;
        const vHeight = vWidth * (9/16);
        const vX = (size - vWidth) / 2;
        const vY = size * 0.18;

        ctx.save();
        ctx.beginPath();
        const radius = 24;
        ctx.moveTo(vX + radius, vY);
        ctx.arcTo(vX + vWidth, vY, vX + vWidth, vY + vHeight, radius);
        ctx.arcTo(vX + vWidth, vY + vHeight, vX, vY + vHeight, radius);
        ctx.arcTo(vX, vY + vHeight, vX, vY, radius);
        ctx.arcTo(vX, vY, vX + vWidth, vY, radius);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(videoEl, vX, vY, vWidth, vHeight);
        ctx.restore();

        requestAnimationFrame(renderLoop);
      };

      videoEl.play();
      renderLoop();

      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 16000);

    } catch (err) {
      console.error("Erro na gravação composta:", err);
      setIsExportingCard(false);
      toast({ variant: "destructive", title: "Erro na composição", description: "Tente o download simples." });
    }
  };

  const handleDownloadContent = async () => {
    if (!selectedTestimonialForShare) return;

    if (selectedTestimonialForShare.videoUrl) {
      await handleDownloadComposedVideo();
      return;
    }

    setIsExportingCard(true);
    try {
      if (!shareCardRef.current) return;
      const dataUrl = await toPng(shareCardRef.current, { 
        quality: 1.0, 
        pixelRatio: 3, 
        backgroundColor: '#f97316'
      });
      const link = document.createElement('a');
      link.download = `proova-card-${selectedTestimonialForShare.userName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Imagem Gerada!", description: "Seu card está pronto para as redes sociais." });
    } catch (err) {
      console.error("Erro fatal ao exportar:", err);
      toast({ variant: "destructive", title: "Erro ao exportar conteúdo" });
    } finally {
      setIsExportingCard(false);
    }
  };

  const openShareDialog = (testimonial: any) => {
    setSelectedTestimonialForShare(testimonial);
    setIsShareDialogOpen(true);
  };

  if (authLoading || userDataLoading || (user && !userData)) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    );
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
                className={cn("rounded-xl cursor-pointer font-bold py-2.5", !isCollectDone && "opacity-50 grayscale cursor-not-allowed")}
              >
                <Layout className="mr-2 h-4 w-4 text-primary" />
                <span>Meus Murais</span>
                {!isCollectDone && <Lock className="ml-auto w-3 h-3 opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => isSetupComplete && router.push('/private')} 
                className={cn("rounded-xl cursor-pointer font-bold py-2.5", !isSetupComplete && "opacity-50 grayscale cursor-not-allowed")}
              >
                <Inbox className="mr-2 h-4 w-4 text-primary" />
                <span>Inbox Privado</span>
                {!isSetupComplete && <Lock className="ml-auto w-3 h-3 opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Upgrade</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/pricing')} 
                className="rounded-xl cursor-pointer font-bold py-2.5 opacity-70"
              >
                <Handshake className="mr-2 h-4 w-4 text-primary" />
                <span>Serviços de Parceiros</span>
                <Lock className="ml-auto w-3.5 h-3.5 opacity-60" />
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
            <div className="grid gap-3 grid-cols-1">
              {(() => {
                const item = auditItems[0];
                return (
                  <Card key={item.id} className={cn("border-none shadow-sm overflow-hidden rounded-2xl relative", item.status === 'critical' ? "bg-destructive/5" : "bg-orange-500/5")}>
                    <div className={cn("absolute top-0 left-0 w-1.5 h-full", item.status === 'critical' ? "bg-destructive" : "bg-orange-500")} />
                    <CardContent className="p-4 flex flex-col sm:flex-row h-full justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-3 items-center">
                        <div className={cn("p-2 rounded-xl shrink-0", item.status === 'critical' ? "bg-destructive/10 text-destructive" : "bg-orange-500/10 text-orange-600")}><item.icon className="w-5 h-5" /></div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-tight">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug">{item.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" className="w-full sm:w-auto text-[10px] font-black uppercase h-8 rounded-lg shadow-sm shrink-0" onClick={item.action}>
                        {item.actionLabel} <ArrowRight className="ml-1 w-3 h-3" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          </section>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="space-y-3">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">Painel de Controle</h1>
              <p className="text-xs md:text-base text-muted-foreground">Gestão de prova social dinâmica</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/manual">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full gap-1.5 text-[10px] font-bold h-7 border border-primary/20 text-primary hover:bg-primary/5"
                >
                  <Info className="w-3.5 h-3.5" /> Manual do Usuário
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setConfigMode('maps'); setIsGoogleMapsDialogOpen(true); }} 
                className="rounded-full gap-1.5 text-[10px] font-bold h-7 border border-primary/20 text-primary hover:bg-primary/5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Google Maps
              </Button>
              <Link href={isSetupComplete ? "/private" : "#"} onClick={(e) => !isSetupComplete && e.preventDefault()}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={!isSetupComplete}
                  className={cn(
                    "rounded-full gap-2 text-[10px] h-7 border border-primary/20 text-primary hover:bg-primary/5 relative",
                    !isSetupComplete && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  {isSetupComplete ? <Inbox className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />} 
                  Ver Inbox Unificado
                  {isSetupComplete && pendingTestimonialsCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 px-1.5 text-[8px] font-black animate-pulse">
                      {pendingTestimonialsCount} NOVOS
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
              <SelectTrigger className="h-11 rounded-xl bg-background border-primary/20 text-[11px] font-bold uppercase tracking-wider focus:ring-primary/20"><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent align="end" className="rounded-xl"><SelectItem value="7" className="text-xs font-medium">Últimos 7 dias</SelectItem><SelectItem value="30" className="text-xs font-medium">Últimos 30 dias</SelectItem><SelectItem value="all" className="text-xs font-medium">Todo o período</SelectItem></SelectContent>
            </Select>
          </div>
        </header>

        <div className="grid gap-4 md:gap-6 grid-cols-1">
          <Card 
            className="border-none shadow-sm overflow-hidden rounded-2xl p-4 md:p-6 space-y-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
            onClick={() => router.push('/metrics')}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Resumo {period !== 'all' ? `(${period}d)` : ''}</CardTitle>
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    handleSendWeeklyReport();
                  }} 
                  disabled={isSendingReport} 
                  className={cn(
                    "text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline disabled:opacity-50",
                    isPremiumUser ? "text-primary" : "text-muted-foreground opacity-50"
                  )}
                >
                  {isSendingReport ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Mail className="w-2.5 h-2.5" />} 
                  {!isPremiumUser && <Lock className="w-2.5 h-2.5" />} 
                  Enviar Relatório
                </button>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest hidden sm:block">Ver Métricas Detalhadas</p>
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="space-y-1"><div className="text-xl md:text-3xl font-bold">{filteredMetrics.count} <span className="text-sm md:text-lg font-medium text-muted-foreground">avaliações</span></div><Badge variant="secondary" className="border-none text-[8px] md:text-[10px] h-4 md:h-5 px-1.5 font-black bg-primary/10 text-primary">{filteredMetrics.trendLabel}</Badge></div>
          </Card>
        </div>

        <section className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              disabled={!isGoogleDone}
              onClick={() => setIsCollectLinkChoiceOpen(true)} 
              className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all shadow-sm"
            >
              <Link2 className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Link de Coleta</span>
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setIsPublicPageChoiceOpen(true)} 
              className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all shadow-sm"
            >
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Página Pública</span>
            </Button>

            <Button variant="outline" disabled={!isSetupComplete} onClick={() => router.push('/private')} className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all relative shadow-sm">
              <Inbox className="w-5 h-5 text-primary" />
              {pendingTestimonialsCount > 0 && (
                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-lg animate-in zoom-in duration-300">
                  {pendingTestimonialsCount}
                </span>
              )}
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Inbox Unificado</span>
            </Button>

            <Button 
              variant="outline" 
              disabled={approvedTestimonials.length === 0}
              onClick={() => document.getElementById('testimonials-section')?.scrollIntoView({ behavior: 'smooth' })} 
              className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all shadow-sm"
            >
              <Share2 className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Social Card</span>
            </Button>

            <Button variant="outline" disabled={!isGoogleDone} onClick={() => setIsQrDialogOpenManual(true)} className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 transition-all shadow-sm">
              <QrCode className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">QR de Balcão</span>
            </Button>
          </div>
        </section>

        <section id="testimonials-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-lg md:text-xl font-bold font-headline tracking-tight">Últimos Depoimentos Publicados</h2>
            </div>
          </div>
          <div className="grid gap-3 md:gap-4">
            {testimonialsLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div> : filteredMetrics.displayList.length > 0 ? filteredMetrics.displayList.map((t: any) => (
              <Card key={t.id} className="border-none shadow-sm overflow-hidden rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {t.videoUrl ? (
                    <div 
                      className={cn(
                        "relative rounded-lg overflow-hidden bg-black shrink-0 border border-primary/10 transition-all cursor-pointer",
                        playingVideoId === t.id ? "w-full sm:w-64 h-48 sm:h-40" : "w-20 h-16 sm:w-24 sm:h-16 hover:border-primary/30"
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
                          disablePictureInPicture
                          controlsList="nodownload noplaybackrate noremoteplayback"
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
                    {t.text && t.text !== '(Depoimento em Vídeo)' && (
                      <p className="text-[10px] md:text-xs text-foreground italic line-clamp-2">"{t.text}"</p>
                    )}
                    <div className="flex items-center gap-4 text-[8px] md:text-[10px] text-muted-foreground font-medium pt-1">
                       <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full gap-1.5 text-[9px] font-black uppercase tracking-widest h-8 border-primary/20 text-primary hover:bg-primary/5"
                    onClick={() => openShareDialog(t)}
                  >
                    <Share className="w-3 h-3" /> Gerar Card
                  </Button>
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

      {/* COLLECT LINK CHOICE DIALOG */}
      <Dialog open={isCollectLinkChoiceOpen} onOpenChange={setIsCollectLinkChoiceOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl p-0 overflow-hidden bg-background">
          <DialogHeader className="p-8 pb-4 text-center shrink-0">
            <DialogTitle className="text-2xl font-black font-headline tracking-tight uppercase">Link de Coleta</DialogTitle>
            <DialogDescription className="text-sm">Gerencie como você captura novos elogios.</DialogDescription>
          </DialogHeader>

          <div className="px-8 pb-8 space-y-4">
            <Button 
              className="w-full h-20 rounded-2xl flex flex-col items-center justify-center gap-1 bg-primary hover:bg-primary/90 shadow-xl transition-all active:scale-95 group"
              onClick={() => {
                copyToClipboard(collectionLink, "Link de coleta");
                setIsCollectLinkChoiceOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-black uppercase tracking-tight">Copiar Link Agora</span>
              </div>
              <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Pronto para enviar aos clientes</span>
            </Button>

            <Button 
              variant="outline"
              className={cn(
                "w-full h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border-primary/20 text-primary hover:bg-primary/5 transition-all active:scale-95 group relative",
                !isPremiumUser && "opacity-80"
              )}
              onClick={() => {
                if (!isPremiumUser) {
                  router.push('/pricing');
                  return;
                }
                setConfigMode('business');
                setIsGoogleMapsDialogOpen(true);
                setIsCollectLinkChoiceOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                {isPremiumUser ? (
                  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-lg font-black uppercase tracking-tight">Personalizar Identidade</span>
              </div>
              <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">
                {isPremiumUser ? 'Ajustar Nome e Slug da URL' : 'Recurso Exclusivo Gold/Enterprise'}
              </span>
            </Button>
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t text-center flex justify-center">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Dica: Um link curto e amigável converte 40% mais.</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PUBLIC PAGE CHOICE DIALOG */}
      <Dialog open={isPublicPageChoiceOpen} onOpenChange={setIsPublicPageChoiceOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl p-0 overflow-hidden bg-background">
          <DialogHeader className="p-8 pb-4 text-center shrink-0">
            <DialogTitle className="text-2xl font-black font-headline tracking-tight uppercase">Página de Autoridade</DialogTitle>
            <DialogDescription className="text-sm">Escolha como deseja prosseguir com seu link da bio.</DialogDescription>
          </DialogHeader>

          <div className="px-8 pb-8 space-y-4">
            <Button 
              className="w-full h-20 rounded-2xl flex flex-col items-center justify-center gap-1 bg-primary hover:bg-primary/90 shadow-xl transition-all active:scale-95 group"
              onClick={() => {
                const firstWidget = widgetsList?.[0];
                if (firstWidget) {
                  const slug = userData?.companySlug || userData?.companyName?.toLowerCase().replace(/\s+/g, '-') || '';
                  window.open(`${baseUrl}/pp/${slug}/${firstWidget.id}`, '_blank');
                  setIsPublicPageChoiceOpen(false);
                } else {
                  toast({ title: "Mural Necessário", description: "Crie seu primeiro mural para visualizar." });
                }
              }}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-black uppercase tracking-tight">Visualizar Agora</span>
              </div>
              <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Ver como seu cliente enxerga</span>
            </Button>

            <Button 
              variant="outline"
              className="w-full h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border-primary/20 text-primary hover:bg-primary/5 transition-all active:scale-95 group"
              onClick={() => {
                router.push('/ppeditor');
                setIsPublicPageChoiceOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-lg font-black uppercase tracking-tight">Editar / Configurar</span>
              </div>
              <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Personalizar textos, cores e seções</span>
            </Button>
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t text-center flex justify-center">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Dica: Use seu link da bio no Instagram para converter mais.</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SHARE DIALOG (SOCIAL CARDS) */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl p-0 overflow-hidden bg-background max-h-[96vh] flex flex-col">
          <DialogHeader className="p-6 sm:p-8 pb-2 text-center shrink-0">
            <DialogTitle className="text-lg sm:text-xl font-black font-headline uppercase tracking-tight">Social Card Premium</DialogTitle>
            <DialogDescription className="text-xs">Gere um post profissional para suas redes sociais.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 flex flex-col items-center gap-6 scrollbar-hide">
            <div className="w-full flex justify-center py-2 shrink-0">
              <div 
                ref={shareCardRef}
                className="w-[min(85vw,400px)] aspect-square bg-primary relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col items-center p-6 sm:p-10 text-center"
                style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl" />
                 
                 <Quote className="absolute top-4 left-4 sm:top-6 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 text-white/10 rotate-180" />
                 
                 <div className="relative z-10 w-full flex flex-col h-full justify-between items-center">
                   
                   {selectedTestimonialForShare?.videoUrl ? (
                     <div className="w-full flex flex-col items-center gap-3 sm:gap-4 mt-1 sm:mt-2">
                        <div className="w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black/40 relative border border-white/20 shadow-lg">
                          <video 
                            ref={dialogVideoRef}
                            src={`/api/download/video?url=${encodeURIComponent(selectedTestimonialForShare.videoUrl)}`} 
                            className="w-full h-full object-cover"
                            style={{ width: '100%', height: '100%' }}
                            muted
                            autoPlay
                            loop
                            playsInline
                            preload="auto"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
                             </div>
                          </div>
                          <div id="video-overlay-badge" className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                            <p className="text-[6px] sm:text-[7px] text-white font-black uppercase tracking-widest flex items-center gap-1">
                              <Video className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> Depoimento em Vídeo
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex justify-center gap-0.5 sm:gap-1">
                            {Array.from({ length: selectedTestimonialForShare?.rating || 5 }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-white text-white drop-shadow-sm" />
                            ))}
                          </div>
                          <p className="text-white text-[11px] sm:text-sm font-bold leading-tight italic line-clamp-3 px-1">
                             {selectedTestimonialForShare?.text && selectedTestimonialForShare?.text !== '(Depoimento em Vídeo)' 
                               ? `"${selectedTestimonialForShare.text}"` 
                               : '"Feedback incrível deste cliente!"'}
                          </p>
                        </div>
                     </div>
                   ) : (
                     <div className="flex-1 flex flex-col justify-center items-center space-y-4 sm:space-y-6">
                       <div className="flex justify-center gap-1 sm:gap-1.5">
                          {Array.from({ length: selectedTestimonialForShare?.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white drop-shadow-sm" />
                          ))}
                       </div>
                       
                       <p className="text-white text-sm sm:text-lg font-bold leading-snug sm:leading-tight line-clamp-6 italic drop-shadow-md px-2">
                          "{selectedTestimonialForShare?.text}"
                       </p>
                     </div>
                   )}

                   <div className="w-full pt-3 sm:pt-4">
                      <div className="space-y-1 mb-3 sm:mb-4">
                        <p className="text-white font-black text-[11px] sm:text-sm uppercase tracking-widest truncate max-w-full">
                          {selectedTestimonialForShare?.userName}
                        </p>
                        <div className="bg-white/10 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-white/20 inline-block">
                           <p className="text-[7px] sm:text-[8px] text-white font-black uppercase tracking-[0.2em]">
                             Avaliado via Proova
                           </p>
                        </div>
                      </div>

                      <div className="w-full flex justify-between items-center opacity-60">
                          <span className="text-[6px] sm:text-[7px] text-white font-black uppercase tracking-widest truncate max-w-[120px]">{userData?.companyName}</span>
                          <div className="h-2.5 sm:h-3 w-10 sm:w-12 relative">
                            <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Proova" fill className="object-contain" />
                          </div>
                      </div>
                   </div>
                 </div>
              </div>
            </div>

            <Button 
              className="w-full h-12 sm:h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl gap-2 transition-all active:scale-95 text-xs shrink-0"
              onClick={handleDownloadContent}
              disabled={isExportingCard}
            >
              {isExportingCard ? <Loader2 className="animate-spin" /> : <Download className="w-4 h-4 sm:w-5 sm:h-5" />}
              {selectedTestimonialForShare?.videoUrl ? 'Gerar Vídeo com Moldura' : 'Baixar PNG em Alta'}
            </Button>
          </div>
          
          <DialogFooter className="p-4 sm:p-6 bg-muted/30 border-t flex flex-col items-center text-center shrink-0">
            <p className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground tracking-widest">
              {selectedTestimonialForShare?.videoUrl ? 'O sistema gravará seu vídeo com a moldura. Isso pode levar alguns segundos.' : 'Dica: Use nos redes sociais para provar autoridade 24h por dia'}
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isGoogleMapsDialogOpen} onOpenChange={setIsGoogleMapsDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl overflow-hidden p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-2 pt-10 shrink-0 bg-background">
            <DialogTitle className="text-2xl font-black font-headline flex items-center gap-2">
              {configMode === 'business' ? <Fingerprint className="w-6 h-6 text-primary" /> : <MapPinned className="w-6 h-6 text-primary" />} 
              {configMode === 'location' ? 'Localização' : (configMode === 'business' ? 'Identidade de Marca' : 'Perfil Comercial')}
            </DialogTitle>
            <DialogDescription>
              {configMode === 'location' ? 'Defina a cidade onde seu negócio opera.' : (configMode === 'business' ? 'Personalize o nome e o link da sua página.' : 'Conecte sua empresa ao Google Business.')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 scrollbar-hide">
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
                  {isUpdatingUrl ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="h-4 w-4" />}
                  Confirmar e Salvar
                </Button>
              </section>
            )}

            {configMode === 'business' && (
              <section className="space-y-4 pt-2 animate-in fade-in zoom-in duration-300">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Nome da Empresa</Label>
                    <Input 
                      placeholder="Ex: Minha Empresa" 
                      value={companyNameEdit} 
                      onChange={(e) => setCompanyNameEdit(e.target.value)} 
                      className="h-11 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Slug do Link (URL Personalizada)</Label>
                    <div className="flex items-center gap-1 bg-muted/20 rounded-xl px-3 border border-transparent focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <span className="text-[10px] font-bold opacity-40">/c/</span>
                      <input 
                        placeholder="nome-da-sua-empresa"
                        value={companySlugEdit} 
                        onChange={(e) => setCompanySlugEdit(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
                        className="h-11 flex-1 bg-transparent border-none focus:ring-0 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleUpdateBusinessInfo} 
                  disabled={!companyNameEdit || !companySlugEdit || isUpdatingUrl}
                  className="w-full h-12 rounded-xl font-bold text-sm shadow-md gap-2"
                >
                  {isUpdatingUrl ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="h-4 w-4" />}
                  Salvar Nova Identidade
                </Button>
              </section>
            )}

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
                      <p className="text-[10px] font-medium text-muted-foreground">Empresa não listada? Refine o nome.</p>
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
