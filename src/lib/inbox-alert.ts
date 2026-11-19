import { FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { adminDb } from '@/lib/firebase-admin';
import { SITE_URL } from '@/lib/site';

/**
 * Novo feedback crítico no Inbox do dono: soma no contador `inboxNewCount` (lido junto com o perfil,
 * sem leituras extras para o selo do menu) e, nos planos pagos, manda push em segundo plano.
 * Nunca lança: falha aqui não pode derrubar o envio do depoimento.
 */
export async function notifyOwnerNewFeedback(uid: string, opts: { clientName: string; rating: number; push: boolean }) {
  try {
    await adminDb().doc(`users/${uid}`).set({ inboxNewCount: FieldValue.increment(1) }, { merge: true });
  } catch (e) {
    console.error('[inbox-alert] contador', (e as Error).message);
  }
  if (!opts.push) return;
  try {
    const pushRef = adminDb().doc(`user_push/${uid}`);
    const tokens: string[] = (await pushRef.get()).data()?.tokens || [];
    if (!tokens.length) return;
    const name = String(opts.clientName || 'Um cliente').slice(0, 40);
    const res = await getMessaging().sendEachForMulticast({
      tokens,
      data: {
        title: '🛡️ Novo feedback no seu Inbox',
        body: `${name} deu ${opts.rating} estrela${opts.rating === 1 ? '' : 's'}. Responda rápido e recupere o cliente.`,
        link: `${SITE_URL}/private`,
        tag: 'inbox-new',
      },
      webpush: { headers: { Urgency: 'high', TTL: '86400' } },
    });
    const alive = tokens.filter((_, i) => {
      const code = res.responses[i].error?.code || '';
      return res.responses[i].success || !(code.includes('not-registered') || code.includes('invalid-registration-token') || code.includes('invalid-argument'));
    });
    if (alive.length !== tokens.length) await pushRef.set({ tokens: alive }, { merge: true });
  } catch (e) {
    console.error('[inbox-alert] push', (e as Error).message);
  }
}
