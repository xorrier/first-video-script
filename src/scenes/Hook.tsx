import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Camera, camAt, Layer } from '../components/Camera';
import { LightRays } from '../components/Overlay';
import { WindStreaks } from '../components/Particles';
import { ArtDefs } from '../components/art/Buildings';
import { CityScape } from '../components/art/CityScape';
import { Tag } from '../components/Text';
import { C, FONT_SANS, FONT_SERIF } from '../theme';
import { easeOut, keys, prog, window01 } from '../utils/animation';
import { useLine, useSceneDuration, useSceneFrame } from '../utils/timing';

export const Hook: React.FC = () => {
  const f = useSceneFrame();
  const D = useSceneDuration();
  const h2 = useLine('h2');
  const h3 = useLine('h3');
  const titleAt = D - 120; // matches title "boom" SFX (hook.end − 4 s)

  // slow, continuous push-in across the empty city, settling for the title
  const cam = camAt(f, [
    [0, { x: 760, y: 600, z: 1.0 }],
    [h3.s, { x: 900, y: 610, z: 1.08 }],
    [titleAt, { x: 1010, y: 600, z: 1.2 }],
    [D + 20, { x: 1040, y: 590, z: 1.24 }],
  ]);
  // memory of the living city: ghostly figures appear with h2 and fade during h3
  const ghost = Math.min(prog(f, h2.s, 40), 1 - prog(f, h3.s + 10, 70)) * 0.75;
  const decay = keys(f, [[0, 0.35], [h3.s, 0.35], [h3.e, 0.62]]);
  const titleIn = prog(f, titleAt, 30, easeOut);
  const titleSub = prog(f, titleAt + 18, 30, easeOut);
  const darken = keys(f, [[titleAt - 30, 0], [titleAt + 20, 0.45]]);

  return (
    <AbsoluteFill style={{ background: '#140c0a' }}>
      <Camera cam={cam} defs={<ArtDefs />}>
        <CityScape frame={f + 200} id="hook" tod="dusk" decay={decay} crowd={ghost > 0.01 ? 0.9 : 0} ghost={Math.max(0.001, ghost)} seed="hk" dust={0.55} />
        <Layer depth={0}>
          <LightRays x={1320} y={640} angle={195} opacity={0.06} count={6} spread={34} length={1700} />
        </Layer>
        <Layer depth={1.2}>
          <WindStreaks frame={f} count={12} opacity={0.2} y0={700} y1={1050} />
        </Layer>
      </Camera>
      <Tag frame={f} start={h2.s + 20} end={h3.s + 40} text="पुनर्निर्माण चित्रण" x={1580} y={60} size={22} />
      <AbsoluteFill style={{ background: `rgba(10,6,4,${darken})` }} />
      {titleIn > 0 ? (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', paddingBottom: 120 }}>
          <div style={{ height: 3, width: 260 * titleIn, background: C.gold, marginBottom: 26, borderRadius: 2 }} />
          <div
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 150,
              color: C.cream,
              opacity: titleIn,
              letterSpacing: 2,
              transform: `scale(${1.06 - 0.06 * titleIn})`,
              textShadow: '0 6px 40px rgba(0,0,0,0.8)',
              lineHeight: 1.25,
            }}
          >
            सिंधु घाटी
          </div>
          <div
            style={{
              fontFamily: FONT_SANS,
              fontWeight: 600,
              fontSize: 52,
              color: C.goldLight,
              opacity: titleSub * window01(f, titleAt, D + 40, 1, 1),
              transform: `translateY(${(1 - titleSub) * 14}px)`,
              textShadow: '0 4px 24px rgba(0,0,0,0.8)',
              marginTop: 6,
            }}
          >
            ख़ामोश शहरों का रहस्य
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
