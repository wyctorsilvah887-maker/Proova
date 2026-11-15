/** Envia o código de ativação pelo Resend. Nunca lança: erro vai para o log. */
export async function sendClaimCodeEmail(to: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.error('[claim] RESEND_API_KEY não configurada'); return false; }
  const from = process.env.RESEND_FROM || 'Proova AI <no-reply@useproovaai.com.br>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Seu código Proova AI: ${code}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:420px"><h2>Ative seu plano</h2><p>Use o código abaixo no Proova AI para ativar o plano da sua compra. Ele vale por 10 minutos.</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p><p style="color:#666;font-size:12px">Se você não pediu isso, ignore este e-mail.</p></div>`,
      }),
    });
    if (!res.ok) console.error('[claim] Resend recusou:', res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (e) {
    console.error('[claim] falha ao enviar e-mail:', (e as Error).message);
    return false;
  }
}
