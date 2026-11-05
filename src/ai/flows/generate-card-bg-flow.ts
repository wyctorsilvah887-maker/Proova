
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
      // Imagen 3 no Vertex AI exige Project ID configurado e API ativa.
      const { media } = await ai.generate({
        model: 'vertexai/imagen-3.0-fast-generate-001',
        prompt: `Vertical 9:16 composition for smartphone screen, ${input.bgPrompt}, ultra-high definition, cinematic color grading, clean and professional look.`,
      });

      if (!media || !media.url) {
        throw new Error('O motor de arte visual (Imagen) não retornou dados.');
      }

      return media.url;
    } catch (err: any) {
      console.error("ERRO CRÍTICO IMAGEN (Vertex):", err);
      throw new Error(`Falha ao gerar background no Vertex: ${err.message}`);
    }
  }
);

export async function generateCardBackground(bgPrompt: string) {
  return generateCardBackgroundFlow({ bgPrompt });
}
