
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Configuração idêntica à do app para que o SW possa se comunicar com o FCM
firebase.initializeApp({
  apiKey: "AIzaSyC0fZYE2DoAtkj3iz-ngO-79XCnL6lQAgc",
  authDomain: "studio-1166590320-ddf7e.firebaseapp.com",
  projectId: "studio-1166590320-ddf7e",
  storageBucket: "studio-1166590320-ddf7e.firebasestorage.app",
  messagingSenderId: "448308064085",
  appId: "1:448308064085:web:378b4b919207d6c49ec9dc"
});

const messaging = firebase.messaging();

// Mensagens em segundo plano (aba/app fechado). Os avisos do suporte chegam só com `data`
// (title, body, link, tag) e a notificação é montada aqui; se vier com `notification`, o navegador já exibe.
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;
  const d = payload.data || {};
  self.registration.showNotification(d.title || 'Proova AI', {
    body: d.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    requireInteraction: true,
    data: { link: d.link || '/' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url === link && 'focus' in c) return c.focus();
      }
      return clients.openWindow(link);
    })
  );
});
