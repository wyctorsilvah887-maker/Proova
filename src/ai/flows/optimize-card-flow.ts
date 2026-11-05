'use server';

import { ai, PRIMARY_MODEL } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Fluxo para criação de Social Cards Premium.
 * Transforma depoimentos brutos em peças de design de alto impacto.
 */

const StoryResponseSchema = z.object({
  headline: z.string().describe('Frase curta, impactante e comercial para o topo do story (gancho visual).'),
  bodyText: z.string().describe('O texto do feedback revisado, mantendo a essência original mas com tom elegante.'),
  author: z.string().describe('Nome do autor formatado de forma limpa.'),
  tagline: z.string().describe('Uma pequena frase final de autoridade (ex: "Experiência de Elite").'),
  bgPrompt: z.string().describe('Prompt visual em inglês para o background (ex: luxury minimalist textures).'),
});

export type OptimizeCardOutput = z.infer<typeof StoryResponseSchema>;

export async function optimizeCard(input: { text: string; businessType?: string }): Promise<OptimizeCardOutput> {
  try {
    const response = await ai.generate({
      model: PRIMARY_MODEL,
      prompt: `Você é um Diretor de Arte de marcas de luxo. 
      Sua tarefa é transformar este depoimento de cliente em um Story de Instagram de alto padrão: "${input.text}".
      
      REGRAS:
      1. Headline: Um gancho magnético (max 6 palavras).
      2. BodyText: Refine o texto para ser emocionante e elegante, mas fiel ao que o cliente disse.
      3. Tagline: Uma frase que passe segurança e exclusividade.
      4. Visual: O bgPrompt deve sugerir texturas luxuosas, mármore, vidro ou luzes suaves.`,
      output: { 
        format: 'json', 
        schema: StoryResponseSchema 
      }
    });

    if (!response.output) throw new Error("IA não retornou dados.");
    return response.output;

  } catch (error) {
    console.error("FALHA IA OPTIMIZE:", error);
    return {
      headline: "O que dizem nossos clientes",
      bodyText: input.text,
      author: "Cliente Satisfeito",
      tagline: "Compromisso com a Excelência",
      bgPrompt: "minimalist professional luxury background"
    };
  }
}
