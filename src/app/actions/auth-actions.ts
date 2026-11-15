
'use server';

import { mailFrom } from '@/lib/mail';
import { Resend } from 'resend';

/**
 * Envia um e-mail de recuperação de senha personalizado via Resend.
 * @param email - E-mail do destinatário.
 * @param resetLink - Link de redefinição (gerado pelo Firebase ou apontando para sua rota de reset).
 */
export async function sendResetPasswordEmail(email: string, resetLink: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("ERRO: RESEND_API_KEY não configurada no ambiente.");
    return { 
      success: false, 
      error: "O serviço de e-mail ainda não foi configurado pelo administrador (Variável RESEND_API_KEY ausente)." 
    };
  }

  try {
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: mailFrom('Proova AI'),
      to: [email],
      subject: '🔑 Redefinição de Senha - Proova',
      html: `
        <div style="font-family: 'Inter', sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #f97316; padding: 32px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">PROOVA</h1>
          </div>
          <div style="padding: 40px 32px;">
            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-top: 0;">Recuperação de Senha</h2>
            <p style="line-height: 1.6; color: #4b5563;">Olá,</p>
            <p style="line-height: 1.6; color: #4b5563;">Recebemos uma solicitação para redefinir a senha da sua conta no Proova. Se você não solicitou isso, ignore este e-mail.</p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetLink}" style="background-color: #f97316; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);">Redefinir Minha Senha</a>
            </div>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">O link expirará em breve por motivos de segurança.</p>
          </div>
          <div style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2026 Proova. Todos os direitos reservados.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("Falha crítica ao enviar e-mail:", err);
    return { success: false, error: "Ocorreu um erro ao processar o envio." };
  }
}
