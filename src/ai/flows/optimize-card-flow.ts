'use server';

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Fluxo de Design Generativo de Elite.
 * 1. O Gemini cria o copywriting e o conceito visual.
 * 2. O Imagen gera uma imagem de fundo exclusiva 1:1.
 */

const StoryResponseSchema = z.object({
  headline: z.string().describe('Frase curta e comercial para o topo.'),
  bodyText: z.string().describe('O texto do feedback revisado e elegante.'),
  author: z.string().describe('Nome do autor formatado.'),
  tagline: z.string().describe('Uma pequena frase final de autoridade.'),
  visualConcept: z.string().describe('Um prompt detalhado para gerar uma imagem de fundo luxuosa e minimalista baseada no setor do negócio.'),
  backgroundImageUri: z.string().optional().describe('A imagem gerada pela IA.'),
});

export type OptimizeCardOutput = z.infer<typeof StoryResponseSchema>;

export async function optimizeCard(input: { text: string; userName?: string; rating?: number; businessType?: string }): Promise<OptimizeCardOutput> {
  try {
    // PASSO 1: Gerar a estratégia de texto e o conceito visual
    const textResponse = await ai.generate({
      model: geminiModel,
      prompt: `Você é um Diretor de Arte de marcas de luxo. 
      Sua tarefa é transformar este depoimento em uma peça de publicidade PREMIUM QUADRADA (1:1).
      
      DEPOIMENTO: "${input.text}"
      SETOR: "${input.businessType || 'Serviços'}"

      REGRAS:
      1. Headline: Máximo 4 palavras.
      2. BodyText: Refine para ser emocionante.
      3. VisualConcept: Crie um prompt para geração de imagem (em inglês) que seja: Minimalista, LUXUOSO, focado em texturas (mármore, vidro, iluminação de estúdio) relacionado ao setor ${input.businessType}. NÃO inclua pessoas ou rostos. Foque em ambiente e atmosfera profissional.`,
      output: { 
        format: 'json', 
        schema: StoryResponseSchema 
      }
    });

    const data = textResponse.output;
    if (!data) throw new Error("Falha na geração estratégica.");

    // PASSO 2: Gerar a imagem de fundo real via IA (Imagen 3)
    try {
      const imageResponse = await ai.generate({
        model: 'googleai/imagen-3.0-generate-001',
        prompt: `A professional, ultra-high-end, minimal background image for a business social card. ${data.visualConcept}. Cinematic lighting, soft bokeh, sophisticated textures, 8k resolution, elegant, neutral colors, square 1:1 aspect ratio.`,
      });

      const media = imageResponse.media;
      if (media && media.url) {
        data.backgroundImageUri = media.url;
      }
    } catch (imgErr) {
      console.error("Erro Imagen 3 (Usando Fallback Visual):", imgErr);
      // Mantemos o objeto sem imagem para o frontend usar o gradiente de segurança
    }

    return data;

  } catch (error: any) {
    console.error("FALHA TOTAL IA DESIGN:", error);
    return {
      headline: "Autoridade Reconhecida",
      bodyText: input.text,
      author: input.userName || "Cliente VIP",
      tagline: "Compromisso com a Excelência",
      visualConcept: "Luxurious minimal texture",
    };
  }
}
