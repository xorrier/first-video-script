import React from 'react';
import { B, G, VText, vWidth, PaperFilter, BlotchFilter } from './brand';
import { SealMark, SEAL } from './Logo';

/**
 * YouTube channel banner, 2560×1440 (pure SVG – no Remotion hooks, exportable as a standalone file).
 * Everything essential (seal + wordmark + tagline) sits inside the 1546×423 mobile safe area;
 * monuments live in the 2560×423 desktop band; sky/stars/earth fill the TV-only area.
 */
export const BANNER_W = 2560;
export const BANNER_H = 1440;
export const SAFE = { x: 507, y: 508, w: 1546, h: 423 }; // mobile + text/logo safe area
export const TABLET = { x: 352, y: 508, w: 1855, h: 423 };
export const DESKTOP = { x: 0, y: 508, w: 2560, h: 423 };

const GROUND = 940;
const SUN = { x: 2220, y: 772, r: 172 };

const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const Stars: React.FC = () => {
  const r = rng(11);
  const stars = Array.from({ length: 150 }, () => {
    const y = Math.pow(r(), 1.6) * 600;
    return { x: r() * BANNER_W, y, s: 0.7 + r() * 1.6, o: (0.15 + r() * 0.5) * (1 - y / 760) };
  });
  return (
    <g fill={B.cream}>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.s.toFixed(2)} opacity={s.o.toFixed(2)} />
      ))}
    </g>
  );
};

/** Distant low skyline / mounds across the whole width. */
const FarSkyline: React.FC = () => {
  const r = rng(5);
  let d = `M0 ${GROUND} L0 880 `;
  for (let x = 0; x <= BANNER_W; x += 40) d += `L${x} ${(872 + Math.sin(x / 210) * 10 + r() * 8).toFixed(0)} `;
  d += `L${BANNER_W} ${GROUND} Z`;
  return <path d={d} fill={B.umber} opacity={0.75} />;
};

/** Low flat-roofed Indus-style brick houses (centre band, kept below the lockup). */
const Houses: React.FC = () => {
  const r = rng(23);
  const items: React.ReactNode[] = [];
  let x = 600;
  let i = 0;
  while (x < 2000) {
    const w = 60 + r() * 90;
    const top = 872 + r() * 30;
    items.push(<rect key={`h${i}`} x={x.toFixed(0)} y={top.toFixed(0)} width={(w + 1).toFixed(0)} height={(GROUND - top).toFixed(0)} fill="#24170F" />);
    if (r() < 0.45) items.push(<rect key={`p${i}`} x={(x + w * 0.15).toFixed(0)} y={(top - 7).toFixed(0)} width={(w * 0.3).toFixed(0)} height={8} fill="#24170F" />);
    if (r() < 0.35) {
      const wx = x + 12 + r() * (w - 30);
      items.push(<rect key={`w${i}`} x={wx.toFixed(0)} y={(top + 12).toFixed(0)} width={7} height={9} fill={B.gold} opacity={0.55 + r() * 0.3} />);
    }
    if (r() < 0.4) items.push(<rect key={`d${i}`} x={(x + w * 0.55).toFixed(0)} y={(GROUND - 22).toFixed(0)} width={11} height={22} fill="#120C08" />);
    x += w - 4 + (r() < 0.2 ? 18 : 0);
    i++;
  }
  return <g>{items}</g>;
};

const SILHOUETTE = '#140E0B';

const Stupa: React.FC<{ cx: number }> = ({ cx }) => (
  <g fill={SILHOUETTE}>
    {/* chhatra (umbrella tiers) + harmika */}
    <rect x={cx - 3} y={606} width={6} height={86} />
    <ellipse cx={cx} cy={668} rx={36} ry={5} />
    <ellipse cx={cx} cy={644} rx={29} ry={4.5} />
    <ellipse cx={cx} cy={621} rx={21} ry={4} />
    <rect x={cx - 30} y={686} width={60} height={8} />
    <rect x={cx - 22} y={694} width={44} height={24} />
    {/* anda (dome) + medhi (drum) */}
    <path d={`M${cx - 152} 882 A152 166 0 0 1 ${cx + 152} 882 Z`} />
    <rect x={cx - 165} y={878} width={330} height={GROUND - 878} />
    {/* vedika railing */}
    <rect x={cx - 200} y={904} width={400} height={7} />
    {Array.from({ length: 23 }, (_, i) => (
      <rect key={i} x={cx - 200 + i * 17.6} y={904} width={6} height={GROUND - 904} />
    ))}
  </g>
);

const Torana: React.FC<{ cx: number }> = ({ cx }) => {
  const beam = (y: number, half: number) => (
    <g key={y}>
      <path d={`M${cx - half} ${y + 4} Q${cx} ${y - 10} ${cx + half} ${y + 4} L${cx + half} ${y + 18} Q${cx} ${y + 4} ${cx - half} ${y + 18} Z`} />
      <circle cx={cx - half - 4} cy={y + 9} r={10} />
      <circle cx={cx + half + 4} cy={y + 9} r={10} />
    </g>
  );
  return (
    <g fill={SILHOUETTE}>
      <rect x={cx - 52} y={752} width={18} height={GROUND - 752} />
      <rect x={cx + 34} y={752} width={18} height={GROUND - 752} />
      {beam(742, 84)}
      {beam(776, 80)}
      {beam(810, 76)}
      <rect x={cx - 12} y={758} width={6} height={18} />
      <rect x={cx + 6} y={758} width={6} height={18} />
      <circle cx={cx} cy={722} r={11} />
      <rect x={cx - 3} y={728} width={6} height={16} />
    </g>
  );
};

const Shikhara: React.FC<{ cx: number }> = ({ cx }) => (
  <g fill={SILHOUETTE}>
    {/* mandapa */}
    <rect x={cx - 190} y={848} width={110} height={GROUND - 848} />
    <path d={`M${cx - 202} 852 L${cx - 135} 784 L${cx - 68} 852 Z`} />
    <ellipse cx={cx - 135} cy={782} rx={14} ry={6} />
    <rect x={cx - 137} y={764} width={4} height={14} />
    {/* rekha-prasada tower */}
    <path d={`M${cx - 96} 905 C${cx - 96} 790 ${cx - 64} 668 ${cx - 18} 604 L${cx + 18} 604 C${cx + 64} 668 ${cx + 96} 790 ${cx + 96} 905 Z`} />
    <ellipse cx={cx} cy={597} rx={34} ry={12} />
    <path d={`M${cx - 10} 588 Q${cx} 566 ${cx + 10} 588 Z`} />
    <rect x={cx - 2} y={552} width={4} height={22} />
    {/* jagati (platform) */}
    <rect x={cx - 232} y={903} width={360} height={GROUND - 903} />
    <rect x={cx - 246} y={922} width={388} height={GROUND - 922} />
    {/* bhumi bands – faint sunlit edges */}
    {[640, 690, 742, 796, 852].map((y) => {
      const t = (y - 604) / 301;
      const half = 18 + (96 - 18) * Math.sqrt(t) * 0.98;
      return <rect key={y} x={cx - half} y={y} width={half * 2} height={3} fill={B.terracotta} opacity={0.35} />;
    })}
  </g>
);

const AshokaPillar: React.FC<{ cx: number }> = ({ cx }) => (
  <g fill={SILHOUETTE}>
    <path d={`M${cx - 9} 690 L${cx + 9} 690 L${cx + 13} ${GROUND} L${cx - 13} ${GROUND} Z`} />
    <path d={`M${cx - 20} 692 Q${cx - 18} 662 ${cx} 660 Q${cx + 18} 662 ${cx + 20} 692 Z`} />
    <rect x={cx - 22} y={648} width={44} height={13} />
    <circle cx={cx} cy={622} r={21} fill="none" stroke={SILHOUETTE} strokeWidth={6} />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 8;
      return <line key={i} x1={cx - Math.cos(a) * 20} y1={622 - Math.sin(a) * 20} x2={cx + Math.cos(a) * 20} y2={622 + Math.sin(a) * 20} stroke={SILHOUETTE} strokeWidth={2.5} />;
    })}
    <rect x={cx - 4} y={641} width={8} height={8} />
  </g>
);

const Palm: React.FC<{ x: number; h: number; lean?: number }> = ({ x, h, lean = 14 }) => {
  const tx = x + lean;
  const ty = GROUND - h;
  const fronds = [
    [-70, 18], [-52, -12], [-18, -30], [22, -28], [56, -8], [74, 22], [-36, 30], [40, 34],
  ];
  return (
    <g stroke={SILHOUETTE} fill="none" strokeLinecap="round">
      <path d={`M${x} ${GROUND} Q${x + lean * 0.2} ${ty + h * 0.45} ${tx} ${ty}`} strokeWidth={9} />
      {fronds.map(([dx, dy], i) => (
        <path key={i} d={`M${tx} ${ty} Q${tx + dx * 0.55} ${ty + dy * 0.2 - 22} ${tx + dx} ${ty + dy}`} strokeWidth={6} />
      ))}
    </g>
  );
};

const Birds: React.FC = () => (
  <g stroke={SILHOUETTE} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.85}>
    {[
      [1985, 668, 1],
      [2030, 646, 0.8],
      [2064, 676, 0.7],
      [2100, 632, 0.6],
    ].map(([x, y, s], i) => (
      <path key={i} d={`M${x - 14 * s} ${y - 4 * s} Q${x - 6 * s} ${y - 8 * s} ${x} ${y} Q${x + 6 * s} ${y - 8 * s} ${x + 14 * s} ${y - 4 * s}`} />
    ))}
  </g>
);

/** Brick courses in the TV-only earth band (Indus bricks, 1:2:4 proportion). */
const BrickEarth: React.FC = () => {
  const rows: React.ReactNode[] = [];
  const h = 26;
  for (let r = 0; r < 18; r++) {
    const y = 1000 + r * h;
    const off = r % 2 ? 52 : 0;
    rows.push(<line key={`r${r}`} x1={0} y1={y} x2={BANNER_W} y2={y} />);
    for (let x = -off; x < BANNER_W; x += 104) rows.push(<line key={`v${r}-${x}`} x1={x} y1={y} x2={x} y2={y + h} />);
  }
  return (
    <g stroke={B.parchment} strokeWidth={1.5} opacity={0.05}>
      {rows}
    </g>
  );
};

/** Seal + "शिलालेख" + SHILALEKH + tagline, laid out for the safe area. */
export const BannerLockup: React.FC<{ id: string }> = ({ id }) => {
  const sealPx = 286;
  const gap = 58;
  const devaSize = 200;
  const latinSize = 34;
  const tagSize = 56;
  const textW = Math.max(vWidth(G.wordmarkDeva, devaSize), vWidth(G.tagline, tagSize));
  const total = sealPx + gap + textW;
  const x0 = SAFE.x + (SAFE.w - total) / 2;
  const tx = x0 + sealPx + gap;
  const devaBase = 714;
  const latinBase = devaBase + 58;
  const tagBase = latinBase + 80;
  const latinW = vWidth(G.wordmarkLatin, latinSize);
  const s = sealPx / (SEAL * 2);
  return (
    <g>
      <g transform={`translate(${(x0 + sealPx / 2).toFixed(1)} ${(SAFE.y + SAFE.h / 2 - 10).toFixed(1)}) scale(${s.toFixed(4)})`}>
        <SealMark id={`${id}-seal`} />
      </g>
      <VText g={G.wordmarkDeva} x={tx} y={devaBase} size={devaSize} fill={B.parchment} />
      <VText g={G.wordmarkLatin} x={tx + 4} y={latinBase} size={latinSize} fill={B.parchmentDark} opacity={0.8} />
      <rect x={tx + latinW + 30} y={latinBase - 13} width={Math.max(0, vWidth(G.wordmarkDeva, devaSize) - latinW - 30)} height={2} fill={B.gold} opacity={0.7} />
      <VText g={G.tagline} x={tx} y={tagBase} size={tagSize} fill={B.gold} />
    </g>
  );
};

export const BannerSvg: React.FC<{ id?: string; width?: number }> = ({ id = 'bn', width = BANNER_W }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${BANNER_W} ${BANNER_H}`} width={width} height={(width * BANNER_H) / BANNER_W}>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0D0907" />
        <stop offset="0.3" stopColor="#18110D" />
        <stop offset="0.45" stopColor="#241711" />
        <stop offset="0.56" stopColor="#3C2216" />
        <stop offset="0.62" stopColor="#6E341F" />
        <stop offset="0.655" stopColor="#A04B2A" />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx={SUN.x} cy={SUN.y} r={760} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={B.gold} stopOpacity={0.55} />
        <stop offset="0.25" stopColor={B.terracottaLight} stopOpacity={0.3} />
        <stop offset="1" stopColor={B.terracotta} stopOpacity={0} />
      </radialGradient>
      <radialGradient id={`${id}-lockbg`} cx={1280} cy={700} r={820} gradientUnits="userSpaceOnUse" gradientTransform="translate(1280 700) scale(1 0.42) translate(-1280 -700)">
        <stop offset="0" stopColor={B.night} stopOpacity={0.55} />
        <stop offset="1" stopColor={B.night} stopOpacity={0} />
      </radialGradient>
      <linearGradient id={`${id}-earth`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1B120D" />
        <stop offset="1" stopColor={B.night} />
      </linearGradient>
      <radialGradient id={`${id}-vig`} cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.55" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.55} />
      </radialGradient>
      <PaperFilter id={`${id}-paper`} freq={0.75} alpha={0.55} />
      <BlotchFilter id={`${id}-blotch`} />
    </defs>

    <rect width={BANNER_W} height={BANNER_H} fill={`url(#${id}-sky)`} />
    <Stars />
    <rect width={BANNER_W} height={GROUND + 20} fill={`url(#${id}-glow)`} />
    <circle cx={SUN.x} cy={SUN.y} r={SUN.r + 40} fill={B.gold} opacity={0.18} />
    <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill="#F3D9A0" />
    <rect width={BANNER_W} height={BANNER_H} fill={`url(#${id}-lockbg)`} />

    <FarSkyline />
    <Houses />
    <Palm x={668} h={168} lean={16} />
    <Palm x={1966} h={150} lean={-12} />
    <Stupa cx={300} />
    <Torana cx={548} />
    <Shikhara cx={SUN.x} />
    <AshokaPillar cx={2478} />
    <Birds />

    {/* earth + river (TV-only band mostly) */}
    <rect y={GROUND} width={BANNER_W} height={BANNER_H - GROUND} fill={`url(#${id}-earth)`} />
    <rect y={GROUND + 10} width={BANNER_W} height={30} fill="#1C2E2C" opacity={0.9} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={SUN.x - 120 + i * 22} y={GROUND + 14 + i * 7} width={240 - i * 44} height={3} rx={1.5} fill={B.gold} opacity={0.45 - i * 0.08} />
    ))}
    <BrickEarth />

    <BannerLockup id={id} />

    {/* parchment texture + aged blotches + vignette */}
    <rect width={BANNER_W} height={BANNER_H} filter={`url(#${id}-paper)`} opacity={0.3} />
    <rect width={BANNER_W} height={BANNER_H} filter={`url(#${id}-blotch)`} opacity={0.45} />
    <rect width={BANNER_W} height={BANNER_H} fill={`url(#${id}-vig)`} />
  </svg>
);
