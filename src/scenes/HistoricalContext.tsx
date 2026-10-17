import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { Camera, camAt, Layer } from '../components/Camera';
import { LandMass, MapDefs, Mountains, Rivers, Scatter, SitePin, SUB } from '../components/Map';
import { Parchment } from '../components/Overlay';
import { Dust } from '../components/Particles';
import { Timeline } from '../components/Timeline';
import { Caption, SvgLabel, Tag, TextReveal } from '../components/Text';
import { ArtDefs } from '../components/art/Buildings';
import { Beads, Pot, Seal, SIGNS } from '../components/art/Props';
import { C, FONT_SANS, FONT_SERIF } from '../theme';
import { easeOut, keys, prog, window01 } from '../utils/animation';
import { useLine, useSceneDuration, useSceneFrame } from '../utils/timing';

const ORDER = ['harappa', 'mohenjodaro', 'rakhigarhi', 'dholavira', 'lothal', 'kalibangan'];
const LABEL_POS: Record<string, { dx: number; dy: number; anchor: 'start' | 'end' }> = {
  harappa: { dx: -16, dy: -10, anchor: 'end' },
  mohenjodaro: { dx: -16, dy: 8, anchor: 'end' },
  rakhigarhi: { dx: 16, dy: 8, anchor: 'start' },
  dholavira: { dx: -16, dy: 8, anchor: 'end' },
  lothal: { dx: 16, dy: 12, anchor: 'start' },
  kalibangan: { dx: 6, dy: -16, anchor: 'start' },
};
const RIVER_ORDER = ['indus', 'jhelum', 'chenab', 'ravi', 'beas', 'sutlej', 'ghaggar', 'yamuna', 'ganga', 'narmada'];

export const HistoricalContext: React.FC = () => {
  const f = useSceneFrame();
  const D = useSceneDuration();
  const [c1, c2, c3, c4, c5, c6, c7, c8] = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'].map((id) => useLine(id));
  const mid6 = Math.round((c6.s + c6.e) / 2);

  const cam = camAt(f, [
    [-20, { x: 960, y: 470, z: 0.92 }],
    [c1.e, { x: 930, y: 470, z: 1.0 }],
    [c2.e, { x: 900, y: 500, z: 1.04 }],
    [c3.s + 70, { x: 790, y: 370, z: 1.7 }],
    [c3.e, { x: 810, y: 390, z: 1.62 }],
    [c4.s + 40, { x: 790, y: 420, z: 1.3 }],
    [c5.s + 20, { x: 820, y: 445, z: 1.6 }],
    [c5.e, { x: 820, y: 445, z: 1.66 }],
    [c6.s + 30, { x: 842, y: 320, z: 2.5 }],
    [mid6, { x: 820, y: 340, z: 2.4 }],
    [mid6 + 40, { x: 715, y: 420, z: 2.5 }],
    [c6.e, { x: 720, y: 420, z: 2.4 }],
    [c7.s + 40, { x: 860, y: 450, z: 1.15 }],
    [D + 20, { x: 870, y: 450, z: 1.1 }],
  ]);
  const inv = 1 / cam.z;
  const landDraw = prog(f, -10, 110);
  const landFill = prog(f, 30, 60);
  const riverP = (id: string) => {
    const i = RIVER_ORDER.indexOf(id);
    return prog(f, 50 + (i === 0 ? 0 : 40 + i * 9), id === 'indus' ? 120 : 80);
  };
  const riverLabels = (id: string) => (['indus', 'sutlej', 'ghaggar', 'ravi', 'chenab', 'jhelum', 'beas'].includes(id) ? window01(f, c3.s + 60 + RIVER_ORDER.indexOf(id) * 8, c4.s + 20) : id === 'ganga' || id === 'yamuna' ? window01(f, c3.s + 90, c4.s + 20) * 0.9 : 0);
  const step = Math.max(14, (c5.e - c5.s - 30) / ORDER.length);
  const siteAt = (i: number) => Math.round(c5.s + 4 + i * step);
  const scatterO = keys(f, [[c4.s, 1], [c5.s, 1], [c5.s + 30, 0.35], [c6.e, 0.35], [c7.s + 30, 0.6]]);
  const darkCard = window01(f, c7.s, D + 30, 24, 1);

  return (
    <AbsoluteFill>
      <Parchment />
      <Camera cam={cam} defs={<><MapDefs /><ArtDefs /></>}>
        <Layer depth={1}>
          <LandMass d={SUB.land} draw={landDraw} fill={landFill} />
          <g opacity={prog(f, 60, 40)}>
            <Mountains reveal={prog(f, 60, 90)} />
          </g>
          <Rivers progress={riverP} labels={riverLabels} labelSize={22 * inv * 1.2} scaleW={Math.max(0.55, Math.sqrt(inv) * 1.1)} highlight={f > c3.s && f < c4.s ? 'indus' : undefined} />
          {/* faint present-day names (no borders drawn) */}
          {SUB.labels.map((l, i) => (
            <SvgLabel
              key={i}
              frame={f}
              start={l.kind === 'sea' || l.kind === 'range' ? 70 : c3.s + 100}
              x={l.kind === 'range' ? 1150 : l.xy[0]}
              y={l.kind === 'range' ? 305 : l.xy[1]}
              text={l.text}
              anchor="middle"
              size={(l.kind === 'country' ? 30 : 26) * Math.max(inv, 0.55)}
              color={l.kind === 'sea' ? C.teal : C.brown}
              weight={l.kind === 'country' ? 400 : 600}
              opacity={l.kind === 'country' ? 0.55 : 0.75}
              halo="none"
            />
          ))}
          <Scatter pts={SUB.mature} frame={f} start={c4.s + 10} color={C.brick} r={5 * Math.max(inv, 0.5)} opacity={scatterO} stagger={0.9} />
          {ORDER.map((id, i) => {
            const s = SUB.sites[id];
            const lp = LABEL_POS[id];
            const focus = f > c6.s && f < c6.e ? ((id === 'harappa' && f < mid6 + 20) || (id === 'mohenjodaro' && f >= mid6) ? 1 : 0.4) : 1;
            return (
              <SitePin
                key={id}
                frame={f}
                start={siteAt(i)}
                x={s.xy[0]}
                y={s.xy[1]}
                label={s.name}
                size={9 * inv * 1.3}
                labelSize={28 * inv * 1.25}
                labelDx={lp.dx * inv * 1.3}
                labelDy={lp.dy * inv * 1.3}
                anchor={lp.anchor}
                dim={focus}
                color={C.brickDark}
              />
            );
          })}
        </Layer>
        <Layer depth={0}>
          <Dust frame={f} count={30} color="#8C6A3E" opacity={0.25} size={[1, 2.4]} wind={0.3} seed={11} />
        </Layer>
      </Camera>

      <Caption frame={f} start={c1.s + 10} end={c2.s + 20} title="सिंधु घाटी सभ्यता" sub="हड़प्पा सभ्यता" dark />

      {/* c2: period timeline */}
      {f > c2.s - 10 && f < c3.s + 20 ? (
        <AbsoluteFill style={{ opacity: window01(f, c2.s, c3.s + 10, 16, 18) }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 660, height: 260, background: 'linear-gradient(180deg, rgba(241,228,198,0) 0%, rgba(241,228,198,0.92) 25%, rgba(241,228,198,0.92) 80%, rgba(241,228,198,0) 100%)' }} />
          <Timeline
            frame={f}
            x={420}
            y={790}
            w={1080}
            from={3300}
            to={1300}
            draw={prog(f, c2.s, 50)}
            band={{ a: 2600, b: 1900, label: 'परिपक्व हड़प्पा काल', at: c2.s + 70 }}
            marks={[
              { year: 2600, label: '2600 ई.पू.', at: c2.s + 110, above: false, color: C.brickDark },
              { year: 1900, label: '1900 ई.पू.', at: c2.s + 150, above: false, color: C.brickDark },
            ]}
          />
        </AbsoluteFill>
      ) : null}

      {/* c3 */}
      <Tag frame={f} start={c3.s + 110} end={c4.s} text="नक्शे पर आज की सीमाएँ नहीं दिखाई गई हैं" x={96} y={90} size={22} bg="rgba(74,46,31,0.85)" color={C.cream} />

      {/* c4: 1000+ settlements */}
      {f > c4.s - 5 && f < c5.s + 30 ? (
        <div style={{ position: 'absolute', right: 110, top: 140, textAlign: 'right', opacity: window01(f, c4.s, c5.s + 20, 12, 16) }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 130, color: C.brickDark, lineHeight: 1.1 }}>
            {Math.round(interpolate(prog(f, c4.s + 5, 45, easeOut), [0, 1], [0, 1000]))}
            <span style={{ color: C.gold }}>{prog(f, c4.s + 50, 8) > 0.5 ? '+' : ''}</span>
          </div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 40, fontWeight: 600, color: C.ink }}>बस्तियाँ</div>
        </div>
      ) : null}
      <Tag frame={f} start={c4.s + 20} end={c5.s + 30} text="सांकेतिक चित्रण — बिंदु असली जगहें नहीं" x={96} y={90} size={22} />

      {/* c6: excavation cards */}
      {[
        { at: c6.s + 20, year: '1921', place: 'हड़प्पा', who: 'दयाराम साहनी' },
        { at: mid6 + 10, year: '1922', place: 'मोहनजोदड़ो', who: 'राखालदास बनर्जी' },
      ].map((card, i) => {
        const o = window01(f, card.at, c6.e + 10, 16, 14);
        if (o <= 0) return null;
        const p = prog(f, card.at, 24, easeOut);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              right: 110,
              top: 150 + i * 220,
              width: 470,
              padding: '22px 30px',
              background: 'rgba(43,29,20,0.88)',
              borderLeft: `6px solid ${C.gold}`,
              borderRadius: 8,
              opacity: o,
              transform: `translateX(${(1 - p) * 60}px)`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontFamily: FONT_SERIF, fontSize: 64, color: C.goldLight, lineHeight: 1.1 }}>{card.year}</div>
            <div style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 36, color: C.cream }}>{card.place} की खुदाई</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 26, color: C.sand, marginTop: 4 }}>{card.who}</div>
          </div>
        );
      })}

      {/* c7–c8: undeciphered script, evidence from excavation */}
      {darkCard > 0 ? (
        <AbsoluteFill style={{ background: `rgba(28,18,12,${0.94 * darkCard})` }}>
          <div style={{ position: 'absolute', top: 250, left: 0, right: 0, opacity: darkCard, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${-130 * prog(f, c8.s, 36)}px)` }}>
            <svg width={900} height={170} viewBox="-450 -85 900 170">
              {SIGNS.map((d, i) => {
                const p = prog(f, c7.s + 10 + i * 8, 20, easeOut);
                const fadeOut = 1 - 0.4 * prog(f, c8.s, 30);
                return (
                  <g key={i} transform={`translate(${(i - 2) * 150} 0) scale(2.4)`} opacity={p * fadeOut}>
                    <rect x={-30} y={-30} width={60} height={60} rx={8} fill="rgba(255,246,224,0.06)" stroke="rgba(242,207,122,0.35)" strokeWidth={0.8} />
                    <path d={d} stroke={C.goldLight} strokeWidth={3.2} fill="none" strokeLinecap="round" />
                  </g>
                );
              })}
            </svg>
            <div style={{ height: 16 }} />
            <TextReveal frame={f} start={c7.s + 50} text="लिपि — आज तक *अपठित*" size={62} />
          </div>
          {f > c8.s - 5 ? (
            <div style={{ position: 'absolute', top: 480, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 60 }}>
              {[
                { label: 'मिट्टी के बर्तन', icon: <Pot x={0} y={50} s={1.3} /> },
                { label: 'मुहरें', icon: <Seal x={0} y={0} s={0.2} /> },
                { label: 'ईंटें', icon: <g><rect x={-60} y={-12} width={120} height={30} fill={C.brick} /><rect x={-60} y={-12} width={120} height={30} fill="url(#bricksFine)" /><polygon points="-60,-12 -40,-26 80,-26 60,-12" fill={C.brickLight} /><polygon points="60,-12 80,-26 80,4 60,18" fill={C.brickDark} /></g> },
                { label: 'मनके', icon: <Beads x={0} y={-20} s={0.55} /> },
              ].map((it, i) => {
                const p = prog(f, c8.s + 20 + i * 14, 20, easeOut);
                return (
                  <div key={i} style={{ width: 230, textAlign: 'center', opacity: p * window01(f, c8.s, D + 40, 1, 1), transform: `translateY(${(1 - p) * 20}px)` }}>
                    <svg width={200} height={150} viewBox="-100 -75 200 150">
                      <defs><ArtDefs /></defs>
                      <circle r={70} fill="rgba(255,246,224,0.08)" />
                      {it.icon}
                    </svg>
                    <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 30, color: C.cream, marginTop: 6 }}>{it.label}</div>
                  </div>
                );
              })}
            </div>
          ) : null}
          <div style={{ position: 'absolute', top: 770, left: 0, right: 0, textAlign: 'center', fontFamily: FONT_SERIF, fontSize: 40, color: C.goldLight, opacity: prog(f, c8.s + 70, 20) * window01(f, c8.s, D + 40, 1, 1) }}>
            कहानी जोड़ने के सुराग़ — सिर्फ़ खुदाई से
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
