import { NextResponse, type NextRequest } from 'next/server';

/**
 * Endereço secreto do painel admin.
 * Com ADMIN_PATH definido (ex.: "ops-7k2m9x4p"): o painel só abre em /<ADMIN_PATH> e /admin responde 404,
 * como qualquer página que não existe. Sem ADMIN_PATH: nada muda (o painel segue em /admin).
 * Isto NÃO é a proteção: quem decide quem entra continua sendo o login + regras do Firestore.
 */
export function middleware(req: NextRequest) {
  const secret = (process.env.ADMIN_PATH || '').replace(/^\/+|\/+$/g, '');
  if (!secret || secret === 'admin') return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.rewrite(new URL('/_not-found-admin', req.url), { status: 404 });
  }
  if (pathname === `/${secret}` || pathname.startsWith(`/${secret}/`)) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin' + pathname.slice(secret.length + 1);
    const res = NextResponse.rewrite(url);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/|api/|.*\\..*).*)'] };
