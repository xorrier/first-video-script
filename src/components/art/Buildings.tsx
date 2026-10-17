import React from 'react';
import { C } from '../../theme';
import { mix, rnd } from '../../utils/animation';

/** Shared SVG pattern/gradient definitions (identical everywhere, so duplicate ids are harmless). */
export const ArtDefs: React.FC = () => (
  <>
    <pattern id="bricks" width={44} height={28} patternUnits="userSpaceOnUse">
      <path d="M0,13.5 H44 M0,27.5 H44 M0.5,0 V13.5 M22.5,14 V28" stroke="rgba(35,15,6,0.30)" strokeWidth={1.4} fill="none" />
      <path d="M0,15 H44 M0,1 H44" stroke="rgba(255,225,190,0.10)" strokeWidth={1} fill="none" />
    </pattern>
    <pattern id="bricksFine" width={22} height={14} patternUnits="userSpaceOnUse">
      <path d="M0,6.75 H22 M0,13.75 H22 M0.5,0 V6.75 M11.5,7 V14" stroke="rgba(35,15,6,0.22)" strokeWidth={0.9} fill="none" />
    </pattern>
    <linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#000" stopOpacity={0} />
      <stop offset="0.7" stopColor="#000" stopOpacity={0.12} />
      <stop offset="1" stopColor="#000" stopOpacity={0.38} />
    </linearGradient>
    <linearGradient id="sideShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#000" stopOpacity={0.0} />
      <stop offset="1" stopColor="#000" stopOpacity={0.25} />
    </linearGradient>
    <radialGradient id="lampGlow">
      <stop offset="0" stopColor="#FFD38A" stopOpacity={0.9} />
      <stop offset="1" stopColor="#FFB04A" stopOpacity={0} />
    </radialGradient>
  </>
);

type HouseProps = {
  x: number;
  y: number; // ground line
  w: number;
  h: number;
  seed: string | number;
  color: string;
  decay?: number;
  detail?: boolean;
  rim?: string;
  rimOpacity?: number;
  lit?: number;
  dark?: string;
};

/** A Harappan-style flat-roofed mud/fired-brick house seen from the street. */
export const House: React.FC<HouseProps> = ({ x, y, w, h, seed, color, decay = 0, detail = true, rim, rimOpacity = 0.7, lit = 0, dark = '#2B170E' }) => {
  const r = (k: string) => rnd(`${seed}${k}`);
  const top = y - h;
  // silhouette (jagged when decayed)
  const pts: string[] = [`${x},${y}`];
  const steps = Math.max(2, Math.round(w / 14));
  const leftDrop = decay * h * (0.15 + r('ld') * 0.35);
  const rightDrop = decay * h * (0.1 + r('rd') * 0.4);
  for (let i = 0; i < steps; i++) {
    const px = x + (w * i) / steps;
    const edge = i === 0 ? leftDrop : i === steps - 1 ? rightDrop : 0;
    const dip = decay > 0 ? (rnd(`${seed}j${i}`) ** 2.2) * decay * h * 0.4 + rnd(`${seed}k${i}`) * decay * 8 : 0;
    const t = top + Math.max(edge, dip);
    // stepped profile reads as broken brick courses rather than spikes
    pts.push(`${px.toFixed(1)},${t.toFixed(1)}`, `${(px + w / steps).toFixed(1)},${t.toFixed(1)}`);
  }
  pts.push(`${x + w},${y}`);
  const poly = pts.join(' ');
  const hasUpper = r('up') > 0.45 && decay < 0.45 && h > 60;
  const uw = w * (0.38 + r('uw') * 0.2);
  const ux = r('ux') > 0.5 ? x + w - uw - w * 0.06 : x + w * 0.06;
  const uh = h * (0.32 + r('uh') * 0.15);
  const doorW = Math.max(10, w * 0.15);
  const doorH = h * 0.44;
  const doorX = x + w * (0.15 + r('dx') * 0.6);
  const winY = top + h * 0.22;
  const nWin = r('nw') > 0.5 ? 2 : 1;
  const beams = Math.max(3, Math.round(w / 34));
  const shade = mix(color, '#000000', 0.18);
  const winCol = lit > 0 ? mix(dark, '#FFC56A', lit) : dark;
  return (
    <g>
      {hasUpper ? (
        <g>
          <rect x={ux} y={top - uh} width={uw} height={uh + 2} fill={mix(color, '#000', 0.06)} />
          {detail ? <rect x={ux} y={top - uh} width={uw} height={uh + 2} fill="url(#bricks)" /> : null}
          <rect x={ux - 3} y={top - uh - 6} width={uw + 6} height={7} fill={mix(color, '#fff', 0.12)} />
          <rect x={ux + uw * 0.35} y={top - uh * 0.75} width={Math.max(6, uw * 0.18)} height={uh * 0.4} fill={winCol} />
          {rim ? <line x1={ux - 3} y1={top - uh - 6} x2={ux + uw + 3} y2={top - uh - 6} stroke={rim} strokeWidth={2.5} opacity={rimOpacity} /> : null}
        </g>
      ) : null}
      <polygon points={poly} fill={color} />
      {detail ? <polygon points={poly} fill="url(#bricks)" /> : null}
      {decay < 0.5 ? <rect x={x - 3} y={top - 7} width={w + 6} height={8} fill={mix(color, '#fff', 0.14)} opacity={1 - decay * 2} /> : null}
      {decay < 0.35 && detail
        ? Array.from({ length: beams }, (_, i) => (
            <rect key={i} x={x + ((i + 0.5) * w) / beams - 3} y={top + 6} width={6} height={9} fill={dark} opacity={0.8} />
          ))
        : null}
      {/* door with wooden lintel */}
      {decay < 0.7 ? (
        <g>
          <rect x={doorX - 3} y={y - doorH - 6} width={doorW + 6} height={6} fill="#6B4527" />
          <rect x={doorX} y={y - doorH} width={doorW} height={doorH} fill={dark} />
        </g>
      ) : (
        <path d={`M${doorX},${y} L${doorX + 2},${y - doorH * 0.8} L${doorX + doorW * 0.6},${y - doorH} L${doorX + doorW},${y - doorH * 0.6} L${doorX + doorW},${y} Z`} fill={dark} opacity={0.85} />
      )}
      {Array.from({ length: nWin }, (_, i) => {
        const wx = x + w * (nWin === 1 ? 0.62 : 0.25 + i * 0.45);
        if (Math.abs(wx - doorX) < doorW + 8) return null;
        const ww = Math.max(6, w * 0.08);
        return (
          <g key={i}>
            <rect x={wx} y={winY} width={ww} height={ww * 0.9} fill={winCol} />
            {lit > 0 ? <circle cx={wx + ww / 2} cy={winY + ww / 2} r={ww * 3} fill="url(#lampGlow)" opacity={lit * 0.6} /> : null}
            {detail ? <line x1={wx + ww / 2} y1={winY} x2={wx + ww / 2} y2={winY + ww * 0.9} stroke={shade} strokeWidth={1.5} /> : null}
          </g>
        );
      })}
      <polygon points={poly} fill="url(#wallShade)" />
      {rim && decay < 0.5 ? <line x1={x - 3} y1={top - 7} x2={x + w + 3} y2={top - 7} stroke={rim} strokeWidth={2.5} opacity={rimOpacity} /> : null}
      {/* cracks and fallen bricks */}
      {decay > 0.2
        ? Array.from({ length: 2 + Math.round(decay * 3) }, (_, i) => {
            const cx = x + rnd(`${seed}c${i}`) * w;
            const cy = top + h * 0.2 + rnd(`${seed}cy${i}`) * h * 0.4;
            return <path key={i} d={`M${cx},${cy} l${6 - rnd(`${seed}a${i}`) * 12},14 l${5 - rnd(`${seed}b${i}`) * 10},12 l${4 - rnd(`${seed}e${i}`) * 8},10`} stroke={dark} strokeWidth={1.6} fill="none" opacity={0.6 * decay} />;
          })
        : null}
      {decay > 0.3
        ? Array.from({ length: Math.round(decay * 6) }, (_, i) => (
            <rect key={i} x={x - 10 + rnd(`${seed}fb${i}`) * (w + 20)} y={y - 7 - rnd(`${seed}fh${i}`) * 4} width={11} height={5} fill={mix(color, '#000', 0.1)} transform={`rotate(${rnd(`${seed}fr${i}`) * 40 - 20} ${x + w / 2} ${y})`} />
          ))
        : null}
      {/* roof clutter: pots / drying cloth */}
      {decay < 0.3 && detail && r('pot') > 0.5 ? (
        <g>
          <ellipse cx={x + w * 0.3} cy={top - 13} rx={7} ry={7} fill={C.terracotta} />
          <ellipse cx={x + w * 0.3 + 16} cy={top - 11} rx={5} ry={5} fill={mix(C.terracotta, '#000', 0.2)} />
        </g>
      ) : null}
    </g>
  );
};

/** A row of houses with occasional narrow lanes between them. */
export const HouseRow: React.FC<{
  x0: number;
  x1: number;
  y: number;
  hMin: number;
  hMax: number;
  wMin: number;
  wMax: number;
  colors: string[];
  seed: string;
  decay?: number;
  decayVar?: number;
  detail?: boolean;
  rim?: string;
  rimOpacity?: number;
  lit?: number;
  dark?: string;
  missing?: number; // fraction of houses that have collapsed into stubs
}> = ({ x0, x1, y, hMin, hMax, wMin, wMax, colors, seed, decay = 0, decayVar = 0, detail = true, rim, rimOpacity, lit = 0, dark, missing = 0 }) => {
  const out: React.ReactNode[] = [];
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = wMin + rnd(`${seed}w${i}`) * (wMax - wMin);
    const h0 = hMin + rnd(`${seed}h${i}`) * (hMax - hMin);
    const gone = rnd(`${seed}m${i}`) < missing;
    const d = Math.min(1, decay + (rnd(`${seed}dv${i}`) - 0.3) * decayVar);
    const h = gone ? h0 * 0.28 : h0;
    out.push(
      <House key={i} x={x} y={y} w={w} h={h} seed={`${seed}${i}`} color={colors[i % colors.length]} decay={gone ? 1 : Math.max(0, d)} detail={detail} rim={rim} rimOpacity={rimOpacity} lit={lit * (rnd(`${seed}l${i}`) > 0.4 ? 1 : 0)} dark={dark} />,
    );
    x += w + (rnd(`${seed}g${i}`) > 0.72 ? 18 + rnd(`${seed}gg${i}`) * 26 : 1);
    i++;
  }
  return <g>{out}</g>;
};

/** The raised citadel mound with monumental buildings. */
export const Citadel: React.FC<{ x: number; y: number; w: number; h: number; color: string; earth: string; rim?: string; decay?: number; detail?: boolean }> = ({ x, y, w, h, color, earth, rim, decay = 0, detail = false }) => {
  const top = y - h;
  const mound = `M${x - 120},${y} C${x - 40},${y - h * 0.3} ${x - 20},${top + 10} ${x + 60},${top} L${x + w - 60},${top} C${x + w + 20},${top + 10} ${x + w + 40},${y - h * 0.3} ${x + w + 120},${y} Z`;
  return (
    <g>
      <path d={mound} fill={earth} />
      {/* retaining wall */}
      <rect x={x + 40} y={top} width={w - 80} height={h * 0.45} fill={color} />
      <rect x={x + 40} y={top} width={w - 80} height={h * 0.45} fill="url(#bricksFine)" />
      <rect x={x + 40} y={top} width={w - 80} height={h * 0.45} fill="url(#wallShade)" />
      {/* monumental buildings on the platform */}
      <House x={x + 70} y={top + 1} w={w * 0.22} h={h * 0.55} seed="cit1" color={mix(color, '#fff', 0.05)} decay={decay} detail={detail} rim={rim} />
      <House x={x + 70 + w * 0.23} y={top + 1} w={w * 0.3} h={h * 0.38} seed="cit2" color={color} decay={decay} detail={detail} rim={rim} />
      {/* great hall with timber superstructure */}
      <g>
        <rect x={x + w * 0.6} y={top - h * 0.3} width={w * 0.28} height={h * 0.3 + 1} fill={mix(color, '#000', 0.08)} />
        {decay < 0.5
          ? Array.from({ length: 7 }, (_, i) => (
              <rect key={i} x={x + w * 0.6 + 6 + i * ((w * 0.28 - 12) / 6) - 3} y={top - h * 0.48} width={6} height={h * 0.18} fill="#5A3A22" opacity={1 - decay * 2} />
            ))
          : null}
        {decay < 0.5 ? <rect x={x + w * 0.6 - 6} y={top - h * 0.5} width={w * 0.28 + 12} height={8} fill="#6B4527" opacity={1 - decay * 2} /> : null}
        {rim ? <line x1={x + w * 0.6} y1={top - h * 0.3} x2={x + w * 0.88} y2={top - h * 0.3} stroke={rim} strokeWidth={2.5} opacity={0.6} /> : null}
      </g>
      {/* stairs up the mound */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={x + w * 0.5 - 30 + i * 4} y={y - (i + 1) * (h * 0.55) / 8} width={60 - i * 8} height={(h * 0.55) / 8} fill={mix(earth, '#fff', 0.08 + i * 0.01)} opacity={0.6} />
      ))}
    </g>
  );
};

/** Isometric reconstruction of the Great Bath (approx. 12 × 7 m, 2.4 m deep). */
export const GreatBathIso: React.FC<{ frame: number; build: number; water: number; ox: number; oy: number; s: number }> = ({ frame, build, water, ox, oy, s }) => {
  const c30 = Math.cos(Math.PI / 6);
  const iso = (x: number, y: number, z: number): [number, number] => [ox + (x - y) * c30 * s, oy + (x + y) * 0.5 * s - z * s];
  const P = (...p: [number, number, number][]) => p.map((q) => iso(...q).map((v) => v.toFixed(1)).join(',')).join(' ');
  const W = 22; // platform
  const D = 16;
  const H = 1.4 * build;
  const tx0 = 5, tx1 = 17, ty0 = 4.5, ty1 = 11.5; // tank 12 × 7
  const depth = 2.4;
  const wl = -depth + depth * 0.8 * water;
  const brick = C.brick;
  return (
    <g>
      {/* platform sides */}
      <polygon points={P([0, D, 0], [W, D, 0], [W, D, H], [0, D, H])} fill={mix(brick, '#000', 0.25)} />
      <polygon points={P([W, 0, 0], [W, D, 0], [W, D, H], [W, 0, H])} fill={mix(brick, '#000', 0.4)} />
      <polygon points={P([0, D, 0], [W, D, 0], [W, D, H], [0, D, H])} fill="url(#bricksFine)" />
      {/* platform top */}
      <polygon points={P([0, 0, H], [W, 0, H], [W, D, H], [0, D, H])} fill={mix(C.brickLight, '#fff', 0.1)} />
      <polygon points={P([0, 0, H], [W, 0, H], [W, D, H], [0, D, H])} fill="url(#bricksFine)" opacity={0.6} />
      {/* surrounding rooms (low walls) */}
      {build > 0.5
        ? [[1, 1, 21, 1.8], [1, 14.2, 21, 15], [1, 1, 1.8, 15], [20.2, 1, 21, 15]].map(([a, b, c2, d], i) => {
            const hh = H + 1.6 * Math.min(1, (build - 0.5) * 2);
            return (
              <g key={i}>
                <polygon points={P([a, d, H], [c2, d, H], [c2, d, hh], [a, d, hh])} fill={mix(brick, '#000', 0.15)} />
                <polygon points={P([c2, b, H], [c2, d, H], [c2, d, hh], [c2, b, hh])} fill={mix(brick, '#000', 0.32)} />
                <polygon points={P([a, b, hh], [c2, b, hh], [c2, d, hh], [a, d, hh])} fill={mix(C.brickLight, '#fff', 0.2)} />
              </g>
            );
          })
        : null}
      {/* tank: inner far walls */}
      <polygon points={P([tx0, ty0, H], [tx1, ty0, H], [tx1, ty0, H - depth], [tx0, ty0, H - depth])} fill={mix(brick, '#000', 0.45)} />
      <polygon points={P([tx0, ty0, H], [tx0, ty1, H], [tx0, ty1, H - depth], [tx0, ty0, H - depth])} fill={mix(brick, '#000', 0.3)} />
      <polygon points={P([tx0, ty0, H - depth], [tx1, ty0, H - depth], [tx1, ty1, H - depth], [tx0, ty1, H - depth])} fill={mix(brick, '#000', 0.5)} />
      {/* steps at both ends */}
      {Array.from({ length: 6 }, (_, i) => {
        const z = H - (i + 1) * (depth / 6);
        const yA = ty0 + 2.5;
        const yB = ty1 - 2.5;
        return (
          <g key={i}>
            <polygon points={P([tx0 + i * 0.35, yA, z], [tx0 + (i + 1) * 0.35, yA, z], [tx0 + (i + 1) * 0.35, yB, z], [tx0 + i * 0.35, yB, z])} fill={mix(C.brickLight, '#000', 0.1 + i * 0.05)} />
            <polygon points={P([tx1 - (i + 1) * 0.35, yA, z], [tx1 - i * 0.35, yA, z], [tx1 - i * 0.35, yB, z], [tx1 - (i + 1) * 0.35, yB, z])} fill={mix(C.brickLight, '#000', 0.15 + i * 0.05)} />
          </g>
        );
      })}
      {/* water */}
      {water > 0 ? (
        <g>
          <polygon points={P([tx0, ty0, H + wl], [tx1, ty0, H + wl], [tx1, ty1, H + wl], [tx0, ty1, H + wl])} fill={C.river} opacity={0.88} />
          {Array.from({ length: 9 }, (_, i) => {
            const yy = ty0 + 0.6 + ((i * 0.75 + frame * 0.01) % 6.6);
            const xa = tx0 + 1 + (i % 3) * 3;
            const [x1, y1] = iso(xa, yy, H + wl);
            const [x2, y2] = iso(xa + 2, yy, H + wl);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.riverLight} strokeWidth={2} opacity={0.5 * water} strokeLinecap="round" />;
          })}
        </g>
      ) : null}
      {/* rim */}
      <polygon points={P([tx0, ty0, H], [tx1, ty0, H], [tx1, ty1, H], [tx0, ty1, H])} fill="none" stroke={C.cream} strokeWidth={2} opacity={0.5} />
    </g>
  );
};

/** Low excavated ruin walls (top-down-ish oblique view) for night/dawn scenes. */
export const RuinField: React.FC<{ y: number; color: string; top: string; seed: string; x0?: number; x1?: number; scale?: number }> = ({ y, color, top, seed, x0 = -200, x1 = 2200, scale = 1 }) => {
  const out: React.ReactNode[] = [];
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = (80 + rnd(`${seed}w${i}`) * 220) * scale;
    const h = (12 + rnd(`${seed}h${i}`) * 50) * scale;
    const yy = y + rnd(`${seed}y${i}`) * 40 * scale;
    const d = 18 * scale;
    out.push(
      <g key={i}>
        <polygon points={`${x},${yy} ${x + w},${yy} ${x + w + d},${yy - d * 0.6} ${x + d},${yy - d * 0.6}`} fill={top} transform={`translate(0 ${-h})`} />
        <rect x={x} y={yy - h} width={w} height={h} fill={color} />
        <rect x={x} y={yy - h} width={w} height={h} fill="url(#bricksFine)" />
        <polygon points={`${x + w},${yy - h} ${x + w + d},${yy - h - d * 0.6} ${x + w + d},${yy - d * 0.6} ${x + w},${yy}`} fill={mix(color, '#000', 0.3)} />
      </g>,
    );
    x += w + (30 + rnd(`${seed}g${i}`) * 120) * scale;
    i++;
  }
  return <g>{out}</g>;
};
