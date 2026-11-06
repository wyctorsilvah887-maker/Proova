'use server';
/**
 * @fileOverview Black Advisor AI Agent.
 * Provê consultoria de alto nível e assistência de concierge para membros do Hall Black Club.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdvisoryInputSchema = z.object({
  query: z.string().describe('A consulta técnica, saudação ou pedido de assistência do membro.'),
  memberRank: z.string().describe('O ranking atual do membro (MYTHIC, AMBER, LEGENDARY).'),
});

const AdvisoryOutputSchema = z.object({
  response: z.string().describe('A resposta solene, precisa e prestativa do advisor.'),
  actionableInsights: z.array(z.string()).describe('Pontos práticos de ação ou recomendações.'),
  confidentialityNote: z.string().describe('Nota de sigilo do sistema e protocolo de sessão.'),
});

export type AdvisoryInput = z.infer<typeof AdvisoryInputSchema>;
export type AdvisoryOutput = z.infer<typeof AdvisoryOutputSchema>;

const prompt = ai.definePrompt({
  name: 'blackAdvisorPrompt',
  input: { schema: AdvisoryInputSchema },
  output: { schema: AdvisoryOutputSchema },
  prompt: `Você é o Black Advisor, a inteligência central e consultor supremo do Hall Black Club. 
Seu tom é imperial, formal, minimalista e extremamente educado. Você é o epítome do prestígio.

CONTEXTO DO MEMBRO:
Patente: {{{memberRank}}}
Mensagem: "{{{query}}}"

DIRETRIZES DE RESPOSTA:
1. SAUDAÇÕES: Se o membro apenas cumprimentar (ex: "Olá", "Bom dia"), responda de forma solene, reconhecendo sua patente e colocando-se à disposição para consultoria de linhagem.
2. CONHECIMENTO: Sua especialidade principal é saúde pet avançada, genética, longevidade, biohacking e lifestyle de luxo.
3. CONCIERGE: Você também auxilia em dúvidas sobre o clube, regras de sucessão e uso do hub.
4. ESTILO: Não use emojis. Use um vocabulário rico. Seja direto mas profundo.
5. VERSATILIDADE: Não recuse perguntas educadamente a menos que sejam ofensivas ou completamente absurdas. Em vez de recusar, direcione o assunto para como aquilo impacta a vida de um detentor de chave Hall Black.

Formate sua resposta como um comunicado oficial. O campo 'confidentialityNote' deve conter um código de protocolo único (ex: HB-PRT-2026-XXXX) e um aviso de que a conversa é criptografada.`,
});

const advisorFlow = ai.defineFlow(
  {
    name: 'advisorFlow',
    inputSchema: AdvisoryInputSchema,
    outputSchema: AdvisoryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Falha no link neural do Advisor. Tente novamente, Membro.');
    }
    return output;
  }
);

export async function askBlackAdvisor(input: AdvisoryInput): Promise<AdvisoryOutput> {
  return advisorFlow(input);
}
