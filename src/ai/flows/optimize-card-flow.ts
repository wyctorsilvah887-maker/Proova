
'use server';

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// 1. Inicializa o Genkit configurando o plugin do Google AI Studio
const ai = genkit({
  plugins: [googleAI()],
  model: 'gemini-1.5-flash', 
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

// 2. Define o seu fluxo (flow) com saída estruturada para o Dashboard
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
    try {
      // 3. Executa a chamada de geração usando a sintaxe simplificada e o modelo recomendado
      const response = await ai.generate({
        model: 'gemini-1.5-flash',
        prompt: `Você é um Diretor de Arte de marcas de luxo. 
        Sua tarefa é transformar um depoimento de cliente em um Story de Instagram de alto impacto.
        
        Depoimento: "${input.text}"
        Setor: ${input.businessType || 'Premium Business'}
        
        REGRAS:
        1. Headline (refinedText): Frase curta, poderosa e aspiracional. Máximo 8 palavras.
        2. Visual (bgPrompt): Prompt detalhado em INGLÊS para uma imagem 9:16 sofisticada (luxo, minimalista).`,
        output: { schema: OptimizeCardOutputSchema }
      });

      if (!response.output) {
        throw new Error("Falha ao gerar conteúdo estruturado.");
      }

      return response.output;

    } catch (err: any) {
      console.error("ERRO GOOGLE GEN AI (Genkit):", err);
      throw new Error(`Falha na IA (Genkit): ${err.message || 'Erro de comunicação'}.`);
    }
  }
);
