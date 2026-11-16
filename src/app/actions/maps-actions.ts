
'use server';

import { initializeFirebase } from '@/firebase';
import { checkRateLimit } from '@/lib/rate-limit';
import { collection, query, getDocs, addDoc, serverTimestamp, limit, where } from 'firebase/firestore';

/**
 * Consulta detalhes técnicos de um local no Google Maps para o Consultor Proova.
 */
export async function getGooglePlaceDetails(placeId: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      hasPhotos: true,
      hasHours: true,
      hasCategory: true,
      hasDescription: true,
      isMock: true
    };
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'photos,regularOpeningHours,types,editorialSummary,displayName,currentOpeningHours',
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) return null;

    const data = await response.json();

    return {
      hasPhotos: !!(data.photos && data.photos.length > 0),
      hasHours: !!(data.regularOpeningHours || data.currentOpeningHours),
      hasCategory: !!(data.types && data.types.length > 0),
      hasDescription: !!(data.editorialSummary),
      isMock: false
    };
  } catch (err) {
    console.error("Falha ao consultar detalhes do Google Places:", err);
    return null;
  }
}

/**
 * Busca empresas no Google Places.
 * Otimizado para encontrar "Service Area Businesses" (SABs) - perfis sem endereço físico visível.
 */
export async function searchGooglePlaces(queryStr: string, city?: string, state?: string) {
  try {
    await checkRateLimit('google_maps_search');
  } catch (e: any) {
    throw new Error(e.message);
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return [
      { 
        name: `${queryStr}`, 
        address: `Exemplo: Atendimento em ${city || 'Sua Região'}, ${state || 'UF'}`, 
        place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
        isMock: true 
      }
    ];
  }

  try {
    // Para SABs (perfis ocultos), a busca textual com contexto geográfico é a mais eficaz.
    let textQuery = queryStr;
    if (city && state) {
      textQuery = `${queryStr} em ${city} ${state}`;
    } else if (city) {
      textQuery = `${queryStr} em ${city}`;
    }

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Adicionamos 'types' e 'addressComponents' para ajudar o Google a identificar negócios de serviço
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types',
      },
      body: JSON.stringify({
        textQuery: textQuery,
        languageCode: 'pt-BR',
        maxResultCount: 10,
      }),
      next: { revalidate: 0 }
    });

    const data = await response.json();

    // Fallback: Se não encontrou com a cidade, tenta a busca global/exata pelo nome
    if ((!data.places || data.places.length === 0) && textQuery !== queryStr) {
      const fallbackRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
        },
        body: JSON.stringify({
          textQuery: queryStr,
          languageCode: 'pt-BR',
        }),
      });
      const fallbackData = await fallbackRes.json();
      return (fallbackData.places || []).map((p: any) => ({
        name: p.displayName?.text || 'Nome não disponível',
        address: p.formattedAddress || 'Área de Serviço (Endereço Oculto)',
        place_id: p.id,
        isMock: false
      }));
    }

    return (data.places || []).map((p: any) => ({
      name: p.displayName?.text || 'Nome não disponível',
      address: p.formattedAddress || 'Área de Serviço (Endereço Oculto)',
      place_id: p.id,
      isMock: false
    }));
  } catch (err) {
    console.error("Falha crítica na busca do Google Places:", err);
    return [];
  }
}

/**
 * Endereço formatado de um local do Google (para preencher o mapa da página pública).
 * Retorna null se a chave não existir, o local não tiver endereço (perfil de área de serviço) ou a consulta falhar.
 */
export async function getPlaceAddress(placeId: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || typeof placeId !== 'string' || !/^[A-Za-z0-9_-]{10,200}$/.test(placeId)) return null;
  try {
    await checkRateLimit('google_maps_search');
  } catch (e: any) {
    throw new Error(e.message);
  }
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'formattedAddress', 'Accept-Language': 'pt-BR' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.formattedAddress === 'string' ? data.formattedAddress : null;
  } catch (err) {
    console.error('Falha ao buscar endereço do local:', err);
    return null;
  }
}
