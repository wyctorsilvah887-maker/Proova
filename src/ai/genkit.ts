
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

/**
 * Inicializa a instância global do Genkit com Vertex AI (Google Cloud).
 * Utiliza o projeto configurado em GCLOUD_PROJECT no .env.
 * Requer autenticação via Google Cloud SDK (gcloud auth application-default login).
 */
export const ai = genkit({
  plugins: [
    vertexAI({
      location: 'us-central1', // Região padrão para maior disponibilidade do Imagen 3
    }),
  ],
});
