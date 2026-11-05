'use server';
/**
 * @fileOverview Flow para geração de backgrounds verticais (Stories) via Imagen 3.
 * Trocado para Imagen 3 por ser mais estável em chaves gratuitas/novas.
 */
import { ai } from '@/ai/genkit';

export async function generateCardBackground(bgPrompt: string) {
  try {
    const { media } = await ai.generate({
      model: 'googleai/imagen-3-fast-generate-001',
      prompt: `Masterpiece, professional 9:16 vertical background for Instagram Story. Minimalist luxury. ${bgPrompt}. High quality.`,
      config: {
        // @ts-ignore - Configuração para Stories
        aspectRatio: '9:16'
      }
    });

    if (!media || !media.url) {
      throw new Error('O modelo Imagen não retornou mídia.');
    }

    return media.url;
  } catch (err: any) {
    console.error("ERRO CRÍTICO IMAGEN:", err);

    if (err.message?.includes('402') || err.message?.includes('credits are depleted')) {
      throw new Error("Créditos para Geração de Imagem Esgotados.");
    }

    throw new Error(`Falha ao gerar arte visual: ${err.message}`);
  }
}
