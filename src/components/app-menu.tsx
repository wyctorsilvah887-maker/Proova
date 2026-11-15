'use client';

import type { RefObject } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  BarChart3, Globe, Headphones, ImageIcon, Inbox, LayoutGrid, Link2, LogOut, QrCode, Settings, User,
  type LucideIcon,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/firebase';
import { cn } from '@/lib/utils';

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
  membershipLabel,
  pendingCount = 0,
  onHome,
  onHash,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
  companyName?: string;
  membershipLabel: string;
  pendingCount?: number;
  onHome?: () => void;
  onHash?: (hash: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();

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
        { label: 'Moderação Inbox', icon: Inbox, href: '/private', badge: pendingCount },
        { label: 'Social Cards', icon: ImageIcon, href: '/social-cards' },
        { label: 'Métricas & ROI', icon: BarChart3, href: '/metrics' },
      ],
    },
    {
      title: 'Conta',
      items: [
        { label: 'Configurações', icon: Settings, href: '/settings' },
        { label: 'Suporte VIP', icon: Headphones, href: '/support' },
      ],
    },
  ];

  const go = (item: Item) => {
    if (item.home) {
      if (onHome) onHome();
      else router.push('/dash');
    } else if (item.hash) {
      if (onHash) onHash(item.hash);
      else router.push(`/dash#${item.hash}`);
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
          <div className="p-6 border-b bg-muted/10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 shadow-inner">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black uppercase tracking-tight truncate">{companyName}</p>
                <span className="text-[8px] font-black uppercase tracking-widest text-primary">{membershipLabel}</span>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 py-6 space-y-6">
              {groups.map((g) => (
                <div key={g.title}>
                  <p className="px-3.5 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">{g.title}</p>
                  {g.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => go(item)}
                      aria-current={isActive(item) ? 'page' : undefined}
                      className={cn(
                        'w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all group outline-none focus:ring-0',
                        isActive(item) && 'bg-primary/10 text-primary'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className={cn('w-4 h-4 text-primary group-hover:opacity-100', isActive(item) ? 'opacity-100' : 'opacity-60')} />
                        <span>{item.label}</span>
                      </div>
                      {!!item.badge && item.badge > 0 && (
                        <Badge className="bg-destructive text-white h-4 px-1.5 text-[8px]">{item.badge}</Badge>
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
