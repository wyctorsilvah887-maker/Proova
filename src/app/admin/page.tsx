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
  Settings, Handshake, Save
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

  const isPremiumUser = useMemo(() => {
    const status = userData?.membershipStatus;
    return status === 'gold' || status === 'enterprise' || status === 'trial';
  }, [userData]);

  const [accessCode, setAccessCode] = useState('');
  const [isCodeCorrect, setIsCodeCorrect] = useState(false);
  
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminRegistering, setIsAdminRegistering] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

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

  const sortedLeads = useMemo(() => {
    if (!leadsList) return [];
    return [...leadsList].sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [leadsList]);

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === '2006') {
      setIsCodeCorrect(true);
      toast({ title: "Acesso Permitido", description: "Por favor, autentique-se." });
    } else {
      toast({ variant: "destructive", title: "Código Incorreto", description: "O código de acesso fornecido é inválido." });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      if (isAdminRegistering) {
        if (!name.trim()) throw new Error("O nome é obrigatório.");
        if (!companyName.trim()) throw new Error("O nome da empresa é obrigatório.");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        
        const slug = companyName.trim().toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');

        const adminData = {
          name: name.trim(),
          companyName: companyName.trim(),
          companySlug: slug,
          email: email.trim().toLowerCase(),
          isAdmin: true,
          testimonialsCount: 0,
          googleRedirectCount: 0,
          createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', newUser.uid), adminData);
        toast({ title: "Conta Admin Criada", description: "Configurando seu acesso..." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Bem-vindo", description: "Login administrativo realizado." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: error.message });
      setIsAuthLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${label} copiado com sucesso.` });
  };

  const handleOpenUserDetail = (uid: string) => {
    const matchedUser = leadsList?.find((u: any) => u.id === uid);
    if (matchedUser) {
      setSelectedUser(matchedUser);
      setNewPlanStatus(matchedUser.membershipStatus || 'base');
      setIsUserDetailOpen(true);
    } else {
      toast({ 
        variant: "destructive", 
        title: "Usuário não encontrado", 
        description: "Os dados deste usuário ainda não foram carregados ou o UID é inválido." 
      });
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
      // Update local state to reflect change without re-fetching everything
      setSelectedUser({ ...selectedUser, membershipStatus: newPlanStatus });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Atualizar",
        description: err.message
      });
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  if (authLoading || (user && userDataLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Sincronizando privilégios...</p>
        </div>
      </div>
    );
  }

  if (!isCodeCorrect && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-md shadow-xl border-t-4 border-primary">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Área Restrita</CardTitle>
            <CardDescription>Insira o código mestre para gerenciar os usuários.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="Código"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="text-center text-2xl tracking-[0.5em] w-full border rounded-md p-2 h-12 bg-background text-foreground"
                required
              />
              <Button type="submit" className="w-full h-12 text-lg">Desbloquear</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">
              {isAdminRegistering ? 'Criar Admin' : 'Login Admin'}
            </CardTitle>
            <CardDescription>
              {isAdminRegistering ? 'Cadastre seu perfil administrativo.' : 'Acesse o painel de controle.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {isAdminRegistering && (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Nome Completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Nome da Empresa"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="E-mail admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={isAuthLoading}>
                {isAuthLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                {isAdminRegistering ? 'Registrar' : 'Entrar'}
              </Button>
              <Button 
                type="button"
                variant="link" 
                className="w-full text-xs" 
                onClick={() => setIsAdminRegistering(!isAdminRegistering)}
              >
                {isAdminRegistering ? 'Já tem conta? Login' : 'Novo admin? Registrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userDataLoading && userData && !userData.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30 px-4 font-body">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardHeader>
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Sua conta não possui privilégios administrativos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => signOut(auth)} className="w-full">Sair e tentar outra conta</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 font-body text-foreground overflow-x-hidden flex flex-col">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 sticky top-0 z-10 shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center">
          <Link href="/dash" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px] transition-transform group-hover:scale-105">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain hidden dark:block" priority />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5 h-7">
            <BadgeCheck className="w-3 h-3" /> Admin
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 border border-primary/20">
                <User className="w-5 h-5 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground">Administrador</DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span>Painel de App</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Planos de Upgrade</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => {
                  if (!isPremiumUser) {
                    router.push('/pricing');
                    return;
                  }
                  router.push('/partners');
                }} 
                className={cn("rounded-xl cursor-pointer font-bold py-2.5", !isPremiumUser && "opacity-70")}
              >
                <Handshake className="mr-2 h-4 w-4 text-primary" />
                <span>Serviços de Parceiros</span>
                {!isPremiumUser && <Lock className="ml-auto w-3.5 h-3.5 opacity-60" />}
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="rounded-xl cursor-pointer font-bold py-2.5"
              >
                {theme === 'light' ? (
                  <Moon className="mr-2 h-4 w-4 text-primary" />
                ) : (
                  <Sun className="mr-2 h-4 w-4 text-primary" />
                )}
                <span>Alternar Tema</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="text-destructive focus:text-destructive rounded-xl cursor-pointer font-bold py-2.5">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-8 flex-1 max-w-7xl overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">Gestão Global</h1>
            <p className="text-muted-foreground text-sm">Controle central de usuários e métricas da plataforma.</p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2 border-primary/20 text-primary hover:bg-primary/5 h-12 rounded-xl font-bold transition-all shadow-sm"
            onClick={() => router.push('/admin/advanced')}
          >
            <Settings className="w-4 h-4" /> Administração Avançada
          </Button>
        </header>

        <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Usuários</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="text-2xl font-bold">{leadsList?.length || 0}</div>
              <p className="text-[10px] text-muted-foreground">Inscrições totais</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 md:px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Alertas</CardTitle>
              <CreditCard className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="text-2xl font-bold">{paymentEvents?.length || 0}</div>
              <p className="text-[10px] text-muted-foreground">Webhooks recebidos</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-4 bg-muted/50 p-1 rounded-xl h-11">
            <TabsTrigger value="leads" className="gap-2 rounded-lg text-xs font-bold"><Users className="w-3.5 h-3.5" /> Gestão de Contas</TabsTrigger>
            <TabsTrigger value="payments" className="gap-2 rounded-lg text-xs font-bold"><CreditCard className="w-3.5 h-3.5" /> Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-0">
            <Card className="shadow-sm border-none overflow-hidden rounded-2xl">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" /> Painel de Usuários
                </CardTitle>
                <CardDescription className="text-xs">Visualize e gerencie todos os clientes da plataforma. Clique em uma linha para detalhes.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                {leadsLoading ? (
                  <div className="py-20 text-center">
                    <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground text-xs">Carregando dados...</p>
                  </div>
                ) : leadsList && leadsList.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-[10px] uppercase font-black">Empresa / Nome</TableHead>
                        <TableHead className="text-[10px] uppercase font-black">Email / UID</TableHead>
                        <TableHead className="text-[10px] uppercase font-black">Plano Atual</TableHead>
                        <TableHead className="text-[10px] uppercase font-black">Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedLeads.map((usr: any) => (
                        <TableRow 
                          key={usr.id} 
                          className="hover:bg-muted/20 cursor-pointer transition-colors"
                          onClick={() => handleOpenUserDetail(usr.id)}
                        >
                          <TableCell className="font-bold">
                            <div className="flex flex-col min-w-[120px]">
                              <span className="text-xs">{usr.companyName}</span>
                              <span className="text-[10px] text-muted-foreground font-normal uppercase tracking-widest">{usr.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-[11px] min-w-[150px]">
                              <span className="font-medium text-primary">{usr.email}</span>
                              <span className="text-[9px] text-muted-foreground font-mono opacity-60">UID: {usr.id}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={usr.membershipStatus === 'enterprise' ? 'default' : (usr.membershipStatus === 'gold' ? 'secondary' : 'outline')} 
                              className="uppercase text-[8px] font-black h-5"
                            >
                              {usr.membershipStatus === 'enterprise' ? 'Enterprise' : (usr.membershipStatus === 'gold' ? 'Gold' : (usr.membershipStatus === 'trial' ? 'Trial' : (usr.membershipStatus === 'expired' ? 'Expirado' : 'Plano Base')))}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-[10px] whitespace-nowrap">
                            {usr.createdAt?.toDate ? usr.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed m-6 rounded-xl bg-muted/10">
                    <p className="text-muted-foreground text-sm">Nenhum usuário registrado ainda.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-0">
            <Card className="shadow-sm border-none overflow-hidden rounded-2xl">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" /> Auditoria de Pagamentos
                </CardTitle>
                <CardDescription className="text-xs">Logs recebidos via Webhook Cakto. Clique para ver o perfil do usuário.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                {eventsLoading ? (
                  <div className="py-20 text-center">
                    <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground text-xs">Sincronizando eventos...</p>
                  </div>
                ) : paymentEvents && paymentEvents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-[10px] uppercase font-black">Status / Evento</TableHead>
                        <TableHead className="text-[10px] uppercase font-black">Cliente / UID</TableHead>
                        <TableHead className="text-[10px] uppercase font-black">Produto</TableHead>
                        <TableHead className="text-[10px] uppercase font-black">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentEvents.map((evt: any) => (
                        <TableRow 
                          key={evt.id} 
                          className={cn(
                            "hover:bg-muted/20 transition-colors cursor-pointer",
                            evt.status === 'canceled' || evt.status === 'refunded' || evt.eventType?.includes('cancel') ? "bg-destructive/5" : ""
                          )}
                          onClick={() => handleOpenUserDetail(evt.externalId)}
                        >
                          <TableCell>
                            <div className="flex flex-col min-w-[100px]">
                              <Badge 
                                variant={
                                  evt.status === 'approved' || evt.status === 'paid' || evt.status === 'renewed' || evt.eventType?.includes('approve') 
                                    ? 'default' 
                                    : (evt.status === 'canceled' || evt.status === 'refunded' || evt.eventType?.includes('cancel') ? 'destructive' : 'outline')
                                } 
                                className="w-fit uppercase text-[8px] font-black h-5"
                              >
                                {evt.status}
                              </Badge>
                              <span className="text-[8px] text-muted-foreground font-mono mt-1 opacity-60 uppercase">{evt.eventType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-[11px] min-w-[150px]">
                              <span className="font-medium">{evt.customerEmail}</span>
                              <span className="text-[9px] text-muted-foreground font-mono opacity-60">ID: {evt.externalId}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[11px] font-bold whitespace-nowrap">{evt.productName}</TableCell>
                          <TableCell className="text-muted-foreground text-[10px] whitespace-nowrap">
                            {evt.createdAt?.toDate ? evt.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed m-6 rounded-xl bg-muted/10">
                    <p className="text-muted-foreground text-sm">Nenhum log de pagamento recebido.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="py-12 md:py-20 border-t flex flex-col items-center gap-10 mt-auto bg-background/50">
        <div className="flex items-center gap-2 relative w-[200px] h-[65px] md:w-[320px] md:h-[105px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="dark:hidden object-contain" />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="hidden dark:block object-contain" />
        </div>
        <div className="container px-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">© 2026 Proova - Gestão Segura</p>
        </div>
      </footer>

      {/* User Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsUserDetailOpen}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto">
          <SheetHeader className="pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <SheetTitle className="font-headline text-xl font-bold leading-tight">{selectedUser?.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-1.5 text-xs font-medium">
                  <Building2 className="w-3 h-3" /> {selectedUser?.companyName}
                </SheetDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge 
                variant={selectedUser?.membershipStatus === 'enterprise' ? 'default' : (selectedUser?.membershipStatus === 'gold' ? 'secondary' : 'outline')} 
                className="uppercase text-[8px] font-black h-5"
              >
                {selectedUser?.membershipStatus === 'enterprise' ? 'Enterprise' : (selectedUser?.membershipStatus === 'gold' ? 'Gold' : (selectedUser?.membershipStatus === 'trial' ? 'Trial' : (selectedUser?.membershipStatus === 'expired' ? 'Expirado' : 'Plano Base')))}
              </Badge>
              {selectedUser?.isAdmin && <Badge variant="secondary" className="uppercase text-[8px] font-black h-5">Administrador</Badge>}
            </div>
          </SheetHeader>

          <div className="space-y-8">
            {/* Membeship Management Section */}
            <section className="space-y-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Gem className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">Gestão de Plano</h3>
              </div>
              
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status da Assinatura</Label>
                <div className="flex gap-2">
                  <Select value={newPlanStatus} onValueChange={setNewPlanStatus}>
                    <SelectTrigger className="h-11 bg-background">
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Plano Base (Grátis)</SelectItem>
                      <SelectItem value="gold">Membro Gold</SelectItem>
                      <SelectItem value="enterprise">Membro Enterprise</SelectItem>
                      <SelectItem value="trial">Período Trial (14d)</SelectItem>
                      <SelectItem value="expired">Assinatura Expirada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    className="h-11 px-4 gap-2 font-bold shadow-md" 
                    onClick={handleUpdatePlan}
                    disabled={isUpdatingPlan || newPlanStatus === (selectedUser?.membershipStatus || 'base')}
                  >
                    {isUpdatingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar
                  </Button>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">E-mail do Usuário</Label>
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-xl border group hover:border-primary/30 transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
                  <span className="text-xs font-medium truncate flex-1">{selectedUser?.email}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                    onClick={() => copyToClipboard(selectedUser?.email, "E-mail")}
                    title="Copiar e-mail"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ID do Firebase (UID)</Label>
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-xl border group hover:border-primary/30 transition-colors">
                  <Hash className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
                  <span className="text-[10px] font-mono opacity-70 truncate flex-1">{selectedUser?.id}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                    onClick={() => copyToClipboard(selectedUser?.id, "UID")}
                    title="Copiar UID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">URL Slug</Label>
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-xl border group hover:border-primary/30 transition-colors">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0 ml-1"
                    onClick={() => window.open(`/c/${selectedUser?.companySlug}`, '_blank')}
                    title="Abrir página de coleta"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <span className="text-[10px] font-mono opacity-70 truncate flex-1">/c/{selectedUser?.companySlug}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                    onClick={() => copyToClipboard(selectedUser?.companySlug, "Slug")}
                    title="Copiar slug"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </section>

            <Separator />

            <section className="grid grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-between">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Reviews</span>
                </div>
                <div className="text-2xl font-black">{selectedUser?.testimonialsCount || 0}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Depoimentos totais</p>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-between">
                  <MousePointer2 className="w-4 h-4 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">G-Clicks</span>
                </div>
                <div className="text-2xl font-black">{selectedUser?.googleRedirectCount || 0}</div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Cliques no Maps</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Registrado em: {selectedUser?.createdAt?.toDate ? selectedUser.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              {selectedUser?.trialStartedAt && (
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Trial iniciado: {selectedUser.trialStartedAt.toDate ? selectedUser.trialStartedAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
              )}
            </section>

            <div className="pt-6">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl font-bold gap-2 border-primary/20 text-primary hover:bg-primary/5"
                onClick={() => setIsUserDetailOpen(false)}
              >
                Fechar Detalhes
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
