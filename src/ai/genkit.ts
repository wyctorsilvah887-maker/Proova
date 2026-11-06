
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Inicializa a instância global do Genkit.
 * Configurado para ler explicitamente a API KEY do arquivo .env
 */
export const ai = genkit({
  plugins: [
    googleAI({
      // Forçamos o uso da chave do ambiente para garantir a comunicação
      apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY,
    }),
  ],
});

// Modelos de elite para copywriting e lógica
export const PRIMARY_MODEL = 'googleai/gemini-2.5-flash';
export const geminiModel = PRIMARY_MODEL;
