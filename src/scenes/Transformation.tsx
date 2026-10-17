import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Camera, camAt, Layer } from '../components/Camera';
import { DrawPath, LandMass, MapDefs, MonsoonArrow, Mountains, Rivers, Scatter, SitePin, SUB } from '../components/Map';
import { Parchment } from '../components/Overlay';
import { Dust } from '../components/Particles';
import { Shot } from '../components/Shot';
import { Caption, SvgLabel, Tag, TextReveal } from '../components/Text';
import { ArtDefs } from '../components/art/Buildings';
import { CityScape } from '../components/art/CityScape';
import { C, FONT_SANS, FONT_SERIF } from '../theme';
import { easeOut, keys, mix, prog, smoothPath, window01 } from '../utils/animation';
import { useLine, useSceneDuration, useSceneFrame } from '../utils/timing';

type Pt = [number, number];

export const Transformation: React.FC = () => {
  const f = useSceneFrame();
  const D = useSceneDuration();
  const [t1, t2, t3, t4, t5, t6, t7] = ['t1', 't2', 't3', 't4', 't5', 't6', 't7'].map((id) => useLine(id));
  return (
    <AbsoluteFill style={{ background: '#1a120c' }}>
      <Shot f={f} from={-30} to={t4.s + 20} fadeIn={0}>
        {() => <SplitShot f={f} t1={t1} t2={t2} t3={t3} />}
      </Shot>
      <Shot f={f} from={t4.s - 12} to={D + 30} fadeIn={24}>
        {() => <ChangeMap f={f} t4={t4} t5={t5} t6={t6} t7={t7} />}
      </Shot>
    </AbsoluteFill>
  );
};

type L = { s: number; e: number };

/* ------------------------------------------------------------------ */

const CALLOUTS = ['आबादी घटी', 'घर छोटे होने लगे', 'पुरानी ईंटें दोबारा लगाई गईं', 'नालियों की देखभाल कम हुई'];

const SplitShot: React.FC<{ f: number; t1: L; t2: L; t3: L }> = ({ f, t1, t2, t3 }) => {
  // divider slides in, then gives the "later" side more room while t2 lists the changes
  const split = keys(f, [[t1.s, 100], [t1.s + 40, 50], [t2.s + 10, 50], [t2.s + 50, 38]], easeOut);
  const decay = keys(f, [[t2.s, 0.4], [t2.e, 0.62]]);
  const crowdR = keys(f, [[t2.s, 0.35], [t2.s + 80, 0.15]]);
  const camL = camAt(f, [[-30, { x: 1080, y: 560, z: 1.08 }], [t3.e, { x: 980, y: 560, z: 1.14 }]]);
  const camR = camAt(f, [[-30, { x: 860, y: 560, z: 1.08 }], [t2.s + 50, { x: 900, y: 560, z: 1.1 }], [t3.e, { x: 960, y: 570, z: 1.16 }]]);
  const gen = window01(f, t3.s - 5, t3.e + 40, 20, 1);
  const pill = (text: string, x: number, o: number, dark: boolean) => (
    <div style={{ position: 'absolute', left: x, top: 70, opacity: o, padding: '10px 26px', borderRadius: 40, background: dark ? 'rgba(30,24,22,0.78)' : 'rgba(241,228,198,0.9)', color: dark ? C.cream : C.ink, fontFamily: FONT_SERIF, fontSize: 40, whiteSpace: 'nowrap' }}>
      {text}
    </div>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
        <Camera cam={camL} defs={<ArtDefs />}>
          <CityScape frame={f + 200} id="chgL" tod="day" crowd={0.85} seed="tl" dust={0.2} foreground={false} />
        </Camera>
      </AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
        <Camera cam={camR} defs={<ArtDefs />}>
          <CityScape frame={f + 200} id="chgR" tod="overcast" decay={decay} crowd={crowdR} seed="tr" dust={0.6} birds={false} foreground={false} />
        </Camera>
      </AbsoluteFill>
      {split < 99.5 ? <div style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(${split}% - 3px)`, width: 6, background: C.goldLight, boxShadow: '0 0 18px rgba(0,0,0,0.5)' }} /> : null}
      {pill('लगभग 2500 ईसा पूर्व', 70, prog(f, t1.s + 30, 20) * (1 - gen), false)}
      <div style={{ position: 'absolute', left: `calc(${split}% + 60px)`, top: 0 }}>{pill('लगभग 1800 ईसा पूर्व', 0, prog(f, t1.s + 50, 20) * (1 - gen), true)}</div>

      {/* t2 callouts on the later side */}
      <div style={{ position: 'absolute', right: 90, top: 190, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-end' }}>
        {CALLOUTS.map((c, i) => {
          const at = t2.s + 40 + i * Math.round((t2.e - t2.s - 60) / CALLOUTS.length);
          const p = prog(f, at, 18, easeOut) * window01(f, t2.s, t3.s + 10, 1, 18);
          return (
            <div key={i} style={{ opacity: p, transform: `translateX(${(1 - p) * 40}px)`, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 26px', background: 'rgba(28,20,16,0.82)', borderRadius: 10, borderLeft: `5px solid ${C.terracotta}` }}>
              <span style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 36, color: C.cream }}>{c}</span>
            </div>
          );
        })}
      </div>

      {/* t3 generations strip */}
      {gen > 0 ? <Generations f={f} start={t3.s} o={gen} /> : null}
    </AbsoluteFill>
  );
};

const Generations: React.FC<{ f: number; start: number; o: number }> = ({ f, start, o }) => {
  const n = 9;
  const w = 1400;
  const x0 = (1920 - w) / 2;
  const arrow = prog(f, start + 10, 80);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 470, background: 'linear-gradient(180deg, rgba(28,20,16,0.92) 0%, rgba(28,20,16,0.85) 75%, rgba(28,20,16,0) 100%)' }} />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: n }, (_, i) => {
          const x = x0 + (i + 0.5) * (w / n);
          const p = prog(f, start + 10 + i * 9, 16, easeOut);
          const col = mix(C.terracotta, '#8A8580', i / (n - 1));
          const s = 1 - (i / (n - 1)) * 0.25;
          return (
            <g key={i} transform={`translate(${x} ${300 - (1 - p) * 20}) scale(${s})`} opacity={p}>
              <circle cx={0} cy={-118} r={17} fill={col} />
              <path d="M-26,-92 Q0,-100 26,-92 L22,-20 L-22,-20 Z" fill={col} />
              <rect x={-18} y={-22} width={14} height={60} rx={6} fill={col} />
              <rect x={4} y={-22} width={14} height={60} rx={6} fill={col} />
            </g>
          );
        })}
        <DrawPath d={`M${x0 + 40},360 L${x0 + w - 40},360`} p={arrow} stroke={C.goldLight} width={4} />
        {arrow >= 1 ? <path d={`M${x0 + w - 20},360 l-26,-14 l0,28 z`} fill={C.goldLight} /> : null}
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 90, textAlign: 'center' }}>
        <TextReveal frame={f} start={start + 40} text="बदलाव अचानक नहीं — *कई पीढ़ियों* में" size={54} />
      </div>
      <div style={{ position: 'absolute', left: x0, top: 382, fontFamily: FONT_SANS, fontSize: 28, color: C.sand, opacity: prog(f, start + 60, 20) }}>पहले</div>
      <div style={{ position: 'absolute', right: x0, top: 382, fontFamily: FONT_SANS, fontSize: 28, color: C.sand, opacity: prog(f, start + 70, 20) }}>सैकड़ों साल बाद</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

const EAST: Pt[] = [[850, 372], [900, 352], [955, 340], [1005, 336]];
const SOUTH: Pt[] = [[770, 455], [785, 500], [800, 538], [812, 566]];
const CITIES = ['harappa', 'mohenjodaro', 'rakhigarhi', 'dholavira', 'lothal'];
const CITY_LABEL: Record<string, { dx: number; dy: number; anchor: 'start' | 'end' }> = {
  harappa: { dx: -14, dy: -8, anchor: 'end' },
  mohenjodaro: { dx: -14, dy: 8, anchor: 'end' },
  rakhigarhi: { dx: 14, dy: 22, anchor: 'start' },
  dholavira: { dx: -14, dy: 8, anchor: 'end' },
  lothal: { dx: -14, dy: 22, anchor: 'end' },
};

const MoveArrow: React.FC<{ pts: Pt[]; p: number; w: number; id: string }> = ({ pts, p, w, id }) => {
  const n = pts.length;
  const a = (Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]) * 180) / Math.PI;
  return (
    <g>
      <DrawPath d={smoothPath(pts)} p={p} stroke={C.gold} width={w} dash={`${w * 2.2} ${w * 1.4}`} id={id} />
      {p >= 1 ? <path d={`M${w * 2.4},0 L${-w * 1.6},${-w * 2} L${-w * 0.6},0 L${-w * 1.6},${w * 2} Z`} transform={`translate(${pts[n - 1][0]} ${pts[n - 1][1]}) rotate(${a})`} fill={C.gold} /> : null}
    </g>
  );
};

const ChangeMap: React.FC<{ f: number; t4: L; t5: L; t6: L; t7: L }> = ({ f, t4, t5, t6, t7 }) => {
  const cam = camAt(f, [
    [t4.s - 12, { x: 1120, y: 560, z: 0.9 }],
    [t4.e, { x: 1140, y: 560, z: 0.95 }],
    [t5.s + 50, { x: 855, y: 410, z: 2.1 }],
    [t5.e, { x: 850, y: 405, z: 2.2 }],
    [t6.s + 50, { x: 890, y: 450, z: 1.5 }],
    [t7.s + 20, { x: 880, y: 445, z: 1.55 }],
    [t7.e + 60, { x: 880, y: 450, z: 1.62 }],
  ]);
  const inv = 1 / cam.z;
  const monsoonDraw = prog(f, t4.s, 50);
  const strength = keys(f, [[t4.s + 70, 1], [t4.s + 170, 0.28]]);
  const monsoonO = window01(f, t4.s - 10, t5.s + 30, 10, 30);
  const ghaggarFade = keys(f, [[t5.s + 70, 1], [t5.s + 210, 0.3]]);
  const riverFade = (id: string) => (id === 'ghaggar' ? ghaggarFade : 1);
  const riverLabel = (id: string) => (['ghaggar', 'sutlej', 'yamuna'].includes(id) ? window01(f, t5.s + 40, t5.e + 10, 20, 20) * (id === 'ghaggar' ? 1 : 0.7) : 0);
  const matureO = keys(f, [[t4.s, 0.85], [t6.s + 20, 0.85], [t6.s + 110, 0.18]]);
  const lateStart = t6.s + 60;
  const glow = prog(f, t7.s + 30, 40);
  const cityDim = keys(f, [[t7.s + 20, 1], [t7.s + 70, 0.35]]);
  return (
    <AbsoluteFill>
      <Parchment />
      <Camera cam={cam} defs={<MapDefs />}>
        <Layer depth={1}>
          <LandMass d={SUB.land} draw={1} fill={1} />
          <Mountains reveal={1} />
          <Rivers progress={() => 1} fade={riverFade} labels={riverLabel} labelSize={24 * inv * 1.2} scaleW={Math.max(0.55, Math.sqrt(inv) * 1.1)} highlight={f > t5.s && f < t5.e ? 'ghaggar' : undefined} />
          {SUB.labels
            .filter((l) => l.kind === 'sea')
            .map((l, i) => (
              <SvgLabel key={i} frame={f} start={-100} x={l.xy[0]} y={l.xy[1]} text={l.text} anchor="middle" size={26 * Math.max(inv, 0.55)} color={C.teal} weight={600} opacity={0.75 * window01(f, -100, t5.s + 20, 1, 20)} halo="none" />
            ))}
          {/* t4 monsoon */}
          <g opacity={monsoonO}>
            <MonsoonArrow pts={SUB.monsoon.arabian} frame={f} draw={monsoonDraw} strength={strength} />
            <MonsoonArrow pts={SUB.monsoon.bengal} frame={f} draw={monsoonDraw} strength={strength} />
            <SvgLabel frame={f} start={t4.s + 30} x={470} y={985} text="मानसून" anchor="middle" size={34} color={C.teal} weight={700} opacity={0.4 + 0.6 * strength} />
          </g>
          {/* settlements */}
          <Scatter pts={SUB.mature} frame={f} start={t4.s - 10} color={C.brick} r={5 * Math.max(inv, 0.5)} opacity={matureO} stagger={0.3} />
          <g>
            {glow > 0
              ? SUB.late.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={14 * Math.max(inv, 0.5) * glow} fill="url(#pinGlow)" opacity={0.9} />)
              : null}
            <Scatter pts={SUB.late} frame={f} start={lateStart} color={C.gold} r={5 * Math.max(inv, 0.5)} stagger={0.9} />
          </g>
          {/* t6 movement */}
          <MoveArrow pts={EAST} p={prog(f, t6.s + 40, 50)} w={5 * inv * 1.3} id="mvE" />
          <MoveArrow pts={SOUTH} p={prog(f, t6.s + 80, 50)} w={5 * inv * 1.3} id="mvS" />
          <SvgLabel frame={f} start={t6.s + 90} x={1010} y={300} text="गंगा-यमुना मैदान" anchor="middle" size={26 * inv * 1.3} color={C.brickDark} weight={700} />
          <SvgLabel frame={f} start={t6.s + 130} x={790} y={620} text="गुजरात" anchor="middle" size={26 * inv * 1.3} color={C.brickDark} weight={700} />
          {/* t7 cities dim */}
          {CITIES.map((id, i) => {
            const s = SUB.sites[id];
            const lp = CITY_LABEL[id];
            return (
              <SitePin
                key={id}
                frame={f}
                start={t6.e - 50 + i * 6}
                x={s.xy[0]}
                y={s.xy[1]}
                label={s.name}
                size={8 * inv * 1.3}
                labelSize={22 * inv * 1.3}
                labelDx={lp.dx * inv * 1.3}
                labelDy={lp.dy * inv * 1.3}
                anchor={lp.anchor}
                dim={cityDim}
                color={mix('#7D746C', C.brickDark, (cityDim - 0.35) / 0.65)}
              />
            );
          })}
        </Layer>
        <Layer depth={0}>
          <Dust frame={f} count={30} color="#8C6A3E" opacity={0.25} size={[1, 2.4]} wind={0.3} seed={12} />
        </Layer>
      </Camera>

      {/* t4 inset: schematic rainfall + evidence */}
      <RainCard f={f} t4={t4} o={window01(f, t4.s + 20, t4.e + 10, 18, 18)} />
      <Tag frame={f} start={t4.s + 40} end={t4.e + 10} text="सांकेतिक चित्रण" x={96} y={60} size={22} />

      {/* t5 */}
      <Caption frame={f} start={t5.s + 40} end={t5.e} title="घग्गर-हकरा" sub="पानी का बहाव घटा" dark />
      <Tag frame={f} start={t5.s + 110} end={t5.e} text="कब और कितना — इस पर बहस जारी है" x={96} y={250} size={24} bg="rgba(74,46,31,0.88)" color={C.cream} />

      {/* t6 */}
      <Tag frame={f} start={t6.s + 60} end={t7.s} text="सांकेतिक चित्रण — बिंदु असली जगहें नहीं" x={96} y={60} size={22} />
      <Legend f={f} start={t6.s + 70} end={D_END} />

      {/* t7 */}
      {f > t7.s ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', opacity: window01(f, t7.s + 10, 1e9, 18, 1) }}>
          <div style={{ display: 'inline-block', padding: '14px 44px', background: 'rgba(28,20,16,0.82)', borderRadius: 14 }}>
            <TextReveal frame={f} start={t7.s + 20} text="शहर उजड़े… *लोग नहीं*" size={64} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const D_END = 1e9;

const Legend: React.FC<{ f: number; start: number; end: number }> = ({ f, start, end }) => {
  const o = window01(f, start, end, 18, 1);
  if (o <= 0) return null;
  const row = (color: string, text: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ width: 18, height: 18, borderRadius: 9, background: color, border: `2px solid ${C.cream}` }} />
      <span style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 26, color: C.ink }}>{text}</span>
    </div>
  );
  return (
    <div style={{ position: 'absolute', right: 90, top: 640, padding: '18px 26px', background: 'rgba(241,228,198,0.92)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10, opacity: o, boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>
      {row(C.brick, 'शहरी दौर की बस्तियाँ')}
      {row(C.gold, 'बाद की छोटी बस्तियाँ')}
    </div>
  );
};

const RainCard: React.FC<{ f: number; t4: L; o: number }> = ({ f, t4, o }) => {
  if (o <= 0) return null;
  const W = 600, H = 250;
  const pts: Pt[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = (i / 60) * W;
    const base = x < W * 0.55 ? 70 : 70 + Math.min(1, (x - W * 0.55) / (W * 0.12)) * 95;
    const wob = Math.sin(i * 1.7) * 9 + Math.sin(i * 0.63 + 1) * 7;
    pts.push([x, base + wob]);
  }
  const line = prog(f, t4.s + 30, 90);
  const mark = prog(f, t4.s + 110, 20);
  const ev = (i: number) => prog(f, t4.s + 150 + i * 30, 20, easeOut);
  return (
    <div style={{ position: 'absolute', right: 80, top: 110, width: W + 80, padding: '26px 40px 30px', background: 'rgba(241,228,198,0.94)', borderRadius: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.18)', opacity: o }}>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 40, color: C.ink, marginBottom: 6 }}>मानसून की बारिश</div>
      <svg width={W} height={H + 40} viewBox={`0 -10 ${W} ${H + 40}`}>
        <line x1={0} y1={H} x2={W} y2={H} stroke={C.brown} strokeWidth={2} />
        <line x1={0} y1={0} x2={0} y2={H} stroke={C.brown} strokeWidth={2} />
        <DrawPath d={smoothPath(pts)} p={line} stroke={C.teal} width={5} />
        <g opacity={mark}>
          <line x1={W * 0.58} y1={0} x2={W * 0.58} y2={H} stroke={C.brickDark} strokeWidth={3} strokeDasharray="8 7" />
          <text x={W * 0.58 + 12} y={24} fontFamily={FONT_SANS} fontWeight={700} fontSize={26} fill={C.brickDark}>≈ 4200 साल पहले</text>
        </g>
        <text x={6} y={H + 30} fontFamily={FONT_SANS} fontSize={22} fill={C.brown}>पहले</text>
        <text x={W - 6} y={H + 30} textAnchor="end" fontFamily={FONT_SANS} fontSize={22} fill={C.brown}>बाद में</text>
        <text x={W * 0.25} y={44} textAnchor="middle" fontFamily={FONT_SANS} fontSize={24} fill={C.teal}>ज़्यादा</text>
        <text x={W * 0.86} y={H - 40} textAnchor="middle" fontFamily={FONT_SANS} fontSize={24} fill={C.teal} opacity={line >= 1 ? 1 : 0}>कम</text>
      </svg>
      <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
        {[
          {
            label: 'झीलों की तलछट',
            icon: (
              <g>
                {[C.sand, C.brown, C.sandDark, '#8C6A3E', C.parchmentDark, C.brown].map((c, i) => (
                  <rect key={i} x={-34} y={-30 + i * 10} width={68} height={10} fill={c} />
                ))}
                <rect x={-34} y={-30} width={68} height={60} fill="none" stroke={C.ink} strokeWidth={2} />
              </g>
            ),
          },
          {
            label: 'गुफाओं के पत्थर',
            icon: (
              <g>
                <path d="M-18,32 L-10,-24 Q0,-36 10,-24 L18,32 Z" fill={C.sandDark} stroke={C.ink} strokeWidth={2} />
                {[-12, 0, 12, 24].map((y, i) => (
                  <path key={i} d={`M${-12 - i * 1.5},${y} Q0,${y - 6} ${12 + i * 1.5},${y}`} stroke={C.brown} strokeWidth={1.6} fill="none" />
                ))}
              </g>
            ),
          },
        ].map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: ev(i), transform: `translateY(${(1 - ev(i)) * 14}px)`, padding: '8px 18px 8px 8px', background: 'rgba(74,46,31,0.08)', borderRadius: 10 }}>
            <svg width={80} height={80} viewBox="-40 -40 80 80">{it.icon}</svg>
            <span style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 28, color: C.ink }}>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
