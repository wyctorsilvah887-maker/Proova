import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase-admin';
import { mailFrom } from '@/lib/mail';
import { SITE_URL } from '@/lib/site';
import { escapeHtml } from '@/lib/feedback-alert';

const DAY = 86400000;
const MAX_AGE_DAYS = 14; // contas antigas sem plano não recebem lembrete

const STAGES = [
  { stage: 1, minDays: 1, subject: 'Falta só escolher seu plano no Proova AI', lead: 'Sua conta no Proova AI foi criada, mas ainda não está ativa.' },
  { stage: 2, minDays: 3, subject: 'Ainda dá tempo: 7 dias de garantia no Proova AI', lead: 'Sua conta continua esperando a ativação do plano.' },
] as const;

async function send(to: string, name: string, s: (typeof STAGES)[number]) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return false;
  try {
    await new Resend(apiKey).emails.send({
      from: mailFrom('Proova AI'),
      to: [to],
      subject: s.subject,
      html: `<p>Olá${name ? `, ${escapeHtml(name.split(' ')[0])}` : ''}!</p>
<p>${s.lead} Para colocar seu link de coleta e sua página pública no ar, escolha o plano Premium ou PRO.</p>
<p><b>Garantia de 7 dias:</b> se não gostar, devolvemos 100% do valor.</p>
<p><a href="${SITE_URL}/pricing" style="background:#f97316;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:bold">Escolher meu plano</a></p>
<p style="color:#666;font-size:12px">Pague com o mesmo e-mail desta conta (${escapeHtml(to)}) para ativar na hora. Se não quiser mais receber lembretes, responda este e-mail. Dúvidas: contato@useproovaai.com.br</p>`,
    });
    return true;
  } catch (e) {
    console.error('[pay-nudge] e-mail', (e as Error).message);
    return false;
  }
}

/** Lembra, por e-mail, quem criou a conta (Google/e-mail) e ainda não assinou: 1 dia e 3 dias depois. */
export async function runPayNudges(deadlineMs: number) {
  const snap = await adminDb().collection('users').where('membershipStatus', '==', 'base').limit(500).get();
  const now = Date.now();
  let sent = 0;
  for (const d of snap.docs) {
    if (Date.now() > deadlineMs) break;
    const u = d.data();
    const created = u.createdAt?.toMillis?.();
    if (!created || u.isAdmin === true || !u.email) continue;
    const ageDays = (now - created) / DAY;
    if (ageDays > MAX_AGE_DAYS) continue;
    const done = u.payNudgeStage || 0;
    const next = STAGES.find((s) => s.stage > done && ageDays >= s.minDays);
    if (!next) continue;
    if (await send(u.email, u.name || '', next)) {
      await d.ref.update({ payNudgeStage: next.stage, payNudgeAt: new Date() });
      sent++;
    }
  }
  return { checked: snap.size, sent };
}
