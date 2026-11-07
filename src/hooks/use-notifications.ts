
'use client';

import { useState, useEffect } from 'react';
import { getToken, isSupported } from 'firebase/messaging';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from './use-toast';

/**
 * Hook para gerenciar permissões e tokens de Notificação Push (FCM).
 * Corrigido para registrar o Service Worker e garantir o salvamento do token.
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
        
        // 2. Registrar o Service Worker explicitamente
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log("Service Worker registrado com sucesso:", registration);

        // 3. Obter o token passando o registro do SW
        const token = await getToken(messaging!, { 
          vapidKey,
          serviceWorkerRegistration: registration
        });
        
        if (token) {
          console.log("Token FCM Gerado:", token);
          
          // 4. Salva o token no perfil do usuário no Firestore
          const userRef = doc(firestore, 'users', userId);
          await updateDoc(userRef, {
            fcmToken: token,
            lastFcmUpdate: new Date().toISOString()
          });
          
          toast({
            title: "Notificações Ativas!",
            description: "Você receberá alertas de novos depoimentos e suporte.",
          });
        } else {
          console.warn("Não foi possível obter o token FCM.");
        }
      }
    } catch (error) {
      console.error("Erro crítico ao configurar Notificações Push:", error);
      toast({
        variant: "destructive",
        title: "Falha nas Notificações",
        description: "Não conseguimos registrar seu dispositivo para alertas.",
      });
    }
  };

  return { permission, isSupported: fcmSupported, requestPermission };
}
