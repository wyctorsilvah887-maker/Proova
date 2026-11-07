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
  writeBatch 
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { getConsultantResponse } from '@/lib/consultant-rules';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const messagesQuery = useMemo(() => {
    if (!db || !user) return null;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return query(
      collection(db, 'users', user.uid, 'support_messages'),
      where('createdAt', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
      orderBy('createdAt', 'asc'),
      limit(50)
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
  }, [localMessages, isAiThinking]);

  const handleCreateSupportTicket = async () => {
    if (!user || !db || !userData) return;
    setIsCreatingTicket(true);
    
    try {
      const ticketRef = await addDoc(collection(db, 'support_tickets'), {
        userId: user.uid,
        userName: userData.name || 'Usuário Proova',
        membershipStatus: userData.membershipStatus || 'base',
        createdAt: serverTimestamp(),
        status: 'open'
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !db || isSending) return;

    const userMsg = message.trim();
    setIsSending(true);
    setMessage('');

    try {
      await addDoc(collection(db, 'users', user.uid, 'support_messages'), {
        text: userMsg,
        sender: 'user',
        createdAt: serverTimestamp()
      });

      setIsAiThinking(true);
      
      setTimeout(async () => {
        const botResponse = getConsultantResponse(userMsg);
        
        await addDoc(collection(db, 'users', user.uid, 'support_messages'), {
          text: botResponse,
          sender: 'support',
          createdAt: serverTimestamp()
        });
        
        if (userMsg === '6' || userMsg.toLowerCase().includes('humano')) {
          await handleCreateSupportTicket();
        }

        // Gatilho para encerrar chat via comando de texto ou número
        if (userMsg === '7' || userMsg.toLowerCase().includes('encerrar')) {
          handleOpenConfirmModal();
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

  const handleOpenConfirmModal = () => {
    setConfirmationInput('');
    setIsConfirmModalOpen(true);
  };

  const handleEndChatConfirmed = async () => {
    if (!user || !db || isEndingChat) return;

    const validConfirmations = [
      'sim', 'claro', 'com certeza', 'sim, tenho certeza', 
      'pode fechar', 'confirmar', 'quero fechar', 'certeza', 
      'ok', 'pode', 'fechar chat', 'fechar', 'estou ciente', 
      'concordo', 'prosseguir', 'confirmado'
    ];

    const normalizedInput = confirmationInput.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

    if (!validConfirmations.some(word => normalizedInput.includes(word)) || normalizedInput.length < 2) {
      toast({ 
        variant: "destructive", 
        title: "Confirmação Necessária", 
        description: "Para sua segurança, digite 'SIM' ou uma confirmação válida para encerrar." 
      });
      return;
    }

    setIsEndingChat(true);
    try {
      const batch = writeBatch(db);

      const messagesRef = collection(db, 'users', user.uid, 'support_messages');
      const messagesSnap = await getDocs(messagesRef);
      messagesSnap.forEach(doc => batch.delete(doc.ref));

      const ticketsRef = collection(db, 'support_tickets');
      const ticketsSnap = await getDocs(query(ticketsRef, where('userId', '==', user.uid)));
      ticketsSnap.forEach(doc => batch.delete(doc.ref));

      await batch.commit();

      localStorage.removeItem(`proova_support_v1_${user.uid}`);
      setLocalMessages([]);
      
      toast({ title: "Atendimento Encerrado", description: "Histórico limpo com sucesso." });
      setIsConfirmModalOpen(false);
      router.push('/dash');
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Erro ao encerrar", description: "Não foi possível limpar os dados agora." });
    } finally {
      setIsEndingChat(false);
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
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    );
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
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 md:h-12 px-1.5 md:px-2 gap-1.5 md:gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                <div className="hidden sm:flex flex-col items-end">
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

      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto min-h-0 md:p-4 lg:p-6">
        <div className="flex-1 bg-background md:border md:rounded-[2rem] md:shadow-2xl flex flex-col overflow-hidden relative border-none">
          
          <div className="px-4 py-3 md:p-6 border-b bg-muted/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <Bot className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-sm md:text-lg font-black font-headline tracking-tight uppercase leading-none">Consultor Proova v1.0</h2>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Árvore de Decisão Ativa</span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleOpenConfirmModal}
              disabled={isEndingChat || (localMessages.length === 0 && !isAiThinking)}
              className="h-9 px-3 rounded-xl gap-2 text-destructive border-destructive/20 hover:bg-destructive/5 font-bold transition-all text-[10px] uppercase tracking-widest"
            >
              {isEndingChat ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              Encerrar Atendimento
            </Button>
          </div>

          <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6 md:p-10">
            <div className="space-y-6 md:space-y-8 pb-10">
              {localMessages.length === 0 && !messagesLoading && (
                <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="flex gap-2 md:gap-3 max-w-[90%] sm:max-w-[80%]">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0 mt-1 shadow-lg">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="bg-muted/50 border rounded-2xl rounded-tl-none p-3 md:p-4 shadow-sm">
                        <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                          Olá, <span className="text-primary font-black">{userData?.name?.split(' ')[0]}</span>! 👋 {formatText(getConsultantResponse('menu'))}
                        </p>
                      </div>
                      <span className="text-[8px] font-black uppercase text-muted-foreground ml-1">Assistente Estratégico</span>
                    </div>
                  </div>
                </div>
              )}

              {localMessages.map((msg: any) => (
                <div key={msg.id} className={cn(
                  "flex animate-in fade-in zoom-in-95 duration-500",
                  msg.sender === 'user' ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "flex gap-2 md:gap-3 max-w-[90%] sm:max-w-[80%]",
                    msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-1 shadow-md",
                      msg.sender === 'user' ? "bg-muted text-muted-foreground" : "bg-primary text-white"
                    )}>
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1">
                      <div className={cn(
                        "p-3 md:p-4 shadow-sm border",
                        msg.sender === 'user' 
                          ? "bg-primary text-white rounded-2xl rounded-tr-none border-transparent shadow-lg shadow-primary/20" 
                          : "bg-muted/50 rounded-2xl rounded-tl-none"
                      )}>
                        <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">{formatText(msg.text)}</p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 px-1",
                        msg.sender === 'user' ? "justify-end" : "justify-start"
                      )}>
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
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Bot className="w-4 h-4 animate-bounce" />
                    </div>
                    <div className="bg-muted/30 px-4 py-2 rounded-full flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse" />
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-pulse [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-6 border-t bg-background shrink-0">
             {isCreatingTicket ? (
               <div className="h-12 md:h-14 w-full flex items-center justify-center gap-3 bg-primary/5 rounded-xl md:rounded-2xl border-2 border-primary/20 animate-pulse">
                 <Loader2 className="w-5 h-5 text-primary animate-spin" />
                 <span className="text-xs md:text-sm font-black uppercase tracking-widest text-primary">Estou criando seu ticket de suporte...</span>
               </div>
             ) : (
               <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
                 <div className="relative flex-1 group">
                   <Input 
                     value={message}
                     onChange={(e) => setMessage(e.target.value)}
                     placeholder="Digite o número da opção (ex: 1)..."
                     className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-muted/20 border-transparent focus:ring-primary/20 pr-10 text-xs md:text-sm font-medium transition-all"
                     disabled={isSending || isAiThinking || isEndingChat}
                   />
                 </div>
                 <Button 
                  type="submit" 
                  size="icon" 
                  className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-90 bg-primary hover:bg-primary/90 shrink-0"
                  disabled={!message.trim() || isSending || isAiThinking || isEndingChat}
                 >
                   {isSending || isAiThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                 </Button>
               </form>
             )}
             <p className="text-[8px] md:text-[9px] text-center mt-3 uppercase tracking-[0.2em] font-black text-muted-foreground opacity-40">
               Histórico local de 24h. Use o menu numerado para navegar.
             </p>
          </div>
        </div>
      </main>

      <footer className="hidden md:block py-4 text-center opacity-30 shrink-0">
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">Powered by Proova Decision Tree v1.0</p>
      </footer>

      {/* Modal de Confirmação para Encerrar */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-background max-w-md w-[95vw]">
          <div className="h-1.5 bg-destructive w-full" />
          <div className="p-8 space-y-6">
            <DialogHeader className="space-y-4">
              <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit animate-bounce">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-1 text-center">
                <DialogTitle className="text-xl md:text-2xl font-black font-headline uppercase tracking-tight">Encerrar Atendimento?</DialogTitle>
                <DialogDescription className="text-sm font-medium leading-relaxed">
                  Isso apagará permanentemente o seu histórico de mensagens e tickets ativos. 
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Para confirmar, digite "SIM" ou "CONCORDO":
              </Label>
              <Input 
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Digite aqui..."
                className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-destructive/20 font-black text-center uppercase tracking-widest"
                onKeyDown={(e) => e.key === 'Enter' && handleEndChatConfirmed()}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsConfirmModalOpen(false)}
                className="h-12 rounded-xl font-bold border-muted-foreground/10 hover:bg-muted/50"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEndChatConfirmed}
                disabled={isEndingChat || !confirmationInput.trim()}
                variant="destructive"
                className="h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-destructive/20"
              >
                {isEndingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : "Encerrar Agora"}
              </Button>
            </div>
          </div>
          <div className="p-4 bg-muted/30 border-t text-center">
             <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Ação irreversível de limpeza de dados</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
