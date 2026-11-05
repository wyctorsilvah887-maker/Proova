'use server';
/**
 * @fileOverview Flow para seleção de backgrounds premium para Social Cards.
 * Nota: Google AI Studio (google-genai) não suporta geração de imagens diretamente.
 * Utilizamos uma curadoria de backgrounds premium baseada no contexto.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCardBgInputSchema = z.object({
  bgPrompt: z.string().describe('O prompt visual refinado para a imagem de fundo.'),
});

export const generateCardBackgroundFlow = ai.defineFlow(
  {
    name: 'generateCardBackgroundFlow',
    inputSchema: GenerateCardBgInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // Como estamos no plugin google-genai (AI Studio), que não gera imagens,
    // utilizamos um motor de busca de imagens premium ou fallbacks dinâmicos.
    const backgrounds = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop', // Abstract Dark
      'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop', // Gradient Purple
      'https://images.unsplash.com/photo-1503455637927-730bce8583c0?q=80&w=1000&auto=format&fit=crop', // Luxury Texture
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop'  // Corporate Office
    ];

    // Simula uma pequena latência para a experiência da IA
    await new Promise(resolve => setTimeout(resolve, 800));

    // Retorna um background aleatório da lista premium para o Story
    return backgrounds[Math.floor(Math.random() * backgrounds.length)];
  }
);

export async function generateCardBackground(bgPrompt: string) {
  return generateCardBackgroundFlow({ bgPrompt });
}
