'use server';
/**
 * @fileOverview Agente de Inteligência Artificial para Suporte Estratégico Proova.
 * 
 * Este flow processa dúvidas de usuários sobre a plataforma Proova,
 * utilizando a base de conhecimento de estratégia, planos e funcionalidades.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PRIMARY_MODEL } from '@/ai/genkit';

const SupportAiInputSchema = z.object({
  message: z.string().describe('A mensagem ou dúvida enviada pelo usuário no chat.'),
  userName: z.string().optional().describe('O nome do usuário para personalização.'),
  membershipStatus: z.string().optional().describe('O nível de plano do usuário (base, gold, enterprise).'),
});

export type SupportAiInput = z.infer<typeof SupportAiInputSchema>;

const SupportAiOutputSchema = z.object({
  response: z.string().describe('A resposta estratégica e técnica gerada pela IA.'),
});

export type SupportAiOutput = z.infer<typeof SupportAiOutputSchema>;

const prompt = ai.definePrompt({
  name: 'supportAiPrompt',
  model: PRIMARY_MODEL,
  input: { schema: SupportAiInputSchema },
  output: { schema: SupportAiOutputSchema },
  prompt: `Você é o "Especialista Proova", o assistente de suporte inteligente da plataforma Proova.
Sua missão é ajudar o usuário {{{userName}}} (Plano: {{{membershipStatus}}}) a dominar o mercado através da prova social.

### CONHECIMENTO ESTRATÉGICO PROOVA:
1. **G-Boost**: Sistema que detecta elogios 5 estrelas e convida o cliente a avaliar no Google Maps. Isso aumenta o SEO Local e o rankeamento no Maps.
2. **Reputation Shield**: Filtro de feedbacks críticos (1-3 estrelas) que são enviados para o Inbox Privado. Isso permite resolver conflitos internamente antes que virem reclamações públicas.
3. **Página Pública (PP)**: Vitrine de depoimentos oficial para usar no "Link da Bio" do Instagram.
4. **Widgets (Murais)**: Murais embutíveis (Masonry, Carrossel, Grid) para sites.
5. **Social Cards**: Gerador de posts profissionais para Instagram a partir de depoimentos.
6. **Auto-Publish**: Recurso exclusivo ENTERPRISE que publica automaticamente novos elogios qualificados na Página Pública.

### REGRAS DE ATENDIMENTO:
- Seja executivo, encorajador e direto. Use um tom de "parceiro de negócios".
- Se o usuário perguntar sobre recursos Gold (G-Boost, Relatórios, Editor VIP) e ele for plano 'base', sugira gentilmente o upgrade em /pricing.
- Se o usuário perguntar sobre Auto-Publish ou Vídeo Reviews e não for 'enterprise', mencione que estes são os diferenciais do plano Enterprise.
- Nunca invente funcionalidades. Se não souber algo, peça para ele aguardar um consultor humano.
- Use emojis moderadamente para manter o visual "tech".
- Mantenha as respostas concisas para facilitar a leitura no chat.

Dúvida do Usuário: {{{message}}}`,
});

export async function supportAiAction(input: SupportAiInput): Promise<SupportAiOutput> {
  const { output } = await prompt(input);
  return output!;
}
