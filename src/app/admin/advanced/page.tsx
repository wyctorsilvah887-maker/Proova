'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  Shield, LogOut, ArrowLeft, Loader2, Megaphone, Plus, Trash2, 
  CheckCircle2, AlertCircle, Info, Bell, Save, ChevronDown
} from 'lucide-react';
import { useAuth, useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, doc, setDoc, serverTimestamp, deleteDoc, addDoc, orderBy, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/loading-screen';

export default function AdvancedAdminPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { theme, setTheme } = useTheme();
  
  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const announcementsQuery = useMemo(() => {
    if (!db || !userData?.isAdmin) return null;
    return query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
  }, [db, userData]);

  const { data: announcements, loading: announcementsLoading } = useCollection(announcementsQuery);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !userData?.isAdmin || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        message: message.trim(),
        type,
        isActive,
        createdAt: serverTimestamp(),
        createdBy: user?.uid
      });
      toast({ title: "Aviso Publicado", description: "Todos os usuários verão esta mensagem no Dashboard." });
      setTitle('');
      setMessage('');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao publicar", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'announcements', id), { isActive: !currentStatus });
      toast({ title: "Status Atualizado" });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro na atualização" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm('Deseja excluir permanentemente este aviso?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      toast({ title: "Aviso Removido" });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro na exclusão" });
    }
  };

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
            <Shield className="w-3 h-3" /> Root Admin
          </Badge>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-8 flex-1 max-w-5xl">
        <div className="flex flex-col gap-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary transition-colors h-8 px-0 font-bold uppercase tracking-widest text-[10px]">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel Admin
            </Button>
          </Link>
          <header className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">Gestão de Avisos</h1>
            <p className="text-muted-foreground text-sm font-medium">Crie notificações globais para todos os usuários da plataforma.</p>
          </header>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
               <div className="h-1.5 bg-primary w-full" />
               <CardHeader>
                  <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Novo Comunicado</CardTitle>
               </CardHeader>
               <CardContent>
                  <form onSubmit={handleCreateAnnouncement} className="space-y-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1">Título</Label>
                        <Input placeholder="Ex: Manutenção Programada" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-12 rounded-xl" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1">Mensagem</Label>
                        <Textarea placeholder="Descreva o aviso aqui..." value={message} onChange={(e) => setMessage(e.target.value)} required className="min-h-[120px] rounded-xl" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase ml-1">Tipo</Label>
                           <Select value={type} onValueChange={setType}>
                              <SelectTrigger className="h-12 rounded-xl">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="info">Informação (Azul)</SelectItem>
                                 <SelectItem value="warning">Alerta (Laranja)</SelectItem>
                                 <SelectItem value="success">Sucesso (Verde)</SelectItem>
                                 <SelectItem value="destructive">Urgente (Vermelho)</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="flex flex-col justify-center items-center gap-2">
                           <Label className="text-[10px] font-black uppercase">Ativo</Label>
                           <Switch checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                     </div>
                     <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />} Publicar Agora
                     </Button>
                  </form>
               </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <Megaphone className="w-4 h-4 text-primary" />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Histórico de Avisos</h2>
             </div>
             {announcementsLoading ? (
               <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary/30" /></div>
             ) : announcements?.length === 0 ? (
               <div className="p-12 text-center border-2 border-dashed rounded-[2rem] opacity-30">
                  <Megaphone className="w-10 h-10 mx-auto mb-4" />
                  <p className="text-xs font-bold uppercase">Nenhum aviso ativo</p>
               </div>
             ) : (
               announcements?.map((a: any) => (
                 <Card key={a.id} className={cn("rounded-2xl border-none shadow-sm overflow-hidden", !a.isActive && "opacity-50 grayscale")}>
                    <div className="p-4 flex flex-col gap-4">
                       <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "p-2 rounded-lg",
                               a.type === 'info' && "bg-blue-500/10 text-blue-600",
                               a.type === 'warning' && "bg-orange-500/10 text-orange-600",
                               a.type === 'success' && "bg-green-500/10 text-green-600",
                               a.type === 'destructive' && "bg-red-500/10 text-red-600"
                             )}>
                                <Bell className="w-4 h-4" />
                             </div>
                             <div>
                                <p className="text-sm font-black uppercase tracking-tight">{a.title}</p>
                                <p className="text-[10px] text-muted-foreground font-medium">{a.createdAt?.toDate?.().toLocaleString('pt-BR')}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Switch checked={a.isActive} onCheckedChange={() => handleToggleStatus(a.id, a.isActive)} />
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="text-destructive h-8 w-8 rounded-full"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                       </div>
                       <p className="text-xs text-muted-foreground leading-relaxed">{a.message}</p>
                    </div>
                 </Card>
               ))
             )}
          </div>
        </div>
      </main>

      <footer className="py-12 border-t mt-auto text-center flex flex-col items-center gap-6">
        <div className="relative w-[180px] h-[60px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="object-contain dark:hidden opacity-30 grayscale" priority unoptimized />
          <Image src="/logo-proova-dark-mode.gif" alt="Logo Footer" fill className="object-contain hidden dark:block opacity-30 grayscale" priority unoptimized />
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">© 2026 Proova - Root Terminal</p>
      </footer>
    </div>
  );
}
