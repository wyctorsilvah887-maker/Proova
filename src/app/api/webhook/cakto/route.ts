import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { safeEqual } from '@/lib/safe-equal';
import { customerOf, decide } from '@/lib/billing/cakto';

export const maxDuration = 30;

/**
 * Webhook da Cakto. É AQUI que o plano é ativado ou removido, no servidor.
 * A Cakto envia o segredo no corpo (campo "secret"); ele precisa bater com CAKTO_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  let payload: any;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  const expected = process.env.CAKTO_WEBHOOK_SECRET?.trim();
  const received = typeof payload?.secret === 'string' ? payload.secret.trim() : undefined;
  if (!safeEqual(received, expected)) {
    // Motivo no log (nunca o valor dos segredos), para achar rápido o que está errado.
    const motivo = !expected ? 'CAKTO_WEBHOOK_SECRET não existe neste deploy'
      : !received ? 'a Cakto não enviou o campo "secret"'
      : `segredo diferente (Vercel tem ${expected.length} caracteres, a Cakto enviou ${received.length})`;
    console.error('[cakto] 401:', motivo);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const event: string = payload.event || 'unknown_event';
  const data = payload.data || {};
  const { email, uid } = customerOf(data);
  const db = adminDb();

  let outcome = 'ignored';
  let reason: string | null = null;
  let matchedUid: string | null = null;

  try {
    // 1) Acha o usuário: pelo ID enviado no checkout (se existir) ou pelo e-mail da compra.
    let userRef = uid ? db.doc(`users/${uid}`) : null;
    if (userRef && !(await userRef.get()).exists) userRef = null;
    if (!userRef && email) {
      for (const candidate of [...new Set([email.toLowerCase(), email])]) {
        const q = await db.collection('users').where('email', '==', candidate).limit(2).get();
        if (q.size === 1) { userRef = q.docs[0].ref; break; }
        if (q.size > 1) { reason = 'email_duplicado'; break; }
      }
    }

    if (!userRef) {
      outcome = 'unmatched';
      reason = reason || 'usuario_nao_encontrado';
    } else {
      matchedUid = userRef.id;
      const current = (await userRef.get()).data()?.membershipStatus as string | undefined;
      const decision = decide(event, data, current);

      if (decision.action === 'activate') {
        const update: Record<string, unknown> = {
          membershipStatus: decision.plan,
          planUpdatedAt: FieldValue.serverTimestamp(),
        };
        if (data.subscription?.id) update.caktoSubscriptionId = data.subscription.id;
        if (decision.plan === 'trial') {
          update.trialUsed = true;
          update.trialStartedAt = FieldValue.serverTimestamp();
        }
        await userRef.update(update);
        outcome = 'activated';
        reason = decision.plan;
      } else if (decision.action === 'deactivate') {
        await userRef.update({ membershipStatus: 'base', planUpdatedAt: FieldValue.serverTimestamp() });
        if (event === 'refund' || event === 'chargeback') {
          const open = await db.collection('refund_requests').where('uid', '==', userRef.id).where('status', '==', 'pending').get();
          await Promise.all(open.docs.map((d) => d.ref.update({ status: 'refunded', resolvedAt: FieldValue.serverTimestamp() })));
        }
        outcome = 'deactivated';
        reason = decision.plan;
      } else {
        reason = decision.reason;
      }
    }
  } catch (err) {
    console.error('[cakto] erro ao processar:', (err as Error).message);
    // 500 faz a Cakto tentar de novo mais tarde.
    return NextResponse.json({ error: 'processing failed' }, { status: 500 });
  }

  // Registro para o painel admin (sem o segredo).
  const { secret: _secret, ...safePayload } = payload;
  await db.collection('payment_events').add({
    externalId: matchedUid || uid || 'unknown',
    customerEmail: email || 'unknown@email.com',
    status: data.status || event,
    productName: data.product?.name || 'Plano Proova',
    eventType: event,
    outcome,
    reason,
    payload: safePayload,
    createdAt: FieldValue.serverTimestamp(),
  }).catch((e: Error) => console.error('[cakto] falha ao registrar evento:', e.message));

  console.log('[cakto]', event, outcome, reason, matchedUid);
  return NextResponse.json({ received: true, outcome }, { status: 200 });
}
