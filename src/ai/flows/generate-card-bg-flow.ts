
'use server';
/**
 * @fileOverview Flow para geração de backgrounds via Gemini 2.0 Flash no Google AI.
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
      // Como o plugin Google AI não suporta Imagen 3 (Vertex exclusivo), 
      // usamos o Gemini 2.0 Flash com suporte a geração de imagem se disponível, 
      // ou retornamos uma cor sólida/placeholder premium em caso de indisponibilidade.
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: `Generate a high-end 9:16 background image for an Instagram Story. Style: ${input.bgPrompt}. Focus on luxury textures and bokeh.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      });

      if (!media || !media.url) {
        // Fallback para uma imagem premium do Unsplash caso o modelo não suporte geração direta
        return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop`;
      }

      return media.url;
    } catch (err: any) {
      console.error("ERRO GOOGLE AI (BG):", err);
      // Fallback resiliente
      return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop`;
    }
  }
);

export async function generateCardBackground(bgPrompt: string) {
  return generateCardBackgroundFlow({ bgPrompt });
}
