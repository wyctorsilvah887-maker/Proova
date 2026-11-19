import { getToken, isSupported, onMessage } from 'firebase/messaging';
import { initializeFirebase } from '@/firebase';

/** Pede permissão, registra o service worker e devolve o token FCM deste dispositivo. Lança Error com mensagem amigável. */
export async function getPushToken(): Promise<string> {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error('Notificações ainda não configuradas (chave VAPID ausente).');
  if (typeof window === 'undefined' || !('Notification' in window) || !(await isSupported())) {
    throw new Error('Este navegador não suporta notificações. No iPhone, instale o app na tela inicial.');
  }
  const status = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (status !== 'granted') throw new Error('Permissão de notificação negada no navegador.');
  const { messaging } = initializeFirebase();
  if (!messaging) throw new Error('Mensageria indisponível.');
  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
  if (!token) throw new Error('Token não gerado.');
  return token;
}

/**
 * Com a aba aberta e em foco o FCM NÃO chama o service worker: a mensagem cai aqui e nada aparece sozinho.
 * Escuta em primeiro plano e devolve título/corpo/link (o chamador mostra um aviso na tela).
 * Também exibe a notificação do sistema, para quem está com outra janela por cima.
 */
export async function listenForeground(cb: (m: { title: string; body: string; link: string }) => void): Promise<() => void> {
  try {
    if (typeof window === 'undefined' || !(await isSupported())) return () => {};
    const { messaging } = initializeFirebase();
    if (!messaging) return () => {};
    return onMessage(messaging, (payload) => {
      const d: any = payload.data || {};
      const title = d.title || payload.notification?.title || 'Proova AI';
      const body = d.body || payload.notification?.body || '';
      const link = d.link || '/';
      cb({ title, body, link });
      try {
        if (Notification.permission === 'granted') {
          navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js').then((reg) => reg?.showNotification(title, {
            body, icon: '/android-chrome-192x192.png', badge: '/favicon-32x32.png', tag: d.tag || undefined, data: { link },
          }));
        }
      } catch {}
    });
  } catch {
    return () => {};
  }
}
