
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
  RefreshCcw,
  Terminal,
  Cpu,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Fingerprint
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

interface ChatLog {
  type: 'user' | 'advisor' | 'error';
  content: string;
  data?: OptimizeCardOutput;
  note?: string;
  insights?: string[];
}

export default function SocialCardAIPage({ params }: { params: Promise<{ testimonialId: string }> }) {
  const { testimonialId } = use(params);
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const testimonialRef = useMemo(() => (db && user ? doc(db, 'users', user.uid, 'testimonials', testimonialId) : null), [db, user, testimonialId]);
  const { data: testimonialData, loading: testimonialLoading } = useDoc(testimonialRef);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isLoading]);

  useEffect(() => {
    if (logs.length === 0) {
      setLogs([
        { 
          type: 'advisor', 
          content: 'SISTEMA INICIALIZADO. Aguardando entrada de dados para processamento de design de elite. Digite /start ou descreva o visual desejado.',
          note: 'LINK_ESTÁVEL_V5.5'
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

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading || !testimonialData || !user) return;

    const userQuery = query.trim();
    setQuery('');
    setLogs(prev => [...prev, { type: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const isInitial = userQuery.toLowerCase() === '/start';
      
      const result = await optimizeCard({
        text: testimonialData.text,
        userName: testimonialData.userName,
        rating: testimonialData.rating,
        businessType: userData?.businessType || 'Geral',
        userInstruction: isInitial ? "Create a standard luxury design" : userQuery
      });

      setLogs(prev => [
        ...prev,
        { 
          type: 'advisor', 
          content: isInitial 
            ? 'Design inicial gerado com sucesso. Protocolo de autoridade aplicado.' 
            : 'Instrução processada. Nova variação visual materializada.',
          data: result,
          note: `GEN_ID_${Math.random().toString(36).substring(7).toUpperCase()}`,
          insights: [
            `Tipografia: ${result.headline}`,
            `Visual: ${result.visualConcept.substring(0, 40)}...`,
            `Status: Renderização 4K Concluída`
          ]
        }
      ]);

      if (testimonialRef) {
        updateDoc(testimonialRef, { lastAiGenerationAt: serverTimestamp() });
      }

    } catch (err: any) {
      setLogs(prev => [...prev, { type: 'error', content: 'Protocolo de comunicação interrompido. Verifique sua conexão com a IA.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || testimonialLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    );
  }

  const themeColor = 'text-primary';

  return (
    <div className="min-h-screen bg-black flex flex-col font-body text-foreground h-screen overflow-hidden">
      {/* Header Minimalista Estilo Terminal */}
      <header className="bg-zinc-950 border-b border-zinc-900 h-20 flex items-center px-4 md:px-8 fixed top-0 w-full z-[60] shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/social-cards">
            <Button variant="ghost" size="icon" className="rounded-full text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 border-l border-zinc-800 pl-4">
            <Terminal className={cn("w-5 h-5", themeColor)} />
            <div>
              <h2 className="text-sm font-black uppercase tracking-tighter text-white">Black Advisor Studio</h2>
              <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-bold">Consultoria de Design de Elite</p>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Sistema Online</span>
           </div>
           <ThemeToggle className="bg-transparent border-zinc-800" />
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 mt-20 overflow-hidden flex flex-col max-w-5xl mx-auto w-full px-4 pt-8">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-12 pr-4 custom-scrollbar pb-40 scrollbar-hide"
        >
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20">
              <Cpu className="w-16 h-16" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] max-w-xs">
                Aguardando entrada de dados para processamento de elite.
              </p>
            </div>
          )}

          {logs.map((log, i) => (
            <div 
              key={i} 
              className={cn(
                "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500",
                log.type === 'user' ? 'items-end' : 'items-start'
              )}
            >
              {log.type === 'user' ? (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] max-w-md shadow-lg">
                  <p className="text-xs font-bold uppercase tracking-tight text-white">{log.content}</p>
                </div>
              ) : log.type === 'advisor' ? (
                <div className="space-y-6 w-full max-w-2xl">
                  <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem] shadow-2xl relative">
                    <div className="absolute -top-3 -left-3 bg-black border border-zinc-800 p-2 rounded-xl">
                      <ShieldCheck className={cn("w-4 h-4", themeColor)} />
                    </div>
                    
                    <p className="text-sm font-medium leading-relaxed text-zinc-300 italic">
                      {log.content}
                    </p>

                    {log.data && (
                      <div className="mt-8 space-y-6 animate-in zoom-in duration-700">
                        <div 
                          ref={el => { cardRefs.current[i] = el; }}
                          className="aspect-square w-full max-w-[380px] rounded-[2.5rem] shadow-2xl overflow-hidden relative border-8 border-zinc-900 bg-black mx-auto lg:mx-0"
                          style={{ 
                            backgroundImage: log.data.backgroundImageUri ? `url(${log.data.backgroundImageUri})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: '#000'
                          }}
                        >
                          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                          <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-8 text-center">
                             <h2 className="text-white font-black text-2xl tracking-tighter drop-shadow-2xl uppercase">
                               {log.data.author}
                             </h2>
                             
                             <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                                <div className="flex justify-center gap-1.5">
                                  {Array.from({ length: testimonialData?.rating || 5 }).map((_, i) => (
                                    <Star key={i} className="w-7 h-7 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                                  ))}
                                </div>
                                <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-[1.5rem] p-5 shadow-2xl">
                                   <p className="text-white text-sm font-bold leading-relaxed italic">"{log.data.bodyText}"</p>
                                </div>
                             </div>

                             <div className="bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
                               <p className="text-[8px] text-white font-black uppercase tracking-widest italic">{log.data.tagline}</p>
                             </div>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleDownload(i)} 
                          disabled={isExporting}
                          className="h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl bg-primary hover:bg-primary/90"
                        >
                          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Baixar Post 4K
                        </Button>
                      </div>
                    )}
                    
                    {log.insights && log.insights.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-zinc-900 space-y-4">
                         <p className={cn("text-[9px] font-black uppercase tracking-widest", themeColor)}>Metadados Acionáveis</p>
                         <ul className="space-y-3">
                           {log.insights.map((insight, idx) => (
                             <li key={idx} className="flex items-start gap-3 text-[11px] text-zinc-500 font-bold uppercase">
                               <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                               {insight}
                             </li>
                           ))}
                         </ul>
                      </div>
                    )}
                  </div>
                  <p className="text-[8px] text-zinc-800 font-black uppercase tracking-[0.4em] ml-4">
                    DOC: {log.note}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-red-900 text-[10px] font-black uppercase tracking-widest bg-red-950/20 p-5 rounded-[2rem] border border-red-900/30 max-w-md">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p>{log.content}</p>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 ml-4 animate-pulse">
              <Loader2 className={cn("w-4 h-4 animate-spin", themeColor)} />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700">Processando Linhagem Criativa...</span>
            </div>
          )}
        </div>
      </main>

      {/* Input de Comando Estilo Black Advisor */}
      <div className="fixed bottom-0 w-full bg-black/80 backdrop-blur-md p-6 z-[70]">
        <form onSubmit={handleConsult} className="max-w-4xl mx-auto relative">
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SOLICITAR CONSULTORIA TÉCNICA DE DESIGN..."
            disabled={isLoading}
            className="w-full bg-zinc-950/50 border border-zinc-800 h-20 rounded-[2rem] px-8 text-sm font-black uppercase tracking-tight text-white focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all pr-32 placeholder:text-zinc-700"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !query.trim()}
            className="absolute right-4 top-[0.6rem] h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            {isLoading ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
          </Button>
          <div className="mt-3 px-8 hidden sm:flex items-center gap-2 text-zinc-800">
             <Fingerprint className="w-3 h-3" />
             <p className="text-[8px] font-black uppercase tracking-[0.4em]">Autenticação Biométrica Ativa | Terminal Criptografado</p>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

async function getCroppedImg(imageSrc: string, pixelCrop: any, type: string): Promise<Blob> {
  const image = new (window as any).Image(); image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));
  const canvas = document.createElement('canvas'); canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error();
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9));
}
