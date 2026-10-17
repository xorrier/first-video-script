import React from 'react';
import geo from '../data/geo.json';
import { C, FONT_SANS } from '../theme';
import { alongPolyline, clamp, easeOut, prog, smoothPath } from '../utils/animation';
import { SvgLabel } from './Text';

type Pt = [number, number];
export const SUB = geo.sub as unknown as {
  land: string;
  ppd: number;
  rivers: Record<string, { name: string; w: number; paleo?: boolean; pts: Pt[] }>;
  sites: Record<string, { name: string; tier: number; late?: boolean; xy: Pt }>;
  labels: { text: string; kind: string; xy: Pt }[];
  himalaya: Pt[];
  monsoon: { arabian: Pt[]; bengal: Pt[] };
  mature: Pt[];
  late: Pt[];
};
export const TRADE = geo.trade as unknown as {
  land: string;
  points: Record<string, { name: string; xy: Pt }>;
  route: Pt[];
  routeLothal: Pt[];
  indus: Pt[];
  tigris: Pt[];
  euphrates: Pt[];
};

export const SEA = '#B9C7BC';
export const LAND = '#EAD9B4';

/** Stroke that draws itself on (0..1) using normalised pathLength. */
export const DrawPath: React.FC<{ d: string; p: number; stroke: string; width: number; opacity?: number; dash?: string; cap?: 'round' | 'butt'; id?: string }> = ({ d, p, stroke, width, opacity = 1, dash, cap = 'round', id }) => {
  if (p <= 0) return null;
  if (!dash) {
    return <path d={d} pathLength={1} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap={cap} strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - clamp(p)} opacity={opacity} />;
  }
  // dashed line revealed through a self-drawing mask
  const mid = `m_${id ?? Math.abs(hashStr(d)).toString(36)}`;
  return (
    <g opacity={opacity}>
      <mask id={mid} maskUnits="userSpaceOnUse" x={-500} y={-500} width={3000} height={2200}>
        <path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth={width + 12} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - clamp(p)} />
      </mask>
      <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap={cap} strokeDasharray={dash} mask={`url(#${mid})`} />
    </g>
  );
};

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 7) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Land mass with a self-drawing coastline and fade-in fill. */
export const LandMass: React.FC<{ d: string; draw: number; fill?: number; coast?: string; landColor?: string; hatch?: boolean; seaColor?: string; texture?: boolean }> = ({ d, draw, fill = 1, coast = C.brown, landColor = LAND, hatch = true, seaColor = SEA, texture = true }) => (
  <g>
    <rect x={-2000} y={-2000} width={6000} height={5000} fill={seaColor} opacity={0.55 * fill} />
    {hatch ? <rect x={-2000} y={-2000} width={6000} height={5000} fill="url(#seaHatch)" opacity={0.5 * fill} /> : null}
    <path d={d} fill={landColor} opacity={fill} />
    {texture ? <path d={d} fill="url(#landTex)" opacity={fill * 0.6} /> : null}
    <DrawPath d={d} p={draw} stroke={coast} width={2.2} opacity={0.8} />
  </g>
);

export const MapDefs: React.FC = () => (
  <>
    <pattern id="seaHatch" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <line x1={0} y1={0} x2={0} y2={14} stroke={C.teal} strokeWidth={1} opacity={0.35} />
    </pattern>
    <radialGradient id="landTex" cx="0.5" cy="0.4" r="0.7">
      <stop offset="0" stopColor="#F4E6C6" stopOpacity={0.9} />
      <stop offset="1" stopColor="#C9A877" stopOpacity={0.5} />
    </radialGradient>
    <radialGradient id="pinGlow">
      <stop offset="0" stopColor={C.goldLight} stopOpacity={0.9} />
      <stop offset="1" stopColor={C.goldLight} stopOpacity={0} />
    </radialGradient>
    <marker id="arrowHead" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={4} markerHeight={4} orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 Z" fill={C.teal} />
    </marker>
  </>
);

/** Rivers with individually controllable draw progress and fade. */
export const Rivers: React.FC<{
  progress: (id: string) => number;
  fade?: (id: string) => number;
  only?: string[];
  scaleW?: number;
  labels?: (id: string) => number;
  frame?: number;
  labelSize?: number;
  highlight?: string;
}> = ({ progress, fade = () => 1, only, scaleW = 1, labels, frame = 0, labelSize = 22, highlight }) => {
  const ids = only ?? Object.keys(SUB.rivers);
  return (
    <g>
      {ids.map((id) => {
        const r = SUB.rivers[id];
        const d = smoothPath(r.pts);
        const p = progress(id);
        const o = fade(id);
        const w = r.w * scaleW * (highlight === id ? 1.6 : 1);
        return (
          <g key={id} opacity={o}>
            {r.paleo ? (
              <DrawPath d={d} p={p} stroke={C.river} width={w} dash={`${w * 3} ${w * 2.2}`} id={`riv_${id}`} />
            ) : (
              <>
                <DrawPath d={d} p={p} stroke={C.riverLight} width={w + 3} opacity={0.5} />
                <DrawPath d={d} p={p} stroke={C.river} width={w} />
              </>
            )}
            {labels && labels(id) > 0 ? (
              <RiverLabel id={id} frame={frame} o={labels(id) * o} size={labelSize} />
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

const RIVER_LABEL_AT: Record<string, [number, number, number]> = {
  // [fraction along, dx, dy]
  indus: [0.86, 22, 6],
  jhelum: [0.3, -10, -14],
  chenab: [0.4, -60, 10],
  ravi: [0.35, 14, -6],
  beas: [0.4, 14, -2],
  sutlej: [0.55, 16, 18],
  ghaggar: [0.45, 14, 34],
  yamuna: [0.45, 14, 6],
  ganga: [0.55, 4, 32],
  narmada: [0.5, -20, 28],
};

const RiverLabel: React.FC<{ id: string; frame: number; o: number; size: number }> = ({ id, o, size }) => {
  const r = SUB.rivers[id];
  const [t, dx, dy] = RIVER_LABEL_AT[id] ?? [0.5, 10, 0];
  const p = alongPolyline(r.pts, t);
  return (
    <text x={p.x + dx} y={p.y + dy} fontFamily={FONT_SANS} fontStyle="italic" fontWeight={600} fontSize={size} fill={C.river} opacity={o} stroke="rgba(241,228,198,0.85)" strokeWidth={size * 0.2} paintOrder="stroke">
      {r.name}
    </text>
  );
};

/** Animated map pin: drop + ring pulse + label. */
export const SitePin: React.FC<{ frame: number; start: number; x: number; y: number; label?: string; size?: number; color?: string; labelDx?: number; labelDy?: number; anchor?: 'start' | 'end' | 'middle'; labelSize?: number; dim?: number; end?: number }> = ({
  frame, start, x, y, label, size = 9, color = C.brick, labelDx = 16, labelDy = 8, anchor = 'start', labelSize = 26, dim = 1, end = 1e9,
}) => {
  const p = prog(frame, start, 14, easeOut);
  if (p <= 0) return null;
  const ring = clamp((frame - start) / 40);
  const out = 1 - prog(frame, end - 12, 12);
  return (
    <g opacity={dim * out}>
      <circle cx={x} cy={y} r={size * 5} fill="url(#pinGlow)" opacity={(1 - ring) * 0.8} />
      <circle cx={x} cy={y} r={size + ring * 34} fill="none" stroke={color} strokeWidth={2} opacity={(1 - ring) * 0.8} />
      <circle cx={x} cy={y} r={size * p * 1.25} fill={C.cream} />
      <circle cx={x} cy={y} r={size * p * 0.85} fill={color} />
      {label ? <SvgLabel frame={frame} start={start + 4} x={x + labelDx} y={y + labelDy} text={label} size={labelSize} anchor={anchor} color={C.ink} /> : null}
    </g>
  );
};

/** Curved monsoon wind arrow with flowing dashes; `strength` 0..1 thins and fades it. */
export const MonsoonArrow: React.FC<{ pts: Pt[]; frame: number; draw: number; strength: number }> = ({ pts, frame, draw, strength }) => {
  const d = smoothPath(pts);
  const w = 6 + 16 * strength;
  return (
    <g opacity={0.25 + 0.75 * strength}>
      <DrawPath d={d} p={draw} stroke={C.teal} width={w} opacity={0.35} />
      {draw >= 1 ? (
        <path d={d} fill="none" stroke={C.cream} strokeWidth={w * 0.35} strokeDasharray="18 26" strokeDashoffset={-frame * (1 + 2.5 * strength)} strokeLinecap="round" opacity={0.85} />
      ) : null}
      {draw >= 1 ? <ArrowHeadAt pts={pts} w={w} /> : null}
    </g>
  );
};

const ArrowHeadAt: React.FC<{ pts: Pt[]; w: number }> = ({ pts, w }) => {
  const n = pts.length;
  const [x1, y1] = pts[n - 1];
  const [x0, y0] = pts[n - 2];
  const a = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  const s = w * 1.6;
  return <path d={`M${s},0 L${-s},${-s} L${-s * 0.4},0 L${-s},${s} Z`} transform={`translate(${x1} ${y1}) rotate(${a})`} fill={C.teal} opacity={0.75} />;
};

/** Schematic settlement scatter with staggered reveal. */
export const Scatter: React.FC<{ pts: Pt[]; frame: number; start: number; color: string; r?: number; opacity?: number; stagger?: number; seedOffset?: number }> = ({ pts, frame, start, color, r = 5, opacity = 1, stagger = 1.2 }) => (
  <g opacity={opacity}>
    {pts.map(([x, y], i) => {
      const p = prog(frame, start + i * stagger, 12, easeOut);
      if (p <= 0) return null;
      return <circle key={i} cx={x} cy={y} r={r * p} fill={color} stroke={C.cream} strokeWidth={1.2} opacity={0.9} />;
    })}
  </g>
);

/** Himalaya ridge drawn as little peaks along a line. */
export const Mountains: React.FC<{ reveal: number }> = ({ reveal }) => {
  const pts = SUB.himalaya;
  const peaks: React.ReactNode[] = [];
  const n = 26;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    if (t > reveal) break;
    const p = alongPolyline(pts, t);
    const h = 16 + ((i * 7) % 5) * 4;
    peaks.push(
      <g key={i} transform={`translate(${p.x} ${p.y - 6})`}>
        <path d={`M-16,0 L0,${-h} L16,0 Z`} fill="#B79C74" />
        <path d={`M0,${-h} L5,${-h * 0.62} L-1,${-h * 0.7} L-5,${-h * 0.6} Z`} fill={C.cream} />
        <path d={`M0,${-h} L16,0 L4,0 Z`} fill="#000" opacity={0.12} />
      </g>,
    );
  }
  return <g>{peaks}</g>;
};

/** Small reed boat used on the trade map. */
export const Boat: React.FC<{ x: number; y: number; angle: number; s?: number; frame: number }> = ({ x, y, angle, s = 1, frame }) => {
  const flip = Math.cos(angle) < 0 ? -1 : 1;
  const bob = Math.sin(frame / 8) * 1.5;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s * flip} ${s})`}>
      <path d="M-26,0 Q0,12 26,0 L30,-6 Q0,2 -30,-6 Z" fill={C.brown} />
      <line x1={0} y1={-2} x2={0} y2={-40} stroke={C.brown} strokeWidth={2.5} />
      <path d="M2,-38 Q20,-24 2,-8 Z" fill={C.cream} stroke={C.brown} strokeWidth={1} />
      <path d={`M-40,4 q6,-3 12,0 M28,4 q6,-3 12,0`} stroke={C.river} strokeWidth={1.5} fill="none" opacity={0.7} />
    </g>
  );
};

/** Draws a route and moves a boat along it. */
export const Route: React.FC<{ pts: Pt[]; frame: number; draw: number; boatT?: number; color?: string }> = ({ pts, frame, draw, boatT, color = C.terracotta }) => {
  const d = smoothPath(pts);
  const sm = pts;
  return (
    <g>
      <DrawPath d={d} p={draw} stroke={color} width={4} dash="14 10" id={`route_${pts.length}_${Math.round(pts[0][0])}`} />
      {boatT !== undefined && boatT > 0 && boatT < 1 ? (() => {
        const b = alongPolyline(sm, boatT);
        return <Boat x={b.x} y={b.y} angle={b.angle} frame={frame} s={1.1} />;
      })() : null}
    </g>
  );
};
