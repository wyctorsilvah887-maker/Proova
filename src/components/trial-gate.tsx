'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { Lock, ArrowRight, Headphones } from 'lucide-react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { lockReason } from '@/lib/trial';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-6 overflow-y-auto">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center"><Lock className="w-8 h-8" /></div>
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black font-headline tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">{copy.text}</p>
        </div>
        <div className="space-y-3">
          <Link href="/pricing" className="block">
            <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2">Escolher meu plano <ArrowRight className="w-4 h-4" /></Button>
          </Link>
          <p className="text-[11px] text-muted-foreground font-bold">Garantia de 7 dias com reembolso integral. Pague com o e-mail desta conta ({u.email || 'o e-mail do cadastro'}) para ativar na hora.</p>
          <Link href="/support" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"><Headphones className="w-4 h-4" /> Falar com o suporte</Link>
        </div>
      </div>
    </div>
  );
}
