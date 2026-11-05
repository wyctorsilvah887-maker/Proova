
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Inicializa a instância global do Genkit com o plugin Google AI.
 * Atualizado para o modelo Gemini 3.8 Flash conforme recomendação.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'gemini-3.8-flash',
});

export const geminiModel = 'gemini-3.8-flash';
