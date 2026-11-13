import { NextResponse } from 'next/server';
import { generateReplyAction } from '@/ai/flows/generate-reply-flow';
import mockData from '@/mocks/mock-reviews.json';

/**
 * API Route para processar avaliações do mock-reviews.json.
 * Filtra avaliações sem resposta e gera sugestões via IA (Gemini).
 */
export async function POST() {
  try {
    // 1. Pega as avaliações do primeiro estabelecimento do JSON
    const business = mockData[0];
    if (!business) {
      return NextResponse.json({ error: 'Nenhum dado de negócio localizado no mock.' }, { status: 404 });
    }

    const companyName = business.title;
    const businessType = business.categoryName;
    const reviews = business.reviews || [];

    // 2. Filtra apenas as avaliações que ainda não foram respondidas pelo dono
    const pendingReviews = reviews.filter(
      (review: any) => !review.responseFromOwnerText
    );

    if (pendingReviews.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Todas as avaliações já possuem resposta.',
        count: 0 
      });
    }

    // 3. Processar cada avaliação pendente enviando para a IA
    const results = await Promise.all(
      pendingReviews.map(async (review: any) => {
        const { reply } = await generateReplyAction({
          testimonialText: review.text || '(Avaliação apenas com estrelas)',
          rating: review.stars,
          companyName: companyName,
          businessType: businessType
        });

        return {
          reviewId: review.reviewId,
          reviewerName: review.name,
          stars: review.stars,
          originalText: review.text,
          aiSuggestedReply: reply
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: results.length,
      processedAt: new Date().toISOString(),
      suggestions: results
    });

  } catch (error: any) {
    console.error('Falha no processamento de reviews:', error);
    return NextResponse.json({ error: 'Falha ao processar avaliações: ' + error.message }, { status: 500 });
  }
}
