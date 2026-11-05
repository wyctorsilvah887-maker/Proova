
import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';

/**
 * Inicializa a instância global do Genkit com o plugin Google AI.
 * Utiliza o modelo gemini20Flash como padrão.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: gemini20Flash,
});

export const geminiModel = gemini20Flash;
