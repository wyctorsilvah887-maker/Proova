import type { User } from 'firebase/auth';

export type GooglePlacePayload =
  | { placeId: string; city?: string; state?: string }
  | { url: string; city?: string; state?: string }
  | { clear: true };

const MESSAGES: Record<string, string> = {
  invalid_link: 'Link inválido. Cole o link do seu perfil no Google (g.page, maps.app.goo.gl ou google.com/maps).',
  invalid_place: 'Empresa inválida. Tente buscar novamente.',
  unauthorized: 'Sua sessão expirou. Entre novamente.',
  server: 'Não foi possível salvar agora. Tente novamente em instantes.',
};

/** Salva a empresa/link do Google pelo servidor. Lança Error com mensagem amigável em caso de falha. */
export async function saveGooglePlace(user: User, payload: GooglePlacePayload) {
  const idToken = await user.getIdToken();
  const res = await fetch('/api/google-place', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(MESSAGES[data?.error] || MESSAGES.server);
  return data as { ok: true; googlePlaceId: string | null; googleMapsUrl: string | null };
}
