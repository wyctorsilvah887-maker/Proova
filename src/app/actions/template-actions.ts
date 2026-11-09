'use server';

import fs from 'fs';
import path from 'path';

/**
 * @fileOverview Ação para listar templates de imagem disponíveis na pasta public/templates.
 * Otimizada para resiliência em produção (serverless/cloud environments).
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
  // Lista de fallback com os arquivos que sabemos que devem existir.
  // Isso garante que, mesmo que o FS falhe em produção, o usuário não veja uma lista vazia.
  const defaultTemplates: TemplateMetadata[] = [
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
    // Em ambientes de produção (Serverless/App Hosting), o process.cwd() pode não conter a pasta public
    // Tentamos encontrar a pasta de templates em caminhos prováveis
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'templates'),
      path.join(process.cwd(), '.next', 'standalone', 'public', 'templates'),
      path.join(process.cwd(), 'templates'), // Fallback raro
    ];

    let templatesDir = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        templatesDir = p;
        break;
      }
    }

    // Se não encontrou a pasta no FS, retorna os padrões para não quebrar a UI
    if (!templatesDir) {
      console.warn("Diretório de templates não localizado via FS. Retornando fallback.");
      return defaultTemplates;
    }

    const files = fs.readdirSync(templatesDir);
    
    // Filtra apenas arquivos de imagem suportados
    const imageFiles = files.filter(file => 
      ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase())
    );

    if (imageFiles.length === 0) {
      return defaultTemplates;
    }

    const templates: TemplateMetadata[] = imageFiles.map(file => {
      const id = path.parse(file).name;
      
      // Formata o nome amigável (ex: card-black-vip -> Black Vip)
      const name = id
        .replace(/^card-/, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const isLight = id.toLowerCase().includes('white') || id.toLowerCase().includes('light') || id.toLowerCase().includes('padrao');

      return {
        id,
        name: name || 'Template Custom',
        type: 'image',
        imageUrl: `/templates/${file}`,
        style: {
          background: isLight ? '#ffffff' : '#000000',
          color: isLight ? '#0f172a' : '#ffffff'
        }
      };
    });

    // Ordena para garantir que o Black VIP seja o primeiro se existir
    return templates.sort((a, b) => {
      if (a.id === 'card-black-vip') return -1;
      if (b.id === 'card-black-vip') return 1;
      return 0;
    });

  } catch (error) {
    console.error("Erro crítico ao listar templates (FS):", error);
    // Retorno silencioso do fallback para evitar erro 500 no servidor
    return defaultTemplates;
  }
}
