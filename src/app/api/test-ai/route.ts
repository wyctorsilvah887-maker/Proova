import { NextResponse } from 'next/server';
import mockData from '@/mocks/mock-reviews.json';
import { generateReviewResponse } from '@/lib/gemini';

/**
 * Rota de teste temporária para validar a geração de respostas via IA
 * consumindo o arquivo de mock local da Apify.
 */
export async function GET() {
  try {
    const place = mockData[0];
    if (!place) {
      return NextResponse.json({ error: 'Nenhum dado localizado no mock.' }, { status: 404 });
    }

    const reviews = place.reviews || [];

    // Pega apenas as avaliações que ainda não foram respondidas pelo dono
    const pendingReviews = reviews.filter((r: any) => !r.responseFromOwnerText);

    const results = [];

    // Processa apenas as 3 primeiras para um teste rápido e controlado
    for (const review of pendingReviews.slice(0, 3)) {
      const aiResponse = await generateReviewResponse(
        review.text || '', 
        review.stars, 
        place.title
      );
      
      results.push({
        author: review.name,
        rating: review.stars,
        originalText: review.text || "(Apenas estrelas)",
        suggestedResponse: aiResponse
      });
    }

    return NextResponse.json({ 
      success: true, 
      business: place.title,
      processedCount: results.length,
      processed: results 
    });

  } catch (error: any) {
    console.error("Erro na rota de teste de IA:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
