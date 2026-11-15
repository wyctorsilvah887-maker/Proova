import { Resend } from 'resend';
import { SITE_URL } from '@/lib/site';

export function escapeHtml(s: string) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/**
 * Alerta ao dono da clínica sobre feedback crítico (nota baixa) ou contato deixado pelo cliente.
 * Nunca lança: falha de e-mail não pode derrubar o envio do depoimento.
 */
export async function sendFeedbackAlert(opts: {
  ownerEmail?: string;
  companyName: string;
  clientName: string;
  rating: number;
  text?: string;
  clientEmail?: string;
  clientContact?: string;
  kind: 'new' | 'contact';
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !opts.ownerEmail) return;
  try {
    const resend = new Resend(apiKey);
    const lines: string[] = [];
    if (opts.kind === 'new') {
      lines.push(`<p>Você recebeu um feedback de <b>${opts.rating} estrela(s)</b> de <b>${escapeHtml(opts.clientName)}</b>.</p>`);
      if (opts.text?.trim()) lines.push(`<blockquote style="margin:12px 0;padding:8px 14px;border-left:3px solid #f97316;color:#444">${escapeHtml(opts.text)}</blockquote>`);
    } else {
      lines.push(`<p><b>${escapeHtml(opts.clientName)}</b> (${opts.rating} estrela(s)) deixou um contato para a clínica retornar.</p>`);
    }
    if (opts.clientContact) lines.push(`<p><b>Contato deixado agora:</b> ${escapeHtml(opts.clientContact)}</p>`);
    if (opts.clientEmail) lines.push(`<p><b>E-mail informado:</b> ${escapeHtml(opts.clientEmail)}</p>`);
    if (opts.kind === 'new' && !opts.clientContact && !opts.clientEmail) {
      lines.push('<p style="color:#666">O cliente não deixou contato. Se ele pedir retorno, você será avisado por e-mail.</p>');
    }
    lines.push(`<p><a href="${SITE_URL}/dash" style="background:#f97316;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:bold">Abrir painel e responder</a></p>`);
    await resend.emails.send({
      from: 'Proova Alerts <proova@proova.wsstudioscompany.com.br>',
      to: [opts.ownerEmail],
      subject: opts.kind === 'new'
        ? `⚠️ Feedback crítico recebido - ${opts.companyName}`
        : `📞 Cliente deixou contato - ${opts.companyName}`,
      html: lines.join(''),
    });
  } catch (err) {
    console.error('[feedback-alert]', err);
  }
}
