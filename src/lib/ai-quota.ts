import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ppPlanOf, AI_MONTHLY_LIMIT } from '@/lib/pp-plans';

/**
 * Cota mensal de respostas geradas por IA, por conta (custo de Gemini sob controle).
 * Fica em users/{uid}/usage/{AAAA-MM}.aiReplies e só o servidor escreve (Admin SDK).
 * Generosa para quem paga, curta para quem ainda não paga.
 */

/** Mês de referência no fuso de Brasília/Fortaleza (UTC-3), para a virada bater com o calendário do cliente. */
export function monthKey(now = new Date()): string {
  const d = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export type QuotaResult = { ok: boolean; used: number; limit: number; remaining: number };

/** Reserva `n` respostas da cota. Se não couber, não reserva nada e devolve ok:false. */
export async function reserveAiReplies(uid: string, membershipStatus: string | undefined | null, n = 1): Promise<QuotaResult> {
  const limit = AI_MONTHLY_LIMIT[ppPlanOf(membershipStatus)];
  const ref = adminDb().doc(`users/${uid}/usage/${monthKey()}`);
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const used = Number(snap.data()?.aiReplies) || 0;
    if (used + n > limit) return { ok: false, used, limit, remaining: Math.max(0, limit - used) };
    tx.set(ref, { aiReplies: used + n, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { ok: true, used: used + n, limit, remaining: limit - used - n };
  });
}

/** Devolve respostas reservadas quando a IA falha (ninguém paga por resposta que não saiu). */
export async function releaseAiReplies(uid: string, n = 1): Promise<void> {
  try {
    await adminDb().doc(`users/${uid}/usage/${monthKey()}`).set({ aiReplies: FieldValue.increment(-n) }, { merge: true });
  } catch (e) {
    console.error('[ai-quota] não consegui devolver a cota:', (e as Error).message);
  }
}

export const QUOTA_MESSAGE =
  'Você usou todas as respostas por IA deste mês no seu plano. O limite renova no dia 1º, ou você pode fazer upgrade em /pricing.';
