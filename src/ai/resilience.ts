/**
 * Resiliência para chamadas de IA: nova tentativa e modelo de reserva.
 *
 * Sem dependências externas de propósito, para poder ser testado isoladamente.
 *
 * Só erros TEMPORÁRIOS (sobrecarga do Google, limite de uso, instabilidade de rede)
 * disparam nova tentativa ou troca de modelo. Erros de configuração (chave inválida,
 * modelo inexistente, pedido inválido) são lançados na hora, para não ficarem escondidos
 * por trás do modelo de reserva.
 */

const TRANSIENT_STATUSES = new Set(['UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'DEADLINE_EXCEEDED']);

// Códigos de status do Genkit/Google que aparecem no texto do erro (maiúsculas, como vêm da API).
const TRANSIENT_STATUS_WORDS = /\b(?:UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED)\b|\[(?:429|500|502|503|504)\b/;

// Frases típicas de sobrecarga ou falha de rede.
const TRANSIENT_PHRASES =
  /service unavailable|high demand|overloaded|fetch failed|socket hang up|ECONNRESET|ETIMEDOUT/i;

/**
 * Diz se o erro é temporário (vale tentar de novo ou usar o modelo de reserva).
 */
export function isTransientError(error: unknown): boolean {
  const e = (error ?? {}) as { status?: unknown; message?: unknown };
  if (typeof e.status === 'string' && TRANSIENT_STATUSES.has(e.status)) return true;

  const message = typeof e.message === 'string' ? e.message : String(error);
  return TRANSIENT_STATUS_WORDS.test(message) || TRANSIENT_PHRASES.test(message);
}

export interface FallbackOptions {
  /** Tentativas no primeiro modelo (a primeira conta). Padrão: 2. */
  primaryAttempts?: number;
  /** Pausa em ms antes de repetir no mesmo modelo. Padrão: 800. */
  retryDelayMs?: number;
  /** Função de espera (existe para os testes não precisarem esperar de verdade). */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Executa `call` com o primeiro modelo da lista (repetindo uma vez em erro temporário)
 * e, se continuar falhando de forma temporária, tenta cada modelo seguinte uma vez.
 * Modelos repetidos na lista são ignorados. Erros que não são temporários são lançados
 * imediatamente.
 */
export async function runWithFallback<T>(
  models: string[],
  call: (model: string) => Promise<T>,
  options: FallbackOptions = {}
): Promise<T> {
  const { primaryAttempts = 2, retryDelayMs = 800, sleep = defaultSleep } = options;
  const unique = models.filter((model, i) => model && models.indexOf(model) === i);
  if (unique.length === 0) throw new Error('Nenhum modelo de IA configurado.');

  let lastError: unknown;

  for (let m = 0; m < unique.length; m++) {
    const model = unique[m];
    const attempts = m === 0 ? primaryAttempts : 1;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      if (attempt > 1) await sleep(retryDelayMs);
      try {
        return await call(model);
      } catch (error) {
        if (!isTransientError(error)) throw error;
        lastError = error;
        console.warn(
          `[IA] Erro temporário no modelo ${model} (tentativa ${attempt}/${attempts}):`,
          error instanceof Error ? error.message : error
        );
      }
    }

    if (m < unique.length - 1) {
      console.warn(`[IA] Trocando para o modelo de reserva ${unique[m + 1]}.`);
    }
  }

  throw lastError;
}
