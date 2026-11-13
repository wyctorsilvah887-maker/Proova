import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuração central do Genkit para o Proova AI.
 * Utiliza o modelo Gemini 3.0 conforme solicitado para máxima performance e inteligência.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-3.0',
});
