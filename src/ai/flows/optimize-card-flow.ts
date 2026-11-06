
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Fluxo de Design Generativo Proova Premium (v6.0).
 * Otimizado para seguir RIGOROSAMENTE as instruções do chat do usuário.
 */

const StoryResponseSchema = z.object({
  headline: z.string().describe('Frase curta de impacto.'),
  bodyText: z.string().describe('O texto do feedback revisado, curto e impactante.'),
  author: z.string().describe('Nome do autor formatado elegantemente.'),
  tagline: z.string().describe('Sempre: "feito pelo Proova IA Design"'),
  visualConcept: z.string().describe('Prompt detalhado em inglês para o motor de imagem. Deve ser EXTREMAMENTE específico sobre as cores e materiais que o usuário pediu.'),
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
    // Este modelo decide o conceito visual baseado na ordem do usuário.
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: `Você é um Diretor de Arte Criativo e OBEDIENTE.
      Sua missão é criar um design publicitário baseado na instrução do usuário.
      
      REGRAS CRÍTICAS:
      1. Se o usuário pedir uma COR, um TEMA ou MATERIAL, você DEVE ignorar o padrão preto/dourado e usar o que foi pedido.
      2. O campo 'visualConcept' deve ser um prompt em inglês PODEROSO para o motor de imagem.
      3. O texto (headline/bodyText) deve ser adaptado ao tom da conversa.`,
      prompt: `DADOS DO DEPOIMENTO:
      - TEXTO: "${input.text}"
      - SETOR: "${input.businessType || 'Geral'}"
      - NOME: "${input.userName || 'Cliente'}"

      ORDEM DO USUÁRIO NO CHAT:
      "${input.userInstruction || 'Crie um design luxuoso de alto padrão.'}"`,
      output: { 
        format: 'json', 
        schema: StoryResponseSchema 
      }
    });

    if (!output) throw new Error("Falha na geração de metadados");

    // PASSO 2: Geração da Imagem Real (Gemini 2.5 Flash Image)
    // O motor "banana" agora recebe uma ordem muito mais clara.
    try {
      const imageResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { text: `A professional advertising background, 1:1 square. NO TEXT, NO PEOPLE. Style: Cinematic, 8k, Clean. Concept: ${output.visualConcept}` }
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      });

      if (imageResponse.media?.url) {
        output.backgroundImageUri = imageResponse.media.url;
      }
    } catch (imgErr: any) {
      console.error("ERRO NA GERAÇÃO DA IMAGEM:", imgErr.message);
      output.backgroundImageUri = ''; 
    }

    return {
      ...output,
      author: input.userName || "Cliente VIP",
      tagline: "feito pelo Proova IA Design"
    };

  } catch (error: any) {
    console.error("Erro Crítico no Fluxo IA:", error.message);
    return {
      headline: input.userName || "Cliente VIP",
      bodyText: input.text,
      author: input.userName || "Cliente VIP",
      tagline: "feito pelo Proova IA Design",
      visualConcept: "Standard fallback",
    };
  }
}
