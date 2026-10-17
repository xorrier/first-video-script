import React from 'react';
import glyphs from './glyphs.json';

/** Itihasnama brand tokens – keep in sync with branding/BRAND_GUIDE.md */
export const B = {
  charcoal: '#1C1714',
  night: '#120D0A',
  umber: '#3A2418',
  umberLight: '#5A3424',
  terracotta: '#B5532F',
  terracottaLight: '#C96E44',
  brickDark: '#6E3322',
  parchment: '#F1E4C6',
  parchmentDark: '#DCC59C',
  cream: '#FFF6E0',
  gold: '#D9A441',
  teal: '#3F7F7A',
};

export type GlyphRun = { d: string; width: number; top: number; bottom: number; size: number };
export const G = glyphs as Record<'logoGlyph' | 'wordmarkDeva' | 'wordmarkLatin' | 'tagline', GlyphRun>;

/** Draw pre-shaped vector text (from scripts/branding-glyphs.ts). y = baseline. */
export const VText: React.FC<{ g: GlyphRun; x: number; y: number; size: number; anchor?: 'start' | 'middle' | 'end'; fill: string; opacity?: number }> = ({
  g, x, y, size, anchor = 'start', fill, opacity,
}) => {
  const s = size / g.size;
  const dx = anchor === 'middle' ? -(g.width * s) / 2 : anchor === 'end' ? -g.width * s : 0;
  return <path d={g.d} transform={`translate(${(x + dx).toFixed(2)} ${y.toFixed(2)}) scale(${s})`} fill={fill} opacity={opacity} />;
};
export const vWidth = (g: GlyphRun, size: number) => (g.width * size) / g.size;

/** SVG paper/grain texture filter (deterministic, no bitmap needed). */
export const PaperFilter: React.FC<{ id: string; freq?: number; alpha?: number; seed?: number }> = ({ id, freq = 0.85, alpha = 0.5, seed = 4 }) => (
  <filter id={id} x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={seed} result="n" />
    <feColorMatrix in="n" type="matrix" values={`0 0 0 0 0.95  0 0 0 0 0.88  0 0 0 0 0.74  ${alpha} 0 0 0 ${-alpha * 0.45}`} />
  </filter>
);

export const BlotchFilter: React.FC<{ id: string; seed?: number }> = ({ id, seed = 9 }) => (
  <filter id={id} x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency={0.0035} numOctaves={4} seed={seed} result="n" />
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.11  0 0 0 0 0.07  0 0 0 0 0.04  0 0 0 1.4 -0.62" />
  </filter>
);
