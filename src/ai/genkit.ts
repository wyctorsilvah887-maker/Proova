import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Inicializa a instância global do Genkit com o plugin Google AI.
 * Utilizamos o modelo gemini-1.5-flash por ser o mais estável para produção.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-1.5-flash',
});

// Constantes de modelos estáveis para garantir o funcionamento em produção
export const PRIMARY_MODEL = 'googleai/gemini-1.5-flash';
export const FALLBACK_MODEL = 'googleai/gemini-1.5-flash';
export const geminiModel = PRIMARY_MODEL;
