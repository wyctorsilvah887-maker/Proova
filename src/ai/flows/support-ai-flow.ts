'use server';
/**
 * @fileOverview Agente de Inteligência Artificial para Suporte Estratégico Proova.
 * 
 * - supportAiAction - Função exportada que aciona o suporte inteligente utilizando ai.generate.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SupportAiInputSchema = z.object({
  message: z.string().describe('A mensagem ou dúvida enviada pelo usuário no chat.'),
  userName: z.string().optional().describe('O nome do usuário para personalização.'),
  membershipStatus: z.string().optional().describe('O nível de plano do usuário.'),
});

export type SupportAiInput = z.infer<typeof SupportAiInputSchema>;

const SupportAiOutputSchema = z.object({
  response: z.string().describe('A resposta estratégica e técnica gerada pela IA.'),
});

export type SupportAiOutput = z.infer<typeof SupportAiOutputSchema>;

/**
 * Definição formal do Prompt para garantir o registro correto no Genkit.
 */
const supportPrompt = ai.definePrompt({
  name: 'supportPrompt',
  input: { schema: SupportAiInputSchema },
  output: { schema: SupportAiOutputSchema },
  system: `Você é o "Especialista Proova", o assistente de suporte inteligente da plataforma Proova.
Sua missão é ajudar o usuário de nome {{userName}} (Plano: {{membershipStatus}}) a dominar o mercado através da prova social.

### CONHECIMENTO ESTRATÉGICO PROOVA:
1. **G-Boost**: Sistema que detecta elogios 5 estrelas e convida o cliente a avaliar no Google Maps. Isso aumenta o SEO Local.
2. **Reputation Shield**: Filtro de feedbacks críticos (1-3 estrelas) enviados para o Inbox Privado para resolução interna.
3. **Página Pública (PP)**: Vitrine de depoimentos oficial para o "Link da Bio".
4. **Widgets (Murais)**: Murais embutíveis para sites.
5. **Social Cards**: Gerador de posts para Instagram.
6. **Auto-Publish**: Publica automaticamente elogios qualificados na Página Pública.

### REGRAS DE ATENDIMENTO:
- Seja executivo, encorajador e direto.
- Sugira upgrades para recursos premium (Gold/Enterprise) quando apropriado.
- Se o usuário perguntar sobre "G-Boost", explique que ele aumenta o SEO Local.
- Nunca invente funcionalidades. Respostas concisas e profissionais.`,
  prompt: `{{{message}}}`,
});

/**
 * Função de ação que processa a dúvida do usuário.
 * O modelo é definido em um único lugar: src/ai/genkit.ts.
 */
export async function supportAiAction(input: SupportAiInput): Promise<SupportAiOutput> {
  try {
    // O modelo vem do padrão definido em '@/ai/genkit'.
    const { output } = await supportPrompt(input);

    if (!output) {
      throw new Error('A IA não gerou uma resposta válida.');
    }

    return output;
  } catch (error) {
    console.error('Erro crítico no suporte IA:', error);
    return { 
      response: "Olá! No momento estou passando por uma atualização técnica para melhorar meu atendimento. Por favor, tente novamente em alguns instantes ou se for algo urgente, aguarde um consultor humano." 
    };
  }
}
