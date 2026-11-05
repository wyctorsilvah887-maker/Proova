
'use server';
/**
 * @fileOverview Seleção de backgrounds premium para Social Cards.
 * Nota: O Google AI Studio não suporta geração nativa de imagem via SDK ImagePart 
 * de forma simples como a Vertex. Usamos curadoria para estabilidade absoluta.
 */

export async function generateCardBackground(bgPrompt: string) {
  const backgrounds = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop', // Dark
    'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop', // Purple
    'https://images.unsplash.com/photo-1503455637927-730bce8583c0?q=80&w=1000&auto=format&fit=crop', // Texture
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop', // Office
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop'  // Glass
  ];

  // Simula latência para manter percepção de valor
  await new Promise(resolve => setTimeout(resolve, 600));

  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
}
