'use client';

import { useEffect, useMemo, useState, type RefObject } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  BarChart3, BookOpen, Copy, ExternalLink, Gem, Globe, Headphones, ImageIcon, Inbox, LayoutGrid, Link2, LogOut, QrCode, Settings, Shield, Sparkles, BellRing,
  type LucideIcon,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getPushToken, listenForeground } from '@/lib/push-client';

/** Cor do selo de acordo com o plano (membershipLabel das páginas). */
const PLAN_STYLE: Record<string, string> = {
  PRO: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  PREMIUM: 'bg-primary/15 text-primary border-primary/30',
  TRIAL: 'bg-sky-500/15 text-sky-600 border-sky-500/30',
  EXPIRADO: 'bg-destructive/10 text-destructive border-destructive/30',
};

const initialsOf = (name?: string | null) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'P';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

type Item = {
  label: string;
  icon: LucideIcon;
  /** Rota do app. */
  href?: string;
  /** Seção do painel (/dash#hash). */
  hash?: string;
  /** Visão geral do painel. */
  home?: boolean;
  badge?: number;
  /** Endereço fora do app: abre na mesma aba. */
  external?: string;
};

/**
 * Menu lateral único do app (antes copiado em 7 páginas).
 * Mantém o mesmo Sheet não modal e o mesmo tratamento do botão de abrir/fechar.
 * Na própria /dash, passe onHome/onHash para trocar a seção sem recarregar.
 */
export function AppSideMenu({
  open,
  onOpenChange,
  toggleRef,
  companyName,
  companySlug,
  membershipLabel,
  pendingCount = 0,
  isAdmin = false,
  onHome,
  onHash,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
  companyName?: string;
  /** Slug da página pública (habilita logo e atalhos de "ver/copiar página"). */
  companySlug?: string;
  membershipLabel: string;
  pendingCount?: number;
  /** Mostra o atalho para o painel de administração. */
  isAdmin?: boolean;
  onHome?: () => void;
  onHash?: (hash: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();

  // Logo da clínica: lê a página pública só depois que o menu é aberto pela primeira vez (1 leitura).
  const [everOpened, setEverOpened] = useState(false);
  useEffect(() => { if (open) setEverOpened(true); }, [open]);
  const ppRef = useMemo(
    () => (everOpened && db && user && companySlug ? doc(db, 'users', user.uid, 'pp', companySlug) : null),
    [everOpened, db, user, companySlug]
  );
  const { data: ppData } = useDoc(ppRef);
  // Selo do Inbox: pendências da curadoria + feedbacks críticos novos (contador no próprio perfil, sem leituras extras).
  const meRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: me } = useDoc(meRef);
  const inboxBadge = (pendingCount || 0) + (Number(me?.inboxNewCount) || 0);
  // Avisos no celular (planos pagos): renova o token em silêncio a cada sessão e oferece ativar/testar aqui,
  // para o usuário não depender de ter visitado uma página específica.
  const isPaid = ['gold', 'enterprise', 'trial'].includes(me?.membershipStatus);
  const [pushPerm, setPushPerm] = useState<'' | 'granted' | 'default' | 'denied' | 'unsupported'>('');
  const [pushBusy, setPushBusy] = useState(false);
  const registerToken = async () => {
    const idToken = await auth?.currentUser?.getIdToken();
    if (!idToken) throw new Error('Sessão expirada. Entre novamente.');
    const token = await getPushToken();
    const r = await fetch('/api/push-token', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ token }) });
    if (!r.ok) throw new Error('Não foi possível registrar este aparelho.');
  };
  useEffect(() => {
    if (!user || !isPaid || typeof window === 'undefined') return;
    if (!('Notification' in window) || !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) { setPushPerm('unsupported'); return; }
    setPushPerm(Notification.permission as any);
    if (Notification.permission === 'granted') {
      let done = false;
      try { done = sessionStorage.getItem('proova_push_synced') === user.uid; } catch {}
      if (!done) registerToken().then(() => { try { sessionStorage.setItem('proova_push_synced', user.uid); } catch {} }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isPaid]);
  // Aviso recebido com o app aberto: mostra na tela (o FCM não aciona o service worker em primeiro plano).
  useEffect(() => {
    if (pushPerm !== 'granted') return;
    let unsub: (() => void) | undefined;
    let dead = false;
    listenForeground((m) => {
      toast({ title: m.title, description: m.body });
    }).then((u) => { if (dead) u(); else unsub = u; });
    return () => { dead = true; unsub?.(); };
  }, [pushPerm]);
  const enablePush = async () => {
    setPushBusy(true);
    try {
      await registerToken();
      setPushPerm('granted');
      toast({ title: 'Avisos ativados', description: 'Você receberá alertas de críticas e lembretes neste aparelho.' });
    } catch (e: any) {
      setPushPerm((typeof Notification !== 'undefined' ? Notification.permission : 'unsupported') as any);
      toast({ variant: 'destructive', title: 'Não foi possível ativar', description: e?.message || 'Tente novamente.' });
    } finally { setPushBusy(false); }
  };
  const logoUrl: string | null = ppData?.logoUrl && !/\.(mp4|webm|mov)(\?|$)/i.test(ppData.logoUrl) ? ppData.logoUrl : null;
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => { setLogoFailed(false); }, [logoUrl]);

  const publicUrl = companySlug && typeof window !== 'undefined' ? `${window.location.origin}/pp/${companySlug}` : '';
  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({ title: 'Link copiado!', description: 'O link da sua página pública está na área de transferência.' });
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível copiar' });
    }
  };
  const planStyle = PLAN_STYLE[membershipLabel] || 'bg-muted text-muted-foreground border-border';
  const canUpgrade = membershipLabel !== 'PRO';
  const displayName = companyName || user?.displayName || 'Minha conta';

  const groups: { title: string; items: Item[] }[] = [
    { title: 'Início', items: [{ label: 'Visão Geral', icon: LayoutGrid, home: true }] },
    {
      title: 'Coletar & Divulgar',
      items: [
        { label: 'Link de Coleta', icon: Link2, hash: 'link-coleta' },
        { label: 'QR de Balcão', icon: QrCode, hash: 'qr' },
        { label: 'Página Pública', icon: Globe, hash: 'bio' },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { label: 'Moderação Inbox', icon: Inbox, href: '/private', badge: inboxBadge },
        { label: 'Social Cards', icon: ImageIcon, href: '/social-cards' },
        { label: 'Métricas & ROI', icon: BarChart3, href: '/metrics' },
      ],
    },
    {
      title: 'Conta',
      items: [
        { label: 'Planos e Preços', icon: Gem, href: '/pricing' },
        { label: 'Configurações', icon: Settings, href: '/settings' },
        { label: 'Suporte VIP', icon: Headphones, href: '/support' },
        { label: 'Blog', icon: BookOpen, external: 'https://blog.useproovaai.com.br' },
      ],
    },
    ...(isAdmin ? [{ title: 'Administração', items: [{ label: 'Painel Admin', icon: Shield, href: '/admin' }] as Item[] }] : []),
  ];

  const go = (item: Item) => {
    if (item.home) {
      if (onHome) onHome();
      else router.push('/dash');
    } else if (item.hash) {
      if (onHash) onHash(item.hash);
      else router.push(`/dash#${item.hash}`);
    } else if (item.external) {
      window.location.href = item.external;
      return;
    } else if (item.href) {
      router.push(item.href);
    }
    onOpenChange(false);
  };

  const isActive = (item: Item) => !!item.href && pathname === item.href;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="left"
        className="w-full max-w-[300px] border-none shadow-2xl bg-background p-0 flex flex-col h-[100dvh] overflow-hidden z-[110]"
        onPointerDownOutside={(e) => {
          if (toggleRef.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Menu de Navegação</SheetTitle>
          <SheetDescription>Acesse as funcionalidades e configurações da sua conta Proova AI.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col pt-20">
          <div className="p-5 border-b bg-muted/10 shrink-0 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 shadow-inner overflow-hidden">
                {logoUrl && !logoFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-full w-full object-cover" onError={() => setLogoFailed(true)} />
                ) : (
                  <span className="text-base font-black text-primary tracking-tight">{initialsOf(displayName)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-black uppercase tracking-tight truncate leading-tight">{displayName}</p>
                {user?.email && <p className="text-[11px] font-medium text-muted-foreground truncate leading-tight">{user.email}</p>}
                <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest', planStyle)}>{membershipLabel}</span>
              </div>
            </div>

            {companySlug && (
              <div className="grid grid-cols-2 gap-2">
                <a href={`/pp/${companySlug}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 h-9 rounded-xl border bg-background hover:bg-primary/5 text-[10px] font-black uppercase tracking-wider transition-all">
                  <ExternalLink className="w-3.5 h-3.5 text-primary" /> Ver página
                </a>
                <button type="button" onClick={copyPublicUrl}
                  className="flex items-center justify-center gap-1.5 h-9 rounded-xl border bg-background hover:bg-primary/5 text-[10px] font-black uppercase tracking-wider transition-all">
                  <Copy className="w-3.5 h-3.5 text-primary" /> Copiar link
                </button>
              </div>
            )}

            {isPaid && pushPerm && pushPerm !== 'unsupported' && (
              pushPerm === 'granted' ? (
                <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-[10px] font-black uppercase tracking-wider">
                  <BellRing className="w-3.5 h-3.5 text-primary" /> <span className="flex-1">Avisos ativos neste aparelho</span>
                </div>
              ) : pushPerm === 'denied' ? (
                <p className="rounded-xl border bg-muted/40 px-3 py-2 text-[10px] font-medium text-muted-foreground leading-snug">Avisos bloqueados no navegador. Libere as notificações deste site nas configurações para receber alertas de críticas.</p>
              ) : (
                <button type="button" onClick={enablePush} disabled={pushBusy}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-primary/30 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 active:scale-[0.98] transition-all disabled:opacity-50">
                  <BellRing className="w-3.5 h-3.5" /> Ativar avisos no celular
                </button>
              )
            )}

            {canUpgrade && (
              <button type="button" onClick={() => { router.push('/pricing'); onOpenChange(false); }}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all">
                <Sparkles className="w-3.5 h-3.5" /> {membershipLabel === 'PREMIUM' ? 'Conhecer o PRO' : 'Fazer upgrade'}
              </button>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 py-5 space-y-5">
              {groups.map((g) => (
                <div key={g.title}>
                  <p className="px-3.5 mb-1.5 text-[9px] font-black uppercase tracking-[0.28em] text-muted-foreground opacity-70">{g.title}</p>
                  {g.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => go(item)}
                      aria-current={isActive(item) ? 'page' : undefined}
                      className={cn(
                        'relative w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-primary/5 text-[11px] font-black uppercase tracking-wider transition-all group outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                        isActive(item) && 'bg-primary/10 text-primary before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-primary'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className={cn('w-4 h-4 text-primary group-hover:opacity-100', isActive(item) ? 'opacity-100' : 'opacity-60')} />
                        <span>{item.label}</span>
                      </div>
                      {!!item.badge && item.badge > 0 && (
                        <Badge className="bg-destructive text-white h-5 min-w-5 justify-center px-1.5 text-[9px]">{item.badge}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t shrink-0">
            <Button
              variant="ghost"
              className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/10 font-black uppercase tracking-widest text-[9px] gap-2"
              onClick={() => signOut(auth)}
            >
              <LogOut className="w-4 h-4" /> Sair da Conta
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
