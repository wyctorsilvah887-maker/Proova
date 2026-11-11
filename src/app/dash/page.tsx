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
  Settings,
  BookOpen,
  Wand2,
  RefreshCw,
  Headphones,
  Bell,
  BellRing
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { doc, collection, query, updateDoc, orderBy, limit, where, getDocs, Timestamp, serverTimestamp, arrayUnion } from 'firebase/firestore';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { toast as shadcnToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from 'next-themes';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';
import { getGooglePlaceDetails, searchGooglePlaces } from '@/app/actions/maps-actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { useNotifications } from '@/hooks/use-notifications';
import { LoadingScreen } from '@/components/loading-screen';
import { getAvailableTemplates, type TemplateMetadata } from '@/app/actions/template-actions';

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
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Estados para Social Cards (Sincronizado com SocialCardsPage)
  const [selectedTestimonialForShare, setSelectedTestimonialForShare] = useState<any>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isExportingCard, setIsExportingCard] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<TemplateMetadata[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Estado para Detalhe do Depoimento
  const [selectedTestimonialForDetail, setSelectedTestimonialForDetail] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
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

  // Sistema de Notificações Push
  const { permission, requestPermission, isSupported: pushSupported } = useNotifications(user?.uid);

  // Sistema de Notificações de Suporte em Tempo Real
  const supportTicketQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'support_tickets'), where('userId', '==', user.uid), limit(1));
  }, [db, user]);

  const { data: activeTickets } = useCollection(supportTicketQuery);
  const activeTicket = activeTickets?.[0] as any;

  const isPremiumUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const isEnterpriseUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'enterprise';
  }, [userData]);

  const isAgency = useMemo(() => {
    return userData?.businessType === 'agencia';
  }, [userData]);

  const isDigitalBusiness = useMemo(() => {
    return userData?.businessType === 'agencia' || userData?.businessType === 'servicos_digitais';
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
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

  useEffect(() => {
    if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
  }, []);

  // Carregar templates dinâmicos
  useEffect(() => {
    async function loadTemplates() {
      setIsLoadingTemplates(true);
      const templates = await getAvailableTemplates();
      setAvailableTemplates(templates);
      if (templates.length > 0) {
        setSelectedTemplateId(templates[0].id);
      }
      setIsLoadingTemplates(false);
    }
    loadTemplates();
  }, []);

  const activeTemplate = useMemo(() => {
    return availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];
  }, [selectedTemplateId, availableTemplates]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isShareDialogOpen && selectedTestimonialForShare?.videoUrl && dialogVideoRef.current) {
      dialogVideoRef.current.load();
    }
  }, [isShareDialogOpen, selectedTestimonialForShare]);

  const setupSteps = useMemo(() => {
    const allSteps = [];
    
    allSteps.push({ 
      id: 'location', 
      label: 'Localização', 
      completed: !!userData?.city, 
      unlocked: true, 
      action: () => {
        setConfigMode('location');
        setIsGoogleMapsDialogOpen(true);
      } 
    });

    if (!isDigitalBusiness) {
      const prev = allSteps[allSteps.length - 1];
      allSteps.push({ 
        id: 'google', 
        label: 'Google Maps', 
        completed: !!userData?.googleMapsUrl, 
        unlocked: prev.completed, 
        action: () => {
          setConfigMode('maps');
          setIsGoogleMapsDialogOpen(true);
        } 
      });
    }

    const prevStep = allSteps[allSteps.length - 1];
    allSteps.push({ 
      id: 'collect', 
      label: 'Coleta Ativa', 
      completed: (userData?.testimonialsCount || 0) > 0, 
      unlocked: prevStep.completed, 
      action: () => setIsCollectLinkChoiceOpen(true) 
    });

    if (isAgency) {
      const last = allSteps[allSteps.length - 1];
      allSteps.push({ 
        id: 'widget', 
        label: 'Primeiro Mural', 
        completed: !!(widgetsList && widgetsList.length > 0), 
        unlocked: last.completed, 
        action: () => router.push('/widgets') 
      });
    }

    return allSteps;
  }, [userData, widgetsList, router, isDigitalBusiness, isAgency]);

  const completedStepsCount = setupSteps.filter(s => s.completed).length;
  const progressPercentage = (completedStepsCount / setupSteps.length) * 100;
  const isSetupComplete = completedStepsCount === setupSteps.length;
  
  const isGoogleDone = useMemo(() => {
    if (isDigitalBusiness) return true;
    return !!userData?.googleMapsUrl;
  }, [isDigitalBusiness, userData]);

  useEffect(() => {
    if (isSetupComplete && userData && !userData.isSetupProcessDone && db && user) {
      updateDoc(doc(db, 'users', user.uid), {
        isSetupProcessDone: true
      });
    }
  }, [isSetupComplete, userData, db, user]);

  const isMapsLinkValid = useMemo(() => {
    if (!userData?.googleMapsUrl) return false;
    const url = userData.googleMapsUrl.toLowerCase();
    return url.includes('review') || url.includes('writereview') || url.includes('placeid');
  }, [userData]);

  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);

  useEffect(() => {
    async function runAudit() {
      if ((!isSetupComplete && !userData?.isSetupProcessDone) || !userData) return;
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

      if (pushSupported && !userData.fcmToken && permission !== 'denied') {
        results.push({
          id: 'push-inactive',
          label: 'Notificações Desativadas',
          status: 'attention',
          description: 'Ative os alertas para saber instantaneamente quando receber um elogio.',
          actionLabel: 'Ativar Agora',
          action: () => {
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
            if (!vapidKey) {
              shadcnToast({ variant: "destructive", title: "Configuração Pendente", description: "O administrador ainda não configurou a VAPID Key no ambiente de produção." });
              return;
            }
            requestPermission(vapidKey);
          },
          icon: BellRing
        });
      }

      if (!isDigitalBusiness) {
        const mapsUrl = (userData.googleMapsUrl || '').toLowerCase().trim();
        const isReviewLink = mapsUrl.includes('review') || mapsUrl.includes('writereview');
        
        if (!userData.googleMapsUrl) {
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
      }

      setAuditItems(results);
    }
    runAudit();
  }, [isSetupComplete, userData, widgetsList, pendingTestimonialsCount, router, isEnterpriseUser, isDigitalBusiness, pushSupported, permission]);

  const filteredMetrics = useMemo(() => {
    const testimonials = approvedTestimonials;
    const now = new Date();
    if (period === 'all') return { count: userData?.testimonialsCount || 0, displayList: testimonials.slice(0, 5), trendLabel: 'Total acumulado' };
    const days = parseInt(period);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const periodTestimonials = testimonials.filter(t => (t.createdAt?.toDate?.() || new Date()) >= cutoff);
    return { count: periodTestimonials.length, displayList: periodTestimonials.slice(0, 5), trendLabel: `Últimos ${days} dias` };
  }, [approvedTestimonials, period, userData]);

  const todayCount = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    return approvedTestimonials.filter(t => (t.createdAt?.toDate?.() || new Date()) >= startOfToday).length;
  }, [approvedTestimonials]);

  const copyToClipboard = (text: string, description: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    shadcnToast({ title: "Copiado!", description: `${description} copiado.` });
  };

  const handleSearchPlaces = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingPlaces(true);
    try {
      const results = await searchGooglePlaces(searchQuery, city || userData?.city, state || userData?.state);
      setSearchResults(results);
    } catch (err) {
      shadcnToast({ variant: "destructive", title: "Erro na busca" });
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleSelectPlace = async (place: any) => {
    if (!db || !user) return;
    const reviewLink = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        googlePlaceId: place.place_id,
        googleMapsUrl: reviewLink,
        city: city || userData?.city || '',
        state: userData?.state || ''
      });
      shadcnToast({ title: "Empresa Vinculada!", description: "Seu G-Boost está ativo." });
      setIsGoogleMapsDialogOpen(false);
      setSearchResults([]);
    } catch (err) {
      shadcnToast({ variant: "destructive", title: "Erro ao salvar" });
    }
  };

  const handleUpdateLocation = async () => {
    if (!db || !user || !city || !state) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { city, state });
      shadcnToast({ title: "Localização Salva" });
      setIsGoogleMapsDialogOpen(false); 
      setSearchQuery('');
    } catch (err) {
      shadcnToast({ variant: "destructive", title: "Erro ao salvar local" });
    }
  };

  const handleUpdateBusinessInfo = async () => {
    if (!db || !user || !companyNameEdit || !companySlugEdit) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { 
        companyName: companyNameEdit.trim(), 
        companySlug: companySlugEdit.trim().toLowerCase().replace(/\s+/g, '-') 
      });
      shadcnToast({ title: "Identidade Atualizada", description: "Seu link de coleta foi modificado." });
      setIsGoogleMapsDialogOpen(false);
    } catch (err) {
      shadcnToast({ variant: "destructive", title: "Erro ao salvar identidade" });
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
      const qrElement = document.getElementById('qr-container-print');
      if (!qrElement) throw new Error("Elemento do QR não encontrado.");

      const qrImage = await toPng(qrElement, { 
        pixelRatio: 4, 
        backgroundColor: '#ffffff',
        style: { transform: 'scale(1)', borderRadius: '0px' }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(249, 115, 22); 
      pdf.rect(0, 0, pageWidth, 20, 'F'); 

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(36);
      pdf.setTextColor(17, 24, 39); 
      pdf.text('SUA OPINIÃO É', pageWidth / 2, 50, { align: 'center' });
      pdf.text('MUITO IMPORTANTE!', pageWidth / 2, 65, { align: 'center' });
      
      pdf.setFontSize(20);
      pdf.setTextColor(107, 114, 128); 
      pdf.text(userData?.companyName || 'Nossa Empresa', pageWidth / 2, 85, { align: 'center' });

      const qrSize = 130;
      const xPos = (pageWidth - qrSize) / 2;
      pdf.addImage(qrImage, 'PNG', xPos, 105, qrSize, qrSize);

      pdf.setFontSize(16);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Escaneie agora com seu celular', pageWidth / 2, 250, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.setTextColor(156, 163, 175);
      pdf.text('Sua avaliação nos ajuda a crescer!', pageWidth / 2, 260, { align: 'center' });

      pdf.setFontSize(9);
      pdf.setTextColor(209, 213, 219);
      pdf.text('Tecnologia de Prova Social fornecida por PROOVA.com.br', pageWidth / 2, 285, { align: 'center' });

      pdf.save(`cartaz-balcao-${userData?.companySlug}.pdf`);
      shadcnToast({ title: "PDF Pronto!", description: "Seu cartaz de balcão foi gerado com sucesso." });
    } catch (err: any) { 
      shadcnToast({ variant: "destructive", title: "Erro na Impressão" }); 
    } finally { 
      setIsGeneratingPdf(false); 
    }
  };

  const handleDownloadContent = async () => {
    if (!selectedTestimonialForShare) return;

    if (selectedTestimonialForShare.videoUrl) {
      setIsExportingCard(true);
      shadcnToast({ title: "Processando Vídeo VIP", description: "Iniciando download..." });
      try {
        const link = document.createElement('a');
        link.href = selectedTestimonialForShare.videoUrl;
        link.download = `proova-video-${selectedTestimonialForShare.userName.toLowerCase().replace(/\s+/g, '-')}.mp4`;
        link.target = "_blank";
        link.click();
      } catch (err) {
        shadcnToast({ variant: "destructive", title: "Erro no download" });
      } finally {
        setIsExportingCard(false);
      }
      return;
    }

    setIsExportingCard(true);
    try {
      if (!shareCardRef.current) return;
      
      const dataUrl = await toPng(shareCardRef.current, { 
        quality: 1.0, 
        pixelRatio: 3, 
        backgroundColor: null, 
        style: { borderRadius: '0' }
      });
      
      const link = document.createElement('a');
      link.download = `proova-card-${selectedTestimonialForShare.userName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      shadcnToast({ title: "Card Gerado!", description: "Sua arte está pronta." });
    } catch (err) {
      shadcnToast({ variant: "destructive", title: "Erro ao exportar" });
    } finally {
      setIsExportingCard(false);
    }
  };

  const handleTemplateClick = (tpl: TemplateMetadata) => {
    const isVip = tpl.id.toLowerCase().includes('vip');
    if (isVip && !isPremiumUser) {
      shadcnToast({
        variant: "destructive",
        title: "Recurso Premium",
        description: "Templates VIP estão disponíveis apenas nos planos Gold e PRO."
      });
      router.push('/pricing');
      return;
    }
    setSelectedTemplateId(tpl.id);
  };

  const openShareDialog = (testimonial: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTestimonialForShare(testimonial);
    if (availableTemplates.length > 0) {
      setSelectedTemplateId(availableTemplates[0].id);
    }
    setIsShareDialogOpen(true);
  };

  const openDetailDialog = (testimonial: any) => {
    setSelectedTestimonialForDetail(testimonial);
    setIsDetailDialogOpen(true);
  };

  if (authLoading || userDataLoading || (user && !userData)) {
    return <LoadingScreen />;
  }

  const collectionLink = `${baseUrl}/c/${userData?.companySlug}`;
  const publicPageLink = `${baseUrl}/pp/${userData?.companySlug}`;

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

      <header className="bg-background border-b h-16 md:h-20 flex items-center px-2 md:px-4 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center">
          <Link href="/dash" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[66px] md:w-[320px] md:h-[106px] transition-transform group-hover:scale-105">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-dark-mode.gif" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex border-none bg-transparent shadow-none hover:bg-transparent active:bg-transparent focus-visible:ring-0" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 md:h-12 px-1.5 md:px-2 gap-1.5 md:gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                <div className="flex flex-col items-end relative">
                  <span className="text-xs font-bold truncate max-w-[70px] sm:max-w-[120px] leading-tight transition-colors group-hover:text-primary">{userData?.companyName || 'Minha Empresa'}</span>
                  <div className="flex flex-col items-end gap-0">
                    <span className={cn("text-[6px] sm:text-[8px] uppercase tracking-widest font-black leading-tight text-primary", userData?.membershipStatus === 'enterprise' && "animate-pulse")}>{membershipLabel}</span>
                    {isMapsLinkValid && <span className="text-[5px] sm:text-[6px] font-black uppercase text-green-500 tracking-tighter leading-none">G-Boost Ativo</span>}
                  </div>
                  {activeTicket && (
                    <div className={cn("absolute -top-1 -right-4 h-2 w-2 rounded-full", activeTicket.isSupportInChat ? "bg-green-500 animate-ping" : "bg-red-500")} />
                  )}
                </div>
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors"><User className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5 bg-primary/5 text-primary">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span>Dash</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Settings className="mr-2 h-4 w-4 text-primary" />
                <span>Configurações</span>
              </DropdownMenuItem>
              {isAgency && (
                <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5">
                  <Layout className="mr-2 h-4 w-4 text-primary" />
                  <span>Meus Murais</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push('/private')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Inbox className="mr-2 h-4 w-4 text-primary" />
                <span>Inbox Privado</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/support')} className="rounded-xl cursor-pointer font-bold py-2.5 relative">
                <Headphones className="mr-2 h-4 w-4 text-primary" />
                <span>Suporte Proova</span>
                {activeTicket && (
                  <div className={cn("absolute right-3 h-2 w-2 rounded-full", activeTicket.isSupportInChat ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Upgrade</span>
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

      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-10 max-w-7xl mx-auto w-full overflow-x-hidden pt-20 md:pt-24 pb-12">
        {(!isSetupComplete && !userData?.isSetupProcessDone) && (
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
                          <div className="min-0">
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

        {(isSetupComplete || userData?.isSetupProcessDone) && auditItems.length > 0 && (
          <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Ações de Reputação
              </h2>
            </div>
            <div className="grid gap-3 grid-cols-1">
              {auditItems.slice(0, 1).map((item) => {
                const IconComponent = item.icon;
                return (
                  <Card key={item.id} className={cn("border-none shadow-sm overflow-hidden rounded-2xl relative", item.status === 'critical' ? "bg-destructive/5" : "bg-orange-500/5")}>
                    <div className={cn("absolute top-0 left-0 w-1.5 h-full", item.status === 'critical' ? "bg-destructive" : "bg-orange-500")} />
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-4 items-center flex-1">
                        <div className={cn("p-2.5 rounded-xl shrink-0", item.status === 'critical' ? "bg-destructive/10 text-destructive" : "bg-orange-500/10 text-orange-600")}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest leading-none">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{item.description}</p>
                        </div>
                      </div>
                      <button 
                        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto h-10 px-6 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all shrink-0" 
                        onClick={item.action}
                      >
                        {item.actionLabel} 
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="space-y-3">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">Painel de Controle</h1>
              <p className="text-xs md:text-base text-muted-foreground">Gestão de prova social dinâmica</p>
            </div>
          </div>
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
        </header>

        <div className="grid gap-4 md:gap-6 grid-cols-1">
          <Card 
            className="border-none shadow-xl overflow-hidden rounded-[2rem] p-5 md:p-10 space-y-4 md:space-y-6 cursor-pointer hover:shadow-2xl transition-all active:scale-[0.98] select-none bg-background group relative"
            onClick={() => router.push('/metrics')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 md:p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="space-y-0.5">
                  <CardTitle className="text-[10px] md:text-xs font-black uppercase text-muted-foreground tracking-[0.15em] md:tracking-[0.2em]">Desempenho Geral</CardTitle>
                  <p className="text-[8px] md:text-[10px] text-primary font-bold uppercase tracking-widest">{filteredMetrics.trendLabel}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-primary opacity-40 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black uppercase tracking-widest">Análise Completa</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 items-center md:items-end gap-6 md:gap-8 relative z-10">
              <div className="flex items-center justify-center md:justify-start gap-4 md:gap-6">
                <div className="flex items-baseline gap-2 md:gap-3">
                  <span className="text-6xl md:text-8xl font-black tracking-tighter transition-transform duration-500 group-hover:scale-105 block">
                    {filteredMetrics.count}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400 animate-pulse" />
                      <span className="text-base md:text-xl font-black uppercase tracking-tighter">Elogios</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end gap-2 md:gap-3">
                {todayCount > 0 ? (
                  <div className="bg-green-500/10 border border-green-500/20 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl flex items-center gap-2 animate-in zoom-in duration-700">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
                    <span className="text-[9px] md:text-xs font-black text-green-600 uppercase tracking-widest">
                      +{todayCount} {todayCount === 1 ? 'novo hoje' : 'novos hoje'}
                    </span>
                  </div>
                ) : (
                  <div className="bg-primary/5 border border-primary/10 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl">
                    <span className="text-[9px] md:text-xs font-black text-primary uppercase tracking-widest opacity-60">
                      Aguardando coletas hoje
                    </span>
                  </div>
                )}
                <p className="text-[8px] md:text-[9px] text-muted-foreground font-bold uppercase tracking-widest text-center md:text-right max-w-[200px]">
                  Crescimento consolidado vs. período anterior
                </p>
              </div>
            </div>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ferramentas de Conversão</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              disabled={!isGoogleDone}
              onClick={() => setIsCollectLinkChoiceOpen(true)} 
              className="h-24 rounded-[1.8rem] border-2 flex flex-col items-center justify-center gap-1.5 border-primary/20 bg-background hover:bg-primary/5 transition-all shadow-sm active:scale-95 disabled:opacity-40"
            >
              <Link2 className="w-5 h-5 text-primary" />
              <div className="text-center px-2">
                <p className="text-[10px] font-black uppercase tracking-tight">Link de Coleta</p>
                <p className="text-[7px] font-bold text-muted-foreground uppercase opacity-60">Capture Elogios</p>
              </div>
            </button>

            <button 
              onClick={() => setIsPublicPageChoiceOpen(true)} 
              className="h-24 rounded-[1.8rem] border-2 flex flex-col items-center justify-center gap-1.5 border-primary/20 bg-background hover:bg-primary/5 transition-all shadow-sm active:scale-95"
            >
              <Globe className="w-5 h-5 text-primary" />
              <div className="text-center px-2">
                <p className="text-[10px] font-black uppercase tracking-tight">Link in Bio</p>
                <p className="text-[7px] font-bold text-muted-foreground uppercase opacity-60">Página Pública</p>
              </div>
            </button>

            <button 
              onClick={() => router.push('/social-cards')} 
              className="h-24 rounded-[1.8rem] border-2 flex flex-col items-center justify-center gap-1.5 border-primary/20 bg-background hover:bg-primary/5 transition-all shadow-sm active:scale-95"
            >
              <Share2 className="w-5 h-5 text-primary" />
              <div className="text-center px-2">
                <p className="text-[10px] font-black uppercase tracking-tight">Social Cards</p>
                <p className="text-[7px] font-bold text-muted-foreground uppercase opacity-60">Posts Instagram</p>
              </div>
            </button>

            <button 
              disabled={!userData?.isSetupProcessDone && completedStepsCount < setupSteps.length} 
              onClick={() => router.push('/private')} 
              className="h-24 rounded-[1.8rem] border-2 flex flex-col items-center justify-center gap-1.5 border-primary/20 bg-background hover:bg-primary/5 transition-all relative shadow-sm active:scale-95 disabled:opacity-40"
            >
              <Inbox className="w-5 h-5 text-primary" />
              {pendingTestimonialsCount > 0 && (
                <span className="absolute top-3 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-lg animate-in zoom-in duration-300">
                  {pendingTestimonialsCount}
                </span>
              )}
              <div className="text-center px-2">
                <p className="text-[10px] font-black uppercase tracking-tight">Moderação</p>
                <p className="text-[7px] font-bold text-muted-foreground uppercase opacity-60">Inbox Unificado</p>
              </div>
            </button>

            {isAgency && (
              <button 
                onClick={() => router.push('/widgets')} 
                className="h-24 rounded-[1.8rem] border-2 flex flex-col items-center justify-center gap-1.5 border-primary/20 bg-background hover:bg-primary/5 transition-all shadow-sm active:scale-95"
              >
                <Layout className="w-5 h-5 text-primary" />
                <div className="text-center px-2">
                  <p className="text-[10px] font-black uppercase tracking-tight">Widgets</p>
                  <p className="text-[7px] font-bold text-muted-foreground uppercase opacity-60">Murais para Site</p>
                </div>
              </button>
            )}

            <button 
              disabled={!isGoogleDone} 
              onClick={() => setIsQrDialogOpenManual(true)} 
              className="h-24 rounded-[1.8rem] border-2 flex flex-col items-center justify-center gap-1.5 border-primary/20 bg-background hover:bg-primary/5 transition-all shadow-sm active:scale-95 disabled:opacity-40"
            >
              <QrCode className="w-5 h-5 text-primary" />
              <div className="text-center px-2">
                <p className="text-[10px] font-black uppercase tracking-tight">QR Balcão</p>
                <p className="text-[7px] font-bold text-muted-foreground uppercase opacity-60">Físico e Impresso</p>
              </div>
            </button>

            <Link href="/support" className="w-full h-24">
              <button 
                className="h-full w-full rounded-[1.8rem] border-2 flex flex-col items-center justify-center gap-1.5 border-primary/20 bg-background hover:bg-primary/5 transition-all shadow-sm active:scale-95 relative"
              >
                <Headphones className="w-5 h-5 text-primary" />
                <div className="text-center px-2">
                  <p className="text-[10px] font-black uppercase tracking-tight">Suporte</p>
                  <p className="text-[7px] font-bold text-muted-foreground uppercase opacity-60">Consultor Chat</p>
                </div>
                {activeTicket && (
                  <div className={cn("absolute top-3 right-4 h-3 w-3 rounded-full border-2 border-background", activeTicket.isSupportInChat ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                )}
              </button>
            </Link>

            <Link href="/manual" className="w-full h-24">
              <button className="h-full w-full rounded-[1.8rem] border-2 flex flex-col items-center justify-center gap-1.5 border-primary/20 bg-background hover:bg-primary/5 transition-all shadow-sm active:scale-95">
                <BookOpen className="w-5 h-5 text-primary" />
                <div className="text-center px-2">
                  <p className="text-[10px] font-black uppercase tracking-tight">Manual</p>
                  <p className="text-[7px] font-bold text-muted-foreground uppercase opacity-60">Estratégia VIP</p>
                </div>
              </button>
            </Link>
          </div>
        </section>

        <section id="testimonials-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-lg md:text-xl font-bold font-headline tracking-tight">Últimos 5 Depoimentos Publicados</h2>
            </div>
          </div>
          <div className="grid gap-3 md:gap-4">
            {testimonialsLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div> : filteredMetrics.displayList.length > 0 ? filteredMetrics.displayList.map((t: any) => (
              <Card 
                key={t.id} 
                className="border-none shadow-sm overflow-hidden rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md cursor-pointer active:scale-[0.99] group/card"
                onClick={() => openDetailDialog(t)}
              >
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
                    <div className="bg-primary/10 p-2 rounded-xl hidden sm:block transition-colors group-hover/card:bg-primary group-hover/card:text-white"><User className="w-4 h-4 text-primary group-hover/card:text-white" /></div>
                  )}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-col space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs truncate group-hover/card:text-primary transition-colors">{t.userName}</span>
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
                    className="rounded-full gap-1.5 text-[9px] font-black uppercase tracking-widest h-8 border-primary/20 text-primary hover:bg-primary/5 relative z-20"
                    onClick={(e) => openShareDialog(t, e)}
                  >
                    <Share className="w-3 h-3" /> Criar Story
                  </Button>
                </div>
              </Card>
            )) : <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/10 opacity-40"><MessageSquare className="w-10 h-10 mx-auto mb-3" /><p className="text-sm">Nenhum depoimento publicado ainda.</p></div>}
          </div>
        </section>
      </main>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-lg border-none shadow-2xl p-0 overflow-hidden bg-background max-h-[90vh] flex flex-col">
          <div className="h-2 bg-primary w-full shrink-0" />
          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-3xl bg-primary/10 text-primary">
                  <User className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-black font-headline tracking-tight uppercase">{selectedTestimonialForDetail?.userName}</DialogTitle>
                  <p className="text-xs text-muted-foreground font-bold flex items-center justify-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedTestimonialForDetail?.createdAt?.toDate ? selectedTestimonialForDetail.createdAt.toDate().toLocaleString('pt-BR') : 'Hoje'}
                  </p>
                </div>
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "w-6 h-6",
                        i < (selectedTestimonialForDetail?.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"
                      )} 
                    />
                  ))}
                </div>
              </div>

              {selectedTestimonialForDetail?.videoUrl && (
                <div className="aspect-video rounded-[2rem] overflow-hidden bg-black shadow-2xl ring-4 ring-primary/5">
                  <video 
                    src={selectedTestimonialForDetail.videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {selectedTestimonialForDetail?.text && selectedTestimonialForDetail?.text !== '(Depoimento em Vídeo)' && (
                <div className="relative p-8 rounded-[2rem] bg-muted/30 border-2 border-primary/10">
                  <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/20 rotate-180" />
                  <p className="text-base md:text-lg font-medium italic leading-relaxed text-center relative z-10">
                    "{selectedTestimonialForDetail?.text}"
                  </p>
                  <Quote className="absolute bottom-4 right-4 w-8 h-8 text-primary/20" />
                </div>
              )}

              <div className="flex flex-col gap-3">
                 <Button 
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2 bg-primary shadow-xl"
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    openShareDialog(selectedTestimonialForDetail);
                  }}
                 >
                   <Share2 className="w-5 h-5" /> Criar Social Card
                 </Button>
                 <Button variant="ghost" onClick={() => setIsDetailDialogOpen(false)} className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fechar Visualização</Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isCollectLinkChoiceOpen} onOpenChange={setIsCollectLinkChoiceOpen}>
        <DialogContent className="rounded-[2.5rem] w-[95vw] max-w-md border-none shadow-2xl p-0 overflow-hidden bg-background max-h-[90vh] flex flex-col">
          <DialogHeader className="p-8 pb-4 text-center shrink-0">
            <DialogTitle className="text-xl md:text-2xl font-black font-headline tracking-tight uppercase">Link de Coleta</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">Capture elogios reais agora mesmo.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 md:px-8">
            <div className="pb-8 space-y-4">
              <Button 
                className="w-full h-24 md:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 bg-primary hover:bg-primary/90 shadow-xl transition-all active:scale-95 group"
                onClick={() => {
                  copyToClipboard(collectionLink, "Link de coleta");
                  setIsCollectLinkChoiceOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-black uppercase tracking-tight">Copiar Link</span>
                </div>
                <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Enviar aos clientes via WhatsApp</span>
              </Button>
              <Button 
                variant="outline"
                className={cn(
                  "w-full h-24 md:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border-primary/20 text-primary hover:bg-primary/5 transition-all active:scale-95 group relative",
                  !isPremiumUser && "opacity-80"
                )}
                onClick={() => {
                  if (!isPremiumUser) {
                    router.push('/pricing');
                    return;
                  }
                  router.push('/settings');
                  setIsCollectLinkChoiceOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  {isPremiumUser ? (
                    <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-lg font-black uppercase tracking-tight">Identidade</span>
                </div>
                <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">
                  {isPremiumUser ? 'Ajustar Nome e Slug da URL' : 'Recurso Exclusivo Premium'}
                </span>
              </Button>
            </div>
          </ScrollArea>
          <DialogFooter className="p-5 bg-muted/30 border-t text-center flex justify-center shrink-0">
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Dica: Envie logo após o atendimento para converter melhor.</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPublicPageChoiceOpen} onOpenChange={setIsPublicPageChoiceOpen}>
        <DialogContent className="rounded-[2.5rem] w-[95vw] max-w-md border-none shadow-2xl p-0 overflow-hidden bg-background max-h-[90vh] flex flex-col">
          <DialogHeader className="p-8 pb-4 text-center shrink-0">
            <DialogTitle className="text-xl md:text-2xl font-black font-headline tracking-tight uppercase">Link in Bio</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">Sua vitrine de depoimentos oficial.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 md:px-8">
            <div className="pb-8 space-y-4">
              <Button 
                className="w-full h-24 md:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 bg-primary hover:bg-primary/90 shadow-xl transition-all active:scale-95 group"
                onClick={() => {
                  const slug = userData?.companySlug || userData?.companyName?.toLowerCase().replace(/\s+/g, '-') || '';
                  router.push(`/pp/${slug}`); 
                  setIsPublicPageChoiceOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-black uppercase tracking-tight">Visualizar</span>
                </div>
                <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Ver como seu cliente enxerga</span>
              </Button>
              <Button 
                variant="outline"
                className="w-full h-24 md:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border-primary/20 text-primary hover:bg-primary/5 transition-all active:scale-95 group"
                onClick={() => {
                  router.push('/ppeditor');
                  setIsPublicPageChoiceOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  {isPremiumUser ? (
                    <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-lg font-black uppercase tracking-tight">Configurar</span>
                </div>
                <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">
                  {isPremiumUser ? 'Customizar temas e depoimentos' : 'Recurso Exclusivo Premium'}
                </span>
              </Button>
              <button 
                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity flex items-center justify-center gap-1"
                onClick={() => {
                  copyToClipboard(publicPageLink, "Link da Página Pública");
                }}
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Link da Página
              </button>
            </div>
          </ScrollArea>
          <DialogFooter className="p-5 bg-muted/30 border-t text-center flex justify-center shrink-0">
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Dica: Use o Link in Bio no seu perfil do Instagram.</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl p-0 overflow-hidden bg-background max-h-[92vh] flex flex-col">
          <DialogHeader className="p-4 sm:p-8 pb-2 text-center shrink-0">
            <div className="flex items-center justify-center gap-2 mb-1">
               <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
               <DialogTitle className="text-lg sm:text-xl font-black font-headline uppercase tracking-tight">Social Design Studio</DialogTitle>
            </div>
            <DialogDescription className="text-[10px] sm:text-xs font-medium">Selecione um template e gere sua arte para post.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-6 flex flex-col items-center gap-4 sm:gap-6 scrollbar-hide">
            <div className="w-full shrink-0">
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 sm:mb-3 ml-1">Templates Disponíveis:</p>
              {isLoadingTemplates ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin h-5 w-5 text-primary" /></div>
              ) : (
                <ScrollArea className="w-full whitespace-nowrap rounded-xl border p-2 bg-muted/20">
                  <div className="flex w-max space-x-3 p-1">
                    {availableTemplates.map((tpl) => {
                      const isVip = tpl.id.toLowerCase().includes('vip');
                      const isLocked = isVip && !isPremiumUser;
                      return (
                        <button
                          key={tpl.id}
                          onClick={() => handleTemplateClick(tpl)}
                          className={cn(
                            "relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all border-2",
                            selectedTemplateId === tpl.id ? "border-primary bg-primary/5 shadow-md" : "border-transparent hover:border-primary/20",
                            isLocked && "grayscale opacity-80"
                          )}
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shadow-inner overflow-hidden relative bg-black">
                            <Image src={tpl.imageUrl} alt={tpl.name} fill className="object-cover" />
                            {isLocked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Lock className="w-4 h-4 text-white" /></div>}
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter">{tpl.name}</span>
                            {isVip && <Badge className="h-3 text-[5px] font-black uppercase bg-primary/20 text-primary border-none px-1">VIP</Badge>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </div>

            <div className="w-full flex justify-center py-1 shrink-0">
              <div 
                ref={shareCardRef}
                className={cn(
                  "relative overflow-hidden shadow-2xl transition-all duration-700",
                  "w-[min(92vw,400px)] aspect-square rounded-[2rem] sm:rounded-[2.5rem] flex flex-col items-center"
                )}
                style={{ backgroundColor: activeTemplate?.style.background || '#000000' }}
              >
                   {activeTemplate?.imageUrl && <div className="absolute inset-0 z-0"><Image src={activeTemplate.imageUrl} alt="Bg" fill className="object-cover" priority /></div>}
                   <div className="relative z-10 w-full flex flex-col h-full justify-between items-center p-6 sm:p-12">
                      <div className="text-center space-y-1 mt-2 sm:mt-4">
                        <p className={cn("text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em]", activeTemplate?.style.color === '#ffffff' ? "text-white/80" : "text-black/80")}>RELATO DE CLIENTE</p>
                      </div>
                      <div className="flex-1 flex flex-col justify-center items-center w-full py-2 text-center">
                        <div className="flex justify-center gap-1 mb-3 sm:mb-4">
                            {[1,2,3,4,5].map((_, i) => <Star key={i} className="w-4 h-4 sm:w-7 sm:h-7 fill-[#fbbf24] text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />)}
                        </div>
                        <div className="relative w-full max-w-[90%] sm:max-w-[85%]">
                          <Quote className={cn("absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-4 h-4 sm:w-5 sm:h-5 opacity-20 rotate-180", activeTemplate?.style.color === '#ffffff' ? "text-white" : "text-black")} />
                          <div className={cn("p-4 sm:p-7 rounded-[1.5rem] sm:rounded-[1.8rem] shadow-2xl ring-1", activeTemplate?.style.color === '#ffffff' ? "bg-white/5 backdrop-blur-xl border-white/10 ring-white/5" : "bg-black/5 backdrop-blur-md border-black/5 ring-black/5")}>
                            <p className={cn("font-black font-headline leading-tight italic tracking-tight", activeTemplate?.style.color === '#ffffff' ? "text-white" : "text-black", (selectedTestimonialForShare?.text?.length || 0) > 180 ? "text-[9px] sm:text-xs" : (selectedTestimonialForShare?.text?.length || 0) > 120 ? "text-[10px] sm:text-sm" : (selectedTestimonialForShare?.text?.length || 0) > 80 ? "text-xs sm:text-base" : "text-base sm:text-xl")}>"{selectedTestimonialForShare?.text}"</p>
                          </div>
                          <Quote className={cn("absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-4 h-4 sm:w-5 sm:h-5 opacity-20", activeTemplate?.style.color === '#ffffff' ? "text-white" : "text-black")} />
                        </div>
                      </div>
                      <div className={cn("w-full pt-3 sm:pt-4 mb-2 sm:mb-4", activeTemplate?.style.color === '#ffffff' ? "border-t border-white/10" : "border-t border-black/10")}>
                          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                            <p className={cn("font-black text-[9px] sm:text-xs uppercase tracking-[0.3em]", activeTemplate?.style.color === '#ffffff' ? "text-white" : "text-black")}>{selectedTestimonialForShare?.userName}</p>
                            <div className={cn("px-3 sm:px-4 py-0.5 sm:py-1 rounded-full border inline-flex items-center gap-1 sm:gap-1.5 backdrop-blur-md shadow-sm", activeTemplate?.style.color === '#ffffff' ? "bg-primary/20 border-primary/30" : "bg-primary/10 border-primary/20")}>
                                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary fill-primary/5" />
                                <p className={cn("text-[5px] sm:text-[7px] font-black uppercase tracking-[0.15em]", activeTemplate?.style.color === '#ffffff' ? "text-white" : "text-black")}>coletado via Proova</p>
                            </div>
                          </div>
                      </div>
                   </div>
              </div>
            </div>

            <Button 
              className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest shadow-2xl gap-3 transition-all active:scale-95 text-[10px] sm:text-xs bg-primary hover:bg-primary/90 text-white"
              onClick={handleDownloadContent}
              disabled={isExportingCard}
            >
              {isExportingCard ? <Loader2 className="animate-spin h-5 w-5" /> : <Download className="w-4 h-4 sm:w-5 sm:h-5" />}
              {selectedTestimonialForShare?.videoUrl ? 'Baixar Vídeo Review' : 'Gerar Arte PNG'}
            </Button>
          </div>
          
          <DialogFooter className="p-4 sm:p-6 bg-muted/30 border-t flex flex-col items-center text-center shrink-0">
            <p className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary" /> Dica: Poste este card no seu Story para aumentar seu alcance.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isGoogleMapsDialogOpen} onOpenChange={setIsGoogleMapsDialogOpen}>
        <DialogContent className="rounded-[2.5rem] w-[95vw] sm:max-w-md border-none shadow-2xl overflow-hidden p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-2 pt-10 shrink-0 bg-background">
            <DialogTitle className="text-xl md:text-2xl font-black font-headline flex items-center gap-2">
              {configMode === 'business' ? <Fingerprint className="w-6 h-6 text-primary" /> : <MapPinned className="w-6 h-6 text-primary" />} 
              {configMode === 'location' ? 'Localização' : (configMode === 'business' ? 'Identidade' : 'Perfil Comercial')}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {configMode === 'location' ? 'Defina a cidade onde seu negócio opera.' : (configMode === 'business' ? 'Personalize o nome e o link da sua página.' : 'Conecte sua empresa ao Google Business.')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 scrollbar-hide">
            {configMode === 'location' && (
              <section className="space-y-4 pt-2 animate-in fade-in zoom-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Cidade</Label>
                    <Input placeholder="Ex: São Paulo" value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Estado (UF)</Label>
                    <Input placeholder="Ex: SP" value={state} maxLength={2} onChange={(e) => setState(e.target.value.toUpperCase())} className="h-10 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs uppercase" />
                  </div>
                </div>
                <Button onClick={handleUpdateLocation} disabled={!city || !state} className="w-full h-12 rounded-xl font-bold text-sm shadow-md gap-2"><Save className="h-4 w-4" /> Confirmar e Salvar</Button>
              </section>
            )}
            {configMode === 'business' && (
              <section className="space-y-4 pt-2 animate-in fade-in zoom-in duration-300">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Nome da Empresa</Label>
                    <Input placeholder="Ex: Minha Empresa" value={companyNameEdit} onChange={(e) => setCompanyNameEdit(e.target.value)} className="h-11 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Slug do Link (URL Personalizada)</Label>
                    <div className="flex items-center gap-1 bg-muted/20 rounded-xl px-3 border border-transparent focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <span className="text-[10px] font-bold opacity-40">/c/</span>
                      <input placeholder="nome-da-sua-empresa" value={companySlugEdit} onChange={(e) => setCompanySlugEdit(e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="h-11 flex-1 bg-transparent border-none focus:ring-0 text-xs font-mono" />
                    </div>
                  </div>
                </div>
                <Button onClick={handleUpdateBusinessInfo} disabled={!companyNameEdit || !companySlugEdit} className="w-full h-12 rounded-xl font-bold text-sm shadow-md gap-2"><Save className="h-4 w-4" /> Salvar Nova Identidade</Button>
              </section>
            )}
            {configMode === 'maps' && (
              <section className="space-y-4 pt-2 animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                  <div className="relative group">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input placeholder="Nome da sua empresa no Google" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchPlaces()} className="h-11 pl-10 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs" />
                    <Button size="sm" variant="ghost" onClick={handleSearchPlaces} disabled={isSearchingPlaces || !searchQuery} className="absolute right-1 top-1 h-9 rounded-lg hover:bg-primary/10 text-primary">{isSearchingPlaces ? <Loader2 className="animate-spin w-4 h-4" /> : <Navigation className="w-4 h-4" />}</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {searchResults.map((place) => (
                    <Card key={place.place_id} className="border-2 border-transparent hover:border-primary/20 cursor-pointer transition-all bg-muted/10 group" onClick={() => handleSelectPlace(place)}>
                      <div className="p-3 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-background group-hover:bg-primary/10 transition-colors"><MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary" /></div>
                        <div className="min-w-0 flex-1"><p className="text-xs font-black truncate">{place.name}</p><p className="text-[10px] text-muted-foreground truncate opacity-70">{place.address}</p></div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Card>
                  ))}
                  {isSearchingPlaces && <div className="py-8 text-center"><Loader2 className="animate-spin w-6 h-6 text-primary mx-auto mb-2" /><p className="text-[10px] font-bold text-muted-foreground uppercase">Consultando Satélite...</p></div>}
                </div>
                <section className="space-y-3 pt-4 border-t opacity-60"><div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-primary" /><h4 className="text-[10px] font-black uppercase tracking-widest">Como funciona o G-Boost?</h4></div><p className="text-[10px] text-muted-foreground leading-relaxed">O Proova detecta elogios 5 estrelas e redireciona o cliente para este local no Google. Isso sobe sua posição nas buscas.</p></section>
              </section>
            )}
          </div>
          <div className="p-6 bg-background border-t shrink-0"><Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground" onClick={() => setIsGoogleMapsDialogOpen(false)}>Fechar Configurações</Button></div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isQrDialogOpenManual} onOpenChange={setIsQrDialogOpenManual}>
        <DialogContent className="rounded-[2.5rem] w-[95vw] sm:max-w-[420px] border-none shadow-2xl p-0 overflow-hidden bg-background flex flex-col max-h-[90vh]">
          <div className="h-2 bg-primary w-full shrink-0" />
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <DialogHeader className="p-6 pb-2 text-center shrink-0">
              <DialogTitle className="text-xl md:text-2xl font-black font-headline tracking-tight uppercase">Cartaz de Balcão</DialogTitle>
              <DialogDescription className="text-xs md:text-sm font-medium">Capture elogios reais diretamente no ponto de venda.</DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-8 flex flex-col items-center space-y-6">
              <div className="relative group mt-2">
                <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-700" />
                <div id="qr-container-print" className="relative bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-primary/5 flex flex-col items-center space-y-4">
                  <QRCodeSVG value={collectionLink} size={160} level="H" includeMargin={false} imageSettings={{ src: "/logo-proova-landing-white-mode.png", x: undefined, y: undefined, height: 36, width: 36, excavate: true }} />
                  <div className="pt-2 text-center space-y-1"><p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.2em]">Escaneie para Avaliar</p><p className="text-[7px] md:text-[8px] font-bold text-muted-foreground uppercase">{userData?.companyName}</p></div>
                </div>
              </div>
              <div className="w-full space-y-4">
                <Button className="w-full h-12 md:h-14 rounded-2xl text-base md:text-lg font-black shadow-xl gap-3 transition-all hover:scale-[1.02] active:scale-95" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>{isGeneratingPdf ? <Loader2 className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />} Baixar PDF de Impressão</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function copyToClipboard(text: string, description: string) {
  navigator.clipboard.writeText(text);
}
