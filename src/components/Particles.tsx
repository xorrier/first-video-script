import React from 'react';
import { rnd } from '../utils/animation';

/** Deterministic drifting dust motes / embers / fireflies. Coordinates in world space. */
export const Dust: React.FC<{
  frame: number;
  count?: number;
  area?: [number, number, number, number];
  color?: string;
  size?: [number, number];
  wind?: number;
  rise?: number;
  opacity?: number;
  seed?: number;
  glow?: boolean;
}> = ({ frame, count = 60, area = [0, 0, 1920, 1080], color = '#F5DEB0', size = [1.2, 3.5], wind = 0.6, rise = -0.1, opacity = 0.6, seed = 1, glow = false }) => {
  const [ax, ay, aw, ah] = area;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const r1 = rnd(`d${seed}a${i}`);
        const r2 = rnd(`d${seed}b${i}`);
        const r3 = rnd(`d${seed}c${i}`);
        const sp = 0.4 + r3 * 1.2;
        let x = ax + ((r1 * aw + frame * wind * sp + Math.sin(frame / 40 + i) * 12) % aw + aw) % aw;
        let y = ay + ((r2 * ah + frame * rise * sp + Math.sin(frame / 55 + i * 1.3) * 10) % ah + ah) % ah;
        const s = size[0] + (size[1] - size[0]) * r3;
        const tw = 0.5 + 0.5 * Math.sin(frame / (12 + r1 * 20) + i);
        return (
          <circle key={i} cx={x} cy={y} r={glow ? s * (1.5 + tw) : s} fill={color} opacity={opacity * (glow ? tw : 0.4 + 0.6 * tw)} />
        );
      })}
    </g>
  );
};

/** Long thin wind streaks for gusts. */
export const WindStreaks: React.FC<{ frame: number; count?: number; opacity?: number; y0?: number; y1?: number; seed?: number }> = ({ frame, count = 10, opacity = 0.18, y0 = 500, y1 = 1000, seed = 3 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => {
      const r = rnd(`w${seed}${i}`);
      const period = 140 + r * 120;
      const t = ((frame + r * period) % period) / period;
      const x = -400 + t * 2800;
      const y = y0 + rnd(`wy${seed}${i}`) * (y1 - y0) + Math.sin(t * 6 + i) * 10;
      const len = 120 + r * 260;
      const o = Math.sin(t * Math.PI) * opacity;
      return <path key={i} d={`M${x},${y} q${len / 2},${-8} ${len},0`} stroke="#F3E2C0" strokeWidth={1.4} fill="none" opacity={o} strokeLinecap="round" />;
    })}
  </g>
);
