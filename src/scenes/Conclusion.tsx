import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Camera, camAt, Layer } from '../components/Camera';
import { Dust } from '../components/Particles';
import { Shot } from '../components/Shot';
import { TextReveal } from '../components/Text';
import { ArtDefs } from '../components/art/Buildings';
import { Walker } from '../components/art/Characters';
import { CityScape } from '../components/art/CityScape';
import { GrassTuft, Pot, Tree } from '../components/art/Props';
import { Birds, Clouds, Hills, Sky, SunDisc } from '../components/art/Sky';
import { C, FONT_SANS } from '../theme';
import { easeOut, keys, mix, prog, rnd, window01 } from '../utils/animation';
import { useLine, useSceneDuration, useSceneFrame } from '../utils/timing';

type L = { s: number; e: number };

export const Conclusion: React.FC = () => {
  const f = useSceneFrame();
  const D = useSceneDuration();
  const [e1, e2, e3, e4] = ['e1', 'e2', 'e3', 'e4'].map((id) => useLine(id));
  return (
    <AbsoluteFill style={{ background: '#1a120c' }}>
      <Shot f={f} from={-30} to={e2.s + 30} fadeIn={0}>
        {() => <DawnRuins f={f} e1={e1} />}
      </Shot>
      <Shot f={f} from={e2.s} to={e4.s + 30} fadeIn={30}>
        {() => <VillageShot f={f} e2={e2} e3={e3} />}
      </Shot>
      <Shot f={f} from={e4.s - 10} to={D + 30} fadeIn={36}>
        {() => <FinalQuestion f={f} e4={e4} />}
      </Shot>
    </AbsoluteFill>
  );
};

const DawnRuins: React.FC<{ f: number; e1: L }> = ({ f, e1 }) => {
  const cam = camAt(f, [
    [-30, { x: 900, y: 560, z: 1.12 }],
    [e1.e + 60, { x: 1020, y: 560, z: 1.05 }],
  ]);
  return (
    <AbsoluteFill>
      <Camera cam={cam} defs={<ArtDefs />}>
        <CityScape frame={f} id="conA" tod="dawn" decay={0.8} crowd={0} seed="cn" dust={0.4} />
      </Camera>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', opacity: window01(f, e1.s, e1.e + 40, 12, 20) }}>
        <TextReveal frame={f} start={e1.s + 6} text="अचानक *ग़ायब* नहीं हुई" size={84} font="serif" />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

const Hut: React.FC<{ x: number; y: number; s?: number; seed: number; frame: number; smoke?: boolean }> = ({ x, y, s = 1, seed, frame, smoke }) => {
  const wall = mix('#B98A5A', '#A0704A', rnd(`hw${seed}`));
  const roof = mix('#8C6A3E', '#6E5233', rnd(`hr${seed}`));
  const w = 150 + rnd(`hs${seed}`) * 60;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={w * 0.62} ry={10} fill="#000" opacity={0.15} />
      <path d={`M${-w / 2},0 L${-w / 2},-80 Q0,-88 ${w / 2},-80 L${w / 2},0 Z`} fill={wall} />
      <path d={`M${-w / 2 - 14},-74 Q0,-${150 + rnd(`ht${seed}`) * 20} ${w / 2 + 14},-74 Z`} fill={roof} />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${-w / 2 + (i + 0.5) * (w / 7)},-80 L${-w / 2 + (i + 0.5) * (w / 7) + (i - 3) * 4},-${110 + Math.abs(3 - i) * -6}`} stroke="#00000030" strokeWidth={2} />
      ))}
      <path d="M-20,0 L-20,-48 Q0,-60 20,-48 L20,0 Z" fill="#3B2618" />
      {smoke
        ? Array.from({ length: 6 }, (_, i) => {
            const t = ((frame * 0.6 + i * 22) % 130) / 130;
            return <circle key={i} cx={w * 0.2 + Math.sin(t * 6 + i) * 10 + t * 30} cy={-140 - t * 160} r={8 + t * 22} fill="#E8E0D4" opacity={0.35 * (1 - t)} />;
          })
        : null}
    </g>
  );
};

const VillageShot: React.FC<{ f: number; e2: L; e3: L }> = ({ f, e2, e3 }) => {
  const cam = camAt(f, [
    [e2.s, { x: 820, y: 560, z: 1.14 }],
    [e3.s, { x: 960, y: 560, z: 1.06 }],
    [e3.e + 60, { x: 1120, y: 570, z: 1.12 }],
  ]);
  const tod = keys(f, [[e2.s, 0], [e2.s + 120, 1]]);
  const card = window01(f, e2.s + 20, e3.s + 10, 18, 18);
  const ruinToVillage = prog(f, e2.s + 50, 50, easeOut);
  return (
    <AbsoluteFill>
      <Camera cam={cam} defs={<ArtDefs />}>
        <Layer depth={0}>
          <Sky tod="dawn" to="day" t={tod} id="vil" />
          <SunDisc x={460} y={520 - tod * 300} id="vilSun" r={56} />
          <Clouds frame={f} color="#FFF4E0" opacity={0.45} y={200} seed={6} />
        </Layer>
        <Layer depth={0.2}>
          <Hills y={600} amp={40} color={mix('#B9A27E', '#9DAA84', tod)} seed={12} />
        </Layer>
        <Layer depth={0.45}>
          <Hills y={660} amp={24} color={mix('#A88E6A', '#8C9A6C', tod)} seed={13} />
          <Birds frame={f} count={5} y={260} seed={4} />
        </Layer>
        <Layer depth={1}>
          <rect x={-400} y={700} width={2800} height={600} fill="#B69466" />
          {/* fields */}
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${-300 + i * 300},720 L${-60 + i * 300},720 L${40 + i * 320},820 L${-260 + i * 320},820 Z`} fill={i % 2 ? '#8FA05E' : '#A9A866'} opacity={0.85} />
          ))}
          {Array.from({ length: 40 }, (_, i) => (
            <line key={i} x1={-300 + i * 70} y1={725} x2={-280 + i * 72} y2={815} stroke="#6E7A40" strokeWidth={2} opacity={0.35} />
          ))}
          <rect x={-400} y={820} width={2800} height={500} fill="#C29C6A" />
          <Tree x={240} y={830} s={1.1} frame={f} seed={2} />
          {[
            [520, 860, 1.0, true],
            [820, 845, 0.85, false],
            [1160, 870, 1.1, true],
            [1460, 850, 0.9, false],
            [1760, 865, 1.0, false],
          ].map(([x, y, s, sm], i) => (
            <Hut key={i} x={x as number} y={y as number} s={s as number} seed={i} frame={f} smoke={sm as boolean} />
          ))}
          <Tree x={1000} y={850} s={0.9} frame={f} seed={5} />
          <Tree x={1960} y={840} s={1.2} frame={f} seed={7} />
          {[620, 700, 1300, 1600].map((x, i) => <Pot key={i} x={x} y={900 + (i % 2) * 8} s={0.75} variant={i % 3} />)}
          {Array.from({ length: 14 }, (_, i) => <GrassTuft key={i} x={-100 + i * 170 + rnd(`gt${i}`) * 60} y={960 + rnd(`gy${i}`) * 60} s={1} frame={f} seed={i} />)}
          <Walker frame={f} x={300} y={960} speed={1.0} seed={3} scale={1.15} carry="pot" female />
          <Walker frame={f} x={1500} y={985} speed={-0.8} seed={7} scale={1.2} carry="stick" />
          <Walker frame={f} x={900} y={970} still seed={11} scale={1.1} female />
        </Layer>
        <Layer depth={0}>
          <Dust frame={f} count={25} color="#F7E3B5" opacity={0.3} size={[0.8, 2]} wind={0.2} seed={51} />
        </Layer>
      </Camera>

      {/* e2: city → village */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 90, display: 'flex', justifyContent: 'center', opacity: card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 34, padding: '18px 44px', background: 'rgba(28,20,16,0.8)', borderRadius: 16 }}>
          <span style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 52, color: C.sand, opacity: 1 - 0.45 * ruinToVillage }}>शहर</span>
          <svg width={120} height={40} viewBox="0 0 120 40">
            <path d={`M0,20 L${100 * ruinToVillage},20`} stroke={C.goldLight} strokeWidth={5} strokeLinecap="round" />
            {ruinToVillage > 0.95 ? <path d="M96,6 L118,20 L96,34 Z" fill={C.goldLight} /> : null}
          </svg>
          <span style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 52, color: C.goldLight, opacity: ruinToVillage }}>गाँव</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 34, color: C.cream, textShadow: '0 2px 12px rgba(0,0,0,0.7)', opacity: prog(f, e2.s + 110, 20) * card }}>
        एक इलाके से दूसरे इलाके तक
      </div>

      {/* e3 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 100, textAlign: 'center', opacity: window01(f, e3.s + 20, 1e9, 20, 1) }}>
        <div style={{ display: 'inline-block', padding: '18px 48px', background: 'rgba(28,20,16,0.8)', borderRadius: 16 }}>
          <TextReveal frame={f} start={e3.s + 30} text="बदलती *जलवायु* · ढलता *समाज*" size={58} />
          <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 32, color: C.sand, marginTop: 8, opacity: prog(f, e3.s + 120, 20) }}>आज की दुनिया के लिए भी एक सबक</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FinalQuestion: React.FC<{ f: number; e4: L }> = ({ f, e4 }) => {
  const cam = camAt(f, [
    [e4.s - 10, { x: 960, y: 560, z: 1.0 }],
    [e4.e + 70, { x: 960, y: 520, z: 1.1 }],
  ]);
  const dark = prog(f, e4.s + 10, 40);
  return (
    <AbsoluteFill>
      <Camera cam={cam} defs={<ArtDefs />}>
        <CityScape frame={f} id="conD" tod="dusk" decay={0.85} crowd={0} seed="cd" dust={0.4} />
      </Camera>
      <AbsoluteFill style={{ background: `rgba(16,10,7,${0.68 * dark})` }} />
      <div style={{ position: 'absolute', left: 160, right: 160, top: 360, textAlign: 'center' }}>
        <TextReveal frame={f} start={e4.s + 20} text="क्या हम उनकी कहानी से *कुछ सीख* रहे हैं?" size={80} font="serif" />
      </div>
    </AbsoluteFill>
  );
};
