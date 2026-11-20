'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/track';

const VIEW: Record<string, string> = { '/': 'landing_view', '/pricing': 'pricing_view', '/signup': 'signup_view' };

/** Conta visitas às páginas de marketing e cliques nos botões que levam ao cadastro. */
export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const ev = VIEW[pathname || ''];
    if (ev) trackEvent(ev);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a');
      const href = a?.getAttribute('href') || '';
      if (href.startsWith('/signup') && window.location.pathname !== '/signup') trackEvent('signup_click');
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
