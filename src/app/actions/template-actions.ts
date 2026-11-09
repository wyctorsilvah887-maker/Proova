'use server';

/**
 * @fileOverview Ação para listar templates de imagem disponíveis.
 * Em produção, evitamos o uso de 'fs' (File System) pois muitos servidores de 
 * hospedagem (como Firebase App Hosting/Vercel) não permitem leitura direta da pasta public.
 * Utilizamos uma lista mestre estática para garantir 100% de estabilidade.
 */

export interface TemplateMetadata {
  id: string;
  name: string;
  type: 'image';
  imageUrl: string;
  style: {
    background: string;
    color: string;
  };
}

export async function getAvailableTemplates(): Promise<TemplateMetadata[]> {
  // Lista Mestre de Templates (Fonte da Verdade Única para Produção)
  // O primeiro item desta lista será o PADRÃO inicial do sistema.
  const masterTemplates: TemplateMetadata[] = [
    {
      id: 'card-proova-padrao-laranja',
      name: 'Padrão Laranja',
      type: 'image',
      imageUrl: '/templates/card-proova-padrao-laranja.png',
      style: {
        background: '#f97316',
        color: '#ffffff'
      }
    },
    {
      id: 'card-black-vip',
      name: 'Black Vip',
      type: 'image',
      imageUrl: '/templates/card-black-vip.png',
      style: {
        background: '#000000',
        color: '#ffffff'
      }
    },
    {
      id: 'card-proova-rose-vip',
      name: 'Rose Vip',
      type: 'image',
      imageUrl: '/templates/card-proova-rose-vip.png',
      style: {
        background: '#fff1f2',
        color: '#881337'
      }
    },
    {
      id: 'card-padrao-light',
      name: 'Padrão Light',
      type: 'image',
      imageUrl: '/templates/card-padrao-light.png',
      style: {
        background: '#ffffff',
        color: '#0f172a'
      }
    }
  ];

  // Em produção, retornamos apenas a lista mestre para evitar erros de permissão de disco
  return masterTemplates;
}
