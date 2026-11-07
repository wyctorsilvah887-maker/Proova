
'use client';

import { useState, useEffect } from 'react';
import { getToken, isSupported } from 'firebase/messaging';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from './use-toast';

/**
 * Hook para gerenciar permissões e tokens de Notificação Push (FCM).
 */
export function useNotifications(userId: string | undefined) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmSupported, setFcmSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      isSupported().then(yes => setFcmSupported(yes));
    }
  }, []);

  const requestPermission = async (vapidKey: string) => {
    if (!fcmSupported || !userId) {
      console.warn("FCM não suportado ou usuário não logado.");
      return;
    }

    try {
      // 1. Solicitar permissão ao navegador
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === 'granted') {
        const { messaging, firestore } = initializeFirebase();
        
        if (!messaging) {
          throw new Error("Messaging não inicializado.");
        }

        // 2. Registrar o Service Worker explicitamente para garantir que ele exista
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        
        console.log("Service Worker registrado para FCM:", registration);

        // 3. Obter o token
        const token = await getToken(messaging, { 
          vapidKey,
          serviceWorkerRegistration: registration
        });
        
        if (token) {
          console.log("Token FCM Gerado com sucesso:", token);
          
          // 4. Salva o token no perfil do usuário no Firestore
          const userRef = doc(firestore, 'users', userId);
          await updateDoc(userRef, {
            fcmToken: token,
            lastFcmUpdate: new Date().toISOString()
          });
          
          toast({
            title: "Notificações Ativas!",
            description: "Este dispositivo agora receberá seus alertas estratégicos.",
          });
        } else {
          throw new Error("Token não gerado pelo Firebase.");
        }
      }
    } catch (error: any) {
      console.error("Erro crítico ao configurar Notificações Push:", error);
      toast({
        variant: "destructive",
        title: "Falha nas Notificações",
        description: "Certifique-se de que o arquivo SW está acessível e a VAPID Key está correta.",
      });
    }
  };

  return { permission, isSupported: fcmSupported, requestPermission };
}
