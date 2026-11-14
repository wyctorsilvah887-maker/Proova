import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuração central do Genkit para o Proova AI.
 *
 * Os modelos são definidos em um único lugar:
 * - AI_MODEL: modelo principal (padrão: gemini-3.8-flash).
 * - AI_FALLBACK_MODEL: modelo de reserva, usado quando o principal fica sobrecarregado
 *   (padrão: gemini-3.5-flash-lite). Se for igual ao principal, a reserva é ignorada.
 * Ambos podem ser trocados por variável de ambiente, sem mexer no código.
 * IDs válidos: https://ai.google.dev/gemini-api/docs/models
 *
 * A chave da API é lida pelo plugin a partir de GEMINI_API_KEY (ou GOOGLE_API_KEY).
 */
const withoutPrefix = (name: string) => name.replace(/^googleai\//, '');

const modelName = withoutPrefix(process.env.AI_MODEL || 'gemini-3.8-flash');
const fallbackName = withoutPrefix(process.env.AI_FALLBACK_MODEL || 'gemini-3.5-flash-lite');

export const AI_MODEL = `googleai/${modelName}`;
export const AI_FALLBACK_MODEL = `googleai/${fallbackName}`;

export const ai = genkit({
  plugins: [googleAI()],
  model: AI_MODEL,
});
