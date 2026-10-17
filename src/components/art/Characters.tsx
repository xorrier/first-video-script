import React from 'react';
import { mix, rnd } from '../../utils/animation';

export const CLOTH = ['#EFE3C8', '#C98B3A', '#A8442C', '#3D4F6B', '#E6D2A8', '#8C5A2B'];
export const SKIN = ['#7A4A2C', '#8A5634', '#6B3F25', '#94603B'];

export type WalkerProps = {
  frame: number;
  x: number;
  y: number;
  scale?: number;
  speed?: number; // world px per frame (+ right, - left)
  seed?: number;
  silhouette?: string; // single colour silhouette
  ghost?: number; // 0..1 translucent glow figure
  carry?: 'pot' | 'basket' | 'none' | 'stick';
  female?: boolean;
  still?: boolean;
  opacity?: number;
};

/** Simple 2D character with a deterministic walk cycle. Origin at feet. */
export const Walker: React.FC<WalkerProps> = ({ frame, x, y, scale = 1, speed = 1.2, seed = 0, silhouette, ghost = 0, carry = 'none', female = false, still = false, opacity = 1 }) => {
  const dir = speed >= 0 ? 1 : -1;
  const px = x + (still ? 0 : frame * speed);
  const phase = still ? 0 : (frame * Math.abs(speed) * 0.11 + seed * 1.7);
  const a = Math.sin(phase) * (still ? 0 : 0.42);
  const bob = still ? 0 : -Math.abs(Math.cos(phase)) * 2.5;
  const skin = silhouette ?? SKIN[seed % SKIN.length];
  const cloth = silhouette ?? CLOTH[(seed * 3 + 1) % CLOTH.length];
  const shawl = silhouette ?? CLOTH[(seed * 5 + 2) % CLOTH.length];
  const hip: [number, number] = [0, -54];
  const leg = (ang: number, k: number) => {
    const kx = hip[0] + Math.sin(ang) * 27;
    const ky = hip[1] + Math.cos(ang) * 27;
    const bend = Math.max(0, -ang) * 0.9 * k;
    const fx = kx + Math.sin(ang - bend) * 27;
    const fy = ky + Math.cos(ang - bend) * 27;
    return `M${hip[0]},${hip[1]} L${kx.toFixed(1)},${ky.toFixed(1)} L${fx.toFixed(1)},${fy.toFixed(1)}`;
  };
  const arm = (ang: number) => {
    const sx = 0;
    const sy = -92;
    const ex = sx + Math.sin(ang) * 22;
    const ey = sy + Math.cos(ang) * 22;
    const hx = ex + Math.sin(ang + 0.35) * 20;
    const hy = ey + Math.cos(ang + 0.35) * 20;
    return `M${sx},${sy} L${ex.toFixed(1)},${ey.toFixed(1)} L${hx.toFixed(1)},${hy.toFixed(1)}`;
  };
  const ghostFill = '#FFD9A0';
  const col = (c: string) => (ghost > 0 ? ghostFill : c);
  const raise = carry === 'pot';
  return (
    <g transform={`translate(${px} ${y + bob * scale}) scale(${scale * dir} ${scale})`} opacity={opacity * (ghost > 0 ? ghost : 1)}>
      {ghost > 0 ? <ellipse cx={0} cy={-60} rx={40} ry={75} fill={ghostFill} opacity={0.18} /> : null}
      <path d={leg(-a, 1)} stroke={col(mix(skin, '#000', 0.15))} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={arm(raise ? Math.PI * 0.92 : a * 0.8)} stroke={col(mix(skin, '#000', 0.15))} strokeWidth={6.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={leg(a, 1)} stroke={col(skin)} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* lower garment */}
      <path d={female ? `M-11,-64 L11,-64 L${15 + a * 4},-14 L${-15 + a * 4},-14 Z` : `M-11,-64 L11,-64 L${13 + a * 6},-36 L${-12 + a * 6},-36 Z`} fill={col(cloth)} />
      {/* torso */}
      <path d="M-10,-96 Q0,-101 10,-96 L11,-62 L-11,-62 Z" fill={col(skin)} />
      {/* shawl draped over one shoulder */}
      <path d="M-11,-96 L6,-98 L11,-72 L-4,-64 Z" fill={col(shawl)} opacity={silhouette ? 1 : 0.95} />
      {/* head */}
      <circle cx={2} cy={-110} r={10} fill={col(skin)} />
      {female ? <circle cx={-7} cy={-113} r={6} fill={col(silhouette ?? '#1E140E')} /> : <path d="M-7,-116 Q2,-124 11,-114" stroke={col(silhouette ?? '#1E140E')} strokeWidth={4} fill="none" />}
      <path d={arm(raise ? Math.PI * 0.95 : -a * 0.8)} stroke={col(skin)} strokeWidth={6.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {carry === 'pot' ? (
        <g>
          <ellipse cx={2} cy={-130} rx={13} ry={11} fill={col(silhouette ?? '#B5532F')} />
          <rect x={-4} y={-145} width={12} height={6} rx={2} fill={col(silhouette ?? '#8E3F22')} />
        </g>
      ) : null}
      {carry === 'basket' ? <path d="M-14,-122 L18,-122 L14,-134 L-10,-134 Z" fill={col(silhouette ?? '#9C7A45')} /> : null}
      {carry === 'stick' ? <line x1={14} y1={-80} x2={30} y2={0} stroke={col(silhouette ?? '#5A3A22')} strokeWidth={3} /> : null}
    </g>
  );
};

/** Zebu bull pulling a solid-wheeled cart (after Harappan terracotta cart models). */
export const BullCart: React.FC<{ frame: number; x: number; y: number; scale?: number; speed?: number; silhouette?: string; load?: boolean }> = ({ frame, x, y, scale = 1, speed = 1, silhouette, load = true }) => {
  const dir = speed >= 0 ? 1 : -1;
  const px = x + frame * speed;
  const ph = frame * Math.abs(speed) * 0.09;
  const body = silhouette ?? '#D8CDBB';
  const bodyDark = silhouette ?? '#A99C88';
  const wood = silhouette ?? '#6B4527';
  const wheelR = 36;
  const rot = ((frame * Math.abs(speed)) / wheelR) * (180 / Math.PI);
  const legs = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5].map((o, i) => {
    const a = Math.sin(ph + o) * 0.35;
    const lx = 60 + (i < 2 ? 0 : 70) + (i % 2) * 8;
    return <line key={i} x1={lx} y1={-62} x2={lx + Math.sin(a) * 34} y2={-62 + Math.cos(a) * 60} stroke={i % 2 ? bodyDark : body} strokeWidth={9} strokeLinecap="round" />;
  });
  return (
    <g transform={`translate(${px} ${y}) scale(${scale * dir} ${scale})`}>
      {/* cart */}
      <line x1={-40} y1={-70} x2={70} y2={-92} stroke={wood} strokeWidth={6} />
      <rect x={-150} y={-86} width={120} height={14} fill={wood} />
      {load ? (
        <g>
          <ellipse cx={-118} cy={-102} rx={18} ry={18} fill={silhouette ?? '#B5532F'} />
          <ellipse cx={-82} cy={-104} rx={20} ry={20} fill={silhouette ?? '#A0522D'} />
          <rect x={-66} y={-112} width={28} height={26} rx={4} fill={silhouette ?? '#C9B48A'} />
        </g>
      ) : null}
      <g transform={`translate(-90 ${-wheelR}) rotate(${rot})`}>
        <circle r={wheelR} fill={silhouette ?? '#7A5233'} />
        <circle r={wheelR - 5} fill="none" stroke={silhouette ?? '#5A3A22'} strokeWidth={3} />
        <line x1={-wheelR + 5} y1={-8} x2={wheelR - 5} y2={-8} stroke={silhouette ?? '#5A3A22'} strokeWidth={2} />
        <line x1={-wheelR + 5} y1={8} x2={wheelR - 5} y2={8} stroke={silhouette ?? '#5A3A22'} strokeWidth={2} />
        <circle r={7} fill={silhouette ?? '#3A2414'} />
      </g>
      {/* bull */}
      {legs.slice(2)}
      <path d="M40,-118 Q60,-138 90,-130 Q140,-128 165,-118 Q178,-100 170,-70 Q150,-58 100,-60 Q60,-58 48,-72 Q36,-90 40,-118 Z" fill={body} />
      <path d="M62,-128 Q72,-158 92,-134 Z" fill={bodyDark} />
      <path d="M165,-118 Q190,-120 200,-104 Q204,-92 194,-88 Q182,-86 172,-94 Z" fill={body} />
      <path d="M186,-116 Q192,-136 182,-142" stroke={bodyDark} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M172,-94 Q168,-74 158,-70" stroke={bodyDark} strokeWidth={6} fill="none" />
      <path d="M40,-112 Q22,-100 26,-80" stroke={bodyDark} strokeWidth={3} fill="none" />
      {legs.slice(0, 2)}
      <circle cx={192} cy={-108} r={2.5} fill="#1a1a1a" />
    </g>
  );
};
