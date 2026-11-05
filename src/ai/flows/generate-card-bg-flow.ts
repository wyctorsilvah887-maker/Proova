'use server';
/**
 * @fileOverview Flow para geração de backgrounds verticais (Stories) via Imagen 4.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export async function generateCardBackground(bgPrompt: string) {
  try {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Masterpiece, professional 9:16 vertical background for Instagram Story. Minimalist luxury. ${bgPrompt}. 8k resolution, high quality.`,
      config: {
        // @ts-ignore - Configuração específica do modelo para Stories
        aspectRatio: '9:16'
      }
    });

    if (!media || !media.url) {
      throw new Error('O modelo Imagen não retornou mídia.');
    }

    return media.url;
  } catch (err: any) {
    console.error("ERRO CRÍTICO IMAGEN 4:", err);
    throw new Error(`Falha ao gerar arte visual: ${err.message}`);
  }
}
