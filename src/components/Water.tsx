import React from 'react';
import { rnd } from '../utils/animation';

/** A flowing water channel (side view): body + moving highlights + surface ripple. */
export const WaterChannel: React.FC<{
  frame: number;
  x: number;
  y: number;
  w: number;
  h: number;
  speed?: number;
  color?: string;
  light?: string;
  level?: number; // 0..1 fill
  dir?: 1 | -1;
}> = ({ frame, x, y, w, h, speed = 2, color = '#4F8FA6', light = '#BFE3EA', level = 1, dir = 1 }) => {
  const lh = h * level;
  const top = y + h - lh;
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const px = x + (w * i) / 24;
    const py = top + Math.sin(i * 0.9 + frame * 0.18 * dir) * 1.6;
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  if (lh <= 0.5) return null;
  return (
    <g>
      <polygon points={`${pts.join(' ')} ${x + w},${y + h} ${x},${y + h}`} fill={color} />
      {Array.from({ length: Math.max(3, Math.round(w / 60)) }, (_, i) => {
        const r = rnd(`wc${i}${x}`);
        const len = 14 + r * 30;
        const yy = top + 3 + rnd(`wcy${i}${x}`) * Math.max(1, lh - 6);
        const xx = x + ((((r * w + frame * speed * dir * (0.7 + r)) % w) + w) % w);
        return <line key={i} x1={xx} y1={yy} x2={Math.min(x + w, xx + len)} y2={yy} stroke={light} strokeWidth={1.6} opacity={0.55} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Animated wavy water surface lines for seas on maps. */
export const SeaLines: React.FC<{ frame: number; x: number; y: number; w: number; h: number; color?: string; opacity?: number; gap?: number }> = ({ frame, x, y, w, h, color = '#2F5E66', opacity = 0.18, gap = 46 }) => (
  <g opacity={opacity}>
    {Array.from({ length: Math.ceil(h / gap) }, (_, row) => {
      const yy = y + row * gap;
      const off = (frame * 0.4 + row * 23) % 80;
      let d = '';
      for (let xx = x - 80 + off; xx < x + w; xx += 80) d += `M${xx},${yy} q20,-6 40,0 `;
      return <path key={row} d={d} stroke={color} strokeWidth={1.5} fill="none" />;
    })}
  </g>
);
