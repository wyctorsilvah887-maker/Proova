import { Resend } from 'resend';
import { getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { adminDb } from '@/lib/firebase-admin';
import { mailFrom } from '@/lib/mail';
import { SITE_URL } from '@/lib/site';
import { escapeHtml } from '@/lib/feedback-alert';

/**
 * Avisa os administradores que alguém pediu atendimento humano.
 * Destinatários vêm da coleção dedicada `admin_notify` (1 doc por admin: e-mail, preferência e tokens de push),
 * então não é preciso varrer a coleção `users`. Nunca lança: falha de aviso não pode quebrar o ticket.
 */
export async function notifyAdminsNewTicket(opts: { ticketId: string; userName: string; planLabel: string }) {
  try {
    const snap = await adminDb().collection('admin_notify').get();
    const emails = new Set<string>();
    const tokens = new Map<string, string>(); // token -> uid
    snap.forEach((d) => {
      const x = d.data();
      if (x.emailEnabled !== false && typeof x.email === 'string' && x.email.includes('@')) emails.add(x.email.toLowerCase());
      if (x.pushEnabled !== false && Array.isArray(x.pushTokens)) x.pushTokens.forEach((t: unknown) => { if (typeof t === 'string' && t) tokens.set(t, d.id); });
    });
    // Reserva opcional por variável de ambiente (lista separada por vírgula).
    (process.env.SUPPORT_ALERT_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@')).forEach((e) => emails.add(e));

    const link = `${SITE_URL}/${(process.env.ADMIN_PATH || 'admin').replace(/^\/+|\/+$/g, '')}/support`;
    const title = '🎧 Novo pedido de atendimento';
    const body = `${opts.userName} (${opts.planLabel}) quer falar com um atendente.`;

    const tasks: Promise<unknown>[] = [];

    if (emails.size && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const list = [...emails];
      tasks.push(resend.emails.send({
        from: mailFrom('Proova AI Suporte'),
        to: [list[0]],
        ...(list.length > 1 ? { bcc: list.slice(1) } : {}),
        subject: `🎧 ${opts.userName} quer falar com atendente`,
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
          <h2 style="margin:0 0 12px">Novo pedido de atendimento</h2>
          <p><b>${escapeHtml(opts.userName)}</b> (plano <b>${escapeHtml(opts.planLabel)}</b>) abriu um ticket e aguarda um atendente.</p>
          <p style="color:#6b7280;font-size:13px">Protocolo: ${escapeHtml(opts.ticketId)}</p>
          <p><a href="${link}" style="background:#f97316;color:#fff;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">Abrir fila de atendimento</a></p></div>`,
      }).catch((e) => console.error('[support-alert] e-mail', e)));
    }

    if (tokens.size && getApps().length) {
      const list = [...tokens.keys()];
      tasks.push((async () => {
        // Mensagem só de dados: o service worker monta a notificação (evita aviso duplicado em segundo plano).
        const res = await getMessaging().sendEachForMulticast({
          tokens: list,
          data: { title, body, link, tag: `ticket-${opts.ticketId}` },
          webpush: { headers: { Urgency: 'high', TTL: '3600' } },
        });
        // Remove tokens que o navegador já invalidou.
        const dead = new Map<string, string[]>();
        res.responses.forEach((r, i) => {
          const code = r.error?.code || '';
          if (!r.success && (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token') || code.includes('invalid-argument'))) {
            const uid = tokens.get(list[i])!;
            dead.set(uid, [...(dead.get(uid) || []), list[i]]);
          }
        });
        for (const [uid, bad] of dead) {
          const ref = adminDb().doc(`admin_notify/${uid}`);
          const cur = (await ref.get()).data()?.pushTokens || [];
          await ref.set({ pushTokens: cur.filter((t: string) => !bad.includes(t)) }, { merge: true });
        }
      })().catch((e) => console.error('[support-alert] push', e)));
    }

    await Promise.all(tasks);
  } catch (e) {
    console.error('[support-alert]', e);
  }
}
