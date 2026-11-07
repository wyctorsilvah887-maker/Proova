import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Ponto de entrada para desenvolvimento Genkit.
 * Registra os fluxos de elite no ambiente centralizado.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

// Registro dos fluxos
import './flows/advisor-flow';
import './flows/transfer-email-flow';