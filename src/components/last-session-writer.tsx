'use client';

import { useEffect, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { saveLastSession } from '@/lib/last-session';

/** Guarda no navegador os dados do último acesso (usados na tela de login do computador). */
export function LastSessionWriter() {
  const { user } = useUser();
  const db = useFirestore();
  const ref = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data } = useDoc(ref);
  const u = data as any;
  useEffect(() => { if (u) saveLastSession(u); }, [u?.email, u?.name, u?.companyName, u?.membershipStatus, u?.testimonialsCount, u?.isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
