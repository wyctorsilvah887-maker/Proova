'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Fluxo de Design Generativo Proova Premium (v4.0).
 * Utilizamos o Gemini 2.0 Flash para estratégia e o Nano-Banana para arte de fundo.
 */

const StoryResponseSchema = z.object({
  headline: z.string().describe('Frase curta de impacto.'),
  bodyText: z.string().describe('O texto do feedback revisado, curto e impactante.'),
  author: z.string().describe('Nome do autor formatado elegantemente.'),
  tagline: z.string().describe('Sempre: "feito pelo Proova IA Design"'),
  visualConcept: z.string().describe('Prompt detalhado em inglês para fundo luxuoso.'),
  backgroundImageUri: z.string().optional().describe('A imagem gerada pela IA.'),
});

export type OptimizeCardOutput = z.infer<typeof StoryResponseSchema>;

export async function optimizeCard(input: { text: string; userName?: string; rating?: number; businessType?: string }): Promise<OptimizeCardOutput> {
  try {
    // PASSO 1: Estratégia de Texto (Gemini 2.0 Flash)
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `Você é um Diretor de Arte de marcas de luxo. 
      Sua tarefa é transformar este depoimento em uma peça de publicidade PREMIUM QUADRADA.
      
      DEPOIMENTO: "${input.text}"
      SETOR: "${input.businessType || 'Serviços'}"
      NOME: "${input.userName || 'Cliente'}"

      REGRAS:
      1. Headline: Mantenha o nome do cliente.
      2. BodyText: Refine o feedback para ser emocionante e luxuoso.
      3. VisualConcept: Descreva um fundo (prompt em inglês): "Ultra-luxurious dark background with golden dust, sparkles, and soft cinematic lighting. Deep black and gold palette. 4K texture, professional branding style."`,
      output: { 
        format: 'json', 
        schema: StoryResponseSchema 
      }
    });

    if (!output) throw new Error("IA offline");

    // PASSO 2: Geração da Imagem de Fundo (Banana Model)
    try {
      const imageResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { text: `Create an ultra-high-end square 1:1 background. ${output.visualConcept}. NO TEXT. Minimalist and professional.` }
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      });

      if (imageResponse.media?.url) {
        output.backgroundImageUri = imageResponse.media.url;
      }
    } catch (imgErr) {
      console.error("Falha visual, usando fallback.");
    }

    return {
      ...output,
      author: input.userName || "Cliente VIP",
      tagline: "feito pelo Proova IA Design"
    };

  } catch (error: any) {
    return {
      headline: input.userName || "Cliente VIP",
      bodyText: input.text,
      author: input.userName || "Cliente VIP",
      tagline: "feito pelo Proova IA Design",
      visualConcept: "Luxury dark gold",
    };
  }
}
