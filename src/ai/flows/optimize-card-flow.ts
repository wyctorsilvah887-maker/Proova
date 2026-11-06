'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Fluxo de Design Generativo Proova Premium (v5.0).
 * Agora suporta instruções do usuário para refinamento contínuo.
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

export async function optimizeCard(input: { 
  text: string; 
  userName?: string; 
  rating?: number; 
  businessType?: string;
  userInstruction?: string; // Nova instrução opcional do usuário
}): Promise<OptimizeCardOutput> {
  try {
    // PASSO 1: Estratégia de Texto e Conceito Visual (Gemini 2.0 Flash)
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `Você é um Diretor de Arte de marcas de luxo. 
      Sua tarefa é criar ou refinar uma peça de publicidade PREMIUM QUADRADA (1:1).
      
      DADOS ORIGINAIS:
      - DEPOIMENTO: "${input.text}"
      - SETOR: "${input.businessType || 'Serviços'}"
      - NOME: "${input.userName || 'Cliente'}"

      INSTRUÇÃO DO USUÁRIO (Siga rigorosamente se houver):
      "${input.userInstruction || 'Crie um design de elite padrão.'}"

      REGRAS:
      1. Headline: Use o nome do cliente ou uma frase curta de impacto.
      2. BodyText: O texto deve ser emocionante e luxuoso.
      3. VisualConcept: Descreva um fundo (prompt em inglês): "Ultra-luxurious dark background with [elementos baseados na instrução], professional branding style. NO TEXT in the image background."
      
      Se o usuário pediu uma cor específica ou elemento (ex: mármore, azul, tecnológico), incorpore isso no VisualConcept.`,
      output: { 
        format: 'json', 
        schema: StoryResponseSchema 
      }
    });

    if (!output) throw new Error("IA offline");

    // PASSO 2: Geração da Imagem de Fundo (Nano-Banana)
    try {
      const imageResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { text: `Create an ultra-high-end square 1:1 background for a luxury brand. ${output.visualConcept}. NO TEXT. Minimalist and cinematic lighting.` }
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
