import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, adminCookieSecret, verifyAdminCookie } from '@/lib/admin-cookie';

/**
 * Painel admin invisível para quem não é admin.
 *  - Cookie assinado (proova_adm): só o servidor emite, em /api/admin/entry, depois de checar o login e o isAdmin.
 *    Sem cookie válido, /admin (ou o endereço secreto) responde 404 como qualquer página que não existe.
 *    Precisa de ADMIN_COOKIE_SECRET (ou CRON_SECRET) definido; sem segredo, essa checagem fica desligada.
 *  - ADMIN_PATH (opcional): o painel passa a abrir só em /<ADMIN_PATH> e /admin responde 404 para todos.
 * Isto é uma camada a mais: a proteção real continua sendo o login + as regras do Firestore.
 */
export async function middleware(req: NextRequest) {
  const secretPath = (process.env.ADMIN_PATH || '').replace(/^\/+|\/+$/g, '');
  const customPath = !!secretPath && secretPath !== 'admin';
  const { pathname } = req.nextUrl;
  const isAdminUrl = pathname === '/admin' || pathname.startsWith('/admin/');
  const isSecretUrl = customPath && (pathname === `/${secretPath}` || pathname.startsWith(`/${secretPath}/`));
  if (!isAdminUrl && !isSecretUrl) return NextResponse.next();

  const notFound = () => NextResponse.rewrite(new URL('/_not-found-admin', req.url), { status: 404 });
  if (isAdminUrl && customPath) return notFound();

  const secret = adminCookieSecret();
  if (secret && !(await verifyAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value, secret))) return notFound();

  let res: NextResponse;
  if (isSecretUrl) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin' + pathname.slice(secretPath.length + 1);
    res = NextResponse.rewrite(url);
  } else {
    res = NextResponse.next();
  }
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = { matcher: ['/((?!_next/|api/|.*\\..*).*)'] };
