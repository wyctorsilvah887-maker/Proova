'use server';
/**
 * @fileOverview Flow para otimização de conteúdo de Social Cards.
 * 
 * - optimizeCardFlow - Refina o texto do depoimento e sugere um prompt visual.
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

export async function optimizeCard(input: z.infer<typeof OptimizeCardInputSchema>) {
  const { output } = await ai.generate({
    prompt: `Você é um Diretor de Arte e Copywriter de elite especializado em posts de Instagram (Social Proof).
    
    Recebi este depoimento: "${input.text}"
    Setor do negócio: ${input.businessType || 'Geral'}
    
    TAREFA:
    1. Refine o texto para ser uma "Headline" de impacto. Deve ser CURTA (máximo 12 palavras), poderosa e manter o sentimento original. Remova excessos.
    2. Crie um prompt visual em INGLÊS para o modelo Imagen gerar um fundo abstrato, moderno, minimalista e luxuoso. 
       - O fundo deve usar cores que remetam ao setor: ${input.businessType}.
       - O prompt deve focar em texturas, gradientes suaves e iluminação cinematográfica (estilo Behance/Dribbble).
    
    Retorne exatamente no formato JSON solicitado.`,
    output: { schema: OptimizeCardOutputSchema }
  });
  return output!;
}

export const optimizeCardFlow = ai.defineFlow(
  {
    name: 'optimizeCardFlow',
    inputSchema: OptimizeCardInputSchema,
    outputSchema: OptimizeCardOutputSchema,
  },
  async (input) => optimizeCard(input)
);
