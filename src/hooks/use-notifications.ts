
'use client';

import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from './use-toast';

/**
 * Hook para gerenciar permissões e tokens de Notificação Push (FCM).
 */
export function useNotifications(userId: string | undefined) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (vapidKey: string) => {
    if (!isSupported || !userId) return;

    try {
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === 'granted') {
        const { messaging, firestore } = initializeFirebase();
        if (!messaging) return;

        const token = await getToken(messaging, { vapidKey });
        
        if (token) {
          // Salva o token no perfil do usuário para envio futuro via backend/cloud functions
          await updateDoc(doc(firestore, 'users', userId), {
            fcmToken: token
          });
          
          toast({
            title: "Notificações Ativas!",
            description: "Você receberá alertas de novos depoimentos e suporte.",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão de push:", error);
    }
  };

  return { permission, isSupported, requestPermission };
}
