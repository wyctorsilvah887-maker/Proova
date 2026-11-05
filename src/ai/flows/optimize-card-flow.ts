
'use server';
/**
 * @fileOverview Flow para criação de roteiro de design para Instagram Story via Google AI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OptimizeCardInputSchema = z.object({
  text: z.string(),
  businessType: z.string().optional(),
});

const OptimizeCardOutputSchema = z.object({
  refinedText: z.string().describe('O depoimento transformado em uma headline matadora.'),
  bgPrompt: z.string().describe('Um prompt visual em inglês para o Imagen 3.'),
});

const optimizeCardPrompt = ai.definePrompt({
  name: 'optimizeCardPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: OptimizeCardInputSchema },
  output: { schema: OptimizeCardOutputSchema },
  config: {
    temperature: 0.7,
  },
  prompt: `Você é um Diretor de Arte de luxo. 
  Crie um Story de impacto para: "{{{text}}}"
  Setor: {{#if businessType}}{{{businessType}}}{{else}}Premium Business{{/if}}
  
  INSTRUÇÕES:
  1. Headline: Curta (max 8 palavras), impactante, soando como marca de luxo.
  2. Visual: Prompt em inglês para fundo 9:16 abstrato e sofisticado (mármore, iluminação de estúdio, etc).`,
});

export const optimizeCardFlow = ai.defineFlow(
  {
    name: 'optimizeCardFlow',
    inputSchema: OptimizeCardInputSchema,
    outputSchema: OptimizeCardOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await optimizeCardPrompt(input);
      if (!output) throw new Error("A IA não conseguiu estruturar os dados.");
      return output;
    } catch (err: any) {
      console.error("ERRO IA OPTIMIZE:", err);
      throw new Error(`Falha na IA: ${err.message || 'Erro de comunicação'}.`);
    }
  }
);

export async function optimizeCard(input: z.infer<typeof OptimizeCardInputSchema>) {
  return optimizeCardFlow(input);
}
