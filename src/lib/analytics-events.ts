/** Eventos do funil de aquisição e ativação (analytics próprio, sem cookies de terceiros). */
export const FUNNEL = [
  { id: 'landing_view', label: 'Visitou a página inicial', side: 'client' },
  { id: 'signup_click', label: 'Clicou em "Criar conta"', side: 'client' },
  { id: 'signup_view', label: 'Abriu o cadastro', side: 'client' },
  { id: 'signup_done', label: 'Concluiu o cadastro', side: 'client' },
  { id: 'link_copied', label: 'Copiou o link de coleta (ativação)', side: 'client' },
  { id: 'first_feedback', label: 'Recebeu a 1ª avaliação', side: 'server' },
] as const;

export type EventId = (typeof FUNNEL)[number]['id'] | 'pricing_view' | 'checkout_click';
export const CLIENT_EVENTS: string[] = [...FUNNEL.filter((f) => f.side === 'client').map((f) => f.id), 'pricing_view', 'checkout_click'];
