import React from 'react';
import { B, G } from './brand';

/**
 * Itihasnama seal mark: a terracotta Indus-style square seal carrying the Devanagari initial "इ".
 * The letter's headline (shirorekha) runs edge-to-edge as a horizon with a half sun rising
 * behind it – "history's horizon". Coordinates: centred on 0,0, seal is 620×620.
 */
export const SEAL = 310;
const INNER = 258;
const GS = 0.46; // glyph scale (glyph data is at 1000 units)
const HORIZON = -120; // top of the letter's headline = horizon line
const HEAD_TOP = -620; // headline top / bottom in font units (Tiro Devanagari Hindi 'इ')
const HEAD_BOTTOM = -545;
const BASE_Y = HORIZON - HEAD_TOP * GS; // glyph baseline
const EMBOLDEN = 30; // outline in font units – thickens the calligraphic strokes for small sizes
const BAR_H = (HEAD_BOTTOM - HEAD_TOP + EMBOLDEN) * GS; // horizon thickness = (emboldened) headline thickness

export const SealMark: React.FC<{ id: string; shadow?: boolean; sun?: boolean }> = ({ id, shadow = true, sun = true }) => {
  const g = G.logoGlyph;
  const gx = -(g.width * GS) / 2;
  const headTop = HORIZON;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-seal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={B.terracottaLight} />
          <stop offset="1" stopColor="#9E4828" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <clipPath id={`${id}-sky`}>
          <rect x={-INNER} y={-INNER} width={INNER * 2} height={headTop + INNER} />
        </clipPath>
      </defs>
      {shadow ? <rect x={-SEAL + 6} y={-SEAL + 30} width={SEAL * 2} height={SEAL * 2} rx={72} fill="#000" opacity={0.45} filter={`url(#${id}-blur)`} /> : null}
      <rect x={-SEAL} y={-SEAL} width={SEAL * 2} height={SEAL * 2} rx={72} fill={`url(#${id}-seal)`} />
      {/* carved inner frame */}
      <rect x={-INNER} y={-INNER} width={INNER * 2} height={INNER * 2} rx={30} fill="none" stroke={B.brickDark} strokeWidth={16} />
      {sun ? <circle cx={0} cy={headTop + 4} r={138} fill={B.parchment} opacity={0.16} clipPath={`url(#${id}-sky)`} /> : null}
      {sun ? <circle cx={0} cy={headTop + 4} r={96} fill={B.parchment} clipPath={`url(#${id}-sky)`} /> : null}
      <rect x={-INNER} y={headTop - (EMBOLDEN / 2) * GS} width={INNER * 2} height={BAR_H} fill={B.parchment} />
      <path d={g.d} transform={`translate(${gx} ${BASE_Y}) scale(${GS})`} fill={B.parchment} stroke={B.parchment} strokeWidth={EMBOLDEN} strokeLinejoin="round" />
    </g>
  );
};

/** Square logo artwork (1000×1000 viewBox). `background` false → transparent seal only. */
export const LogoSvg: React.FC<{ size: number; background?: boolean; id?: string }> = ({ size, background = true, id = 'logo' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="-500 -500 1000 1000" width={size} height={size}>
    {background ? (
      <>
        <defs>
          <radialGradient id={`${id}-bg`} cx="0.5" cy="0.45" r="0.6">
            <stop offset="0" stopColor={B.umber} />
            <stop offset="1" stopColor={B.charcoal} />
          </radialGradient>
        </defs>
        <rect x={-500} y={-500} width={1000} height={1000} fill={`url(#${id}-bg)`} />
      </>
    ) : null}
    <g transform={background ? 'scale(1.14)' : 'scale(1.5)'}>
      <SealMark id={id} shadow={background} />
    </g>
  </svg>
);
