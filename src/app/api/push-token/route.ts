import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * Guarda o token de push do usuário logado em `user_push/{uid}` (coleção sem acesso pelo cliente),
 * assim os tokens nunca ficam no perfil público. Mantém no máximo 5 dispositivos por usuário.
 */
export async function POST(req: Request) {
  const idToken = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let uid: string;
  try { uid = (await adminAuth().verifyIdToken(idToken)).uid; } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }
  const token = body?.token;
  if (typeof token !== 'string' || token.length < 20 || token.length > 400) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  try {
    const ref = adminDb().doc(`user_push/${uid}`);
    await adminDb().runTransaction(async (tx) => {
      const cur: string[] = (await tx.get(ref)).data()?.tokens || [];
      const next = [...cur.filter((t) => t !== token), token].slice(-5);
      tx.set(ref, { tokens: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[push-token]', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
