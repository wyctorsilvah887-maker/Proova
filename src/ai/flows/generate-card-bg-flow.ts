'use server';
/**
 * @fileOverview Flow para geração de backgrounds artísticos via Imagen 4.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export async function generateCardBackground(bgPrompt: string) {
  try {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Masterpiece, professional abstract minimalist background for a luxury social media post. ${bgPrompt}. 4k, soft lighting, depth of field, high quality rendering, aesthetic gradients.`,
    });

    if (!media) {
      throw new Error('O modelo não retornou nenhuma imagem.');
    }

    return media.url;
  } catch (err: any) {
    console.error("Erro crítico na geração de imagem Imagen:", err);
    throw new Error("Falha ao gerar arte visual. Verifique as cotas e permissões da API Imagen.");
  }
}

export const generateCardBgFlow = ai.defineFlow(
  {
    name: 'generateCardBgFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => generateCardBackground(prompt)
);
