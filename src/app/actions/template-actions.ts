'use server';

import fs from 'fs';
import path from 'path';

/**
 * @fileOverview Ação para listar templates de imagem disponíveis na pasta public/templates.
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
  try {
    const templatesDir = path.join(process.cwd(), 'public', 'templates');
    
    // Verifica se a pasta existe
    if (!fs.existsSync(templatesDir)) {
      return [];
    }

    const files = fs.readdirSync(templatesDir);
    
    // Filtra apenas arquivos de imagem suportados
    const imageFiles = files.filter(file => 
      ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase())
    );

    const templates: TemplateMetadata[] = imageFiles.map(file => {
      const id = path.parse(file).name;
      
      // Formata o nome amigável (ex: card-black-vip -> Black Vip)
      const name = id
        .replace(/^card-/, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Lógica de contraste básica: se o nome contiver 'white' ou 'light', assume texto preto.
      // Caso contrário, assume texto branco (padrão VIP).
      const isLight = id.toLowerCase().includes('white') || id.toLowerCase().includes('light');

      return {
        id,
        name: name || 'Template Custom',
        type: 'image',
        imageUrl: `/templates/${file}`,
        style: {
          background: '#000000', // Cor de fundo de fallback enquanto carrega
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
    console.error("Erro ao listar templates:", error);
    return [];
  }
}
