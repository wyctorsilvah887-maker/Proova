import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuração central do Genkit para o Proova AI.
 *
 * O modelo é definido em um único lugar. Para trocar, mude o valor padrão abaixo
 * ou defina a variável de ambiente AI_MODEL (ex.: AI_MODEL=gemini-3.5-flash-lite).
 * IDs válidos: https://ai.google.dev/gemini-api/docs/models
 *
 * A chave da API é lida pelo plugin a partir de GEMINI_API_KEY (ou GOOGLE_API_KEY).
 */
const modelName = (process.env.AI_MODEL || 'gemini-3.8-flash').replace(/^googleai\//, '');

export const AI_MODEL = `googleai/${modelName}`;

export const ai = genkit({
  plugins: [googleAI()],
  model: AI_MODEL,
});
