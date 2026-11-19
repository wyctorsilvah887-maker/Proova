import { NextResponse } from 'next/server';
import { getMessaging } from 'firebase-admin/messaging';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { SITE_URL } from '@/lib/site';

/** Envia um aviso de teste para os aparelhos do usuário logado e devolve o resultado (inclusive o motivo de falha). */
export async function POST(req: Request) {
  const idToken = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let uid: string;
  try { uid = (await adminAuth().verifyIdToken(idToken)).uid; } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  try {
    const tokens: string[] = (await adminDb().doc(`user_push/${uid}`).get()).data()?.tokens || [];
    if (!tokens.length) return NextResponse.json({ error: 'no_tokens' }, { status: 404 });
    const res = await getMessaging().sendEachForMulticast({
      tokens,
      data: { title: '✅ Avisos do Proova AI funcionando', body: 'Você receberá aqui os alertas de críticas e os lembretes de pedir avaliação.', link: `${SITE_URL}/dash`, tag: 'push-test' },
      webpush: { headers: { Urgency: 'high', TTL: '600' } },
    });
    const errors = [...new Set(res.responses.map((r) => r.error?.code).filter(Boolean))] as string[];
    return NextResponse.json({ ok: true, success: res.successCount, failure: res.failureCount, errors });
  } catch (e) {
    console.error('[push-test]', e);
    return NextResponse.json({ error: (e as Error).message?.includes('FIREBASE_SERVICE_ACCOUNT') ? 'service_account_missing' : 'server_error' }, { status: 500 });
  }
}
