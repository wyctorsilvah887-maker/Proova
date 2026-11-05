
'use server';
/**
 * @fileOverview Flow para criação de Instagram Story Posts de luxo via Vertex AI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OptimizeCardInputSchema = z.object({
  text: z.string(),
  businessType: z.string().optional(),
});

const OptimizeCardOutputSchema = z.object({
  refinedText: z.string().describe('O depoimento refinado como uma frase de impacto para Story.'),
  bgPrompt: z.string().describe('Um prompt visual em inglês para gerar um fundo vertical 9:16 luxuoso.'),
});

const optimizeCardPrompt = ai.definePrompt({
  name: 'optimizeCardPrompt',
  model: 'vertexai/gemini-1.5-flash',
  input: { schema: OptimizeCardInputSchema },
  output: { schema: OptimizeCardOutputSchema },
  prompt: `Você é um Diretor de Arte de uma agência de luxo focado em Instagram Stories (Social Proof).
  
  O objetivo é criar um Story impactante baseado neste depoimento: "{{{text}}}"
  Setor do negócio: {{#if businessType}}{{{businessType}}}{{else}}Geral{{/if}}
  
  TAREFA:
  1. Refine o texto para ser uma frase curta e "matadora" (máximo 10 palavras). Deve evocar desejo e autoridade.
  2. Crie um prompt visual em INGLÊS para gerar um fundo vertical (9:16) no estilo Abstract Luxury.
     - O estilo deve ser: Abstract, luxury, minimalist, blurred textures, cinematic lighting.
     - Use cores que remetam ao setor: {{#if businessType}}{{{businessType}}}{{else}}Geral{{/if}}.
  
  Retorne exatamente no formato JSON solicitado.`,
});

export async function optimizeCard(input: z.infer<typeof OptimizeCardInputSchema>) {
  try {
    const { output } = await optimizeCardPrompt(input);
    if (!output) throw new Error("Erro na resposta estruturada da IA.");
    return output;
  } catch (err: any) {
    console.error("ERRO NO VERTEX AI (optimizeCard):", err);
    
    // Tratamento para erro de faturamento/projeto
    if (err.message?.includes('403') || err.message?.includes('permission denied')) {
      throw new Error("Erro de Permissão no Google Cloud: Verifique se a API do Vertex AI está habilitada e se você está autenticado.");
    }

    throw new Error(`Falha na IA (Vertex): ${err.message || 'Erro de conexão'}.`);
  }
}
