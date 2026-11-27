/**
 * O Proova AI é 100% pago. Não existe mais teste grátis para contas novas.
 * O status 'trial' só continua existindo para contas que JÁ estavam em teste: elas usam até a data
 * de trialEndsAt e depois são bloqueadas como qualquer outra conta sem plano.
 */

/** Dias restantes (arredondado para cima) a partir de trialEndsAt (Timestamp do Firestore, Date ou ms). */
export function trialDaysLeft(trialEndsAt: any, now = Date.now()): number {
  const ms = typeof trialEndsAt === 'number' ? trialEndsAt : trialEndsAt?.toMillis?.() ?? trialEndsAt?.toDate?.()?.getTime?.() ?? null;
  if (ms == null) return 0;
  return Math.max(0, Math.ceil((ms - now) / 86400000));
}

type AccessUser = { membershipStatus?: string; trialEndsAt?: any; isAdmin?: boolean } | null | undefined;

/** Por que a conta está sem acesso (null = com acesso). */
export function lockReason(u: AccessUser, now = Date.now()): 'no_plan' | 'trial_ended' | 'expired' | null {
  if (!u || u.isAdmin === true) return null;
  const st = u.membershipStatus || 'base';
  if (st === 'gold' || st === 'enterprise') return null;
  if (st === 'trial') {
    const ms = u.trialEndsAt?.toMillis?.();
    return ms && ms > now ? null : 'trial_ended';
  }
  if (st === 'expired') return 'expired';
  return 'no_plan'; // 'base' (conta nova) ou qualquer valor desconhecido: sem plano pago
}

/** Conta sem acesso: nunca assinou, teste antigo vencido ou plano cancelado/reembolsado. Admins nunca ficam bloqueados. */
export function isAccessLocked(u: AccessUser, now = Date.now()): boolean {
  return lockReason(u, now) !== null;
}
