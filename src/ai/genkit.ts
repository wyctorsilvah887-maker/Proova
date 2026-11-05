
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Inicializa a instância global do Genkit com Google AI (Gemini API).
 * Este método é mais estável para ambientes de desenvolvimento por usar API Key.
 */
export const ai = genkit({
  plugins: [
    googleAI(), // A chave de API será lida automaticamente de GOOGLE_GENAI_API_KEY no .env
  ],
});
