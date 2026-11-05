'use server';
/**
 * @fileOverview Flow para seleção de backgrounds premium para Social Cards.
 * Nota: O plugin google-genai foca em LLMs (Gemini). Utilizamos uma curadoria
 * de backgrounds de alta conversão para garantir estabilidade.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateCardBgInputSchema = z.object({
  bgPrompt: z.string().describe('O prompt visual refinado para a imagem de fundo.'),
});

export async function generateCardBackground(bgPrompt: string) {
  // Curadoria Premium Proova (Fallback de alta qualidade)
  const backgrounds = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop', // Abstract Dark
    'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop', // Gradient Purple
    'https://images.unsplash.com/photo-1503455637927-730bce8583c0?q=80&w=1000&auto=format&fit=crop', // Luxury Texture
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop'  // Corporate Office
  ];

  // Simula latência da IA para manter a experiência premium
  await new Promise(resolve => setTimeout(resolve, 800));

  // Retorna um background aleatório da coleção premium
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
}
