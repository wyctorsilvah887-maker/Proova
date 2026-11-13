import { ai } from '@/ai/genkit';

/**
 * Função utilitária para geração de respostas a avaliações do Google Maps.
 * Utiliza o Genkit (Gemini 2.5 Flash) configurado na plataforma para garantir conformidade e performance.
 */
export async function generateReviewResponse(reviewText: string, rating: number, businessName: string) {
  // Trata o caso de avaliações de 5 estrelas sem texto
  const comment = reviewText && reviewText.trim() !== '' 
    ? `O cliente disse: "${reviewText}"` 
    : `O cliente deixou apenas ${rating} estrelas, sem comentário escrito.`;

  const promptText = `
    Você é a inteligência artificial de atendimento da empresa "${businessName}".
    Uma nova avaliação foi deixada no Google Maps com nota ${rating} de 5.
    ${comment}

    Escreva uma resposta profissional, empática, acolhedora e curta (máximo de 3 frases) agradecendo o feedback. 
    Se a nota for 4 ou 5 estrelas, reforce a alegria em atender bem. 
    Se a nota for baixa (1 a 3 estrelas), mantenha a postura calma, peça desculpas por qualquer falha e convide o cliente a falar no privado para resolver o problema.
    Retorne APENAS o texto da resposta, sem aspas ou introduções.
  `;

  try {
    const { text } = await ai.generate(promptText);
    
    return text?.trim() || "Obrigado pelo seu feedback! Ficamos felizes em atendê-lo e continuaremos trabalhando para oferecer a melhor experiência.";
  } catch (error) {
    console.error("Erro ao gerar resposta com Gemini/Genkit:", error);
    return "Muito obrigado pelo seu feedback! Valorizamos muito sua opinião.";
  }
}
