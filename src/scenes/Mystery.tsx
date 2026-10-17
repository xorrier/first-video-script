import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Camera, camAt, Layer } from '../components/Camera';
import { LandMass, MapDefs, Rivers, SUB } from '../components/Map';
import { Parchment } from '../components/Overlay';
import { Dust, WindStreaks } from '../components/Particles';
import { Shot } from '../components/Shot';
import { SvgLabel, Tag, TextReveal } from '../components/Text';
import { ArtDefs } from '../components/art/Buildings';
import { CityScape } from '../components/art/CityScape';
import { SIGNS } from '../components/art/Props';
import { C, FONT_SANS, FONT_SERIF } from '../theme';
import { easeOut, keys, prog, rnd, window01 } from '../utils/animation';
import { useLine, useSceneDuration, useSceneFrame } from '../utils/timing';

type L = { s: number; e: number };

export const Mystery: React.FC = () => {
  const f = useSceneFrame();
  const D = useSceneDuration();
  const [m1, m2, m3, m4, m5, m6, m7, m8, m9] = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9'].map((id) => useLine(id));
  return (
    <AbsoluteFill style={{ background: '#120c09' }}>
      <Shot f={f} from={-30} to={m2.s + 20} fadeIn={0}>
        {() => <NightRuins f={f} m1={m1} />}
      </Shot>
      <Shot f={f} from={m2.s - 4} to={m5.s + 16} fadeIn={22}>
        {() => <TheoryShot f={f} m2={m2} m3={m3} m4={m4} />}
      </Shot>
      <Shot f={f} from={m5.s - 6} to={m7.s + 16} fadeIn={20}>
        {() => <EvidenceBoard f={f} m5={m5} m6={m6} />}
      </Shot>
      <Shot f={f} from={m7.s - 6} to={m9.s + 16} fadeIn={22}>
        {() => <DnaShot f={f} m7={m7} m8={m8} />}
      </Shot>
      <Shot f={f} from={m9.s - 6} to={D + 30} fadeIn={22}>
        {() => <ScriptShot f={f} m9={m9} />}
      </Shot>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

const NightRuins: React.FC<{ f: number; m1: L }> = ({ f, m1 }) => {
  const cam = camAt(f, [
    [-30, { x: 960, y: 560, z: 1.0 }],
    [m1.e + 60, { x: 1010, y: 600, z: 1.12 }],
  ]);
  return (
    <AbsoluteFill>
      <Camera cam={cam} defs={<ArtDefs />}>
        <CityScape frame={f} id="mystN" tod="night" decay={0.85} crowd={0} seed="mn" dust={0.5} birds={false} />
      </Camera>
      <WindStreaks frame={f} count={10} opacity={0.12} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', opacity: window01(f, m1.s - 4, m1.e + 50, 14, 20) }}>
        <TextReveal frame={f} start={m1.s} text="असली *वजह* क्या थी?" size={92} font="serif" />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

const Skeleton: React.FC<{ x: number; y: number; s?: number; rot?: number; o?: number }> = ({ x, y, s = 1, rot = 0, o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} stroke="#EDE3CF" strokeWidth={3} fill="none" strokeLinecap="round">
    <circle cx={-48} cy={0} r={9} fill="#EDE3CF" stroke="none" />
    <path d="M-38,0 L22,0" />
    {[-28, -18, -8].map((rx) => <path key={rx} d={`M${rx},-9 Q${rx + 4},0 ${rx},9`} />)}
    <path d="M-30,0 L-20,-14 L-4,-18 M-30,0 L-20,14 L-4,18" />
    <path d="M22,0 L46,-8 L64,-6 M22,0 L46,8 L64,6" />
  </g>
);

const TheoryShot: React.FC<{ f: number; m2: L; m3: L; m4: L }> = ({ f, m2, m3, m4 }) => {
  const shift = prog(f, m4.s - 10, 40, easeOut); // card slides left for the section
  const sectP = prog(f, m4.s + 10, 30, easeOut);
  const stamp = prog(f, m4.s + 150, 10, easeOut);
  const wheel = prog(f, m3.s + 10, 24, easeOut);
  const bands = ['#7A5A3C', '#8E6B47', '#6F4F35', '#9C7A53', '#7F5E3F', '#64462F'];
  const ages = ['बाद का समय', '', 'बीच का समय', '', 'पहले का समय', ''];
  const skel = [
    { band: 0, x: 130, rot: 8 },
    { band: 2, x: 420, rot: -6 },
    { band: 4, x: 230, rot: 3 },
    { band: 1, x: 560, rot: -12 },
  ];
  return (
    <AbsoluteFill>
      <Parchment dark={0.55} tint="#BFA67F" />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 0%, rgba(20,12,8,0.6) 100%)' }} />
      {/* theory card */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 380 - shift * 430,
          top: 210,
          width: 760,
          padding: '40px 50px 46px',
          background: '#EFE2C4',
          boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
          transform: `rotate(${-1.5 + shift * 0.5}deg) translateY(${(1 - prog(f, m2.s, 26, easeOut)) * 40}px)`,
          opacity: prog(f, m2.s - 4, 20),
        }}
      >
        <div style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 26, letterSpacing: 2, color: C.brown }}>पुराना सिद्धांत</div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 76, color: C.ink, lineHeight: 1.25, marginTop: 8 }}>आक्रमण और नरसंहार?</div>
        <div style={{ height: 3, background: C.brown, opacity: 0.35, margin: '18px 0 22px' }} />
        <div style={{ fontFamily: FONT_SERIF, fontStyle: 'italic', fontSize: 38, color: C.brown, opacity: prog(f, m2.s + 50, 24), marginBottom: 26 }}>“बाहर से आए हमलावरों ने शहर उजाड़ दिए”</div>
        <div style={{ opacity: wheel, transform: `translateY(${(1 - wheel) * 14}px)` }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 48, color: C.brickDark }}>मॉर्टिमर व्हीलर</div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 28, color: C.brown, marginTop: 4 }}>पुरातत्वविद् · 1940–50 का दशक</div>
          <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 34, color: C.ink, marginTop: 22 }}>मोहनजोदड़ो के कंकाल = “नरसंहार का सबूत”?</div>
        </div>
        {/* stamp */}
        {stamp > 0 ? (
          <div
            style={{
              position: 'absolute',
              right: 40,
              bottom: 60,
              padding: '10px 26px',
              border: `6px solid ${C.red}`,
              color: C.red,
              fontFamily: FONT_SANS,
              fontWeight: 800,
              fontSize: 52,
              borderRadius: 10,
              transform: `rotate(-10deg) scale(${1.6 - 0.6 * stamp})`,
              opacity: stamp * 0.88,
              background: 'rgba(239,226,196,0.6)',
            }}
          >
            ठोस सबूत नहीं
          </div>
        ) : null}
      </div>

      {/* stratigraphy section */}
      {sectP > 0 ? (
        <div style={{ position: 'absolute', left: 1060, top: 170, opacity: sectP, transform: `translateX(${(1 - sectP) * 60}px)` }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 44, color: C.cream, marginBottom: 14 }}>खुदाई की परतें</div>
          <svg width={720} height={560} viewBox="0 0 720 560">
            {bands.map((c, i) => (
              <g key={i}>
                <path d={`M0,${i * 90} Q180,${i * 90 + (rnd(`b${i}`) - 0.5) * 20} 360,${i * 90 + 6} T720,${i * 90} L720,${i * 90 + 92} L0,${i * 90 + 92} Z`} fill={c} />
                {Array.from({ length: 10 }, (_, j) => (
                  <circle key={j} cx={rnd(`p${i}${j}`) * 720} cy={i * 90 + 20 + rnd(`q${i}${j}`) * 55} r={2 + rnd(`r${i}${j}`) * 3} fill="#000" opacity={0.15} />
                ))}
              </g>
            ))}
            {skel.map((sk, i) => (
              <Skeleton key={i} x={sk.x} y={sk.band * 90 + 48} s={1.5} rot={sk.rot} o={prog(f, m4.s + 40 + i * 14, 16)} />
            ))}
            {ages.map((a, i) =>
              a ? (
                <text key={i} x={710} y={i * 90 + 54} textAnchor="end" fontFamily={FONT_SANS} fontWeight={600} fontSize={24} fill={C.cream} opacity={prog(f, m4.s + 90, 20)}>
                  {a}
                </text>
              ) : null,
            )}
            <rect x={0} y={0} width={720} height={545} fill="none" stroke="#2B1D14" strokeWidth={4} />
          </svg>
          <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 30, color: C.goldLight, marginTop: 14, opacity: prog(f, m4.s + 100, 20) }}>कंकाल अलग-अलग समय के</div>
        </div>
      ) : null}
      <Tag frame={f} start={m4.s + 60} end={1e9} text="बाद की जाँच: जॉर्ज डेल्स (1964) व अन्य" x={96} y={60} size={24} bg="rgba(28,20,16,0.85)" color={C.cream} />
      <Tag frame={f} start={m4.s + 20} end={1e9} text="सांकेतिक चित्रण" x={1640} y={60} size={22} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

const CARDS = [
  { label: 'मानसून', sub: 'कमज़ोर बारिश', x: 430, y: 290, rot: -3, icon: 'rain' },
  { label: 'नदियाँ', sub: 'बदलता बहाव', x: 1490, y: 290, rot: 2.5, icon: 'river' },
  { label: 'व्यापार', sub: 'घटता लेन-देन', x: 430, y: 720, rot: 2, icon: 'boat' },
  { label: 'बीमारी', sub: '(संभावित)', x: 1490, y: 720, rot: -2, icon: 'health' },
] as const;

const Icon: React.FC<{ kind: string }> = ({ kind }) => {
  const s = { stroke: C.ink, strokeWidth: 4, fill: 'none', strokeLinecap: 'round' as const };
  if (kind === 'rain')
    return (
      <g>
        <path d="M-34,6 Q-40,-18 -16,-20 Q-8,-38 14,-30 Q36,-30 34,-6 Q44,8 26,10 L-26,10 Q-40,10 -34,6 Z" fill={C.teal} opacity={0.85} />
        {[-18, 0, 18].map((x) => <path key={x} d={`M${x},20 l-5,14`} {...s} stroke={C.river} />)}
      </g>
    );
  if (kind === 'river') return <g>{[-14, 2, 18].map((y) => <path key={y} d={`M-38,${y} q12,-10 25,0 t25,0 t25,0`} {...s} stroke={C.river} />)}</g>;
  if (kind === 'boat')
    return (
      <g>
        <path d="M-40,8 L40,8 L28,24 L-28,24 Z" fill={C.brown} />
        <path d="M0,8 L0,-34 L26,2 Z" fill={C.cream} stroke={C.ink} strokeWidth={2} />
      </g>
    );
  return (
    <g>
      <circle r={22} fill={C.terracotta} opacity={0.85} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <circle key={i} cx={Math.cos(a) * 30} cy={Math.sin(a) * 30} r={5} fill={C.terracotta} />;
      })}
    </g>
  );
};

const EvidenceBoard: React.FC<{ f: number; m5: L; m6: L }> = ({ f, m5, m6 }) => {
  const centre = [960, 505];
  const single = window01(f, m5.s, m6.s + 20, 16, 16);
  const strike = prog(f, m5.s + 60, 18);
  const many = prog(f, m6.s + 10, 20, easeOut);
  const cardAt = (i: number) => m6.s + 20 + i * Math.round((m6.e - m6.s - 50) / 4);
  const cam = keys(f, [[m5.s, 1.06], [m7Guard(m6), 1.0]]);
  return (
    <AbsoluteFill style={{ background: '#2A1D15' }}>
      <AbsoluteFill style={{ transform: `scale(${cam})` }}>
        <Parchment dark={0.7} tint="#8E6B47" />
        <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          {CARDS.map((c, i) => {
            const p = prog(f, cardAt(i) + 10, 26);
            const [x0, y0] = centre;
            const mx = (x0 + c.x) / 2;
            const my = (y0 + c.y) / 2 + 40;
            const d = `M${x0},${y0} Q${mx},${my} ${c.x},${c.y}`;
            return <path key={i} d={d} stroke={C.red} strokeWidth={3.5} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} opacity={0.85} />;
          })}
        </svg>
        {/* centre node */}
        <div style={{ position: 'absolute', left: centre[0] - 210, top: centre[1] - 80, width: 420, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFE2C4', boxShadow: '0 14px 30px rgba(0,0,0,0.45)', borderRadius: 6 }}>
          <div style={{ position: 'absolute', top: -12, left: 200, width: 22, height: 22, borderRadius: 11, background: C.red, boxShadow: '0 3px 4px rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'relative', fontFamily: FONT_SERIF, fontSize: 64, color: C.ink, opacity: single }}>
            एक वजह?
            <div style={{ position: 'absolute', left: -10, top: '52%', height: 6, width: `${strike * 110}%`, background: C.red, borderRadius: 3 }} />
          </div>
          <div style={{ position: 'absolute', fontFamily: FONT_SERIF, fontSize: 64, color: C.brickDark, opacity: many }}>कई वजहें</div>
        </div>
        {CARDS.map((c, i) => {
          const p = prog(f, cardAt(i), 20, easeOut);
          if (p <= 0) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: c.x - 190,
                top: c.y - 95,
                width: 380,
                height: 190,
                background: '#F3E8CF',
                boxShadow: '0 12px 26px rgba(0,0,0,0.45)',
                transform: `rotate(${c.rot}deg) scale(${0.85 + 0.15 * p})`,
                opacity: p,
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                padding: '0 26px',
                borderRadius: 4,
              }}
            >
              <div style={{ position: 'absolute', top: -11, left: 180, width: 22, height: 22, borderRadius: 11, background: C.red, boxShadow: '0 3px 4px rgba(0,0,0,0.4)' }} />
              <svg width={100} height={100} viewBox="-50 -50 100 100">
                <Icon kind={c.icon} />
              </svg>
              <div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 54, color: C.ink, lineHeight: 1.15 }}>{c.label}</div>
                <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 26, color: C.brown }}>{c.sub}</div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
const m7Guard = (m6: L) => m6.e + 60;

/* ------------------------------------------------------------------ */

const Helix: React.FC<{ f: number; x: number; y: number; h: number; o: number }> = ({ f, x, y, h, o }) => {
  const n = 22;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const yy = y - h / 2 + t * h;
    const a = t * Math.PI * 3.2 + f * 0.05;
    const x1 = x + Math.sin(a) * 70;
    const x2 = x - Math.sin(a) * 70;
    const front = Math.cos(a) > 0;
    items.push(
      <g key={i}>
        <line x1={x1} y1={yy} x2={x2} y2={yy} stroke={C.goldLight} strokeWidth={3} opacity={0.35} />
        <circle cx={x1} cy={yy} r={front ? 9 : 6} fill={C.goldLight} opacity={front ? 1 : 0.5} />
        <circle cx={x2} cy={yy} r={front ? 6 : 9} fill={C.riverLight} opacity={front ? 0.5 : 1} />
      </g>,
    );
  }
  return <g opacity={o}>{items}</g>;
};

const DnaShot: React.FC<{ f: number; m7: L; m8: L }> = ({ f, m7, m8 }) => {
  const rk = SUB.sites.rakhigarhi.xy;
  const cam = camAt(f, [
    [m7.s - 6, { x: 1000, y: 380, z: 2.4 }],
    [m7.e, { x: 1010, y: 390, z: 2.2 }],
    [m8.s + 60, { x: 1000, y: 520, z: 1.05 }],
    [m8.e + 40, { x: 1000, y: 520, z: 1.0 }],
  ]);
  const inv = 1 / cam.z;
  const spread = prog(f, m8.s + 30, 120);
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.12);
  return (
    <AbsoluteFill style={{ background: '#0F1418' }}>
      <Camera cam={cam} defs={<MapDefs />}>
        <Layer depth={1}>
          <rect x={-1000} y={-1000} width={4000} height={3000} fill="#121A20" />
          <LandMass d={SUB.land} draw={1} fill={1} landColor="#26323C" coast="#6F8796" hatch={false} seaColor="#0B1014" texture={false} />
          <Rivers progress={() => 1} scaleW={Math.max(0.5, Math.sqrt(inv))} fade={() => 0.45} />
          {spread > 0 ? (
            <circle cx={rk[0]} cy={rk[1]} r={60 + spread * 900} fill="url(#pinGlow)" opacity={0.55 * (1 - 0.4 * spread)} />
          ) : null}
          <circle cx={rk[0]} cy={rk[1]} r={(28 + 10 * pulse) * inv} fill="url(#pinGlow)" />
          <circle cx={rk[0]} cy={rk[1]} r={7 * inv} fill={C.goldLight} stroke="#0F1418" strokeWidth={2 * inv} />
          <SvgLabel frame={f} start={m7.s + 10} x={rk[0] + 16 * inv} y={rk[1] + 8 * inv} text="राखीगढ़ी" anchor="start" size={30 * inv * 1.2} color={C.goldLight} halo="rgba(15,20,24,0.8)" />
        </Layer>
      </Camera>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <Helix f={f} x={1640} y={470} h={560} o={window01(f, m7.s + 20, m8.s + 40, 24, 30)} />
      </svg>
      {/* m7 card */}
      <div style={{ position: 'absolute', left: 96, top: 120, opacity: window01(f, m7.s + 30, m8.s + 50, 18, 20), padding: '24px 34px', background: 'rgba(15,20,24,0.82)', borderLeft: `6px solid ${C.gold}`, borderRadius: 8 }}>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 70, color: C.goldLight, lineHeight: 1.1 }}>2019</div>
        <div style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 36, color: C.cream }}>प्राचीन DNA अध्ययन</div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 26, color: '#AFC1CC', marginTop: 4 }}>राखीगढ़ी के एक कंकाल से</div>
      </div>
      {/* m8 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 80, textAlign: 'center', opacity: window01(f, m8.s + 40, 1e9, 20, 1) }}>
        <div style={{ display: 'inline-block', padding: '16px 44px', background: 'rgba(15,20,24,0.78)', borderRadius: 14 }}>
          <TextReveal frame={f} start={m8.s + 50} text="उनका वंश — आज के *दक्षिण एशियाई* लोगों में" size={54} />
        </div>
      </div>
      <Tag frame={f} start={m7.s + 60} end={1e9} text="स्रोत: शिंदे व अन्य, Cell (2019)" x={96} y={60} size={22} bg="rgba(242,207,122,0.9)" />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

const ScriptShot: React.FC<{ f: number; m9: L }> = ({ f, m9 }) => {
  const z = keys(f, [[m9.s - 6, 1.08], [m9.e + 40, 1.0]]);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 42%, #3A2619 0%, #120C09 72%)' }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <filter id="signGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {SIGNS.map((d, i) => {
            const p = prog(f, m9.s + 10 + i * 14, 24, easeOut);
            const glow = 0.7 + 0.3 * Math.sin(f * 0.07 + i * 1.3);
            return (
              <g key={i} transform={`translate(${960 + (i - 2) * 230} ${400 - (1 - p) * 20}) scale(3.4)`} opacity={p * glow}>
                <rect x={-30} y={-30} width={60} height={60} rx={8} fill="rgba(255,246,224,0.05)" stroke="rgba(242,207,122,0.3)" strokeWidth={0.6} />
                <path d={d} stroke={C.goldLight} strokeWidth={2.6} fill="none" strokeLinecap="round" filter="url(#signGlow)" />
              </g>
            );
          })}
          <text x={960 + 3 * 230} y={580} textAnchor="middle" fontFamily={FONT_SERIF} fontSize={90} fill={C.goldLight} opacity={0.35 * prog(f, m9.s + 120, 30)}>
            ?
          </text>
          <Dust frame={f} count={40} color="#F2CF7A" opacity={0.3} size={[0.8, 2]} wind={0.1} rise={-0.25} seed={41} />
        </svg>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center' }}>
        <TextReveal frame={f} start={m9.s + 70} text="लिपि — अब भी *अपठित*" size={70} font="serif" />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 750, textAlign: 'center', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 32, color: C.sand, opacity: prog(f, m9.s + 140, 24) }}>
        ज़्यादातर लेख बहुत छोटे हैं — और कोई द्विभाषी लेख नहीं मिला
      </div>
      <Tag frame={f} start={m9.s + 30} end={1e9} text="चिह्न सांकेतिक हैं" x={1640} y={60} size={22} />
    </AbsoluteFill>
  );
};

