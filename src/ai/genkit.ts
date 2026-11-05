
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

/**
 * Inicializa a instância global do Genkit com Vertex AI (Google Cloud).
 * Forçamos o uso do Project ID para garantir que o ADC encontre o projeto correto.
 */
export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: process.env.GCLOUD_PROJECT || 'proova-513814',
      location: 'us-central1', 
    }),
  ],
});
