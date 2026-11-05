
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

/**
 * Inicializa a instância global do Genkit com Vertex AI.
 * Project ID fixo conforme configurado no Google Cloud Console.
 */
export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: 'proova-513814',
      location: 'us-central1', 
    }),
  ],
});
