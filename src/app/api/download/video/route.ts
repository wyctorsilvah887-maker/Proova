
import { NextResponse } from 'next/server';

/**
 * Route Handler para processar downloads de vídeo contornando CORS.
 * Recebe a URL e o nome do arquivo via query params e retorna um stream de download.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');
  const fileName = searchParams.get('name') || 'proova-video.mp4';

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
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Erro no proxy de download:', error);
    return new NextResponse('Erro ao processar download', { status: 500 });
  }
}
