'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  User, 
  CheckCheck, 
  Bot,
  LogOut,
  TrendingUp,
  Layout,
  Inbox,
  Gem,
  Sun,
  Moon,
  Shield,
  Zap,
  Sparkles,
  Headphones,
  Ticket,
  XCircle,
  AlertTriangle,
  LayoutGrid as LayoutGridIcon,
  BarChart3,
  ImageIcon,
  Settings,
  X,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { getConsultantResponse, getMainMenu } from '@/lib/consultant-rules';
import { toast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/loading-screen';
import { Badge } from '@/components/ui/badge';

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
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const formatText = (text: string) => {
    if (!text) return "";
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={index} className="text-primary font-black">
            {part.substring(2, part.length - 2)}
          </span>
        );
      }
      return part;
    });
  };

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

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [localMessages, isAiThinking, isSupportTyping]);

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
    if (!user || !db || !userData) return;
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
      const plan = (userData.membershipStatus || 'base').toLowerCase();
      let planMessage = plan === 'enterprise' ? "Você está na **fila prioritária**." : (plan === 'gold' ? "Você está na **fila de espera** para o suporte." : "Aguarde até **2 horas** em horário comercial para obter sua resposta.");
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !db || isSending || isEndingChat) return;
    const userMsg = message.trim();
    setIsSending(true);
    setMessage('');
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
      setIsAiThinking(true);
      setTimeout(async () => {
        const botResponse = getConsultantResponse(userMsg, userData?.name?.split(' ')[0] || 'Parceiro');
        await addDoc(collection(db, 'users', user.uid, 'support_messages'), {
          text: botResponse,
          sender: 'support',
          createdAt: serverTimestamp()
        });
        const normalizedInput = userMsg.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        if (userMsg === '6' || normalizedInput.includes('humano')) {
          await handleCreateSupportTicket();
        }
        setIsAiThinking(false);
        setIsSending(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsSending(false);
      setIsAiThinking(false);
    }
  };

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'PRO';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

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
                    { label: 'Moderação Inbox', href: '/private', icon: Inbox },
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

      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto min-h-0 md:p-4 lg:p-6 pb-2 md:pb-8 relative pt-24 md:pt-32">
        <div className="flex-1 bg-background md:border md:rounded-[2.5rem] md:shadow-2xl flex flex-col overflow-hidden relative">
          
          <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6 md:p-10">
            <div className="space-y-6">
              <div className="bg-muted/10 border-2 border-muted rounded-[1.5rem] p-5 mb-8 animate-in fade-in zoom-in duration-700">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black uppercase tracking-tight">Consultor Proova V1.0</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Árvore de Decisão Ativa</span>
                    </div>
                  </div>
                </div>
              </div>

              {localMessages.length === 0 ? (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex gap-2 md:gap-3 max-w-[85%] sm:max-w-[75%]">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-1 shadow-md bg-muted text-muted-foreground">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="p-3 md:p-4 shadow-sm border bg-muted/30 rounded-2xl rounded-tl-none border-muted">
                        <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                          {formatText(getMainMenu(userData?.name?.split(' ')[0] || 'Parceiro'))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground opacity-60">Sistema</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                localMessages.map((msg: any, idx: number) => (
                  <div key={idx} className={cn("flex animate-in fade-in slide-in-from-bottom-4 duration-500", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn("flex gap-2 md:gap-3 max-w-[85%] sm:max-w-[75%]", msg.sender === 'user' ? "flex-row-reverse" : "flex-row")}>
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-1 shadow-md", msg.sender === 'user' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        {msg.sender === 'user' ? <User className="w-4 h-4" /> : (isHumanSupportPresent ? <Headphones className="w-4 h-4" /> : <Bot className="w-4 h-4" />)}
                      </div>
                      <div className="space-y-1">
                        <div className={cn(
                          "p-3 md:p-4 shadow-sm border",
                          msg.sender === 'user' 
                            ? "bg-primary text-white rounded-2xl rounded-tr-none border-transparent" 
                            : "bg-muted/30 rounded-2xl rounded-tl-none border-muted"
                        )}>
                          <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">{formatText(msg.text)}</p>
                        </div>
                        <div className={cn("flex items-center gap-1.5 px-1", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                          <span className="text-[8px] font-black uppercase text-muted-foreground opacity-60">
                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '...'}
                          </span>
                          {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-primary opacity-40" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isAiThinking && (
                <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex gap-2 md:gap-3 items-center">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-1 shadow-md">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="bg-muted/30 px-4 py-2 rounded-full flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isSupportTyping && (
                <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex gap-2 md:gap-3 items-center">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1 shadow-md border border-primary/20">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="bg-primary/5 px-4 py-2 rounded-full flex gap-1 items-center border border-primary/10">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse" />
                        <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-pulse [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[8px] font-black uppercase text-primary ml-1">Consultor está digitando...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-6 border-t bg-background shrink-0">
             <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3 relative">
               <Input 
                 value={message}
                 onChange={(e) => {
                   setMessage(e.target.value);
                   handleTyping();
                 }}
                 placeholder="Digite o número da opção (ex: 1)..."
                 className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs md:text-sm font-medium pr-14 shadow-inner"
                 disabled={isSending || isEndingChat}
               />
               <Button 
                type="submit" 
                size="icon" 
                className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl shadow-xl bg-primary hover:bg-primary/90 absolute right-1 md:right-1.5"
                disabled={!message.trim() || isSending || isEndingChat}
               >
                 {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
               </Button>
             </form>
             <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex items-center gap-1.5">
                   <div className={cn("h-1.5 w-1.5 rounded-full", isHumanSupportPresent ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30")} />
                   <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                     Histórico local de 24h. Use o menu numerado para navegar.
                   </span>
                </div>
                <button 
                  onClick={() => setIsConfirmOpen(true)} 
                  className="text-[8px] font-black uppercase tracking-widest text-destructive/40 hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-2.5 h-2.5" /> Encerrar Sessão
                </button>
             </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center opacity-30 shrink-0">
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">POWERED BY PROOVA DECISION TREE V1.0</p>
      </footer>

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
