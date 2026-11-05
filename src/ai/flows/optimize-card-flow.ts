'use server';
/**
 * @fileOverview Flow para otimização de Stories de Instagram via Google AI.
 * 
 * - optimizeCard - Função que transforma depoimentos em headlines poderosas.
 * - OptimizeCardInput - Schema de entrada (texto do depoimento e tipo de negócio).
 * - OptimizeCardOutput - Schema de saída (texto refinado e prompt visual).
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const OptimizeCardInputSchema = z.object({
  text: z.string().describe('O texto original do depoimento.'),
  businessType: z.string().optional().describe('O setor de atuação da empresa.'),
});
export type OptimizeCardInput = z.infer<typeof OptimizeCardInputSchema>;

const OptimizeCardOutputSchema = z.object({
  refinedText: z.string().describe('Headline curta (max 8 palavras) e poderosa baseada no depoimento.'),
  bgPrompt: z.string().describe('Prompt visual em inglês para o background (estilo minimalista/luxo).'),
});
export type OptimizeCardOutput = z.infer<typeof OptimizeCardOutputSchema>;

export async function optimizeCard(input: OptimizeCardInput): Promise<OptimizeCardOutput> {
  return optimizeCardFlow(input);
}

const optimizeCardFlow = ai.defineFlow(
  {
    name: 'optimizeCardFlow',
    inputSchema: OptimizeCardInputSchema,
    outputSchema: OptimizeCardOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: googleAI.model('gemini-1.5-flash'),
      prompt: `Você é um Diretor de Arte de marcas de luxo. 
      Sua tarefa é transformar um depoimento de cliente em um Story de Instagram de alto impacto.
      
      Depoimento: "${input.text}"
      Setor: ${input.businessType || 'Premium Business'}
      
      REGRAS:
      1. Headline (refinedText): Frase curta, poderosa e aspiracional. Máximo 8 palavras.
      2. Visual (bgPrompt): Prompt detalhado em INGLÊS para uma imagem 9:16 sofisticada (luxo, minimalista).`,
      output: { schema: OptimizeCardOutputSchema },
      config: { temperature: 0.7 },
    });

    if (!output) throw new Error("Falha na inteligência artificial ao processar o card.");
    return output;
  }
);
