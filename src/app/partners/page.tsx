'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from '@/components/loading-screen';

/**
 * @fileOverview Hub de Parceiros
 * Este recurso está temporariamente bloqueado para todos os usuários por diretriz comercial.
 * Redireciona automaticamente para o Dashboard.
 */
export default function PartnersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para o Dash ou Pricing imediatamente
    router.replace('/pricing');
  }, [router]);

  return <LoadingScreen />;
}
