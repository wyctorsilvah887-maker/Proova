
'use server';

import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

/**
 * Incrementa o contador de visitas da Página Pública.
 */
export async function trackPPVisit(userId: string) {
  try {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { 
      ppVisitCount: increment(1) 
    });
    return { success: true };
  } catch (err) {
    console.error("Erro ao track visitas PP:", err);
    return { success: false };
  }
}

/**
 * Incrementa o contador de cliques no botão de WhatsApp da Página Pública.
 */
export async function trackWhatsappClick(userId: string) {
  try {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { 
      whatsappClickCount: increment(1) 
    });
    return { success: true };
  } catch (err) {
    console.error("Erro ao track cliques WhatsApp:", err);
    return { success: false };
  }
}
