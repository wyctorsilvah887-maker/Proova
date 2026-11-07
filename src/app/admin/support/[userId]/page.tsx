'use client';

import { useState, useMemo, useEffect, useRef, use } from 'react';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  User, 
  Bot,
  Shield,
  Headphones,
  CheckCheck,
  ExternalLink,
  MessageSquare,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, useCollection, useDoc, useUser } from '@/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  doc, 
  where, 
  getDocs,
  updateDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { notifySupportPresence } from '@/app/actions/support-actions';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export default function AdminChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const db = useFirestore();
  const router = useRouter();
  const { user: adminUser } = useUser();
  
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const targetUserRef = useMemo(() => (db ? doc(db, 'users', userId) : null), [db, userId]);
  const { data: targetUserData, loading: userLoading } = useDoc(targetUserRef);

  // Ticket para monitorar digitação e presença
  const ticketQuery = useMemo(() => {
    if (!db || !userId) return null;
    return query(collection(db, 'support_tickets'), where('userId', '==', userId), limit(1));
  }, [db, userId]);

  const { data: tickets } = useCollection(ticketQuery);
  const activeTicket = tickets?.[0] as any;
  const isUserTyping = activeTicket?.isUserTyping === true;

  const messagesQuery = useMemo(() => {
    if (!db || !userId) return null;
    return query(
      collection(db, 'users', userId, 'support_messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [db, userId]);

  const { data: messages, loading: messagesLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (!db || !userId || !adminUser) return;

    async function setPresence() {
      const ticketsRef = collection(db, 'support_tickets');
      const q = query(ticketsRef, where('userId', '==', userId), limit(1));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const ticketDoc = snap.docs[0];
        await updateDoc(ticketDoc.ref, { 
          isSupportInChat: true,
          supportEnteredAt: serverTimestamp()
        });

        if (!ticketDoc.data().supportEnteredAt) {
          await addDoc(collection(db, 'users', userId, 'support_messages'), {
            text: "Um consultor humano acaba de entrar no chat para te atender. 🎧",
            sender: 'support',
            createdAt: serverTimestamp(),
            isSystem: true
          });
          notifySupportPresence(userId);
        }
      }
    }

    setPresence();

    return () => {
      const clearPresence = async () => {
        const q = query(collection(db, 'support_tickets'), where('userId', '==', userId), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(snap.docs[0].ref, { 
            isSupportInChat: false,
            isSupportTyping: false 
          });
        }
      };
      clearPresence();
    };
  }, [db, userId, adminUser]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isUserTyping]);

  const handleTyping = () => {
    if (!activeTicket || !db) return;

    if (!activeTicket.isSupportTyping) {
      updateDoc(doc(db, 'support_tickets', activeTicket.id), { isSupportTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      updateDoc(doc(db, 'support_tickets', activeTicket.id), { isSupportTyping: false });
    }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !db || isSending) return;

    const text = message.trim();
    setIsSending(true);
    setMessage('');

    if (activeTicket) {
      updateDoc(doc(db, 'support_tickets', activeTicket.id), { isSupportTyping: false });
    }

    try {
      await addDoc(collection(db, 'users', userId, 'support_messages'), {
        text,
        sender: 'support',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveSupport = async () => {
    if (!db || isResolving) return;
    setIsResolving(true);

    try {
      const q = query(collection(db, 'support_tickets'), where('userId', '==', userId), limit(1));
      const snap = await getDocs(q);
      
      const batch = writeBatch(db);
      
      const messagesRef = collection(db, 'users', userId, 'support_messages');
      batch.set(doc(messagesRef), {
        text: "O atendimento humano foi concluído com sucesso. ✅\nO **Consultor Proova** foi reativado para te auxiliar. Como posso ajudar?",
        sender: 'support',
        createdAt: serverTimestamp(),
        isSystem: true
      });

      if (!snap.empty) {
        batch.delete(snap.docs[0].ref);
      }

      await batch.commit();
      toast({ title: "Atendimento Concluído", description: "O ticket foi resolvido e o bot reativado." });
      
      // Redireciona instantaneamente para a fila de suporte
      router.push('/admin/support');
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao concluir" });
      setIsResolving(false);
    }
  };

  if (userLoading || messagesLoading) {
    return <div className="flex h-screen items-center justify-center bg-muted/30"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  return (
    <div className="h-screen flex flex-col font-body bg-muted/30 overflow-hidden">
      <header className="bg-background border-b h-16 md:h-24 flex items-center px-4 md:px-6 shrink-0 z-50 shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
               <User className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-sm md:text-lg font-black font-headline tracking-tight uppercase leading-none">{targetUserData?.name}</h2>
               <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[8px] font-black uppercase h-4 px-1.5">{targetUserData?.membershipStatus}</Badge>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{targetUserData?.companyName}</span>
               </div>
             </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button 
            variant="outline" 
            className="hidden sm:flex h-10 rounded-xl gap-2 font-bold text-green-600 border-green-600/20 hover:bg-green-50"
            onClick={handleResolveSupport}
            disabled={isResolving}
          >
            {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Concluir Atendimento
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="sm:hidden text-green-600"
            onClick={handleResolveSupport}
            disabled={isResolving}
          >
            <CheckCircle2 className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Sessão Ativa</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto min-h-0 md:p-4 lg:p-6">
        <div className="flex-1 bg-background md:border md:rounded-[2rem] md:shadow-2xl flex flex-col overflow-hidden relative">
          
          <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6 md:p-10">
            <div className="space-y-6">
              {messages?.map((msg: any) => (
                <div key={msg.id} className={cn("flex animate-in fade-in zoom-in-95 duration-500", msg.sender === 'support' ? "justify-end" : "justify-start")}>
                  <div className={cn("flex gap-2 md:gap-3 max-w-[90%] sm:max-w-[80%]", msg.sender === 'support' ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-1 shadow-md", msg.sender === 'support' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                      {msg.sender === 'support' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1">
                      <div className={cn(
                        "p-3 md:p-4 shadow-sm border",
                        msg.sender === 'support' 
                          ? "bg-primary text-white rounded-2xl rounded-tr-none border-transparent" 
                          : (msg.isSystem ? "bg-muted/30 border-dashed rounded-2xl text-[11px] font-bold text-primary italic" : "bg-muted/50 rounded-2xl rounded-tl-none")
                      )}>
                        <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <div className={cn("flex items-center gap-1.5 px-1", msg.sender === 'support' ? "justify-end" : "justify-start")}>
                        <span className="text-[8px] font-black uppercase text-muted-foreground opacity-60">
                          {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </span>
                        {msg.sender === 'support' && <CheckCheck className="w-3 h-3 text-primary opacity-40" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isUserTyping && (
                <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex gap-2 md:gap-3 items-center">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-1 shadow-md">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="bg-muted/50 px-4 py-2 rounded-full flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse" />
                        <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-pulse [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[8px] font-black uppercase text-muted-foreground ml-1">Usuário está digitando...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-6 border-t bg-background shrink-0">
             <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
               <Input 
                 value={message}
                 onChange={(e) => {
                   setMessage(e.target.value);
                   handleTyping();
                 }}
                 placeholder="Digite sua resposta técnica ou estratégica..."
                 className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-muted/20 border-transparent focus:ring-primary/20 text-xs md:text-sm font-medium"
                 disabled={isSending || isResolving}
               />
               <Button 
                type="submit" 
                size="icon" 
                className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl shadow-xl bg-primary hover:bg-primary/90 shrink-0"
                disabled={!message.trim() || isSending || isResolving}
               >
                 {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
               </Button>
             </form>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center opacity-30 shrink-0">
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">Root Control - Atendimento VIP Proova</p>
      </footer>
    </div>
  );
}
