'use client';

import { useMemo, useState } from 'react';
import { doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { getToken, isSupported } from 'firebase/messaging';
import { BellRing, Mail, Loader2, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useDoc, initializeFirebase } from '@/firebase';
import { toast } from '@/hooks/use-toast';

/**
 * Preferências de aviso do admin (coleção dedicada `admin_notify`, 1 doc por admin).
 * O servidor lê só essa coleção para avisar quando alguém pede atendente.
 */
export function AdminNotifyCard({ uid, email, name }: { uid: string; email?: string | null; name?: string }) {
  const db = useFirestore();
  const ref = useMemo(() => (db ? doc(db, 'admin_notify', uid) : null), [db, uid]);
  const { data } = useDoc(ref);
  const [busy, setBusy] = useState(false);

  const emailOn = (data as any)?.emailEnabled !== false && !!data;
  const tokens: string[] = (data as any)?.pushTokens || [];
  const perm = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';

  const save = (patch: Record<string, any>) =>
    setDoc(ref!, { email: (email || '').toLowerCase(), name: name || '', updatedAt: serverTimestamp(), ...patch }, { merge: true });

  const toggleEmail = async (on: boolean) => {
    if (!ref) return;
    try { await save({ emailEnabled: on }); toast({ title: on ? 'Aviso por e-mail ativado' : 'Aviso por e-mail desativado' }); }
    catch { toast({ variant: 'destructive', title: 'Não foi possível salvar' }); }
  };

  const enablePush = async () => {
    if (!ref) return;
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) { toast({ variant: 'destructive', title: 'Falta a chave VAPID', description: 'Defina NEXT_PUBLIC_FIREBASE_VAPID_KEY no Vercel.' }); return; }
    setBusy(true);
    try {
      if (!(await isSupported())) throw new Error('Este navegador não suporta push. No iPhone, instale o app na tela inicial.');
      const status = await Notification.requestPermission();
      if (status !== 'granted') throw new Error('Permissão de notificação negada no navegador.');
      const { messaging } = initializeFirebase();
      if (!messaging) throw new Error('Mensageria indisponível.');
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
      if (!token) throw new Error('Token não gerado.');
      await save({ pushEnabled: true, pushTokens: arrayUnion(token), ...(data ? {} : { emailEnabled: true }) });
      toast({ title: 'Push ativado neste dispositivo', description: 'Você será avisado mesmo com a aba fechada.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Falha ao ativar push', description: e?.message || 'Tente novamente.' });
    } finally { setBusy(false); }
  };

  return (
    <Card className="rounded-[2rem] border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2"><BellRing className="w-4 h-4 text-primary" /> Avisos de novo atendimento</CardTitle>
        <CardDescription className="text-xs">Quando alguém pedir um atendente, você recebe e-mail e/ou notificação push.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0"><p className="text-sm font-bold">E-mail</p><p className="text-[11px] text-muted-foreground truncate">{email || 'sem e-mail na conta'}</p></div>
          </div>
          <Switch checked={emailOn} onCheckedChange={toggleEmail} disabled={!email} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0"><p className="text-sm font-bold">Push neste dispositivo</p>
              <p className="text-[11px] text-muted-foreground">{tokens.length ? `${tokens.length} dispositivo(s) ativo(s)` : 'Nenhum dispositivo ativo'}{perm === 'denied' ? ' · bloqueado no navegador' : ''}</p></div>
          </div>
          <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold" onClick={enablePush} disabled={busy || perm === 'denied'}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ativar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
