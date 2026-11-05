'use server';
/**
 * @fileOverview Flow para criação de Instagram Story Posts de luxo via Gemini.
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
  model: 'googleai/gemini-1.5-flash-latest',
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
    console.error("ERRO NO GEMINI (optimizeCard):", err);
    
    // Tratamento específico para erro de créditos/faturamento (402)
    if (err.message?.includes('402') || err.message?.includes('credits are depleted')) {
      throw new Error("Créditos de IA Esgotados: Acesse o Google AI Studio para verificar seu saldo ou plano gratuito.");
    }

    // Se o erro persistir, lançamos a mensagem original para diagnóstico real
    throw new Error(`Falha na IA: ${err.message || 'Erro de conexão'}. Verifique se a sua chave no AI Studio está ativa e permite o modelo gemini-1.5-flash-latest.`);
  }
}
