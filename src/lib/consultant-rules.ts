/**
 * @fileOverview Motor de Árvore de Decisão do Consultor Proova AI (Não-IA).
 * Estrutura hierárquica para guiar o usuário através das ferramentas da plataforma.
 */

import { PLAN_PRICE } from '@/lib/pp-plans';

interface TreeBranch {
  title: string;
  response: string;
  keys: string[];
}

export const CONSULTANT_TREE: Record<string, TreeBranch> = {
  '1': {
    title: 'G-Boost (SEO Google)',
    keys: ['1', 'gboost', 'google', 'maps', 'seo'],
    response: "**🚀 G-Boost (Mais avaliações no Google)**\n\n**O que é:** Depois que o cliente avalia no Proova, ele é convidado a publicar também no seu perfil do Google Maps.\n\n**Como funciona:** Aparece um botão 'Avaliar no Google' logo após a avaliação, com um clique até a página certa.\n\n**Vantagem:** Mais avaliações recentes no Google ajudam seu perfil a aparecer melhor nas buscas locais.\n\n*Digite **0** para voltar ao menu principal.*"
  },
  '2': {
    title: 'Reputation Shield',
    keys: ['2', 'shield', 'inbox', 'privado', 'critica'],
    response: "**🛡️ Reputation Shield (Inbox Privado)**\n\n**O que é:** Um canal direto para o cliente insatisfeito falar com você.\n\n**Como funciona:** Quem dá nota de 1 a 3 pode enviar o feedback para o seu Inbox Privado e deixar um contato. Você é avisado (Premium e PRO) e pode responder rápido, sem impedir que o cliente avalie no Google se quiser.\n\n**Vantagem:** Você resolve o problema cedo e pode recuperar o cliente.\n\n*Digite **0** para voltar ao menu principal.*"
  },
  '3': {
    title: 'Link in Bio (Página Pública)',
    keys: ['3', 'link', 'bio', 'pp', 'pagina', 'vitrine'],
    response: "**🌐 Link in Bio (Sua Vitrine Oficial)**\n\n**O que é:** Uma página sua com os melhores depoimentos, sua nota no Proova e no Google e um caminho direto para o seu WhatsApp.\n\n**Como usar:** Coloque o link na bio do Instagram. No **Studio** (menu **Página Pública**) você escolhe cores, layout e blocos como Sobre, Horários, Perguntas e Mapa.\n\n**Vantagem:** Reúne sua prova social em um só lugar e facilita o contato de novos pacientes.\n\n*Digite **0** para voltar ao menu principal.*"
  },
  '4': {
    title: 'Social Cards',
    keys: ['4', 'social', 'card', 'instagram', 'story'],
    response: "**📱 Social Cards (Posts e Stories)**\n\n**O que é:** Gerador de artes para Instagram a partir dos seus depoimentos.\n\n**Como funciona:** Escolha um depoimento e um modelo, e baixe a imagem pronta para postar. Os modelos VIP são do plano Premium e PRO.\n\n*Digite **0** para voltar ao menu principal.*"
  },
  '5': {
    title: 'Planos e Upgrade',
    keys: ['5', 'plano', 'valor', 'preco', 'upgrade'],
    response: `**💎 Planos Proova AI**\n\n1. **Base (grátis):** link de coleta, QR Code, Inbox Privado e página pública simples.\n2. **Premium (${PLAN_PRICE.premium}/mês):** página completa e Studio, busca automática de avaliações do Google, respostas por IA, alertas de avaliação negativa, G-Boost, Social Cards VIP e métricas.\n3. **PRO (${PLAN_PRICE.pro}/mês):** tudo do Premium, mais depoimentos ilimitados, vídeo-depoimento, selo sem \"Powered by\" e suporte dedicado.\n\n*Compare tudo em **www.useproovaai.com.br/pricing**.*\n\n*Digite **0** para voltar ao menu principal.*`
  },
  '6': {
    title: 'Falar com Humano',
    keys: ['6', 'humano', 'suporte', 'atendimento', 'contato'],
    response: "**🎧 Suporte Especializado**\n\nAbri um atendimento para você. Um consultor vai responder aqui no chat. Se você sair, avisamos pelo e-mail de cadastro.\n\n**Tempo médio de resposta:** 2 horas em horário comercial.\n\n*Digite **0** para voltar ao menu principal.*"
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
3️⃣ **Link in Bio** (Página Pública)
4️⃣ **Social Cards** (Instagram)
5️⃣ **Planos e Upgrade**
6️⃣ **Falar com Humano**
7️⃣ **Encerrar Chat**

*Digite o **número** ou o **nome** da opção.*`;

const norm = (m: string) => m.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Qual opção do menu a mensagem escolheu: 'menu', uma chave ('1'..'7') ou null. Números só valem se forem a mensagem inteira. */
export function matchConsultantKey(message: string): string | null {
  const input = norm(message);
  if (input === '0' || ['ola', 'oi', 'ajuda', 'menu', 'inicio'].includes(input)) return 'menu';
  for (const key in CONSULTANT_TREE) {
    const hit = CONSULTANT_TREE[key].keys.some(k =>
      /^\d+$/.test(k) ? input === k : new RegExp(`(^|[^a-z0-9])${k}([^a-z0-9]|$)`).test(input));
    if (hit) return key;
  }
  return null;
}

export function getConsultantResponse(message: string, userName: string = 'Parceiro'): string {
  const key = matchConsultantKey(message);
  if (key === 'menu') return getMainMenu(userName);
  if (key) return CONSULTANT_TREE[key].response;
  return `Não identifiquei essa opção. 😕\n\n${getMainMenu(userName)}`;
}
