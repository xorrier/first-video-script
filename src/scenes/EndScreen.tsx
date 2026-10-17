import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Camera } from '../components/Camera';
import { Parchment } from '../components/Overlay';
import { Dust } from '../components/Particles';
import { ArtDefs } from '../components/art/Buildings';
import { CityScape } from '../components/art/CityScape';
import { SIGNS } from '../components/art/Props';
import script from '../data/script.json';
import { C, FONT_SANS, FONT_SERIF } from '../theme';
import { easeOut, prog } from '../utils/animation';
import { useLine, useSceneFrame } from '../utils/timing';

const META = script.meta;
const TW = 800;
const TH = 450;

export const EndScreen: React.FC = () => {
  const f = useSceneFrame();
  const x1 = useLine('x1');
  const thumb = prog(f, 10, 30, easeOut);
  const brand = prog(f, 24, 30, easeOut);
  const sub = prog(f, x1.s + 30, 20, easeOut);
  const pulse = sub >= 1 ? 1 + 0.04 * Math.max(0, Math.sin((f - x1.s - 50) * 0.13)) : 1;
  const ring = sub >= 1 ? ((f - x1.s - 50) % 60) / 60 : 0;
  return (
    <AbsoluteFill>
      <Parchment />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <Dust frame={f} count={30} color="#8C6A3E" opacity={0.22} size={[1, 2.2]} wind={0.2} seed={61} />
      </svg>

      {/* next video slot (keep clear for YouTube end-screen element) */}
      <div style={{ position: 'absolute', left: 150, top: 250, opacity: thumb, transform: `translateY(${(1 - thumb) * 30}px)` }}>
        <div style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 30, letterSpacing: 1, color: C.brickDark, marginBottom: 14 }}>अगला वीडियो</div>
        <div style={{ position: 'relative', width: TW, height: TH, overflow: 'hidden', borderRadius: 14, boxShadow: '0 18px 40px rgba(60,35,20,0.35)', border: `4px solid ${C.cream}` }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${TW / 1920})`, transformOrigin: '0 0' }}>
            <Camera cam={{ x: 900 + f * 0.6, y: 600, z: 1.15 }} defs={<ArtDefs />}>
              <CityScape frame={f + 500} id="endT" tod="day" crowd={0.8} seed="et" dust={0.2} />
            </Camera>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '50px 28px 20px', background: 'linear-gradient(180deg, rgba(20,12,8,0) 0%, rgba(20,12,8,0.85) 100%)' }}>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 44, color: C.cream, lineHeight: 1.2 }}>{META.nextVideoTitle}</div>
          </div>
          <div style={{ position: 'absolute', left: TW / 2 - 44, top: TH / 2 - 70, width: 88, height: 88, borderRadius: 44, background: 'rgba(20,12,8,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={40} height={40} viewBox="0 0 40 40">
              <path d="M12,6 L34,20 L12,34 Z" fill={C.cream} />
            </svg>
          </div>
        </div>
      </div>

      {/* brand */}
      <div style={{ position: 'absolute', left: 1080, top: 250, width: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: brand, transform: `translateY(${(1 - brand) * 30}px)` }}>
        <svg width={200} height={200} viewBox="-100 -100 200 200">
          <circle r={92} fill={C.brickDark} />
          <circle r={80} fill="none" stroke={C.goldLight} strokeWidth={3} opacity={0.7} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M-52,${-22 + i * 22} Q0,${-32 + i * 22} 52,${-22 + i * 22}`} stroke={C.goldLight} strokeWidth={4} fill="none" opacity={0.35 + i * 0.25} />
          ))}
          <g transform="translate(0 30) scale(1.1)">
            <path d={SIGNS[3]} stroke={C.cream} strokeWidth={3.2} fill="none" strokeLinecap="round" />
          </g>
        </svg>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 76, color: C.ink, marginTop: 18, lineHeight: 1.2 }}>{META.channelName}</div>
        <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 32, color: C.brown, marginTop: 6 }}>{META.channelTagline}</div>
        <div style={{ position: 'relative', marginTop: 44, opacity: sub, transform: `scale(${(0.9 + 0.1 * sub) * pulse})` }}>
          {ring > 0 ? <div style={{ position: 'absolute', inset: -10 - ring * 26, borderRadius: 60, border: `3px solid ${C.red}`, opacity: 0.5 * (1 - ring) }} /> : null}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 46px', background: '#C4302B', borderRadius: 50, boxShadow: '0 10px 24px rgba(196,48,43,0.35)' }}>
            <svg width={34} height={34} viewBox="0 0 24 24">
              <path d="M12 2a6 6 0 0 0-6 6v4l-2 3v1h16v-1l-2-3V8a6 6 0 0 0-6-6zm0 20a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22z" fill="#fff" />
            </svg>
            <span style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 40, color: '#fff' }}>सब्सक्राइब करें</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
