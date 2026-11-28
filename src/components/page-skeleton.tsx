import { Skeleton } from '@/components/ui/skeleton';

/** Esqueleto do painel enquanto os dados carregam (substitui a tela de carregamento com logo). */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col" role="status" aria-label="Carregando">
      <div className="fixed top-0 w-full h-16 md:h-20 border-b bg-background flex items-center gap-3 px-3 z-[120]">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-8 w-36 md:w-52" />
        <Skeleton className="ml-auto h-9 w-9 rounded-full" />
      </div>
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pt-24 md:pt-32 pb-12 space-y-6">
        <div className="space-y-2"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-72 max-w-full" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-[1.5rem]" />)}
        </div>
        <Skeleton className="h-56 rounded-[2rem]" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-[2rem]" />)}
        </div>
      </main>
    </div>
  );
}
