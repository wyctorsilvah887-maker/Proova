/** Remetente único dos e-mails do sistema (domínio verificado no Resend). Troque pela env RESEND_FROM_ADDRESS se precisar. */
const ADDRESS = process.env.RESEND_FROM_ADDRESS || 'contato@useproovaai.com.br';

export function mailFrom(label: string) {
  return `${label} <${ADDRESS}>`;
}
