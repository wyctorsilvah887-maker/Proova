'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Rota /ppeditor
 * Funciona como um Smart Entry para o editor da página pública.
 * Localiza o mural principal do usuário e o redireciona para a interface de customização.
 */
export default function PPEditorRedirectPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const widgetsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'widgets'), limit(1));
  }, [db, user]);

  const { data: widgets, loading: widgetsLoading } = useCollection(widgetsQuery);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.replace('/login');
      return;
    }

    if (!widgetsLoading && widgets) {
      if (widgets.length > 0) {
        // Redireciona para o editor do primeiro mural encontrado
        router.replace(`/widgets/${widgets[0].id}`);
      } else {
        // Caso não possua nenhum mural, redireciona para a lista de criação
        router.replace('/widgets');
      }
    }
  }, [authLoading, user, widgetsLoading, widgets, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-muted/30">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
        <div className="space-y-1">
          <p className="text-foreground font-bold text-lg">Editor Proova</p>
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Sincronizando ambiente de customização...</p>
        </div>
      </div>
    </div>
  );
}
