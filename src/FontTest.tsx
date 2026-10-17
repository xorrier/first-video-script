import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, FONT_SANS, FONT_SERIF } from './theme';

/** Glyph-coverage check for the Devanagari fonts (rendered by the pipeline before the main render). */
export const SAMPLE = 'क्षत्रिय ज्ञान श्रृंखला द्वार हड़प्पा मोहनजोदड़ो राखीगढ़ी धोलावीरा ख़ामोश ग़ायब ज़्यादा फ़ैसला ईसा पूर्व ऋतु ॐ ।॥ 2600–1900 ई.पू. 4:2:1';

export const FontTest: React.FC = () => (
  <AbsoluteFill style={{ background: C.parchment, padding: 80, gap: 30, display: 'flex', flexDirection: 'column' }}>
    {[
      { f: FONT_SANS, w: 400, label: 'Noto Sans Devanagari 400' },
      { f: FONT_SANS, w: 600, label: 'Noto Sans Devanagari 600' },
      { f: FONT_SANS, w: 700, label: 'Noto Sans Devanagari 700' },
      { f: FONT_SERIF, w: 400, label: 'Tiro Devanagari Hindi 400' },
    ].map((r) => (
      <div key={r.label}>
        <div style={{ fontFamily: 'monospace', fontSize: 22, color: C.brown }}>{r.label}</div>
        <div style={{ fontFamily: r.f, fontWeight: r.w, fontSize: 52, color: C.ink, lineHeight: 1.5 }}>{SAMPLE}</div>
      </div>
    ))}
  </AbsoluteFill>
);
