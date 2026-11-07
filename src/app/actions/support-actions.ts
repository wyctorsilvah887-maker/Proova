
'use server';

import { Resend } from 'resend';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Notifica o usuário por e-mail que um consultor humano entrou no chat.
 */
export async function notifySupportPresence(targetUserId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "Serviço de e-mail não configurado." };

  const { firestore } = initializeFirebase();
  const resend = new Resend(apiKey);

  try {
    const userSnap = await getDoc(doc(firestore, 'users', targetUserId));
    if (!userSnap.exists()) return { success: false };

    const userData = userSnap.data();
    const userEmail = userData.email;
    const userName = userData.name || 'Parceiro';

    if (!userEmail) return { success: false };

    await resend.emails.send({
      from: 'Proova Suporte <proova@proova.wsstudioscompany.com.br>',
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
              <a href="https://proova.wsstudioscompany.com.br/support" style="background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Ir para o Chat de Suporte</a>
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
