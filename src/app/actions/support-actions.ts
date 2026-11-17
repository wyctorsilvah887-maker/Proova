
'use server';

import { SITE_URL } from '@/lib/site';
import { mailFrom } from '@/lib/mail';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/feedback-alert';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

/**
 * Notifica o usuário (e-mail + push) que um consultor humano entrou no chat.
 * Só administradores podem disparar: o ID token do admin é verificado no servidor.
 */
export async function notifySupportPresence(targetUserId: string, adminIdToken: string) {
  try {
    const uid = (await adminAuth().verifyIdToken(adminIdToken)).uid;
    const adminSnap = await adminDb().doc(`users/${uid}`).get();
    if (adminSnap.data()?.isAdmin !== true) return { success: false, error: 'forbidden' };
  } catch {
    return { success: false, error: 'unauthorized' };
  }
  if (!targetUserId || targetUserId.includes('/')) return { success: false };

  try {
    const userSnap = await adminDb().doc(`users/${targetUserId}`).get();
    if (!userSnap.exists) return { success: false };
    const userData = userSnap.data()!;
    const userEmail = userData.email as string | undefined;
    const userName = escapeHtml(userData.name || 'Parceiro');

    // Push (segundo plano): só dados, o service worker monta a notificação.
    try {
      const pushRef = adminDb().doc(`user_push/${targetUserId}`);
      const tokens: string[] = (await pushRef.get()).data()?.tokens || [];
      if (tokens.length) {
        const res = await getMessaging().sendEachForMulticast({
          tokens,
          data: { title: '🎧 Um atendente entrou no seu chat', body: 'Volte ao Proova AI para conversar em tempo real.', link: `${SITE_URL}/support`, tag: 'support-presence' },
          webpush: { headers: { Urgency: 'high', TTL: '3600' } },
        });
        const alive = tokens.filter((_, i) => {
          const code = res.responses[i].error?.code || '';
          return res.responses[i].success || !(code.includes('not-registered') || code.includes('invalid-registration-token') || code.includes('invalid-argument'));
        });
        if (alive.length !== tokens.length) await pushRef.set({ tokens: alive }, { merge: true });
      }
    } catch (e) {
      console.error('[support-presence] push', e);
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !userEmail) return { success: true };
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: mailFrom('Proova AI Suporte'),
      to: [userEmail],
      subject: '🎧 Um consultor humano entrou no seu chat!',
      html: `
        <div style="font-family: sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #f97316; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">ATENDIMENTO HUMANO ATIVO</h1>
          </div>
          <div style="padding: 32px;">
            <p>Olá, <strong>${userName}</strong>,</p>
            <p>Um de nossos especialistas estratégicos acaba de entrar no seu chat de suporte para te ajudar com sua solicitação.</p>
            <p>Retorne ao aplicativo agora para conversar em tempo real.</p>
            <div style="text-align: center; margin-top: 32px;">
              <a href="${SITE_URL}/support" style="background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Ir para o Chat de Suporte</a>
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
            Equipe Proova Technology
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    console.error("Falha ao notificar presença de suporte:", err);
    return { success: false };
  }
}
