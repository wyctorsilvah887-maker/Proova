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
  Handshake
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
import { doc, collection, query, orderBy, deleteDoc, updateDoc, getDocs, limit, arrayUnion, where } from 'firebase/firestore';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

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

  // Busca de Feedbacks Privados
  const feedbacksQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'private_feedbacks'));
  }, [db, user]);
  const { data: privateFeedbacksList, loading: feedbacksLoading } = useCollection(feedbacksQuery);

  // Busca de Depoimentos para Curadoria
  const testimonialsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'testimonials'));
  }, [db, user]);
  const { data: testimonialsList, loading: testimonialsLoading } = useCollection(testimonialsQuery);

  const pendingTestimonials = useMemo(() => {
    return (testimonialsList || [])
      .filter((t: any) => t.status === 'pending')
      .sort((a: any, b: any) => {
        const da = a.createdAt?.toDate?.() || new Date(0);
        const db = b.createdAt?.toDate?.() || new Date(0);
        return db.getTime() - da.getTime();
      });
  }, [testimonialsList]);

  const privateFeedbacks = useMemo(() => {
    return (privateFeedbacksList || [])
      .sort((a: any, b: any) => {
        const da = a.createdAt?.toDate?.() || new Date(0);
        const db = b.createdAt?.toDate?.() || new Date(0);
        return db.getTime() - da.getTime();
      });
  }, [privateFeedbacksList]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'Membro Enterprise';
    if (status === 'gold') return 'Membro Gold';
    if (status === 'trial') return 'Período Trial';
    if (status === 'expired') return 'Plano Expirado';
    return 'Plano Base';
  }, [userData]);

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
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
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
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[120px] md:max-w-[200px] group-hover:text-primary transition-colors leading-tight">
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
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span>Dash</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Layout className="mr-2 h-4 w-4 text-primary" />
                <span>Meus Widgets</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/private')} className="rounded-xl cursor-pointer font-bold py-2.5 bg-primary/5 text-primary">
                <Inbox className="mr-2 h-4 w-4 text-primary" />
                <span>Inbox Privado</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Planos de Upgrade</span>
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

      <main className="flex-1 p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dash">
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
                <Inbox className="w-8 h-8 text-primary" /> Moderação Unificada
              </h1>
              <p className="text-sm text-muted-foreground">Gerencie tudo o que entra na sua marca.</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="curatorship" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 h-12 rounded-xl">
            <TabsTrigger value="curatorship" className="rounded-lg gap-2 font-bold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> Curadoria {pendingTestimonials.length > 0 && <Badge className="ml-1 h-4 px-1 text-[8px] bg-primary">{pendingTestimonials.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="private" className="rounded-lg gap-2 font-bold text-xs uppercase tracking-widest">
              <Shield className="w-4 h-4" /> Inbox Privado {privateFeedbacks.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[8px]">{privateFeedbacks.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="curatorship" className="mt-0 space-y-4">
            {testimonialsLoading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 text-primary/30 mx-auto" /></div>
            ) : pendingTestimonials.length > 0 ? (
              <div className="grid gap-4">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center gap-3 mb-2 animate-pulse">
                   <Sparkles className="w-5 h-5 text-primary shrink-0" />
                   <p className="text-xs font-bold text-primary">Estes elógios são qualificados para o seu site. Aprove-os agora!</p>
                </div>
                {pendingTestimonials.map((t: any) => (
                  <Card key={t.id} className="border-none shadow-sm overflow-hidden rounded-2xl group transition-all hover:shadow-md">
                    <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/5 p-2.5 rounded-xl"><User className="w-4 h-4 text-primary" /></div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{t.userName}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {t.userEmail || 'Não informado'}</span>
                            </div>
                          </div>
                          <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={cn("w-3.5 h-3.5", i < (t.rating || 5) ? "fill-primary text-primary" : "text-muted-foreground/20")} />))}</div>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-2xl border-l-4 border-primary italic text-sm leading-relaxed">"{t.text}"</div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest"><span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString('pt-BR') : 'Hoje'}</span></div>
                      </div>
                      <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                        <Button 
                          className="w-full md:w-32 h-12 rounded-xl font-bold gap-2 shadow-lg"
                          disabled={!!isProcessing}
                          onClick={() => handleApproveTestimonial(t.id)}
                        >
                          {isProcessing === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Publicar
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full md:w-32 h-12 rounded-xl font-bold gap-2"
                          disabled={!!isProcessing}
                          onClick={() => handleArchiveTestimonial(t.id)}
                        >
                          <EyeOff className="w-4 h-4" /> Ocultar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center border-2 border-dashed rounded-[2.5rem] bg-muted/5 space-y-4">
                <Sparkles className="w-16 h-16 text-muted-foreground/20 mx-auto" />
                <div className="space-y-1">
                  <p className="font-bold text-lg">Curadoria em Dia</p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">Você já processou todos os novos depoimentos qualificados.</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="private" className="mt-0 space-y-4">
            {feedbacksLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary/30" /></div>
            ) : privateFeedbacks && privateFeedbacks.length > 0 ? (
              privateFeedbacks.map((f: any) => (
                <Card key={f.id} className="border-none shadow-sm overflow-hidden rounded-2xl group transition-all hover:shadow-md">
                  <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/5 p-2.5 rounded-xl"><User className="w-4 h-4 text-primary" /></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{f.userName}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {f.userEmail || 'Não informado'}</span>
                          </div>
                        </div>
                        <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={cn("w-3.5 h-3.5", i < f.rating ? "fill-orange-400 text-orange-400" : "text-muted-foreground/20")} />))}</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-2xl border-l-4 border-orange-400/30 italic text-sm leading-relaxed">"{f.text}"</div>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest"><span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {f.createdAt?.toDate ? f.createdAt.toDate().toLocaleString('pt-BR') : 'Agora'}</span></div>
                    </div>
                    <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10" onClick={() => handleDeleteFeedback(f.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-32 text-center border-2 border-dashed rounded-[2.5rem] bg-muted/5 space-y-4">
                <MessageSquareOff className="w-16 h-16 text-muted-foreground/20 mx-auto" />
                <div className="space-y-1">
                  <p className="font-bold text-lg">Inbox Vazio</p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">Nenhum feedback crítico recebido. Continue prestando um ótimo serviço!</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-12 border-t mt-auto flex flex-col items-center gap-8 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[200px] h-[65px] md:w-[320px] md:h-[105px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="object-contain dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block" priority />
        </div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60">© 2026 Proova Technology</p>
      </footer>
    </div>
  );
}
