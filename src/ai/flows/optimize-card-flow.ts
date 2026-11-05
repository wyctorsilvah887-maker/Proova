'use server';

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Fluxo para criação de Social Cards Premium.
 * Transforma depoimentos brutos em peças de design de alto impacto.
 * Focado em copywriting de elite para layouts quadrados.
 */

const StoryResponseSchema = z.object({
  headline: z.string().describe('Frase curta, impactante e comercial para o topo (gancho visual).'),
  bodyText: z.string().describe('O texto do feedback revisado, mantendo a essência original mas com tom elegante.'),
  author: z.string().describe('Nome do autor formatado de forma limpa.'),
  tagline: z.string().describe('Uma pequena frase final de autoridade (ex: "Experiência de Elite").'),
});

export type OptimizeCardOutput = z.infer<typeof StoryResponseSchema>;

export async function optimizeCard(input: { text: string; businessType?: string }): Promise<OptimizeCardOutput> {
  try {
    const response = await ai.generate({
      model: geminiModel,
      prompt: `Você é um Diretor de Arte de marcas de luxo (como Rolex ou Mercedes). 
      Sua tarefa é refinar este depoimento de cliente para um card de Prova Social PREMIUM e QUADRADO: "${input.text}".
      
      REGRAS DE OURO:
      1. Headline: Um gancho magnético e curto (max 5 palavras).
      2. BodyText: Refine o texto para ser emocionante e elegante, mas fiel ao que o cliente disse.
      3. Tagline: Uma frase que passe segurança, exclusividade e autoridade máxima.
      4. Tom de voz: Sofisticado, minimalista e altamente profissional.`,
      output: { 
        format: 'json', 
        schema: StoryResponseSchema 
      }
    });

    if (!response.output) throw new Error("IA não retornou dados.");
    return response.output;

  } catch (error: any) {
    console.error("FALHA IA OPTIMIZE:", error);
    // Fallback de segurança para não quebrar a UI
    return {
      headline: "Excelência Comprovada",
      bodyText: input.text,
      author: "Cliente VIP",
      tagline: "Compromisso com a Perfeição"
    };
  }
}
