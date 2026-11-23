import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { adminDb } from '@/lib/firebase-admin';
import { safeEqual } from '@/lib/reviews/sync';
import { SITE_URL } from '@/lib/site';
import { runRenewalNotices } from '@/lib/plan-renewal';

export const maxDuration = 60;

const PAID = ['gold', 'enterprise', 'trial'];

// Mensagens rotativas (uma por dia da semana) para o lembrete não ficar repetitivo.
const MSGS = [
  { title: '⭐ Já pediu avaliação hoje?', body: 'Quem acabou de ser atendido é quem mais avalia. Envie seu link de coleta agora.' },
  { title: '📲 1 minuto, 1 depoimento', body: 'Mande o link de coleta para o último paciente atendido. Leva menos de 1 minuto para ele responder.' },
  { title: '💬 Prova social não cai do céu', body: 'Peça uma avaliação hoje: copie seu link de coleta e envie no WhatsApp.' },
  { title: '🏆 Seus pacientes confiam em você', body: 'Transforme isso em depoimento. Envie o link de coleta para quem foi atendido hoje.' },
  { title: '🚀 Pequeno hábito, grande reputação', body: 'Todo dia 1 pedido de avaliação. Abra o Proova AI e compartilhe seu link.' },
];

/**
 * Vercel Cron diário, 09h (Fortaleza). Authorization: Bearer CRON_SECRET.
 * Todo dia: avisos de renovação do plano. De segunda a sexta: lembrete de pedir avaliação.
 * (A Hobby só permite 2 crons, por isso as duas tarefas dividem esta rota.)
 */
export async function GET(req: Request) {
  const t0 = Date.now();
  const auth = req.headers.get('authorization') || '';
  if (!safeEqual(auth.replace(/^Bearer /, ''), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let renewals: any = null;
  try { renewals = await runRenewalNotices(t0 + 25_000); } catch (e) { console.error('[cron renewal]', (e as Error).message); }
  // Encerra testes vencidos (rede de segurança: o painel também encerra ao abrir).
  let trialsExpired = 0;
  try {
    const due = await adminDb().collection('users').where('membershipStatus', '==', 'trial').get();
    const now = Timestamp.now().toMillis();
    const over = due.docs.filter((d) => (d.data().trialEndsAt?.toMillis?.() ?? 0) <= now).slice(0, 400);
    await Promise.all(over.map((d) => d.ref.update({ membershipStatus: 'expired', planUpdatedAt: FieldValue.serverTimestamp() })));
    trialsExpired = over.length;
  } catch (e) { console.error('[cron trial]', (e as Error).message); }
  const dow = new Date().getUTCDay(); // 0 = domingo, 6 = sábado
  if (dow === 0 || dow === 6) return NextResponse.json({ ok: true, renewals, reminders: 'weekend_skip', trialsExpired });
  const msg = MSGS[new Date().getUTCDate() % MSGS.length];
  const snap = await adminDb().collection('users').where('membershipStatus', 'in', PAID).get();
  const targets = snap.docs.filter((d) => d.data().reminderPush !== false && !!d.data().companySlug);
  let sent = 0, noTokens = 0, failed = 0;
  const CONC = 10;
  for (let i = 0; i < targets.length; i += CONC) {
    if (Date.now() - t0 > 55_000) break;
    await Promise.all(targets.slice(i, i + CONC).map(async (d) => {
      try {
        const pushRef = adminDb().doc(`user_push/${d.id}`);
        const tokens: string[] = (await pushRef.get()).data()?.tokens || [];
        if (!tokens.length) { noTokens++; return; }
        const res = await getMessaging().sendEachForMulticast({
          tokens,
          data: { ...msg, link: `${SITE_URL}/dash`, tag: 'review-reminder' },
          webpush: { headers: { TTL: '43200' } },
        });
        sent += res.successCount;
        const alive = tokens.filter((_, k) => {
          const code = res.responses[k].error?.code || '';
          return res.responses[k].success || !(code.includes('not-registered') || code.includes('invalid-registration-token') || code.includes('invalid-argument'));
        });
        if (alive.length !== tokens.length) await pushRef.set({ tokens: alive }, { merge: true });
      } catch (e) {
        failed++;
        console.error('[cron reminder]', d.id, (e as Error).message);
      }
    }));
  }
  return NextResponse.json({ ok: true, sent, noTokens, failed, renewals });
}
