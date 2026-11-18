'use client';

import { forwardRef, type CSSProperties } from 'react';
import { Star, CheckCircle2, Quote, Play } from 'lucide-react';

export type CardFormat = 'square' | 'feed' | 'story';

/** Tamanho de projeto de cada formato (px). A exportação multiplica para 1080 de largura. */
export const CARD_SIZES: Record<CardFormat, { w: number; h: number; label: string; ratio: string }> = {
  square: { w: 400, h: 400, label: 'Quadrado', ratio: '1:1' },
  feed: { w: 400, h: 500, label: 'Feed', ratio: '4:5' },
  story: { w: 400, h: 711, label: 'Story', ratio: '9:16' },
};

const PAD: Record<CardFormat, { top: number; bottom: number }> = {
  square: { top: 34, bottom: 30 },
  feed: { top: 40, bottom: 36 },
  story: { top: 104, bottom: 132 }, // respiro para a interface do Story
};

const isVideoUrl = (u?: string | null) => !!u && /\.(mp4|webm|mov)(\?|$)/i.test(u);

type Props = {
  testimonial: any;
  imageUrl?: string;
  background?: string;
  lightText: boolean; // true = texto branco (fundo escuro)
  format: CardFormat;
  companyName?: string;
  logoUrl?: string | null;
  showProova?: boolean;
  anchor?: 'center' | 'bottom';
  /** Capa de depoimento em vídeo: mostra o botão de play e o texto vira legenda opcional. */
  video?: boolean;
  style?: CSSProperties;
};

/**
 * Arte do depoimento em tamanho fixo (independe do tamanho da tela), assim o PNG sai igual
 * no celular e no computador. A tela só aplica `transform: scale()` para caber no dialog.
 */
export const SocialCardArt = forwardRef<HTMLDivElement, Props>(function SocialCardArt(
  { testimonial, imageUrl, background = '#000', lightText, format, companyName, logoUrl, showProova = true, anchor = 'center', video = false, style }, ref
) {
  const { w, h } = CARD_SIZES[format];
  const pad = PAD[format];
  const fg = lightText ? '#ffffff' : '#0f172a';
  const soft = lightText ? 'rgba(255,255,255,.8)' : 'rgba(15,23,42,.75)';
  const line = lightText ? 'rgba(255,255,255,.14)' : 'rgba(15,23,42,.12)';
  const text: string = String(testimonial?.text || '');
  const rating = Math.max(0, Math.min(5, Math.round(Number(testimonial?.rating) || 0)));
  const base = text.length > 220 ? 13 : text.length > 180 ? 14 : text.length > 120 ? 16 : text.length > 80 ? 19 : 23;
  const fs = format === 'square' ? Math.max(12, base - 2) : base;
  const logo = !isVideoUrl(logoUrl) ? logoUrl : null;

  return (
    <div ref={ref} style={{ width: w, height: h, position: 'relative', overflow: 'hidden', backgroundColor: background, transformOrigin: 'top left', fontFamily: 'inherit', ...style }}>
      {imageUrl && <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', padding: `${pad.top}px 34px ${pad.bottom}px`, color: fg }}>
        {/* Rótulo (fica pequeno para não competir com a arte do template) */}
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.24em', textTransform: 'uppercase', color: soft, textAlign: 'center' }}>{video ? 'Depoimento em vídeo' : 'Relato de cliente'}</p>

        <div style={{ flex: 1 }} />

        {/* Nota + depoimento */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {video && (
            <div style={{ width: format === 'square' ? 64 : 84, height: format === 'square' ? 64 : 84, borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(249,115,22,.55), 0 0 0 8px rgba(255,255,255,.22)', marginBottom: 4 }}>
              <Play size={format === 'square' ? 28 : 38} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
            </div>
          )}
          {rating > 0 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={26} color={n <= rating ? '#fbbf24' : soft} fill={n <= rating ? '#fbbf24' : 'transparent'} style={{ opacity: n <= rating ? 1 : 0.35 }} />
              ))}
            </div>
          )}
          {text.trim() && (
          <div style={{ position: 'relative', width: '100%', maxWidth: 330 }}>
            <Quote size={18} color={fg} style={{ position: 'absolute', top: -10, left: -10, opacity: 0.25, transform: 'rotate(180deg)' }} />
            <div style={{ padding: format === 'square' ? '14px 18px' : '18px 20px', borderRadius: 22, background: lightText ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.74)', border: `1px solid ${line}`, textAlign: 'center' }}>
              <p style={{ fontSize: fs, fontWeight: 900, fontStyle: 'italic', lineHeight: 1.22, letterSpacing: '-.01em', color: fg, overflowWrap: 'anywhere' }}>“{text}”</p>
            </div>
            <Quote size={18} color={fg} style={{ position: 'absolute', bottom: -10, right: -10, opacity: 0.25 }} />
          </div>
          )}
        </div>

        <div style={{ flex: anchor === 'bottom' ? '0 0 16px' : 1 }} />

        {/* Autor + marca da clínica + assinatura */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <p style={{ fontSize: 12, fontWeight: 900, letterSpacing: '.28em', textTransform: 'uppercase', color: fg }}>{testimonial?.userName}</p>
          {(logo || companyName) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 330 }}>
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" crossOrigin="anonymous" style={{ width: format === 'square' ? 22 : 28, height: format === 'square' ? 22 : 28, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${line}`, background: '#fff', flexShrink: 0 }} />
              )}
              {companyName && <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: soft, lineHeight: 1.15, textAlign: 'center' }}>{companyName}</p>}
            </div>
          )}
          {showProova && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 8, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: soft }}>
              <CheckCircle2 size={10} color="#f97316" /> Coletado via Proova AI
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
