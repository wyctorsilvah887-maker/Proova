import { isValidPlaceId, parseGoogleLink } from '@/lib/google-place';

/**
 * Descobre o place id a partir de um link do Google (g.page, maps.app.goo.gl, google.com/maps...).
 * Só roda no servidor. Segue redirecionamentos manualmente, e só para hosts do Google (sem SSRF),
 * e, se o link final for uma página de lugar sem place id, localiza o ID pela Places API (nome + coordenadas).
 */

const MAX_HOPS = 6;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

function placeIdFromUrl(u: URL): string | null {
  const pid = u.searchParams.get('placeid') || u.searchParams.get('place_id') || u.searchParams.get('query_place_id');
  if (pid && isValidPlaceId(pid)) return pid;
  // Alguns links trazem o ID ChIJ... no meio do caminho/dados.
  const m = decodeURIComponent(u.pathname + u.search).match(/ChIJ[A-Za-z0-9_-]{20,}/);
  return m ? m[0] : null;
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function lookupByNameAndCoords(name: string, lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'places.id,places.displayName' },
      body: JSON.stringify({
        textQuery: name,
        languageCode: 'pt-BR',
        maxResultCount: 5,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 150 } },
      }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    const want = normalize(name);
    for (const p of data?.places || []) {
      const got = normalize(p?.displayName?.text || '');
      if (got && (got === want || got.includes(want) || want.includes(got)) && isValidPlaceId(p.id)) return p.id as string;
    }
  } catch (e) {
    console.error('[google-place-resolve] Places falhou:', (e as Error).message);
  }
  return null;
}

export async function resolvePlaceIdFromLink(input: string): Promise<{ placeId: string | null; finalUrl: string | null }> {
  const first = parseGoogleLink(input);
  if (!first) return { placeId: null, finalUrl: null };
  if (first.placeId) return { placeId: first.placeId, finalUrl: first.url };

  let current = first.url;
  try {
    for (let hop = 0; hop < MAX_HOPS; hop++) {
      const res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9' },
        signal: AbortSignal.timeout(5000),
      });
      const loc = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && loc) {
        const next = new URL(loc, current).toString();
        const parsed = parseGoogleLink(next); // garante host do Google a cada salto
        if (!parsed) return { placeId: null, finalUrl: null };
        if (parsed.placeId) return { placeId: parsed.placeId, finalUrl: parsed.url };
        const pid = placeIdFromUrl(new URL(next));
        if (pid) return { placeId: pid, finalUrl: next };
        current = next;
        continue;
      }
      break;
    }
  } catch (e) {
    console.error('[google-place-resolve] redirecionamento falhou:', (e as Error).message);
    return { placeId: null, finalUrl: null };
  }

  // Página de lugar sem place id: /maps/place/NOME/@lat,lng,...
  try {
    const u = new URL(current);
    const direct = placeIdFromUrl(u);
    if (direct) return { placeId: direct, finalUrl: current };
    const m = u.pathname.match(/\/maps\/place\/([^/]+)\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
      const name = decodeURIComponent(m[1].replace(/\+/g, ' '));
      const pid = await lookupByNameAndCoords(name, parseFloat(m[2]), parseFloat(m[3]));
      if (pid) return { placeId: pid, finalUrl: current };
    }
  } catch { /* ignora */ }
  return { placeId: null, finalUrl: current };
}
