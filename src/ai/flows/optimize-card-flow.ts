
'use server';
/**
 * @fileOverview Flow para criação de roteiro de design para Instagram Story Posts via Google AI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const OptimizeCardInputSchema = z.object({
  text: z.string(),
  businessType: z.string().optional(),
});

const OptimizeCardOutputSchema = z.object({
  refinedText: z.string().describe('O depoimento transformado em uma headline matadora para Story.'),
  bgPrompt: z.string().describe('Um prompt visual em inglês para o Imagen 3 gerar um fundo vertical 9:16.'),
});

const optimizeCardPrompt = ai.definePrompt({
  name: 'optimizeCardPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: OptimizeCardInputSchema },
  output: { schema: OptimizeCardOutputSchema },
  prompt: `Você é um Diretor de Arte de uma agência de publicidade de luxo especializada em Prova Social. 
  
  O objetivo é criar um Instagram Story impactante baseado neste depoimento: "{{{text}}}"
  Setor do negócio: {{#if businessType}}{{{businessType}}}{{else}}Premium Business{{/if}}
  
  INSTRUÇÕES DE CRIAÇÃO:
  1. Headline (refinedText): Extraia a essência do elogio em uma frase poderosa, curta e inspiradora (máximo 8 palavras). Deve soar como um slogan de marca de luxo.
  2. Visual (bgPrompt): Crie um prompt detalhado em INGLÊS para o Imagen 3 gerar uma imagem 9:16.
     - Estilo: "High-end commercial photography, minimalist luxury, shallow depth of field".
     - Cenário: Algo que remeta ao setor {{#if businessType}}{{{businessType}}}{{else}}Geral{{/if}} de forma abstrata ou sofisticada (ex: texturas de mármore, iluminação de estúdio, design de interiores moderno).
     - Composição: Espaço negativo amplo para que o texto não cubra elementos importantes.
  
  Retorne rigorosamente no formato JSON.`,
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
      if (!output) throw new Error("A IA não conseguiu estruturar os dados do card.");
      return output;
    } catch (err: any) {
      console.error("ERRO GOOGLE AI (Optimize):", err);
      throw new Error(`Falha na IA: ${err.message || 'Erro de comunicação'}. Verifique se sua chave do AI Studio está configurada como GOOGLE_GENAI_API_KEY.`);
    }
  }
);

export async function optimizeCard(input: z.infer<typeof OptimizeCardInputSchema>) {
  return optimizeCardFlow(input);
}
