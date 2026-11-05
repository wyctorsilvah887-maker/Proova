
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Inicializa a instância global do Genkit com o plugin Google AI.
 * Este plugin utiliza a API Key do Gemini.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
