
'use server';
/**
 * @fileOverview Flow para geração de backgrounds verticais via Imagen 3 no Google AI.
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
      // No Google AI Studio, o modelo de imagem é o imagen3
      const { media } = await ai.generate({
        model: 'googleai/imagen-3',
        prompt: `Vertical 9:16 portrait orientation for Instagram Story, ${input.bgPrompt}, high-end commercial photography, shallow depth of field, 8k resolution, minimalist luxury style.`,
      });

      if (!media || !media.url) {
        throw new Error('O motor de arte visual não retornou dados.');
      }

      return media.url;
    } catch (err: any) {
      console.error("ERRO IMAGEN:", err);
      throw new Error(`Falha ao gerar background: ${err.message}`);
    }
  }
);

export async function generateCardBackground(bgPrompt: string) {
  return generateCardBackgroundFlow({ bgPrompt });
}
