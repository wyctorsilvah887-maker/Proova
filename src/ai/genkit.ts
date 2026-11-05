
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Inicializa a instância global do Genkit com o plugin Google AI.
 * Utilizamos a string 'gemini-1.5-flash' para garantir compatibilidade e estabilidade.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'gemini-1.5-flash',
});

export const geminiModel = 'gemini-1.5-flash';
