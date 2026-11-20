
'use server';

import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { headers } from 'next/headers';

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|uptime|curl|wget|python|node-fetch|axios/i;

/** Robôs (buscadores, pré-visualização do WhatsApp, monitores) não contam como visita. */
async function isBot() {
  try { return BOT.test((await headers()).get('user-agent') || ''); } catch { return false; }
}

/**
 * Incrementa o contador de visitas da Página Pública (o navegador já manda no máx. 1x por dia, e nunca o dono/admin).
 */
export async function trackPPVisit(userId: string) {
  try {
    if (await isBot()) return { success: true, skipped: 'bot' };
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
    if (await isBot()) return { success: true, skipped: 'bot' };
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
