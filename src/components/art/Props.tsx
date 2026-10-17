import React from 'react';
import { C } from '../../theme';
import { mix, rnd } from '../../utils/animation';

/** Harappan red-ware jar with black painted bands (origin: base centre). */
export const Pot: React.FC<{ x: number; y: number; s?: number; color?: string; variant?: number; broken?: boolean; pattern?: boolean; dark?: string }> = ({ x, y, s = 1, color = C.terracotta, variant = 0, broken = false, pattern = true, dark = '#1E120B' }) => {
  const shapes = [
    'M-10,0 Q-30,-6 -30,-34 Q-30,-58 -12,-66 L-12,-74 L12,-74 L12,-66 Q30,-58 30,-34 Q30,-6 10,0 Z',
    'M-14,0 Q-24,-10 -24,-28 Q-22,-46 -8,-50 L-10,-58 L10,-58 L8,-50 Q22,-46 24,-28 Q24,-10 14,0 Z',
    'M-8,0 L-20,-6 Q-34,-22 -24,-40 L-26,-46 L26,-46 L24,-40 Q34,-22 20,-6 L8,0 Z',
  ];
  const d = shapes[variant % shapes.length];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={1} rx={26} ry={5} fill="#000" opacity={0.2} />
      <path d={d} fill={color} />
      <path d={d} fill="url(#potShade)" />
      {pattern ? (
        <g stroke={dark} fill="none" opacity={0.85}>
          <path d="M-27,-44 Q0,-38 27,-44" strokeWidth={3} />
          <path d="M-29,-30 Q0,-24 29,-30" strokeWidth={1.6} />
          {variant === 0
            ? [-16, 0, 16].map((cx) => <circle key={cx} cx={cx} cy={-36} r={5} strokeWidth={1.4} />)
            : [-12, 4].map((cx) => <path key={cx} d={`M${cx},-40 q4,-6 8,0 q-4,6 -8,0`} strokeWidth={1.4} />)}
        </g>
      ) : null}
      {broken ? <path d="M6,-74 L12,-60 L4,-52 L16,-44 L30,-50 L30,-74 Z" fill={mix(C.charcoal, '#000', 0.2)} opacity={0.9} /> : null}
      <defs>
        <linearGradient id="potShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0.18} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.35} />
        </linearGradient>
      </defs>
    </g>
  );
};

/** Brick-lined well with a wooden frame; a pot rises and falls on a rope. */
export const Well: React.FC<{ x: number; y: number; s?: number; frame: number; color?: string; active?: boolean; silhouette?: string }> = ({ x, y, s = 1, frame, color = C.brick, active = true, silhouette }) => {
  const potY = active ? -40 - 60 * (0.5 + 0.5 * Math.sin(frame / 38)) : -40;
  const c = silhouette ?? color;
  const wood = silhouette ?? '#5A3A22';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-60} y={-46} width={120} height={46} fill={c} />
      {silhouette ? null : <rect x={-60} y={-46} width={120} height={46} fill="url(#bricksFine)" />}
      <ellipse cx={0} cy={-46} rx={60} ry={14} fill={silhouette ?? mix(color, '#fff', 0.15)} />
      <ellipse cx={0} cy={-46} rx={46} ry={9} fill={silhouette ?? '#1A0F08'} />
      <line x1={-50} y1={-46} x2={-44} y2={-150} stroke={wood} strokeWidth={7} />
      <line x1={50} y1={-46} x2={44} y2={-150} stroke={wood} strokeWidth={7} />
      <line x1={-52} y1={-146} x2={52} y2={-146} stroke={wood} strokeWidth={8} />
      <line x1={0} y1={-146} x2={0} y2={potY - 12} stroke={silhouette ?? '#C9B48A'} strokeWidth={2} />
      {potY < -55 ? <ellipse cx={0} cy={potY} rx={11} ry={12} fill={silhouette ?? C.terracotta} /> : null}
    </g>
  );
};

/** Stylised pipal/neem tree with gently swaying canopy. */
export const Tree: React.FC<{ x: number; y: number; s?: number; frame: number; color?: string; trunk?: string; seed?: number }> = ({ x, y, s = 1, frame, color = '#5E7A4A', trunk = '#4A3020', seed = 1 }) => {
  const sway = Math.sin(frame / 50 + seed) * 2.5;
  const blobs = Array.from({ length: 7 }, (_, i) => ({
    cx: (rnd(`tx${seed}${i}`) - 0.5) * 120,
    cy: -170 - rnd(`ty${seed}${i}`) * 90,
    r: 38 + rnd(`tr${seed}${i}`) * 30,
  }));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9,0 Q-6,-80 -14,-150 L-2,-150 Q2,-110 8,-150 L16,-148 Q8,-90 10,0 Z" fill={trunk} />
      <g transform={`rotate(${sway} 0 -150)`}>
        {blobs.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={i % 2 ? color : mix(color, '#000', 0.15)} />
        ))}
        {blobs.slice(0, 3).map((b, i) => (
          <circle key={`h${i}`} cx={b.cx - 10} cy={b.cy - 12} r={b.r * 0.5} fill={mix(color, '#fff', 0.15)} opacity={0.6} />
        ))}
      </g>
    </g>
  );
};

export const GrassTuft: React.FC<{ x: number; y: number; s?: number; frame: number; color?: string; seed?: number }> = ({ x, y, s = 1, frame, color = '#6B5A2E', seed = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: 7 }, (_, i) => {
      const a = (i - 3) * 0.22 + Math.sin(frame / 22 + seed + i * 0.4) * 0.12;
      const h = 30 + rnd(`g${seed}${i}`) * 30;
      return <path key={i} d={`M${i * 3 - 9},0 Q${i * 3 - 9 + Math.sin(a) * h * 0.4},${-h * 0.6} ${i * 3 - 9 + Math.sin(a) * h},${-h}`} stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" />;
    })}
  </g>
);

/** Generic stylised sign shapes (inspired by, not copied from, specific Indus inscriptions). */
export const SIGNS = [
  'M-14,-12 L-14,12 M14,-12 L14,12 M-14,12 Q0,22 14,12 M-20,-12 L20,-12', // jar
  'M-16,0 Q0,-14 16,0 Q0,14 -16,0 M16,0 L24,-8 M16,0 L24,8', // fish
  'M0,-16 L0,16 M-10,-16 L-10,16 M10,-16 L10,16', // strokes
  'M0,-16 L0,6 M-12,-4 L12,-4 M0,6 L-10,18 M0,6 L10,18 M0,-20 a4,4 0 1 0 0.1,0', // man
  'M-14,-14 L14,-14 M-14,-14 L-14,14 M-14,0 L8,0 M-14,14 L14,14', // comb-like
];

/** Indus "unicorn" seal in steatite (schematic artistic rendering; signs are stylised). */
export const Seal: React.FC<{ x: number; y: number; s?: number; glow?: number; signReveal?: number; light?: number }> = ({ x, y, s = 1, glow = 0, signReveal = 1, light = 0.5 }) => {
  const base = '#D8CCB4';
  const carved = '#B9AA8E';
  const deep = '#8E7F66';
  const signs = SIGNS;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {glow > 0 ? <circle r={420} fill="url(#lampGlow)" opacity={glow * 0.5} /> : null}
      <rect x={-232} y={-222} width={480} height={480} rx={26} fill="#000" opacity={0.35} transform="translate(14 16)" />
      <rect x={-240} y={-240} width={480} height={480} rx={26} fill={base} />
      <rect x={-240} y={-240} width={480} height={480} rx={26} fill="url(#sealLight)" />
      <rect x={-212} y={-212} width={424} height={424} rx={16} fill={carved} />
      <rect x={-212} y={-212} width={424} height={424} rx={16} fill="none" stroke={deep} strokeWidth={6} opacity={0.6} />
      {/* signs */}
      <g stroke={deep} strokeWidth={9} strokeLinecap="round" fill="none">
        {signs.map((d, i) => {
          const o = Math.max(0, Math.min(1, signReveal * signs.length - i));
          return (
            <g key={i} transform={`translate(${-140 + i * 70} -150)`} opacity={o}>
              <path d={d} />
              {glow > 0 ? <path d={d} stroke={C.goldLight} strokeWidth={4} opacity={glow * o} /> : null}
            </g>
          );
        })}
      </g>
      {/* unicorn (bull with single horn), facing left, with a ritual stand */}
      <g transform="translate(10 40)">
        <path d="M-100,-30 Q-90,-70 -40,-70 L80,-66 Q130,-64 140,-30 Q146,0 124,24 L-70,26 Q-104,10 -100,-30 Z" fill={deep} opacity={0.75} />
        <path d="M-100,-40 Q-120,-80 -150,-84 Q-170,-80 -168,-60 Q-160,-36 -120,-24 Z" fill={deep} opacity={0.8} />
        <path d="M-150,-82 Q-170,-140 -120,-176" stroke={deep} strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d="M-130,-82 Q-130,-100 -118,-104" stroke={deep} strokeWidth={6} fill="none" />
        {[-70, -40, 70, 104].map((lx, i) => (
          <path key={i} d={`M${lx},20 L${lx + (i % 2 ? 6 : -4)},92`} stroke={deep} strokeWidth={14} strokeLinecap="round" />
        ))}
        <path d="M140,-30 Q170,-10 160,40" stroke={deep} strokeWidth={6} fill="none" />
        {/* harness bands */}
        <path d="M-60,-66 Q-70,-20 -64,24 M-30,-68 Q-38,-20 -34,25" stroke={base} strokeWidth={4} opacity={0.4} fill="none" />
        {/* ritual stand */}
        <path d="M-210,96 L-180,96 L-188,30 L-202,30 Z M-214,30 L-176,30 L-182,6 L-208,6 Z" fill={deep} opacity={0.75} transform="translate(30 0)" />
      </g>
      <defs>
        <linearGradient id="sealLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.35 * light + 0.05} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.35} />
        </linearGradient>
      </defs>
    </g>
  );
};

/** Graded cubical chert weights (binary ratios) on a balance. */
export const Weights: React.FC<{ x: number; y: number; s?: number; frame: number; reveal: number }> = ({ x, y, s = 1, frame, reveal }) => {
  const sizes = [14, 18, 23, 29, 36, 45];
  let cx = 0;
  const tilt = Math.sin(frame / 22) * 4 * Math.exp(-((frame % 600) / 300));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* balance */}
      <line x1={-120} y1={0} x2={-120} y2={-190} stroke="#5A3A22" strokeWidth={8} />
      <rect x={-150} y={-4} width={60} height={8} fill="#5A3A22" />
      <g transform={`rotate(${tilt} -120 -186)`}>
        <line x1={-230} y1={-186} x2={-10} y2={-186} stroke="#6B4527" strokeWidth={7} strokeLinecap="round" />
        {[-226, -14].map((px, i) => (
          <g key={i} transform={`rotate(${-tilt} ${px} -186)`}>
            <line x1={px} y1={-186} x2={px - 26} y2={-120} stroke="#C9B48A" strokeWidth={2} />
            <line x1={px} y1={-186} x2={px + 26} y2={-120} stroke="#C9B48A" strokeWidth={2} />
            <path d={`M${px - 34},-120 Q${px},-100 ${px + 34},-120 Z`} fill="#8C6A3E" />
            {i === 1 ? <rect x={px - 10} y={-137} width={20} height={18} fill="#E9DFC9" stroke="#8C7B60" strokeWidth={1} /> : <ellipse cx={px} cy={-127} rx={16} ry={9} fill={C.terracotta} />}
          </g>
        ))}
      </g>
      {/* weights */}
      {sizes.map((sz, i) => {
        const o = Math.max(0, Math.min(1, reveal * sizes.length - i));
        const x0 = 40 + cx;
        cx += sz + 16;
        return (
          <g key={i} opacity={o} transform={`translate(0 ${(1 - o) * -20})`}>
            <rect x={x0} y={-sz} width={sz} height={sz} fill="#E9DFC9" />
            <rect x={x0} y={-sz * 0.66} width={sz} height={sz * 0.12} fill="#9C8664" opacity={0.6} />
            <rect x={x0} y={-sz * 0.36} width={sz} height={sz * 0.08} fill="#9C8664" opacity={0.5} />
            <polygon points={`${x0},${-sz} ${x0 + sz * 0.3},${-sz - sz * 0.25} ${x0 + sz * 1.3},${-sz - sz * 0.25} ${x0 + sz},${-sz}`} fill="#F6EEDC" />
            <polygon points={`${x0 + sz},${-sz} ${x0 + sz * 1.3},${-sz - sz * 0.25} ${x0 + sz * 1.3},${-sz * 0.25} ${x0 + sz},0`} fill="#C9BB9C" />
          </g>
        );
      })}
    </g>
  );
};

/** String of long carnelian beads. */
export const Beads: React.FC<{ x: number; y: number; s?: number; reveal?: number }> = ({ x, y, s = 1, reveal = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-150,0 Q0,90 150,0" stroke="#5A3A22" strokeWidth={2} fill="none" />
    {Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      const bx = -150 + 300 * t;
      const by = 2 * (1 - t) * t * 90;
      const ang = Math.atan2(90 * (1 - 2 * t), 150) * (180 / Math.PI);
      const o = Math.max(0, Math.min(1, reveal * 13 - i));
      return (
        <g key={i} transform={`translate(${bx} ${by}) rotate(${ang})`} opacity={o}>
          <ellipse rx={i % 3 === 1 ? 9 : 16} ry={6} fill={i % 3 === 1 ? '#E8DCC0' : '#C2452D'} />
          <ellipse rx={i % 3 === 1 ? 5 : 10} ry={2.5} cy={-2} fill="#fff" opacity={0.25} />
        </g>
      );
    })}
  </g>
);

/** Cloth awning market stall. */
export const Stall: React.FC<{ x: number; y: number; s?: number; frame: number; cloth?: string; seed?: number }> = ({ x, y, s = 1, frame, cloth = '#A8442C', seed = 0 }) => {
  const flutter = Math.sin(frame / 15 + seed) * 3;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1={-110} y1={0} x2={-110} y2={-170} stroke="#5A3A22" strokeWidth={6} />
      <line x1={110} y1={0} x2={110} y2={-170} stroke="#5A3A22" strokeWidth={6} />
      <path d={`M-130,-170 L130,-170 L140,${-135 + flutter} Q100,${-125 + flutter} 60,${-135 + flutter} Q20,${-125 + flutter} -20,${-135 + flutter} Q-60,${-125 + flutter} -100,${-135 + flutter} L-140,${-135 + flutter} Z`} fill={cloth} />
      <path d={`M-130,-170 L130,-170 L140,${-135 + flutter} L-140,${-135 + flutter} Z`} fill="#000" opacity={0.12} />
      {[-90, -30, 30, 90].map((sx, i) => (
        <rect key={i} x={sx - 2} y={-170} width={4} height={36} fill="#fff" opacity={0.18} />
      ))}
      <rect x={-120} y={-52} width={240} height={52} fill="#7A5233" />
      <rect x={-120} y={-58} width={240} height={8} fill="#8C6440" />
    </g>
  );
};
