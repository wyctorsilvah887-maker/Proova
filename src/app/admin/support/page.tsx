
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
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

  const handleResolveTicket = async (ticket: any) => {
    if (!db) return;
    try {
      const batch = writeBatch(db);
      
      // 1. Remover o ticket da fila
      batch.delete(doc(db, 'support_tickets', ticket.id));
      
      // 2. Enviar mensagem de encerramento para o usuário
      const messagesRef = collection(db, 'users', ticket.userId, 'support_messages');
      batch.set(doc(messagesRef), {
        text: "O atendimento humano foi concluído com sucesso. ✅\nO **Consultor Proova** foi reativado para te auxiliar. Como posso ajudar?",
        sender: 'support',
        createdAt: serverTimestamp(),
        isSystem: true
      });

      await batch.commit();
      toast({ title: "Ticket Resolvido", description: "O atendimento foi removido da fila e o bot reativado." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao resolver" });
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'support_tickets', id));
      toast({ title: "Removido", description: "O ticket foi excluído sem notificação." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao remover" });
    }
  };

  if (authLoading || userDataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
      </div>
    );
  }

  if (!userData?.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Esta área é reservada para administradores.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dash')} className="w-full">Voltar ao Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 font-body text-foreground flex flex-col">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 sticky top-0 z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center">
          <Link href="/admin" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px] transition-transform group-hover:scale-105">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain hidden dark:block" priority />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5 h-7">
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
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
                <Headphones className="w-8 h-8 text-primary" /> Fila de Atendimento
              </h1>
              <p className="text-muted-foreground text-sm">Gerencie as solicitações de suporte humanizado dos membros.</p>
            </div>
            
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input 
                placeholder="Buscar por nome ou UID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </header>
        </div>

        <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card">
          <CardHeader className="bg-muted/10 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" /> Solicitações Ativas
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-black h-5">{filteredTickets.length} PENDENTES</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {ticketsLoading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></div>
            ) : filteredTickets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="text-[10px] uppercase font-black">Usuário / Plano</TableHead>
                    <TableHead className="text-[10px] uppercase font-black">Status / Presença</TableHead>
                    <TableHead className="text-[10px] uppercase font-black">Abertura</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket: any) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/10 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs truncate">{ticket.userName}</span>
                            <Badge 
                              variant={ticket.membershipStatus === 'enterprise' ? 'default' : (ticket.membershipStatus === 'gold' ? 'secondary' : 'outline')} 
                              className={cn(
                                "w-fit uppercase text-[7px] font-black h-4 px-1.5 mt-0.5",
                                ticket.membershipStatus === 'enterprise' && "animate-pulse bg-primary"
                              )}
                            >
                              {ticket.membershipStatus}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <div className={cn("h-2.5 w-2.5 rounded-full", ticket.isSupportInChat ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                           <span className="text-[10px] font-bold uppercase tracking-tight">
                             {ticket.isSupportInChat ? "Suporte no Chat" : "Aguardando Resposta"}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {ticket.createdAt?.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {ticket.createdAt?.toDate?.().toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-xl text-primary hover:bg-primary/10"
                            onClick={() => router.push(`/admin/support/${ticket.userId}`)}
                            title="Entrar no Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-xl text-green-600 hover:bg-green-50"
                            onClick={() => handleResolveTicket(ticket)}
                            title="Marcar como Resolvido"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-24 text-center border-2 border-dashed m-6 rounded-3xl bg-muted/5">
                <Ticket className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-bold text-sm">Fila de espera vazia.</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mt-1">Nenhum ticket em aberto no momento.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="py-12 border-t mt-auto text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">© 2026 Proova - Suporte Operacional</p>
      </footer>
    </div>
  );
}
