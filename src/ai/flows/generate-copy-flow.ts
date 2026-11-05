
'use server';
/**
 * @fileOverview Flow para geração de copy persuasiva via Google AI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CopyInputSchema = z.object({
  type: z.string(),
  companyName: z.string().optional(),
  context: z.string().optional(),
});

export async function generateCopy(input: z.infer<typeof CopyInputSchema>) {
  try {
    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Você é um copywriter especialista em prova social. 
      Gere um texto matador para o campo: ${input.type}.
      Empresa: ${input.companyName || 'Nossa Empresa'}.
      Contexto: ${input.context || 'Focar em autoridade'}.
      
      REGRAS:
      1. Apenas o texto sugerido.
      2. Sem aspas.
      3. Máximo 2 frases.`,
    });
    
    return text || 'Transforme sua autoridade em lucro real hoje.';
  } catch (err: any) {
    console.error("ERRO GOOGLE AI (Copy):", err);
    return "Transforme sua autoridade em lucro real hoje.";
  }
}
