
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Inicializa a instância global do Genkit com o plugin Google AI.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-3.8-flash',
});

// Constantes de modelos para gestão de tráfego e fallback
export const PRIMARY_MODEL = 'googleai/gemini-3.8-flash';
export const FALLBACK_MODEL = 'googleai/gemini-1.5-flash';
