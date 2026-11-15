'use client';

import { useCallback, useEffect, useState } from 'react';
import { updateDoc, type DocumentReference } from 'firebase/firestore';

/**
 * Controla um tour de página que aparece uma vez por usuário.
 * `field` é a flag gravada em users/{uid} ao concluir (ex.: 'metricsTourDone').
 * `?tour=1` na URL reabre; `start()` reabre pelo botão de ajuda.
 */
export function usePageTour(userDocRef: DocumentReference | null, userData: any, field: string) {
  const [open, setOpen] = useState(false);
  const loaded = !!userData;
  const done = !!userData?.[field];

  useEffect(() => {
    if (!loaded) return;
    let forced = false;
    try { forced = new URLSearchParams(window.location.search).get('tour') === '1'; } catch {}
    if (forced || !done) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const start = useCallback(() => setOpen(true), []);
  const finish = useCallback(() => {
    setOpen(false);
    if (userDocRef) updateDoc(userDocRef, { [field]: true }).catch(() => {});
  }, [userDocRef, field]);

  return { open, start, finish };
}
