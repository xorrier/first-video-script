import React from 'react';
import { C, FONT_SANS, FONT_SERIF } from '../theme';
import { clamp, easeOut, prog } from '../utils/animation';

/** BCE year → 0..1 along an axis (older years on the left). */
const pos = (year: number, from: number, to: number) => (from - year) / (from - to);

export type TimelineMark = { year: number; label: string; at: number; above?: boolean; color?: string };

/**
 * Animated horizontal timeline of BCE dates (HTML overlay).
 * `draw` animates the axis; `band` highlights a period; `cursor` moves a marker.
 */
export const Timeline: React.FC<{
  frame: number;
  x: number;
  y: number;
  w: number;
  from: number;
  to: number;
  step?: number;
  draw: number;
  band?: { a: number; b: number; label: string; at: number; color?: string };
  marks?: TimelineMark[];
  cursor?: number;
  dark?: boolean;
  opacity?: number;
  unit?: string;
}> = ({ frame, x, y, w, from, to, step = 500, draw, band, marks = [], cursor, dark = false, opacity = 1, unit = 'ई.पू.' }) => {
  const ink = dark ? C.cream : C.ink;
  const ticks: number[] = [];
  for (let yv = from; yv >= to; yv -= step) ticks.push(yv);
  const bandP = band ? prog(frame, band.at, 30, easeOut) : 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: 140, opacity }}>
      <svg width={w + 40} height={160} style={{ position: 'absolute', left: -20, top: -60, overflow: 'visible' }}>
        <g transform="translate(20 60)">
          <line x1={0} y1={0} x2={w * clamp(draw)} y2={0} stroke={ink} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
          {band && bandP > 0 ? (
            <g>
              <rect x={w * pos(band.a, from, to)} y={-10} width={w * (pos(band.b, from, to) - pos(band.a, from, to)) * bandP} height={20} rx={10} fill={band.color ?? C.gold} opacity={0.9} />
            </g>
          ) : null}
          {ticks.map((t, i) => {
            const px = w * pos(t, from, to);
            const o = clamp((draw * w - px) / 30 + 1);
            return (
              <g key={t} opacity={o}>
                <line x1={px} y1={-8} x2={px} y2={8} stroke={ink} strokeWidth={2} />
              </g>
            );
          })}
          {marks.map((m, i) => {
            const p = prog(frame, m.at, 18, easeOut);
            if (p <= 0) return null;
            const px = w * pos(m.year, from, to);
            return (
              <g key={i} opacity={p}>
                <circle cx={px} cy={0} r={9 * p} fill={m.color ?? C.brick} stroke={C.cream} strokeWidth={2} />
                <line x1={px} y1={m.above ? -12 : 12} x2={px} y2={m.above ? -36 : 36} stroke={m.color ?? C.brick} strokeWidth={2} />
              </g>
            );
          })}
          {cursor !== undefined ? (
            <g transform={`translate(${w * pos(cursor, from, to)} 0)`}>
              <path d="M-11,-30 L11,-30 L0,-14 Z" fill={C.red} />
              <line x1={0} y1={-14} x2={0} y2={12} stroke={C.red} strokeWidth={3} />
            </g>
          ) : null}
        </g>
      </svg>
      {ticks.map((t) => {
        const px = w * pos(t, from, to);
        const o = clamp((draw * w - px) / 30 + 1);
        return (
          <div key={t} style={{ position: 'absolute', left: px - 60, width: 120, top: 18, textAlign: 'center', fontFamily: FONT_SANS, fontSize: 22, color: ink, opacity: o * 0.8 }}>
            {t}
          </div>
        );
      })}
      <div style={{ position: 'absolute', right: -70, top: 18, fontFamily: FONT_SANS, fontSize: 20, color: ink, opacity: clamp(draw * 2 - 1) * 0.7 }}>{unit}</div>
      {band && bandP > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: w * ((pos(band.a, from, to) + pos(band.b, from, to)) / 2) - 300,
            width: 600,
            top: -74,
            textAlign: 'center',
            fontFamily: FONT_SERIF,
            fontSize: 34,
            color: dark ? C.goldLight : C.brickDark,
            opacity: bandP,
            transform: `translateY(${(1 - bandP) * 10}px)`,
          }}
        >
          {band.label}
        </div>
      ) : null}
      {marks.map((m, i) => {
        const p = prog(frame, m.at, 18, easeOut);
        if (p <= 0) return null;
        const px = w * pos(m.year, from, to);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px - 160,
              width: 320,
              top: m.above ? -110 : 64,
              textAlign: 'center',
              fontFamily: FONT_SANS,
              fontWeight: 600,
              fontSize: 26,
              color: ink,
              opacity: p,
            }}
          >
            {m.label}
          </div>
        );
      })}
    </div>
  );
};
