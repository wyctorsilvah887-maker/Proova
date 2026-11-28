import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, adminCookieSecret, signAdminCookie } from '@/lib/admin-cookie';

/**
 * Só para administradores: devolve o endereço do painel e emite o cookie assinado que o middleware exige.
 * Quem não é admin recebe 404 (nada a revelar).
 */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  try {
    const { uid } = await adminAuth().verifyIdToken(token);
    const snap = await adminDb().doc(`users/${uid}`).get();
    if (snap.data()?.isAdmin !== true) return new NextResponse(null, { status: 404 });
    const res = NextResponse.json({ path: (process.env.ADMIN_PATH || 'admin').replace(/^\/+|\/+$/g, '') });
    const secret = adminCookieSecret();
    if (secret) {
      res.cookies.set(ADMIN_COOKIE, await signAdminCookie(uid, secret), {
        httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: ADMIN_COOKIE_MAX_AGE,
      });
    }
    return res;
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
