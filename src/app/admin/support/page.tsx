'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { 
  Shield, ArrowLeft, Loader2, Headphones, User, Clock, 
  Trash2, CheckCircle2, Ticket, ExternalLink, BadgeCheck,
  Search, Filter, MessageSquare
} from 'lucide-react';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { collection, query, doc, deleteDoc, orderBy, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LoadingScreen } from '@/components/loading-screen';

export default function AdminSupportPage() {
  const db = useFirestore();
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  
  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const [searchTerm, setSearchTerm] = useState('');

  const ticketsQuery = useMemo(() => {
    if (!db || !user || !userData?.isAdmin) return null;
    return query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
  }, [db, user, userData]);

  const { data: ticketsList, loading: ticketsLoading } = useCollection(ticketsQuery);

  const filteredTickets = useMemo(() => {
    if (!ticketsList) return [];
    if (!searchTerm.trim()) return ticketsList;
    const term = searchTerm.toLowerCase();
    return ticketsList.filter((t: any) => 
      t.userName?.toLowerCase().includes(term) || 
      t.userId?.toLowerCase().includes(term)
    );
  }, [ticketsList, searchTerm]);

  if (authLoading || userDataLoading) {
    return <LoadingScreen />;
  }

  if (!userData?.isAdmin) {
    return <div className="flex h-screen items-center justify-center bg-muted/30 px-4"><Card className="w-full max-w-md text-center shadow-xl"><CardHeader><Shield className="w-12 h-12 text-destructive mx-auto mb-4" /><CardTitle>Acesso Negado</CardTitle></CardHeader><CardContent><Button onClick={() => router.push('/dash')} className="w-full">Voltar</Button></CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 font-body text-foreground flex flex-col">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 sticky top-0 z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center">
          <Link href="/admin" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px] transition-transform group-hover:scale-105">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-dark-mode.gif" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5 h-7 font-black text-[10px] uppercase tracking-widest bg-primary/10 text-primary border-none">
            <Shield className="w-3 h-3" /> Root Support Admin
          </Badge>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-8 flex-1 max-w-6xl pt-10">
        <div className="flex flex-col gap-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary transition-colors h-8 px-0 font-bold uppercase tracking-widest text-[10px]">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel Admin
            </Button>
          </Link>

          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Headphones className="w-6 h-6" />
                </div>
                Fila de Atendimento
              </h1>
              <p className="text-muted-foreground text-sm font-medium">Gerencie tickets ativos e preste suporte estratégico em tempo real.</p>
            </div>

            <div className="relative w-full md:w-80 group">
               <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
               <Input 
                 placeholder="Buscar por nome ou ID..." 
                 value={searchTerm} 
                 onChange={(e) => setSearchTerm(e.target.value)} 
                 className="h-10 pl-10 rounded-xl bg-background border-primary/10 focus:ring-primary/20 text-xs"
               />
            </div>
          </header>

          {ticketsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="animate-spin h-10 w-10 text-primary/30" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Acessando Banco de Dados...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-[2.5rem] opacity-30 bg-muted/20">
               <Ticket className="w-12 h-12 mb-4" />
               <p className="text-xs font-bold uppercase tracking-widest">Nenhum ticket pendente no momento</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTickets.map((ticket: any) => (
                <Card 
                  key={ticket.id} 
                  className={cn(
                    "rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group active:scale-[0.98] relative overflow-hidden",
                    ticket.isSupportInChat && "bg-green-500/5 ring-1 ring-green-500/20"
                  )}
                  onClick={() => router.push(`/admin/support/${ticket.userId}`)}
                >
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-start justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                             <User className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black uppercase tracking-tight truncate max-w-[150px]">{ticket.userName}</p>
                             <div className="flex items-center gap-1.5">
                                <Badge variant="secondary" className="text-[8px] font-black uppercase h-4 px-1 text-primary">{ticket.membershipStatus}</Badge>
                                {ticket.isSupportInChat && <span className="text-[7px] font-black uppercase text-green-600 animate-pulse">Consultor Online</span>}
                             </div>
                          </div>
                       </div>
                       <div className="flex flex-col items-end">
                          <div className={cn("h-2 w-2 rounded-full", ticket.isSupportInChat ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500")} />
                       </div>
                    </div>

                    <div className="space-y-1 opacity-60">
                       <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          <span>Aberto em {ticket.createdAt?.toDate?.().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                       <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                          <Ticket className="w-3 h-3" />
                          <span className="truncate">ID: {ticket.id}</span>
                       </div>
                    </div>

                    <Button className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[9px] gap-2 bg-foreground text-background hover:opacity-90">
                       <MessageSquare className="w-3.5 h-3.5" /> Assumir Chat
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 border-t mt-auto text-center flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 relative w-[180px] h-[60px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Gray" fill className="object-contain dark:hidden opacity-30 grayscale" priority unoptimized />
          <Image src="/logo-proova-dark-mode.gif" alt="Logo Gray" fill className="object-contain hidden dark:block opacity-30 grayscale" priority unoptimized />
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">© 2026 Proova - Suporte Operacional</p>
      </footer>
    </div>
  );
}
