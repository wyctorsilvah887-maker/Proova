
'use server';
/**
 * @fileOverview Flow para geração de copy persuasiva via Gemini no Google AI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CopyInputSchema = z.object({
  type: z.string().describe('Tipo do campo: hero_title, hero_subtitle, section_title, section_content'),
  companyName: z.string().optional(),
  context: z.string().optional(),
});

export const generateCopyFlow = ai.defineFlow(
  {
    name: 'generateCopyFlow',
    inputSchema: CopyInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const { text } = await ai.generate({
        model: 'gemini-1.5-flash',
        prompt: `Você é um copywriter de elite especialista em prova social. 
        Gere um texto curto, matador e altamente persuasivo para o campo: ${input.type}.
        Empresa: ${input.companyName || 'Nossa Empresa'}.
        Contexto: ${input.context || 'Focar em autoridade e confiança.'}.
        
        REGRAS:
        1. Retorne APENAS o texto sugerido.
        2. Sem aspas, sem explicações.
        3. Máximo de 2 frases.`,
      });
      return text || 'Transforme sua autoridade em lucro real hoje.';
    } catch (err: any) {
      console.error("ERRO GOOGLE AI (Copy):", err);
      return "Transforme sua autoridade em lucro real hoje.";
    }
  }
);
