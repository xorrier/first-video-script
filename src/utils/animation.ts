import { Easing, interpolate, random } from 'remotion';

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = Easing.bezier(0.45, 0, 0.25, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);

/** 0→1 progress between two frames with easing. */
export const prog = (f: number, start: number, dur: number, ease = smooth) =>
  interpolate(f, [start, start + Math.max(1, dur)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });

/** Fade in at `start`, fade out ending at `end`. */
export const window01 = (f: number, start: number, end: number, fadeIn = 15, fadeOut = 15) =>
  Math.min(prog(f, start, fadeIn), 1 - prog(f, end - fadeOut, fadeOut));

/** Piecewise keyframe interpolation of numbers. keys: [frame, value][] sorted by frame. */
export function keys(f: number, k: [number, number][], ease = smooth): number {
  if (f <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [f0, v0] = k[i];
    const [f1, v1] = k[i + 1];
    if (f <= f1) return lerp(v0, v1, ease(clamp((f - f0) / Math.max(1, f1 - f0))));
  }
  return k[k.length - 1][1];
}

/** Deterministic random in [0,1) from any seed. */
export const rnd = (seed: string | number) => random(String(seed));
export const rndRange = (seed: string | number, a: number, b: number) => a + rnd(seed) * (b - a);

/** Smooth deterministic 1D value noise in [-1,1]. */
export function noise1(seed: number, t: number) {
  const i = Math.floor(t);
  const fr = t - i;
  const s = fr * fr * (3 - 2 * fr);
  const a = rnd(`${seed}:${i}`) * 2 - 1;
  const b = rnd(`${seed}:${i + 1}`) * 2 - 1;
  return a + (b - a) * s;
}

/** Catmull-Rom spline through points → SVG cubic path. */
export function smoothPath(pts: [number, number][], tension = 0.5, closed = false): string {
  if (pts.length < 2) return '';
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2];
    const t = tension / 3;
    d += ` C${(x1 + (x2 - x0) * t).toFixed(1)},${(y1 + (y2 - y0) * t).toFixed(1)} ${(x2 - (x3 - x1) * t).toFixed(1)},${(y2 - (y3 - y1) * t).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return closed ? d + 'Z' : d;
}

/** Point and angle at fraction t along a polyline. */
export function alongPolyline(pts: [number, number][], t: number) {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(l);
    total += l;
  }
  let d = clamp(t) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const u = segs[i] ? d / segs[i] : 0;
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      return { x: lerp(x0, x1, u), y: lerp(y0, y1, u), angle: Math.atan2(y1 - y0, x1 - x0) };
    }
    d -= segs[i];
  }
  return { x: pts[0][0], y: pts[0][1], angle: 0 };
}

/** Mix two hex colours. */
export function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const c = (s: number) => Math.round(lerp(ch(pa, s), ch(pb, s), clamp(t)));
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0')}`;
}
