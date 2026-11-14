import { NextResponse } from 'next/server';
import mockData from '@/mocks/mock-reviews.json';
import { generateReply } from '@/ai/reply';

/**
 * Rota de teste para validar a geração de respostas via IA.
 * Em caso de falha, devolve a mensagem real do erro (útil para diagnosticar modelo/chave).
 */
export async function GET() {
  try {
    const place = mockData[0];
    if (!place) {
      return NextResponse.json({ error: 'Nenhum dado localizado no mock.' }, { status: 404 });
    }

    const reviews = place.reviews || [];
    const pendingReviews = reviews.filter((r: any) => !r.responseFromOwnerText);

    const results = [];

    for (const review of pendingReviews.slice(0, 3)) {
      const aiResponse = await generateReply({
        authorName: review.name,
        rating: review.stars,
        text: review.text,
        companyName: place.title,
        businessType: place.categoryName || 'Negócio Local'
      });
      
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
