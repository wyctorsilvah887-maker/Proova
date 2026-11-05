
'use server';
/**
 * @fileOverview Flow para criação de roteiro de design para Instagram Story via Vertex AI.
 * 
 * - optimizeCard - Transforma um depoimento bruto em uma headline de impacto e prompt visual.
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
  model: 'vertexai/gemini-1.5-flash-002',
  input: { schema: OptimizeCardInputSchema },
  output: { schema: OptimizeCardOutputSchema },
  config: {
    temperature: 0.7,
  },
  prompt: `Você é um Diretor de Arte de marcas de luxo. 
  Sua tarefa é transformar um depoimento de cliente em um Story de Instagram de alto impacto.
  
  Depoimento: "{{{text}}}"
  Setor do Negócio: {{#if businessType}}{{{businessType}}}{{else}}Premium Business{{/if}}
  
  INSTRUÇÕES:
  1. Headline (refinedText): Crie uma frase curta (max 8 palavras), poderosa e aspiracional baseada no elogio. Deve soar como uma marca de grife.
  2. Visual (bgPrompt): Crie um prompt detalhado em INGLÊS para gerar uma imagem de fundo 9:16. Foque em: iluminação de estúdio, texturas sofisticadas (mármore, seda, metal escovado), profundidade de campo rasa e estilo minimalista luxuoso.`,
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
      console.error("ERRO VERTEX AI (Optimize):", err);
      throw new Error(`Falha na IA (Vertex): ${err.message || 'Erro de comunicação'}.`);
    }
  }
);

export async function optimizeCard(input: z.infer<typeof OptimizeCardInputSchema>) {
  return optimizeCardFlow(input);
}
