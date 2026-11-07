'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  User, 
  Headphones, 
  CheckCheck, 
  Clock,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  LogOut,
  TrendingUp,
  Layout,
  Inbox,
  Gem,
  Handshake,
  Sun,
  Moon,
  Search,
  ChevronRight,
  Plus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useDoc, useAuth } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc } from 'firebase/firestore';
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

export default function SupportPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const messagesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'support_messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [db, user]);

  const { data: messages, loading: messagesLoading } = useCollection(messagesQuery);

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
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !db || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'support_messages'), {
        text: message.trim(),
        sender: 'user',
        createdAt: serverTimestamp()
      });
      setMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const membershipLabel = useMemo(() => {
    const status = userData?.membershipStatus;
    if (status === 'enterprise') return 'ENTERPRISE';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    return 'PLANO BASE';
  }, [userData]);

  const isMapsLinkValid = !!userData?.googleMapsUrl;

  if (authLoading || userDataLoading || (user && !userData)) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col font-body text-foreground overflow-hidden bg-muted/30">
      {/* HEADER ADAPTÁVEL */}
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
              <Button variant="ghost" className="h-10 md:h-12 px-1 md:px-2 gap-1.5 md:gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[120px] transition-colors group-hover:text-primary leading-tight">
                    {userData?.companyName || 'Empresa'}
                  </span>
                  <span className="text-[8px] uppercase tracking-widest font-black text-muted-foreground leading-tight">
                    {membershipLabel}
                  </span>
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

      {/* CHAT CONTAINER PRINCIPAL */}
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto min-h-0 md:p-4 lg:p-6">
        <div className="flex-1 bg-background md:border md:rounded-[2rem] md:shadow-2xl flex flex-col overflow-hidden relative border-none">
          
          {/* Header do Chat Interno */}
          <div className="px-4 py-3 md:p-6 border-b bg-muted/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <Headphones className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-sm md:text-lg font-black font-headline tracking-tight uppercase leading-none">Suporte Proova</h2>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time Online</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end opacity-40">
              <span className="text-[9px] font-black uppercase tracking-widest">Protocolo</span>
              <span className="text-[10px] font-mono font-bold">#{user?.uid.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* Área de Mensagens com Scroll */}
          <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6 md:p-10">
            <div className="space-y-6 md:space-y-8 pb-10">
              {/* Mensagem Inicial do Sistema */}
              <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="flex gap-2 md:gap-3 max-w-[90%] sm:max-w-[80%]">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0 mt-1 shadow-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="bg-muted/50 border rounded-2xl rounded-tl-none p-3 md:p-4 shadow-sm">
                      <p className="text-xs md:text-sm font-medium leading-relaxed">
                        Olá, <strong>{userData?.name?.split(' ')[0]}</strong>! 👋 <br />
                        Bem-vindo ao canal direto Proova. Como podemos ajudar sua marca hoje?
                      </p>
                    </div>
                    <span className="text-[8px] font-black uppercase text-muted-foreground ml-1">Assistente Proova</span>
                  </div>
                </div>
              </div>

              {/* Histórico Dinâmico */}
              {messages && messages.map((msg: any) => (
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
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1">
                      <div className={cn(
                        "p-3 md:p-4 shadow-sm border",
                        msg.sender === 'user' 
                          ? "bg-primary text-white rounded-2xl rounded-tr-none border-transparent" 
                          : "bg-muted/50 rounded-2xl rounded-tl-none"
                      )}>
                        <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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
              
              {messagesLoading && (
                <div className="flex justify-center py-10 opacity-20">
                  <Loader2 className="animate-spin w-8 h-8" />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer de Entrada (Input) */}
          <div className="p-3 md:p-6 border-t bg-background shrink-0">
             <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
               <div className="relative flex-1 group">
                 <Input 
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   placeholder="Digite sua mensagem..."
                   className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-muted/20 border-transparent focus:ring-primary/20 pr-10 text-xs md:text-sm font-medium transition-all"
                   disabled={isSending}
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:block">
                   <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-30 group-focus-within:opacity-60 transition-opacity">
                     Enter
                   </div>
                 </div>
               </div>
               <Button 
                type="submit" 
                size="icon" 
                className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-90 bg-primary hover:bg-primary/90 shrink-0"
                disabled={!message.trim() || isSending}
               >
                 {isSending ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
               </Button>
             </form>
             <p className="text-[8px] md:text-[9px] text-center mt-3 uppercase tracking-[0.2em] font-black text-muted-foreground opacity-40">
               Suporte Proova v2.1 • Criptografia Ativa
             </p>
          </div>
        </div>
      </main>

      <footer className="hidden md:block py-4 text-center opacity-30 shrink-0">
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">Powered by Proova Technology</p>
      </footer>
    </div>
  );
}
