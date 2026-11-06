'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Fluxo de Design Generativo Proova Premium (v5.5).
 * Otimizado para seguir RIGOROSAMENTE as instruções do chat do usuário.
 */

const StoryResponseSchema = z.object({
  headline: z.string().describe('Frase curta de impacto.'),
  bodyText: z.string().describe('O texto do feedback revisado, curto e impactante.'),
  author: z.string().describe('Nome do autor formatado elegantemente.'),
  tagline: z.string().describe('Sempre: "feito pelo Proova IA Design"'),
  visualConcept: z.string().describe('Prompt detalhado em inglês para o motor de imagem, incorporando as cores e estilos pedidos pelo usuário.'),
  backgroundImageUri: z.string().optional().describe('A imagem gerada pela IA.'),
});

export type OptimizeCardOutput = z.infer<typeof StoryResponseSchema>;

export async function optimizeCard(input: { 
  text: string; 
  userName?: string; 
  rating?: number; 
  businessType?: string;
  userInstruction?: string; 
}): Promise<OptimizeCardOutput> {
  try {
    // PASSO 1: Inteligência de Design (Gemini 2.0 Flash)
    // Instruímos o modelo a dar prioridade ABSOLUTA à instrução do usuário.
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: `Você é um Diretor de Arte de marcas de luxo. 
      Sua missão é criar ou ajustar um design publicitário PREMIUM.
      
      REGRAS DE OURO:
      1. Se o usuário der uma instrução (cor, elemento, estilo), IGNORE o estilo padrão e siga a instrução dele.
      2. O 'visualConcept' deve ser um prompt em inglês para geração de imagem que descreva exatamente o que o usuário quer.
      3. Se não houver instrução, use o estilo luxo/corporativo clássico.`,
      prompt: `DADOS DO CLIENTE:
      - DEPOIMENTO: "${input.text}"
      - SETOR: "${input.businessType || 'Serviços'}"
      - NOME: "${input.userName || 'Cliente'}"

      INSTRUÇÃO ESPECÍFICA DO USUÁRIO (PRIORIDADE MÁXIMA):
      "${input.userInstruction || 'Crie um design de elite inicial.'}"`,
      output: { 
        format: 'json', 
        schema: StoryResponseSchema 
      }
    });

    if (!output) throw new Error("Falha na geração de metadados");

    // PASSO 2: Geração da Imagem (Gemini 2.5 Flash Image - Nano Banana)
    // Usamos o visualConcept gerado acima para pintar a tela.
    try {
      const imageResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { text: `An ultra-high-end square 1:1 artistic background. Style: ${output.visualConcept}. NO TEXT. Minimalist, cinematic lighting, 8k resolution.` }
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      });

      if (imageResponse.media?.url) {
        output.backgroundImageUri = imageResponse.media.url;
      }
    } catch (imgErr) {
      console.error("Erro na geração da imagem:", imgErr);
      // Fallback para uma cor sólida baseada na instrução se a imagem falhar
      output.backgroundImageUri = ''; 
    }

    return {
      ...output,
      author: input.userName || "Cliente VIP",
      tagline: "feito pelo Proova IA Design"
    };

  } catch (error: any) {
    console.error("Erro Crítico no Fluxo IA:", error);
    return {
      headline: input.userName || "Cliente VIP",
      bodyText: input.text,
      author: input.userName || "Cliente VIP",
      tagline: "feito pelo Proova IA Design",
      visualConcept: "Dark luxury gold",
    };
  }
}
