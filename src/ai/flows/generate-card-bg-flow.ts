'use server';
/**
 * @fileOverview Flow para geração de backgrounds via Gemini 2.0 Flash no Vertex AI.
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
      const { media } = await ai.generate({
        model: 'vertexai/gemini-2.0-flash',
        prompt: `Generate a Vertical 9:16 background image for an Instagram Story. Visual style: ${input.bgPrompt}. Minimalist luxury, high-end commercial photography, 8k resolution, clean composition, bokeh background.`,
        config: {
          responseModalities: ['IMAGE'],
        }
      });

      if (!media || !media.url) {
        throw new Error('O motor de imagem não retornou dados visuais.');
      }

      return media.url;
    } catch (err: any) {
      console.error("ERRO VERTEX AI (Imagen via Gemini):", err);
      throw new Error(`Falha ao gerar arte via Vertex AI: ${err.message}`);
    }
  }
);

export async function generateCardBackground(bgPrompt: string) {
  return generateCardBackgroundFlow({ bgPrompt });
}
