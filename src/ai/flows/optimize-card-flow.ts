'use server';

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Fluxo para criação de Social Cards Premium de Elite.
 * Transforma depoimentos em peças de design de alto impacto institucional.
 * Focado estritamente em layouts QUADRADOS (1:1).
 */

const StoryResponseSchema = z.object({
  headline: z.string().describe('Frase curta, impactante e comercial para o topo (gancho visual).'),
  bodyText: z.string().describe('O texto do feedback revisado, mantendo a essência original mas com tom elegante e sofisticado.'),
  author: z.string().describe('Nome do autor formatado de forma limpa.'),
  tagline: z.string().describe('Uma pequena frase final de autoridade (ex: "Selo de Excelência" ou "Qualidade Superior").'),
});

export type OptimizeCardOutput = z.infer<typeof StoryResponseSchema>;

export async function optimizeCard(input: { text: string; userName?: string; rating?: number; businessType?: string }): Promise<OptimizeCardOutput> {
  try {
    const response = await ai.generate({
      model: geminiModel,
      prompt: `Você é um Diretor de Arte de marcas de luxo (como Rolex, Apple ou Mercedes). 
      Sua tarefa é transformar um depoimento bruto em uma peça de publicidade PREMIUM para um post QUADRADO (1:1).
      
      DADOS DO DEPOIMENTO:
      - Texto: "${input.text}"
      - Autor: "${input.userName || 'Cliente VIP'}"
      - Estrelas: ${input.rating || 5}
      - Setor: ${input.businessType || 'Serviços'}

      REGRAS DE DESIGN & COPYWRITING:
      1. Headline: Um gancho magnético e extremamente curto (máximo 4 palavras). Deve passar autoridade imediata.
      2. BodyText: Refine o depoimento para ser emocionante e elegante. Remova gírias ou erros, mas mantenha a verdade do que foi dito. Formate para ser lido em no máximo 5 segundos.
      3. Tagline: Uma frase que passe segurança e exclusividade (máximo 3 palavras).
      4. Tom de voz: Sofisticado, minimalista e altamente institucional.
      
      O post será QUADRADO, então os textos devem ser centralizados e visualmente equilibrados.`,
      output: { 
        format: 'json', 
        schema: StoryResponseSchema 
      }
    });

    if (!response.output) throw new Error("A Inteligência falhou ao renderizar o design.");
    return response.output;

  } catch (error: any) {
    console.error("FALHA IA OPTIMIZE PREMIUM:", error);
    return {
      headline: "Autoridade Reconhecida",
      bodyText: input.text,
      author: input.userName || "Cliente VIP",
      tagline: "Compromisso com a Excelência"
    };
  }
}
