'use client';

import { AppSideMenu } from '@/components/app-menu';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Send,
  Loader2,
  CheckCheck,
  Bot,
  Headphones,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Clock,
  Info,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useCollection, useDoc, useAuth } from '@/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  doc, 
  where, 
  Timestamp, 
  getDocs, 
  deleteDoc, 
  writeBatch,
  updateDoc 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getConsultantResponse, matchConsultantKey } from '@/lib/consultant-rules';
import { ppPlanOf } from '@/lib/pp-plans';
import { toast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/loading-screen';
import { formatMessage } from '@/components/support/format-message';
import { SupportInfoPanel, SUPPORT_TOPICS } from '@/components/support/support-info-panel';

export default function SupportPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const supportTicketQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'support_tickets'), where('userId', '==', user.uid), limit(1));
  }, [db, user]);

  const { data: activeTickets } = useCollection(supportTicketQuery);
  const activeTicket = activeTickets?.[0] as any;
  const isHumanSupportPresent = activeTicket?.isSupportInChat === true;
  const isSupportTyping = activeTicket?.isSupportTyping === true;

  const messagesQuery = useMemo(() => {
    if (!db || !user) return null;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return query(
      collection(db, 'users', user.uid, 'support_messages'),
      where('createdAt', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [db, user]);

  const { data: remoteMessages, loading: messagesLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (user) {
      const cacheKey = `proova_support_v1_${user.uid}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const now = Date.now();
          const validMessages = parsed.filter((m: any) => {
            const time = m.createdAt?.seconds ? m.createdAt.seconds * 1000 : (m.createdAt || Date.now());
            return (now - Number(time)) < (24 * 60 * 60 * 1000);
          });
          setLocalMessages(validMessages);
        } catch (e) {
          console.error("Erro no cache:", e);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (remoteMessages && user) {
      setLocalMessages(remoteMessages);
      localStorage.setItem(`proova_support_v1_${user.uid}`, JSON.stringify(remoteMessages));
    } else if (remoteMessages?.length === 0) {
      setLocalMessages([]);
      localStorage.removeItem(`proova_support_v1_${user?.uid}`);
    }
  }, [remoteMessages, user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const scrollToBottom = (smooth = true) => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  // Acompanha a conversa só se a pessoa já estiver perto do fim; senão mostra o botão "novas mensagens".
  useEffect(() => {
    const last = localMessages[localMessages.length - 1];
    if (nearBottomRef.current || last?.sender === 'user') { scrollToBottom(); setShowJump(false); }
    else setShowJump(true);
  }, [localMessages, isAiThinking, isSupportTyping]);

  const onListScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    nearBottomRef.current = near;
    if (near) setShowJump(false);
  };

  const handleTyping = () => {
    if (!activeTicket || !db) return;
    if (!activeTicket.isUserTyping) {
      updateDoc(doc(db, 'support_tickets', activeTicket.id), { isUserTyping: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateDoc(doc(db, 'support_tickets', activeTicket.id), { isUserTyping: false });
    }, 3000);
  };

  const handleCreateSupportTicket = async () => {
    if (!user || !db || !userData || activeTicket) return; // já existe ticket aberto: não duplica
    setIsCreatingTicket(true);
    try {
      const ticketRef = await addDoc(collection(db, 'support_tickets'), {
        userId: user.uid,
        userName: userData.name || 'Usuário Proova',
        membershipStatus: userData.membershipStatus || 'base',
        createdAt: serverTimestamp(),
        status: 'open',
        isSupportInChat: false,
        isUserTyping: false,
        isSupportTyping: false
      });
      const plan = ppPlanOf(userData.membershipStatus);
      const planMessage = plan === 'pro' ? "Você está na **fila prioritária**." : (plan === 'premium' ? "Você está na **fila de espera** para o suporte." : "Aguarde até **2 horas** em horário comercial para obter sua resposta.");
      const finalBotMsg = `Seu ticket foi criado com sucesso! 🎟️\nProtocolo: **${ticketRef.id}**\n\n${planMessage}`;
      await addDoc(collection(db, 'users', user.uid, 'support_messages'), {
        text: finalBotMsg,
        sender: 'support',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleFinalCleanup = async () => {
    if (!user || !db || isEndingChat) return;
    setIsEndingChat(true);
    try {
      const batch = writeBatch(db);
      const messagesRef = collection(db, 'users', user.uid, 'support_messages');
      const messagesSnap = await getDocs(messagesRef);
      messagesSnap.forEach(docSnap => batch.delete(docSnap.ref));
      const ticketsRef = collection(db, 'support_tickets');
      const ticketsSnap = await getDocs(query(ticketsRef, where('userId', '==', user.uid)));
      ticketsSnap.forEach(docSnap => batch.delete(docSnap.ref));
      await batch.commit();
      localStorage.removeItem(`proova_support_v1_${user.uid}`);
      setLocalMessages([]);
      setIsConfirmOpen(false);
      toast({ title: "Atendimento Encerrado" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao encerrar" });
    } finally {
      setIsEndingChat(false);
    }
  };

  const sendText = async (raw: string, fromInput = false) => {
    const userMsg = raw.trim();
    if (!userMsg || !user || !db || isSending || isEndingChat) return;
    setIsSending(true);
    if (fromInput) setMessage('');
    if (activeTicket) {
      updateDoc(doc(db, 'support_tickets', activeTicket.id), { isUserTyping: false });
    }
    try {
      await addDoc(collection(db, 'users', user.uid, 'support_messages'), {
        text: userMsg,
        sender: 'user',
        createdAt: serverTimestamp()
      });
      if (isHumanSupportPresent) {
        setIsSending(false);
        return;
      }
      // "sim" só confirma o encerramento se a última resposta do consultor foi o pedido de confirmação.
      const lastBot = [...localMessages].reverse().find((m: any) => m.sender === 'support');
      const wantsClose = /^sim$/i.test(userMsg) && String(lastBot?.text || '').includes('Confirmação de Encerramento');
      if (wantsClose) {
        setIsSending(false);
        await handleFinalCleanup();
        return;
      }
      setIsAiThinking(true);
      setTimeout(async () => {
        try {
          const key = matchConsultantKey(userMsg);
          const firstName = userData?.name?.split(' ')[0] || 'Parceiro';
          const botResponse = key === '6' && activeTicket
            ? `Você já tem um atendimento aberto (protocolo **${activeTicket.id}**). Escreva sua dúvida aqui que o consultor responde. 🎧\n\n*Digite **0** para voltar ao menu principal.*`
            : getConsultantResponse(userMsg, firstName);
          await addDoc(collection(db, 'users', user.uid, 'support_messages'), {
            text: botResponse,
            sender: 'support',
            createdAt: serverTimestamp()
          });
          if (key === '6') await handleCreateSupportTicket();
        } catch (e) {
          console.error(e);
        } finally {
          setIsAiThinking(false);
          setIsSending(false);
        }
      }, 800);
    } catch (err) {
      console.error(err);
      setIsSending(false);
      setIsAiThinking(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendText(message, true);
  };

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'PREMIUM';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

  const plan = ppPlanOf(userData?.membershipStatus);
  const firstName = userData?.name?.split(' ')[0] || 'Parceiro';

  const tsToDate = (t: any): Date | null => {
    if (!t) return null;
    if (typeof t.toDate === 'function') return t.toDate();
    if (typeof t.seconds === 'number') return new Date(t.seconds * 1000);
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  };
  const dayLabel = (d: Date) => {
    const today = new Date();
    const y = new Date(); y.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    if (d.toDateString() === y.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };
  const timeLabel = (t: any) => {
    const d = tsToDate(t);
    return d ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'enviando';
  };

  const chatMode: 'human' | 'waiting' | 'bot' = isHumanSupportPresent ? 'human' : activeTicket ? 'waiting' : 'bot';
  const statusText = chatMode === 'human' ? 'Atendente online no chat' : chatMode === 'waiting' ? 'Aguardando atendente' : 'Assistente automático · resposta imediata';

  const quickChips = [
    { key: '0', label: 'Menu' },
    ...SUPPORT_TOPICS.map((t) => ({ key: t.key, label: t.label })),
    ...(activeTicket ? [] : [{ key: '6', label: 'Falar com atendente' }]),
  ];

  const onTopic = (key: string) => { setIsInfoOpen(false); sendText(key); };
  const onEnd = () => { setIsInfoOpen(false); setIsConfirmOpen(true); };

  const infoPanel = (
    <SupportInfoPanel
      plan={plan}
      planLabel={membershipLabel}
      ticket={activeTicket || null}
      isHumanPresent={isHumanSupportPresent}
      busy={isSending || isCreatingTicket || isEndingChat}
      onTopic={onTopic}
      onEnd={onEnd}
    />
  );

  const dots = (cls: string) => (
    <span className="flex gap-1 items-center">
      {[0, 1, 2].map((i) => <span key={i} className={cn('w-1.5 h-1.5 rounded-full animate-bounce', cls)} style={{ animationDelay: `${i * 0.15}s` }} />)}
    </span>
  );

  if (authLoading || userDataLoading || (user && !userData)) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-[100dvh] flex flex-col font-body text-foreground overflow-hidden bg-muted/30">
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

      <AppSideMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} toggleRef={toggleButtonRef} companyName={userData?.companyName} membershipLabel={membershipLabel} />

      <AppSideMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} toggleRef={toggleButtonRef} companyName={userData?.companyName} membershipLabel={membershipLabel} />

      <main className="flex-1 min-h-0 pt-16 md:pt-20">
        <div className="h-full max-w-7xl mx-auto lg:p-6 lg:gap-6 flex">
          <aside className="hidden lg:block w-[340px] shrink-0 overflow-y-auto">{infoPanel}</aside>

          <section className="flex-1 min-w-0 flex flex-col bg-background lg:border lg:rounded-3xl lg:shadow-xl overflow-hidden">
            {/* Cabeçalho do chat */}
            <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', chatMode === 'human' ? 'bg-primary text-white' : 'bg-primary/10 text-primary')}>
                {chatMode === 'bot' ? <Bot className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-black uppercase tracking-tight truncate">{chatMode === 'human' ? 'Atendente Proova AI' : 'Suporte Proova AI'}</h1>
                <div className="flex items-center gap-1.5">
                  <span className={cn('h-1.5 w-1.5 rounded-full', chatMode === 'human' ? 'bg-green-500 animate-pulse' : chatMode === 'waiting' ? 'bg-amber-500 animate-pulse' : 'bg-primary/60')} />
                  <span className="text-[11px] font-medium text-muted-foreground truncate">{statusText}</span>
                </div>
              </div>
              <Button type="button" variant="outline" size="icon" className="lg:hidden h-9 w-9 rounded-xl shrink-0" onClick={() => setIsInfoOpen(true)} aria-label="Ver ticket e tópicos">
                <Info className="w-4 h-4" />
              </Button>
            </div>

            {/* Mensagens */}
            <div className="relative flex-1 min-h-0">
              <div ref={listRef} onScroll={onListScroll} className="h-full overflow-y-auto overscroll-contain px-3 sm:px-6 py-5 space-y-1">
                {localMessages.length === 0 && (
                  <div className="max-w-xl mx-auto py-4 space-y-5 animate-in fade-in duration-500">
                    <div className="text-center space-y-2">
                      <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Sparkles className="w-7 h-7" /></div>
                      <h2 className="text-lg font-black tracking-tight">Olá, {firstName}! Como podemos ajudar?</h2>
                      <p className="text-sm text-muted-foreground font-medium">Escolha um tópico ou escreva sua dúvida. Se precisar, chamamos um atendente.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SUPPORT_TOPICS.map((t) => (
                        <button key={t.key} type="button" disabled={isSending} onClick={() => sendText(t.key)}
                          className="flex items-center gap-3 text-left rounded-2xl border bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-colors p-3 disabled:opacity-50">
                          <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><t.icon className="w-4 h-4" /></span>
                          <span className="min-w-0">
                            <span className="block text-sm font-black">{t.label}</span>
                            <span className="block text-[11px] text-muted-foreground font-medium truncate">{t.hint}</span>
                          </span>
                        </button>
                      ))}
                      {!activeTicket && (
                        <button type="button" disabled={isSending} onClick={() => sendText('6')}
                          className="sm:col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-primary text-white font-black text-sm p-3 hover:bg-primary/90 disabled:opacity-50">
                          <Headphones className="w-4 h-4" /> Falar com atendente
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {localMessages.map((msg: any, idx: number) => {
                  const mine = msg.sender === 'user';
                  const d = tsToDate(msg.createdAt);
                  const prev = localMessages[idx - 1];
                  const pd = prev ? tsToDate(prev.createdAt) : null;
                  const newDay = d && (!pd || pd.toDateString() !== d.toDateString());
                  const grouped = prev && prev.sender === msg.sender && !newDay;
                  const next = localMessages[idx + 1];
                  const lastOfGroup = !next || next.sender !== msg.sender;
                  return (
                    <div key={msg.id || idx}>
                      {newDay && d && (
                        <div className="flex justify-center py-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 rounded-full px-3 py-1">{dayLabel(d)}</span>
                        </div>
                      )}
                      <div className={cn('flex', mine ? 'justify-end' : 'justify-start', grouped ? 'mt-0.5' : 'mt-3')}>
                        <div className={cn('max-w-[88%] sm:max-w-[75%] flex flex-col', mine ? 'items-end' : 'items-start')}>
                          <div className={cn(
                            'px-3.5 py-2.5 text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm',
                            mine ? 'bg-primary text-white rounded-2xl rounded-br-md' : 'bg-muted/50 border rounded-2xl rounded-bl-md'
                          )}>
                            {formatMessage(msg.text)}
                          </div>
                          {lastOfGroup && (
                            <div className="flex items-center gap-1 px-1 mt-1 text-[10px] font-medium text-muted-foreground">
                              {!mine && <span>{isHumanSupportPresent ? 'Atendente' : 'Assistente'} ·</span>}
                              <span>{timeLabel(msg.createdAt)}</span>
                              {mine && d && <CheckCheck className="w-3 h-3 text-primary/60" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isAiThinking && (
                  <div className="flex justify-start mt-3 animate-in fade-in duration-300">
                    <div className="bg-muted/50 border rounded-2xl rounded-bl-md px-4 py-3">{dots('bg-primary/60')}</div>
                  </div>
                )}
                {isSupportTyping && (
                  <div className="mt-3 animate-in fade-in duration-300">
                    <div className="inline-flex bg-primary/5 border border-primary/10 rounded-2xl rounded-bl-md px-4 py-3">{dots('bg-primary/60')}</div>
                    <p className="text-[10px] font-medium text-primary mt-1 ml-1">Atendente está digitando...</p>
                  </div>
                )}
              </div>

              {showJump && (
                <button type="button" onClick={() => { scrollToBottom(); setShowJump(false); }}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-primary text-white text-xs font-black px-3.5 py-2 shadow-lg animate-in fade-in zoom-in">
                  <ChevronDown className="w-4 h-4" /> Novas mensagens
                </button>
              )}
            </div>

            {/* Atalhos + campo de envio */}
            <div className="border-t bg-background shrink-0 pb-[env(safe-area-inset-bottom)]">
              {!isHumanSupportPresent && (
                <div className="flex gap-2 overflow-x-auto px-3 sm:px-6 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {quickChips.map((c) => (
                    <button key={c.key} type="button" disabled={isSending || isEndingChat} onClick={() => sendText(c.key)}
                      className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50',
                        c.key === '6' ? 'bg-primary text-white border-primary' : 'bg-muted/30 hover:bg-primary/5 hover:border-primary/30')}>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              {activeTicket && !isHumanSupportPresent && (
                <p className="flex items-center gap-1.5 px-3 sm:px-6 pt-2 text-[11px] font-medium text-muted-foreground">
                  <Clock className="w-3 h-3" /> Ticket aberto. Escreva sua dúvida que o atendente responde por aqui.
                </p>
              )}
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 p-3 sm:px-6 sm:pb-4">
                <Textarea
                  value={message}
                  rows={1}
                  onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(message, true); }
                  }}
                  maxLength={500}
                  placeholder="Escolha um tópico ou digite sua dúvida..."
                  className="min-h-[44px] max-h-32 resize-none rounded-2xl bg-muted/30 border-transparent text-base sm:text-sm font-medium py-3"
                  disabled={isEndingChat}
                />
                <Button type="submit" size="icon" className="h-11 w-11 rounded-xl shrink-0 shadow-lg" disabled={!message.trim() || isSending || isEndingChat} aria-label="Enviar">
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </form>
            </div>
          </section>
        </div>
      </main>

      <Sheet open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="font-black uppercase tracking-tight text-sm">Seu atendimento</SheetTitle>
            <SheetDescription className="sr-only">Ticket, tópicos e encerramento do atendimento</SheetDescription>
          </SheetHeader>
          <div className="mt-3">{infoPanel}</div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
          <AlertDialogHeader className="text-center space-y-4">
             <div className="mx-auto w-fit p-4 rounded-3xl bg-destructive/10 text-destructive">
                <AlertTriangle className="w-10 h-10" />
             </div>
             <div className="space-y-2">
                <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Finalizar Atendimento?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs font-medium leading-relaxed">
                  Isso apagará permanentemente o seu histórico de mensagens desta sessão e encerrará qualquer ticket ativo.
                </AlertDialogDescription>
             </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4">
            <AlertDialogCancel className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-muted border-none hover:bg-muted/80">Manter Chat</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinalCleanup} 
              disabled={isEndingChat}
              className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20"
            >
              {isEndingChat ? <Loader2 className="animate-spin w-4 h-4" /> : "Encerrar e Limpar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
