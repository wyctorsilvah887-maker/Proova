import { Globe } from 'lucide-react';

/** Mostrada ao visitante quando o dono da página está sem plano ativo (teste vencido). Não expõe dados do dono. */
export function PageOffline() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="max-w-md w-full p-10 text-center rounded-[2.5rem] bg-card border shadow-xl">
        <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Esta página está temporariamente fora do ar</h2>
        <p className="mt-2 text-sm text-muted-foreground font-medium">Tente novamente mais tarde.</p>
      </div>
    </div>
  );
}
