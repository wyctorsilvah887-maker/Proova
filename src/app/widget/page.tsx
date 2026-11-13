
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from '@/components/loading-screen';

/**
 * Redirecionador de conveniência para a rota correta /widgets.
 */
export default function WidgetRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/widgets');
  }, [router]);

  return <LoadingScreen />;
}
