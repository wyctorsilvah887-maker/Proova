import { updateDoc, serverTimestamp, type DocumentReference } from 'firebase/firestore';
import { trackEvent } from '@/lib/track';

/** Ativação: grava a data do 1º depoimento aprovado pelo dono (uma vez só) e conta no funil. */
export function markFirstApproved(userRef: DocumentReference | null, userData: any) {
  if (!userRef || !userData || userData.firstApprovedAt) return;
  updateDoc(userRef, { firstApprovedAt: serverTimestamp() }).then(() => trackEvent('first_approved')).catch(() => {});
}
