'use client';

import { useMemo, useEffect, useState } from 'react';
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
  ArrowLeft,
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
  Headphones
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

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const isPremiumUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const isAgency = useMemo(() => {
    return userData?.businessType === 'agencia';
  }, [userData]);

  const isMapsLinkValid = useMemo(() => {
    if (!userData?.googleMapsUrl) return false;
    const url = userData.googleMapsUrl.toLowerCase();
    return url.includes('review') || url.includes('writereview') || url.includes('placeid');
  }, [userData]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'ENTERPRISE';
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
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center">
          <Link href="/dash" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px]">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-dark-mode.gif" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex border-none bg-transparent shadow-none hover:bg-transparent" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 focus-visible:ring-0 shadow-none">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[120px] md:max-w-[200px] group-hover:text-primary transition-colors leading-tight">
                    {userData?.companyName || 'Minha Empresa'}
                  </span>
                  <div className="flex flex-col items-end gap-0">
                    <span className={cn(
                      "text-[7px] sm:text-[8px] uppercase tracking-widest font-black leading-tight text-primary",
                      userData?.membershipStatus === 'enterprise' ? "animate-pulse" : ""
                    )}>
                      {membershipLabel}
                    </span>
                    {isMapsLinkValid && <span className="text-[5px] sm:text-[6px] font-black uppercase text-green-500 tracking-tighter leading-none">G-Boost Ativo</span>}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors"><User className="w-4 h-4" /></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span>Dash</span>
              </DropdownMenuItem>
              {isAgency && (
                <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5">
                  <Layout className="mr-2 h-4 w-4 text-primary" />
                  <span>Meus Murais</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push('/private')} className="rounded-xl cursor-pointer font-bold py-2.5 bg-primary/5 text-primary">
                <Inbox className="mr-2 h-4 w-4 text-primary" />
                <span>Inbox Privado</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/support')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Headphones className="mr-2 h-4 w-4 text-primary" />
                <span>Suporte Proova</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Upgrade</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl cursor-pointer font-bold py-2.5">{theme === 'light' ? <Moon className="mr-2 h-4 w-4 text-primary" /> : <Sun className="mr-2 h-4 w-4 text-primary" />}<span>Tema</span></DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-pointer font-bold py-2.5"><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full pt-24 md:pt-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dash">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary transition-all bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent shadow-none border-none select-none"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
                <Inbox className="w-8 h-8 text-primary" /> Moderação Unificada
              </h1>
              <p className="text-sm text-muted-foreground font-medium">Gerencie tudo o que entra na sua marca.</p>
            </div>
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
