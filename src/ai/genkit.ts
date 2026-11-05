
import { genkit } from 'genkit';
import { googleAI, gemini25Flash } from '@genkit-ai/googleai';

/**
 * Inicializa a instância global do Genkit com o plugin Google AI.
 * Utiliza o modelo gemini25Flash como padrão.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: gemini25Flash,
});

export const geminiModel = gemini25Flash;
