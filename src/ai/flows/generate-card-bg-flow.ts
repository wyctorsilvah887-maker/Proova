
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
      // Como o plugin Google AI utiliza o Gemini 1.5 Flash como motor principal, 
      // usamos o modelo multimodal para processar o prompt visual.
      // Caso a geração direta de imagem não esteja disponível no seu tier de API,
      // retornamos um fallback premium para não quebrar a experiência do usuário.
      const { media } = await ai.generate({
        model: 'gemini-1.5-flash',
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
      return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop`;
    }
  }
);

export async function generateCardBackground(bgPrompt: string) {
  return generateCardBackgroundFlow({ bgPrompt });
}
