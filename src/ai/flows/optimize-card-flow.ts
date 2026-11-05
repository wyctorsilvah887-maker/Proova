
'use server';

import { ai, PRIMARY_MODEL } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Fluxo blindado para geração de conteúdo de Social Cards.
 * Implementa fallback automático para evitar erro 500 caso a API esteja instável.
 */

const StoryResponseSchema = z.object({
  headline: z.string().describe('Frase curta, impactante e comercial para o topo do story.'),
  bodyText: z.string().describe('O texto do feedback revisado e otimizado.'),
  author: z.string().describe('Nome do cliente formatado.'),
  tagline: z.string().describe('Frase final de chamada ou CTA.'),
  bgPrompt: z.string().describe('Prompt visual em inglês para o background.'),
});

export type OptimizeCardOutput = z.infer<typeof StoryResponseSchema>;

/**
 * Wrapper com proteção de erro para o frontend.
 */
export async function optimizeCard(input: { text: string; businessType?: string }): Promise<OptimizeCardOutput> {
  try {
    return await optimizeCardFlow({ feedbackBruto: input.text });
  } catch (error) {
    console.error("FALHA CRÍTICA IA (Optimize): Usando Fallback Seguro", error);
    // Retorno de emergência para não quebrar a UI
    return {
      headline: "O que dizem sobre nós",
      bodyText: input.text,
      author: "Cliente Satisfeito",
      tagline: "Excelência em cada detalhe",
      bgPrompt: "minimalist clean professional background"
    };
  }
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
        model: PRIMARY_MODEL,
        prompt: `Você é um Diretor de Arte. Transforme este depoimento em um Story de alto impacto: "${input.feedbackBruto}".
        
        REGRAS:
        1. Headline: Gancho curto (max 6 palavras).
        2. BodyText: Texto limpo e emocionante.
        3. Author: Nome do autor.
        4. Tagline: Call to action elegante.
        5. Visual (bgPrompt): Prompt em INGLÊS para background luxo/minimalista.`,
        output: { 
          format: 'json', 
          schema: StoryResponseSchema 
        }
      });

      if (!response.output) {
        throw new Error("IA não retornou dados estruturados.");
      }

      return response.output;

    } catch (err: any) {
      console.error("ERRO GENKIT (Optimize):", err);
      throw err;
    }
  }
);
