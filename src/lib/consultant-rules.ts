/**
 * @fileOverview Motor de Regras Estratégicas do Proova (Não-IA).
 * Mapeia palavras-chave para respostas técnicas precisas.
 */

export const CONSULTANT_DICTIONARY = [
  {
    keys: ['gboost', 'g-boost', 'google', 'maps', 'local', 'seo', 'rank'],
    response: "O **G-Boost** é o nosso sistema de aceleração de SEO Local. Ele detecta elogios 5 estrelas e convida o cliente a avaliar no Google Maps automaticamente. Isso aumenta sua visibilidade e autoridade nas buscas da sua região!"
  },
  {
    keys: ['shield', 'reputacao', 'reputação', 'privado', 'inbox', 'critica', 'crítica', 'negativo'],
    response: "O **Reputation Shield** é o seu filtro de segurança. Feedbacks de 1 a 3 estrelas são incentivados a ir para o seu **Inbox Privado**, permitindo que você resolva conflitos internamente antes que eles virem uma reclamação pública no Google."
  },
  {
    keys: ['pagina', 'página', 'bio', 'pp', 'link', 'vitrine', 'perfil'],
    response: "Sua **Página Pública (PP)** é a sua vitrine oficial para o 'Link da Bio'. Ela reúne seus melhores depoimentos aprovados em uma interface de alta performance projetada especificamente para converter seguidores em clientes."
  },
  {
    keys: ['mural', 'widget', 'site', 'embutir', 'carrossel', 'grid', 'grade', 'masonry'],
    response: "Os **Widgets** são murais embutíveis para o seu site oficial. Você pode criar vários murais (Ex: Home, Vendas, Checkout) e escolher entre layouts Masonry, Carrossel ou Grade para exibir sua prova social onde importa."
  },
  {
    keys: ['social', 'card', 'instagram', 'story', 'post', 'arte', 'compartilhar'],
    response: "Os **Social Cards** transformam qualquer depoimento em uma arte profissional para Instagram com um clique. É a ferramenta perfeita para atrair novos clientes provando que você já resolveu o problema de outras pessoas."
  },
  {
    keys: ['auto-publish', 'autopublish', 'publicar', 'automatico', 'automático', 'regras'],
    response: "O **Auto-Publish** (exclusivo Gold/Enterprise) publica automaticamente elogios que atingem sua nota mínima e tamanho de texto. É a gestão 'mãos-livres' da sua prova social."
  },
  {
    keys: ['plano', 'preço', 'valor', 'upgrade', 'gold', 'enterprise', 'pago', 'trial', 'assinar'],
    response: "Para dominar o mercado, recomendo os planos **Gold** (G-Boost + Auto-Publish) ou **Enterprise** (Vídeo Reviews + Suporte VIP). Você pode ver todos os detalhes e assinar na aba 'Upgrade' no menu lateral."
  },
  {
    keys: ['video', 'vídeo', 'camera', 'câmera', 'review'],
    response: "Os **Vídeo Reviews** (exclusivo Enterprise) são o 'Ouro Digital'. Eles geram 10x mais confiança que texto. Você pode oferecer um café ou bônus para clientes que gravarem um depoimento rápido via Proova."
  },
  {
    keys: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'ajuda', 'ajudar', 'como funciona'],
    response: "Olá! Eu sou o **Consultor Proova**. Como posso ajudar sua marca a dominar o mercado hoje? Você pode me perguntar sobre: G-Boost, Widgets, Inbox Privado, Planos ou como coletar mais depoimentos."
  }
];

export function getConsultantResponse(message: string): string {
  const input = message.toLowerCase();
  
  // Procura por match no dicionário
  for (const entry of CONSULTANT_DICTIONARY) {
    if (entry.keys.some(key => input.includes(key))) {
      return entry.response;
    }
  }

  // Resposta padrão caso não encontre palavra-chave
  return "Interessante sua dúvida! Para que eu possa ser mais preciso, tente usar termos como 'G-Boost', 'Widgets', 'Planos' ou 'Social Cards'. Se for algo muito específico, aguarde que um consultor humano analisará seu histórico em breve.";
}
