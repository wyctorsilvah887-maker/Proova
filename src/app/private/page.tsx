'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  LogOut,
  User,
  Loader2,
  Star,
  Clock,
  Layout,
  TrendingUp,
  Shield,
  MessageSquareOff,
  Inbox,
  Trash2,
  Mail,
  Sun,
  Moon,
  Gem,
  CheckCircle2,
  EyeOff,
  Sparkles,
  MessageSquare,
  Handshake,
  Lock,
  Globe,
  Headphones,
  Settings,
  LayoutGrid as LayoutGridIcon,
  BarChart3,
  ImageIcon,
  X,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, deleteDoc, updateDoc, getDocs, limit, arrayUnion, where, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoadingScreen } from '@/components/loading-screen';

export default function PrivateInboxPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

  const testimonialsPendingQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'testimonials'), 
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const privateFeedbacksQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'private_feedbacks'),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: pendingList, loading: pendingLoading } = useCollection(testimonialsPendingQuery);
  const { data: feedbackList, loading: feedbackLoading } = useCollection(privateFeedbacksQuery);

  const handleApproveTestimonial = async (id: string) => {
    if (!db || !user || isProcessing) return;
    setIsProcessing(id);
    
    try {
      const testimonialRef = doc(db, 'users', user.uid, 'testimonials', id);
      await updateDoc(testimonialRef, { status: 'approved' });
      
      const widgetsRef = collection(db, 'users', user.uid, 'widgets');
      const widgetsSnap = await getDocs(query(widgetsRef, limit(1)));
      if (!widgetsSnap.empty) {
        await updateDoc(widgetsSnap.docs[0].ref, {
          selectedTestimonialIds: arrayUnion(id)
        });
      }
      
      toast({ title: "Publicado!", description: "Depoimento aprovado e injetado no mural." });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro na aprovação" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePromoteToPublic = async (feedback: any) => {
    if (!db || !user || isProcessing) return;
    setIsProcessing(feedback.id);

    try {
      const testimonialsRef = collection(db, 'users', user.uid, 'testimonials');
      const newTestimonialData = {
        userName: feedback.userName,
        userEmail: feedback.userEmail || '',
        rating: feedback.rating,
        text: feedback.text,
        videoUrl: feedback.videoUrl || null,
        status: 'approved',
        createdAt: serverTimestamp(),
        source: 'cloned_from_private'
      };
      
      const newDocRef = await addDoc(testimonialsRef, newTestimonialData);

      const widgetsRef = collection(db, 'users', user.uid, 'widgets');
      const widgetsSnap = await getDocs(query(widgetsRef, limit(1)));
      if (!widgetsSnap.empty) {
        await updateDoc(widgetsSnap.docs[0].ref, {
          selectedTestimonialIds: arrayUnion(newDocRef.id)
        });
      }

      await deleteDoc(doc(db, 'users', user.uid, 'private_feedbacks', feedback.id));

      toast({ title: "Feedback Promovido!", description: "O item foi clonado para os depoimentos públicos e aprovado." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erro na clonagem" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleArchiveTestimonial = async (id: string) => {
    if (!db || !user || isProcessing) return;
    setIsProcessing(id);
    try {
      const testimonialRef = doc(db, 'users', user.uid, 'testimonials', id);
      await updateDoc(testimonialRef, { status: 'archived' });
      toast({ title: "Arquivado", description: "O depoimento foi removido da fila." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao arquivar" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!db || !user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'private_feedbacks', id));
      toast({ title: "Removido", description: "O feedback foi excluído permanentemente." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao remover" });
    }
  };

  if (authLoading || userDataLoading || (user && !userData)) {
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
          <ThemeToggle className="flex border-none bg-transparent shadow-none hover:bg-transparent" />
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
                    { label: 'Moderação Inbox', href: '/private', icon: Inbox, badge: (pendingList?.length || 0) },
                    { label: 'Métricas & ROI', href: '/metrics', icon: BarChart3 },
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

      <main className="flex-1 p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full pt-24 md:pt-32 pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
              <Inbox className="w-8 h-8 text-primary" /> Moderação Unificada
            </h1>
            <p className="text-sm text-muted-foreground font-medium">Gerencie tudo o que entra na sua marca.</p>
          </div>
        </header>

        <Tabs defaultValue="curatorship" className="w-full">
           <TabsList className="bg-background border rounded-2xl h-14 p-1 gap-2">
              <TabsTrigger value="curatorship" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                 <Sparkles className="w-4 h-4" /> Curadoria
                 {pendingList && pendingList.length > 0 && <Badge className="bg-primary text-white border-none text-[8px] h-4 px-1">{pendingList.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="inbox" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                 <MessageSquareOff className="w-4 h-4" /> Inbox Privado
                 {feedbackList && feedbackList.length > 0 && <Badge variant="secondary" className="text-[8px] h-4 px-1">{feedbackList.length}</Badge>}
              </TabsTrigger>
           </TabsList>

           <TabsContent value="curatorship" className="pt-8 space-y-4">
              <div className="space-y-1 mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest">Fila de Aprovação Inteligente</h3>
                <p className="text-xs text-muted-foreground font-medium">Elogios qualificados que ainda não estão no seu site.</p>
              </div>

              {pendingLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary/30" /></div> : (pendingList || []).length === 0 ? (
                <Card className="p-16 text-center border-2 border-dashed rounded-[2.5rem] opacity-30 bg-muted/20">
                   <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                   <p className="text-xs font-bold uppercase tracking-widest">Tudo em dia! Sem pendências.</p>
                </Card>
              ) : pendingList?.map((t: any) => (
                <Card key={t.id} className="rounded-[2rem] border-none shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase">{t.userName?.substring(0,2)}</div>
                         <div><p className="font-bold text-sm">{t.userName}</p><p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{t.createdAt?.toDate?.().toLocaleDateString('pt-BR')}</p></div>
                      </div>
                      <div className="flex gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3.5 h-3.5", s <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />)}</div>
                   </div>
                   <p className="text-sm italic leading-relaxed text-foreground/80">"{t.text}"</p>
                   <div className="flex gap-3 pt-2">
                      <Button onClick={() => handleApproveTestimonial(t.id)} disabled={!!isProcessing} className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90">{isProcessing === t.id ? <Loader2 className="animate-spin" /> : "Aprovar e Publicar"}</Button>
                      <Button variant="ghost" onClick={() => handleArchiveTestimonial(t.id)} disabled={!!isProcessing} className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10"><Trash2 className="w-5 h-5" /></Button>
                   </div>
                </Card>
              ))}
           </TabsContent>

           <TabsContent value="inbox" className="pt-8 space-y-4">
              <div className="space-y-1 mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest">Reputation Shield Ativo</h3>
                <p className="text-xs text-muted-foreground font-medium">Feedbacks críticos ou sigilosos enviados diretamente para você.</p>
              </div>

              {feedbackLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary/30" /></div> : (feedbackList || []).length === 0 ? (
                <Card className="p-16 text-center border-2 border-dashed rounded-[2.5rem] opacity-30 bg-muted/20">
                   <Inbox className="w-12 h-12 mx-auto mb-4" />
                   <p className="text-xs font-bold uppercase tracking-widest">Nenhum feedback privado no momento</p>
                </Card>
              ) : feedbackList?.map((f: any) => (
                <Card key={f.id} className="rounded-[2.5rem] border-none shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground"><User className="w-5 h-5" /></div>
                         <div><p className="font-bold text-sm">{f.userName}</p><p className="text-[10px] text-muted-foreground font-medium">{f.userEmail || 'E-mail não informado'}</p></div>
                      </div>
                      <Badge variant={f.rating <= 3 ? "destructive" : "secondary"} className="text-[8px] font-black uppercase h-5">{f.rating} Estrelas</Badge>
                   </div>
                   <div className="p-4 rounded-2xl bg-muted/30 border border-muted">
                      <p className="text-sm leading-relaxed font-medium italic">"{f.text}"</p>
                   </div>
                   <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => handlePromoteToPublic(f)} disabled={!!isProcessing} className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2">{isProcessing === f.id ? <Loader2 className="animate-spin" /> : <Globe className="w-3.5 h-3.5" />} Promover a Público</Button>
                      <Button variant="ghost" onClick={() => handleDeleteFeedback(f.id)} className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10"><Trash2 className="w-5 h-5" /></Button>
                   </div>
                </Card>
              ))}
           </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

