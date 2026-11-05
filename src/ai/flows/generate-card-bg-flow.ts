
'use server';
/**
 * @fileOverview Flow para geração de backgrounds via Gemini no Google AI.
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
      // Utilizamos o identificador completo com namespace para o plugin Google AI.
      // O Gemini 1.5 Flash processa o prompt e gera a imagem através de multimodalidade.
      const { media } = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: `Generate a high-end 9:16 background image for an Instagram Story. Style: ${input.bgPrompt}. Focus on luxury textures and bokeh.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      });

      if (!media || !media.url) {
        return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop`;
      }

      return media.url;
    } catch (err: any) {
      console.error("ERRO GOOGLE AI (BG):", err);
      // Fallback premium caso a geração de imagem falhe ou não esteja disponível no tier
      return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop`;
    }
  }
);

export async function generateCardBackground(bgPrompt: string) {
  return generateCardBackgroundFlow({ bgPrompt });
}
