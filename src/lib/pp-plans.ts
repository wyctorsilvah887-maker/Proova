/**
 * O que cada plano libera na página pública e no editor (uma única fonte da verdade).
 * Internamente: gold = Premium, enterprise = PRO, trial = Premium durante o teste.
 * O editor usa isto para bloquear; a página pública usa o plano ATUAL do dono para exibir,
 * então quem faz downgrade deixa de exibir os recursos bloqueados (sem apagar o que configurou).
 */

export type PPPlan = 'free' | 'premium' | 'pro';

export function ppPlanOf(membershipStatus?: string | null): PPPlan {
  if (membershipStatus === 'enterprise') return 'pro';
  if (membershipStatus === 'gold' || membershipStatus === 'trial') return 'premium';
  return 'free';
}

export const PLAN_LABEL: Record<PPPlan, string> = { free: 'Gratuito', premium: 'Premium', pro: 'PRO' };

export type PPCaps = {
  plan: PPPlan;
  selectionLimit: number;      // depoimentos exibidos
  layouts: string[];           // layouts de depoimentos
  secondaryColor: boolean;
  whatsappButton: boolean;
  externalSite: boolean;
  removeBranding: boolean;     // pode ocultar "Powered by Proova"
  customSlug: boolean;
  customSections: number;      // seções de texto livres
  blocks: { about: boolean; hours: boolean; socials: boolean; faq: boolean; map: boolean };
  faqLimit: number;
  reorder: boolean;
};

const ALL_LAYOUTS = ['grid', 'mural', 'carousel', 'popup'];

export function ppCaps(plan: PPPlan): PPCaps {
  if (plan === 'pro') {
    return {
      plan, selectionLimit: Infinity, layouts: ALL_LAYOUTS, secondaryColor: true, whatsappButton: true, externalSite: true,
      removeBranding: true, customSlug: true, customSections: 20,
      blocks: { about: true, hours: true, socials: true, faq: true, map: true }, faqLimit: 8, reorder: true,
    };
  }
  if (plan === 'premium') {
    return {
      plan, selectionLimit: 50, layouts: ALL_LAYOUTS, secondaryColor: true, whatsappButton: true, externalSite: true,
      removeBranding: false, customSlug: true, customSections: 3,
      blocks: { about: true, hours: true, socials: true, faq: true, map: true }, faqLimit: 5, reorder: true,
    };
  }
  return {
    plan, selectionLimit: 5, layouts: ['grid'], secondaryColor: false, whatsappButton: false, externalSite: false,
    removeBranding: false, customSlug: false, customSections: 0,
    blocks: { about: true, hours: true, socials: false, faq: false, map: false }, faqLimit: 0, reorder: false,
  };
}

/** Respostas geradas por IA por mês (custo de Gemini sob controle): curta no gratuito, generosa para quem paga. */
export const AI_MONTHLY_LIMIT: Record<PPPlan, number> = { free: 20, premium: 300, pro: 1000 };
