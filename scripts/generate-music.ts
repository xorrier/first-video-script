/**
 * Procedural, self-created soundtrack + sound effects (no third-party samples).
 * Reads src/data/timeline.json and writes:
 *   public/audio/music.wav  – stereo score that follows each scene's mood
 *   public/audio/sfx.wav    – stereo ambience + spot effects
 */
import path from 'node:path';
import { P, SR, readJSON, writeWav, log } from './lib';

const TAU = Math.PI * 2;
const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// ----------------------------------------------------------------- DSP utils
type BQ = { b0: number; b1: number; b2: number; a1: number; a2: number };
function biquad(type: 'lp' | 'hp' | 'bp', f: number, q = 0.707): BQ {
  const w = (TAU * f) / SR;
  const c = Math.cos(w);
  const s = Math.sin(w);
  const al = s / (2 * q);
  let b0 = 0, b1 = 0, b2 = 0;
  if (type === 'lp') (b0 = (1 - c) / 2), (b1 = 1 - c), (b2 = (1 - c) / 2);
  if (type === 'hp') (b0 = (1 + c) / 2), (b1 = -(1 + c)), (b2 = (1 + c) / 2);
  if (type === 'bp') (b0 = al), (b1 = 0), (b2 = -al);
  const a0 = 1 + al;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * c) / a0, a2: (1 - al) / a0 };
}
function filt(x: Float32Array, k: BQ, from = 0, to = x.length) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = from; i < to; i++) {
    const y = k.b0 * x[i] + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = y;
    x[i] = y;
  }
  return x;
}
/** time-varying filter: cutoff given per sample block */
function filtSweep(x: Float32Array, type: 'lp' | 'bp', fAt: (t: number) => number, q = 0.9) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let k = biquad(type, fAt(0), q);
  for (let i = 0; i < x.length; i++) {
    if (i % 256 === 0) k = biquad(type, Math.max(30, Math.min(18000, fAt(i / SR))), q);
    const y = k.b0 * x[i] + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = y;
    x[i] = y;
  }
  return x;
}
function smoothNoise(seed: number, rate: number) {
  // deterministic slow random curve, value in [0,1]
  const r = mulberry32(seed);
  const pts = Array.from({ length: 4096 }, () => r());
  return (t: number) => {
    const x = t * rate;
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    return pts[i % 4096] * (1 - s) + pts[(i + 1) % 4096] * s;
  };
}
function reverb(L: Float32Array, R: Float32Array, wet: number) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => Math.round((d * SR) / 44100));
  const aps = [556, 441].map((d) => Math.round((d * SR) / 44100));
  const proc = (x: Float32Array, spread: number) => {
    const out = new Float32Array(x.length);
    for (const d0 of combs) {
      const d = d0 + spread;
      const buf = new Float32Array(d);
      let idx = 0;
      let lp = 0;
      for (let i = 0; i < x.length; i++) {
        const y = buf[idx];
        lp = y * 0.6 + lp * 0.4;
        buf[idx] = x[i] * 0.15 + lp * 0.84;
        out[i] += y;
        idx = (idx + 1) % d;
      }
    }
    for (const d0 of aps) {
      const d = d0 + spread;
      const buf = new Float32Array(d);
      let idx = 0;
      for (let i = 0; i < out.length; i++) {
        const b = buf[idx];
        const y = -out[i] + b;
        buf[idx] = out[i] + b * 0.5;
        out[i] = y;
        idx = (idx + 1) % d;
      }
    }
    return out;
  };
  const wl = proc(L, 0);
  const wr = proc(R, 23);
  for (let i = 0; i < L.length; i++) {
    L[i] += wl[i] * wet;
    R[i] += wr[i] * wet;
  }
}

// ----------------------------------------------------------------- buses
class Bus {
  L: Float32Array;
  R: Float32Array;
  constructor(public n: number) {
    this.L = new Float32Array(n);
    this.R = new Float32Array(n);
  }
  add(sig: Float32Array, at: number, gain: number, pan = 0, env?: (t: number) => number) {
    const o = Math.round(at * SR);
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < sig.length; i++) {
      const j = o + i;
      if (j < 0 || j >= this.n) continue;
      const e = env ? env(j / SR) : 1;
      this.L[j] += sig[i] * gl * e;
      this.R[j] += sig[i] * gr * e;
    }
  }
}

// ----------------------------------------------------------------- instruments
function pluck(freq: number, dur: number, seed: number, bright = 0.5) {
  // Karplus–Strong with a little "jawari" buzz (tanpura-like)
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const p = Math.round(SR / freq);
  const buf = new Float32Array(p);
  const r = mulberry32(seed);
  for (let i = 0; i < p; i++) buf[i] = (r() * 2 - 1) * (0.5 + bright * 0.5);
  let idx = 0;
  const decay = 0.9985;
  for (let i = 0; i < n; i++) {
    const a = buf[idx];
    const b = buf[(idx + 1) % p];
    let v = (a + b) * 0.5 * decay;
    v = v + 0.04 * Math.tanh(v * 6) * (1 - i / n);
    buf[idx] = v;
    out[i] = a;
    idx = (idx + 1) % p;
  }
  const att = Math.round(0.004 * SR);
  for (let i = 0; i < att; i++) out[i] *= i / att;
  filt(out, biquad('hp', 50));
  return out;
}

function padVoice(freqs: number[], dur: number, seed: number, cutoff: number) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const r = mulberry32(seed);
  for (const f of freqs) {
    for (const det of [-0.11, 0.0, 0.12]) {
      const ff = f * Math.pow(2, det / 12);
      let ph = r();
      const inc = ff / SR;
      for (let i = 0; i < n; i++) {
        ph += inc;
        if (ph >= 1) ph -= 1;
        out[i] += (ph * 2 - 1) * 0.12;
      }
    }
  }
  filt(out, biquad('lp', cutoff, 0.6));
  filt(out, biquad('lp', cutoff * 1.4, 0.6));
  return out;
}

function flute(freq: number, dur: number, seed: number) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const r = mulberry32(seed);
  let ph = 0;
  const breath = new Float32Array(n);
  for (let i = 0; i < n; i++) breath[i] = r() * 2 - 1;
  filt(breath, biquad('bp', freq * 2, 2.5));
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const vib = 1 + 0.006 * Math.sin(TAU * 5.2 * t) * Math.min(1, t / 0.5);
    const slide = t < 0.08 ? Math.pow(2, (-0.6 * (1 - t / 0.08)) / 12) : 1; // meend-like scoop into the note
    ph += (freq * vib * slide) / SR;
    const env = Math.min(1, t / 0.12) * Math.min(1, (dur - t) / 0.35);
    out[i] = (Math.sin(TAU * ph) + 0.18 * Math.sin(TAU * 2 * ph) + 0.06 * Math.sin(TAU * 3 * ph)) * env * 0.5 + breath[i] * env * 0.25;
  }
  return out;
}

function drum(kind: 'dha' | 'na' | 'ge' | 'pulse', seed: number) {
  const dur = kind === 'pulse' ? 1.2 : kind === 'ge' || kind === 'dha' ? 0.6 : 0.3;
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const r = mulberry32(seed);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    if (kind === 'ge' || kind === 'dha') {
      const f = 75 + 55 * Math.exp(-t * 18);
      p1 += f / SR;
      out[i] += Math.sin(TAU * p1) * Math.exp(-t * 6) * 0.9;
    }
    if (kind === 'na' || kind === 'dha') {
      p2 += 540 / SR;
      out[i] += (Math.sin(TAU * p2) + 0.5 * Math.sin(TAU * p2 * 2.01) + 0.25 * Math.sin(TAU * p2 * 2.98)) * Math.exp(-t * 16) * 0.35;
      if (t < 0.01) out[i] += (r() * 2 - 1) * 0.3 * (1 - t / 0.01);
    }
    if (kind === 'pulse') {
      const f = 52 + 20 * Math.exp(-t * 10);
      p1 += f / SR;
      out[i] += Math.sin(TAU * p1) * Math.exp(-t * 4.5);
    }
  }
  return out;
}

function noise(dur: number, seed: number) {
  const r = mulberry32(seed);
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  // pinkish noise (Paul Kellet's economical filter)
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) {
    const w = r() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    out[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
  }
  return out;
}

// ----------------------------------------------------------------- score
const D = 50; // D3 = MIDI 50 is "Sa"
const MOODS: Record<string, { chords: number[][]; cutoff: number; pad: number; tanpura: number; flute: number; drums: number; pulse: number; shimmer: number; scale: number[] }> = {
  dusk: { chords: [[38, 50, 53, 57, 64], [34, 50, 53, 58], [31, 50, 55, 58], [33, 49, 52, 57]], cutoff: 900, pad: 0.55, tanpura: 0.5, flute: 0, drums: 0, pulse: 0.15, shimmer: 0.25, scale: [62, 63, 65, 67, 69, 70, 72] },
  map: { chords: [[38, 50, 53, 57], [41, 53, 57, 60], [36, 52, 55, 60], [38, 50, 53, 57]], cutoff: 1100, pad: 0.45, tanpura: 0.55, flute: 0.45, drums: 0, pulse: 0, shimmer: 0, scale: [62, 64, 65, 67, 69, 71, 72, 74] },
  day: { chords: [[38, 50, 54, 57], [36, 52, 55, 60], [43, 50, 55, 59], [38, 50, 54, 57]], cutoff: 1500, pad: 0.4, tanpura: 0.6, flute: 0.55, drums: 0.5, pulse: 0, shimmer: 0, scale: [62, 64, 66, 67, 69, 71, 72, 74] },
  change: { chords: [[38, 50, 53, 57], [34, 50, 53, 58], [31, 50, 55, 58], [39, 51, 55, 58]], cutoff: 800, pad: 0.55, tanpura: 0.35, flute: 0.2, drums: 0, pulse: 0.35, shimmer: 0.1, scale: [62, 63, 65, 67, 69, 70, 72] },
  night: { chords: [[38, 50, 57], [39, 51, 58], [34, 50, 53], [38, 50, 57, 63]], cutoff: 650, pad: 0.6, tanpura: 0.3, flute: 0, drums: 0, pulse: 0.5, shimmer: 0.4, scale: [62, 63, 65, 67, 69, 70] },
  dawn: { chords: [[34, 50, 53, 58], [41, 53, 57, 60], [36, 52, 55, 60], [38, 50, 54, 57, 62]], cutoff: 1300, pad: 0.55, tanpura: 0.55, flute: 0.5, drums: 0, pulse: 0, shimmer: 0.1, scale: [62, 64, 66, 67, 69, 71, 74] },
  end: { chords: [[38, 50, 52, 57, 62], [38, 50, 52, 57, 64]], cutoff: 1100, pad: 0.5, tanpura: 0.55, flute: 0.3, drums: 0, pulse: 0, shimmer: 0, scale: [62, 64, 66, 69, 71, 74] },
};

export function generateMusic() {
  const tl = readJSON(P.timeline);
  const total = tl.totalSec + 1;
  const N = Math.ceil(total * SR);
  const mus = new Bus(N);
  const sfx = new Bus(N);
  const XF = 2.5; // crossfade between scene moods

  tl.scenes.forEach((sc: any, si: number) => {
    const m = MOODS[sc.mood] ?? MOODS.map;
    const a = Math.max(0, sc.start - (si === 0 ? 0 : XF / 2));
    const b = Math.min(total, sc.end + XF / 2);
    const fadeIn = si === 0 ? 2.5 : XF;
    const env = (t: number) => {
      const fi = Math.min(1, Math.max(0, (t - a) / fadeIn));
      const fo = Math.min(1, Math.max(0, (b - t) / XF));
      return Math.sin((fi * Math.PI) / 2) * Math.sin((fo * Math.PI) / 2);
    };
    const len = b - a;
    const seed = si * 1000 + 1;

    // pads: one chord every ~7s with overlapping swells
    const chordLen = 7.2;
    for (let k = 0, t = a; t < b; k++, t += chordLen) {
      const ch = m.chords[k % m.chords.length].map(mtof);
      const d = Math.min(chordLen + 3, b - t + 0.01);
      const v = padVoice(ch, d, seed + k, m.cutoff);
      for (let i = 0; i < v.length; i++) {
        const tt = i / SR;
        v[i] *= Math.min(1, tt / 2.2) * Math.min(1, (d - tt) / 2.8);
      }
      mus.add(v, t, m.pad * 0.55, k % 2 ? 0.25 : -0.25, env);
    }
    // tanpura cycle: Pa – Sa' – Sa' – Sa (low)
    if (m.tanpura > 0) {
      const notes = [mtof(D - 5), mtof(D), mtof(D), mtof(D - 12)];
      const step = 1.05;
      const pl = notes.map((f, i) => pluck(f, 5.5, seed + 50 + i, 0.6));
      for (let k = 0, t = a; t < b; k++, t += step) {
        const i = k % 4;
        mus.add(pl[i], t + (k % 4 === 3 ? 0.15 : 0), m.tanpura * 0.32, [-0.4, 0.15, 0.3, -0.1][i], env);
      }
    }
    // flute phrases (sparse, leave space for narration)
    if (m.flute > 0) {
      const r = mulberry32(seed + 77);
      let t = a + 2 + r() * 2;
      let deg = 2;
      while (t < b - 4) {
        const notesInPhrase = 3 + Math.floor(r() * 3);
        for (let k = 0; k < notesInPhrase && t < b - 3; k++) {
          deg = Math.max(0, Math.min(m.scale.length - 1, deg + Math.round((r() - 0.5) * 3)));
          const d = k === notesInPhrase - 1 ? 2.4 : 0.6 + r() * 0.9;
          mus.add(flute(mtof(m.scale[deg]), d + 0.3, seed + k), t, m.flute * 0.16, 0.1, env);
          t += d;
        }
        deg = 2;
        t += 5 + r() * 5;
      }
    }
    // soft keherwa-like hand drum for the living city
    if (m.drums > 0) {
      const bpm = 84;
      const beat = 60 / bpm / 2;
      const pat: ('dha' | 'na' | 'ge' | null)[] = ['dha', 'ge', 'na', 'ge', 'na', 'na', 'dha', null];
      const hits = { dha: drum('dha', 1), na: drum('na', 2), ge: drum('ge', 3) };
      for (let k = 0, t = a + 1; t < b; k++, t += beat) {
        const h = pat[k % pat.length];
        if (h) mus.add(hits[h], t, m.drums * (h === 'na' ? 0.13 : 0.18), h === 'na' ? 0.2 : -0.1, env);
      }
    }
    // slow low pulse for tension
    if (m.pulse > 0) {
      const p = drum('pulse', 9);
      for (let t = a + 0.5; t < b; t += 1.9) mus.add(p, t, m.pulse * 0.35, 0, env);
    }
    // high shimmer (detuned sines with slow tremolo)
    if (m.shimmer > 0) {
      const n = Math.round(len * SR);
      const s = new Float32Array(n);
      const fs = [mtof(74), mtof(75) * 1.002, mtof(81)];
      const ph = [0, 0, 0];
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        let v = 0;
        for (let j = 0; j < fs.length; j++) {
          ph[j] += fs[j] / SR;
          v += Math.sin(TAU * ph[j]) * (0.5 + 0.5 * Math.sin(TAU * (0.07 + j * 0.03) * t + j));
        }
        s[i] = v * 0.05;
      }
      mus.add(s, a, m.shimmer, 0, env);
    }
  });

  // overall fade-out at the very end
  const fadeOut = 4;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const g = Math.min(1, Math.max(0, (tl.totalSec - t) / fadeOut));
    mus.L[i] *= g;
    mus.R[i] *= g;
  }
  reverb(mus.L, mus.R, 0.22);

  // ------------------------------------------------------------- ambience & SFX
  const lineAt = (id: string) => tl.lines.find((l: any) => l.id === id)!;
  const sceneOf = (id: string) => tl.scenes.find((s: any) => s.id === id)!;
  const windBed = (sc: any, gain: number, seed: number, centre: number) => {
    const a = Math.max(0, sc.start - 1);
    const len = sc.end - sc.start + 2;
    const w = noise(len, seed);
    const sn = smoothNoise(seed, 0.25);
    filtSweep(w, 'bp', (t) => centre * (0.6 + sn(t) * 0.9), 0.8);
    for (let i = 0; i < w.length; i++) {
      const t = i / SR;
      w[i] *= (0.35 + 0.65 * sn(t + 13)) * Math.min(1, t / 1.5) * Math.min(1, (len - t) / 1.5);
    }
    sfx.add(w, a, gain, -0.2);
    const w2 = noise(len, seed + 1);
    filtSweep(w2, 'bp', (t) => centre * 1.3 * (0.6 + sn(t + 5) * 0.9), 0.8);
    for (let i = 0; i < w2.length; i++) {
      const t = i / SR;
      w2[i] *= (0.35 + 0.65 * sn(t + 29)) * Math.min(1, t / 1.5) * Math.min(1, (len - t) / 1.5);
    }
    sfx.add(w2, a, gain, 0.3);
  };
  windBed(sceneOf('hook'), 0.9, 21, 500);
  windBed(sceneOf('change'), 0.35, 22, 420);
  windBed(sceneOf('mystery'), 0.55, 23, 350);
  windBed(sceneOf('conclusion'), 0.35, 24, 650);

  // title impact (single soft low boom)
  const hook = sceneOf('hook');
  {
    const boom = new Float32Array(Math.round(3 * SR));
    let ph = 0;
    const r = mulberry32(5);
    for (let i = 0; i < boom.length; i++) {
      const t = i / SR;
      ph += (40 + 25 * Math.exp(-t * 5)) / SR;
      boom[i] = Math.sin(TAU * ph) * Math.exp(-t * 1.6) * 0.9 + (r() * 2 - 1) * Math.exp(-t * 6) * 0.08;
    }
    filt(boom, biquad('lp', 400));
    sfx.add(boom, hook.end - 4.0, 0.55, 0);
  }
  // whooshes at scene changes
  tl.scenes.slice(1).forEach((sc: any, i: number) => {
    const len = 1.6;
    const w = noise(len, 300 + i);
    filtSweep(w, 'bp', (t) => 300 + 2500 * Math.sin((Math.PI * t) / len), 1.2);
    for (let k = 0; k < w.length; k++) {
      const t = k / SR;
      w[k] *= Math.pow(Math.sin((Math.PI * t) / len), 2);
    }
    sfx.add(w, sc.start - 0.9, 0.35, i % 2 ? 0.4 : -0.4);
  });
  // paper rustle as the map unfolds
  {
    const ctx = sceneOf('context');
    for (let k = 0; k < 6; k++) {
      const len = 0.25 + (k % 3) * 0.1;
      const w = noise(len, 400 + k);
      filt(w, biquad('hp', 2500));
      for (let i = 0; i < w.length; i++) w[i] *= Math.sin((Math.PI * i) / w.length) * (0.6 + 0.4 * Math.sin(i / 90));
      sfx.add(w, ctx.start + 0.2 + k * 0.22, 0.5, (k % 2) * 0.4 - 0.2);
    }
  }
  // flowing water for the drainage shot and the wells
  for (const [id, g] of [['l4', 0.5], ['l5', 0.25]] as [string, number][]) {
    const l = lineAt(id);
    const len = l.end - l.start + 2.5;
    const w = noise(len, 500);
    filt(w, biquad('bp', 1400, 0.7));
    const sn = smoothNoise(501, 9);
    for (let i = 0; i < w.length; i++) {
      const t = i / SR;
      w[i] *= (0.5 + sn(t) * 0.9) * Math.min(1, t / 0.8) * Math.min(1, (len - t) / 1.2);
    }
    sfx.add(w, l.start - 0.6, g, 0.1);
  }
  // footsteps through the city
  {
    const a = lineAt('l5').start - 0.5;
    const b = lineAt('l7').end + 1;
    const r = mulberry32(600);
    for (let t = a; t < b; t += 0.55 + r() * 0.12) {
      const step = noise(0.12, 601 + Math.floor(t * 10));
      filt(step, biquad('lp', 700));
      for (let i = 0; i < step.length; i++) step[i] *= Math.exp((-i / SR) * 40);
      sfx.add(step, t, 0.55, (r() - 0.5) * 0.6);
    }
  }
  // pottery clinks in the market
  {
    const l = lineAt('l6');
    const r = mulberry32(700);
    for (let k = 0; k < 5; k++) {
      const len = 0.6;
      const s = new Float32Array(Math.round(len * SR));
      const f0 = 900 + r() * 500;
      const parts = [1, 2.32, 4.1, 6.3];
      for (let i = 0; i < s.length; i++) {
        const t = i / SR;
        let v = 0;
        parts.forEach((p, j) => (v += Math.sin(TAU * f0 * p * t) * Math.exp(-t * (12 + j * 9)) / (j + 1)));
        s[i] = v * 0.4;
      }
      sfx.add(s, l.start + 0.3 + k * ((l.end - l.start) / 5), 0.22, (r() - 0.5) * 0.8);
    }
  }
  // bullock cart: hoof knocks + wooden creak
  {
    const l = lineAt('l7');
    const r = mulberry32(800);
    for (let t = l.start - 0.3; t < l.end + 0.8; t += 0.42) {
      const s = new Float32Array(Math.round(0.08 * SR));
      const f = 260 + r() * 60;
      for (let i = 0; i < s.length; i++) s[i] = Math.sin((TAU * f * i) / SR) * Math.exp((-i / SR) * 70);
      sfx.add(s, t, 0.25, 0.3);
    }
    const len = l.end - l.start + 1;
    const cr = new Float32Array(Math.round(len * SR));
    let ph = 0;
    for (let i = 0; i < cr.length; i++) {
      const t = i / SR;
      ph += (180 + 40 * Math.sin(TAU * 0.9 * t)) / SR;
      const sawv = (ph % 1) * 2 - 1;
      cr[i] = sawv * Math.pow(Math.max(0, Math.sin(TAU * 0.45 * t)), 8) * 0.25;
    }
    filt(cr, biquad('bp', 900, 3));
    sfx.add(cr, l.start, 0.4, 0.3);
  }
  // stone slide when the seal is revealed
  {
    const l = lineAt('l9');
    const w = noise(1.2, 900);
    filt(w, biquad('lp', 1200));
    for (let i = 0; i < w.length; i++) w[i] *= Math.sin((Math.PI * i) / w.length);
    sfx.add(w, l.start - 0.4, 0.5, 0);
  }
  // crickets at night
  {
    const ms = sceneOf('mystery');
    const r = mulberry32(1000);
    for (let t = ms.start + 0.5; t < ms.end - 0.5; t += 0.9 + r() * 1.8) {
      const len = 0.25;
      const s = new Float32Array(Math.round(len * SR));
      const f = 4300 + r() * 600;
      for (let i = 0; i < s.length; i++) {
        const tt = i / SR;
        s[i] = Math.sin(TAU * f * tt) * Math.max(0, Math.sin(TAU * 32 * tt)) * Math.sin((Math.PI * tt) / len);
      }
      sfx.add(s, t, 0.035, (r() - 0.5) * 1.4);
    }
  }
  // gentle chime with the subscribe reminder
  {
    const l = lineAt('x1');
    const s = new Float32Array(Math.round(2.5 * SR));
    for (let i = 0; i < s.length; i++) {
      const t = i / SR;
      s[i] = (Math.sin(TAU * mtof(86) * t) + 0.5 * Math.sin(TAU * mtof(93) * t)) * Math.exp(-t * 2.2) * 0.3;
    }
    sfx.add(s, l.end + 0.2, 0.35, 0);
  }

  const norm = (b: Bus, peak: number) => {
    let m = 0;
    for (let i = 0; i < b.n; i++) m = Math.max(m, Math.abs(b.L[i]), Math.abs(b.R[i]));
    const g = m > 0 ? peak / m : 1;
    for (let i = 0; i < b.n; i++) (b.L[i] *= g), (b.R[i] *= g);
  };
  norm(mus, 0.85);
  norm(sfx, 0.8);
  writeWav(path.join(P.audioDir, 'music.wav'), [mus.L, mus.R]);
  writeWav(path.join(P.audioDir, 'sfx.wav'), [sfx.L, sfx.R]);
  log(`music.wav + sfx.wav written (${total.toFixed(1)}s)`);
}

if (require.main === module) {
  const t0 = Date.now();
  generateMusic();
  log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
