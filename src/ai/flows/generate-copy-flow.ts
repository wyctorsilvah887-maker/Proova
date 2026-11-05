
'use server';

import { ai, PRIMARY_MODEL } from '@/ai/genkit';
import { z } from 'genkit';

const CopyInputSchema = z.object({
  type: z.string().describe('O campo para o qual a copy será gerada.'),
  companyName: z.string().optional().describe('O nome da empresa.'),
  context: z.string().optional().describe('O contexto ou tom desejado.'),
});

export type CopyInput = z.infer<typeof CopyInputSchema>;

export async function generateCopy(input: CopyInput): Promise<string> {
  try {
    return await generateCopyFlow(input);
  } catch (error) {
    return "Transforme sua autoridade em lucro real hoje.";
  }
}

const generateCopyFlow = ai.defineFlow(
  {
    name: 'generateCopyFlow',
    inputSchema: CopyInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const promptText = `Gere uma copy matadora para o campo: ${input.type}.
        Empresa: ${input.companyName || 'Nossa Empresa'}.
        Contexto: ${input.context || 'Focar em autoridade'}.
        REGRAS: Apenas o texto, sem aspas, máximo 2 frases curtas.`;

    try {
      const response = await ai.generate({
        model: PRIMARY_MODEL,
        prompt: promptText,
      });
      
      return response.text || 'Transforme sua autoridade em lucro real hoje.';
    } catch (err: any) {
      console.error("ERRO GENKIT (Copy):", err);
      return "Transforme sua autoridade em lucro real hoje.";
    }
  }
);
