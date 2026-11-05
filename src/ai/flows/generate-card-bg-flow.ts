
'use server';
/**
 * @fileOverview Flow para geração de backgrounds verticais (Stories) via Imagen 3 no Vertex AI.
 */
import { ai } from '@/ai/genkit';

export async function generateCardBackground(bgPrompt: string) {
  try {
    const { media } = await ai.generate({
      model: 'vertexai/imagen-3.0-fast-generate-001',
      prompt: `Masterpiece, professional 9:16 vertical background for Instagram Story. Minimalist luxury. ${bgPrompt}. High quality, cinematic lighting.`,
      config: {
        // @ts-ignore - Configuração para Stories no Vertex
        aspectRatio: '9:16'
      }
    });

    if (!media || !media.url) {
      throw new Error('O modelo Imagen não retornou mídia.');
    }

    return media.url;
  } catch (err: any) {
    console.error("ERRO CRÍTICO IMAGEN (Vertex):", err);

    if (err.message?.includes('403')) {
      throw new Error("Acesso negado ao Imagen no Vertex AI. Verifique as permissões do seu projeto no GCP.");
    }

    throw new Error(`Falha ao gerar arte visual no Vertex: ${err.message}`);
  }
}
