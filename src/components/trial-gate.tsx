'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { Lock, ArrowRight, Headphones } from 'lucide-react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { Button } from '@/components/ui/button';

/** Áreas do app que exigem plano ativo ou teste em andamento. Páginas públicas, /pricing, /support, /login etc. ficam livres. */
const LOCKED = ['/dash', '/metrics', '/settings', '/ppeditor', '/private', '/social-cards', '/widgets', '/widgetconfig'];

/**
 * Depois dos 14 dias de teste, o dono só volta a usar o painel assinando um plano.
 * Os dados ficam salvos; as páginas públicas (link de coleta, página do cliente) continuam no ar.
 */
export function TrialGate() {
  const pathname = usePathname() || '';
  const { user } = useUser();
  const db = useFirestore();
  const ref = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data } = useDoc(ref);
  const u = data as any;

  if (!u || u.isAdmin === true) return null;
  if (!LOCKED.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null;
  const st = u.membershipStatus;
  const endsMs = u.trialEndsAt?.toMillis?.();
  const ended = st === 'expired' || (st === 'trial' && !!endsMs && endsMs <= Date.now());
  if (!ended) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-6 overflow-y-auto">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center"><Lock className="w-8 h-8" /></div>
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black font-headline tracking-tight">Seu teste de 14 dias terminou</h1>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            Para continuar usando o Proova AI, escolha um plano. Seus depoimentos, a página pública e todas as configurações estão salvos e voltam na hora depois da assinatura.
          </p>
        </div>
        <div className="space-y-3">
          <Link href="/pricing" className="block">
            <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2">Escolher meu plano <ArrowRight className="w-4 h-4" /></Button>
          </Link>
          <p className="text-[11px] text-muted-foreground font-bold">Planos pagos têm garantia de 7 dias com reembolso integral.</p>
          <Link href="/support" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"><Headphones className="w-4 h-4" /> Falar com o suporte</Link>
        </div>
      </div>
    </div>
  );
}
