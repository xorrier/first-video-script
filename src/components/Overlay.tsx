import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { rnd } from '../utils/animation';

/** Film grain from pre-generated noise tiles + vignette + gentle exposure flicker. */
export const FilmLook: React.FC<{ grain?: number; vignette?: number }> = ({ grain = 0.07, vignette = 0.55 }) => {
  const f = useCurrentFrame();
  const tile = Math.floor(f / 2) % 6;
  const ox = Math.floor(rnd(`gx${Math.floor(f / 2)}`) * 400);
  const oy = Math.floor(rnd(`gy${Math.floor(f / 2)}`) * 400);
  const flicker = 0.012 * (rnd(`fl${f}`) - 0.5);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(18,10,5,${vignette}) 100%)`,
        }}
      />
      <AbsoluteFill style={{ background: `rgba(255,240,210,${Math.max(0, flicker)})`, mixBlendMode: 'screen' }} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile(`assets/grain_${tile}.png`)})`,
          backgroundSize: '512px 512px',
          backgroundPosition: `${ox}px ${oy}px`,
          opacity: grain,
          mixBlendMode: 'overlay',
        }}
      />
    </AbsoluteFill>
  );
};

/** Parchment background with stain/fibre texture. */
export const Parchment: React.FC<{ tint?: string; dark?: number }> = ({ tint = '#EFDDB8', dark = 0 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${tint} 0%, #D6BC8C 100%)` }}>
    <Img src={staticFile('assets/paper.png')} style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, opacity: 0.85 }} />
    {dark > 0 ? <AbsoluteFill style={{ background: `rgba(30,18,10,${dark})` }} /> : null}
  </AbsoluteFill>
);

/** Soft diagonal god-rays (SVG). */
export const LightRays: React.FC<{ x: number; y: number; angle?: number; color?: string; opacity?: number; count?: number; spread?: number; length?: number; seed?: number }> = ({
  x, y, angle = 25, color = '#FFE2A8', opacity = 0.18, count = 6, spread = 50, length = 1600, seed = 1,
}) => {
  const f = useCurrentFrame();
  return (
    <g style={{ mixBlendMode: 'screen' }}>
      {Array.from({ length: count }, (_, i) => {
        const a = angle + (i - count / 2) * (spread / count) + Math.sin(f / 90 + i * 1.7) * 1.2;
        const w = 30 + rnd(`ray${seed}${i}`) * 90;
        const o = opacity * (0.5 + 0.5 * Math.sin(f / 70 + i * 2.1 + seed));
        const rad = (a * Math.PI) / 180;
        const ex = x + Math.cos(rad) * length;
        const ey = y + Math.sin(rad) * length;
        const nx = -Math.sin(rad) * w;
        const ny = Math.cos(rad) * w;
        return <polygon key={i} points={`${x},${y} ${ex + nx},${ey + ny} ${ex - nx},${ey - ny}`} fill={color} opacity={o} />;
      })}
    </g>
  );
};
