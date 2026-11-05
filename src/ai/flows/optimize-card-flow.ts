'use server';
/**
 * @fileOverview Flow para criação de roteiro de design para Instagram Story via Gemini no Google AI Studio.
 * 
 * - optimizeCard - Transforma um depoimento em headline e prompt visual.
 * - OptimizeCardInput - Schema de entrada.
 * - OptimizeCardOutput - Schema de saída.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const OptimizeCardInputSchema = z.object({
  text: z.string(),
  businessType: z.string().optional(),
});

const OptimizeCardOutputSchema = z.object({
  refinedText: z.string().describe('O depoimento transformado em uma headline matadora.'),
  bgPrompt: z.string().describe('Um prompt visual em inglês para o motor de imagem.'),
});

export async function optimizeCard(input: z.infer<typeof OptimizeCardInputSchema>) {
  try {
    // No Genkit 1.x com o plugin @genkit-ai/google-genai, o ID do modelo deve ser prefixado com 'googleai/'
    // Utilizamos o Gemini 1.5 Flash por ser a versão de produção mais estável para o plugin atual.
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Você é um Diretor de Arte de marcas de luxo. 
      Sua tarefa é transformar um depoimento de cliente em um Story de Instagram de alto impacto.
      
      Depoimento: "${input.text}"
      Setor do Negócio: ${input.businessType || 'Premium Business'}
      
      INSTRUÇÕES:
      1. Headline (refinedText): Crie uma frase curta (max 8 palavras), poderosa e aspiracional baseada no elogio. Deve soar como uma marca de grife.
      2. Visual (bgPrompt): Crie um prompt detalhado em INGLÊS para gerar uma imagem de fundo 9:16. Foque em: iluminação de estúdio, texturas sofisticadas (mármore, seda, metal escovado), profundidade de campo rasa e estilo minimalista luxuoso.`,
      output: { schema: OptimizeCardOutputSchema },
      config: {
        temperature: 0.7,
      },
    });

    if (!response.output) {
      throw new Error("A IA não conseguiu estruturar os dados de retorno.");
    }

    return response.output;
  } catch (err: any) {
    console.error("ERRO GOOGLE AI (Optimize):", err);
    throw new Error(`Falha na IA (Google): ${err.message || 'Erro de comunicação'}.`);
  }
}
