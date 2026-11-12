
'use server';
/**
 * @fileOverview Fluxo para geração de respostas automáticas a depoimentos.
 * 
 * - generateReplyAction - Função que utiliza o Gemini para responder depoimentos baseado na nota e texto.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateReplyInputSchema = z.object({
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
  system: `Você é o Gestor de Reputação Digital da clínica {{companyName}}.
Sua missão é responder aos depoimentos dos pacientes de forma extremamente profissional, empática e estratégica.

### DIRETRIZES DE RESPOSTA:
1. **Para 4 ou 5 estrelas**: Seja efusivo, agradeça a confiança e reforce a missão da clínica em oferecer excelência. Se o cliente citar um procedimento, valide a escolha.
2. **Para 1 a 3 estrelas**: Use o protocolo "Reputation Shield". Seja diplomático, peça desculpas pela experiência não ter sido perfeita e convide o cliente para uma conversa privada para resolver o ocorrido. Nunca seja defensivo.
3. **Tom de Voz**: Profissional de saúde, acolhedor, executivo e elegante.
4. **Tamanho**: Respostas concisas (máximo 3 frases).

Contexto da Empresa: {{companyName}} (Setor: {{businessType}}).`,
  prompt: `O cliente avaliou com {{rating}} estrelas e escreveu: "{{{testimonialText}}}"`,
});

export async function generateReplyAction(input: GenerateReplyInput): Promise<GenerateReplyOutput> {
  try {
    const { output } = await replyPrompt(input);
    if (!output) throw new Error('Falha ao gerar resposta.');
    return output;
  } catch (error) {
    console.error('Erro na geração de resposta IA:', error);
    return { reply: `Muito obrigado pelo seu feedback! Valorizamos muito sua opinião e continuaremos trabalhando para oferecer o melhor atendimento em ${input.companyName}.` };
  }
}
