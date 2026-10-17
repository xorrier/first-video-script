import React from 'react';
import { mix, rnd, smoothPath } from '../../utils/animation';

export type TimeOfDay = 'dusk' | 'day' | 'overcast' | 'night' | 'dawn';

export const SKY: Record<TimeOfDay, { top: string; mid: string; low: string; haze: string; ground: string; light: string; shadow: string; hill: string }> = {
  dusk: { top: '#1F1B35', mid: '#6A3550', low: '#D2683F', haze: '#F2A866', ground: '#5A3424', light: '#FFC27A', shadow: '#2A1520', hill: '#4B2B45' },
  day: { top: '#6FA6C0', mid: '#A9CBD2', low: '#EAD9B4', haze: '#F2E3C2', ground: '#C9A26F', light: '#FFF1CC', shadow: '#6D4A33', hill: '#9DA9A4' },
  overcast: { top: '#6E7178', mid: '#9A958D', low: '#C9B79A', haze: '#D3C3A6', ground: '#A88E6C', light: '#E8DCC3', shadow: '#5A4636', hill: '#8A8580' },
  night: { top: '#050812', mid: '#0E1630', low: '#1E2A48', haze: '#2C3858', ground: '#1A1A22', light: '#B9C8E8', shadow: '#05060B', hill: '#141B30' },
  dawn: { top: '#283358', mid: '#7A6A8A', low: '#E9A27A', haze: '#F7D6A2', ground: '#7A5238', light: '#FFD7A0', shadow: '#3A2430', hill: '#6A5A78' },
};

/** Full-frame sky gradient with optional interpolation between two times of day. */
export const Sky: React.FC<{ tod: TimeOfDay; to?: TimeOfDay; t?: number; id: string }> = ({ tod, to, t = 0, id }) => {
  const a = SKY[tod];
  const b = to ? SKY[to] : a;
  const c = (k: keyof typeof a) => mix(a[k], b[k], t);
  return (
    <g>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c('top')} />
          <stop offset="0.45" stopColor={c('mid')} />
          <stop offset="0.78" stopColor={c('low')} />
          <stop offset="1" stopColor={c('haze')} />
        </linearGradient>
      </defs>
      <rect x={-200} y={-200} width={2320} height={1480} fill={`url(#sky-${id})`} />
    </g>
  );
};

export const SunDisc: React.FC<{ x: number; y: number; r?: number; color?: string; glow?: string; glowR?: number; id: string; opacity?: number }> = ({ x, y, r = 60, color = '#FFE1A6', glow = '#FFB066', glowR = 520, id, opacity = 1 }) => (
  <g opacity={opacity}>
    <defs>
      <radialGradient id={`sun-${id}`}>
        <stop offset="0" stopColor={glow} stopOpacity={0.75} />
        <stop offset="0.35" stopColor={glow} stopOpacity={0.22} />
        <stop offset="1" stopColor={glow} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={glowR} fill={`url(#sun-${id})`} />
    <circle cx={x} cy={y} r={r} fill={color} />
  </g>
);

export const Moon: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 46 }) => (
  <g>
    <defs>
      <radialGradient id="moonglow">
        <stop offset="0" stopColor="#DCE6FF" stopOpacity={0.35} />
        <stop offset="1" stopColor="#DCE6FF" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r * 7} fill="url(#moonglow)" />
    <circle cx={x} cy={y} r={r} fill="#F2F0E6" />
    <circle cx={x - r * 0.3} cy={y - r * 0.2} r={r * 0.22} fill="#D9D6CB" opacity={0.7} />
    <circle cx={x + r * 0.25} cy={y + r * 0.3} r={r * 0.15} fill="#D9D6CB" opacity={0.6} />
  </g>
);

export const Stars: React.FC<{ frame: number; count?: number; opacity?: number }> = ({ frame, count = 140, opacity = 1 }) => (
  <g opacity={opacity}>
    {Array.from({ length: count }, (_, i) => {
      const x = rnd(`sx${i}`) * 1920;
      const y = rnd(`sy${i}`) * 620;
      const s = 0.6 + rnd(`ss${i}`) * 1.6;
      const tw = 0.55 + 0.45 * Math.sin(frame / (10 + rnd(`st${i}`) * 25) + i);
      return <circle key={i} cx={x} cy={y} r={s} fill="#EEF2FF" opacity={tw * (1 - y / 900)} />;
    })}
  </g>
);

/** Soft layered clouds that drift horizontally. */
export const Clouds: React.FC<{ frame: number; color: string; opacity?: number; y?: number; count?: number; speed?: number; seed?: number }> = ({ frame, color, opacity = 0.5, y = 200, count = 5, speed = 0.15, seed = 1 }) => (
  <g opacity={opacity}>
    {Array.from({ length: count }, (_, i) => {
      const w = 260 + rnd(`cw${seed}${i}`) * 380;
      const x = ((rnd(`cx${seed}${i}`) * 2600 + frame * speed * (0.6 + rnd(`cs${seed}${i}`))) % 2600) - 340;
      const yy = y + rnd(`cy${seed}${i}`) * 160;
      const h = 18 + rnd(`ch${seed}${i}`) * 26;
      return (
        <g key={i}>
          <ellipse cx={x} cy={yy} rx={w / 2} ry={h} fill={color} />
          <ellipse cx={x - w * 0.18} cy={yy - h * 0.6} rx={w * 0.26} ry={h * 0.9} fill={color} />
          <ellipse cx={x + w * 0.12} cy={yy - h * 0.4} rx={w * 0.22} ry={h * 0.8} fill={color} />
        </g>
      );
    })}
  </g>
);

/** Rolling hills/mountain silhouette generated from noise. */
export const Hills: React.FC<{ y: number; amp: number; color: string; seed: number; x0?: number; x1?: number; step?: number; opacity?: number }> = ({ y, amp, color, seed, x0 = -400, x1 = 2400, step = 120, opacity = 1 }) => {
  const pts: [number, number][] = [];
  for (let x = x0; x <= x1; x += step) pts.push([x, y - rnd(`h${seed}${x}`) * amp - Math.sin(x / 400 + seed) * amp * 0.4]);
  const d = smoothPath(pts) + ` L${x1},1400 L${x0},1400 Z`;
  return <path d={d} fill={color} opacity={opacity} />;
};

/** Distant birds gliding (simple "v" strokes with flapping). */
export const Birds: React.FC<{ frame: number; count?: number; color?: string; y?: number; seed?: number; speed?: number }> = ({ frame, count = 5, color = '#2A1A22', y = 260, seed = 1, speed = 1.2 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => {
      const x = ((rnd(`bx${seed}${i}`) * 2200 + frame * speed * (0.8 + rnd(`bs${seed}${i}`) * 0.4)) % 2600) - 300;
      const yy = y + rnd(`by${seed}${i}`) * 140 + Math.sin(frame / 30 + i) * 8;
      const flap = Math.sin(frame / 4 + i * 2) * 6;
      const s = 0.7 + rnd(`bz${seed}${i}`) * 0.6;
      return (
        <path key={i} d={`M${x - 12 * s},${yy - flap * s} Q${x - 5 * s},${yy - 2 * s} ${x},${yy} Q${x + 5 * s},${yy - 2 * s} ${x + 12 * s},${yy - flap * s}`} stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      );
    })}
  </g>
);

/** Horizontal haze band for atmospheric perspective. */
export const Haze: React.FC<{ y: number; h: number; color: string; opacity?: number; id: string }> = ({ y, h, color, opacity = 0.6, id }) => (
  <g>
    <defs>
      <linearGradient id={`haze-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity={0} />
        <stop offset="0.5" stopColor={color} stopOpacity={opacity} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect x={-600} y={y} width={3200} height={h} fill={`url(#haze-${id})`} />
  </g>
);
