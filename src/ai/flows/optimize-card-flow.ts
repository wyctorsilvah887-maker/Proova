'use server';
/**
 * @fileOverview Flow para criação de roteiro de design para Instagram Story Posts via Vertex AI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
  model: 'vertexai/gemini-1.5-flash',
  input: { schema: OptimizeCardInputSchema },
  output: { schema: OptimizeCardOutputSchema },
  prompt: `Você é um Diretor de Arte de uma agência de publicidade de luxo. 
  Sua especialidade é criar posts de Instagram Stories (Social Proof) que convertem visualizações em desejo de compra.
  
  O objetivo é criar um Story impactante baseado neste depoimento real: "{{{text}}}"
  Setor do negócio: {{#if businessType}}{{{businessType}}}{{else}}Geral{{/if}}
  
  INSTRUÇÕES DE DESIGN:
  1. Headline (refinedText): Transforme o depoimento em uma frase curta, poderosa e "matadora" (máximo 8 palavras). Deve soar como uma declaração de autoridade. Use exclamações se necessário.
  2. Background (bgPrompt): Crie um prompt detalhado em INGLÊS para o Imagen 3. 
     - Estilo: "Abstract Minimalist Luxury" ou "High-end Interior/Product Shot".
     - Composição: Espaço negativo para texto, iluminação dramática (cinematic lighting).
     - Cores: Use tons que combinem com o setor {{#if businessType}}{{{businessType}}}{{else}}Geral{{/if}}.
  
  Retorne exatamente no formato JSON solicitado.`,
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
      if (!output) throw new Error("Erro na resposta estruturada da IA.");
      return output;
    } catch (err: any) {
      console.error("ERRO NO VERTEX AI (optimizeCard):", err);
      
      if (err.message?.includes('403') || err.message?.includes('permission denied')) {
        throw new Error("Erro de Permissão: Ative a Vertex AI API no seu console e verifique se o faturamento está ativo.");
      }

      throw new Error(`Falha na IA (Vertex): ${err.message || 'Erro de conexão'}.`);
    }
  }
);

export async function optimizeCard(input: z.infer<typeof OptimizeCardInputSchema>) {
  return optimizeCardFlow(input);
}
