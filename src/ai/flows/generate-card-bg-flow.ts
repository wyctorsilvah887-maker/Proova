
'use server';
/**
 * @fileOverview Flow para geração de backgrounds verticais (Stories) via Imagen 3 no Google AI Studio.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

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
      // Imagen 3 no AI Studio usa o identificador 'imagen-3.0-generate-001'
      const { media } = await ai.generate({
        model: googleAI.model('imagen-3.0-generate-001'),
        prompt: `Vertical 9:16 composition for smartphone screen, ${input.bgPrompt}, ultra-high definition, cinematic color grading, clean and professional look.`,
      });

      if (!media || !media.url) {
        throw new Error('O motor de arte visual (Imagen) não retornou dados.');
      }

      return media.url;
    } catch (err: any) {
      console.error("ERRO CRÍTICO IMAGEN (Google AI):", err);
      throw new Error(`Falha ao gerar background: ${err.message}`);
    }
  }
);

export async function generateCardBackground(bgPrompt: string) {
  return generateCardBackgroundFlow({ bgPrompt });
}
