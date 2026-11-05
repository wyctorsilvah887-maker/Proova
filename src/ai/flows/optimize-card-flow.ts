'use server';
/**
 * @fileOverview Flow para otimização de conteúdo de Social Cards via Gemini.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OptimizeCardInputSchema = z.object({
  text: z.string(),
  businessType: z.string().optional(),
});

const OptimizeCardOutputSchema = z.object({
  refinedText: z.string().describe('O depoimento refinado, curto e impactante.'),
  bgPrompt: z.string().describe('Um prompt em inglês para gerar um fundo abstrato condizente.'),
});

// Definindo o prompt de forma estruturada (Padrão Genkit 1.x)
const optimizeCardPrompt = ai.definePrompt({
  name: 'optimizeCardPrompt',
  input: { schema: OptimizeCardInputSchema },
  output: { schema: OptimizeCardOutputSchema },
  prompt: `Você é um Diretor de Arte e Copywriter de elite especializado em posts de Instagram (Social Proof).
  
  Recebi este depoimento: "{{{text}}}"
  Setor do negócio: {{#if businessType}}{{{businessType}}}{{else}}Geral{{/if}}
  
  TAREFA:
  1. Refine o texto para ser uma "Headline" de impacto. Deve ser CURTA (máximo 12 palavras), poderosa e manter o sentimento original. Remova excessos.
  2. Crie um prompt visual em INGLÊS para o modelo Imagen gerar um fundo abstrato, moderno, minimalista e luxuoso. 
     - O fundo deve usar cores que remetam ao setor: {{#if businessType}}{{{businessType}}}{{else}}Geral{{/if}}.
     - O prompt deve focar em texturas, gradientes suaves e iluminação cinematográfica (estilo Behance/Dribbble).
  
  Retorne exatamente no formato JSON solicitado.`,
});

export async function optimizeCard(input: z.infer<typeof OptimizeCardInputSchema>) {
  try {
    // Chamando o prompt definido
    const { output } = await optimizeCardPrompt(input);
    
    if (!output) {
      throw new Error("A IA não retornou o formato esperado.");
    }
    
    return output;
  } catch (err: any) {
    // Log detalhado para o administrador no console do servidor
    console.error("ERRO CRÍTICO GENKIT (optimizeCard):", err);
    
    // Repassa o erro com uma mensagem mais técnica para ajudar no debug de produção
    throw new Error(`Falha na IA: ${err.message || 'Erro desconhecido'}. Verifique se a GOOGLE_GENAI_API_KEY está configurada corretamente.`);
  }
}

export const optimizeCardFlow = ai.defineFlow(
  {
    name: 'optimizeCardFlow',
    inputSchema: OptimizeCardInputSchema,
    outputSchema: OptimizeCardOutputSchema,
  },
  async (input) => optimizeCard(input)
);
