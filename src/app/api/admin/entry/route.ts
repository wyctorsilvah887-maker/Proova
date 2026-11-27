import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/** Devolve o endereço do painel admin SÓ para administradores (assim ele nunca vai no código público). */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  try {
    const { uid } = await adminAuth().verifyIdToken(token);
    const snap = await adminDb().doc(`users/${uid}`).get();
    if (snap.data()?.isAdmin !== true) return new NextResponse(null, { status: 404 });
    return NextResponse.json({ path: (process.env.ADMIN_PATH || 'admin').replace(/^\/+|\/+$/g, '') });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
