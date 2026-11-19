import { Resend } from 'resend';
import { getMessaging } from 'firebase-admin/messaging';
import { adminDb } from '@/lib/firebase-admin';
import { mailFrom } from '@/lib/mail';
import { SITE_URL } from '@/lib/site';
import { escapeHtml } from '@/lib/feedback-alert';

const DAY = 86400000;
const PLAN_NAME: Record<string, string> = { gold: 'Premium', enterprise: 'PRO' };
const FALLBACK_CYCLE_DAYS = 30;

/** Próxima cobrança: a data gravada pelo webhook (planRenewsAt) ou, para quem assinou antes disso, a última cobrança + 30 dias. */
export function renewalDate(u: any): { ms: number; estimated: boolean } | null {
  const exact = u?.planRenewsAt?.toMillis?.();
  if (exact) return { ms: exact, estimated: false };
  const last = u?.planUpdatedAt?.toMillis?.() || u?.planActivatedAt?.toMillis?.();
  return last ? { ms: last + FALLBACK_CYCLE_DAYS * DAY, estimated: true } : null;
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Fortaleza' });
}
function daysWord(n: number) { return n <= 0 ? 'hoje' : n === 1 ? 'amanhã' : `em ${n} dias`; }

async function sendEmail(to: string, plan: string, days: number, dateStr: string, estimated: boolean) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return false;
  try {
    await new Resend(apiKey).emails.send({
      from: mailFrom('Proova AI'),
      to: [to],
      subject: `Sua assinatura Proova AI ${plan} será renovada ${daysWord(days)}`,
      html: `<p>Olá!</p>
<p>Sua assinatura <b>Proova AI ${escapeHtml(plan)}</b> será renovada <b>${daysWord(days)}</b>${estimated ? ' (por volta de ' : ' ('}<b>${dateStr}</b>).</p>
<p>Confira se há saldo ou limite disponível no meio de pagamento cadastrado, para evitar pendências e a interrupção dos recursos do seu plano.</p>
<p><a href="${SITE_URL}/settings" style="background:#f97316;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:bold">Ver minha assinatura</a></p>
<p style="color:#666;font-size:12px">Se você já cancelou a assinatura ou ela foi renovada, desconsidere este aviso. Dúvidas: contato@useproovaai.com.br</p>`,
    });
    return true;
  } catch (e) {
    console.error('[renewal] e-mail', (e as Error).message);
    return false;
  }
}

async function sendPush(uid: string, plan: string, days: number, dateStr: string) {
  try {
    const ref = adminDb().doc(`user_push/${uid}`);
    const tokens: string[] = (await ref.get()).data()?.tokens || [];
    if (!tokens.length) return false;
    const res = await getMessaging().sendEachForMulticast({
      tokens,
      data: {
        title: `💳 Sua assinatura ${plan} renova ${daysWord(days)}`,
        body: `Cobrança prevista para ${dateStr}. Confira o saldo ou limite do seu meio de pagamento para evitar pendências.`,
        link: `${SITE_URL}/settings`,
        tag: 'plan-renewal',
      },
      webpush: { headers: { TTL: '86400' } },
    });
    const alive = tokens.filter((_, i) => {
      const code = res.responses[i].error?.code || '';
      return res.responses[i].success || !(code.includes('not-registered') || code.includes('invalid-registration-token') || code.includes('invalid-argument'));
    });
    if (alive.length !== tokens.length) await ref.set({ tokens: alive }, { merge: true });
    return res.successCount > 0;
  } catch (e) {
    console.error('[renewal] push', (e as Error).message);
    return false;
  }
}

/**
 * Avisa quem tem plano pago que a renovação está chegando: 3 dias antes e de novo 1 dia antes (e-mail + push).
 * Cada ciclo é identificado pela data da cobrança, então não repete aviso; quando o webhook renova, a data muda e o ciclo reinicia.
 */
export async function runRenewalNotices(deadlineMs: number) {
  const out = { checked: 0, notified: 0, skipped: 0 };
  const db = adminDb();
  const snap = await db.collection('users').where('membershipStatus', 'in', ['gold', 'enterprise']).get();
  const now = Date.now();
  for (const d of snap.docs) {
    if (Date.now() > deadlineMs) break;
    const u = d.data();
    out.checked++;
    const r = renewalDate(u);
    if (!r) { out.skipped++; continue; }
    const days = Math.ceil((r.ms - now) / DAY);
    if (days < 0 || days > 3) { out.skipped++; continue; }
    const stage = days <= 1 ? 1 : 3;
    const sameCycle = u.renewalNoticeFor === r.ms;
    if (sameCycle && u.renewalNoticeStage <= stage) { out.skipped++; continue; } // 3 → 1 avisa de novo; mesmo estágio não
    const plan = PLAN_NAME[u.membershipStatus] || 'Proova';
    const dateStr = fmtDate(r.ms);
    const [mailed, pushed] = await Promise.all([
      sendEmail(u.email || '', plan, days, dateStr, r.estimated),
      sendPush(d.id, plan, days, dateStr),
    ]);
    if (mailed || pushed) {
      await d.ref.set({ renewalNoticeFor: r.ms, renewalNoticeStage: stage }, { merge: true });
      out.notified++;
    } else out.skipped++;
  }
  return out;
}
