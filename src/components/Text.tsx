import React from 'react';
import { interpolate } from 'remotion';
import { C, FONT_SANS, FONT_SERIF } from '../theme';
import { easeOut, prog, window01 } from '../utils/animation';

/** Word-by-word reveal (splits on spaces so Devanagari conjuncts are never broken). */
export const TextReveal: React.FC<{
  text: string;
  frame: number;
  start: number;
  end?: number;
  stagger?: number;
  size?: number;
  font?: 'serif' | 'sans';
  color?: string;
  weight?: number;
  style?: React.CSSProperties;
  align?: 'left' | 'center';
}> = ({ text, frame, start, end = 1e9, stagger = 4, size = 64, font = 'serif', color = C.cream, weight = 400, style, align = 'center' }) => {
  const words = text.split(' ');
  const out = 1 - prog(frame, end - 12, 12);
  return (
    <div
      style={{
        fontFamily: font === 'serif' ? FONT_SERIF : FONT_SANS,
        fontSize: size,
        color,
        fontWeight: weight,
        lineHeight: 1.45,
        textAlign: align,
        opacity: out,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = prog(frame, start + i * stagger, 16, easeOut);
        const gold = w.startsWith('*');
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${(1 - p) * 18}px)`,
              marginRight: '0.28em',
              color: gold ? C.goldLight : undefined,
            }}
          >
            {w.replace(/\*/g, '')}
          </span>
        );
      })}
    </div>
  );
};

/** Documentary caption: thin gold rule that draws in, then title + optional subtitle. */
export const Caption: React.FC<{
  frame: number;
  start: number;
  end: number;
  title: string;
  sub?: string;
  x?: number;
  y?: number;
  align?: 'left' | 'right';
  dark?: boolean;
}> = ({ frame, start, end, title, sub, x = 96, y = 92, align = 'left', dark = false }) => {
  const o = window01(frame, start, end, 12, 14);
  if (o <= 0) return null;
  const line = prog(frame, start, 22, easeOut);
  const t = prog(frame, start + 6, 18, easeOut);
  const s = prog(frame, start + 12, 18, easeOut);
  const col = dark ? C.ink : C.cream;
  return (
    <div style={{ position: 'absolute', left: align === 'left' ? x : undefined, right: align === 'right' ? x : undefined, top: y, opacity: o, textAlign: align }}>
      <div style={{ height: 3, width: 120 * line, background: C.gold, marginLeft: align === 'right' ? 'auto' : 0, marginBottom: 14, borderRadius: 2 }} />
      <div
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 50,
          color: col,
          opacity: t,
          transform: `translateY(${(1 - t) * 10}px)`,
          textShadow: dark ? 'none' : '0 2px 14px rgba(0,0,0,0.65)',
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 28,
            color: dark ? C.brown : C.goldLight,
            opacity: s,
            marginTop: 4,
            textShadow: dark ? 'none' : '0 2px 10px rgba(0,0,0,0.6)',
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};

/** Small pill tag, e.g. "सांकेतिक चित्रण" (schematic) or "बहस जारी" (debated). */
export const Tag: React.FC<{ frame: number; start: number; end: number; text: string; x: number; y: number; color?: string; bg?: string; size?: number }> = ({
  frame, start, end, text, x, y, color = C.ink, bg = 'rgba(242,207,122,0.92)', size = 24,
}) => {
  const o = window01(frame, start, end, 10, 10);
  if (o <= 0) return null;
  const sc = interpolate(prog(frame, start, 14, easeOut), [0, 1], [0.85, 1]);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${sc})`,
        transformOrigin: 'left center',
        opacity: o,
        background: bg,
        color,
        fontFamily: FONT_SANS,
        fontWeight: 600,
        fontSize: size,
        padding: '6px 18px 8px',
        borderRadius: 999,
        boxShadow: '0 4px 18px rgba(0,0,0,0.25)',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

/** SVG text label that fades/slides in (for maps and diagrams). */
export const SvgLabel: React.FC<{
  frame: number;
  start: number;
  end?: number;
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  serif?: boolean;
  weight?: number;
  halo?: string;
  opacity?: number;
}> = ({ frame, start, end = 1e9, x, y, text, size = 28, color = C.ink, anchor = 'start', serif = false, weight = 600, halo = 'rgba(241,228,198,0.85)', opacity = 1 }) => {
  const o = window01(frame, start, end, 12, 12) * opacity;
  if (o <= 0) return null;
  const dy = (1 - prog(frame, start, 14, easeOut)) * 8;
  return (
    <text
      x={x}
      y={y + dy}
      fontFamily={serif ? FONT_SERIF : FONT_SANS}
      fontSize={size}
      fontWeight={weight}
      fill={color}
      textAnchor={anchor}
      opacity={o}
      stroke={halo}
      strokeWidth={halo === 'none' ? 0 : size * 0.18}
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {text}
    </text>
  );
};
