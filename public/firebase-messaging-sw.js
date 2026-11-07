
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');

// Configuração idêntica ao src/firebase/config.ts
// Estes dados são públicos e seguros para estarem aqui.
firebase.initializeApp({
  apiKey: "AIzaSyC0fZYE2DoAtkj3iz-ngO-79XCnL6lQAgc",
  authDomain: "studio-1166590320-ddf7e.firebaseapp.com",
  projectId: "studio-1166590320-ddf7e",
  storageBucket: "studio-1166590320-ddf7e.firebasestorage.app",
  messagingSenderId: "448308064085",
  appId: "1:448308064085:web:378b4b919207d6c49ec9dc"
});

const messaging = firebase.messaging();

// Handler para notificações em background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem em background recebida: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/Logotipo%20PROOVA%20white%20mode%201.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
