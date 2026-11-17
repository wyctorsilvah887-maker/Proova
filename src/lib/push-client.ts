import { getToken, isSupported } from 'firebase/messaging';
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
