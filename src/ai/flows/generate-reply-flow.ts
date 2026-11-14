'use server';
/**
 * @fileOverview Server Action para gerar resposta automática a depoimentos.
 * A lógica (prompt, modelo, tratamento de erro) fica em '@/ai/reply'.
 * Se a IA falhar, esta ação lança erro; quem chama decide como tratar.
 */

import { generateReply } from '@/ai/reply';

export type GenerateReplyInput = {
  authorName: string;
  testimonialText: string;
  rating: number;
  companyName: string;
  businessType?: string;
};

export type GenerateReplyOutput = {
  reply: string;
};

export async function generateReplyAction(input: GenerateReplyInput): Promise<GenerateReplyOutput> {
  const reply = await generateReply({
    authorName: input.authorName,
    rating: input.rating,
    text: input.testimonialText,
    companyName: input.companyName,
    businessType: input.businessType,
  });
  return { reply };
}
