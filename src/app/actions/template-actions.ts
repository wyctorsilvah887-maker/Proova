'use server';

/**
 * @fileOverview Ação para listar templates de imagem disponíveis.
 * Fonte da Verdade Única: Registro mestre estático para garantir funcionamento em produção.
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
  // Lista Mestre de Templates (Registro Fixo para evitar problemas de FS em produção)
  // Organizado com Modelos Padrão primeiro e VIPs por último.
  const masterTemplates: TemplateMetadata[] = [
    {
      id: 'card-proova-padrao-laranja',
      name: 'Padrão Laranja',
      type: 'image',
      imageUrl: '/templates/card-proova-padrão-laranja.png',
      style: {
        background: '#f97316',
        color: '#ffffff'
      }
    },
    {
      id: 'card-proova-padrao-natal',
      name: 'Natal Proova',
      type: 'image',
      imageUrl: '/templates/card-proova-padrão-natal.png',
      style: {
        background: '#ffffff', 
        color: '#000000' // Alterado para preto para dar contraste com o fundo branco/neve
      }
    },
    {
      id: 'card-proova-padrao-natal-2',
      name: 'Natal 2 Proova',
      type: 'image',
      imageUrl: '/templates/card-proova-padrão-natal2.png',
      style: {
        background: '#064e3b',
        color: '#ffffff'
      }
    },
    {
      id: 'card-pink',
      name: 'Pink',
      type: 'image',
      imageUrl: '/templates/card-pink.png',
      style: {
        background: '#fdf2f8',
        color: '#9d174d'
      }
    },
    {
      id: 'card-proova-padrao-dark-1',
      name: 'Padrão Dark',
      type: 'image',
      imageUrl: '/templates/card-proova-padrão-dark (1).png',
      style: {
        background: '#111827',
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
      id: 'card-proova-social-vip',
      name: 'Social Vip',
      type: 'image',
      imageUrl: '/templates/card-proova-social-vip.png',
      style: {
        background: '#1e1e1e',
        color: '#ffffff'
      }
    },
    {
      id: 'card-proova-natal-vip',
      name: 'Natal VIP',
      type: 'image',
      imageUrl: '/templates/card-proova-natal-vip.png',
      style: {
        background: '#7f1d1d',
        color: '#ffffff'
      }
    },
    {
      id: 'card-proova-natal2-vip',
      name: 'Natal 2 VIP',
      type: 'image',
      imageUrl: '/templates/card-proova-natal2-vip.png',
      style: {
        background: '#14532d',
        color: '#ffffff'
      }
    }
  ];

  return masterTemplates;
}
