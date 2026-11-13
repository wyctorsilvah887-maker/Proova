import { ai } from '@/ai/genkit';

/**
 * Interface para parâmetros de geração de resposta.
 */
interface GenerateReplyParams {
  authorName: string;
  rating: number;
  reviewText: string | null;
  businessName: string;
  categoryName?: string;
}

/**
 * Função utilitária centralizada para geração de respostas estratégicas.
 * Aplica diretrizes de tom humano, personalização por primeiro nome e SEO local.
 */
export async function generateReviewResponse(params: GenerateReplyParams): Promise<string> {
  const { authorName, rating, reviewText, businessName, categoryName = 'Negócio Local' } = params;
  
  // Pega apenas o primeiro nome do avaliador para soar mais natural
  const firstName = authorName ? authorName.trim().split(' ')[0] : 'Cliente';

  const systemInstruction = `
Você é o especialista em experiência do cliente e reputação digital da empresa "${businessName}" (segmento: ${categoryName}).
Sua missão é escrever respostas públicas para avaliações deixadas por clientes no Google Maps.

DIRETRIZES DE TOM E ESTILO:
- Seja humano, caloroso, natural e empático. Evite clichês robóticos como "Agradecemos o seu contato", "Prezado cliente" ou "Sua opinião é muito importante para nós".
- Use o primeiro nome do cliente (${firstName}) de forma natural para criar conexão.
- Mantenha a resposta concisa: entre 2 e 3 frases curtas (ideal para leitura rápida no celular).
- Inclua o nome da empresa ("${businessName}") de forma orgânica na resposta para fortalecer o SEO local no Google.
- Não use hashtags e limite-se a no máximo 1 emoji sutil (ou nenhum, se o tom da avaliação for mais sério).

REGRAS POR CENÁRIO:
1. Nota 4 ou 5 estrelas COM texto: Agradeça especificamente pelo ponto que o cliente elogiou (ex: atendimento, agilidade, estrutura) e reforce que as portas estarão sempre abertas.
2. Nota 4 ou 5 estrelas SEM texto (apenas estrelas): Agradeça pela avaliação máxima e pela confiança no trabalho da equipe, desejando vê-lo novamente em breve.
3. Nota 1 a 3 estrelas (crítica ou insatisfação): Nunca discuta ou dê desculpas públicas. Peça desculpas sinceras pela experiência abaixo do esperado, valide o sentimento do cliente e convide-o a entrar em contato pelo canal direto/WhatsApp da empresa para resolver a situação imediatamente.

FORMATO DE SAÍDA:
- Retorne EXCLUSIVAMENTE o texto final da resposta pronta para ser publicada.
- Não adicione aspas, títulos, explicações ou saudações extras.
  `.trim();

  const userContent = reviewText && reviewText.trim().length > 0
    ? `Cliente: ${firstName} | Nota: ${rating}/5 | Comentário: "${reviewText}"`
    : `Cliente: ${firstName} | Nota: ${rating}/5 | Comentário: [Avaliação apenas com estrelas, sem texto escrito]`;

  try {
    const { text } = await ai.generate({
      model: 'googleai/gemini-3.0',
      system: systemInstruction,
      prompt: userContent,
      config: {
        temperature: 0.7,
      }
    });

    return text?.trim() || `Muito obrigado pela sua avaliação, ${firstName}! Valorizamos muito sua confiança na ${businessName}.`;
  } catch (error) {
    console.error("Erro ao gerar resposta com Gemini 3.0:", error);
    return `Obrigado pelo seu feedback, ${firstName}! É um prazer atender você na ${businessName}.`;
  }
}
