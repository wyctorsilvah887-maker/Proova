'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Componente de Carregamento Premium Proova
 * Exibe apenas os logos institucionais para um visual ultra-clean e focado na marca.
 */
export function LoadingScreen({ fullScreen = true, className }: { fullScreen?: boolean; className?: string }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center bg-background transition-colors duration-500",
      fullScreen ? "fixed inset-0 z-[100]" : "w-full h-full py-20",
      className
    )}>
      <div className="relative w-[240px] h-[80px] md:w-[320px] md:h-[106px] animate-in fade-in zoom-in-95 duration-700">
        <Image
          src="/logo-proovaai-whitemode.png"
          alt="Proova Loading..."
          fill
          className="object-contain dark:hidden"
          priority
        />
        <Image
          src="/logo-proovaai-darkmode.png"
          alt="Proova Loading..."
          fill
          className="object-contain hidden dark:block"
          priority
        />
      </div>
    </div>
  );
}
