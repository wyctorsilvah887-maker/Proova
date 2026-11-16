import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { codeMatches, MAX_ATTEMPTS } from '@/lib/billing/claim';

/** Passo 2 do resgate: confirma o código e ativa o plano na conta logada. */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  let uid: string;
  try { uid = (await adminAuth().verifyIdToken(token)).uid; }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const code = String((await req.json().catch(() => ({})))?.code || '').trim();
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: 'codigo_invalido' }, { status: 400 });

  const db = adminDb();
  const claimRef = db.doc(`claim_codes/${uid}`);
  const userRef = db.doc(`users/${uid}`);

  type Result = { status: number; body: Record<string, unknown>; orders?: string[] };
  const result: Result = await db.runTransaction(async (tx): Promise<Result> => {
    const claim = (await tx.get(claimRef)).data();
    if (!claim?.codeHash || !claim.email || (claim.expiresAt?.toMillis?.() ?? 0) < Date.now()) {
      return { status: 400, body: { error: 'codigo_expirado' } };
    }
    if ((claim.attempts || 0) >= MAX_ATTEMPTS) return { status: 429, body: { error: 'tentativas' } };

    if (!codeMatches(claim.codeHash, uid, claim.email, code)) {
      tx.update(claimRef, { attempts: (claim.attempts || 0) + 1 });
      return { status: 400, body: { error: 'codigo_invalido' } };
    }

    const open = await tx.get(db.collection('pending_plans').where('email', '==', claim.email).where('status', '==', 'open'));
    if (open.empty) return { status: 404, body: { error: 'sem_compra' } };

    const newest = [...open.docs].sort((a, b) => (b.data().createdAt?.toMillis?.() ?? 0) - (a.data().createdAt?.toMillis?.() ?? 0))[0];
    const claimed = newest.data().plan as string;
    // Nunca rebaixa: se a conta já tem um plano igual ou maior, mantém o atual.
    const rank: Record<string, number> = { base: 0, lead: 0, gold: 1, enterprise: 2 };
    const current = ((await tx.get(userRef)).data()?.membershipStatus as string | undefined) || 'base';
    const plan = (rank[current] ?? 0) >= (rank[claimed] ?? 0) && current !== 'trial' ? current : claimed;

    const update: Record<string, unknown> = {
      membershipStatus: plan,
      planUpdatedAt: FieldValue.serverTimestamp(),
      ...(plan !== current ? { planActivatedAt: FieldValue.serverTimestamp() } : {}),
      billingEmail: claim.email, // renovações/cancelamentos futuros desse e-mail chegam nesta conta
    };
    tx.update(userRef, update);
    open.docs.forEach((d) => tx.update(d.ref, { status: 'claimed', claimedBy: uid, claimedAt: FieldValue.serverTimestamp() }));
    tx.delete(claimRef);
    const orders = open.docs.map((d) => String(d.data().orderId || d.id));
    return { status: 200, body: { ok: true, plan }, orders };
  });

  // Atualiza o histórico de pagamentos (admin): "Aguardando resgate" passa a "Resgatado".
  if (result.status === 200 && result.orders) {
    try {
      for (const orderId of result.orders) {
        const events = await db.collection('payment_events').where('payload.data.id', '==', orderId).get();
        await Promise.all(events.docs
          .filter((d) => d.data().outcome === 'pending_claim')
          .map((d) => d.ref.update({ outcome: 'claimed', reason: 'resgatado', externalId: uid })));
      }
    } catch (e) {
      console.error('[claim] não atualizou o histórico:', (e as Error).message);
    }
  }

  return NextResponse.json(result.body, { status: result.status });
}
