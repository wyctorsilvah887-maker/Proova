
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
  BellRing,
  Menu
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
  const [activeHash, setActiveHash] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingCard, setIsExportingCard] = useState(false);

  // States para formulários e buscas
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [companyNameEdit, setCompanyNameEdit] = useState('');
  const [companySlugEdit, setCompanySlugEdit] = useState('');

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const { permission, requestPermission, isSupported: pushSupported } = useNotifications(user?.uid);

  // Deep Linking Logic
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveHash(hash);
      
      // Sync form states with user data when switching views
      if (userData) {
        if (hash === 'localizacao' || hash === 'google-maps') {
          setCity(userData.city || '');
          setState(userData.state || '');
          setSearchQuery('');
          setSearchResults([]);
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

  const isEnterpriseUser = useMemo(() => userData?.membershipStatus === 'enterprise', [userData]);
  const isAgency = useMemo(() => userData?.businessType === 'agencia', [userData]);
  const isDigitalBusiness = useMemo(() => userData?.businessType === 'agencia' || userData?.businessType === 'servicos_digitais', [userData]);

  // Firestore Queries
  const widgetsListQuery = useMemo(() => (db && user ? collection(db, 'users', user.uid, 'widgets') : null), [db, user]);
  const { data: widgetsList } = useCollection(widgetsListQuery);

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
  const { data: allFetchedTestimonials } = useCollection(allTestimonialsQuery);

  const pendingTestimonialsCount = useMemo(() => (allFetchedTestimonials || []).filter((t: any) => t.status === 'pending').length, [allFetchedTestimonials]);
  const approvedTestimonials = useMemo(() => (allFetchedTestimonials || []).filter((t: any) => t.status === 'approved'), [allFetchedTestimonials]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'GOLD';
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

  // Actions Handlers
  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    shadcnToast({ title: "Copiado!", description: `${description} copiado.` });
  };

  const handleSearchPlaces = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingPlaces(true);
    try {
      const results = await searchGooglePlaces(searchQuery, city || userData?.city, state || userData?.state);
      setSearchResults(results);
    } catch (err) { shadcnToast({ variant: "destructive", title: "Erro na busca" }); } finally { setIsSearchingPlaces(false); }
  };

  const handleSelectPlace = async (place: any) => {
    if (!db || !user) return;
    const reviewLink = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), { googlePlaceId: place.place_id, googleMapsUrl: reviewLink });
      shadcnToast({ title: "G-Boost Ativado!" });
      clearHash();
    } catch (err) { shadcnToast({ variant: "destructive", title: "Erro ao salvar" }); }
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

  // Metrics
  const filteredMetrics = useMemo(() => {
    if (period === 'all') return { count: userData?.testimonialsCount || 0, label: 'Total acumulado' };
    const cutoff = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    const count = (approvedTestimonials || []).filter((t: any) => (t.createdAt?.toDate?.() || new Date()) >= cutoff).length;
    return { count, label: `Últimos ${period} dias` };
  }, [approvedTestimonials, period, userData]);

  if (authLoading || userDataLoading || !userData) return <LoadingScreen />;

  const collectionLink = `${baseUrl}/c/${userData?.companySlug}`;
  const publicPageLink = `${baseUrl}/pp/${userData?.companySlug}`;

  const toggleMenu = (e: React.PointerEvent | React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
      {currentAnnouncement && !isAnnouncementDismissed && !activeHash && (
        <div className={cn(
          "w-full py-3 flex items-center relative overflow-hidden transition-all duration-500 z-[100] border-b border-white/10",
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

      <header className="bg-background border-b h-16 md:h-20 flex items-center px-2 md:px-4 fixed top-0 w-full z-[110] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onPointerDown={toggleMenu}
            className="h-10 w-10 rounded-xl hover:bg-primary/5 text-primary border border-primary/10 transition-all flex items-center justify-center focus:outline-none z-[150] relative"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
              <line x1="4" y1="7" x2="20" y2="7" className={cn("origin-center transition-all", isMenuOpen ? "translate-y-[5px] rotate-45" : "")} />
              <line x1="4" y1="12" x2="20" y2="12" className={cn("origin-center transition-all", isMenuOpen ? "opacity-0" : "")} />
              <line x1="4" y1="17" x2="20" y2="17" className={cn("origin-center transition-all", isMenuOpen ? "-translate-y-[5px] -rotate-45" : "")} />
            </svg>
          </button>
          <Link href="/dash" className="flex items-center group -ml-2" onClick={clearHash}>
            <div className="relative w-[180px] h-[58px] md:w-[280px] md:h-[90px] transition-transform group-hover:scale-105">
              <Image src="/logo-proova-white-mode.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-landing-dark-mode.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="flex border-none bg-transparent shadow-none" />
        </div>
      </header>

      {/* Menu Lateral */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
        <SheetContent side="left" className="w-full max-w-[300px] border-none shadow-2xl bg-background p-0 flex flex-col h-[100dvh] overflow-hidden">
          <div className="p-6 border-b bg-muted/10 shrink-0 mt-20">
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
            <div className="px-4 py-6 space-y-6">
              <div>
                <p className="px-3.5 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Funcionalidades</p>
                {[
                  { label: 'Link de Coleta', icon: Link2, hash: '#link-coleta' },
                  { label: 'Página Pública', icon: Globe, hash: '#bio' },
                  { label: 'QR Balcão', icon: QrCode, hash: '#qr' },
                  { label: 'Métricas', href: '/metrics', icon: BarChart3 },
                  { label: 'Moderação', href: '/private', icon: Inbox, badge: pendingTestimonialsCount },
                  { label: 'Configurações', href: '/settings', icon: Settings },
                ].map((item: any, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      if (item.hash) window.location.hash = item.hash;
                      else if (item.href) router.push(item.href);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge > 0 && <Badge className="bg-destructive text-white h-4 px-1.5 text-[8px]">{item.badge}</Badge>}
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pt-24 md:pt-32 pb-12">
        
        {/* VIEW DINÂMICA (SUBSTITUI O DASHBOARD) */}
        {activeHash ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            <header className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter uppercase">
                  {activeHash === 'link-coleta' && 'Link de Coleta'}
                  {activeHash === 'bio' && 'Link in Bio'}
                  {activeHash === 'qr' && 'Cartaz de Balcão'}
                  {activeHash === 'google-maps' && 'Perfil Comercial'}
                  {activeHash === 'localizacao' && 'Localização'}
                  {activeHash === 'identidade' && 'Identidade de Marca'}
                </h1>
                <p className="text-muted-foreground text-sm font-medium">Configuração Estratégica Proova</p>
              </div>
              <Button variant="ghost" onClick={clearHash} className="h-12 w-12 rounded-full hover:bg-primary/5 text-muted-foreground hover:text-primary">
                <X className="w-6 h-6" />
              </Button>
            </header>

            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-background">
              <div className="p-8 md:p-12">
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
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{userData.companyName}</p>
                      </div>
                    </div>
                    <Button className="w-full max-w-sm h-16 rounded-2xl text-lg font-black gap-3 shadow-xl" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                      {isGeneratingPdf ? <Loader2 className="animate-spin" /> : <Download className="w-6 h-6" />} Baixar PDF para Impressão
                    </Button>
                  </div>
                )}

                {(activeHash === 'google-maps' || activeHash === 'localizacao') && (
                  <div className="max-w-2xl mx-auto space-y-8">
                     <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase opacity-60">Cidade Atual</Label>
                           <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase opacity-60">UF</Label>
                           <Input value={state} maxLength={2} onChange={(e) => setState(e.target.value.toUpperCase())} className="h-12 rounded-xl text-center font-black" />
                        </div>
                     </div>
                     <Button className="w-full h-14 rounded-xl font-bold" onClick={handleUpdateLocation}>Atualizar Localização</Button>
                     
                     <div className="pt-8 border-t space-y-6">
                        <Label className="text-[10px] font-black uppercase opacity-60">Vincular Empresa no Google (G-Boost)</Label>
                        <div className="relative">
                           <Input placeholder="Pesquise o nome da clínica..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchPlaces()} className="h-14 pl-12 rounded-2xl bg-muted/20 border-transparent" />
                           <Search className="absolute left-4 top-4.5 w-5 h-5 text-muted-foreground/40" />
                           <Button size="sm" variant="ghost" onClick={handleSearchPlaces} disabled={isSearchingPlaces} className="absolute right-2 top-2 h-10 rounded-xl text-primary">
                             {isSearchingPlaces ? <Loader2 className="animate-spin" /> : <Navigation className="w-5 h-5" />}
                           </Button>
                        </div>
                        <div className="space-y-2">
                           {searchResults.map((p) => (
                             <div key={p.place_id} onClick={() => handleSelectPlace(p)} className="p-4 rounded-xl bg-muted/10 border-2 border-transparent hover:border-primary/20 cursor-pointer transition-all flex items-center justify-between group">
                                <div><p className="font-bold text-sm uppercase">{p.name}</p><p className="text-[10px] text-muted-foreground">{p.address}</p></div>
                                <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100" />
                             </div>
                           ))}
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
                       <Label className="text-[10px] font-black uppercase opacity-60">Slug da URL (useproova.online/c/...)</Label>
                       <Input value={companySlugEdit} onChange={(e) => setCompanySlugEdit(e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="h-12 rounded-xl font-mono text-xs" />
                    </div>
                    <Button className="w-full h-14 rounded-xl font-bold" onClick={handleUpdateBusinessInfo}>Salvar Nova Identidade</Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          /* CONTEÚDO PADRÃO DO DASHBOARD (OCULTADO QUANDO HASH ATIVO) */
          <div className="space-y-10 animate-in fade-in duration-700">
            {(!isSetupComplete && !userData?.isSetupProcessDone) && (
              <section className="space-y-4">
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
                      <Progress value={progressPercentage} className="h-2.5 bg-muted" />
                      <div className="grid gap-3 sm:grid-cols-3">
                        {setupSteps.map((step, idx) => (
                          <div key={step.id} onClick={() => step.unlocked && step.action()} className={cn("p-4 rounded-2xl border-2 transition-all cursor-pointer group", step.completed ? "bg-primary/5 border-primary/20" : (step.unlocked ? "border-dashed hover:border-primary/50" : "opacity-40 cursor-not-allowed"))}>
                            <div className="flex items-center gap-3">
                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", step.completed ? "bg-primary text-white" : "bg-muted")}>{step.completed ? <Check className="w-4 h-4" /> : <span className="text-xs font-black">{idx + 1}</span>}</div>
                              <p className="text-[11px] font-black uppercase tracking-tight truncate">{step.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                 </Card>
              </section>
            )}

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter uppercase">Painel de Controle</h1>
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

            <div className="grid gap-4 md:gap-6 grid-cols-1">
              <Card onClick={() => router.push('/metrics')} className="border-none shadow-xl rounded-[2rem] p-6 md:p-12 cursor-pointer hover:shadow-2xl transition-all group relative overflow-hidden bg-background">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-primary/10 transition-colors" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all"><BarChart3 className="w-6 h-6" /></div>
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/30 text-primary">{filteredMetrics.label}</Badge>
                </div>
                <div className="flex items-baseline gap-4 relative z-10">
                  <span className="text-7xl md:text-9xl font-black tracking-tighter">{filteredMetrics.count}</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5"><Star className="w-5 h-5 fill-yellow-400 text-yellow-400 animate-pulse" /><span className="text-xl font-black uppercase">Elogios</span></div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Coletados via Proova</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 border-t mt-auto text-center opacity-40 grayscale flex flex-col items-center gap-4">
        <div className="relative w-[180px] h-[60px]"><Image src="/logo-proova-white-mode.png" alt="Footer Logo" fill className="object-contain dark:hidden" /><Image src="/logo-proova-landing-dark-mode.png" alt="Footer Logo" fill className="object-contain hidden dark:block" /></div>
        <p className="text-[8px] font-black uppercase tracking-[0.3em]">© 2026 Proova Technology • Inteligência Estratégica</p>
      </footer>
    </div>
  );
}

function copyToClipboard(text: string, description: string) {
  navigator.clipboard.writeText(text);
}
