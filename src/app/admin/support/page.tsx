
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

  if (authLoading || userDataLoading) {
    return <div className="flex h-screen items-center justify-center bg-muted/30"><Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" /></div>;
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
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
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
          {/* Support queue content... */}
        </div>
      </main>

      <footer className="py-12 border-t mt-auto text-center flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 relative w-[180px] h-[60px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Gray" fill className="object-contain dark:hidden opacity-30 grayscale" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Gray" fill className="object-contain hidden dark:block opacity-30 grayscale" priority />
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">© 2026 Proova - Suporte Operacional</p>
      </footer>
    </div>
  );
}
