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
import { askBlackAdvisor, type AdvisoryOutput } from '@/ai/flows/optimize-card-flow';
import { toast } from '@/hooks/use-toast';

interface ChatLog {
  type: 'user' | 'advisor' | 'error';
  content: string;
  data?: AdvisoryOutput;
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
  
  const scrollRef = useRef<HTMLDivElement>(null);

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
          content: 'SISTEMA INICIALIZADO. Terminal Black Advisor pronto para consultoria técnica de alto nível. Identifique-se ou envie sua consulta.',
          note: 'HB-PRT-2026-INIT'
        }
      ]);
    }
  }, []);

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading || !testimonialData || !user) return;

    const userQuery = query.trim();
    setQuery('');
    setLogs(prev => [...prev, { type: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const result = await askBlackAdvisor({
        query: userQuery,
        memberRank: userData?.membershipStatus?.toUpperCase() || 'BASE'
      });

      setLogs(prev => [
        ...prev,
        { 
          type: 'advisor', 
          content: result.response,
          data: result,
          note: result.confidentialityNote,
          insights: result.actionableInsights
        }
      ]);

      if (testimonialRef) {
        updateDoc(testimonialRef, { lastAiConsultationAt: serverTimestamp() });
      }

    } catch (err: any) {
      setLogs(prev => [...prev, { type: 'error', content: 'Protocolo de comunicação interrompido. Verifique o link neural.' }]);
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
      {/* Header Terminal Style */}
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
              <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-bold">Consultoria de Protocolo Hall Black</p>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
           <Badge variant="outline" className="hidden sm:flex h-6 text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">
             Link de Dados: Estável
           </Badge>
           <ThemeToggle className="bg-transparent border-zinc-800" />
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 mt-20 overflow-hidden flex flex-col max-w-5xl mx-auto w-full px-4 pt-8">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-12 pr-4 custom-scrollbar pb-40 scrollbar-hide"
        >
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
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700">Processando Protocolo de Elite...</span>
            </div>
          )}
        </div>
      </main>

      {/* Input Terminal */}
      <div className="fixed bottom-0 w-full bg-black/80 backdrop-blur-md p-6 z-[70]">
        <form onSubmit={handleConsult} className="max-w-4xl mx-auto relative">
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SOLICITAR CONSULTORIA TÉCNICA AO ADVISOR..."
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
             <p className="text-[8px] font-black uppercase tracking-[0.4em]">Autenticação Ativa | Terminal Hall Black Criptografado</p>
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
