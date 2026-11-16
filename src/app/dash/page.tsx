'use client';

import { AppSideMenu } from '@/components/app-menu';
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
  BellRing,
  Menu,
  Bot
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
  SheetDescription,
  SheetTrigger,
  SheetClose
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
import { OnboardingTour, type TourStep } from '@/components/onboarding-tour';
import { saveGooglePlace } from '@/lib/google-place-client';
import { normalizeBrWhatsapp, whatsappLink, maskBrPhone } from '@/lib/whatsapp';
import { doc, collection, query, updateDoc, orderBy, limit, where, getDocs, Timestamp, serverTimestamp, arrayUnion, deleteField } from 'firebase/firestore';
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
import { generateReplyAction } from '@/ai/flows/generate-reply-flow';

export default function DashPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [baseUrl, setBaseUrl] = useState('');
  
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('7');
  const [activeHash, setActiveHash] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // States para formulários e buscas
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [companyNameEdit, setCompanyNameEdit] = useState('');
  const [companySlugEdit, setCompanySlugEdit] = useState('');

  // Avaliações do Google Maps (preenchidas pelo servidor: Apify hoje, API oficial depois)
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [localReplies, setLocalReplies] = useState<Record<string, string>>({});
  const [isRefreshingReviews, setIsRefreshingReviews] = useState(false);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  // Tour de boas-vindas: só para contas novas (onboardingDone === false) ou ao abrir /dash?tour=1.
  const [tourForced, setTourForced] = useState(false);
  const [tourClosed, setTourClosed] = useState(false);
  useEffect(() => {
    try { setTourForced(new URLSearchParams(window.location.search).get('tour') === '1'); } catch {}
  }, []);
  const showTour = !tourClosed && !activeHash && (tourForced || (userData as any)?.onboardingDone === false);
  const tourSteps: TourStep[] = useMemo(() => [
    { title: 'Bem-vindo ao Proova AI! 👋', text: 'Em menos de 1 minuto você vai conhecer o painel e saber por onde começar. Dá pra pular quando quiser.' },
    { target: 'menu', title: 'Menu de navegação', text: 'Aqui ficam a localização, o Google Maps, o link de coleta, o Link in Bio, o cartaz de balcão, a identidade da marca e as configurações da conta.' },
    { target: 'setup', title: 'Complete sua configuração', text: 'Informe a localização e o link do Google Maps para a coleta e o redirecionamento de avaliações funcionarem. Este aviso some quando terminar.' },
    { target: 'metrics', title: 'Seus números', text: 'Acompanhe os elogios coletados e a sua nota. Use o filtro de período para ver a evolução.' },
    { target: 'reviews', title: 'Avaliações & IA', text: 'Os depoimentos e avaliações chegam aqui. Gere uma resposta com IA, copie e responda em segundos.' },
    { title: 'Tudo pronto! 🚀', text: 'Depois de configurar, compartilhe seu link de coleta com os clientes e veja a prova social crescer. Para rever este tour, abra o painel com ?tour=1 no endereço.' },
  ], []);
  // Mini-tour da tela de localização: só na primeira vez (cidade ainda não definida).
  const [locationTourClosed, setLocationTourClosed] = useState(false);
  const showLocationTour = !locationTourClosed && (activeHash === 'localizacao' || activeHash === 'google-maps')
    && !!userData && !(userData as any).city && !(userData as any).locationTourDone;
  const locationTourSteps: TourStep[] = useMemo(() => [
    { target: 'loc-fields', title: '1. Cidade e UF', text: 'Informe a cidade e o estado do seu negócio. Isso melhora a busca da sua empresa no Google.' },
    { target: 'loc-search', title: '2. Encontre sua empresa', text: 'Pesquise o nome da clínica e toque no resultado correto. É esse vínculo que permite coletar e redirecionar avaliações para o seu perfil do Google.' },
    { target: 'loc-save', title: '3. Salve a localização', text: 'Com tudo conferido, salve. Você pode editar essas informações quando quiser.' },
  ], []);
  const finishLocationTour = () => {
    setLocationTourClosed(true);
    if (user && db) updateDoc(doc(db, 'users', user.uid), { locationTourDone: true }).catch(() => {});
  };
  const finishTour = () => {
    setTourClosed(true);
    if (user && db) updateDoc(doc(db, 'users', user.uid), { onboardingDone: true }).catch(() => {});
  };

  const { permission, requestPermission, isSupported: pushSupported } = useNotifications(user?.uid);

  const googleReviewsQuery = useMemo(
    () => (db && user ? query(collection(db, 'users', user.uid, 'googleReviews'), orderBy('fetchedAt', 'desc'), limit(30)) : null),
    [db, user]
  );
  const { data: googleReviews, loading: isLoadingApi } = useCollection(googleReviewsQuery);
  // Só as que ainda precisam de atenção do dono
  const apiSuggestions = useMemo(
    () => (googleReviews || []).filter((r: any) => r.status === 'pending' || r.status === 'copied'),
    [googleReviews]
  );

  // Deep Linking Logic
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveHash(hash);
      
      if (userData) {
        if (hash === 'localizacao' || hash === 'google-maps') {
          setCity(userData.city || '');
          setState(userData.state || '');
        }
        if (hash === 'identidade') {
          setCompanyNameEdit(userData.companyName || '');
          setCompanySlugEdit(userData.companySlug || '');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [userData]);

  const clearHash = () => {
    window.history.replaceState(null, '', window.location.pathname);
    setActiveHash('');
  };

  const isPremiumUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const isAgency = useMemo(() => userData?.businessType === 'agencia', [userData]);
  const isDigitalBusiness = useMemo(() => userData?.businessType === 'agencia' || userData?.businessType === 'servicos_digitais', [userData]);

  // Firestore Queries
  const announcementsQuery = useMemo(() => (db ? collection(db, 'announcements') : null), [db]);
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

  const allTestimonialsQuery = useMemo(() => (db && user ? collection(db, 'users', user.uid, 'testimonials') : null), [db, user]);
  const { data: allFetchedTestimonials, loading: testimonialsLoading } = useCollection(allTestimonialsQuery);

  const pendingTestimonialsCount = useMemo(() => (allFetchedTestimonials || []).filter((t: any) => t.status === 'pending').length, [allFetchedTestimonials]);
  const approvedTestimonials = useMemo(() => {
    return (allFetchedTestimonials || [])
      .filter((t: any) => t.status === 'approved')
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [allFetchedTestimonials]);

  const aiRepliesCount = useMemo(() => {
    const firestoreCount = (approvedTestimonials || []).filter((t: any) => !!t.aiReply).length;
    const apiCount = apiSuggestions.filter((r: any) => !!r.aiReply).length;
    return firestoreCount + apiCount;
  }, [approvedTestimonials, apiSuggestions]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'PREMIUM';
    if (status === 'trial') return 'TRIAL';
    return 'PLANO BASE';
  }, [userData]);

  useEffect(() => { if (typeof window !== 'undefined') setBaseUrl(window.location.origin); }, []);

  useEffect(() => { if (!authLoading && !user) router.replace('/login'); }, [user, authLoading, router]);

  // Setup Progress Logic
  const setupSteps = useMemo(() => {
    const allSteps = [];
    allSteps.push({ id: 'location', label: 'Localização', completed: !!userData?.city, unlocked: true, action: () => window.location.hash = 'localizacao' });
    if (!isDigitalBusiness) {
      const prev = allSteps[allSteps.length - 1];
      allSteps.push({ id: 'google', label: 'Google Maps', completed: !!userData?.googleMapsUrl, unlocked: prev.completed, action: () => window.location.hash = 'google-maps' });
    }
    const last = allSteps[allSteps.length - 1];
    allSteps.push({ id: 'collect', label: 'Coleta Ativa', completed: (userData?.testimonialsCount || 0) > 0, unlocked: last.completed, action: () => window.location.hash = 'link-coleta' });
    return allSteps;
  }, [userData, isDigitalBusiness]);

  const completedStepsCount = setupSteps.filter(s => s.completed).length;
  const progressPercentage = (completedStepsCount / setupSteps.length) * 100;
  const isSetupComplete = completedStepsCount === setupSteps.length;
  // Aviso discreto: só localização e Google Maps (a "coleta ativa" não é pendência de configuração).
  const pendingSetup = useMemo(() => {
    if (userDataLoading || !userData) return null;
    const missing = setupSteps.filter((st) => st.id !== 'collect' && !st.completed);
    if (missing.length === 0) return null;
    return { labels: missing.map((m) => m.label).join(' e '), action: missing[0].action };
  }, [setupSteps, userData, userDataLoading]);

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    shadcnToast({ title: "Copiado!", description: `${description} copiado.` });
  };

  const setReviewStatus = async (id: string, status: 'copied' | 'dismissed' | 'replied') => {
    if (!db || !user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'googleReviews', id), {
        status,
        ...(status === 'copied' ? { copiedAt: serverTimestamp() } : {}),
      });
    } catch {
      shadcnToast({ variant: "destructive", title: "Não foi possível atualizar", description: "Tente novamente em instantes." });
    }
  };

  const copyReviewReply = (id: string, reply: string) => {
    copyToClipboard(reply, "Resposta");
    const current = (googleReviews || []).find((r: any) => r.id === id) as any;
    if (current?.status === 'pending') setReviewStatus(id, 'copied');
  };

  const handleRefreshReviews = async () => {
    if (!user || isRefreshingReviews) return;
    setIsRefreshingReviews(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/reviews/refresh', { method: 'POST', headers: { Authorization: `Bearer ${idToken}` } });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        shadcnToast({ title: "Buscando avaliações…", description: "Em cerca de 1 minuto as novas avaliações aparecem aqui." });
      } else if (res.status === 429) {
        shadcnToast({ title: "Aguarde um pouco", description: `Nova busca disponível em ${Math.ceil((data.retryInSeconds || 900) / 60)} min.` });
      } else if (data.error === 'no_place') {
        shadcnToast({ variant: "destructive", title: "Vincule pela busca do Google", description: "A busca automática precisa da empresa selecionada na busca do Google (links manuais não permitem). Refaça o vínculo em Configurações > Google." });
      } else if (res.status === 403) {
        shadcnToast({ variant: "destructive", title: "Recurso Premium", description: "A busca automática é exclusiva dos planos Proova AI Premium e PRO." });
      } else {
        throw new Error('fail');
      }
    } catch {
      shadcnToast({ variant: "destructive", title: "Erro na busca", description: "Não foi possível iniciar agora." });
    } finally {
      setIsRefreshingReviews(false);
    }
  };

  const handleSearchPlaces = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingPlaces(true);
    try {
      const results = await searchGooglePlaces(searchQuery, city || userData?.city, state || userData?.state);
      setSearchResults(results);
    } catch (err) { shadcnToast({ variant: "destructive", title: "Erro na busca" }); } finally { setIsSearchingPlaces(false); }
  };

  const [manualLink, setManualLink] = useState('');
  const [isSavingLink, setIsSavingLink] = useState(false);

  const handleSelectPlace = async (place: any) => {
    if (!user) return;
    if (place?.isMock) {
      shadcnToast({ variant: "destructive", title: "Busca do Google indisponível", description: "Use a opção de colar o link da sua empresa logo abaixo." });
      return;
    }
    try {
      await saveGooglePlace(user, {
        placeId: place.place_id,
        ...(city.trim() && state.trim().length === 2 ? { city: city.trim(), state: state.trim() } : {}),
      });
      shadcnToast({ title: "G-Boost Ativado!", description: "Empresa vinculada com sucesso." });
      setSearchResults([]);
      clearHash();
    } catch (err: any) {
      console.error('[google-place]', err);
      shadcnToast({ variant: "destructive", title: "Erro ao salvar", description: err?.message });
    }
  };

  const handleSaveManualLink = async () => {
    if (!user || !manualLink.trim() || isSavingLink) return;
    setIsSavingLink(true);
    try {
      const saved = await saveGooglePlace(user, {
        url: manualLink.trim(),
        ...(city.trim() && state.trim().length === 2 ? { city: city.trim(), state: state.trim() } : {}),
      });
      shadcnToast({ title: "Link salvo!", description: saved.googlePlaceId ? "Empresa identificada: o botão de avaliação e a busca automática já funcionam." : "O botão de avaliação no Google já usa este link. A busca automática de avaliações precisa da empresa selecionada na busca." });
      setManualLink('');
      clearHash();
    } catch (err: any) {
      shadcnToast({ variant: "destructive", title: "Não foi possível salvar o link", description: err?.message });
    } finally {
      setIsSavingLink(false);
    }
  };

  const [waInput, setWaInput] = useState('');
  const [isSavingWa, setIsSavingWa] = useState(false);
  const handleSaveWhatsapp = async () => {
    if (!db || !user || isSavingWa) return;
    const n = normalizeBrWhatsapp(waInput);
    if (!n) {
      shadcnToast({ variant: "destructive", title: "WhatsApp inválido", description: "Informe com DDD, por exemplo (85) 99999-9999." });
      return;
    }
    setIsSavingWa(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { contactWhatsapp: n });
      setWaInput('');
      shadcnToast({ title: "WhatsApp salvo!", description: "Clientes insatisfeitos já poderão falar com a clínica por ele." });
    } catch (err: any) {
      shadcnToast({ variant: "destructive", title: "Erro ao salvar", description: err?.message });
    } finally {
      setIsSavingWa(false);
    }
  };

  const approveDraft = async (id: string, draft: string) => {
    if (!db || !user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'testimonials', id), { aiReply: draft, aiReplyDraft: deleteField() });
      shadcnToast({ title: "Resposta publicada", description: "Ela já aparece na sua página pública." });
    } catch { shadcnToast({ variant: "destructive", title: "Erro ao publicar" }); }
  };
  const discardDraft = async (id: string) => {
    if (!db || !user) return;
    try { await updateDoc(doc(db, 'users', user.uid, 'testimonials', id), { aiReplyDraft: deleteField() }); }
    catch { shadcnToast({ variant: "destructive", title: "Erro ao descartar" }); }
  };

  const handleUpdateLocation = async () => {
    if (!db || !user || !city || !state) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { city, state });
      shadcnToast({ title: "Localização Atualizada" });
      clearHash();
    } catch (err) { shadcnToast({ variant: "destructive", title: "Erro ao salvar" }); }
  };

  const handleUpdateBusinessInfo = async () => {
    if (!db || !user || !companyNameEdit || !companySlugEdit) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { companyName: companyNameEdit, companySlug: companySlugEdit.toLowerCase().replace(/\s+/g, '-') });
      shadcnToast({ title: "Identidade Atualizada" });
      clearHash();
    } catch (err) { shadcnToast({ variant: "destructive", title: "Erro ao salvar" }); }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const qrElement = document.getElementById('qr-container-print');
      if (!qrElement) throw new Error();
      const qrImage = await toPng(qrElement, { pixelRatio: 4, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      pdf.setFillColor(249, 115, 22); pdf.rect(0, 0, pageWidth, 20, 'F');
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(36); pdf.text('SUA OPINIÃO É', pageWidth / 2, 50, { align: 'center' });
      pdf.text('MUITO IMPORTANTE!', pageWidth / 2, 65, { align: 'center' });
      pdf.setFontSize(20); pdf.text(userData?.companyName || 'Nossa Empresa', pageWidth / 2, 85, { align: 'center' });
      pdf.addImage(qrImage, 'PNG', (pageWidth - 130) / 2, 105, 130, 130);
      pdf.save(`cartaz-${userData?.companySlug}.pdf`);
      shadcnToast({ title: "PDF Gerado!" });
    } catch (err) { shadcnToast({ variant: "destructive", title: "Erro na geração" }); } finally { setIsGeneratingPdf(false); }
  };

  // Lógica para regerar resposta por IA
  const handleRegenerateResponse = async (id: string, name: string, text: string, stars: number, isApi: boolean = false) => {
    if (isRegenerating || !userData) return;
    setIsRegenerating(id);

    try {
      const result = await generateReplyAction({
        authorName: name,
        testimonialText: text,
        rating: stars,
        companyName: userData.companyName,
        businessType: userData.businessType,
        contactWhatsapp: userData.contactWhatsapp || undefined,
      });

      if (isApi) {
        setLocalReplies(prev => ({ ...prev, [id]: result.reply }));
      } else {
        if (!db || !user) return;
        const tRef = doc(db, 'users', user.uid, 'testimonials', id);
        // Nota baixa ainda sem resposta publicada: a nova versão continua sendo rascunho.
        const current: any = (approvedTestimonials || []).find((x: any) => x.id === id);
        const stayDraft = stars <= 3 && !current?.aiReply;
        await updateDoc(tRef, stayDraft ? { aiReplyDraft: result.reply } : { aiReply: result.reply });
      }

      shadcnToast({ title: "Resposta Atualizada ✨", description: "O Gemini gerou uma nova sugestão estratégica." });
    } catch (err) {
      shadcnToast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível regerar a resposta agora." });
    } finally {
      setIsRegenerating(null);
    }
  };

  const filteredMetrics = useMemo(() => {
    if (period === 'all') return { count: (userData?.testimonialsCount || 0) + apiSuggestions.length, label: 'Total acumulado' };
    const cutoff = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    const count = (approvedTestimonials || []).filter((t: any) => (t.createdAt?.toDate?.() || new Date()) >= cutoff).length + apiSuggestions.length;
    return { count, label: `Últimos ${period} dias` };
  }, [approvedTestimonials, period, userData, apiSuggestions]);

  if (authLoading || userDataLoading || !userData) return <LoadingScreen />;

  const collectionLink = `${baseUrl}/c/${userData?.companySlug}`;
  const publicPageLink = `${baseUrl}/pp/${userData?.companySlug}`;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
      {showTour && <OnboardingTour steps={tourSteps} onFinish={finishTour} />}
      {showLocationTour && <OnboardingTour steps={locationTourSteps} onFinish={finishLocationTour} />}
      {currentAnnouncement && !isAnnouncementDismissed && !activeHash && (
        <div className={cn(
          "w-full py-3 flex items-center relative overflow-hidden transition-all duration-500 z-[130] border-b border-white/10",
          currentAnnouncement.type === 'info' && "bg-blue-600 text-white",
          currentAnnouncement.type === 'warning' && "bg-orange-500 text-white",
          currentAnnouncement.type === 'success' && "bg-green-600 text-white",
          currentAnnouncement.type === 'destructive' && "bg-red-600 text-white"
        )}>
          <div className="flex-1 overflow-hidden flex items-center px-4">
            <Megaphone className="w-4 h-4 mr-3 shrink-0" />
            <span className="font-black uppercase tracking-widest text-[11px] mr-2 truncate">{currentAnnouncement.title}:</span>
            <p className="text-[11px] md:text-sm font-bold opacity-95 truncate">{currentAnnouncement.message}</p>
          </div>
          <button onClick={() => setIsAnnouncementDismissed(true)} className="p-2.5 mr-2 rounded-full hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      <header className="bg-background border-b h-16 md:h-20 flex items-center px-2 md:px-4 fixed top-0 w-full z-[120] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-2">
          <button 
            data-tour="menu"
            ref={toggleButtonRef}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="h-10 w-10 rounded-xl hover:bg-primary/5 text-primary border border-primary/10 transition-all flex items-center justify-center focus:outline-none z-[150] relative"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
              <line x1="4" x2="20" y1="7" y2="7" className={cn("origin-center transition-all", isMenuOpen ? "translate-y-[5px] rotate-45" : "")} />
              <line x1="4" x2="20" y1="12" y2="12" className={cn("origin-center transition-all", isMenuOpen ? "opacity-0" : "")} />
              <line x1="4" x2="20" y1="17" y2="17" className={cn("origin-center transition-all", isMenuOpen ? "-translate-y-[5px] -rotate-45" : "")} />
            </svg>
          </button>
          <Link href="/dash" className="flex items-center group -ml-2" onClick={clearHash}>
            <div className="relative w-[180px] h-[60px] md:w-[280px] md:h-[93px] transition-transform group-hover:scale-105">
              <Image src="/logo-proovaai-whitemode.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/logo-proovaai-darkmode.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="flex border-none bg-transparent shadow-none hover:bg-transparent focus:bg-transparent" />
        </div>
      </header>

      <AppSideMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} toggleRef={toggleButtonRef} companyName={userData?.companyName} membershipLabel={membershipLabel} pendingCount={pendingTestimonialsCount} onHome={clearHash} onHash={(h) => { window.location.hash = h; }} />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pt-20 md:pt-32 pb-12">
        
        {activeHash ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            <header className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-5xl break-words font-black font-headline tracking-tighter uppercase">
                  {activeHash === 'link-coleta' && 'Link de Coleta'}
                  {activeHash === 'bio' && 'Link in Bio'}
                  {activeHash === 'qr' && 'Cartaz de Balcão'}
                  {activeHash === 'google-maps' && 'Perfil Comercial'}
                  {activeHash === 'localizacao' && 'Localização'}
                  {activeHash === 'identidade' && 'Identidade de Marca'}
                </h1>
                <p className="text-muted-foreground text-sm font-medium">Configuração Estratégica Proova</p>
              </div>
              <button 
                onClick={clearHash}
                className="h-10 w-10 rounded-xl hover:bg-primary/5 text-primary border border-primary/10 transition-all flex items-center justify-center focus:outline-none"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
                  <line x1="4" y1="7" x2="20" y2="7" className="origin-center translate-y-[5px] rotate-45" />
                  <line x1="4" y1="12" x2="20" y2="12" className="origin-center opacity-0" />
                  <line x1="4" y1="17" x2="20" y2="17" className="origin-center -translate-y-[5px] -rotate-45" />
                </svg>
              </button>
            </header>

            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-background">
              <div className={cn(activeHash === 'qr' ? 'p-3' : 'p-5', 'sm:p-8 md:p-12')}>
                {activeHash === 'link-coleta' && (
                  <div className="max-w-md mx-auto space-y-8">
                    <div className="flex flex-col items-center gap-6 text-center">
                       <div className="p-5 rounded-3xl bg-primary/10 text-primary"><Link2 className="w-10 h-10" /></div>
                       <p className="text-sm font-medium text-muted-foreground">Envie este link aos seus clientes após o atendimento para capturar elogios instantâneos.</p>
                    </div>
                    <Button className="w-full h-16 rounded-2xl text-lg font-black gap-3 shadow-xl bg-primary hover:bg-primary/90" onClick={() => copyToClipboard(collectionLink, "Link de coleta")}>
                       <Copy className="w-5 h-5" /> Copiar Link de Coleta
                    </Button>
                  </div>
                )}

                {activeHash === 'bio' && (
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                       <div className="p-5 rounded-3xl bg-primary/10 text-primary"><Globe className="w-10 h-10" /></div>
                       <p className="text-sm font-medium text-muted-foreground">Sua vitrine oficial de depoimentos. Ideal para o link da bio do Instagram.</p>
                    </div>
                    <div className="grid gap-3">
                       <Button className="h-14 rounded-xl font-black uppercase tracking-widest gap-3" onClick={() => router.push(`/pp/${userData.companySlug}`)}>
                          <Eye className="w-5 h-5" /> Visualizar Página
                       </Button>
                       <Button variant="outline" className="h-14 rounded-xl font-black uppercase tracking-widest gap-3 border-primary/20 text-primary" onClick={() => router.push('/ppeditor')}>
                          <Settings className="w-5 h-5" /> Configurar Temas
                       </Button>
                       <Button variant="ghost" className="text-[10px] font-black uppercase text-primary" onClick={() => copyToClipboard(publicPageLink, "Link da bio")}>Copiar URL da Página</Button>
                    </div>
                  </div>
                )}

                {activeHash === 'qr' && (
                  <div className="flex flex-col items-center space-y-10">
                    <div id="qr-container-print" className="bg-white p-10 rounded-[2.5rem] shadow-2xl border-[12px] border-primary/5 flex flex-col items-center gap-6">
                      <QRCodeSVG value={collectionLink} size={200} level="H" />
                      <div className="text-center space-y-1">
                        <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Escaneie para Avaliar</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{userData?.companyName}</p>
                      </div>
                    </div>
                    <Button className="w-full h-14 md:h-16 max-w-sm rounded-2xl text-xs md:text-lg font-black gap-3 shadow-xl" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                      {isGeneratingPdf ? <Loader2 className="animate-spin" /> : <Download className="w-5 h-5 md:w-6 md:h-6" />} Baixar PDF para Impressão
                    </Button>
                  </div>
                )}

                {(activeHash === 'google-maps' || activeHash === 'localizacao') && (
                  <div className="max-w-2xl mx-auto space-y-8">
                     <div data-tour="loc-fields" className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase opacity-60">Cidade Atual</Label>
                           <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase opacity-60">UF</Label>
                           <Input value={state} maxLength={2} onChange={(e) => setState(e.target.value.toUpperCase())} className="h-12 rounded-xl text-center font-black" />
                        </div>
                     </div>
                     <Button data-tour="loc-save" className="w-full h-14 rounded-xl font-bold" onClick={handleUpdateLocation}>Atualizar Localização</Button>
                     
                     <div data-tour="loc-search" className="pt-8 border-t space-y-6">
                        <Label className="text-[10px] font-black uppercase opacity-60">Vincular Empresa no Google (G-Boost)</Label>
                        <div className="relative">
                           <Input placeholder="Pesquise o nome da clínica..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchPlaces()} className="h-14 pl-12 rounded-2xl bg-muted/20 border-transparent" />
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                           <Button size="sm" variant="ghost" onClick={handleSearchPlaces} disabled={isSearchingPlaces} className="absolute right-2 top-2 h-10 rounded-xl text-primary">
                             {isSearchingPlaces ? <Loader2 className="animate-spin" /> : <Navigation className="w-5 h-5" />}
                           </Button>
                        </div>
                        <div className="space-y-2">
                           {searchResults.map((p) => (
                             <div key={p.place_id} onClick={() => handleSelectPlace(p)} className="p-4 rounded-xl bg-muted/10 border-2 border-transparent hover:border-primary/20 cursor-pointer transition-all flex items-center justify-between group">
                                <div className="min-w-0"><p className="font-bold text-sm uppercase break-words">{p.name}</p><p className="text-[10px] text-muted-foreground break-words">{p.address}</p></div>
                                <ChevronRight className="w-4 h-4 shrink-0 opacity-20 group-hover:opacity-100" />
                             </div>
                           ))}
                        </div>

                        <div className="space-y-3 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4">
                          <p className="text-xs font-black uppercase tracking-tight">Não encontrou sua empresa?</p>
                          <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                            Se o estabelecimento é novo e ainda não aparece na busca, cole aqui o link de avaliação do seu perfil no Google
                            (no Google Meu Negócio, use "Pedir avaliações" e copie o link).
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              placeholder="https://g.page/r/... ou https://maps.app.goo.gl/..."
                              value={manualLink}
                              onChange={(e) => setManualLink(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveManualLink()}
                              className="h-12 rounded-xl bg-background text-sm font-medium"
                            />
                            <Button onClick={handleSaveManualLink} disabled={isSavingLink || !manualLink.trim()} className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shrink-0">
                              {isSavingLink ? <Loader2 className="animate-spin w-4 h-4" /> : 'Salvar link'}
                            </Button>
                          </div>
                        </div>
                     </div>
                  </div>
                )}

                {activeHash === 'identidade' && (
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase opacity-60">Nome Comercial</Label>
                       <Input value={companyNameEdit} onChange={(e) => setCompanyNameEdit(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase opacity-60">Slug da URL (useproovaai.com.br/c/...)</Label>
                       <Input value={companySlugEdit} onChange={(e) => setCompanySlugEdit(e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="h-12 rounded-xl font-mono text-xs" />
                    </div>
                    <Button className="w-full h-14 rounded-xl font-bold" onClick={handleUpdateBusinessInfo}>Salvar Nova Identidade</Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-700">
            {pendingSetup && (
              <div data-tour="setup" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Rocket className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">
                    Falta configurar: <span className="text-primary">{pendingSetup.labels}</span>. Leva menos de 1 minuto.
                  </p>
                </div>
                <Button size="sm" onClick={pendingSetup.action} className="rounded-xl font-black text-[10px] uppercase tracking-widest shrink-0">
                  Completar configuração
                </Button>
              </div>
            )}

            {!!userData && !userData.contactWhatsapp && (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3">
                <div className="flex items-start gap-3 min-w-0">
                  <MessageCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">
                    Cadastre o <span className="text-green-600">WhatsApp da clínica</span>: clientes insatisfeitos poderão falar direto com você, em vez de ir para a avaliação pública.
                  </p>
                </div>
                <div className="flex gap-2 w-full lg:w-auto shrink-0">
                  <Input
                    placeholder="(85) 99999-9999"
                    inputMode="tel"
                    value={waInput}
                    onChange={(e) => setWaInput(maskBrPhone(e.target.value))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveWhatsapp()}
                    className="h-10 rounded-xl bg-background text-sm font-bold w-full lg:w-48"
                  />
                  <Button size="sm" onClick={handleSaveWhatsapp} disabled={isSavingWa || !waInput.trim()} className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest bg-green-600 hover:bg-green-700 text-white">
                    {isSavingWa ? <Loader2 className="animate-spin w-4 h-4" /> : 'Salvar'}
                  </Button>
                </div>
              </div>
            )}

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black font-headline tracking-tighter uppercase">Painel de Controle</h1>
                <p className="text-xs md:text-base text-muted-foreground font-medium">Gestão de autoridade e prova social digital</p>
              </div>
              <div className="w-full sm:w-48">
                <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
                  <SelectTrigger className="h-11 rounded-xl bg-background border-primary/20 text-[11px] font-bold uppercase tracking-wider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="all">Todo o período</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </header>

            {/* Topo Compacto: Métricas Lado a Lado */}
            <div className="grid grid-cols-2 gap-3 md:gap-6" data-tour="metrics">
              {/* Card 1: Elogios Coletados */}
              <Card className="border-none shadow-xl rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 transition-all group relative overflow-hidden bg-background">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary"><Star className="w-4 h-4 fill-primary" /></div>
                  <Badge variant="outline" className="hidden min-[400px]:flex text-[7px] md:text-[9px] font-black uppercase border-primary/30 text-primary">{filteredMetrics.label}</Badge>
                </div>
                <div className="flex items-baseline gap-2 relative z-10">
                  <span className="text-3xl md:text-6xl font-black tracking-tighter">{filteredMetrics.count}</span>
                  <div className="space-y-0">
                    <span className="text-[10px] md:text-xs font-black uppercase block">Elogios</span>
                    <p className="text-[7px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Via Proova</p>
                  </div>
                </div>
              </Card>

              {/* Card 2: Respostas IA (Automação Ativa) */}
              <Card className="border-none shadow-xl rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 transition-all group relative overflow-hidden bg-background border border-primary/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary"><Bot className="w-4 h-4" /></div>
                  <Badge variant="secondary" className="hidden min-[400px]:flex text-[7px] md:text-[9px] font-black uppercase bg-primary text-white border-none">100% IA</Badge>
                </div>
                <div className="flex items-baseline gap-2 relative z-10">
                  <span className="text-3xl md:text-6xl font-black tracking-tighter text-primary">{aiRepliesCount}</span>
                  <div className="space-y-0">
                    <span className="text-[10px] md:text-xs font-black uppercase block">Respostas</span>
                    <p className="text-[7px] md:text-[9px] font-bold text-primary/60 uppercase tracking-widest">Pilotadas via IA</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Seção Principal: Avaliações Recentes & IA (O Coração do Produto) */}
            <section className="space-y-6 pt-6" data-tour="reviews">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-2">
                <div className="flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-primary" />
                   <h2 className="text-sm md:text-lg font-black uppercase tracking-tight">Avaliações Recentes & IA</h2>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {isPremiumUser && (userData?.googlePlaceId || userData?.googleMapsUrl) && (
                    <button onClick={handleRefreshReviews} disabled={isRefreshingReviews} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:underline disabled:opacity-50">
                      <RefreshCw className={cn("w-3 h-3", isRefreshingReviews && "animate-spin")} /> Atualizar agora
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {(isLoadingApi || testimonialsLoading) && (
                   <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Loader2 className="animate-spin h-8 w-8 text-primary" />
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Processando Inteligência Digital...</p>
                   </div>
                )}

                {!isLoadingApi && apiSuggestions.length === 0 && approvedTestimonials.length === 0 && (
                  <Card className="p-8 sm:p-12 text-center border-2 border-dashed rounded-[2rem] opacity-30 bg-muted/20">
                     <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                     <p className="text-xs font-bold uppercase tracking-widest">Aguardando as primeiras avaliações...</p>
                  </Card>
                )}

                {/* Avaliações do Google Maps com rascunho de resposta da IA */}
                {apiSuggestions.map((r: any) => {
                  const reply: string = localReplies[r.id] ?? r.aiReply ?? '';
                  return (
                  <Card key={r.id} className="border-none shadow-lg rounded-[2rem] overflow-hidden bg-background group hover:shadow-xl transition-all border-l-4 border-l-primary/30">
                     <CardContent className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase shadow-inner">
                                 {r.authorName?.substring(0, 2)}
                              </div>
                              <div className="min-w-0">
                                 <p className="font-black text-xs uppercase tracking-tight leading-none truncate">{r.authorName}</p>
                                 <div className="flex items-center gap-2 mt-1">
                                    <div className="flex">
                                       {[1,2,3,4,5].map(star => <Star key={star} className={cn("w-3.5 h-3.5", star <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />)}
                                    </div>
                                    <Badge variant="secondary" className="text-[7px] font-black uppercase h-4 px-1.5 border-none bg-primary/10 text-primary">GOOGLE MAPS</Badge>
                                    {r.status === 'copied' && <Badge variant="outline" className="text-[7px] font-black uppercase h-4 px-1.5">Copiada</Badge>}
                                 </div>
                              </div>
                           </div>
                           <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> {r.publishedAt ? new Date(r.publishedAt).toLocaleDateString('pt-BR') : 'Recentemente'}
                           </span>
                        </div>

                        <p className="text-sm font-medium leading-relaxed italic opacity-80 pl-3 sm:pl-4 border-l-2 border-primary/10 break-words">
                           {r.text ? `"${r.text}"` : 'Avaliação apenas com estrelas, sem comentário.'}
                        </p>

                        <div className="mt-4 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 space-y-3">
                           <div className="flex items-start justify-between gap-3">
                           <div className="flex items-center gap-2 min-w-0">
                              <div className="p-1.5 rounded-lg bg-primary text-white">
                                 <Sparkles className="w-3 h-3" />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-primary">Resposta Sugerida pela IA</span>
                           </div>
                           <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleRegenerateResponse(r.id, r.authorName, r.text || '', r.rating, true)}
                                disabled={isRegenerating === r.id}
                                className="p-2 rounded-xl bg-background border shadow-sm hover:bg-muted transition-all active:scale-95 disabled:opacity-50"
                                title="Regerar Resposta"
                              >
                                <RefreshCw className={cn("w-3.5 h-3.5 text-primary", isRegenerating === r.id && "animate-spin")} />
                              </button>
                              {reply && (
                                <button
                                  onClick={() => copyReviewReply(r.id, reply)}
                                  className="p-2 rounded-xl bg-background border shadow-sm hover:bg-muted transition-all active:scale-95"
                                  title="Copiar Resposta"
                                >
                                  <Copy className="w-3.5 h-3.5 text-primary" />
                                </button>
                              )}
                           </div>
                           </div>
                           <p className="text-xs md:text-sm font-bold leading-relaxed text-foreground/90">
                              {reply || 'A IA não conseguiu gerar este rascunho. Use o botão de regerar.'}
                           </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                           {r.reviewUrl && (
                             <Button asChild variant="outline" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest gap-1.5">
                               <a href={r.reviewUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3" /> Abrir no Google</a>
                             </Button>
                           )}
                           <Button size="sm" onClick={() => setReviewStatus(r.id, 'replied')} className="rounded-xl text-[10px] font-black uppercase tracking-widest gap-1.5">
                             <CheckCircle2 className="w-3 h-3" /> Marcar como respondida
                           </Button>
                           <Button size="sm" variant="ghost" onClick={() => setReviewStatus(r.id, 'dismissed')} className="rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                             Descartar
                           </Button>
                        </div>
                     </CardContent>
                  </Card>
                  );
                })}

                {/* Renderizar Depoimentos do Firestore */}
                {approvedTestimonials.slice(0, 5).map((t: any) => (
                  <Card key={t.id} className="border-none shadow-lg rounded-[2rem] overflow-hidden bg-background group hover:shadow-xl transition-all">
                     <CardContent className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase shadow-inner">
                                 {t.userName?.substring(0, 2)}
                              </div>
                              <div className="min-w-0">
                                 <p className="font-black text-xs uppercase tracking-tight leading-none truncate">{t.userName}</p>
                                 <div className="flex items-center gap-2 mt-1">
                                    <div className="flex">
                                       {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3 h-3", s <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />)}
                                    </div>
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                       <Clock className="w-2.5 h-2.5" /> 
                                       {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Agora'}
                                    </span>
                                 </div>
                              </div>
                           </div>
                           <Badge variant="outline" className="w-fit text-[7px] font-black uppercase tracking-widest border-primary/20 text-primary">Original Proova</Badge>
                        </div>

                        <p className="text-sm font-medium leading-relaxed italic opacity-80 pl-3 sm:pl-4 border-l-2 border-primary/10 break-words">
                           "{t.text}"
                        </p>

                        {(t.contactInfo || t.userEmail) && (
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold">
                            {t.contactInfo && (
                              <span className="flex items-center gap-1.5 text-primary">
                                <MessageCircle className="w-3.5 h-3.5" /> Pediu retorno:{' '}
                                {String(t.contactInfo).startsWith('+')
                                  ? <a href={whatsappLink(String(t.contactInfo))} target="_blank" rel="noopener noreferrer" className="underline">{t.contactInfo}</a>
                                  : <a href={`mailto:${t.contactInfo}`} className="underline">{t.contactInfo}</a>}
                              </span>
                            )}
                            {t.userEmail && <span className="text-muted-foreground">E-mail informado: {t.userEmail}</span>}
                          </div>
                        )}

                        {!t.aiReply && t.aiReplyDraft && (
                          <div className="mt-4 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Rascunho de resposta — ainda não publicado</span>
                                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Nota baixa: revise antes de aparecer na sua página pública.</p>
                              </div>
                              <button
                                onClick={() => handleRegenerateResponse(t.id, t.userName, t.text, t.rating)}
                                disabled={isRegenerating === t.id}
                                className="p-2 rounded-xl bg-background border shadow-sm hover:bg-muted transition-all active:scale-95 disabled:opacity-50 shrink-0"
                                title="Gerar outra versão"
                              >
                                <RefreshCw className={cn("w-3.5 h-3.5 text-primary", isRegenerating === t.id && "animate-spin")} />
                              </button>
                            </div>
                            <p className="text-xs md:text-sm font-bold leading-relaxed text-foreground/90">{t.aiReplyDraft}</p>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => approveDraft(t.id, t.aiReplyDraft)} className="rounded-xl font-black text-[10px] uppercase tracking-widest">Aprovar e publicar</Button>
                              <Button size="sm" variant="ghost" onClick={() => discardDraft(t.id)} className="rounded-xl font-black text-[10px] uppercase tracking-widest text-muted-foreground">Descartar</Button>
                            </div>
                          </div>
                        )}

                        {t.aiReply && (
                          <div className="mt-4 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 space-y-3">
                             <div className="flex items-start justify-between gap-3">
                           <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 rounded-lg bg-primary text-white">
                                   <Sparkles className="w-3 h-3" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Resposta Gerada pela IA</span>
                             </div>
                           <div className="flex gap-2 shrink-0">
                                 <button 
                                  onClick={() => handleRegenerateResponse(t.id, t.userName, t.text, t.rating)}
                                  disabled={isRegenerating === t.id}
                                  className="p-2 rounded-xl bg-background border shadow-sm hover:bg-muted transition-all active:scale-95 disabled:opacity-50"
                                  title="Regerar Resposta"
                                 >
                                    <RefreshCw className={cn("w-3.5 h-3.5 text-primary", isRegenerating === t.id && "animate-spin")} />
                                 </button>
                                 <button onClick={() => copyToClipboard(t.aiReply, "Resposta IA")} className="p-2 rounded-xl bg-background border shadow-sm hover:bg-muted transition-all active:scale-95"><Copy className="w-3.5 h-3.5 text-primary" /></button>
                              </div>
                           </div>
                             <p className="text-xs md:text-sm font-bold leading-relaxed text-foreground/90">
                                {t.aiReply}
                              </p>
                          </div>
                        )}
                     </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="py-12 border-t mt-auto text-center opacity-40 flex flex-col items-center gap-4">
        <div className="relative w-[180px] h-[60px]">
          <Image src="/logo-proovaai-whitemode.png" alt="Footer Logo" fill className="object-contain dark:hidden" />
          <Image src="/logo-proovaai-darkmode.png" alt="Footer Logo" fill className="object-contain hidden dark:block" />
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.3em]">© 2026 Proova Technology • Inteligência Estratégica</p>
      </footer>
    </div>
  );
}
