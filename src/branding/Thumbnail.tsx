import React from 'react';
import { AbsoluteFill } from 'remotion';
import { FONT_SANS } from '../theme';
import { B } from './brand';
import { SealMark, SEAL } from './Logo';
import { FilmLook } from '../components/Overlay';

/**
 * Shilalekh thumbnail system (1280×720).
 *  - Art: any 1920×1080 scene (scaled ×2/3), dominant subject on the RIGHT half.
 *  - Left 55%: darkened by the brand gradient, carries 1–2 headline lines (3–5 words total).
 *  - One highlighted line on a terracotta block, seal badge + kicker top-left.
 *  - Keep clear: bottom-right (video length stamp), top-right (hover icons).
 */
export const THUMB_W = 1280;
export const THUMB_H = 720;

export type ThumbLine = { text: string; hl?: boolean };
export type ThumbSpec = {
  kicker?: string; // topic/series label, 1–3 words
  lines: ThumbLine[]; // 1–2 lines, 3–5 words total
  headlineSize?: number;
};

const Badge: React.FC<{ id: string; size: number }> = ({ id, size }) => (
  <svg viewBox={`${-SEAL - 20} ${-SEAL - 20} ${SEAL * 2 + 40} ${SEAL * 2 + 60}`} width={size} height={size * ((SEAL * 2 + 60) / (SEAL * 2 + 40))}>
    <SealMark id={id} />
  </svg>
);

export const ThumbnailFrame: React.FC<ThumbSpec & { id: string; art?: React.ReactNode; showText?: boolean }> = ({
  id, art, kicker, lines, headlineSize = 118, showText = true,
}) => (
  <AbsoluteFill style={{ background: B.charcoal, overflow: 'hidden' }}>
    {art ? (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${THUMB_W / 1920})`, transformOrigin: '0 0' }}>{art}</div>
    ) : null}
    {/* brand grade: warm colour unify + soft-light, left text gradient, vignette */}
    <AbsoluteFill style={{ background: B.terracottaLight, mixBlendMode: 'color', opacity: 0.28 }} />
    <AbsoluteFill style={{ background: B.terracotta, mixBlendMode: 'soft-light', opacity: 0.35 }} />
    <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(14,9,6,0.92) 0%, rgba(14,9,6,0.72) 34%, rgba(14,9,6,0.18) 58%, rgba(14,9,6,0) 70%)' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 75% at 62% 45%, rgba(0,0,0,0) 55%, rgba(10,6,4,0.65) 100%)' }} />
    <FilmLook grain={0.08} vignette={0.25} />
    {/* brand edge bar */}
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: B.terracotta }} />
    {showText ? (
      <>
        <div style={{ position: 'absolute', left: 40, top: 30, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Badge id={`${id}-badge`} size={74} />
          {kicker ? (
            <div
              style={{
                fontFamily: FONT_SANS, fontWeight: 600, fontSize: 30, color: B.gold, padding: '4px 20px 6px',
                border: `2px solid ${B.gold}99`, borderRadius: 999, background: 'rgba(18,13,10,0.55)', lineHeight: 1.35,
              }}
            >
              {kicker}
            </div>
          ) : null}
        </div>
        <div style={{ position: 'absolute', left: 52, bottom: 62, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                fontFamily: FONT_SANS, fontWeight: 700, fontSize: headlineSize, lineHeight: 1.22, color: B.cream,
                whiteSpace: 'nowrap',
                ...(l.hl
                  ? { background: B.terracotta, padding: '0 24px 10px', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.55)', textShadow: '0 3px 0 rgba(70,25,10,0.55)' }
                  : { padding: '0 4px', textShadow: '0 5px 0 rgba(0,0,0,0.45), 0 0 34px rgba(0,0,0,0.8)' }),
              }}
            >
              {l.text}
            </div>
          ))}
        </div>
      </>
    ) : null}
  </AbsoluteFill>
);

/** Overlay explaining the template zones (for the guide image). */
export const ThumbGuideOverlay: React.FC = () => {
  const zone = (style: React.CSSProperties, color: string, label: string) => (
    <div style={{ position: 'absolute', border: `4px dashed ${color}`, background: `${color}22`, ...style }}>
      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 20, color, padding: '4px 8px', background: 'rgba(0,0,0,0.6)', display: 'inline-block' }}>{label}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      {zone({ left: 28, top: 20, width: 470, height: 100 }, '#FFD166', 'BADGE + KICKER (1–3 words)')}
      {zone({ left: 36, top: 330, width: 640, height: 340 }, '#7FD1FF', 'HEADLINE: 1–2 lines, 3–5 words, Noto Sans Deva 700 ≈118px')}
      {zone({ left: 700, top: 140, width: 540, height: 470 }, '#9BE564', 'DOMINANT SUBJECT (right half)')}
      {zone({ right: 8, bottom: 8, width: 190, height: 64 }, '#FF6B6B', 'KEEP CLEAR: timestamp')}
      {zone({ right: 8, top: 8, width: 120, height: 120 }, '#FF6B6B', 'HOVER ICONS')}
    </AbsoluteFill>
  );
};
