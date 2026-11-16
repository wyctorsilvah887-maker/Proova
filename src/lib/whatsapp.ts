/**
 * Normaliza um WhatsApp brasileiro para só dígitos com DDI (55).
 * Aceita "(85) 99999-9999", "85999999999", "+55 85 99999-9999". Retorna null se não parecer um número válido.
 */
export function normalizeBrWhatsapp(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let d = input.replace(/\D/g, '');
  if (d.startsWith('0')) d = d.replace(/^0+/, '');
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (!/^55\d{10,11}$/.test(d)) return null;
  return d;
}

export function whatsappLink(number: string, message?: string) {
  const base = `https://wa.me/${number.replace(/\D/g, '')}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** "5585999999999" -> "(85) 99999-9999" para exibir. */
export function formatBrWhatsapp(number: string) {
  const d = number.replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return number;
}

/** Máscara ao digitar: "85999999999" -> "(85) 99999-9999". Aceita colar com +55. */
export function maskBrPhone(value: string) {
  let d = value.replace(/\D/g, '');
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
