/** Teste grátis: toda conta nova (e contas antigas do plano Base) ganha 14 dias com os recursos do Premium. */
export const TRIAL_DAYS = 14;
export const TRIAL_MS = TRIAL_DAYS * 86400000;

/** Dias restantes (arredondado para cima) a partir de trialEndsAt (Timestamp do Firestore, Date ou ms). */
export function trialDaysLeft(trialEndsAt: any, now = Date.now()): number {
  const ms = typeof trialEndsAt === 'number' ? trialEndsAt : trialEndsAt?.toMillis?.() ?? trialEndsAt?.toDate?.()?.getTime?.() ?? null;
  if (ms == null) return 0;
  return Math.max(0, Math.ceil((ms - now) / 86400000));
}

/** Conta sem acesso: teste vencido (ou plano cancelado/reembolsado). Admins nunca ficam bloqueados. */
export function isAccessLocked(u: { membershipStatus?: string; trialEndsAt?: any; isAdmin?: boolean } | null | undefined, now = Date.now()): boolean {
  if (!u || u.isAdmin === true) return false;
  if (u.membershipStatus === 'expired') return true;
  if (u.membershipStatus === 'trial') {
    const ms = u.trialEndsAt?.toMillis?.();
    return !!ms && ms <= now;
  }
  return false;
}
