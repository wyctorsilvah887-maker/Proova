
import { NextResponse } from 'next/server';

/**
 * Route Handler para processar downloads e visualização de vídeo contornando CORS.
 * Atua como um proxy para permitir que o Canvas grave o vídeo sem erros de segurança.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return new NextResponse('URL do vídeo é obrigatória', { status: 400 });
  }

  try {
    const response = await fetch(videoUrl);

    if (!response.ok) {
      throw new Error(`Falha ao buscar vídeo: ${response.statusText}`);
    }

    const videoBuffer = await response.arrayBuffer();

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Erro no proxy de vídeo:', error);
    return new NextResponse('Erro ao processar vídeo', { status: 500 });
  }
}
