
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

/**
 * Referência tipada e segura para o modelo Gemini 1.5 Flash.
 * Usar esta referência nos fluxos evita o erro "Unknown action type".
 */
export const geminiModel = 'googleai/gemini-1.5-flash';
