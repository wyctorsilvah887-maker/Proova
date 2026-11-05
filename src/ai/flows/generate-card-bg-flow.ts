'use server';
/**
 * @fileOverview Flow para geração de backgrounds via Imagen 3 no Vertex AI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCardBgInputSchema = z.object({
  bgPrompt: z.string().describe('O prompt visual refinado para a imagem de fundo.'),
});

export const generateCardBackgroundFlow = ai.defineFlow(
  {
    name: 'generateCardBackgroundFlow',
    inputSchema: GenerateCardBgInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      // Usando Imagen 3 padrão da Vertex AI
      const { media } = await ai.generate({
        model: 'vertexai/imagen-3',
        prompt: `Vertical 9:16 portrait orientation for Instagram Story, ${input.bgPrompt}, high-end commercial photography, minimalist luxury style, 8k resolution, clean composition, space for text overlay.`,
      });

      if (!media || !media.url) {
        throw new Error('O motor de imagem não retornou dados visuais.');
      }

      return media.url;
    } catch (err: any) {
      console.error("ERRO VERTEX AI (Imagen):", err);
      throw new Error(`Falha ao gerar arte via Vertex AI: ${err.message}`);
    }
  }
);

export async function generateCardBackground(bgPrompt: string) {
  return generateCardBackgroundFlow({ bgPrompt });
}
