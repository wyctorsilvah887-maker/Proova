import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Lê a chave da conta de serviço da variável FIREBASE_SERVICE_ACCOUNT
 * (JSON puro ou em base64). Nunca vai para o código nem para o GitHub.
 */
export function parseServiceAccount(raw: string | undefined) {
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT não configurado.');
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const sa = JSON.parse(text);
  if (!sa.project_id || !sa.client_email || !sa.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT inválido (faltam campos).');
  }
  return { projectId: sa.project_id, clientEmail: sa.client_email, privateKey: String(sa.private_key).replace(/\\n/g, '\n') };
}

function adminApp(): App {
  return getApps()[0] ?? initializeApp({ credential: cert(parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

/** Firestore com privilégio de servidor (ignora as regras). Só usar em rotas de API/server actions. */
export function adminDb(): Firestore {
  return getFirestore(adminApp());
}
