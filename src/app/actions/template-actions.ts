'use server';

import fs from 'fs';
import path from 'path';

/**
 * @fileOverview Ação para listar templates de imagem disponíveis.
 * Em produção (Serverless), o acesso ao FS é limitado, por isso mantemos uma lista mestre.
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
  // Lista Mestre de Templates (Garante exibição em produção)
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

  try {
    // Tentativa de descoberta dinâmica (funciona em local dev)
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'templates'),
      path.join(process.cwd(), '.next', 'standalone', 'public', 'templates'),
    ];

    let templatesDir = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        templatesDir = p;
        break;
      }
    }

    if (!templatesDir) return masterTemplates;

    const files = fs.readdirSync(templatesDir);
    const imageFiles = files.filter(file => 
      ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase())
    );

    // Mescla arquivos encontrados com a lista mestre para evitar duplicatas
    const dynamicTemplates: TemplateMetadata[] = imageFiles.map(file => {
      const id = path.parse(file).name;
      const alreadyInMaster = masterTemplates.find(t => t.id === id);
      if (alreadyInMaster) return alreadyInMaster;

      const name = id
        .replace(/^card-/, '')
        .replace(/-proova-/, ' ')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const isLight = id.toLowerCase().includes('white') || id.toLowerCase().includes('light') || id.toLowerCase().includes('rose');

      return {
        id,
        name,
        type: 'image',
        imageUrl: `/templates/${file}`,
        style: {
          background: isLight ? '#ffffff' : '#000000',
          color: isLight ? '#0f172a' : '#ffffff'
        }
      };
    });

    // Retorna a união sem duplicatas, mantendo a ordem da master primeiro
    const allTemplates = [...masterTemplates];
    dynamicTemplates.forEach(dt => {
      if (!allTemplates.find(t => t.id === dt.id)) {
        allTemplates.push(dt);
      }
    });

    return allTemplates;

  } catch (error) {
    console.error("Erro ao ler diretório de templates:", error);
    return masterTemplates;
  }
}
