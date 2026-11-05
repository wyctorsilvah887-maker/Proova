
'use server';
/**
 * @fileOverview Flow para otimização de Stories de Instagram via Google AI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const OptimizeCardInputSchema = z.object({
  text: z.string(),
  businessType: z.string().optional(),
});

const OptimizeCardOutputSchema = z.object({
  refinedText: z.string().describe('Headline curta e poderosa baseada no depoimento.'),
  bgPrompt: z.string().describe('Prompt visual em inglês para o background.'),
});

export async function optimizeCard(input: z.infer<typeof OptimizeCardInputSchema>) {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Você é um Diretor de Arte de marcas de luxo. 
      Sua tarefa é transformar um depoimento de cliente em um Story de Instagram de alto impacto.
      
      Depoimento: "${input.text}"
      Setor: ${input.businessType || 'Premium Business'}
      
      REGRAS:
      1. Headline (refinedText): Frase curta (max 8 palavras), poderosa e aspiracional.
      2. Visual (bgPrompt): Prompt detalhado em INGLÊS para uma imagem 9:16 sofisticada (luxo, minimalista).`,
      output: { schema: OptimizeCardOutputSchema },
      config: { temperature: 0.7 },
    });

    if (!response.output) throw new Error("Falha na estrutura de saída da IA.");
    return response.output;
  } catch (err: any) {
    console.error("ERRO GOOGLE AI (Optimize):", err);
    throw new Error(`Erro na IA do Google: ${err.message || 'Falha de processamento'}.`);
  }
}
