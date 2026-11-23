/** Teste grátis: toda conta nova (e contas antigas do plano Base) ganha 14 dias com os recursos do Premium. */
export const TRIAL_DAYS = 14;
export const TRIAL_MS = TRIAL_DAYS * 86400000;

/** Dias restantes (arredondado para cima) a partir de trialEndsAt (Timestamp do Firestore, Date ou ms). */
export function trialDaysLeft(trialEndsAt: any, now = Date.now()): number {
  const ms = typeof trialEndsAt === 'number' ? trialEndsAt : trialEndsAt?.toMillis?.() ?? trialEndsAt?.toDate?.()?.getTime?.() ?? null;
  if (ms == null) return 0;
  return Math.max(0, Math.ceil((ms - now) / 86400000));
}
