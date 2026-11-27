'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Raiz do painel admin como o navegador a vê. O painel é servido em um endereço secreto (ADMIN_PATH),
 * então os links internos usam o primeiro trecho do endereço aberto, sem escrever "/admin" no código.
 * Depois de montar, confere com o endereço real da barra (o servidor pode ver o caminho reescrito).
 */
export function useAdminBase(): string {
  const fromRouter = `/${(usePathname() || '/admin').split('/')[1] || 'admin'}`;
  const [base, setBase] = useState(fromRouter);
  useEffect(() => {
    const seg = window.location.pathname.split('/')[1];
    if (seg) setBase(`/${seg}`);
  }, [fromRouter]);
  return base;
}
