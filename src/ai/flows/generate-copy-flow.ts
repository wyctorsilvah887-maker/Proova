
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CopyInputSchema = z.object({
  type: z.string().describe('O campo para o qual a copy será gerada (ex: título, subtítulo).'),
  companyName: z.string().optional().describe('O nome da empresa.'),
  context: z.string().optional().describe('O contexto ou tom desejado para a copy.'),
});

export type CopyInput = z.infer<typeof CopyInputSchema>;

export async function generateCopy(input: CopyInput): Promise<string> {
  return generateCopyFlow(input);
}

const generateCopyFlow = ai.defineFlow(
  {
    name: 'generateCopyFlow',
    inputSchema: CopyInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const response = await ai.generate({
        model: 'gemini-1.5-flash',
        prompt: `Você é um copywriter especialista em prova social e conversão. 
        Gere um texto matador para o campo: ${input.type}.
        Empresa: ${input.companyName || 'Nossa Empresa'}.
        Contexto: ${input.context || 'Focar em autoridade e confiança'}.
        
        REGRAS:
        1. Apenas o texto sugerido, sem explicações.
        2. Sem aspas.
        3. Máximo 2 frases curtas e impactantes.`,
      });
      
      return response.text || 'Transforme sua autoridade em lucro real hoje.';
    } catch (err) {
      console.error("ERRO GOOGLE AI (Copy):", err);
      return "Transforme sua autoridade em lucro real hoje.";
    }
  }
);
