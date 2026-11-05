
'use server';

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { PRIMARY_MODEL, FALLBACK_MODEL } from '@/ai/genkit';

// Inicialização local para o fluxo específico
const ai = genkit({
  plugins: [googleAI()],
  model: PRIMARY_MODEL, 
});

const OptimizeCardOutputSchema = z.object({
  refinedText: z.string().describe('Headline curta (max 8 palavras) e poderosa baseada no depoimento.'),
  bgPrompt: z.string().describe('Prompt visual em inglês para o background (estilo minimalista/luxo).'),
});

export type OptimizeCardOutput = z.infer<typeof OptimizeCardOutputSchema>;

/**
 * Wrapper para chamar o flow de otimização de cards.
 */
export async function optimizeCard(input: { text: string; businessType?: string }): Promise<OptimizeCardOutput> {
  return optimizeCardFlow(input);
}

// Definição do fluxo com lógica de retentativa e fallback
export const optimizeCardFlow = ai.defineFlow(
  {
    name: 'optimizeCardFlow',
    inputSchema: z.object({
      text: z.string(),
      businessType: z.string().optional(),
    }),
    outputSchema: OptimizeCardOutputSchema,
  },
  async (input) => {
    const promptText = `Você é um Diretor de Arte de marcas de luxo. 
        Sua tarefa é transformar um depoimento de cliente em um Story de Instagram de alto impacto.
        
        Depoimento: "${input.text}"
        Setor: ${input.businessType || 'Premium Business'}
        
        REGRAS:
        1. Headline (refinedText): Frase curta, poderosa e aspiracional. Máximo 8 palavras.
        2. Visual (bgPrompt): Prompt detalhado em INGLÊS para uma imagem 9:16 sofisticada (luxo, minimalista).`;

    try {
      // Tentativa 1: Modelo Primário (3.8 Flash)
      const response = await ai.generate({
        model: PRIMARY_MODEL,
        prompt: promptText,
        output: { schema: OptimizeCardOutputSchema }
      });

      if (!response.output) {
        throw new Error("Falha ao gerar conteúdo estruturado.");
      }

      return response.output;

    } catch (err: any) {
      // Lógica de Fallback: Se o 3.8 estiver lotado (503/demand), tenta o 1.5 Flash
      if (err.message?.includes('503') || err.message?.includes('demand')) {
        console.warn("Servidor do Gemini 3.8 lotado, tentando fallback para 1.5 Flash...");
        try {
          const fallbackResponse = await ai.generate({
            model: FALLBACK_MODEL,
            prompt: promptText,
            output: { schema: OptimizeCardOutputSchema }
          });
          
          if (fallbackResponse.output) return fallbackResponse.output;
        } catch (fallbackErr) {
          console.error("Erro crítico no fallback da IA:", fallbackErr);
        }
      }

      console.error("ERRO GOOGLE GEN AI (Genkit):", err);
      throw new Error(`Falha na IA (Genkit): ${err.message || 'Erro de comunicação'}.`);
    }
  }
);
