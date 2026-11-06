'use client';

import { useState, useMemo, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  Zap, 
  Download,
  Star,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { optimizeCard, type OptimizeCardOutput } from '@/ai/flows/optimize-card-flow';
import { toast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'card';
  data?: OptimizeCardOutput;
}

export default function SocialCardAIPage({ params }: { params: Promise<{ testimonialId: string }> }) {
  const { testimonialId } = use(params);
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const testimonialRef = useMemo(() => (db && user ? doc(db, 'users', user.uid, 'testimonials', testimonialId) : null), [db, user, testimonialId]);
  const { data: testimonialData, loading: testimonialLoading } = useDoc(testimonialRef);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          role: 'assistant', 
          content: 'Olá! Sou seu Diretor de Arte Proova. Digite **/start** ou peça um estilo específico (ex: "fundo mármore branco", "tema tecnológico azul") para começarmos.' 
        }
      ]);
    }
  }, []);

  const handleDownload = async (index: number) => {
    const targetRef = cardRefs.current[index];
    if (!targetRef || isExporting) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(targetRef, { 
        pixelRatio: 3, 
        quality: 1.0,
        style: { borderRadius: '2.5rem' }
      });
      const link = document.createElement('a');
      link.download = `proova-ai-design-${testimonialId}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Arte Baixada!", description: "Seu card 4K está pronto para o Instagram." });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro no download" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const userMessage = textOverride || inputValue.trim();
    if (!userMessage || isProcessing || !testimonialData || !user || !db) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const isInitial = userMessage.toLowerCase() === '/start';
      
      const result = await optimizeCard({
        text: testimonialData.text,
        userName: testimonialData.userName,
        rating: testimonialData.rating,
        businessType: userData?.businessType || 'Serviços',
        userInstruction: isInitial ? "Create a standard luxury design" : userMessage
      });

      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: isInitial 
            ? 'Design inicial gerado! O que achou? Posso mudar cores, textos ou elementos se desejar.' 
            : 'Instrução aplicada! Analise esta nova variação que criei para você.',
          type: 'card',
          data: result
        }
      ]);

      if (testimonialRef) {
        updateDoc(testimonialRef, { lastAiGenerationAt: serverTimestamp() });
      }

    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Ops, tive um problema técnico. Tente me dar outra instrução em instantes.' }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || testimonialLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground h-screen overflow-hidden">
      <header className="bg-background border-b h-20 flex items-center px-4 md:px-8 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-4">
          <Link href="/social-cards">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-tight hidden sm:block">AI Design Studio</h2>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
           <Badge variant="outline" className="hidden md:flex h-6 text-[8px] font-black uppercase border-primary/20 text-primary">
             Motor: Proova Engine v5.5
           </Badge>
           <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 mt-20 overflow-y-auto p-4 md:p-8 flex justify-center scrollbar-hide pb-32">
        <div className="w-full max-w-2xl space-y-8">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn(
              "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
              msg.role === 'user' ? "flex-row-reverse text-right" : ""
            )}>
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                msg.role === 'assistant' ? "bg-primary text-white" : "bg-zinc-800 text-white"
              )}>
                {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              
              <div className={cn("space-y-4 max-w-[85%]", msg.role === 'user' ? "items-end" : "")}>
                <Card className={cn(
                  "border-none shadow-md rounded-[1.5rem]",
                  msg.role === 'assistant' ? "bg-background" : "bg-primary text-white"
                )}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                  </CardContent>
                </Card>

                {msg.type === 'card' && msg.data && (
                  <div className="space-y-4 animate-in zoom-in duration-700">
                    <div 
                      ref={el => { cardRefs.current[idx] = el; }}
                      className="aspect-square w-full max-w-[380px] rounded-[2.5rem] shadow-2xl overflow-hidden relative border-8 border-background bg-black mx-auto lg:mx-0"
                      style={{ 
                        backgroundImage: msg.data.backgroundImageUri ? `url(${msg.data.backgroundImageUri})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#000'
                      }}
                    >
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-8 text-center">
                         <h2 className="text-white font-black text-2xl tracking-tighter drop-shadow-2xl uppercase">
                           {msg.data.author}
                         </h2>
                         
                         <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                            <div className="flex justify-center gap-1.5">
                              {Array.from({ length: testimonialData?.rating || 5 }).map((_, i) => (
                                <Star key={i} className="w-7 h-7 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                              ))}
                            </div>
                            <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-[1.5rem] p-5 shadow-2xl">
                               <p className="text-white text-sm font-bold leading-relaxed italic">"{msg.data.bodyText}"</p>
                            </div>
                         </div>

                         <div className="bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
                           <p className="text-[8px] text-white font-black uppercase tracking-widest italic">{msg.data.tagline}</p>
                         </div>
                      </div>
                    </div>

                    <div className="flex justify-center lg:justify-start">
                      <Button 
                        onClick={() => handleDownload(idx)} 
                        disabled={isExporting}
                        className="h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl bg-primary hover:bg-primary/90"
                      >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Baixar Post 4K
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
               <Loader2 className="w-4 h-4 animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest">Processando sua visão...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      <div className="fixed bottom-0 w-full bg-background/80 backdrop-blur-md border-t p-4 z-[60]">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Peça mudanças: 'Fundo azul', 'Texto agressivo'..."
            className="flex-1 h-14 bg-muted/50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            disabled={isProcessing}
          />
          <Button 
            onClick={() => handleSendMessage()} 
            disabled={isProcessing || !inputValue.trim()}
            className="h-14 w-14 rounded-2xl shadow-lg"
          >
            {isProcessing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
        <div className="max-w-2xl mx-auto mt-2 px-2 hidden sm:flex items-center gap-2 text-muted-foreground opacity-40">
           <Zap className="w-3 h-3" />
           <p className="text-[8px] font-black uppercase tracking-widest">Experimente: "Estilo minimalista mármore" ou "Fundo neon cyberpunk".</p>
        </div>
      </div>
    </div>
  );
}
