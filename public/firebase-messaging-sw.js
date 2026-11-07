
/*
* Service Worker para Notificações Push do Proova.
* Este arquivo lida com as mensagens em segundo plano.
*/

importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// Configurações do Firebase extraídas do config.ts
firebase.initializeApp({
  apiKey: "AIzaSyC0fZYE2DoAtkj3iz-ngO-79XCnL6lQAgc",
  authDomain: "studio-1166590320-ddf7e.firebaseapp.com",
  projectId: "studio-1166590320-ddf7e",
  storageBucket: "studio-1166590320-ddf7e.firebasestorage.app",
  messagingSenderId: "448308064085",
  appId: "1:448308064085:web:378b4b919207d6c49ec9dc"
});

const messaging = firebase.messaging();

// Captura mensagens em plano de fundo
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em background: ', payload);
  
  const notificationTitle = payload.notification.title || 'Novo Alerta Proova';
  const notificationOptions = {
    body: payload.notification.body || 'Você tem uma nova atualização na plataforma.',
    icon: '/maskable_icon_x192 (6).png',
    badge: '/maskable_icon_x192 (6).png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
