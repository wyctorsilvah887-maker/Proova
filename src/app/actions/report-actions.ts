
'use server';

import { Resend } from 'resend';
import { initializeFirebase } from '@/firebase';
import { collection, query, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';

/**
 * @fileOverview Lógica para geração e envio de relatórios de performance via e-mail.
 * Totalmente index-safe.
 */
export async function sendWeeklyPerformanceReport(userId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY não configurada.");
    return { success: false, error: "O serviço de e-mail não foi configurado (Falta a RESEND_API_KEY)." };
  }

  const { firestore } = initializeFirebase();
  const resend = new Resend(apiKey);

  try {
    const userSnap = await getDoc(doc(firestore, 'users', userId));
    if (!userSnap.exists()) return { success: false, error: "Sua conta não foi localizada." };
    const userData = userSnap.data();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const testimonialsRef = collection(firestore, 'users', userId, 'testimonials');
    const allSnap = await getDocs(testimonialsRef);
    const allDocs = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const currentDocs = allDocs.filter((d: any) => {
      const dt = d.createdAt?.toDate?.() || new Date(0);
      return dt >= sevenDaysAgo;
    });

    const previousDocs = allDocs.filter((d: any) => {
      const dt = d.createdAt?.toDate?.() || new Date(0);
      return dt >= fourteenDaysAgo && dt < sevenDaysAgo;
    });

    const currentCount = currentDocs.length;
    const previousCount = previousDocs.length;

    let growth = 0;
    if (previousCount > 0) {
      growth = Math.round(((currentCount - previousCount) / previousCount) * 100);
    } else if (currentCount > 0) {
      growth = 100;
    }

    let topT = null;
    if (currentDocs.length > 0) {
      const sorted = [...currentDocs].sort((a: any, b: any) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      topT = sorted[0];
    }

    const userFirstName = userData.name ? userData.name.split(' ')[0] : 'Parceiro';
    
    const { data, error } = await resend.emails.send({
      from: 'Proova Reports <proova@proova.wsstudioscompany.com.br>',
      to: [userData.email],
      subject: `📊 Relatório de Performance: ${userData.companyName}`,
      html: `
        <div style="font-family: sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #f97316; padding: 48px 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Proova Analytics</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px; font-weight: 600;">Sua Prova Social em Números</p>
          </div>
          <div style="padding: 40px 32px;">
            <p style="font-size: 18px; color: #111827; font-weight: 700; margin-bottom: 8px;">Olá, ${userFirstName}!</p>
            <p style="line-height: 1.6; color: #4b5563; margin-bottom: 32px;">Seus clientes continuam espalhando confiança. Veja como foi o desempenho da <strong>${userData.companyName}</strong> nos últimos 7 dias:</p>
            <div style="background-color: #f9fafb; border-radius: 20px; padding: 32px; text-align: center; border: 1px solid #f3f4f6; margin-bottom: 32px;">
              <p style="margin: 0; font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Novos Depoimentos</p>
              <p style="margin: 12px 0; font-size: 48px; font-weight: 900; color: #111827;">${currentCount}</p>
              <div style="display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 99px; background-color: ${growth >= 0 ? '#ecfdf5' : '#fef2f2'};">
                <span style="font-size: 13px; font-weight: 800; color: ${growth >= 0 ? '#059669' : '#dc2626'};">
                  ${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth)}% em relação à semana passada
                </span>
              </div>
            </div>
            ${topT ? `<div style="border-left: 4px solid #f97316; padding: 24px; background-color: #fff7ed; border-radius: 0 16px 16px 0; margin-bottom: 32px;">
                <p style="margin: 0 0 12px 0; font-size: 10px; font-weight: 800; color: #ea580c; text-transform: uppercase;">🏆 Destaque da Semana</p>
                <p style="margin: 0; font-size: 15px; color: #431407; font-style: italic; line-height: 1.6;">"${topT.text}"</p>
                <p style="margin: 12px 0 0 0; font-size: 13px; font-weight: 700; color: #9a3412;">— ${topT.userName}</p>
              </div>` : ''}
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://proova.wsstudioscompany.com.br'}/dash" style="background-color: #111827; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 15px; display: inline-block;">Ver Painel Completo</a>
            </div>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 11px; color: #9ca3af; margin: 0; font-weight: 600;">© 2026 PROOVA TECHNOLOGY.</p>
          </div>
        </div>
      `,
    });

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: any) {
    console.error("Falha ao gerar relatório:", err);
    return { success: false, error: err.message };
  }
}
