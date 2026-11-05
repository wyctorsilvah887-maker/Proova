'use server';

import { Resend } from 'resend';
import { initializeFirebase } from '@/firebase';
import { collection, query, getDocs, doc, getDoc, Timestamp, where, orderBy } from 'firebase/firestore';

/**
 * @fileOverview Lógica para geração e envio de relatórios de performance via e-mail.
 * Design atualizado para um padrão executivo de alta performance.
 */
export async function sendWeeklyPerformanceReport(userId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY não configurada.");
    return { success: false, error: "O serviço de e-mail não foi configurado." };
  }

  const { firestore } = initializeFirebase();
  const resend = new Resend(apiKey);

  try {
    const userSnap = await getDoc(doc(firestore, 'users', userId));
    if (!userSnap.exists()) return { success: false, error: "Sua conta não foi localizada." };
    const userData = userSnap.data();

    // Restrição de Plano
    const status = userData.membershipStatus || 'base';
    const isPremium = status === 'gold' || status === 'enterprise' || status === 'trial';
    if (!isPremium) {
      return { success: false, error: "Relatórios avançados disponíveis apenas nos planos Gold e Enterprise." };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentRef = collection(firestore, 'users', userId, 'testimonials');
    const currentSnap = await getDocs(query(
      currentRef, 
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('createdAt', 'desc')
    ));
    const currentDocs = currentSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const previousSnap = await getDocs(query(
      currentRef,
      where('createdAt', '>=', Timestamp.fromDate(fourteenDaysAgo)),
      where('createdAt', '<', Timestamp.fromDate(sevenDaysAgo))
    ));

    const currentCount = currentDocs.length;
    const previousCount = previousSnap.docs.length;

    // Cálculo de Crescimento
    let growth = 0;
    if (previousCount > 0) {
      growth = Math.round(((currentCount - previousCount) / previousCount) * 100);
    } else if (currentCount > 0) {
      growth = 100;
    }

    // Média da Semana
    const sumRating = currentDocs.reduce((acc, t: any) => acc + (t.rating || 0), 0);
    const avgRatingWeek = currentCount > 0 ? (sumRating / currentCount).toFixed(1) : "0.0";

    // Melhor Depoimento
    let topT: any = null;
    if (currentDocs.length > 0) {
      topT = currentDocs.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))[0];
    }

    const userFirstName = userData.name ? userData.name.split(' ')[0] : 'Parceiro';
    
    const { data, error } = await resend.emails.send({
      from: 'Proova Reports <proova@proova.wsstudioscompany.com.br>',
      to: [userData.email],
      subject: `📊 Sumário Executivo: ${userData.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Relatório Proova</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                  
                  <!-- HEADER -->
                  <tr>
                    <td style="background-color: #0f172a; padding: 40px 48px; border-bottom: 4px solid #f97316;">
                      <table width="100%">
                        <tr>
                          <td>
                            <h1 style="color: #ffffff; margin: 0; font-size: 11px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; opacity: 0.6;">Relatório Semanal</h1>
                            <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">${userData.companyName}</p>
                          </td>
                          <td align="right">
                            <span style="display: inline-block; background-color: rgba(249, 115, 22, 0.15); color: #f97316; padding: 6px 12px; border-radius: 8px; font-size: 10px; font-weight: 900; border: 1px solid rgba(249, 115, 22, 0.2);">VIP STATUS</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- INTRO -->
                  <tr>
                    <td style="padding: 48px 48px 24px 48px;">
                      <p style="font-size: 16px; color: #1e293b; font-weight: 600; margin: 0 0 12px 0;">Prezado(a) ${userFirstName},</p>
                      <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">O desempenho da sua marca nos últimos 7 dias foi consolidado. Seus clientes continuam alimentando sua autoridade digital.</p>
                    </td>
                  </tr>

                  <!-- KPI SECTION -->
                  <tr>
                    <td style="padding: 24px 48px;">
                      <table width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="48%" style="background-color: #f1f5f9; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Novas Reviews</p>
                            <p style="margin: 8px 0; font-size: 36px; font-weight: 900; color: #0f172a;">${currentCount}</p>
                            <div style="font-size: 11px; font-weight: 700; color: ${growth >= 0 ? '#059669' : '#dc2626'};">
                              ${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth)}% vs. anterior
                            </div>
                          </td>
                          <td width="4%"></td>
                          <td width="48%" style="background-color: #f1f5f9; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Nota Média</p>
                            <p style="margin: 8px 0; font-size: 36px; font-weight: 900; color: #0f172a;">${avgRatingWeek}</p>
                            <div style="font-size: 11px; font-weight: 700; color: #f97316;">Score Semanal</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- CUMULATIVE STATS -->
                  <tr>
                    <td style="padding: 0 48px 24px 48px;">
                      <div style="background-color: #f8fafc; border-radius: 16px; padding: 16px 24px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Impacto Acumulado</span>
                        <span style="font-size: 14px; font-weight: 800; color: #0f172a;">
                          ${userData.testimonialsCount || 0} Depoimentos • ${userData.googleRedirectCount || 0} G-Clicks
                        </span>
                      </div>
                    </td>
                  </tr>

                  <!-- HIGHLIGHT -->
                  ${topT ? `
                  <tr>
                    <td style="padding: 24px 48px;">
                      <div style="background-color: #fff7ed; border-radius: 24px; padding: 32px; border: 1px solid #fdba74;">
                        <p style="margin: 0 0 16px 0; font-size: 10px; font-weight: 900; color: #ea580c; text-transform: uppercase; letter-spacing: 0.2em;">🏆 Destaque da Semana</p>
                        <p style="margin: 0; font-size: 16px; color: #431407; font-style: italic; line-height: 1.6; font-weight: 500;">"${topT.text}"</p>
                        <p style="margin: 16px 0 0 0; font-size: 13px; font-weight: 700; color: #9a3412;">— ${topT.userName}</p>
                      </div>
                    </td>
                  </tr>` : ''}

                  <!-- INSIGHT -->
                  <tr>
                    <td style="padding: 24px 48px;">
                      <table width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e2e8f0; padding-top: 32px;">
                        <tr>
                          <td style="padding-bottom: 32px;">
                            <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.1em;">Dica do Consultor Proova</h3>
                            <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                              ${currentCount > 0 
                                ? "Seu fluxo de coleta está estável. Considere gerar novos Social Cards para as redes sociais para manter o engajamento em alta." 
                                : "Notamos que não houve novas coletas esta semana. Que tal enviar o seu link de coleta via WhatsApp para os seus últimos 5 clientes?"}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://proova.wsstudioscompany.com.br'}/dash" style="background-color: #f97316; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.25);">Acessar Painel Executivo</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td align="center" style="padding: 48px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Powered by Proova Technology</p>
                      <p style="margin: 8px 0 0 0; font-size: 11px; color: #cbd5e1; font-weight: 500;">© 2026 WS STUDIOS COMPANY. Todos os direitos reservados.</p>
                      <div style="margin-top: 24px;">
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://proova.wsstudioscompany.com.br'}/privacy" style="color: #94a3b8; text-decoration: none; font-size: 10px; font-weight: 700;">Privacidade</a>
                        <span style="color: #cbd5e1; margin: 0 8px;">•</span>
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://proova.wsstudioscompany.com.br'}/terms" style="color: #94a3b8; text-decoration: none; font-size: 10px; font-weight: 700;">Termos</a>
                      </div>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: any) {
    console.error("Falha ao gerar relatório:", err);
    return { success: false, error: err.message };
  }
}
