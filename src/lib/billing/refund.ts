/** Garantia de 7 dias (Cakto / direito de arrependimento). Lógica pura, testável. */
export const REFUND_WINDOW_DAYS = 7;

export type RefundCheck =
  | { ok: true; windowUnknown: boolean }
  | { ok: false; reason: 'plano_nao_pago' | 'prazo_expirado' };

/**
 * Pode pedir reembolso quem tem plano pago (gold/enterprise) dentro da janela.
 * `planUpdatedAtMs` = quando o webhook ativou o plano. Se não existir (plano antigo ou ativado
 * à mão), o pedido é aceito e marcado para você conferir.
 */
export function checkRefundEligibility(status: string | undefined, planUpdatedAtMs: number | null, nowMs = Date.now()): RefundCheck {
  if (status !== 'gold' && status !== 'enterprise') return { ok: false, reason: 'plano_nao_pago' };
  if (planUpdatedAtMs == null) return { ok: true, windowUnknown: true };
  const days = (nowMs - planUpdatedAtMs) / 86_400_000;
  return days <= REFUND_WINDOW_DAYS ? { ok: true, windowUnknown: false } : { ok: false, reason: 'prazo_expirado' };
}
