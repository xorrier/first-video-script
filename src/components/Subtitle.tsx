import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import cues from '../data/subtitles.json';
import { C, FONT_SANS } from '../theme';

type Cue = { start: number; end: number; segs: { t: string; em: boolean }[] };

/** Burned-in Hindi subtitles, synchronised to narration word timings. */
export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cue = (cues as Cue[]).find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  const fadeIn = Math.min(1, (t - cue.start) / 0.12);
  const fadeOut = Math.min(1, (cue.end - t) / 0.12);
  const o = Math.max(0, Math.min(fadeIn, fadeOut));
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 58, pointerEvents: 'none' }}>
      <div
        style={{
          maxWidth: 1500,
          opacity: o,
          background: 'rgba(16,10,6,0.62)',
          borderRadius: 14,
          padding: '8px 30px 14px',
          fontFamily: FONT_SANS,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.5,
          color: C.cream,
          textAlign: 'center',
          textShadow: '0 2px 6px rgba(0,0,0,0.6)',
        }}
      >
        {cue.segs.map((s, i) => (
          <span key={i} style={{ color: s.em ? C.goldLight : undefined }}>
            {s.t}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
