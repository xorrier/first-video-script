import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Camera, camAt, Layer } from '../components/Camera';
import { DrawPath, LandMass, MapDefs, Route, TRADE } from '../components/Map';
import { LightRays, Parchment } from '../components/Overlay';
import { Dust } from '../components/Particles';
import { Shot } from '../components/Shot';
import { Caption, SvgLabel, Tag } from '../components/Text';
import { ArtDefs, GreatBathIso } from '../components/art/Buildings';
import { BullCart, Walker } from '../components/art/Characters';
import { CityScape } from '../components/art/CityScape';
import { Beads, Pot, Seal, Stall, Tree, Weights, Well } from '../components/art/Props';
import { Hills, Sky } from '../components/art/Sky';
import { C, FONT_SANS, FONT_SERIF } from '../theme';
import { clamp, easeOut, keys, mix, prog, rnd, smoothPath } from '../utils/animation';
import { useLine, useSceneDuration, useSceneFrame } from '../utils/timing';

export const CityLife: React.FC = () => {
  const f = useSceneFrame();
  const D = useSceneDuration();
  const [l1, l2, l3, l4, l5, l6, l7, l8, l9] = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9'].map((id) => useLine(id));
  const l5mid = l5.s + 70;
  const l7mid = Math.round((l7.s + l7.e) / 2) - 10;
  return (
    <AbsoluteFill style={{ background: '#1a120c' }}>
      {/* A — street level, entering the city */}
      <Shot f={f} from={-30} to={l2.s + 16} fadeIn={0}>
        {(lf) => <StreetShot f={f} lf={lf} />}
      </Shot>
      {/* B — planned grid */}
      <Shot f={f} from={l2.s} to={l3.s + 16}>
        {(lf) => <PlanShot lf={lf} />}
      </Shot>
      {/* C — standard brick ratio */}
      <Shot f={f} from={l3.s - 8} to={l4.s + 16}>
        {(lf) => <BrickShot lf={lf} />}
      </Shot>
      {/* D — covered drains */}
      <Shot f={f} from={l4.s - 10} to={l5.s + 16}>
        {(lf) => <DrainShot lf={lf} f={f} />}
      </Shot>
      {/* E — wells */}
      <Shot f={f} from={l5.s - 6} to={l5mid + 16}>
        {(lf) => <WellShot f={f} lf={lf} />}
      </Shot>
      {/* F — Great Bath */}
      <Shot f={f} from={l5mid} to={l6.s + 26}>
        {(lf) => <BathShot lf={lf} f={f} />}
      </Shot>
      {/* G — market, beads, weights */}
      <Shot f={f} from={l6.s + 10} to={l7.s + 16}>
        {(lf) => <MarketShot f={f} lf={lf} />}
      </Shot>
      {/* H — bullock cart */}
      <Shot f={f} from={l7.s} to={l7mid + 16}>
        {(lf) => <CartShot f={f} lf={lf} />}
      </Shot>
      {/* I — trade with Mesopotamia; Meluhha */}
      <Shot f={f} from={l7mid} to={l9.s + 6}>
        {(lf) => <TradeShot lf={lf} f={f} meluhha={l8.s - l7mid} total={l9.s - l7mid} />}
      </Shot>
      {/* J — the seal */}
      <Shot f={f} from={l9.s - 10} to={D + 30}>
        {(lf) => <SealShot lf={lf} />}
      </Shot>
      <Caption frame={f} start={l1.s} end={l2.s + 10} title="मोहनजोदड़ो" sub="लगभग 2500 ईसा पूर्व · पुनर्निर्माण चित्रण" />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

const StreetShot: React.FC<{ f: number; lf: number }> = ({ f, lf }) => {
  const cam = camAt(lf, [
    [0, { x: 760, y: 560, z: 1.06 }],
    [160, { x: 980, y: 580, z: 1.12 }],
  ]);
  return (
    <Camera cam={cam} defs={<ArtDefs />}>
      <CityScape frame={f + 400} id="cityA" tod="day" crowd={0.85} seed="ca" dust={0.25} />
    </Camera>
  );
};

/** Simplified schematic plan: citadel mound to the west, lower town grid to the east. */
const PlanShot: React.FC<{ lf: number }> = ({ lf }) => {
  const cam = camAt(lf, [
    [0, { x: 1000, y: 560, z: 1.18, r: -5 }],
    [200, { x: 960, y: 540, z: 1.0, r: 0 }],
  ]);
  const ink = C.brown;
  const mainV = [880, 1300];
  const mainH = [360, 700];
  const blocks: React.ReactNode[] = [];
  const bx = [600, 880, 1300, 1640];
  const by = [140, 360, 700, 930];
  let n = 0;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const x0 = bx[i] + 20, x1 = bx[i + 1] - 20, y0 = by[j] + 20, y1 = by[j + 1] - 20;
      const cols = Math.max(2, Math.round((x1 - x0) / 110));
      const rows = Math.max(2, Math.round((y1 - y0) / 95));
      for (let a = 0; a < cols; a++)
        for (let b = 0; b < rows; b++) {
          const k = n++;
          const hx = x0 + (a * (x1 - x0)) / cols + 4;
          const hy = y0 + (b * (y1 - y0)) / rows + 4;
          const hw = (x1 - x0) / cols - 8;
          const hh = (y1 - y0) / rows - 8;
          const p = prog(lf, 50 + k * 0.9, 16, easeOut);
          if (p <= 0) continue;
          blocks.push(
            <g key={k} opacity={p}>
              <rect x={hx} y={hy} width={hw} height={hh} fill={mix(C.sand, C.brick, 0.25 + rnd(`pb${k}`) * 0.2)} stroke={ink} strokeWidth={1.4} />
              <rect x={hx + hw * 0.3} y={hy + hh * 0.3} width={hw * 0.4} height={hh * 0.4} fill={C.parchment} stroke={ink} strokeWidth={1} opacity={0.9} />
            </g>,
          );
        }
    }
  const streetP = (i: number) => prog(lf, 8 + i * 8, 40);
  return (
    <AbsoluteFill>
      <Parchment />
      <Camera cam={cam} defs={<ArtDefs />}>
        <Layer depth={1}>
          <g opacity={prog(lf, 20, 30)}>
            <path d="M160,250 Q170,170 300,160 L470,170 Q520,190 520,330 L515,760 Q500,840 380,850 L220,840 Q150,820 150,700 Z" fill={mix(C.sand, C.brown, 0.25)} stroke={ink} strokeWidth={2} />
            <rect x={250} y={300} width={150} height={100} fill={mix(C.sand, C.brick, 0.4)} stroke={ink} strokeWidth={1.5} />
            <rect x={285} y={325} width={80} height={50} fill={C.river} opacity={0.7} />
            <rect x={240} y={480} width={200} height={140} fill={mix(C.sand, C.brick, 0.35)} stroke={ink} strokeWidth={1.5} />
            <SvgLabel frame={lf} start={50} x={335} y={720} text="ऊँचा टीला (गढ़ी)" anchor="middle" size={30} />
            <SvgLabel frame={lf} start={70} x={335} y={290} text="स्नानागार" anchor="middle" size={24} color={C.river} />
          </g>
          {mainV.map((x, i) => (
            <DrawPath key={`v${i}`} d={`M${x},120 L${x},960`} p={streetP(i)} stroke={C.parchment} width={34} cap="butt" />
          ))}
          {mainH.map((y, i) => (
            <DrawPath key={`h${i}`} d={`M590,${y} L1660,${y}`} p={streetP(i + 2)} stroke={C.parchment} width={30} cap="butt" />
          ))}
          {blocks}
          {mainV.map((x, i) => (
            <DrawPath key={`vb${i}`} d={`M${x},120 L${x},960`} p={streetP(i)} stroke={C.gold} width={4} opacity={0.8} dash="18 10" id={`pv${i}`} />
          ))}
          {mainH.map((y, i) => (
            <DrawPath key={`hb${i}`} d={`M590,${y} L1660,${y}`} p={streetP(i + 2)} stroke={C.gold} width={4} opacity={0.8} dash="18 10" id={`ph${i}`} />
          ))}
          <SvgLabel frame={lf} start={90} x={1090} y={690} text="मुख्य सड़क" anchor="middle" size={26} color={C.brickDark} />
          <SvgLabel frame={lf} start={100} x={1660} y={110} text="निचला शहर" anchor="end" size={34} />
          <g transform="translate(1790 230)" opacity={prog(lf, 40, 20)}>
            <path d="M0,-50 L16,10 L0,0 L-16,10 Z" fill={ink} />
            <text y={40} textAnchor="middle" fontFamily={FONT_SANS} fontSize={28} fill={ink}>उ</text>
          </g>
        </Layer>
      </Camera>
      <Tag frame={lf} start={30} end={1e9} text="सरलीकृत नक्शा" x={1640} y={60} size={22} />
    </AbsoluteFill>
  );
};

/** Isometric brick with 4:2:1 dimensions, then bricks stacking into a wall. */
const BrickShot: React.FC<{ lf: number }> = ({ lf }) => {
  const c30 = Math.cos(Math.PI / 6);
  const U = 48;
  const iso = (x: number, y: number, z: number, ox: number, oy: number) => [ox + (x - y) * c30 * U, oy + (x + y) * 0.5 * U - z * U];
  const brick = (x: number, y: number, z: number, L: number, W: number, H: number, ox: number, oy: number, key: string | number, o = 1, u = 1) => {
    const P = (...p: [number, number, number][]) => p.map((q) => iso(q[0] * u, q[1] * u, q[2] * u, ox, oy).join(',')).join(' ');
    return (
      <g key={key} opacity={o}>
        <polygon points={P([x, y + W, z], [x + L, y + W, z], [x + L, y + W, z + H], [x, y + W, z + H])} fill={C.brick} stroke={C.brickDark} strokeWidth={1} />
        <polygon points={P([x + L, y, z], [x + L, y + W, z], [x + L, y + W, z + H], [x + L, y, z + H])} fill={C.brickDark} />
        <polygon points={P([x, y, z + H], [x + L, y, z + H], [x + L, y + W, z + H], [x, y + W, z + H])} fill={C.brickLight} stroke={C.brick} strokeWidth={1} />
      </g>
    );
  };
  const p1 = prog(lf, 0, 30, easeOut);
  const dims = [prog(lf, 50, 20, easeOut), prog(lf, 75, 20, easeOut), prog(lf, 100, 20, easeOut)];
  const ox = 560, oy = 470;
  const A = (x: number, y: number, z: number) => iso(x, y, z, ox, oy);
  // running-bond wall: each course offset by half a brick
  const wall: React.ReactNode[] = [];
  let k = 0;
  for (let row = 0; row < 7; row++) {
    const off = row % 2 === 1 ? -2 : 0;
    for (let i = 0; i < 5; i++) {
      const p = prog(lf, 120 + k * 1.2, 12, easeOut);
      k++;
      if (p <= 0) continue;
      const drop = (1 - p) * 3;
      wall.push(brick(i * 4 + off + 0.08, 0, row + drop, 3.84, 2, 0.92, 1180, 470, `w${k}`, p, 0.6));
    }
  }  const lab = (pt: number[], text: string, o: number) => (
    <text x={pt[0]} y={pt[1]} fontFamily={FONT_SERIF} fontSize={72} fill={C.brickDark} textAnchor="middle" opacity={o}>
      {text}
    </text>
  );
  const L = 6.4, W = 3.2, H = 1.6;
  return (
    <AbsoluteFill>
      <Parchment />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <ArtDefs />
        </defs>
        <g transform={`translate(0 ${(1 - p1) * 40})`} opacity={p1}>
          <ellipse cx={A(L / 2, W / 2, 0)[0]} cy={A(L / 2, W / 2, 0)[1] + 20} rx={260} ry={60} fill="#000" opacity={0.12} />
          {brick(0, 0, 0, L, W, H, ox, oy, 'main')}
          <line x1={A(0, W + 0.7, 0)[0]} y1={A(0, W + 0.7, 0)[1]} x2={A(L * dims[0], W + 0.7, 0)[0]} y2={A(L * dims[0], W + 0.7, 0)[1]} stroke={C.ink} strokeWidth={3} />
          <line x1={A(L + 0.7, 0, 0)[0]} y1={A(L + 0.7, 0, 0)[1]} x2={A(L + 0.7, W * dims[1], 0)[0]} y2={A(L + 0.7, W * dims[1], 0)[1]} stroke={C.ink} strokeWidth={3} />
          <line x1={A(0, W, 0)[0] - 30} y1={A(0, W, 0)[1]} x2={A(0, W, H * dims[2])[0] - 30} y2={A(0, W, H * dims[2])[1]} stroke={C.ink} strokeWidth={3} />
          {lab([A(L / 2, W + 1.6, 0)[0] - 20, A(L / 2, W + 1.6, 0)[1] + 40], '4', dims[0])}
          {lab([A(L + 1.6, W / 2, 0)[0] + 40, A(L + 1.6, W / 2, 0)[1] + 30], '2', dims[1])}
          {lab([A(0, W, H / 2)[0] - 80, A(0, W, H / 2)[1] + 24], '1', dims[2])}
        </g>
        <g>{wall}</g>
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 100, textAlign: 'center', fontFamily: FONT_SERIF, fontSize: 70, color: C.ink, opacity: prog(lf, 110, 20) }}>
        लंबाई : चौड़ाई : मोटाई = <span style={{ color: C.brickDark }}>4 : 2 : 1</span>
      </div>
      <div style={{ position: 'absolute', left: 1240, top: 862, fontFamily: FONT_SANS, fontWeight: 600, fontSize: 32, color: C.brown, opacity: prog(lf, 170, 20) }}>
        एक ही अनुपात — अलग-अलग शहरों में
      </div>
    </AbsoluteFill>
  );
};

/** Cross-section: house → sloping drain → covered street drain → soak pit. */
const DrainShot: React.FC<{ f: number; lf: number }> = ({ f, lf }) => {
  const earth = '#B08A5E';
  const path: [number, number][] = [[400, 585], [520, 625], [640, 655], [900, 680], [1200, 700], [1450, 715], [1560, 770]];
  const pathD = smoothPath(path);
  const flowP = prog(lf, 50, 60);
  const cam = camAt(lf, [
    [0, { x: 940, y: 560, z: 1.0 }],
    [220, { x: 990, y: 580, z: 1.06 }],
  ]);
  return (
    <AbsoluteFill>
      <Parchment />
      <Camera cam={cam} defs={<ArtDefs />}>
        <Layer depth={1}>
          <rect x={-200} y={600} width={2400} height={700} fill={earth} />
          <rect x={-200} y={592} width={2400} height={12} fill={mix(earth, '#000', 0.2)} />
          {/* house */}
          <rect x={60} y={260} width={380} height={340} fill={C.brickLight} />
          <rect x={60} y={260} width={380} height={340} fill="url(#bricks)" />
          <rect x={90} y={300} width={320} height={300} fill={mix(C.parchment, C.sand, 0.5)} />
          <rect x={250} y={540} width={150} height={60} fill={C.brick} />
          <rect x={250} y={540} width={150} height={60} fill="url(#bricksFine)" />
          <SvgLabel frame={lf} start={20} x={250} y={235} text="घर का स्नान-चबूतरा" anchor="middle" size={32} />
          <path d={pathD} stroke={mix(C.brickDark, '#000', 0.2)} strokeWidth={46} fill="none" />
          <path d={pathD} stroke="#3B2A1E" strokeWidth={32} fill="none" />
          <DrawPath d={pathD} p={flowP} stroke={C.river} width={18} />
          {flowP >= 1 ? <path d={pathD} stroke={C.riverLight} strokeWidth={6} fill="none" strokeDasharray="20 34" strokeDashoffset={-f * 3} strokeLinecap="round" /> : null}
          {/* cover slabs over the street drain */}
          {Array.from({ length: 12 }, (_, i) => {
            const x = 700 + i * 64;
            const t = (x + 31 - 640) / (1450 - 640);
            const y = 655 + t * 60 - 34;
            const p = prog(lf, 90 + i * 3, 14, easeOut);
            return <rect key={i} x={x} y={y - (1 - p) * 40} width={60} height={16} fill={C.brick} stroke={mix(C.brickDark, '#000', 0.3)} strokeWidth={2} opacity={p} />;
          })}
          {/* soak pit */}
          <rect x={1510} y={740} width={160} height={190} fill="#3B2A1E" stroke={mix(C.brickDark, '#000', 0.2)} strokeWidth={10} />
          <rect x={1520} y={750 + 170 * (1 - 0.5 * flowP)} width={140} height={170 * 0.5 * flowP} fill={C.river} opacity={0.85} />
          <rect x={1520} y={890} width={140} height={30} fill="#5A4636" />
          <SvgLabel frame={lf} start={110} x={1080} y={780} text="ढकी हुई नाली" anchor="middle" size={38} color={C.cream} halo="rgba(43,29,20,0.7)" />
          <SvgLabel frame={lf} start={140} x={1490} y={880} text="सोख्ता गड्ढा" anchor="end" size={30} color={C.cream} halo="rgba(43,29,20,0.7)" />
          <Walker frame={lf} x={720} y={598} speed={1.1} seed={2} scale={1.0} carry="pot" female />
        </Layer>
      </Camera>
      <Tag frame={lf} start={20} end={1e9} text="पुनर्निर्माण चित्रण" x={1600} y={60} size={22} />
    </AbsoluteFill>
  );
};

const WellShot: React.FC<{ f: number; lf: number }> = ({ f, lf }) => {
  const cam = camAt(lf, [
    [0, { x: 1100, y: 760, z: 1.35 }],
    [100, { x: 1000, y: 770, z: 1.45 }],
  ]);
  return (
    <AbsoluteFill>
      <Camera cam={cam} defs={<ArtDefs />}>
        <CityScape frame={f + 900} id="cityE" tod="day" crowd={0.4} seed="ce" dust={0.2} foreground={false} />
        <Layer depth={1}>
          <Well x={1000} y={930} s={1.25} frame={f} />
          <Walker frame={f} x={860} y={950} still seed={5} female carry="pot" scale={1.15} />
          <Walker frame={f} x={1150} y={960} still seed={8} female scale={1.15} speed={-1} />
          <Pot x={1100} y={965} s={0.9} variant={1} />
          <Pot x={1210} y={975} s={0.8} variant={2} />
        </Layer>
        <Layer depth={1.3}>
          <Tree x={1640} y={1100} s={1.8} frame={f} seed={3} />
        </Layer>
      </Camera>
      <Caption frame={lf} start={10} end={1e9} title="कुएँ" sub="शहर में सैकड़ों कुएँ थे" />
    </AbsoluteFill>
  );
};

const BathShot: React.FC<{ f: number; lf: number }> = ({ f, lf }) => {
  const build = prog(lf, 0, 45, easeOut);
  const water = prog(lf, 35, 50);
  const cam = camAt(lf, [
    [0, { x: 960, y: 560, z: 1.12 }],
    [130, { x: 960, y: 540, z: 1.0 }],
  ]);
  return (
    <AbsoluteFill>
      <Camera cam={cam} defs={<ArtDefs />}>
        <Layer depth={0}>
          <Sky tod="day" id="bath" />
        </Layer>
        <Layer depth={0.3}>
          <Hills y={520} amp={50} color="#C6B796" seed={4} />
        </Layer>
        <Layer depth={1}>
          <rect x={-400} y={520} width={2800} height={900} fill="#C9A26F" />
          <GreatBathIso frame={f} build={build} water={water} ox={960} oy={330} s={34} />
          <SvgLabel frame={lf} start={60} x={560} y={830} text="लगभग 12 मी × 7 मी" anchor="middle" size={38} />
          <SvgLabel frame={lf} start={75} x={1380} y={830} text="गहराई ≈ 2.4 मी" anchor="middle" size={38} />
        </Layer>
      </Camera>
      <Caption frame={lf} start={10} end={1e9} title="विशाल स्नानागार" sub="मोहनजोदड़ो की गढ़ी पर" />
      <Tag frame={lf} start={20} end={1e9} text="पुनर्निर्माण चित्रण" x={1600} y={60} size={22} />
    </AbsoluteFill>
  );
};

const MarketShot: React.FC<{ f: number; lf: number }> = ({ f, lf }) => {
  const cam = camAt(lf, [
    [0, { x: 820, y: 640, z: 1.15 }],
    [170, { x: 1060, y: 650, z: 1.22 }],
  ]);
  return (
    <AbsoluteFill>
      <Camera cam={cam} defs={<ArtDefs />}>
        <CityScape frame={f + 1300} id="cityG" tod="day" crowd={0.7} seed="cg" dust={0.2} foreground={false} birds={false} />
        <Layer depth={1}>
          <Stall x={520} y={940} frame={f} cloth="#A8442C" seed={1} />
          {[440, 500, 560, 610].map((x, i) => <Pot key={i} x={x} y={882} s={0.7} variant={i % 3} />)}
          <Stall x={1000} y={950} frame={f} cloth="#3D4F6B" seed={2} />
          <Beads x={1000} y={870} s={0.55} reveal={prog(lf, 40, 40)} />
          <Stall x={1480} y={945} frame={f} cloth="#C98B3A" seed={3} />
          <Walker frame={f} x={1380} y={1000} still seed={9} scale={1.2} />
          <Walker frame={f} x={760} y={1010} speed={0.8} seed={4} scale={1.25} carry="basket" female />
        </Layer>
        <Layer depth={1.25}>
          <rect x={1180} y={1010} width={760} height={200} fill="#6B4527" />
          <rect x={1180} y={1000} width={760} height={14} fill="#8C6440" />
          <Weights x={1560} y={1004} s={1.7} frame={lf} reveal={prog(lf, 50, 50)} />
        </Layer>
      </Camera>
      <div style={{ position: 'absolute', right: 96, top: 96, textAlign: 'right', opacity: prog(lf, 90, 20), background: 'rgba(30,20,12,0.62)', padding: '18px 30px', borderRadius: 14 }}>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 52, color: C.cream, textShadow: '0 2px 14px rgba(0,0,0,0.7)' }}>पत्थर के तय बाट</div>
        <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 34, color: C.goldLight, textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>1 · 2 · 4 · 8 · 16 …</div>
      </div>
      <Caption frame={lf} start={10} end={150} title="बाज़ार" sub="बर्तन · मनके · बाट" />
    </AbsoluteFill>
  );
};

const CartShot: React.FC<{ f: number; lf: number }> = ({ f, lf }) => {
  const cam = camAt(lf, [
    [0, { x: 700, y: 660, z: 1.2 }],
    [110, { x: 980, y: 660, z: 1.2 }],
  ]);
  return (
    <Camera cam={cam} defs={<ArtDefs />}>
      <CityScape frame={f + 1700} id="cityH" tod="day" crowd={0.3} seed="ch" dust={0.35} foreground={false} />
      <Layer depth={1}>
        <BullCart frame={lf} x={250} y={985} speed={2.6} scale={1.2} />
        <Walker frame={lf} x={180} y={995} speed={2.6} seed={6} scale={1.2} carry="stick" />
      </Layer>
    </Camera>
  );
};

const TradeShot: React.FC<{ f: number; lf: number; meluhha: number; total: number }> = ({ f, lf, meluhha, total }) => {
  const route = [...TRADE.routeLothal, ...TRADE.route.slice(1)];
  const draw = prog(lf, 20, 120);
  const boatT = clamp((lf - 30) / Math.max(60, meluhha + 40));
  const cam = camAt(lf, [
    [0, { x: 1300, y: 560, z: 1.3 }],
    [meluhha - 10, { x: 900, y: 520, z: 1.0 }],
    [meluhha + 50, { x: 1300, y: 540, z: 1.3 }],
    [total, { x: 1280, y: 540, z: 1.38 }],
  ]);
  const inv = 1 / cam.z;
  const pt = TRADE.points;
  const melO = prog(lf, meluhha + 20, 25, easeOut);
  return (
    <AbsoluteFill>
      <Parchment />
      <Camera cam={cam} defs={<MapDefs />}>
        <Layer depth={1}>
          <LandMass d={TRADE.land} draw={1} fill={1} />
          {[TRADE.indus, TRADE.tigris, TRADE.euphrates].map((r, i) => (
            <path key={i} d={smoothPath(r)} stroke={C.river} strokeWidth={4 * inv * 1.2} fill="none" strokeLinecap="round" />
          ))}
          <Route pts={route} frame={f} draw={draw} boatT={boatT} />
          {(['mohenjodaro', 'lothal', 'dilmun', 'ur'] as const).map((k, i) => {
            const p = pt[k];
            const o = prog(lf, 10 + i * 25, 15);
            const left = k === 'ur' || k === 'dilmun';
            return (
              <g key={k} opacity={o}>
                <circle cx={p.xy[0]} cy={p.xy[1]} r={9 * inv * 1.2} fill={C.brickDark} stroke={C.cream} strokeWidth={2} />
                <SvgLabel frame={lf} start={10 + i * 25} x={p.xy[0] + (left ? -16 : 16) * inv} y={p.xy[1] + (k === 'ur' ? -18 : 8) * inv} text={p.name} anchor={left ? 'end' : 'start'} size={30 * inv * 1.2} />
              </g>
            );
          })}
          <g opacity={melO}>
            <ellipse cx={1480} cy={560} rx={210 * (0.8 + 0.2 * melO)} ry={300 * (0.8 + 0.2 * melO)} fill={C.gold} opacity={0.12} stroke={C.gold} strokeWidth={3 * inv} strokeDasharray="10 8" />
            <text x={1500} y={400} textAnchor="middle" fontFamily={FONT_SERIF} fontSize={74 * inv * 1.2} fill={C.brickDark} stroke="rgba(241,228,198,0.9)" strokeWidth={10 * inv} paintOrder="stroke">
              मेलुहा
            </text>
          </g>
          <SvgLabel frame={lf} start={60} x={330} y={180} text="मेसोपोटामिया" anchor="middle" size={34 * inv * 1.2} color={C.brown} />
        </Layer>
      </Camera>
      <Tag frame={lf} start={40} end={meluhha + 10} text="समुद्री व्यापार मार्ग — सांकेतिक" x={96} y={60} size={22} />
      <Tag frame={lf} start={meluhha + 40} end={1e9} text="‘मेलुहा’ — ज़्यादातर विद्वानों के अनुसार सिंधु क्षेत्र" x={96} y={60} size={24} />
    </AbsoluteFill>
  );
};

const SealShot: React.FC<{ lf: number }> = ({ lf }) => {
  const s = keys(lf, [[0, 1.0], [270, 1.18]]);
  const glow = prog(lf, 140, 50);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, #4A2E1F 0%, #1A100A 75%)' }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <ArtDefs />
        </defs>
        <LightRays x={300} y={-100} angle={50} opacity={0.08} count={5} spread={20} length={1600} seed={4} />
        <Seal x={960} y={480} s={0.95 * s} signReveal={prog(lf, 30, 60)} glow={glow} light={0.7} />
        <Dust frame={lf} count={40} color="#F2CF7A" opacity={0.35} size={[0.8, 2]} wind={0.15} rise={-0.2} seed={21} />
      </svg>
      <Caption frame={lf} start={20} end={1e9} title="मुहर" sub="सेलखड़ी (स्टीटाइट) · आकार: कुछ सेंटीमीटर" />
      <Tag frame={lf} start={60} end={1e9} text="चित्र और चिह्न सांकेतिक हैं" x={1540} y={60} size={22} />
      <div style={{ position: 'absolute', right: 110, top: 760, fontFamily: FONT_SERIF, fontSize: 46, color: C.goldLight, opacity: prog(lf, 170, 25), textAlign: 'right' }}>
        चिह्नों का अर्थ — <span style={{ color: C.cream }}>अब भी पहेली</span>
      </div>
    </AbsoluteFill>
  );
};
