'use server';
/**
 * @fileOverview Flow para geração de backgrounds verticais via Gemini 2.5 Flash Image (Nano-Banana) no Vertex AI.
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
      // Usando o modelo Gemini 2.5 Flash Image conforme solicitado
      const { media } = await ai.generate({
        model: 'vertexai/gemini-2.5-flash-image',
        prompt: `Vertical 9:16 portrait orientation for Instagram Story, ${input.bgPrompt}, high-end commercial photography, minimalist luxury style, 8k resolution, clean composition, space for text overlay.`,
        config: {
          // Obrigatório para o modelo Gemini 2.5 Flash Image gerar mídia
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media || !media.url) {
        throw new Error('O motor Gemini Image não retornou dados visuais.');
      }

      return media.url;
    } catch (err: any) {
      console.error("ERRO VERTEX AI (Gemini Image):", err);
      throw new Error(`Falha ao gerar arte via Gemini 2.5: ${err.message}`);
    }
  }
);

export async function generateCardBackground(bgPrompt: string) {
  return generateCardBackgroundFlow({ bgPrompt });
}
