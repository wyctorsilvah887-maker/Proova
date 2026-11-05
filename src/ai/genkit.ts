import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Inicializa a instância global do Genkit.
 * O plugin googleAI busca automaticamente pelas variáveis de ambiente:
 * 1. GOOGLE_GENAI_API_KEY
 * 2. GOOGLE_API_KEY
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
