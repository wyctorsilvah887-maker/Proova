
'use server';

import { headers } from 'next/headers';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Verifica o limite de requisições (Rate Limit) no Firestore de forma index-safe.
 */
async function checkRateLimit(actionName: string) {
  const { firestore } = initializeFirebase();
  const headerList = await headers();
  const ip = (headerList.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
  
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const rateLimitRef = collection(firestore, 'rate_limits');
  
  // Consulta simplificada para evitar necessidade de índice composto
  const q = query(
    rateLimitRef,
    where('ip', '==', ip),
    where('action', '==', actionName)
  );
  
  const snap = await getDocs(q);
  
  // Filtro de tempo em memória
  const recentRequests = snap.docs.filter(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() || new Date(0);
    return createdAt > oneMinuteAgo;
  });
  
  if (recentRequests.length >= 10) {
    throw new Error('Limite de requisições excedido. Tente novamente em um minuto.');
  }

  // Registra a nova requisição
  await addDoc(rateLimitRef, {
    ip,
    action: actionName,
    createdAt: serverTimestamp()
  });
}

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
        'X-Goog-FieldMask': 'photos,regularOpeningHours,types,editorialSummary,displayName',
      },
      next: { revalidate: 3600 } // Cache de 1 hora
    });

    const data = await response.json();

    return {
      hasPhotos: !!(data.photos && data.photos.length > 0),
      hasHours: !!(data.regularOpeningHours),
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
 * @fileOverview Server Actions para integração com Google Maps API.
 */
export async function searchGooglePlaces(queryStr: string, city: string, state: string) {
  try {
    await checkRateLimit('google_maps_search');
  } catch (e: any) {
    console.warn("Rate Limit atingido:", e.message);
    throw new Error(e.message);
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("Atenção: GOOGLE_MAPS_API_KEY não encontrada no servidor. Usando modo de simulação.");
    return [
      { 
        name: `${queryStr}`, 
        address: `Exemplo: Rua das Flores, 123 - ${city || 'Cidade'}, ${state || 'UF'}`, 
        place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
        isMock: true 
      }
    ];
  }

  try {
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
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
      },
      body: JSON.stringify({
        textQuery: textQuery,
        languageCode: 'pt-BR',
      }),
      next: { revalidate: 0 }
    });

    const data = await response.json();

    // Fallback para busca genérica se a busca localizada falhar
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
        address: p.formattedAddress,
        place_id: p.id,
        isMock: false
      }));
    }

    return (data.places || []).map((p: any) => ({
      name: p.displayName?.text || 'Nome não disponível',
      address: p.formattedAddress,
      place_id: p.id,
      isMock: false
    }));
  } catch (err) {
    console.error("Falha crítica na busca do Google Places:", err);
    return [];
  }
}
