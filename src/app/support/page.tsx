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
  AlertTriangle
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { getConsultantResponse } from '@/lib/consultant-rules';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/loading-screen';

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
  const [isPendingClosure, setIsPendingClosure] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      let planMessage = "";

      if (plan === 'enterprise') {
        planMessage = "Você está na **fila prioritária**.";
      } else if (plan === 'gold') {
        planMessage = "Você está na **fila de espera** para o suporte.";
      } else {
        planMessage = "Aguarde até **2 horas** em horário comercial para obter sua resposta.";
      }

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

      // 1. Localizar e deletar TODAS as mensagens (não apenas as últimas 24h)
      const messagesRef = collection(db, 'users', user.uid, 'support_messages');
      const messagesSnap = await getDocs(messagesRef);
      messagesSnap.forEach(docSnap => batch.delete(docSnap.ref));

      // 2. Localizar e deletar tickets ativos
      const ticketsRef = collection(db, 'support_tickets');
      const ticketsSnap = await getDocs(query(ticketsRef, where('userId', '==', user.uid)));
      ticketsSnap.forEach(docSnap => batch.delete(docSnap.ref));

      await batch.commit();

      localStorage.removeItem(`proova_support_v1_${user.uid}`);
      setLocalMessages([]);
      setIsPendingClosure(false);
      
      toast({ title: "Atendimento Encerrado", description: "O histórico foi limpo e o Consultor Proova reiniciado." });
    } catch (err: any) {
      console.error("Erro na limpeza do suporte:", err);
      toast({ variant: "destructive", title: "Erro ao encerrar", description: "Não foi possível limpar os dados. Verifique sua conexão." });
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
      
      if (isPendingClosure) {
        const normalizedInput = userMsg.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const validConfirmations = ['sim', 'claro', 'com certeza', 'pode fechar', 'confirmar', 'quero fechar', 'certeza', 'ok', 'pode', 'fechar', 'concordo', 'prosseguir', 'confirmado'];
        
        if (validConfirmations.some(word => normalizedInput.includes(word)) && normalizedInput.length >= 2) {
          await handleFinalCleanup();
          setIsAiThinking(false);
          setIsSending(false);
        } else {
          setIsPendingClosure(false);
          setTimeout(async () => {
            await addDoc(collection(db, 'users', user.uid, 'support_messages'), {
              text: "Solicitação de encerramento cancelada. O atendimento continua ativo. Como posso ajudar?",
              sender: 'support',
              createdAt: serverTimestamp()
            });
            setIsAiThinking(false);
            setIsSending(false);
          }, 1000);
        }
        return;
      }

      setTimeout(async () => {
        const botResponse = getConsultantResponse(userMsg);
        
        await addDoc(collection(db, 'users', user.uid, 'support_messages'), {
          text: botResponse,
          sender: 'support',
          createdAt: serverTimestamp()
        });
        
        const normalizedInput = userMsg.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        
        if (userMsg === '6' || normalizedInput.includes('humano')) {
          await handleCreateSupportTicket();
        }

        if (userMsg === '7' || normalizedInput.includes('encerrar')) {
          setIsPendingClosure(true);
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

  const isMapsLinkValid = !!userData?.googleMapsUrl;
  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'ENTERPRISE';
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
      <header className="bg-background border-b h-16 md:h-24 flex items-center px-4 md:px-6 shrink-0 z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <Link href="/dash">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary transition-all bg-transparent hover:bg-transparent shadow-none border-none">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center group">
            <div className="relative w-[140px] h-[40px] md:w-[280px] md:h-[90px]">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-dark-mode.gif" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 md:h-12 px-1.5 md:px-2 gap-1.5 md:gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                <div className="hidden sm:flex flex-col items-end relative">
                  <span className="text-xs font-bold truncate max-w-[120px] transition-colors group-hover:text-primary leading-tight">
                    {userData?.companyName || 'Empresa'}
                  </span>
                  <div className="flex flex-col items-end gap-0">
                    <span className={cn(
                      "text-[7px] sm:text-[8px] uppercase tracking-widest font-black leading-tight",
                      userData?.membershipStatus === 'enterprise' ? "text-primary animate-pulse" : "text-muted-foreground"
                    )}>
                      {membershipLabel}
                    </span>
                    {isMapsLinkValid && <span className="text-[5px] sm:text-[6px] font-black uppercase text-green-500 tracking-tighter leading-none">G-Boost Ativo</span>}
                  </div>
                  {activeTicket && (
                    <div className={cn("absolute -top-1 -right-4 h-2 w-2 rounded-full", activeTicket.isSupportInChat ? "bg-green-500 animate-ping" : "bg-red-500")} />
                  )}
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
              <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Layout className="mr-2 h-4 w-4 text-primary" />
                <span>Meus Murais</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/private')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Inbox className="mr-2 h-4 w-4 text-primary" />
                <span>Inbox Privado</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/support')} className="rounded-xl cursor-pointer font-bold py-2.5 bg-primary/5 text-primary">
                <Headphones className="mr-2 h-4 w-4 text-primary" />
                <span>Suporte Proova</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Upgrade</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-pointer font-bold py-2.5"><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto min-h-0 md:p-4 lg:p-6 pb-2 md:pb-8 relative">
        <div className="flex-1 bg-background md:border md:rounded-[2.5rem] md:shadow-2xl flex flex-col overflow-hidden relative">
          
          <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6 md:p-10">
            <div className="space-y-6">
              {localMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in zoom-in duration-1000">
                   <div className="p-5 rounded-[2rem] bg-primary/10 text-primary shadow-inner">
                      <Sparkles className="w-12 h-12" />
                   </div>
                   <div className="text-center space-y-2 px-6">
                      <h3 className="text-xl font-black uppercase tracking-tight">Consultoria Estratégica Proova</h3>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">Olá! Eu sou o seu especialista inteligente em prova social. Como posso ajudar você a dominar o mercado hoje?</p>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
                      {['G-Boost', 'Reputation Shield', 'Widgets', 'Social Cards'].map(opt => (
                         <Button key={opt} variant="outline" className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5" onClick={() => setMessage(opt)}>{opt}</Button>
                      ))}
                   </div>
                </div>
              )}

              {localMessages.map((msg: any, idx: number) => (
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
              ))}

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
                 placeholder={isHumanSupportPresent ? "Digite sua mensagem para o consultor..." : "Como posso ajudar você hoje?"}
                 className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs md:text-sm font-medium pr-14"
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
             <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-1.5">
                   <div className={cn("h-1.5 w-1.5 rounded-full", isHumanSupportPresent ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30")} />
                   <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                     {isHumanSupportPresent ? 'Atendimento Humano Ativo' : 'Especialista Virtual Online'}
                   </span>
                </div>
                <button 
                  onClick={() => setMessage('7')} 
                  className="text-[8px] font-black uppercase tracking-widest text-destructive/40 hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-2.5 h-2.5" /> Encerrar Sessão
                </button>
             </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center opacity-30 shrink-0">
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">Proova Intelligence - Protocolo de Suporte Seguro</p>
      </footer>
    </div>
  );
}