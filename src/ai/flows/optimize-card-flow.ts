'use server';

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * @fileOverview Fluxo otimizado para geração de conteúdo de Social Cards (Stories).
 * Utiliza o motor Gemini 3.8 Flash para transformar feedbacks em peças de marketing.
 */

const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-3.8-flash',
});

// Schema de saída estruturado para o Story do Instagram
const StoryResponseSchema = z.object({
  headline: z.string().describe('Frase curta, impactante e comercial para o topo do story (gancho visual).'),
  bodyText: z.string().describe('O texto do feedback revisado, corrigido e otimizado para prender a atenção de quem lê.'),
  author: z.string().describe('Nome do cliente ou autor do feedback devidamente formatado.'),
  tagline: z.string().describe('Uma pequena frase final de chamada ou CTA (ex: "Cliente satisfeito!").'),
  bgPrompt: z.string().describe('Prompt visual em inglês para o background (estilo minimalista/luxo).'),
});

export type OptimizeCardOutput = z.infer<typeof StoryResponseSchema>;

/**
 * Wrapper para chamar o flow de otimização de cards.
 */
export async function optimizeCard(input: { text: string; businessType?: string }): Promise<OptimizeCardOutput> {
  return optimizeCardFlow({ feedbackBruto: input.text });
}

export const optimizeCardFlow = ai.defineFlow(
  {
    name: 'optimizeCardFlow',
    inputSchema: z.object({
      feedbackBruto: z.string(),
    }),
    outputSchema: StoryResponseSchema,
  },
  async (input) => {
    try {
      const response = await ai.generate({
        model: 'googleai/gemini-3.8-flash',
        prompt: `Você é um Diretor de Arte de marcas de luxo. 
        Sua tarefa é transformar um depoimento de cliente em um Story de Instagram de alto impacto.
        
        Depoimento: "${input.feedbackBruto}"
        
        REGRAS:
        1. Headline: Gancho visual curto (max 8 palavras).
        2. BodyText: O feedback otimizado para leitura rápida.
        3. Author: O nome do cliente formatado.
        4. Tagline: Chamada final poderosa.
        5. Visual (bgPrompt): Prompt detalhado em INGLÊS para uma imagem 9:16 sofisticada (luxo, minimalista).`,
        output: { 
          format: 'json', 
          schema: StoryResponseSchema 
        }
      });

      if (!response.output) {
        throw new Error("Falha ao gerar conteúdo estruturado.");
      }

      return response.output;

    } catch (err: any) {
      console.error("ERRO GOOGLE GEN AI (Genkit - 3.8):", err);
      
      if (err.message?.includes('503') || err.message?.includes('demand')) {
        throw new Error("O servidor da IA está temporariamente sobrecarregado. Por favor, tente novamente em instantes.");
      }
      
      throw new Error(`Falha na IA (Genkit): ${err.message || 'Erro de comunicação'}.`);
    }
  }
);
