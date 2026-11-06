'use server';
/**
 * @fileOverview Proova Designer AI Agent.
 * Provê consultoria de design de alta performance e estratégia visual para murais e cards.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdvisoryInputSchema = z.object({
  query: z.string().describe('A dúvida técnica, pedido de ajuste ou instrução de design do usuário.'),
  memberRank: z.string().describe('O nível do plano do usuário (GOLD, ENTERPRISE, TRIAL).'),
});

const AdvisoryOutputSchema = z.object({
  response: z.string().describe('A orientação técnica e criativa do designer.'),
  actionableInsights: z.array(z.string()).describe('Pontos práticos para melhorar a conversão visual.'),
  confidentialityNote: z.string().describe('Protocolo de processamento do sistema.'),
});

export type AdvisoryInput = z.infer<typeof AdvisoryInputSchema>;
export type AdvisoryOutput = z.infer<typeof AdvisoryOutputSchema>;

const prompt = ai.definePrompt({
  name: 'proovaDesignerPrompt',
  model: 'gemini-2.5-flash',
  input: { schema: AdvisoryInputSchema },
  output: { schema: AdvisoryOutputSchema },
  prompt: `Você é o Proova Designer, o especialista em inteligência visual e autoridade digital da plataforma Proova.
Seu tom é profissional, técnico, objetivo e altamente criativo. Você fala como um Diretor de Arte de uma agência de elite.

CONTEXTO DO CLIENTE:
Plano: {{{memberRank}}}
Instrução: "{{{query}}}"

DIRETRIZES DE RESPOSTA:
1. FOCO: Sua especialidade é transformar depoimentos em peças de marketing que vendem. Fale sobre hierarquia visual, psicologia das cores, contraste e legibilidade.
2. DESIGN: Sugira conceitos modernos (Glassmorphism, Dark Mode, Minimalismo) e materiais (mármore, metal escovado, luzes neon discretas).
3. ESTRATÉGIA: Explique como o design sugerido aumenta a percepção de valor da marca.
4. ESTILO: Seja direto. Use terminologia de design mas de forma compreensível. Não use emojis em excesso.
5. VERSATILIDADE: Se o usuário pedir algo que prejudique a legibilidade, alerte-o profissionalmente e sugira uma alternativa melhor.

Formate sua resposta como um relatório técnico de design. O campo 'confidentialityNote' deve conter o status do motor (ex: PROOVA-V4-ACTIVE) e a garantia de processamento 4K.`,
});

const advisorFlow = ai.defineFlow(
  {
    name: 'advisorFlow',
    inputSchema: AdvisoryInputSchema,
    outputSchema: AdvisoryOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('Falha no processamento criativo.');
      }
      return output;
    } catch (error: any) {
      console.error("ERRO FLOW DESIGNER:", error);
      return {
        response: "Sistema de design momentaneamente instável. Por favor, tente novamente em alguns segundos para que eu possa processar sua instrução de arte.",
        actionableInsights: ["Verificar estabilidade da rede", "Simplificar comando visual"],
        confidentialityNote: "PROOVA-ERR-RETRY"
      };
    }
  }
);

export async function askBlackAdvisor(input: AdvisoryInput): Promise<AdvisoryOutput> {
  return advisorFlow(input);
}
