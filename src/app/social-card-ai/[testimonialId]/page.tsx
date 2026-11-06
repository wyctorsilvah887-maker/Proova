'use client';

import { useState, useMemo, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Send, 
  MessageCircle, 
  User, 
  Bot, 
  Fingerprint, 
  Zap, 
  Download,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Star
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
  const [inputValue, setInputValue] = useState('/start');
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
          content: 'Olá! Sou seu Diretor de Arte Proova. Estou pronto para criar designs de elite. Envie **/start** para a primeira versão ou escreva como deseja o seu card (ex: "fundo azul", "estilo minimalista").' 
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
      link.download = `proova-ai-design-${testimonialId}-${index}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Arte Baixada!", description: "Seu card 4K está pronto para o Instagram." });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro no download" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing || !testimonialData || !user || !db) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');

    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'assistant', content: 'Processando nova variação criativa...' }]);

    try {
      const isInitial = userMessage.toLowerCase() === '/start';
      
      const result = await optimizeCard({
        text: testimonialData.text,
        userName: testimonialData.userName,
        rating: testimonialData.rating,
        businessType: userData?.businessType || 'Serviços',
        userInstruction: isInitial ? undefined : userMessage // Passa a instrução se não for o comando inicial
      });

      // Atualizar timestamp no Firestore (apenas para registro interno, sem trava)
      await updateDoc(testimonialRef!, {
        lastAiGenerationAt: serverTimestamp()
      });

      setMessages(prev => [
        ...prev.slice(0, -1), // Remove a mensagem de status
        { 
          role: 'assistant', 
          content: isInitial 
            ? 'Aqui está sua arte inicial gerada por inteligência artificial. Se desejar mudar algo, basta me escrever!' 
            : 'Entendido! Apliquei suas instruções e gerei esta nova versão.',
          type: 'card',
          data: result
        }
      ]);

    } catch (err: any) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Ops, tive um problema técnico ao processar sua arte. Tente novamente em alguns minutos.' }
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
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-hidden h-screen">
      <header className="bg-background border-b h-20 md:h-24 flex items-center px-4 md:px-8 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-4">
          <Link href="/social-cards">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
               <h2 className="text-sm font-black uppercase tracking-tight truncate">Social Card AI Studio</h2>
               <p className="text-[10px] text-muted-foreground font-bold uppercase truncate max-w-[150px]">Cliente: {testimonialData?.userName}</p>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
           <Badge variant="outline" className="hidden sm:flex h-6 text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">
             Motor: Proova Engine v5.0
           </Badge>
           <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 mt-20 md:mt-24 overflow-y-auto p-4 md:p-8 flex justify-center scrollbar-hide pb-32">
        <div className="w-full max-w-3xl space-y-8">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn(
              "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
              msg.role === 'user' ? "flex-row-reverse" : ""
            )}>
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform hover:scale-110",
                msg.role === 'assistant' ? "bg-primary text-white" : "bg-zinc-800 text-white"
              )}>
                {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              
              <div className="space-y-4 max-w-[85%]">
                <Card className={cn(
                  "border-none shadow-md rounded-[1.5rem] overflow-hidden",
                  msg.role === 'assistant' ? "bg-background" : "bg-primary text-white"
                )}>
                  <CardContent className="p-4 md:p-6">
                    <p className="text-sm md:text-base font-medium leading-relaxed">{msg.content}</p>
                  </CardContent>
                </Card>

                {msg.type === 'card' && msg.data && (
                  <div className="space-y-4 animate-in zoom-in duration-700 delay-300">
                    <div 
                      ref={el => { cardRefs.current[idx] = el; }}
                      className="aspect-square w-full max-w-[400px] rounded-[2.5rem] shadow-2xl overflow-hidden relative border-8 border-background bg-black mx-auto md:mx-0"
                      style={{ 
                        backgroundImage: `url(${msg.data.backgroundImageUri})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-8 text-center">
                         <h2 className="text-white font-black text-2xl tracking-tighter drop-shadow-2xl">{msg.data.author}</h2>
                         
                         <div className="flex-1 flex flex-col justify-center items-center space-y-4">
                            <div className="flex justify-center gap-1">
                              {Array.from({ length: testimonialData?.rating || 5 }).map((_, i) => (
                                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400 drop-shadow-lg" />
                              ))}
                            </div>
                            <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-[1.5rem] p-5 shadow-2xl">
                               <p className="text-white text-sm font-bold leading-relaxed">"{msg.data.bodyText}"</p>
                            </div>
                         </div>

                         <div className="bg-white/10 px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
                           <p className="text-[8px] text-white font-black uppercase tracking-widest italic">{msg.data.tagline}</p>
                         </div>
                      </div>
                    </div>

                    <div className="flex justify-center md:justify-start">
                      <Button 
                        onClick={() => handleDownload(idx)} 
                        disabled={isExporting}
                        className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl bg-primary hover:bg-primary/90 text-white"
                      >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Baixar Variação 4K
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </main>

      <div className="fixed bottom-0 w-full bg-background/80 backdrop-blur-md border-t p-4 md:p-6 z-[60]">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative group">
             <input 
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
               placeholder="Peça para mudar cor, estilo ou texto..."
               className="w-full h-14 bg-muted/50 border-none rounded-2xl px-6 text-sm font-bold pr-14 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
             />
             <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button 
                  size="icon" 
                  onClick={handleSendMessage} 
                  disabled={isProcessing || !inputValue.trim()}
                  className="h-10 w-10 rounded-xl shadow-lg"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
             </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-2 px-2 flex items-center gap-2 text-muted-foreground opacity-50">
           <Zap className="w-3 h-3 text-primary" />
           <p className="text-[8px] font-black uppercase tracking-widest">Estúdio Livre: Gere variações ilimitadas através da conversa.</p>
        </div>
      </div>
    </div>
  );
}
