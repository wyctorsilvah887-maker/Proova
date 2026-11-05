
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

/**
 * Inicializa a instância global do Genkit com Vertex AI (Google Cloud).
 * Forçamos o ID do projeto e a localização para garantir que o ADC (Application Default Credentials)
 * funcione corretamente no ambiente Windows do usuário.
 */
export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: 'proova-513814',
      location: 'us-central1', // Localização padrão para Vertex AI
    }),
  ],
});
