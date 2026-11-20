import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

/** Dia no fuso do negócio (America/Fortaleza), no formato AAAA-MM-DD. */
export function dayKey(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

const safe = (s: string) => (s || 'direto').toLowerCase().replace(/[^a-z0-9_\-:]/g, '-').slice(0, 40) || 'direto';

/**
 * Soma 1 ao contador diário do evento. `uniq` conta o visitante único do dia (o navegador só manda 1x/dia/evento).
 * Também guarda o total por origem (utm/referrer) para ver de onde vem cada etapa.
 */
export async function bumpEvent(event: string, source: string, uniq: boolean, cta?: string) {
  const inc = FieldValue.increment(1);
  const s = safe(source);
  const update: Record<string, unknown> = { ev: { [event]: { total: inc, ...(uniq ? { uniq: inc } : {}) } } };
  if (uniq) update.src = { [s]: { [event]: inc } };
  if (cta) update.cta = { [event]: { [safe(cta)]: inc } }; // cliques por botão (total, não único)
  await adminDb().doc(`analytics_daily/${dayKey()}`).set(update, { merge: true });
}
