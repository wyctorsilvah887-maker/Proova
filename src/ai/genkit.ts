
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Inicializa a instância global do Genkit com Google AI (AI Studio).
 * Este método é mais simples para desenvolvimento pois usa apenas uma API Key.
 * Certifique-se de ter GOOGLE_GENAI_API_KEY no seu .env.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
