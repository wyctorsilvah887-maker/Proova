/**
 * Estado de carregamento específico para o Widget.
 * Injeta um estilo imediato para garantir transparência absoluta 
 * no nível mais baixo de renderização do navegador.
 */
export default function WidgetLoading() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      html, body { 
        background: transparent !important; 
        background-color: transparent !important;
        opacity: 0 !important;
      }
    ` }} />
  );
}
