'use client';

import { markFirstApproved } from '@/lib/activation';
import { AppSideMenu } from '@/components/app-menu';
import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Loader2,
  Star,
  Clock,
  Shield,
  Inbox,
  Trash2,
  Sparkles,
  CheckCircle2,
  Globe,
  MessageCircle,
  Mail,
  Copy,
  Undo2,
  BellRing,
  XCircle,
  CircleHelp,
  Bot,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, deleteDoc, updateDoc, getDocs, limit, arrayUnion, where, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoadingScreen } from '@/components/loading-screen';
import { OnboardingTour, type TourStep } from '@/components/onboarding-tour';
import { usePageTour } from '@/hooks/use-page-tour';
import { getPushToken } from '@/lib/push-client';

type Filter = 'open' | 'resolved' | 'all';

const isResolved = (f: any) => f?.status === 'resolved';

function timeAgo(d?: Date | null) {
  if (!d) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.floor(h / 24);
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

/** Quebra o contato deixado pelo cliente em WhatsApp (só dígitos) e/ou e-mail. */
function contactOf(f: any): { phone: string | null; email: string | null; raw: string | null } {
  const raw: string | null = f?.contactInfo || null;
  const phone = raw && !raw.includes('@') ? raw.replace(/\D/g, '') || null : null;
  const email = raw && raw.includes('@') ? raw : f?.userEmail || null;
  return { phone, email, raw };
}

export default function PrivateInboxPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('open');
  const [tab, setTab] = useState('critics');
  const [openDraft, setOpenDraft] = useState<string | null>(null);
  const [pushState, setPushState] = useState<'hidden' | 'ask' | 'busy'>('hidden');
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);
  const tour = usePageTour(userDocRef, userData, 'inboxTourDone');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'PREMIUM';
    if (status === 'trial') return 'TESTE GRÁTIS';
    if (status === 'expired') return 'EXPIRADO';
    return 'SEM PLANO';
  }, [userData]);
  const isPaid = ['gold', 'enterprise', 'trial'].includes(userData?.membershipStatus);

  const testimonialsPendingQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'testimonials'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const privateFeedbacksQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'private_feedbacks'), orderBy('createdAt', 'desc'), limit(200));
  }, [db, user]);

  const { data: pendingList, loading: pendingLoading } = useCollection(testimonialsPendingQuery);
  const { data: feedbackList, loading: feedbackLoading } = useCollection(privateFeedbacksQuery);

  const openCount = useMemo(() => (feedbackList || []).filter((f: any) => !isResolved(f)).length, [feedbackList]);
  const resolvedCount = (feedbackList?.length || 0) - openCount;
  const visibleFeedbacks = useMemo(
    () => (feedbackList || []).filter((f: any) => (filter === 'all' ? true : filter === 'resolved' ? isResolved(f) : !isResolved(f))),
    [feedbackList, filter],
  );

  // O selo do menu lê `inboxNewCount` do perfil (sem leituras extras): aqui ele se corrige sozinho.
  useEffect(() => {
    if (!userDocRef || !userData || feedbackLoading || !feedbackList) return;
    if ((Number(userData.inboxNewCount) || 0) !== openCount) updateDoc(userDocRef, { inboxNewCount: openCount }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCount, feedbackLoading, !!userData]);

  // Avisos push: se já autorizado, só renova o token; se ainda não, oferece ativar (planos pagos).
  const sendTokenToServer = async (token: string) => {
    const tk = await auth?.currentUser?.getIdToken();
    if (!tk) return;
    await fetch('/api/push-token', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` }, body: JSON.stringify({ token }) });
  };
  useEffect(() => {
    if (!user || !isPaid || typeof window === 'undefined' || !('Notification' in window) || !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) return;
    if (Notification.permission === 'granted') {
      getPushToken().then(sendTokenToServer).catch(() => {});
    } else if (Notification.permission === 'default') {
      try { if (localStorage.getItem('proova_push_dismissed') === '1') return; } catch {}
      setPushState('ask');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isPaid]);
  const enablePush = async () => {
    setPushState('busy');
    try {
      await sendTokenToServer(await getPushToken());
      setPushState('hidden');
      toast({ title: 'Avisos ativados', description: 'Você será avisado no celular quando chegar um feedback crítico.' });
    } catch (e: any) {
      setPushState('hidden');
      toast({ variant: 'destructive', title: 'Não foi possível ativar', description: e?.message || 'Tente novamente.' });
    }
  };
  const dismissPush = () => {
    try { localStorage.setItem('proova_push_dismissed', '1'); } catch {}
    setPushState('hidden');
  };

  const firstWidgetInject = async (id: string) => {
    if (!db || !user) return;
    const widgetsSnap = await getDocs(query(collection(db, 'users', user.uid, 'widgets'), limit(1)));
    if (!widgetsSnap.empty) await updateDoc(widgetsSnap.docs[0].ref, { selectedTestimonialIds: arrayUnion(id) });
  };

  const handleApproveTestimonial = async (id: string) => {
    if (!db || !user || isProcessing) return;
    setIsProcessing(id);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'testimonials', id), { status: 'approved' });
      await firstWidgetInject(id);
      markFirstApproved(userDocRef, userData);
      toast({ title: 'Publicado!', description: 'Avaliação aprovada e adicionada ao seu mural.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro na aprovação' });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleArchiveTestimonial = async (id: string) => {
    if (!db || !user || isProcessing) return;
    setIsProcessing(id);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'testimonials', id), { status: 'archived' });
      toast({ title: 'Arquivado', description: 'A avaliação saiu da fila.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao arquivar' });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleResolved = async (f: any) => {
    if (!db || !user || isProcessing) return;
    setIsProcessing(f.id);
    try {
      const nowResolved = !isResolved(f);
      await updateDoc(doc(db, 'users', user.uid, 'private_feedbacks', f.id), nowResolved ? { status: 'resolved', resolvedAt: serverTimestamp() } : { status: 'new', resolvedAt: null });
      toast({ title: nowResolved ? 'Marcado como resolvido' : 'Reaberto', description: nowResolved ? 'Boa! Esse cliente foi atendido.' : 'O feedback voltou para as novas.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao atualizar' });
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePromoteToPublic = async (feedback: any) => {
    if (!db || !user || isProcessing) return;
    const warn = feedback.consent?.publish ? '' : '\n\nAtenção: este feedback é antigo e não tem registro de autorização de publicação do cliente.';
    if (!window.confirm(`Publicar este feedback de ${feedback.rating} estrela(s) na sua página pública? Ele ficará visível para qualquer pessoa.${warn}`)) return;
    setIsProcessing(feedback.id);
    try {
      const newDocRef = await addDoc(collection(db, 'users', user.uid, 'testimonials'), {
        userName: feedback.userName,
        userEmail: feedback.userEmail || '',
        rating: feedback.rating,
        text: feedback.text,
        videoUrl: feedback.videoUrl || null,
        photoUrl: feedback.photoUrl || null,
        consent: feedback.consent || null,
        status: 'approved',
        createdAt: serverTimestamp(),
        source: 'cloned_from_private',
      });
      await firstWidgetInject(newDocRef.id);
      markFirstApproved(userDocRef, userData);
      await deleteDoc(doc(db, 'users', user.uid, 'private_feedbacks', feedback.id));
      toast({ title: 'Feedback publicado', description: 'O item foi movido para os depoimentos públicos.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erro ao publicar' });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!db || !user) return;
    if (!window.confirm('Excluir este feedback para sempre?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'private_feedbacks', id));
      toast({ title: 'Removido', description: 'O feedback foi excluído.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao remover' });
    }
  };

  const copyText = async (text: string, msg = 'Copiado!') => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: msg });
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível copiar' });
    }
  };

  const company = userData?.companyName || 'nossa clínica';
  const defaultMessage = (name: string) =>
    `Olá, ${String(name || '').split(' ')[0] || 'tudo bem'}! Aqui é da ${company}. Vimos o seu feedback e queremos entender melhor o que aconteceu para resolver. Pode nos contar mais?`;

  const tourSteps: TourStep[] = useMemo(
    () => [
      { title: 'Seu Inbox 🛡️', text: 'Aqui chegam os feedbacks de 1 a 3 estrelas. Eles ficam só com você, não aparecem na sua página pública, e dá tempo de resolver antes de virar crítica aberta.' },
      { target: 'i-info', title: 'O que chega aqui', text: 'Críticas vão para a aba "Críticas". Avaliações de 4 e 5 estrelas só com nota (sem comentário) esperam sua aprovação na "Curadoria".' },
      { target: 'i-tabs', title: 'Duas filas', text: 'Críticas: clientes que precisam de atenção. Curadoria: avaliações aguardando você aprovar antes de aparecerem no mural.', onEnter: () => setTab('critics') },
      { target: 'i-filters', title: 'Novas e resolvidas', text: 'Veja o que ainda precisa de resposta e o que já foi resolvido. Marque como resolvido quando terminar.' },
      { title: 'Responda em 1 toque', text: 'Se o cliente deixou contato, o botão abre o WhatsApp ou o e-mail com uma mensagem pronta. A sugestão da IA também fica disponível para copiar.' },
    ],
    [],
  );

  if (authLoading || userDataLoading || (user && !userData)) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
      {tour.open && <OnboardingTour steps={tourSteps} onFinish={tour.finish} />}
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
              <line x1="4" y1="7" x2="20" y2="7" className={cn('origin-center transition-all', isMenuOpen ? 'translate-y-[5px] rotate-45' : '')} />
              <line x1="4" y1="12" x2="20" y2="12" className={cn('origin-center transition-all', isMenuOpen ? 'opacity-0' : '')} />
              <line x1="4" y1="17" x2="20" y2="17" className={cn('origin-center transition-all', isMenuOpen ? '-translate-y-[5px] -rotate-45' : '')} />
            </svg>
          </button>
          <Link href="/dash" className="flex items-center group -ml-2">
            <div className="relative w-[140px] h-[46px] md:w-[280px] md:h-[93px]">
              <Image src="/logo-proovaai-whitemode.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/logo-proovaai-darkmode.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="flex border-none bg-transparent shadow-none hover:bg-transparent" />
        </div>
      </header>

      <AppSideMenu companySlug={userData?.companySlug} open={isMenuOpen} onOpenChange={setIsMenuOpen} toggleRef={toggleButtonRef} companyName={userData?.companyName} membershipLabel={membershipLabel} isAdmin={userData?.isAdmin === true} pendingCount={pendingList?.length || 0} />

      <main className="flex-1 p-4 md:p-8 space-y-6 max-w-3xl mx-auto w-full pt-24 md:pt-32 pb-16">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
              <Inbox className="w-7 h-7 md:w-8 md:h-8 text-primary shrink-0" /> Inbox
            </h1>
            <p className="text-sm text-muted-foreground font-medium">Feedbacks críticos e avaliações para aprovar.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl shrink-0 text-muted-foreground" onClick={tour.start} aria-label="Como funciona">
            <CircleHelp className="w-4 h-4" />
          </Button>
        </div>

        <Card data-tour="i-info" className="rounded-3xl border-none shadow-sm p-5 md:p-6 space-y-3 bg-background">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Shield className="w-5 h-5" /></div>
            <p className="text-sm font-black uppercase tracking-tight">Reputation Shield</p>
          </div>
          <ul className="text-xs md:text-sm text-muted-foreground font-medium space-y-1.5 leading-snug">
            <li>• Notas de <b className="text-foreground">1 a 3 estrelas</b> ficam só aqui, não aparecem na sua página pública.</li>
            <li>• Se o cliente deixou contato, responda em 1 toque pelo WhatsApp ou e-mail.</li>
            <li>• Avaliações só com nota (sem comentário) esperam sua aprovação na <b className="text-foreground">Curadoria</b>.</li>
          </ul>
          {!isPaid && <p className="text-[11px] text-muted-foreground">Alertas no e-mail e no celular quando chega um feedback crítico estão nos planos <Link href="/pricing" className="underline text-primary font-bold">Premium e PRO</Link>.</p>}
        </Card>

        {pushState !== 'hidden' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 border border-primary/10 rounded-2xl text-xs font-medium">
            <BellRing className="w-4 h-4 text-primary shrink-0" />
            <span className="flex-1 min-w-0">Quer ser avisado no celular quando chegar um feedback crítico?</span>
            <Button type="button" size="sm" className="h-8 rounded-lg text-[11px] font-black" onClick={enablePush} disabled={pushState === 'busy'}>
              {pushState === 'busy' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Ativar'}
            </Button>
            <button type="button" onClick={dismissPush} className="text-muted-foreground hover:text-foreground p-1" aria-label="Agora não"><XCircle className="w-4 h-4" /></button>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList data-tour="i-tabs" className="bg-background border rounded-2xl h-14 p-1 gap-2 w-full">
            <TabsTrigger value="critics" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
              <Shield className="w-4 h-4" /> Críticas
              {openCount > 0 && <Badge className="bg-destructive text-white border-none text-[9px] h-4 min-w-4 justify-center px-1">{openCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="curatorship" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
              <Sparkles className="w-4 h-4" /> Curadoria
              {pendingList && pendingList.length > 0 && <Badge className="bg-primary text-white border-none text-[9px] h-4 min-w-4 justify-center px-1">{pendingList.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* ---------------- Críticas (Reputation Shield) ---------------- */}
          <TabsContent value="critics" className="pt-5 space-y-4">
            <div data-tour="i-filters" className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {([['open', `Novas${openCount ? ` (${openCount})` : ''}`], ['resolved', `Resolvidas${resolvedCount ? ` (${resolvedCount})` : ''}`], ['all', 'Todas']] as const).map(([k, label]) => (
                <button key={k} type="button" onClick={() => setFilter(k)}
                  className={cn('shrink-0 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-all', filter === k ? 'bg-primary text-white border-primary shadow-md' : 'bg-background hover:border-primary/30')}>
                  {label}
                </button>
              ))}
            </div>

            {feedbackLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin h-9 w-9 text-primary/30" /></div>
            ) : visibleFeedbacks.length === 0 ? (
              <Card className="p-10 md:p-14 text-center border-2 border-dashed rounded-[2rem] bg-muted/20 shadow-none">
                <CheckCircle2 className="w-11 h-11 mx-auto mb-3 text-green-500" />
                <p className="text-sm font-black uppercase tracking-widest">{filter === 'resolved' ? 'Nenhum resolvido ainda' : 'Tudo em dia!'}</p>
                <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
                  {filter === 'resolved' ? 'Os feedbacks que você marcar como resolvidos aparecem aqui.' : 'Quando alguém deixar de 1 a 3 estrelas pelo seu link de coleta, o feedback chega aqui e só você vê.'}
                </p>
              </Card>
            ) : (
              visibleFeedbacks.map((f: any) => {
                const c = contactOf(f);
                const date: Date | null = f.createdAt?.toDate?.() || null;
                const resolved = isResolved(f);
                const first = String(f.userName || '').split(' ')[0] || 'Cliente';
                const msg = defaultMessage(f.userName);
                return (
                  <Card key={f.id} className={cn('rounded-[2rem] border-none shadow-sm overflow-hidden p-5 md:p-7 space-y-4 bg-background', resolved && 'opacity-70')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center font-black text-xs uppercase shrink-0', f.rating <= 2 ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600')}>{String(f.userName || 'C').substring(0, 2)}</div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{f.userName}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3 shrink-0" />{timeAgo(date)}{date ? ` · ${date.toLocaleDateString('pt-BR')}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={cn('w-3.5 h-3.5', s <= f.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20')} />)}</div>
                        {resolved && <Badge className="bg-green-500/15 text-green-600 border-none text-[9px] font-black uppercase h-5 gap-1"><CheckCircle2 className="w-3 h-3" />Resolvido</Badge>}
                      </div>
                    </div>

                    {f.text?.trim() ? (
                      <div className="p-4 rounded-2xl bg-muted/30 border border-muted"><p className="text-sm leading-relaxed font-medium italic break-words">"{f.text}"</p></div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">O cliente deu a nota, mas não escreveu comentário.</p>
                    )}

                    {(f.videoUrl || f.photoUrl) && (
                      <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                        {f.videoUrl && <a href={f.videoUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">Ver vídeo enviado</a>}
                        {f.photoUrl && <a href={f.photoUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">Ver foto enviada</a>}
                      </div>
                    )}

                    {/* Contato do cliente */}
                    {c.raw || c.email ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                        {c.phone && <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1.5"><Phone className="w-3.5 h-3.5" />+{c.phone}</span>}
                        {c.email && <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 min-w-0"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{c.email}</span></span>}
                        <button type="button" onClick={() => copyText(c.phone ? `+${c.phone}` : c.email || '', 'Contato copiado!')} className="text-muted-foreground hover:text-foreground p-1.5" aria-label="Copiar contato"><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">O cliente não deixou contato. Se ele pedir retorno depois do envio, você será avisado.</p>
                    )}

                    {/* Sugestão da IA */}
                    {f.aiReplyDraft && (
                      <div className="rounded-2xl border border-primary/15 bg-primary/5">
                        <button type="button" onClick={() => setOpenDraft(openDraft === f.id ? null : f.id)} className="w-full flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-primary">
                          <Bot className="w-4 h-4" /> Sugestão de resposta da IA <span className="ml-auto text-muted-foreground">{openDraft === f.id ? 'Ocultar' : 'Ver'}</span>
                        </button>
                        {openDraft === f.id && (
                          <div className="px-4 pb-4 space-y-3">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{f.aiReplyDraft}</p>
                            <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg text-[11px] font-black gap-1.5" onClick={() => copyText(f.aiReplyDraft, 'Sugestão copiada!')}><Copy className="w-3 h-3" /> Copiar</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {c.phone ? (
                        <a href={`https://wa.me/${c.phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
                          className="col-span-2 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                          <MessageCircle className="w-4 h-4" /> Responder no WhatsApp
                        </a>
                      ) : c.email ? (
                        <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Sobre o seu feedback — ${company}`)}&body=${encodeURIComponent(msg)}`}
                          className="col-span-2 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                          <Mail className="w-4 h-4" /> Responder por e-mail
                        </a>
                      ) : null}
                      <Button variant={resolved ? 'outline' : 'default'} onClick={() => handleToggleResolved(f)} disabled={!!isProcessing}
                        className={cn('h-11 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2', !resolved && !c.phone && !c.email && 'col-span-2')}>
                        {isProcessing === f.id ? <Loader2 className="animate-spin w-4 h-4" /> : resolved ? <Undo2 className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {resolved ? 'Reabrir' : 'Marcar resolvido'}
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handlePromoteToPublic(f)} disabled={!!isProcessing} className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] gap-1.5"><Globe className="w-3.5 h-3.5" /> Publicar</Button>
                        <Button variant="ghost" onClick={() => handleDeleteFeedback(f.id)} className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10" aria-label="Excluir"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* ---------------- Curadoria ---------------- */}
          <TabsContent value="curatorship" className="pt-5 space-y-4">
            <p className="text-xs text-muted-foreground font-medium">Avaliações que chegaram só com nota (sem comentário) esperam sua aprovação antes de aparecer no mural.</p>
            {pendingLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin h-9 w-9 text-primary/30" /></div>
            ) : (pendingList || []).length === 0 ? (
              <Card className="p-10 md:p-14 text-center border-2 border-dashed rounded-[2rem] bg-muted/20 shadow-none">
                <CheckCircle2 className="w-11 h-11 mx-auto mb-3 text-green-500" />
                <p className="text-sm font-black uppercase tracking-widest">Tudo em dia!</p>
                <p className="text-xs text-muted-foreground mt-2">Sem avaliações aguardando aprovação.</p>
              </Card>
            ) : (
              pendingList?.map((t: any) => (
                <Card key={t.id} className="rounded-[2rem] border-none shadow-sm overflow-hidden p-5 md:p-7 space-y-4 bg-background">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase shrink-0">{String(t.userName || 'C').substring(0, 2)}</div>
                      <div className="min-w-0"><p className="font-bold text-sm truncate">{t.userName}</p><p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{t.createdAt?.toDate?.().toLocaleDateString('pt-BR')}</p></div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={cn('w-3.5 h-3.5', s <= t.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20')} />)}</div>
                  </div>
                  {t.text?.trim() ? <p className="text-sm italic leading-relaxed text-foreground/80">"{t.text}"</p> : <p className="text-xs text-muted-foreground italic">Só a nota, sem comentário.</p>}
                  <div className="flex gap-3 pt-1">
                    <Button onClick={() => handleApproveTestimonial(t.id)} disabled={!!isProcessing} className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90">{isProcessing === t.id ? <Loader2 className="animate-spin" /> : 'Aprovar e publicar'}</Button>
                    <Button variant="ghost" onClick={() => handleArchiveTestimonial(t.id)} disabled={!!isProcessing} className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10" aria-label="Arquivar"><Trash2 className="w-5 h-5" /></Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
