
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
  
  // Period Filtering State (Default 7 days)
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

  // Zero-Click Google Search States
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

  // Fetch Widgets for Progress calculation
  const widgetsQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'widgets');
  }, [db, user]);
  const { data: widgetsList } = useCollection(widgetsQuery);

  // Fetch Announcements (Robust query - Exige índice composto)
  const announcementsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'announcements'), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [db]);
  
  const { data: rawAnnouncements, error: announcementsError, loading: announcementsLoading } = useCollection(announcementsQuery);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);

  // Fetch Private Feedbacks
  const privateFeedbacksQuery = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'private_feedbacks');
  }, [db, user]);
  const { data: privateFeedbacksList } = useCollection(privateFeedbacksQuery);

  // Fetch Pending Testimonials (Review Queue - Exige índice)
  const pendingTestimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'testimonials'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);
  const { data: pendingTestimonials } = useCollection(pendingTestimonialsQuery);
  
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
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const displayDomain = useMemo(() => {
    if (!baseUrl) return 'proova.wsstudioscompany.com.br';
    try {
      return new URL(baseUrl).hostname;
    } catch (e) {
      return 'proova.wsstudioscompany.com.br';
    }
  }, [baseUrl]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Fetch Approved Testimonials (Robust query - Exige índice)
  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'testimonials'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [db, user]);

  const { data: allFetchedTestimonials, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  const setupSteps = useMemo(() => {
    const s0 = { 
      id: 'location', 
      label: 'Localização', 
      completed: !!userData?.city, 
      unlocked: true,
      action: () => { setGoogleStep('location'); setIsGoogleMapsDialogOpen(true); } 
    };
    
    const s1 = { 
      id: 'google', 
      label: 'Google Maps', 
      completed: !!userData?.googleMapsUrl, 
      unlocked: s0.completed,
      action: () => setIsGoogleMapsDialogOpen(true) 
    };
    
    const s2 = { 
      id: 'collect', 
      label: 'Coleta Ativa', 
      completed: (userData?.testimonialsCount || 0) > 0, 
      unlocked: s1.completed,
      action: () => copyToClipboard(`${baseUrl}/c/${userData?.companySlug}`, "Link de coleta") 
    };
    
    const s3 = { 
      id: 'widget', 
      label: 'Primeiro Mural', 
      completed: !!(widgetsList && widgetsList.length > 0), 
      unlocked: s2.completed,
      action: () => router.push('/widgets') 
    };

    return [s0, s1, s2, s3];
  }, [userData, widgetsList, baseUrl, router]);

  const completedStepsCount = setupSteps.filter(s => s.completed).length;
  const progressPercentage = (completedStepsCount / setupSteps.length) * 100;
  const isSetupComplete = completedStepsCount === setupSteps.length;
  const isCollectDone = setupSteps.find(s => s.id === 'collect')?.completed;
  const isGoogleDone = setupSteps.find(s => s.id === 'google')?.completed;

  useEffect(() => {
    async function runAudit() {
      if (!isSetupComplete || !userData || isAuditing) return;
      setIsAuditing(true);
      
      const results: AuditItem[] = [];

      const mapsUrl = userData.googleMapsUrl || '';
      const isReviewLink = mapsUrl.includes('writereview') || mapsUrl.includes('local/writereview');
      
      if (!mapsUrl) {
        results.push({
          id: 'maps-unlinked',
          label: 'Google Maps Desconectado',
          status: 'critical',
          description: 'Sua empresa não está recebendo redirecionamentos.',
          actionLabel: 'Vincular Agora',
          action: () => setIsGoogleMapsDialogOpen(true),
          icon: MapPin
        });
      } else if (!isReviewLink) {
        results.push({
          id: 'maps-invalid',
          label: 'Link de Avaliação Indireto',
          status: 'attention',
          description: 'Seu link atual não abre direto na caixa de texto do Google.',
          actionLabel: 'Corrigir Link',
          action: () => setIsGoogleMapsDialogOpen(true),
          icon: ShieldAlert
        });
      }

      if (userData.googlePlaceId) {
        const details = await getGooglePlaceDetails(userData.googlePlaceId);
        if (details) {
          if (!details.hasPhotos) {
            results.push({
              id: 'profile-photos',
              label: 'Perfil Sem Fotos',
              status: 'attention',
              description: 'Empresas com fotos recebem 42% mais cliques no Maps.',
              actionLabel: 'Dica: Adicionar 5 fotos',
              action: () => window.open(`https://www.google.com/maps/place/?q=place_id:${userData.googlePlaceId}`, '_blank'),
              icon: Camera
            });
          }
          if (!details.hasHours) {
            results.push({
              id: 'profile-hours',
              label: 'Horário Pendente',
              status: 'attention',
              description: 'Clientes evitam empresas sem horário de funcionamento.',
              actionLabel: 'Configurar no Google',
              action: () => window.open(`https://business.google.com/`, '_blank'),
              icon: Timer
            });
          }
        }
      }

      const publicCount = userData.testimonialsCount || 0;
      const privateCount = privateFeedbacksList?.length || 0;

      if (privateCount > 0 && publicCount === 0) {
        results.push({
          id: 'feedback-imbalance',
          label: 'Elogios Ocultos',
          status: 'critical',
          description: `Você tem ${privateCount} feedbacks no privado e nada no site.`,
          actionLabel: 'Publicar Melhores',
          action: () => router.push('/widgets'),
          icon: MessageSquare
        });
      }

      const mainWidget = widgetsList?.[0];
      if (mainWidget) {
        if (!mainWidget.whatsappEnabled) {
          results.push({
            id: 'page-whatsapp',
            label: 'Bio Sem WhatsApp',
            status: 'attention',
            description: 'Sua página pública está sem botão de contato direto.',
            actionLabel: 'Ativar WhatsApp',
            action: () => router.push(`/widgets/${mainWidget.id}`),
            icon: MessageCircle
          });
        }
        if (!mainWidget.selectedTestimonialIds || mainWidget.selectedTestimonialIds.length === 0) {
          results.push({
            id: 'page-empty',
            label: 'Página Pública Vazia',
            status: 'critical',
            description: 'Seu link da bio está no ar mas não exibe depoimentos.',
            actionLabel: 'Selecionar Elogios',
            action: () => router.push(`/widgets/${mainWidget.id}`),
            icon: Layout
          });
        }
      }

      if (!widgetsList || widgetsList.length === 0) {
        results.push({
          id: 'widget-missing',
          label: 'Mural Não Gerado',
          status: 'attention',
          description: 'Você ainda não criou seu código para embutir no site.',
          actionLabel: 'Criar Mural',
          action: () => router.push('/widgets'),
          icon: LayoutGrid
        });
      }

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
      if (res.success) {
        toast({ title: "Publicado!", description: "O depoimento agora brilha no seu site." });
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao publicar", description: e.message });
    } finally {
      setIsProcessingCuratorship(null);
    }
  };

  const handleArchiveTestimonial = async (id: string) => {
    if (!user || isProcessingCuratorship) return;
    setIsProcessingCuratorship(id);
    try {
      const res = await archiveTestimonialAction(user.uid, id);
      if (res.success) {
        toast({ title: "Arquivado", description: "Removido da fila de revisão." });
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao arquivar", description: e.message });
    } finally {
      setIsProcessingCuratorship(null);
    }
  };

  useEffect(() => {
    if (isSetupComplete && userData && userData.membershipStatus === 'base' && !userData.trialUsed) {
      setIsRewardDialogOpen(true);
    }
  }, [isSetupComplete, userData]);

  const handleClaimReward = async () => {
    if (!db || !user || !userData) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        membershipStatus: 'trial',
        trialUsed: true,
        trialStartedAt: serverTimestamp()
      });
      toast({
        title: "Recompensa Ativada!",
        description: "Você agora é membro GOLD por 14 dias. Aproveite os recursos premium!",
      });
      setIsRewardDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro ao ativar prêmio" });
    }
  };

  const filteredMetrics = useMemo(() => {
    const testimonials = allFetchedTestimonials || [];
    const now = new Date();
    
    if (period === 'all') {
      return {
        count: userData?.testimonialsCount || 0,
        displayList: testimonials.slice(0, 5),
        trendLabel: 'Total acumulado'
      };
    }

    const days = parseInt(period);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const periodTestimonials = testimonials.filter(t => {
      if (!t.createdAt?.toDate) return false;
      return t.createdAt.toDate() >= cutoff;
    });

    return {
      count: periodTestimonials.length,
      displayList: periodTestimonials.slice(0, 5),
      trendLabel: `Recebidos nos últimos ${days} dias`
    };
  }, [allFetchedTestimonials, period, userData]);

  const copyToClipboard = (text: string, description: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${description} copiado para a área de transferência.`,
    });
  };

  const handleUpdateGoogleMapsUrl = async (customUrl?: string, placeId?: string) => {
    if (!db || !user || isUpdatingUrl) return;
    
    setIsUpdatingUrl(true);
    const userRef = doc(db, 'users', user.uid);
    const finalUrl = customUrl || newGoogleMapsUrl;
    
    updateDoc(userRef, {
      googleMapsUrl: finalUrl.trim(),
      googlePlaceId: placeId || userData?.googlePlaceId || ''
    })
      .then(() => {
        toast({ title: "Link Atualizado", description: `Configuração salva com sucesso.` });
        setIsGoogleMapsDialogOpen(false);
        setNewGoogleMapsUrl('');
        setGoogleStep('info');
      })
      .catch((err) => {
        console.error("Erro ao atualizar URL:", err);
      })
      .finally(() => {
        setIsUpdatingUrl(false);
      });
  };

  const handleSaveLocation = async () => {
    if (!db || !user || !userCity.trim() || !userState.trim()) return;
    setIsUpdatingUrl(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        city: userCity.trim(),
        state: userState.trim()
      });
      setGoogleStep('search');
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao salvar localização" });
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  const handleSearchPlaces = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingPlaces(true);
    setPlaceResults([]); 
    try {
      const results = await searchGooglePlaces(searchQuery, userData?.city || userCity, userData?.state || userState);
      setPlaceResults(results);
      if (results.length === 0) {
        toast({ title: "Nenhum resultado", description: "Tente um nome mais específico ou verifique sua cidade." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro na busca", description: "Verifique sua chave de API ou conexão." });
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleSelectPlace = (place: any) => {
    const reviewUrl = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
    handleUpdateGoogleMapsUrl(reviewUrl, place.place_id);
  };

  const handleUpdateSlug = async () => {
    if (!db || !user || isCheckingSlug || !tempSlug.trim()) return;
    
    const normalizedSlug = tempSlug.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    if (normalizedSlug === userData?.companySlug) {
      setIsSlugDialogOpen(false);
      return;
    }

    if (normalizedSlug.length < 3) {
      setSlugError("O link deve ter pelo menos 3 caracteres.");
      return;
    }

    setIsCheckingSlug(true);
    setSlugError(null);

    try {
      const q = query(collection(db, 'users'), where('companySlug', '==', normalizedSlug));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setSlugError("Este link já está sendo usado por outra empresa.");
        setIsCheckingSlug(false);
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        companySlug: normalizedSlug
      });

      toast({
        title: "Link Personalizado!",
        description: "Sua nova URL de coleta já está ativa.",
      });
      setIsSlugDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erro na atualização", description: "Não foi possível mudar o link agora." });
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const isDark = pdfTheme === 'dark';
      const companyName = userData?.companyName || 'Sua Empresa';
      const primaryColor = [249, 115, 22];

      if (isDark) {
        pdf.setFillColor(0, 0, 0);
      } else {
        pdf.setFillColor(250, 250, 250);
      }
      pdf.rect(0, 0, 210, 297, 'F');

      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, 0, 210, 40, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.text('PROOVA', 105, 25, { align: 'center' });

      if (isDark) {
        pdf.setFillColor(31, 41, 55);
        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(230, 230, 230);
      }
      pdf.roundedRect(20, 50, 170, 210, 10, 10, 'FD');

      if (isDark) {
        pdf.setTextColor(255, 255, 255);
      } else {
        pdf.setTextColor(31, 41, 55);
      }
      pdf.setFontSize(24);
      pdf.text(companyName.toUpperCase(), 105, 80, { align: 'center' });

      if (isDark) {
        pdf.setTextColor(156, 163, 175);
      } else {
        pdf.setTextColor(107, 114, 128);
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(14);
      pdf.text('A sua opinião é muito importante para nós!', 105, 95, { align: 'center' });

      const svg = document.getElementById('qr-code-svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new (window as any).Image();
        
        await new Promise((resolve) => {
          img.onload = () => {
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            if (ctx) {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            const pngUrl = canvas.toDataURL('image/png');
            pdf.addImage(pngUrl, 'PNG', 55, 110, 100, 100);
            resolve(true);
          };
          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        });
      }

      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('ESCANEIE PARA NOS AVALIAR', 105, 230, { align: 'center' });

      if (isDark) {
        pdf.setTextColor(107, 114, 128);
      } else {
        pdf.setTextColor(156, 163, 175);
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Tecnologia Proova', 105, 275, { align: 'center' });
      pdf.setFont('helvetica', 'bold');
      pdf.text('BY PROOVA TECHNOLOGY', 105, 282, { align: 'center' });

      pdf.save(`cartaz-proova-${userData?.companySlug}-${pdfTheme}.pdf`);
      toast({ title: "PDF Gerado!", description: `O seu cartaz (${pdfTheme === 'light' ? 'Claro' : 'Escuro'}) foi baixado.` });
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      toast({ variant: "destructive", title: "Erro no PDF", description: "Não foi possível gerar o arquivo agora." });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateSocialCardCanvas = async () => {
    if (!selectedTestimonialForCard) return null;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = 1080;
    canvas.height = 1080;

    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, '#f97316');
    gradient.addColorStop(1, '#ea580c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(80, 80, 920, 920, 60);
    ctx.fill();

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillText('PROOVA', 140, 160);

    ctx.font = '900 160px Inter, sans-serif';
    ctx.fillStyle = 'rgba(249, 115, 22, 0.1)';
    ctx.fillText('“', 140, 320);

    const starY = 380;
    const starSize = 45;
    const starGap = 15;
    const startX = 140;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < (selectedTestimonialForCard.rating || 5) ? '#facc15' : '#e5e7eb';
      ctx.font = `${starSize}px serif`;
      ctx.fillText('★', startX + (starSize + starGap) * i, starY);
    }

    ctx.fillStyle = '#1f2937';
    ctx.font = 'italic 500 44px Inter, sans-serif';
    
    const text = `"${selectedTestimonialForCard.text}"`;
    const maxWidth = 800;
    const words = text.split(' ');
    let line = '';
    let y = 480;
    const lineHeight = 60;

    for (let n = 0; words[n]; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, 140, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 140, y);

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.fillText(selectedTestimonialForCard.userName, 140, y + 100);

    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText(userData?.companyName?.toUpperCase() || 'AVALIAÇÃO OFICIAL', 140, y + 140);

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '900 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POWERED BY PROOVA.PRO', 540, 960);

    return canvas;
  };

  const handleDownloadSocialCard = async () => {
    setIsGeneratingCard(true);
    try {
      const canvas = await generateSocialCardCanvas();
      if (!canvas) return;

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `social-card-${selectedTestimonialForCard.userName.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({ title: "Card Gerado!", description: "A imagem já está na sua pasta de downloads." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erro ao gerar Card" });
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const handleShareSocialCard = async () => {
    setIsSharingCard(true);
    try {
      const canvas = await generateSocialCardCanvas();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `proova-card-${selectedTestimonialForCard.userName.toLowerCase()}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Depoimento Verificado',
            text: `Olha o que o cliente ${selectedTestimonialForCard.userName} disse sobre nós!`,
          });
        } else {
          handleDownloadSocialCard();
          toast({ title: "Modo Download", description: "Seu navegador não suporta compartilhamento direto. Baixando imagem..." });
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erro ao compartilhar" });
    } finally {
      setIsSharingCard(false);
    }
  };

  const handleSendWeeklyReport = async () => {
    if (!user) return;
    setIsSendingReport(true);
    try {
      const result = await sendWeeklyPerformanceReport(user.uid);
      if (result.success) {
        toast({ title: "Relatório Enviado!", description: "Confira sua caixa de entrada agora." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro no envio", description: e.message });
    } finally {
      setIsSendingReport(false);
    }
  };

  const collectionLink = `${baseUrl}/c/${userData?.companySlug}`;

  if (authLoading || userDataLoading || (user && !userData)) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Autenticando perfil...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex-1 overflow-hidden flex items-center relative z-10">
            <div className="flex animate-marquee whitespace-nowrap gap-16 items-center min-w-full">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 shrink-0">
                  <Megaphone className="w-4 h-4" />
                  <div className="flex items-center gap-2">
                    <span className="font-black uppercase tracking-widest text-[11px]">
                      {currentAnnouncement.title}:
                    </span>
                    <p className="text-[11px] md:text-sm font-bold opacity-95">
                      {currentAnnouncement.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setIsAnnouncementDismissed(true)}
            className="p-2.5 mr-2 rounded-full hover:bg-white/10 transition-colors shrink-0 z-[110] relative"
          >
            <X className="w-4 h-4" />
          </button>
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
                  <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[120px] md:max-w-[200px] transition-colors group-hover:text-primary leading-tight">
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
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs font-headline font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5 bg-primary/5 text-primary">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span>Dash</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                disabled={!isCollectDone}
                onClick={() => {
                  if (isCollectDone) {
                    router.push('/widgets');
                  } else {
                    toast({ title: "Acesso Bloqueado", description: "Complete a missão de Coleta Ativa para liberar seus murais." });
                  }
                }} 
                className={cn(
                  "rounded-xl cursor-pointer font-bold py-2.5",
                  !isCollectDone && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Layout className="mr-2 h-4 w-4 text-primary" />
                    <span>Meus Widgets</span>
                  </div>
                  {!isCollectDone && <Lock className="w-3 h-3 ml-2 opacity-50" />}
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem 
                disabled={!isSetupComplete}
                onClick={() => {
                  if (isSetupComplete) {
                    router.push('/private');
                  } else {
                    toast({ title: "Acesso Bloqueado", description: "Conclua todo o checklist para liberar o Inbox Privado." });
                  }
                }}
                className={cn(
                  "rounded-xl cursor-pointer font-bold py-2.5",
                  !isSetupComplete && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Inbox className="mr-2 h-4 w-4 text-primary" />
                    <span>Inbox Privado</span>
                  </div>
                  {!isSetupComplete && <Lock className="w-3 h-3 ml-2 opacity-50" />}
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Planos de Upgrade</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="rounded-xl cursor-pointer font-bold py-2.5"
              >
                {theme === 'light' ? (
                  <Moon className="mr-2 h-4 w-4 text-primary" />
                ) : (
                  <Sun className="mr-2 h-4 w-4 text-primary" />
                )}
                <span>Alternar Tema</span>
              </DropdownMenuItem>

              {userData?.isAdmin && (
                <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-xl cursor-pointer font-bold py-2.5">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  <span>Administração</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-pointer font-bold py-2.5">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair do Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        
        {!isSetupComplete && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-1000">
            <Card className="border-none shadow-xl overflow-hidden rounded-[1.5rem] md:rounded-[2rem] bg-card">
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 p-5 md:p-8 space-y-4 md:space-y-6">
                  <div className="space-y-1 md:space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm md:text-lg font-black font-headline uppercase tracking-tight flex items-center gap-2">
                        <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" /> Missões de Sucesso
                      </h2>
                      <span className="text-xs md:text-sm font-black text-primary">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2 md:h-2.5 bg-muted rounded-full" />
                    <p className="text-[10px] md:text-xs text-muted-foreground font-medium pt-0.5">
                      Complete as missões para desbloquear seu prêmio e o Consultor Inteligente.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {setupSteps.map((step) => {
                      const isUnlocked = step.unlocked;
                      return (
                        <div 
                          key={step.id} 
                          onClick={isUnlocked && !step.completed ? step.action : undefined}
                          className={cn(
                            "flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-xl md:rounded-2xl border transition-all relative group",
                            step.completed ? "bg-green-500/5 border-green-500/20 opacity-80" : 
                            isUnlocked ? "bg-background border-primary/20 hover:border-primary shadow-sm cursor-pointer" : 
                            "bg-muted/30 border-muted opacity-40 grayscale cursor-not-allowed bg-muted/20"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center shrink-0",
                            step.completed ? "bg-green-500 text-white shadow-lg" : 
                            isUnlocked ? "bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white" : 
                            "bg-muted border border-border"
                          )}>
                            {step.completed ? <Check className="w-3 h-3 md:w-4 md:h-4 stroke-[3]" /> : <Circle className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={cn(
                              "text-[10px] md:text-[11px] font-bold uppercase tracking-tight block truncate",
                              step.completed ? "text-green-600 line-through opacity-60" : "text-foreground"
                            )}>
                              {step.label}
                            </span>
                          </div>
                          {isUnlocked && !step.completed && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}

        {pendingTestimonials && pendingTestimonials.length > 0 && (
          <section className="space-y-4 animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" /> Fila de Curadoria Inteligente
              </h2>
              <Badge className="bg-primary text-white text-[8px] font-black h-5">{pendingTestimonials.length} PENDENTES</Badge>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {pendingTestimonials.map((t: any) => (
                <Card key={t.id} className="border-2 border-primary/20 shadow-lg bg-card overflow-hidden rounded-2xl relative">
                  <div className="absolute top-0 right-0 p-2">
                     <Badge variant="secondary" className="text-[8px] font-black bg-primary/10 text-primary">REVISÃO MANUAL</Badge>
                  </div>
                  <CardContent className="p-5 md:p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-xl">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{t.userName}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: t.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs md:text-sm italic leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-xl border-l-4 border-primary">
                      "{t.text}"
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1 h-11 rounded-xl font-bold gap-2 shadow-md bg-primary hover:bg-primary/90"
                        disabled={!!isProcessingCuratorship}
                        onClick={() => handleApproveTestimonial(t.id)}
                      >
                        {isProcessingCuratorship === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Publicar no Site
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-11 rounded-xl font-bold text-muted-foreground border-border hover:bg-muted"
                        disabled={!!isProcessingCuratorship}
                        onClick={() => handleArchiveTestimonial(t.id)}
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {isSetupComplete && (
          <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Auditoria Consultiva Proova
              </h2>
              {isAuditing && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
            </div>
            
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {auditItems.length > 0 ? (
                auditItems.map((item) => (
                  <Card key={item.id} className={cn(
                    "border-none shadow-sm overflow-hidden rounded-2xl relative",
                    item.status === 'critical' ? "bg-destructive/5" : "bg-orange-500/5"
                  )}>
                    <div className={cn(
                      "absolute top-0 left-0 w-1.5 h-full",
                      item.status === 'critical' ? "bg-destructive" : "bg-orange-500"
                    )} />
                    <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                      <div className="flex gap-3">
                        <div className={cn(
                          "p-2 rounded-xl shrink-0",
                          item.status === 'critical' ? "bg-destructive/10 text-destructive" : "bg-orange-500/10 text-orange-600"
                        )}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-tight">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug">{item.description}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="w-full text-[10px] font-black uppercase h-8 rounded-lg shadow-sm"
                        onClick={item.action}
                      >
                        {item.actionLabel} <ArrowRight className="ml-1 w-3 h-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="md:col-span-2 lg:col-span-3 border-none shadow-sm bg-green-500/5 overflow-hidden rounded-2xl">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="bg-green-500/10 p-3 rounded-full text-green-600">
                      <PartyPopper className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black font-headline text-green-700">Tudo impecável!</h3>
                      <p className="text-sm text-green-600/80 font-medium">Sua conta passou em todos os testes de saúde digital e SEO local. Continue assim!</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">Painel de Controle</h1>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsTutorialOpen(true)} 
                  className="rounded-full gap-1.5 text-[10px] font-bold h-7 border border-primary/20 text-primary hover:bg-primary/5"
                >
                  <Info className="w-3.5 h-3.5" /> Tutorial
                </Button>
              </div>
              <p className="text-xs md:text-base text-muted-foreground">Gestão de prova social dinâmica</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group w-full sm:w-48">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary pointer-events-none z-10" />
              <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
                <SelectTrigger className="h-11 rounded-xl bg-background border-primary/20 text-[11px] font-bold uppercase tracking-wider pl-9 focus:ring-primary/20">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent align="end" className="rounded-xl border-primary/10">
                  <SelectItem value="7" className="text-xs font-medium">Últimos 7 dias</SelectItem>
                  <SelectItem value="30" className="text-xs font-medium">Últimos 30 dias</SelectItem>
                  <SelectItem value="all" className="text-xs font-medium">Todo o período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 relative">
          <Card className="border-none shadow-sm group cursor-default relative overflow-hidden rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4 md:p-6">
              <div className="space-y-0.5">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Resumo {period !== 'all' ? `(${period}d)` : ''}</CardTitle>
                <button 
                  onClick={handleSendWeeklyReport}
                  disabled={isSendingReport}
                  className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  {isSendingReport ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Mail className="w-2.5 h-2.5" />}
                  Enviar Relatório por E-mail
                </button>
              </div>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="space-y-1">
                <div className="text-xl md:text-3xl font-bold">
                  {filteredMetrics.count} <span className="text-sm md:text-lg font-medium text-muted-foreground">avaliações</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge 
                    variant="secondary" 
                    className="border-none text-[8px] md:text-[10px] h-4 md:h-5 px-1.5 font-black bg-primary/10 text-primary"
                  >
                    {filteredMetrics.trendLabel}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative group">
            <div 
              onClick={() => {
                setNewGoogleMapsUrl(userData?.googleMapsUrl || '');
                setGoogleStep(userData?.googleMapsUrl ? 'manual' : 'info');
                setIsGoogleMapsDialogOpen(true);
              }}
              className="absolute -top-2 right-4 z-40 bg-primary text-white text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 ring-2 ring-white"
            >
              <span className="flex items-center gap-1"><Edit3 className="w-2 h-2" /> {userData?.googleMapsUrl ? 'Editar' : 'Configurar'}</span>
            </div>
            <Card className="border-none shadow-sm relative overflow-hidden rounded-2xl h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4 md:p-6">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Cliques Google</CardTitle>
                <MousePointer2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="flex items-center gap-2">
                  <div className="text-xl md:text-2xl font-bold">{userData?.googleRedirectCount || 0}</div>
                  {userData?.googleMapsUrl ? (
                    <Badge variant="secondary" className="text-[8px] md:text-[10px] h-4 md:h-5 bg-primary/10 text-primary border-none">
                      G-Boost Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[8px] md:text-[10px] h-4 md:h-5 opacity-50 uppercase font-black">
                      Pendente
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Visitantes redirecionados ao Maps.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2">
            <h2 className="text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Ações Rápidas</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              disabled={!isGoogleDone}
              onClick={() => copyToClipboard(collectionLink, "Link de coleta")}
              className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 group transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              {!isGoogleDone ? <Lock className="w-5 h-5 text-muted-foreground/30" /> : <Link2 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />}
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Copiar Link</span>
            </Button>
            
            <Button 
              variant="outline" 
              disabled={!isGoogleDone}
              onClick={() => setIsQrDialogOpenManual(true)}
              className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 group transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              {!isGoogleDone ? <Lock className="w-5 h-5 text-muted-foreground/30" /> : <QrCode className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />}
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Ver Cartaz</span>
            </Button>

            <Button 
              variant="outline" 
              disabled={!isCollectDone}
              onClick={() => router.push('/widgets')}
              className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 group transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              {!isCollectDone ? <Lock className="w-5 h-5 text-muted-foreground/30" /> : <Layout className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />}
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Meus Murais</span>
            </Button>

            <Button 
              variant="outline" 
              disabled={!isSetupComplete}
              onClick={() => router.push('/private')}
              className="h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border-primary/20 bg-background hover:bg-primary/5 group transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              {!isSetupComplete ? <Lock className="w-5 h-5 text-muted-foreground/30" /> : <Inbox className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />}
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center px-2">Ver Inbox</span>
            </Button>
          </div>
        </section>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <h2 className="text-lg md:text-xl font-bold font-headline tracking-tight">Link de Coleta Ativo</h2>
          </div>
          <Card className="border-none shadow-sm overflow-hidden group rounded-2xl">
            <div className="h-1 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
            <CardHeader className="pb-2 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" /> Endereço Público
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setTempSlug(userData?.companySlug || '');
                    setSlugError(null);
                    setIsSlugDialogOpen(true);
                  }}
                  className="h-6 md:h-7 text-[8px] md:text-[10px] font-black uppercase tracking-widest gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  {isProPlan ? <Fingerprint className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                  Personalizar Link
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <div className="bg-muted/30 font-mono text-[9px] md:text-xs h-9 md:h-10 border border-primary/10 flex items-center px-3 flex-1 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-hide select-all relative group">
                  {collectionLink}
                  {!isGoogleDone && (
                    <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex items-center justify-center rounded-inherit">
                      <Lock className="w-3 h-3 mr-2 text-muted-foreground" />
                      <span className="text-[8px] font-black uppercase text-muted-foreground">Vincule o Google primeiro</span>
                    </div>
                  )}
                </div>
                <Button 
                  variant="secondary" 
                  className="h-9 md:h-10 px-4 rounded-xl font-bold"
                  disabled={!isGoogleDone}
                  onClick={() => copyToClipboard(collectionLink, "Link de coleta")}
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  <span className="text-xs">Copiar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <h2 className="text-lg md:text-xl font-bold font-headline tracking-tight">Depoimentos Publicados</h2>
            </div>
            <Link href={isSetupComplete ? "/private" : "#"} onClick={(e) => !isSetupComplete && e.preventDefault()}>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!isSetupComplete}
                className="rounded-full gap-2 text-[10px] h-7 border-primary/20 text-primary hover:bg-primary/5"
              >
                {!isSetupComplete && <Lock className="w-3 h-3" />}
                <Inbox className="w-3 h-3" /> Inbox Privado
              </Button>
            </Link>
          </div>
          
          <div className="grid gap-3 md:gap-4">
            {testimonialsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary/50" />
              </div>
            ) : filteredMetrics.displayList && filteredMetrics.displayList.length > 0 ? (
              filteredMetrics.displayList.map((t: any) => (
                <Card key={t.id} className="border-none shadow-sm overflow-hidden rounded-xl md:rounded-2xl group transition-all hover:shadow-md">
                  <CardContent className="p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-primary/10 p-2 rounded-lg md:rounded-xl hidden sm:block">
                        <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-col space-y-0.5 mb-1">
                          <span className="font-bold text-[11px] md:text-xs truncate">{t.userName}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: t.rating || 5 }).map((_, i) => (
                              <Star key={i} className="w-2.5 h-2.5 md:w-3 md:h-3 fill-primary text-primary" />
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] md:text-xs text-foreground italic line-clamp-2 md:line-clamp-none">
                          "{t.text}"
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 md:h-8 text-[8px] md:text-[10px] font-black uppercase tracking-widest gap-1.5 text-primary hover:bg-primary/5 px-2"
                        onClick={() => {
                          setSelectedTestimonialForCard(t);
                          setIsSocialCardDialogOpen(true);
                        }}
                      >
                        <ImageIcon className="w-2.5 h-2.5 md:w-3 md:h-3" /> Gerar Card
                      </Button>
                      <div className="flex items-center gap-1 text-[8px] md:text-[10px] text-muted-foreground font-medium">
                        <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 md:py-16 border-2 border-dashed rounded-2xl bg-muted/10">
                <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-xs md:text-sm text-muted-foreground">Nenhum depoimento aprovado encontrado para este período.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-8 md:py-16 border-t flex flex-col items-center gap-6 md:gap-8 mt-auto">
        <div className="flex items-center gap-2 relative w-[180px] h-[60px] md:w-[320px] md:h-[105px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="object-contain dark:hidden" />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block" />
        </div>
        <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-40">
          Proova Technology
        </p>
      </footer>

      <Dialog open={isSlugDialogOpen} onOpenChange={setIsSlugDialogOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          {isProPlan ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black font-headline flex items-center gap-2">
                  <Fingerprint className="w-6 h-6 text-primary" /> Identidade do Link
                </DialogTitle>
                <DialogDescription>
                  Personalize o final da sua URL de coleta. Links curtos convertem mais!
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="slug-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nova URL de Coleta</Label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground/60 pointer-events-none select-none">{displayDomain}/c/</span>
                    <Input 
                      id="slug-input"
                      placeholder="minha-loja"
                      value={tempSlug}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        setTempSlug(val);
                        setSlugError(null);
                      }}
                      className="h-14 rounded-2xl border-2 focus:ring-primary/20 text-sm font-bold"
                      style={{ paddingLeft: `${(displayDomain.length * 7) + 30}px` }}
                    />
                  </div>
                  {slugError && <p className="text-[10px] text-destructive font-bold flex items-center gap-1 animate-in slide-in-from-top-1"><AlertTriangle className="w-3 h-3" /> {slugError}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full font-black h-12 rounded-2xl shadow-xl gap-2" onClick={handleUpdateSlug} disabled={isCheckingSlug}>
                  {isCheckingSlug ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />}
                  Atualizar Identidade
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="text-center py-6 space-y-6">
              <div className="mx-auto bg-primary/10 p-5 rounded-full w-fit text-primary animate-pulse">
                <Gem className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-black font-headline">Recurso Profissional</DialogTitle>
                <DialogDescription>
                  A personalização de links é exclusiva para membros em planos profissionais.
                </DialogDescription>
              </div>
              <Button className="w-full h-14 rounded-2xl text-lg font-black shadow-xl" onClick={() => router.push('/pricing')}>
                Ver Planos e Upgrade
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen}>
        <DialogContent className="rounded-[2rem] md:rounded-[2.5rem] w-[92vw] sm:w-full sm:max-w-lg border-none shadow-2xl overflow-hidden p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-5 md:p-10 pt-10 md:pt-14 pb-4 bg-background shrink-0">
            <DialogTitle className="text-xl md:text-2xl font-black font-headline flex items-center gap-2">
              <Info className="w-6 h-6 text-primary" /> Guia do Dashboard
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm pl-8">
              Aprenda a dominar sua central estratégica de autoridade digital.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="space-y-8 md:space-y-10 py-6 px-5 md:px-10 overflow-x-hidden">
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Fila de Curadoria</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Depoimentos qualificados (nota 4-5 e texto rico) aparecem aqui. Com 1 clique, eles vão direto para seu site.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Consultor Proova</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Seu auditor de SEO local. Ele avisa sobre fotos ausentes no Google, horários pendentes e falhas de conversão.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Resumo e Filtros</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Acompanhe seu volume de avaliações. Filtre por 7, 30 dias ou período total para ver seu crescimento.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <MousePointer2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Cliques e G-Boost</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Métricas de quantos clientes redirecionamos para seu Google Maps após um elogio 5 estrelas.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Ações Rápidas</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Acesse em segundos seu Cartaz de Balcão (PDF), Gerenciador de Murais ou seu Inbox Privado.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Link de Coleta</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Sua URL estratégica. Personalize-a (ex: /c/minha-loja) para facilitar o envio via WhatsApp e Redes Sociais.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <Inbox className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Inbox Privado</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Onde guardamos feedbacks de 1 a 3 estrelas. Resolva problemas em sigilo e evite danos à sua imagem pública.</p>
                </div>
              </div>

              <div className="flex gap-4 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Últimos Depoimentos</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Visualize seus elogios ativos. Use o botão "Gerar Card" para criar imagens prontas para o Instagram Stories.</p>
                </div>
              </div>

            </div>
          </ScrollArea>
          <DialogFooter className="p-5 md:p-10 pt-4 pb-8 md:pb-10 bg-background border-t shrink-0">
            <Button className="w-full font-black h-12 rounded-2xl shadow-xl" onClick={() => setIsTutorialOpen(false)}>Dominar Meu Painel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isGoogleMapsDialogOpen} onOpenChange={setIsGoogleMapsDialogOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-headline flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" /> Google Business
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {googleStep === 'info' && (
              <div className="space-y-6">
                <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex flex-col items-center text-center gap-3">
                  <Navigation className="w-8 h-8 text-primary" />
                  <p className="text-xs text-muted-foreground">Configuraremos seu link oficial para turbinar seu SEO Local.</p>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold shadow-lg" onClick={() => setGoogleStep(userData?.city ? 'search' : 'location')}>
                  Começar Busca Automática
                </Button>
              </div>
            )}

            {googleStep === 'location' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black ml-1">Cidade</Label>
                    <Input placeholder="Ex: São Paulo" value={userCity} onChange={(e) => setUserCity(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black ml-1">Estado (UF)</Label>
                    <Input placeholder="Ex: SP" value={userState} onChange={(e) => setUserState(e.target.value.toUpperCase())} maxLength={2} className="h-12 rounded-xl" />
                  </div>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold shadow-lg mt-2" onClick={handleSaveLocation} disabled={isUpdatingUrl || !userCity || !userState}>
                  Confirmar Localização
                </Button>
              </div>
            )}

            {googleStep === 'search' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nome da sua Empresa" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="h-12 rounded-xl"
                  />
                  <Button size="icon" className="h-12 w-12 rounded-xl" onClick={handleSearchPlaces} disabled={isSearchingPlaces}>
                    {isSearchingPlaces ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {placeResults.map((place) => (
                    <div 
                      key={place.place_id} 
                      onClick={() => handleSelectPlace(place)}
                      className="p-3 border rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer flex items-center gap-3"
                    >
                      <Building2 className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{place.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{place.address}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-30" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {googleStep === 'manual' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black ml-1">Link Direto do Google Maps</Label>
                  <Input 
                    placeholder="https://g.page/r/..."
                    value={newGoogleMapsUrl}
                    onChange={(e) => setNewGoogleMapsUrl(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button className="w-full font-black h-12 rounded-xl shadow-xl" onClick={() => handleUpdateGoogleMapsUrl()} disabled={isUpdatingUrl || !newGoogleMapsUrl}>
                  Salvar Link Manual
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isQrDialogOpenManual} onOpenChange={setIsQrDialogOpenManual}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl overflow-hidden p-0">
          <DialogHeader className="p-8 pt-10 pb-4 bg-background">
            <DialogTitle className="text-2xl font-black font-headline text-center">Cartaz de Balcão</DialogTitle>
            <DialogDescription className="text-center">Imprima seu QR Code para coletar elogios presencialmente.</DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-8 flex flex-col items-center">
            <div className="p-6 bg-white rounded-3xl shadow-inner border-4 border-primary/10">
              <QRCodeSVG 
                id="qr-code-svg"
                value={collectionLink} 
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 pb-10 bg-background">
            <Button 
              className="w-full h-14 rounded-2xl text-lg font-black shadow-xl gap-2" 
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? <Loader2 className="animate-spin" /> : <Download className="w-5 h-5" />}
              Baixar Cartaz PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSocialCardDialogOpen} onOpenChange={setIsSocialCardDialogOpen}>
        <DialogContent className="rounded-[2rem] sm:rounded-3xl sm:max-w-md border-none shadow-2xl overflow-hidden p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pt-10 pb-4 bg-background shrink-0">
            <DialogTitle className="text-xl md:text-2xl font-black font-headline text-center">Social Card VIP</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-2 flex-1 overflow-y-auto flex flex-col items-center">
            {selectedTestimonialForCard && (
              <div className="w-full aspect-square max-w-[340px] bg-gradient-to-br from-primary to-orange-600 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 shadow-xl flex flex-col relative overflow-hidden">
                <div className="bg-white rounded-[1.25rem] md:rounded-[1.5rem] p-4 md:p-6 h-full flex flex-col shadow-inner">
                  <div className="flex gap-1 mb-2 md:mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("w-3 h-3 md:w-4 md:h-4", i < selectedTestimonialForCard.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />
                    ))}
                  </div>
                  <p className="text-sm md:text-xl font-medium italic text-gray-800 Birding-relaxed mb-4 md:mb-6 flex-1 line-clamp-4">
                    "{selectedTestimonialForCard.text}"
                  </p>
                  <div className="border-t pt-2 md:pt-4">
                    <p className="font-bold text-primary text-sm md:text-base truncate">{selectedTestimonialForCard.userName}</p>
                    <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase">Avaliação Verificada</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 pt-4 pb-8 bg-background flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button 
                variant="outline"
                className="h-12 md:h-14 rounded-xl font-black border-primary/20 text-primary" 
                onClick={handleDownloadSocialCard}
                disabled={isGeneratingCard}
              >
                Baixar
              </Button>
              <Button 
                className="h-12 md:h-14 rounded-xl font-black shadow-xl" 
                onClick={handleShareSocialCard}
                disabled={isSharingCard}
              >
                Compartilhar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl overflow-hidden p-0 text-center">
          <div className="p-10 space-y-6">
            <div className="mx-auto bg-primary/10 p-5 rounded-full w-fit animate-bounce">
              <PartyPopper className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-black font-headline">Setup Concluído!</DialogTitle>
              <DialogDescription className="text-base font-medium">
                Parabéns! Você concluiu todas as missões e sua máquina de prova social está 100% pronta.
              </DialogDescription>
            </div>
            <Button 
              className="w-full h-16 rounded-2xl text-lg font-black shadow-xl gap-2 transition-all hover:scale-105"
              onClick={handleClaimReward}
            >
              Resgatar 14 Dias Gold <Gem className="w-5 h-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
