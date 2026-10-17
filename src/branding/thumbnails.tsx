import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Camera, Layer } from '../components/Camera';
import { LightRays } from '../components/Overlay';
import { ArtDefs } from '../components/art/Buildings';
import { CityScape } from '../components/art/CityScape';
import { Pot, Seal } from '../components/art/Props';
import { ThumbSpec } from './Thumbnail';

/**
 * Per-video thumbnail definitions. To make a new thumbnail: add an entry here
 * (art = any 1920×1080 SVG scene, subject on the right) and run `npm run branding -- <id>`.
 */
export type ThumbDef = ThumbSpec & { id: string; file: string; Art: React.FC };

/** Ep01 – abandoned Harappan street at dusk, citadel + low sun on the right, faint "memory" figures. */
const IndusDuskArt: React.FC<{ variant?: 'main' | 'alt' }> = ({ variant = 'main' }) => {
  const sun: [number, number] = variant === 'main' ? [1500, 470] : [1430, 520];
  return (
    <AbsoluteFill>
      <Camera cam={variant === 'main' ? { x: 820, y: 600, z: 1.18 } : { x: 760, y: 640, z: 1.3 }} defs={<ArtDefs />}>
        <CityScape frame={variant === 'main' ? 150 : 240} id={`th-${variant}`} tod="dusk" decay={0.55} crowd={variant === 'main' ? 0.45 : 0} ghost={0.85} seed="th" dust={0.8} sun={sun} birds={false} />
        <Layer depth={0}>
          <LightRays x={sun[0]} y={sun[1]} angle={200} opacity={0.09} count={7} spread={40} length={1700} />
        </Layer>
        {variant === 'alt' ? (
          <Layer depth={1.3}>
            <Pot x={1060} y={990} s={2.6} broken />
          </Layer>
        ) : null}
      </Camera>
    </AbsoluteFill>
  );
};

/** Template example – an Indus seal close-up on a dark ground. */
const ScriptSealArt: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 70% at 72% 50%, #4A2A1A 0%, #1A110C 70%)' }}>
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <ArtDefs />
      </defs>
      <LightRays x={1900} y={-80} angle={128} opacity={0.08} count={6} spread={30} length={1600} />
      <g transform="rotate(-6 1390 560)">
        <Seal x={1390} y={560} s={1.45} light={0.8} />
      </g>
    </svg>
  </AbsoluteFill>
);

export const THUMBS: ThumbDef[] = [
  {
    id: 'ThumbEp01',
    file: 'thumbnails/ep01_indus_valley_thumbnail.jpg',
    kicker: 'सिंधु घाटी सभ्यता',
    lines: [{ text: 'सभ्यता का' }, { text: 'अंत कैसे?', hl: true }],
    Art: () => <IndusDuskArt variant="main" />,
  },
  {
    id: 'ThumbEp01Alt',
    file: 'thumbnails/ep01_indus_valley_thumbnail_alt.jpg',
    kicker: 'सिंधु घाटी सभ्यता',
    lines: [{ text: 'शहर ख़ाली' }, { text: 'क्यों हुए?', hl: true }],
    Art: () => <IndusDuskArt variant="alt" />,
  },
  {
    id: 'ThumbExampleScript',
    file: 'thumbnails/template_example_indus_script.jpg',
    kicker: 'सिंधु लिपि',
    lines: [{ text: 'ये लिपि' }, { text: 'आज तक रहस्य', hl: true }],
    Art: ScriptSealArt,
  },
];
