/**
 * @fileOverview Motor de Árvore de Decisão do Consultor Proova (Não-IA).
 * Estrutura hierárquica para guiar o usuário através das ferramentas da plataforma.
 */

interface TreeBranch {
  title: string;
  response: string;
  keys: string[];
}

export const CONSULTANT_TREE: Record<string, TreeBranch> = {
  '1': {
    title: 'G-Boost (SEO Google)',
    keys: ['1', 'gboost', 'google', 'maps', 'seo'],
    response: "**🚀 G-Boost (Aceleração de SEO Local)**\n\n**O que é:** Um sistema que detecta elogios 5 estrelas e convida o cliente a replicar a nota no seu Google Maps.\n\n**Como funciona:** No fim da avaliação, aparece um botão especial 'Avaliar no Google'.\n\n**Vantagem:** Aumenta seu ranking nas buscas locais e atrai clientes que buscam pelo seu serviço no Google.\n\n*Digite **0** para voltar ao menu principal.*"
  },
  '2': {
    title: 'Reputation Shield',
    keys: ['2', 'shield', 'inbox', 'privado', 'critica'],
    response: "**🛡️ Reputation Shield (Inbox Privado)**\n\n**O que é:** Sua blindagem contra avaliações negativas públicas.\n\n**Como funciona:** Feedbacks de 1 a 3 estrelas são incentivados ao seu Inbox Privado para resolução interna.\n\n**Vantagem:** Evita que reclamações cheguem ao Google e permite que você recupere o cliente no sigilo.\n\n*Digite **0** para voltar ao menu principal.*"
  },
  '3': {
    title: 'Widgets e Murais',
    keys: ['3', 'mural', 'widget', 'site', 'embutir'],
    response: "**🖼️ Widgets e Murais Inteligentes**\n\n**O que é:** Murais de depoimentos que você instala no seu site em minutos.\n\n**Formatos:** Masonry, Carrossel, Grade ou Popups.\n\n**Dica:** Instale o mural logo abaixo do seu botão de vendas para reduzir a resistência de compra.\n\n*Digite **0** para voltar ao menu principal.*"
  },
  '4': {
    title: 'Social Cards',
    keys: ['4', 'social', 'card', 'instagram', 'story'],
    response: "**📱 Social Cards (Marketing Viral)**\n\n**O que é:** Gerador automático de artes para Instagram.\n\n**Funcionalidade:** Transforma depoimentos de texto em imagens profissionais para Stories com um clique.\n\n**Efeito:** Gera o 'Efeito Manada' no seu perfil social.\n\n*Digite **0** para voltar ao menu principal.*"
  },
  '5': {
    title: 'Planos e Upgrade',
    keys: ['5', 'plano', 'valor', 'preco', 'upgrade'],
    response: "**💎 Níveis de Estratégia Proova**\n\n1. **Base (Grátis):** 1 Mural e Inbox Privado.\n2. **Gold (R$ 49,90):** Ativa G-Boost, Auto-Publish e Editor VIP.\n3. **Enterprise (R$ 97):** Vídeo Reviews 4K e Suporte VIP.\n\n*Deseja mudar de plano? Acesse a aba **'Upgrade'** no painel.*\n\n*Digite **0** para voltar ao menu principal.*"
  },
  '6': {
    title: 'Falar com Humano',
    keys: ['6', 'humano', 'suporte', 'atendimento', 'contato'],
    response: "**🎧 Suporte Especializado**\n\nSeu histórico está sendo analisado por um consultor estratégico. Em breve você receberá uma notificação aqui ou no seu e-mail de cadastro.\n\n**Tempo médio de resposta:** 2 horas em horário comercial.\n\n*Digite **0** para voltar ao menu principal.*"
  },
  '7': {
    title: 'Encerrar Chat',
    keys: ['7', 'encerrar', 'fechar', 'limpar', 'sair'],
    response: "**⚠️ Confirmação de Encerramento**\n\nVocê escolheu encerrar o atendimento. Isso apagará permanentemente o seu histórico de mensagens e tickets ativos.\n\nPara confirmar, use o botão **'Encerrar Sessão'** no topo ou digite **SIM** aqui no chat.\n\n*Qualquer outra mensagem cancelará o encerramento.*"
  }
};

export const getMainMenu = (userName: string) => `Olá, **${userName}**! 👋 **Menu Estratégico Proova** 🚀
Escolha uma opção para dominar o mercado:

1️⃣ **G-Boost** (SEO Google Maps)
2️⃣ **Reputation Shield** (Inbox Privado)
3️⃣ **Widgets** (Murais para Site)
4️⃣ **Social Cards** (Instagram)
5️⃣ **Planos e Upgrade**
6️⃣ **Falar com Humano**

*Digite o **número** ou o **nome** da opção.*`;

export function getConsultantResponse(message: string, userName: string = 'Parceiro'): string {
  const input = message.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

  if (input === '0' || ['ola', 'oi', 'ajuda', 'menu', 'inicio'].includes(input)) {
    return getMainMenu(userName);
  }

  for (const key in CONSULTANT_TREE) {
    const branch = CONSULTANT_TREE[key];
    if (branch.keys.some(k => input.includes(k))) {
      return branch.response;
    }
  }

  return `Não identifiquei essa opção. 😕\n\n${getMainMenu(userName)}`;
}
