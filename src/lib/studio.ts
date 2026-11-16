/** Dados dos blocos extras da página pública (guardados em users/{uid}/pp/{slug}.studio). */

export type StudioDay = { closed: boolean; from: string; to: string };
export type StudioFaqItem = { id: string; q: string; a: string };

export type StudioData = {
  about: { enabled: boolean; title: string; text: string };
  hours: { enabled: boolean; days: StudioDay[]; note: string };
  faq: { enabled: boolean; items: StudioFaqItem[] };
  socials: { enabled: boolean; instagram: string; facebook: string; tiktok: string; youtube: string; linkedin: string };
  map: { enabled: boolean; address: string; showAddress: boolean };
};

export const DAY_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
export const SOCIAL_KEYS = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'] as const;
export type SocialKey = typeof SOCIAL_KEYS[number];
export const FAQ_LIMIT = 8;

export function defaultStudio(): StudioData {
  return {
    about: { enabled: false, title: 'Sobre nós', text: '' },
    hours: {
      enabled: false,
      days: DAY_LABELS.map((_, i) => ({ closed: i >= 5, from: '08:00', to: '18:00' })),
      note: '',
    },
    faq: { enabled: false, items: [] },
    socials: { enabled: false, instagram: '', facebook: '', tiktok: '', youtube: '', linkedin: '' },
    map: { enabled: false, address: '', showAddress: true },
  };
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const time = (v: unknown, fallback: string) => (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : fallback);

/** Lê o que veio do Firestore de forma defensiva (qualquer campo pode faltar ou ter tipo errado). */
export function normalizeStudio(raw: any): StudioData {
  const d = defaultStudio();
  if (!raw || typeof raw !== 'object') return d;
  const days = Array.isArray(raw.hours?.days) ? raw.hours.days : [];
  return {
    about: { enabled: !!raw.about?.enabled, title: str(raw.about?.title, 60) || d.about.title, text: str(raw.about?.text, 1200) },
    hours: {
      enabled: !!raw.hours?.enabled,
      days: d.hours.days.map((def, i) => ({
        closed: days[i] ? !!days[i].closed : def.closed,
        from: time(days[i]?.from, def.from),
        to: time(days[i]?.to, def.to),
      })),
      note: str(raw.hours?.note, 160),
    },
    faq: {
      enabled: !!raw.faq?.enabled,
      items: (Array.isArray(raw.faq?.items) ? raw.faq.items : []).slice(0, FAQ_LIMIT).map((it: any, i: number) => ({
        id: str(it?.id, 40) || `f${i}`,
        q: str(it?.q, 140),
        a: str(it?.a, 600),
      })),
    },
    socials: {
      enabled: !!raw.socials?.enabled,
      instagram: str(raw.socials?.instagram, 200),
      facebook: str(raw.socials?.facebook, 200),
      tiktok: str(raw.socials?.tiktok, 200),
      youtube: str(raw.socials?.youtube, 200),
      linkedin: str(raw.socials?.linkedin, 200),
    },
    map: { enabled: !!raw.map?.enabled, address: str(raw.map?.address, 250), showAddress: raw.map?.showAddress !== false },
  };
}

/** "@clinica" ou "clinica" vira o link do perfil; links completos só passam se forem http(s). */
export function socialUrl(kind: SocialKey, value: string): string | null {
  const v = (value || '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return null;
  const handle = v.replace(/^@/, '').replace(/^\/+/, '');
  if (/^[\w.\-]+$/.test(handle)) {
    const base: Record<SocialKey, string> = {
      instagram: 'https://instagram.com/',
      facebook: 'https://facebook.com/',
      tiktok: 'https://tiktok.com/@',
      youtube: 'https://youtube.com/@',
      linkedin: 'https://linkedin.com/in/',
    };
    return base[kind] + handle;
  }
  return `https://${handle}`;
}

/** Resumo por dia para exibição; agrupa dias consecutivos iguais ("Seg a Sex"). */
export function hoursRows(days: StudioDay[]): { label: string; value: string }[] {
  const short = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const val = (d: StudioDay) => (d.closed ? 'Fechado' : `${d.from} às ${d.to}`);
  const rows: { label: string; value: string }[] = [];
  let i = 0;
  while (i < 7) {
    let j = i;
    while (j + 1 < 7 && val(days[j + 1]) === val(days[i])) j++;
    rows.push({ label: j === i ? short[i] : `${short[i]} a ${short[j]}`, value: val(days[i]) });
    i = j + 1;
  }
  return rows;
}

export function mapEmbedUrl(address: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=16&hl=pt-BR&output=embed`;
}
export function directionsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Há algo para mostrar em algum bloco? */
export function hasStudioContent(s: StudioData) {
  return (
    (s.about.enabled && !!s.about.text.trim()) ||
    s.hours.enabled ||
    (s.faq.enabled && s.faq.items.some(i => i.q.trim() && i.a.trim())) ||
    (s.socials.enabled && SOCIAL_KEYS.some(k => !!socialUrl(k, s.socials[k]))) ||
    (s.map.enabled && !!s.map.address.trim())
  );
}
