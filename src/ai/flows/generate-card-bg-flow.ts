'use server';
/**
 * @fileOverview Flow para geração de backgrounds verticais (Stories) via Imagen 3 no Vertex AI.
 * 
 * - generateCardBackground - Gera uma imagem 9:16 de alta qualidade para o fundo do post.
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
        model: 'vertexai/imagen-3.0-fast-generate-001',
        prompt: `9:16 vertical smartphone wallpaper, high-end professional commercial photography, minimalist luxury style, ${input.bgPrompt}, cinematic lighting, shallow depth of field, 8k resolution, clean composition for text overlay.`,
      });

      if (!media || !media.url) {
        throw new Error('O modelo Imagen não retornou mídia.');
      }

      return media.url;
    } catch (err: any) {
      console.error("ERRO CRÍTICO IMAGEN (Vertex):", err);
      throw new Error(`Falha ao gerar arte visual no Vertex: ${err.message}`);
    }
  }
);

export async function generateCardBackground(bgPrompt: string) {
  return generateCardBackgroundFlow({ bgPrompt });
}
