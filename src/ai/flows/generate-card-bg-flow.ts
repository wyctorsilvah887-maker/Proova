'use server';
/**
 * @fileOverview Flow para geração de backgrounds artísticos via Imagen 4.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export async function generateCardBackground(bgPrompt: string) {
  const { media } = await ai.generate({
    model: 'googleai/imagen-4.0-fast-generate-001',
    prompt: `Masterpiece, professional abstract minimalist background for a luxury social media post. ${bgPrompt}. 4k, soft lighting, depth of field, high quality rendering, aesthetic gradients.`,
  });

  if (!media) {
    throw new Error('Falha ao gerar imagem de fundo.');
  }

  return media.url;
}

export const generateCardBgFlow = ai.defineFlow(
  {
    name: 'generateCardBgFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => generateCardBackground(prompt)
);
