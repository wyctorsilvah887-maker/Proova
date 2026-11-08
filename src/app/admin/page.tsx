
'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { 
  Shield, LogOut, Users, UserCheck, Lock, Mail, User, 
  BadgeCheck, Loader2, Building2, Eye, EyeOff, Sun, Moon, 
  TrendingUp, CreditCard, AlertCircle, Copy, Hash, Calendar,
  BarChart3, MousePointer2, ExternalLink, Gem, ArrowLeft,
  Settings, Handshake, Save, CheckCircle2, CircleDashed, Rocket,
  MousePointer, Headphones, Ticket
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, doc, setDoc, serverTimestamp, where, orderBy, limit, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { theme, setTheme } = useTheme();
  
  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);
  
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailOpen, setIsUserDetailOpen] = useState(false);
  const [newPlanStatus, setNewPlanStatus] = useState<string>('');
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  useEffect(() => {
    if (userData?.isAdmin === true) {
      const timer = setTimeout(() => setIsAdminVerified(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsAdminVerified(false);
    }
  }, [userData]);

  const leadsQuery = useMemo(() => {
    if (!db || !user || !isAdminVerified) return null;
    return query(
      collection(db, 'users'), 
      where('isAdmin', '==', false)
    );
  }, [db, user, isAdminVerified]);

  const { data: leadsList, loading: leadsLoading } = useCollection(leadsQuery);

  const paymentEventsQuery = useMemo(() => {
    if (!db || !user || !isAdminVerified) return null;
    return query(
      collection(db, 'payment_events'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [db, user, isAdminVerified]);

  const { data: paymentEvents, loading: eventsLoading } = useCollection(paymentEventsQuery);

  const ticketsQuery = useMemo(() => {
    if (!db || !isAdminVerified) return null;
    return collection(db, 'support_tickets');
  }, [db, isAdminVerified]);
  const { data: ticketsList } = useCollection(ticketsQuery);

  const setupMetrics = useMemo(() => {
    if (!leadsList) return { completed: 0, percentage: 0 };
    
    const completedCount = leadsList.filter((usr: any) => {
      const isLocationDone = !!usr.city;
      const isTestimonialDone = (usr.testimonialsCount || 0) > 0;
      const isDigital = usr.businessType === 'agencia' || usr.businessType === 'servicos_digitais';
      const isGoogleDone = isDigital ? true : !!usr.googleMapsUrl;
      
      return isLocationDone && isTestimonialDone && isGoogleDone;
    }).length;

    const percentage = leadsList.length > 0 ? Math.round((completedCount / leadsList.length) * 100) : 0;
    
    return { completed: completedCount, percentage };
  }, [leadsList]);

  const sortedLeads = useMemo(() => {
    if (!leadsList) return [];
    return [...leadsList].sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [leadsList]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    // Auth logic...
  };

  const handleOpenUserDetail = (uid: string) => {
    const matchedUser = leadsList?.find((u: any) => u.id === uid);
    if (matchedUser) {
      setSelectedUser(matchedUser);
      setNewPlanStatus(matchedUser.membershipStatus || 'base');
      setIsUserDetailOpen(true);
    }
  };

  const handleUpdatePlan = async () => {
    if (!db || !selectedUser || !newPlanStatus || isUpdatingPlan) return;
    
    setIsUpdatingPlan(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        membershipStatus: newPlanStatus
      });
      toast({
        title: "Plano Atualizado",
        description: `O status do usuário foi alterado para ${newPlanStatus.toUpperCase()}.`
      });
      setSelectedUser({ ...selectedUser, membershipStatus: newPlanStatus });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao Atualizar", description: err.message });
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  if (authLoading || (user && userDataLoading)) {
    return <div className="flex h-screen items-center justify-center bg-muted/30"><Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" /></div>;
  }

  if (!user || (userData && !userData.isAdmin)) {
    return <div className="flex h-screen items-center justify-center bg-muted/30 px-4 font-body"><Card className="w-full max-w-md shadow-xl text-center"><CardHeader><Shield className="w-12 h-12 text-destructive mx-auto mb-4" /><CardTitle>Acesso Negado</CardTitle></CardHeader><CardContent><Button onClick={() => router.push('/dash')} className="w-full">Voltar</Button></CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 font-body text-foreground overflow-x-hidden flex flex-col">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center">
          <Link href="/dash" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px] transition-transform group-hover:scale-105">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5 h-7"><BadgeCheck className="w-3 h-3" /> Admin</Badge>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => signOut(auth)}><LogOut className="w-5 h-5 text-destructive" /></Button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-8 flex-1 max-w-7xl overflow-x-hidden pt-24 md:pt-32">
        <div className="flex flex-col gap-4">
          <Link href="/dash">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary transition-colors h-8 px-0 font-bold uppercase tracking-widest text-[10px]">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
            </Button>
          </Link>
          {/* Main admin content... */}
        </div>
      </main>
      
      <footer className="py-12 md:py-20 border-t flex flex-col items-center gap-10 mt-auto bg-background/50">
        <div className="flex items-center gap-2 relative w-[200px] h-[65px] md:w-[320px] md:h-[105px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="dark:hidden object-contain" />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="hidden dark:block object-contain" />
        </div>
        <div className="container px-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">© 2026 Proova - Gestão Segura</p>
        </div>
      </footer>

      {/* User Detail Sheet... */}
    </div>
  );
}
