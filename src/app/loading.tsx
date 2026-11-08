'use client';

import { LoadingScreen } from '@/components/loading-screen';

/**
 * Componente Loading padrão do Next.js App Router.
 * Garante que transições entre páginas exibam a identidade visual da marca.
 */
export default function GlobalLoading() {
  return <LoadingScreen />;
}
