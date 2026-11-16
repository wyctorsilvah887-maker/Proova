'use client';

import { useEffect, useState } from 'react';

/** Nota do Google da empresa (cache de 6h no servidor). null enquanto carrega ou se não houver. */
export function useGoogleRating(uid?: string | null) {
  const [value, setValue] = useState<{ rating: number; count: number } | null>(null);
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    fetch(`/api/google-rating?uid=${encodeURIComponent(uid)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d?.rating > 0 && d?.count > 0) setValue({ rating: d.rating, count: d.count }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [uid]);
  return value;
}
