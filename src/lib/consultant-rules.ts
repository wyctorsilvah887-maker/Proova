/**
 * @fileOverview Motor de Regras Estratégicas do Proova (Não-IA).
 * Mapeia centenas de variações de palavras-chave para respostas técnicas e conversacionais precisas.
 */

export const CONSULTANT_DICTIONARY = [
  // 1. SAUDAÇÕES E CONVERSAÇÃO BÁSICA
  {
    keys: ['olá', 'ola', 'oi', 'oie', 'bom dia', 'boa tarde', 'boa noite', 'opa', 'eai', 'tudo bem', 'ajuda', 'ajudar', 'como funciona', 'iniciar', 'começar'],
    response: "Olá! Eu sou o **Consultor Proova**. Estou aqui para ajudar sua marca a dominar o mercado através da prova social estratégica. Como posso ser útil hoje? \n\nVocê pode me perguntar sobre: **G-Boost**, **Mural**, **Inbox Privado**, **Página Pública**, **Social Cards** ou **Planos**."
  },
  {
    keys: ['obrigado', 'obrigada', 'valeu', 'vlw', 'entendi', 'perfeito', 'show', 'top', 'tchau', 'tchau', 'até logo', 'ate logo'],
    response: "Disponha! Estou sempre à disposição para acelerar o crescimento da sua autoridade digital. Se precisar de mais alguma coisa, é só chamar. Boas vendas! 🚀"
  },

  // 2. G-BOOST (GOOGLE MAPS SEO)
  {
    keys: ['gboost', 'g-boost', 'google', 'maps', 'local', 'seo', 'rank', 'ranking', 'perfil da empresa', 'business', 'gmb', 'redirecionamento', 'estrela', '5 estrelas', 'cinco estrelas', 'avaliacao google', 'avaliação google'],
    response: "O **G-Boost** é o nosso motor de aceleração de SEO Local. \n\n**Como funciona:** Ele detecta automaticamente quando um cliente te dá 5 estrelas no Proova e abre um convite especial para que ele replique esse elogio no seu perfil do Google Maps. \n\n**Resultado:** Isso aumenta drasticamente sua posição nas buscas do Google, fazendo sua empresa aparecer na frente dos concorrentes da região!"
  },

  // 3. REPUTATION SHIELD (INBOX PRIVADO)
  {
    keys: ['shield', 'reputacao', 'reputação', 'privado', 'inbox', 'critica', 'crítica', 'negativo', 'ruim', 'insatisfeito', 'blindagem', 'proteção', 'proteger', 'esconder', 'filtro', 'segurança', 'conciliação'],
    response: "O **Reputation Shield** é a sua blindagem digital. \n\n**Estratégia:** Quando um cliente avalia sua empresa com 1 a 3 estrelas, o sistema incentiva que ele envie o comentário para o seu **Inbox Privado**. \n\n**Vantagem:** Isso evita que uma frustração momentânea vire uma reclamação pública no Google. Você resolve o problema do cliente internamente e preserva sua imagem imaculada para o mercado."
  },

  // 4. PÁGINA PÚBLICA (LINK IN BIO)
  {
    keys: ['pagina', 'página', 'bio', 'pp', 'link', 'vitrine', 'perfil', 'bio do insta', 'instagram link', 'pp profissional', 'slug', 'url personalizada', 'minha pagina', 'minha página'],
    response: "Sua **Página Pública (PP)** é a sua vitrine de autoridade máxima. \n\n**Uso ideal:** Coloque este link na sua 'Bio do Instagram'. \n\n**Diferencial:** Ao contrário de um link comum, a PP do Proova é otimizada para conversão, exibindo seus melhores depoimentos e facilitando o contato direto via WhatsApp. É a prova social trabalhando 24h por dia para você."
  },

  // 5. WIDGETS E MURAIS (PARA O SITE)
  {
    keys: ['mural', 'widget', 'site', 'embutir', 'carrossel', 'grid', 'grade', 'masonry', 'layout', 'iframe', 'codigo', 'código', 'instalar', 'colocar no site', 'vendas', 'landing page', 'lp'],
    response: "Os **Widgets** são os murais inteligentes que você instala no seu site oficial. \n\n**Formatos:** Você pode escolher entre layouts de Grade, Mural Masonry, Carrossel ou até Popups. \n\n**Dica:** Instale o mural logo abaixo do seu botão de vendas para reduzir a resistência de compra do seu cliente no momento decisivo."
  },

  // 6. SOCIAL CARDS (CONTEÚDO VIRAL)
  {
    keys: ['social', 'card', 'instagram', 'story', 'post', 'arte', 'compartilhar', 'gerar imagem', 'imagem de depoimento', 'feed', 'marketing', 'divulgar', 'propaganda', 'banner'],
    response: "Os **Social Cards** são a ferramenta perfeita para seu marketing diário. \n\n**Funcionalidade:** Com um clique, transformamos qualquer depoimento em uma arte profissional no formato de Story ou Post. \n\n**Efeito:** Postar elogios de clientes reais gera o 'Efeito Manada', atraindo novas pessoas que querem ter a mesma experiência positiva."
  },

  // 7. AUTO-PUBLISH (AUTOMAÇÃO)
  {
    keys: ['auto-publish', 'autopublish', 'publicar', 'automatico', 'automático', 'regras', 'configurar regra', 'filtro de postagem', 'postagem automatica'],
    response: "O **Auto-Publish** é a gestão 'mãos-livres' da sua prova social (Recurso Gold/Enterprise). \n\n**Como funciona:** Você define uma nota mínima (ex: 5 estrelas) e o sistema publica o depoimento automaticamente no seu site e página pública, sem você precisar clicar em nada. É a sua autoridade crescendo no piloto automático."
  },

  // 8. PLANOS E UPGRADES
  {
    keys: ['plano', 'preço', 'valor', 'upgrade', 'gold', 'enterprise', 'pago', 'trial', 'assinar', 'assinatura', 'pagamento', 'cartão', 'comprar', 'custo', 'beneficio', 'grátis', 'gratis'],
    response: "Temos níveis de estratégia para cada momento do seu negócio: \n\n1. **Base (Grátis):** Ideal para quem está começando.\n2. **Gold (R$ 49,90/mês):** Ativa o G-Boost (Google Maps), Auto-Publish e Editor VIP.\n3. **Enterprise (R$ 97/mês):** O nível elite. Inclui Vídeo Reviews 4K e suporte VIP dedicado. \n\nAcesse a aba **'Upgrade'** no seu painel para ver todos os detalhes!"
  },

  // 9. VÍDEO REVIEWS (ENTREPRISE)
  {
    keys: ['video', 'vídeo', 'camera', 'câmera', 'review', 'vlog', '4k', 'gravar depoimento', 'video depoimento', 'depoimento em video', 'depoimento em vídeo'],
    response: "Os **Vídeo Reviews** são o 'Ouro Digital' da prova social (Exclusivo Enterprise). \n\n**Poder:** Um vídeo de um cliente satisfeito gera 10x mais confiança que um texto. \n\n**Dica Estratégica:** Ofereça um mimo ou café VIP para clientes que aceitarem gravar um depoimento rápido pelo celular. Isso converte muito mais!"
  },

  // 10. SETUP E CONFIGURAÇÃO
  {
    keys: ['configurar', 'setup', 'passo a passo', 'ajustar', 'arrumar', 'começo', 'inicio', 'primeiros passos', 'onde vou', 'não sei o que fazer', 'tutorial', 'guia'],
    response: "Para dominar o sistema rapidamente, siga as **Missões de Sucesso** no topo do seu Dashboard: \n\n1. Defina sua Localização.\n2. Vincule seu Google Maps.\n3. Envie seu primeiro Link de Coleta.\n4. Crie seu primeiro Mural.\n\nSe precisar de algo específico, me pergunte sobre um desses termos!"
  }
];

export function getConsultantResponse(message: string): string {
  const input = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  
  // Procura por match no dicionário
  for (const entry of CONSULTANT_DICTIONARY) {
    if (entry.keys.some(key => {
      const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      return input.includes(normalizedKey);
    })) {
      return entry.response;
    }
  }

  // Resposta padrão aprimorada (Fallback Estratégico)
  return "Interessante sua dúvida! Para que eu possa ser mais preciso e estratégico, tente usar termos-chave como:\n\n• **G-Boost** (Google Maps SEO)\n• **Inbox Privado** (Filtro de Críticas)\n• **Página Pública** (Link da Bio)\n• **Widgets** (Murais para o Site)\n• **Social Cards** (Posts Instagram)\n• **Planos** (Upgrade Gold/Enterprise)\n\nSe for algo muito específico sobre sua conta, aguarde que um consultor humano analisará seu histórico de mensagens em breve.";
}
