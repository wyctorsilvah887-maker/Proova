/**
 * Regras puras do webhook da Cakto (sem Firebase), para poderem ser testadas isoladamente.
 * Quem grava no banco é a rota /api/webhook/cakto.
 */

export type Plan = 'gold' | 'enterprise';

type Json = Record<string, any>;

function ids(env: string | undefined): string[] {
  return (env || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/** Todos os identificadores do que foi comprado (produto, oferta, link de checkout). */
function purchaseKeys(data: Json): string[] {
  const keys = [data.product?.id, data.product?.short_id, data.offer?.id, String(data.checkoutUrl || '').split('/').pop()];
  return keys.filter((k) => typeof k === 'string' && k).map((k) => k.toLowerCase());
}

/**
 * Descobre qual plano foi comprado.
 * 1) Pelos IDs configurados nas variáveis CAKTO_PREMIUM_IDS / CAKTO_PRO_IDS
 *    (IDs de produto, de oferta ou o final do link de checkout, ex.: "premium-proova").
 * 2) Se não houver ID configurado, pelo nome do produto/oferta.
 */
export function resolvePlan(data: Json, env: Record<string, string | undefined> = process.env): Plan | null {
  const keys = purchaseKeys(data);
  const lists: Array<[Plan, string[]]> = [
    ['enterprise', ids(env.CAKTO_PRO_IDS || env.CAKTO_ENTERPRISE_IDS)],
    ['gold', ids(env.CAKTO_PREMIUM_IDS || env.CAKTO_GOLD_IDS)],
  ];
  for (const [plan, list] of lists) if (keys.some((k) => list.includes(k))) return plan;

  const name = `${data.product?.name || ''} ${data.offer?.name || ''}`.toLowerCase();
  if (/\benterprise\b|\bpro\b/.test(name)) return 'enterprise';
  if (/\bpremium\b|\bgold\b/.test(name)) return 'gold';
  return null;
}

export type Decision =
  | { action: 'activate'; plan: Plan }
  | { action: 'deactivate'; plan: Plan }
  | { action: 'ignore'; reason: string };

const PAID = ['paid', 'approved', 'authorized'];

/** Decide o que fazer com o plano do usuário a partir do evento. `currentStatus` = plano atual dele. */
export function decide(event: string, data: Json, currentStatus: string | undefined, env: Record<string, string | undefined> = process.env): Decision {
  const plan = resolvePlan(data, env);
  if (!plan) return { action: 'ignore', reason: 'produto_desconhecido' };

  switch (event) {
    case 'purchase_approved':
      return PAID.includes(String(data.status || '').toLowerCase())
        ? { action: 'activate', plan }
        : { action: 'ignore', reason: 'compra_nao_paga' };
    case 'subscription_renewed':
      return { action: 'activate', plan };
    case 'refund':
    case 'chargeback':
    case 'subscription_canceled':
      // Só tira o plano se o usuário ainda está nele (não derruba quem já migrou para outro).
      return currentStatus === plan
        ? { action: 'deactivate', plan }
        : { action: 'ignore', reason: 'plano_atual_diferente' };
    default:
      return { action: 'ignore', reason: 'evento_sem_acao' };
  }
}

/** E-mail e ID do usuário vindos do payload. */
export function customerOf(data: Json): { email: string | null; uid: string | null } {
  const email = typeof data.customer?.email === 'string' ? data.customer.email.trim() : '';
  const uid = [data.external_id, data.ext_id, data.sck].find((v) => typeof v === 'string' && v.trim());
  return { email: email || null, uid: uid ? String(uid).trim() : null };
}
