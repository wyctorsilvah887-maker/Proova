
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

/**
 * Inicializa a instância global do Genkit com Vertex AI (Google Cloud).
 * O Project ID proova-513814 é o que você está configurando no terminal.
 */
export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: 'proova-513814',
      location: 'us-central1', 
    }),
  ],
});
