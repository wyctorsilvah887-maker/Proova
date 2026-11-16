'use client';

import { Clock, MapPin, Navigation, Instagram, Facebook, Youtube, Linkedin, Music2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type StudioData, type SocialKey, SOCIAL_KEYS, socialUrl, hoursRows, mapEmbedUrl, directionsUrl,
} from '@/lib/studio';

const SOCIAL_META: Record<SocialKey, { label: string; Icon: any }> = {
  instagram: { label: 'Instagram', Icon: Instagram },
  facebook: { label: 'Facebook', Icon: Facebook },
  tiktok: { label: 'TikTok', Icon: Music2 },
  youtube: { label: 'YouTube', Icon: Youtube },
  linkedin: { label: 'LinkedIn', Icon: Linkedin },
};

interface Props {
  studio: StudioData;
  themeColor: string;
  /** Versão reduzida para a pré-visualização do editor. */
  compact?: boolean;
}

function Title({ children, themeColor, compact }: { children: React.ReactNode; themeColor: string; compact?: boolean }) {
  return (
    <h2 className={cn('font-black tracking-tight text-center', compact ? 'text-base' : 'text-2xl sm:text-4xl')} style={{ color: themeColor }}>
      {children}
    </h2>
  );
}

/** Blocos extras da página pública: Sobre, Horários, Perguntas frequentes e Redes sociais. */
export function PPStudioBlocks({ studio, themeColor, compact }: Props) {
  const rows = studio.hours.enabled ? hoursRows(studio.hours.days) : [];
  const faq = studio.faq.items.filter(i => i.q.trim() && i.a.trim());
  const socials = SOCIAL_KEYS
    .map(k => ({ k, url: studio.socials.enabled ? socialUrl(k, studio.socials[k]) : null }))
    .filter(s => !!s.url) as { k: SocialKey; url: string }[];
  const wrap = compact ? 'px-6 py-6 space-y-3' : 'px-6 py-16 sm:py-20 max-w-3xl mx-auto w-full space-y-8';
  const body = compact ? 'text-[11px]' : 'text-base sm:text-lg';

  return (
    <>
      {studio.about.enabled && studio.about.text.trim() && (
        <section className={cn(wrap, 'text-center')}>
          <Title themeColor={themeColor} compact={compact}>{studio.about.title || 'Sobre nós'}</Title>
          <p className={cn(body, 'leading-relaxed font-medium opacity-80 whitespace-pre-line')}>{studio.about.text}</p>
        </section>
      )}

      {rows.length > 0 && (
        <section className={wrap}>
          <Title themeColor={themeColor} compact={compact}>Horários de atendimento</Title>
          <div className="rounded-3xl border bg-card p-5 sm:p-7 space-y-3">
            {rows.map(r => (
              <div key={r.label} className={cn('flex items-center justify-between gap-4 font-bold', compact ? 'text-[11px]' : 'text-sm sm:text-base')}>
                <span className="flex items-center gap-2 opacity-70"><Clock className="w-3.5 h-3.5 shrink-0" style={{ color: themeColor }} />{r.label}</span>
                <span className={r.value === 'Fechado' ? 'opacity-40' : ''}>{r.value}</span>
              </div>
            ))}
            {studio.hours.note && <p className="pt-2 text-xs font-medium opacity-60 text-center">{studio.hours.note}</p>}
          </div>
        </section>
      )}

      {studio.faq.enabled && faq.length > 0 && (
        <section className={wrap}>
          <Title themeColor={themeColor} compact={compact}>Perguntas frequentes</Title>
          <div className="space-y-3">
            {faq.map(item => (
              <details key={item.id} className="group rounded-2xl border bg-card px-5 py-4">
                <summary className={cn('flex cursor-pointer list-none items-center justify-between gap-3 font-black', compact ? 'text-[11px]' : 'text-sm sm:text-base')}>
                  {item.q}
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" style={{ color: themeColor }} />
                </summary>
                <p className={cn('pt-3 font-medium leading-relaxed opacity-75 whitespace-pre-line', compact ? 'text-[11px]' : 'text-sm sm:text-base')}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {socials.length > 0 && (
        <section className={cn(wrap, 'text-center')}>
          <Title themeColor={themeColor} compact={compact}>Siga nas redes</Title>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {socials.map(({ k, url }) => {
              const { label, Icon } = SOCIAL_META[k];
              return (
                <a key={k} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                   className="flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-transform hover:scale-105">
                  <Icon className="w-4 h-4" style={{ color: themeColor }} /> {label}
                </a>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

/** Mapa do Google sem interação (só visual) + botão "Como chegar". Vai no fim da página. */
export function PPMapBlock({ studio, themeColor, compact }: Props) {
  const address = studio.map.address.trim();
  if (!studio.map.enabled || !address) return null;
  return (
    <section className={cn(compact ? 'px-6 py-6 space-y-3' : 'px-6 py-16 sm:py-20 max-w-4xl mx-auto w-full space-y-6')}>
      <Title themeColor={themeColor} compact={compact}>Como chegar</Title>
      <div className="relative overflow-hidden rounded-3xl border shadow-lg bg-muted">
        <iframe
          src={mapEmbedUrl(address)}
          title="Localização no mapa"
          loading="lazy"
          tabIndex={-1}
          referrerPolicy="no-referrer-when-downgrade"
          className={cn('w-full pointer-events-none border-0', compact ? 'h-40' : 'h-64 sm:h-80')}
        />
      </div>
      {studio.map.showAddress && (
        <p className={cn('flex items-center justify-center gap-2 text-center font-bold opacity-80', compact ? 'text-[11px]' : 'text-sm sm:text-base')}>
          <MapPin className="w-4 h-4 shrink-0" style={{ color: themeColor }} /> {address}
        </p>
      )}
      <div className="flex justify-center">
        <a href={directionsUrl(address)} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-transform hover:scale-105"
           style={{ backgroundColor: themeColor }}>
          <Navigation className="w-4 h-4" /> Como chegar
        </a>
      </div>
    </section>
  );
}
