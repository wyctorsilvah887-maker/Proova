'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Fluxo de Design Generativo Proova Premium (v5.6).
 * Otimizado para seguir RIGOROSAMENTE as instruções do chat do usuário.
 */

const StoryResponseSchema = z.object({
  headline: z.string().describe('Frase curta de impacto.'),
  bodyText: z.string().describe('O texto do feedback revisado, curto e impactante.'),
  author: z.string().describe('Nome do autor formatado elegantemente.'),
  tagline: z.string().describe('Sempre: "feito pelo Proova IA Design"'),
  visualConcept: z.string().describe('Prompt detalhado em inglês para o motor de imagem. Deve ser EXTREMAMENTE específico sobre as cores e materiais que o usuário pediu no chat.'),
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
    // Forçamos o modelo a abandonar o "luxo padrão" se o usuário pedir algo diferente.
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: `Você é um Diretor de Arte Criativo e OBEDIENTE.
      Sua missão é criar um design publicitário baseado na instrução do usuário.
      
      REGRAS CRÍTICAS:
      1. Se o usuário pedir uma COR, um TEMA (ex: neon, rústico, futurista) ou um ELEMENTO, você deve focar 100% nisso.
      2. O campo 'visualConcept' deve ser um prompt em inglês poderoso para o motor de imagem (Gemini 2.5 Flash Image).
      3. Seja drástico na variação. Se pedirem azul, não use dourado. Se pedirem rústico, não use metal.
      4. O texto (headline/bodyText) deve acompanhar o TOM da instrução do usuário.`,
      prompt: `DADOS DO CLIENTE:
      - DEPOIMENTO: "${input.text}"
      - SETOR: "${input.businessType || 'Serviços'}"
      - NOME: "${input.userName || 'Cliente'}"

      INSTRUÇÃO DO USUÁRIO (PRIORIDADE MÁXIMA):
      "${input.userInstruction || 'Crie um design de luxo inicial com tons escuros e dourados.'}"`,
      output: { 
        format: 'json', 
        schema: StoryResponseSchema 
      }
    });

    if (!output) throw new Error("Falha na geração de metadados");

    // PASSO 2: Geração da Imagem (Gemini 2.5 Flash Image)
    // O motor de imagem agora recebe uma ordem muito mais forte baseada na visualConcept.
    try {
      const imageResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { text: `A 1:1 square advertising background, professional photography style. NO TEXT, NO PEOPLE. Concept: ${output.visualConcept}. High resolution, clean composition, 8k.` }
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      });

      if (imageResponse.media?.url) {
        output.backgroundImageUri = imageResponse.media.url;
      }
    } catch (imgErr: any) {
      console.error("ERRO NA GERAÇÃO DA IMAGEM (Verifique sua API Key):", imgErr.message);
      // Fallback: Se a imagem falhar (provavelmente por causa da chave de API mencionada no seu Studio), 
      // o card usará o gradiente padrão do CSS.
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
      visualConcept: "Standard dark luxury",
    };
  }
}