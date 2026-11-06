'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Fluxo de Design Generativo de Elite (v3.0).
 * 1. O Gemini 1.5 Flash cria o copywriting e a estratégia visual.
 * 2. O Gemini 2.5 Flash Image (Nano-Banana) gera uma imagem de fundo exclusiva 1:1.
 */

const StoryResponseSchema = z.object({
  headline: z.string().describe('Frase curta (máx 4 palavras) e comercial para o topo do post.'),
  bodyText: z.string().describe('O texto do feedback revisado, curto e impactante.'),
  author: z.string().describe('Nome do autor formatado elegantemente.'),
  tagline: z.string().describe('Frase final de autoridade (ex: Excelência Garantida).'),
  visualConcept: z.string().describe('Prompt detalhado em inglês para uma imagem de fundo minimalista e luxuosa.'),
  backgroundImageUri: z.string().optional().describe('A imagem gerada pela inteligência artificial.'),
});

export type OptimizeCardOutput = z.infer<typeof StoryResponseSchema>;

export async function optimizeCard(input: { text: string; userName?: string; rating?: number; businessType?: string }): Promise<OptimizeCardOutput> {
  try {
    // PASSO 1: Estratégia de Texto e Conceito Visual (Gemini 1.5 Flash)
    // Usamos o modelo estável para garantir que o copywriting de elite seja gerado.
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Você é um Diretor de Arte de marcas de luxo. 
      Sua tarefa é transformar este depoimento em uma peça de publicidade PREMIUM QUADRADA (1:1).
      
      DEPOIMENTO: "${input.text}"
      SETOR: "${input.businessType || 'Serviços'}"
      NOTA: ${input.rating || 5} estrelas

      REGRAS:
      1. Headline: Impactante, focada em autoridade, máx 4 palavras.
      2. BodyText: Refine o feedback para ser elegante, curto e emocionante.
      3. VisualConcept: Descreva uma imagem de fundo (prompt em inglês) que seja: Minimalista, LUXUOSA, focada em texturas (vidro, mármore, iluminação de estúdio) relacionadas ao setor ${input.businessType}. NÃO inclua pessoas ou rostos.`,
      output: { 
        format: 'json', 
        schema: StoryResponseSchema 
      }
    });

    if (!output) throw new Error("Falha na geração estratégica de texto.");

    // PASSO 2: Geração da Imagem Generativa (Gemini 2.5 Flash Image)
    // Este modelo cria a arte de fundo real baseada no conceito visual definido acima.
    try {
      const imageResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { text: `Create a professional, ultra-high-end, minimal background image for a business social card. Aspect ratio: square 1:1. Description: ${output.visualConcept}. Cinematic lighting, soft bokeh, neutral tones, premium atmosphere, 4K texture.` }
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      });

      const media = imageResponse.media;
      if (media && media.url) {
        output.backgroundImageUri = media.url;
      }
    } catch (imgErr) {
      console.error("AVISO: Falha na geração da imagem generativa, usando fallback visual.", imgErr);
      // Se a geração de imagem falhar (ex: segurança ou demanda), mantemos o texto gerado pela IA 
      // mas o dashboard aplicará um fundo de segurança premium.
    }

    return output;

  } catch (error: any) {
    console.error("ERRO CRÍTICO NA COMUNICAÇÃO COM API GEMINI:", error);
    
    // Fallback de Segurança: Retornamos os dados reais do usuário formatados 
    // para garantir que o dashboard nunca exiba erro 500.
    return {
      headline: "Depoimento Verificado",
      bodyText: input.text,
      author: input.userName || "Cliente VIP",
      tagline: "Compromisso com a Qualidade",
      visualConcept: "Sophisticated minimal texture",
    };
  }
}
