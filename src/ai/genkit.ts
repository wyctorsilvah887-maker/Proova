
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

/**
 * Inicializa a instância global do Genkit com Vertex AI.
 * Vertex AI utiliza o faturamento padrão do Google Cloud.
 * Requer GOOGLE_CLOUD_PROJECT ou GCLOUD_PROJECT no ambiente.
 */
export const ai = genkit({
  plugins: [
    vertexAI({
      location: 'us-central1', // Região padrão com alta disponibilidade para Imagen/Gemini
    }),
  ],
});
