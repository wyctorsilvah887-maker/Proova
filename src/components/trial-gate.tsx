'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { Lock, ArrowRight, Headphones } from 'lucide-react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { lockReason } from '@/lib/trial';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** Áreas do app que exigem plano ativo ou teste em andamento. Páginas públicas, /pricing, /support, /login etc. ficam livres. */
const LOCKED = ['/dash', '/metrics', '/settings', '/ppeditor', '/private', '/social-cards', '/widgets', '/widgetconfig'];

const COPY = {
  no_plan: {
    title: 'Falta só escolher seu plano',
    text: 'Sua conta foi criada. O Proova AI é um serviço pago: para usar o painel e colocar o seu link de coleta e a página pública no ar, ative um plano. Seus dados ficam guardados na conta.',
  },
  trial_ended: {
    title: 'Seu teste terminou',
    text: 'Sem um plano ativo, o painel, o seu link de coleta, a página pública e o widget estão fora do ar. Seus depoimentos e configurações estão salvos e tudo volta na hora depois da assinatura.',
  },
  expired: {
    title: 'Seu plano não está ativo',
    text: 'Sem um plano ativo, o painel, o seu link de coleta, a página pública e o widget estão fora do ar. Seus depoimentos e configurações estão salvos e tudo volta na hora depois da assinatura.',
  },
} as const;

/**
 * Sem plano pago ativo, o dono não usa o painel: conta nova (nunca assinou), teste antigo vencido
 * ou plano cancelado/reembolsado. Os dados ficam salvos; as páginas públicas também saem do ar.
 */
export function TrialGate() {
  const pathname = usePathname() || '';
  const { user } = useUser();
  const db = useFirestore();
  const ref = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data } = useDoc(ref);
  const u = data as any;

  if (!u) return null;
  if (!LOCKED.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null;
  const reason = lockReason(u);
  if (!reason) return null;
  const copy = COPY[reason];
  return <GateScreen copy={copy} email={u.email} pathname={pathname} />;
}

/** Chegou do pagamento (?pago=1 ou clicou no checkout há pouco)? Então espera o webhook em vez de mostrar o bloqueio. */
function usePaying(pathname: string) {
  const [paying, setPaying] = useState(false);
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    let flag = false;
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('pago') === '1';
      const ts = Number(sessionStorage.getItem('proova_checkout') || 0);
      flag = fromUrl || (!!ts && Date.now() - ts < 2 * 3600_000);
    } catch { /* ignore */ }
    setPaying(flag);
    if (!flag) return;
    const t = setTimeout(() => setWaited(true), 60_000);
    return () => clearTimeout(t);
  }, [pathname]);
  return { paying, waited };
}

function GateScreen({ copy, email, pathname }: { copy: { title: string; text: string }; email?: string; pathname: string }) {
  const { paying, waited } = usePaying(pathname);

  if (paying && !waited) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-6">
        <div className="w-full max-w-md space-y-6 text-center" role="status" aria-live="polite">
          <Skeleton className="mx-auto h-16 w-16 rounded-3xl" />
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black font-headline tracking-tight">Confirmando seu pagamento…</h1>
            <p className="text-sm text-muted-foreground font-medium">Isso leva alguns segundos. Seu painel abre sozinho assim que o pagamento for confirmado.</p>
          </div>
          <div className="space-y-3"><Skeleton className="h-14 w-full rounded-2xl" /><Skeleton className="h-4 w-3/4 mx-auto" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-6 overflow-y-auto">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center"><Lock className="w-8 h-8" /></div>
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black font-headline tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">{paying && waited ? 'Ainda não recebemos a confirmação. Se você pagou com outro e-mail ou o painel não abriu, fale com o suporte e liberamos para você.' : copy.text}</p>
        </div>
        <div className="space-y-3">
          <Link href="/pricing" className="block">
            <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2">Escolher meu plano <ArrowRight className="w-4 h-4" /></Button>
          </Link>
          <p className="text-[11px] text-muted-foreground font-bold">Garantia de 7 dias com reembolso integral. Pague com o e-mail desta conta ({email || 'o e-mail do cadastro'}) para ativar na hora.</p>
          <Link href="/support" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"><Headphones className="w-4 h-4" /> Falar com o suporte</Link>
        </div>
      </div>
    </div>
  );
}
