/**
 * Estado de carregamento específico para o Widget.
 * Injeta um estilo imediato para garantir transparência absoluta 
 * enquanto o Next.js processa a rota.
 */
export default function WidgetLoading() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      html, body { 
        background: transparent !important; 
        background-color: transparent !important; 
      }
    ` }} />
  );
}
