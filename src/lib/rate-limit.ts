import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Limite de requisições por IP (janela fixa de 1 minuto), gravado só pelo servidor (firebase-admin).
 * - O IP é guardado como hash curto, nunca em texto puro.
 * - Cada janela é um documento (rate_limits/{ação}_{hash}_{minuto}) atualizado em transação,
 *   então não depende de consultas nem de índices e não cresce por requisição.
 * - Se a infraestrutura de limite falhar, a requisição passa (não derruba a coleta) e o erro é logado.
 * Opcional: ative uma política de TTL no campo `expireAt` da coleção `rate_limits` no Firebase
 * para limpar os documentos antigos automaticamente.
 */
export async function checkRateLimit(action: string, max = 15, message = 'Limite de requisições excedido. Tente novamente em um minuto.') {
  let blocked = false;
  try {
    const h = await headers();
    const ip = (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'unknown').split(',')[0].trim();
    const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);
    const minute = Math.floor(Date.now() / 60000);
    const db = adminDb();
    const ref = db.doc(`rate_limits/${action}_${ipHash}_${minute}`);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const count = (snap.exists ? (snap.data()!.count as number) : 0) || 0;
      if (count >= max) { blocked = true; return; }
      tx.set(ref, { action, count: count + 1, expireAt: new Date((minute + 10) * 60000) }, { merge: true });
    });
  } catch (e) {
    console.error('[rate-limit] falha ao verificar, liberando requisição:', (e as Error).message);
    return;
  }
  if (blocked) throw new Error(message);
}
