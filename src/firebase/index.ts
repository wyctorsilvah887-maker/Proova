
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { firebaseConfig } from './config';

/**
 * Inicializa as instâncias do Firebase de forma padrão e estável.
 * Força o uso de experimentalForceLongPolling para garantir compatibilidade com ambientes de nuvem/proxy.
 */
export function initializeFirebase(): {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  messaging: Messaging | null;
} {
  let app: FirebaseApp;
  let firestore: Firestore;

  if (getApps().length > 0) {
    app = getApp();
    firestore = getFirestore(app);
  } else {
    app = initializeApp(firebaseConfig);
    // Ativa Long Polling para evitar erros de porta e protocolos em Cloud Workstations
    firestore = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  }

  const auth = getAuth(app);
  const storage = getStorage(app);
  
  // Messaging só funciona no cliente
  let messaging: Messaging | null = null;
  if (typeof window !== 'undefined') {
    isSupported().then(yes => {
      if (yes) messaging = getMessaging(app);
    });
  }
  
  return { app, firestore, auth, storage, messaging };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
