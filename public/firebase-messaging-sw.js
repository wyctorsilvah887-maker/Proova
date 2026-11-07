
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

// Escutador para mensagens em background (aba fechada)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem em background recebida: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/maskable_icon_x192 (6).png',
    badge: '/favicon-32x32.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
