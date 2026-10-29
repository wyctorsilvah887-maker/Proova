'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
        <p className="text-muted-foreground font-medium animate-pulse">Sincronizando privilégios de acesso...</p>
      </div>
    </div>
  );
}
