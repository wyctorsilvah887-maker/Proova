'use server';
/**
 * @fileOverview Fluxo para geração de respostas automáticas a depoimentos.
 * Sincronizado com a estratégia de Especialista em Experiência do Cliente.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateReplyInputSchema = z.object({
  authorName: z.string().describe('O nome do cliente que avaliou.'),
  testimonialText: z.string().describe('O texto escrito pelo cliente.'),
  rating: z.number().describe('A nota dada pelo cliente (1 a 5).'),
  companyName: z.string().describe('O nome da empresa/clínica.'),
  businessType: z.string().optional().describe('O setor de atuação da empresa.'),
});

export type GenerateReplyInput = z.infer<typeof GenerateReplyInputSchema>;

const GenerateReplyOutputSchema = z.object({
  reply: z.string().describe('A resposta gerada pela IA para ser exibida publicamente.'),
});

export type GenerateReplyOutput = z.infer<typeof GenerateReplyOutputSchema>;

const replyPrompt = ai.definePrompt({
  name: 'replyPrompt',
  input: { schema: GenerateReplyInputSchema },
  output: { schema: GenerateReplyOutputSchema },
  system: `Você é o especialista em experiência do cliente da empresa "{{companyName}}" ({{businessType}}).
Escreva uma resposta pública seguindo estas regras:
- Tom humano, acolhedor e natural. Proibido usar frases robóticas.
- Chame o cliente pelo primeiro nome (extraído de {{authorName}}).
- Máximo de 3 frases curtas.
- Mencione "{{companyName}}" naturalmente.
- Use no máximo 1 emoji discreto.
- Se for 4 ou 5 estrelas: agradeça pelo elogio específico.
- Se for 1 a 3 estrelas: peça desculpas sinceras e convide para resolver no WhatsApp da empresa.
- Retorne APENAS o texto da resposta.`,
  prompt: `Cliente: {{authorName}} | Nota: {{rating}} estrelas | Comentário: "{{{testimonialText}}}"`,
});

export async function generateReplyAction(input: GenerateReplyInput): Promise<GenerateReplyOutput> {
  try {
    const { output } = await replyPrompt(input, {
      model: 'googleai/gemini-3.0',
    });
    if (!output) throw new Error('Falha ao gerar resposta.');
    return output;
  } catch (error) {
    console.error('Erro na geração de resposta IA:', error);
    return { reply: `Olá ${input.authorName.split(' ')[0]}, muito obrigado pelo seu feedback! Valorizamos muito sua confiança na ${input.companyName}.` };
  }
}
