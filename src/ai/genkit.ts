
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Inicializa a instância global do Genkit com o plugin Google AI.
 * Atualizado para o modelo Gemini 3.8 Flash com prefixo de plugin.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-3.8-flash',
});

export const geminiModel = 'googleai/gemini-3.8-flash';
