import React from 'react';
import { AbsoluteFill } from 'remotion';
import { B } from './brand';
import { LogoSvg } from './Logo';
import { BannerSvg, SAFE, TABLET, DESKTOP, BANNER_W, BANNER_H } from './Banner';
import { ThumbnailFrame, ThumbGuideOverlay, THUMB_W, THUMB_H } from './Thumbnail';
import { THUMBS } from './thumbnails';
import { G, VText } from './brand';
import { FONT_SANS, FONT_SERIF } from '../theme';

const Center: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: bg }}>{children}</AbsoluteFill>
);

/** YouTube shows avatars as circles: preview at real sizes on light + dark UI. */
export const LogoSizeTest: React.FC = () => {
  const sizes = [400, 176, 98, 48, 32];
  const row = (bg: string, fg: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 56, padding: '40px 60px', background: bg }}>
      {sizes.map((s) => (
        <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: s, height: s, borderRadius: '50%', overflow: 'hidden' }}>
            <LogoSvg size={s} id={`t${s}${bg.slice(1)}`} />
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 18, color: fg }}>{s}px</div>
        </div>
      ))}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      {row('#FFFFFF', '#606060')}
      {row('#0F0F0F', '#AAAAAA')}
    </AbsoluteFill>
  );
};

const thumbEl = (i: number, id: string) => {
  const t = THUMBS[i];
  return <ThumbnailFrame id={id} art={<t.Art />} kicker={t.kicker} lines={t.lines} headlineSize={t.headlineSize} />;
};

/** How the ep01 thumbnail reads at real YouTube sizes (home grid, sidebar, mobile list). */
export const ThumbSmallSizeTest: React.FC = () => {
  const sizes = [[640, 360, 'Home grid / TV  640×360'], [360, 202, 'Search  360×202'], [246, 138, 'Mobile list  246×138'], [168, 94, 'Up next  168×94']] as const;
  return (
    <AbsoluteFill style={{ background: '#0F0F0F', flexDirection: 'row', alignItems: 'flex-start', gap: 40, padding: 50, flexWrap: 'wrap' }}>
      {sizes.map(([w, h, label], k) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: w, height: h, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: THUMB_W, height: THUMB_H, transform: `scale(${w / THUMB_W})`, transformOrigin: '0 0', position: 'absolute' }}>{thumbEl(0, `ss${k}`)}</div>
            <div style={{ position: 'absolute', right: 6, bottom: 6, background: 'rgba(0,0,0,0.8)', color: '#fff', fontFamily: 'Arial', fontSize: 13, fontWeight: 700, padding: '1px 4px', borderRadius: 4 }}>5:03</div>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 18, color: '#AAA' }}>{label}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const SWATCHES: [keyof typeof B, string][] = [
  ['charcoal', 'Primary dark background'],
  ['night', 'Deepest shadow, silhouettes'],
  ['umber', 'Secondary dark, gradients'],
  ['terracotta', 'Brand primary: seal, highlight blocks'],
  ['terracottaLight', 'Seal highlight, warm light'],
  ['brickDark', 'Carved lines, pressed states'],
  ['parchment', 'Text/mark on dark, paper'],
  ['parchmentDark', 'Secondary text, aged paper'],
  ['cream', 'Thumbnail headline text'],
  ['gold', 'Accents, tagline, discoveries'],
  ['teal', 'Rivers/water only (rare accent)'],
];

/** Palette + typography spec sheet, including a vector-vs-live Devanagari shaping check. */
export const PaletteTypeSheet: React.FC = () => (
  <AbsoluteFill style={{ background: B.charcoal, padding: 70, color: B.parchment, fontFamily: FONT_SANS }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      <LogoSvg size={110} background={false} id="ps" />
      <div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 64, lineHeight: 1.3 }}>इतिहासनामा — ब्रांड गाइड</div>
        <div style={{ fontSize: 24, color: B.parchmentDark, letterSpacing: 4 }}>ITIHASNAMA · COLOUR & TYPE</div>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18, marginTop: 44 }}>
      {SWATCHES.map(([k, role]) => (
        <div key={k} style={{ background: '#251E1A', borderRadius: 14, overflow: 'hidden', border: '1px solid #3A302A' }}>
          <div style={{ height: 96, background: B[k] }} />
          <div style={{ padding: '10px 14px 14px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700 }}>{B[k]}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 16, color: B.gold }}>{k}</div>
            <div style={{ fontFamily: 'Arial', fontSize: 15, color: B.parchmentDark, marginTop: 4, lineHeight: 1.3 }}>{role}</div>
          </div>
        </div>
      ))}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 46 }}>
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: 18, color: B.gold }}>DISPLAY / WORDMARK — Tiro Devanagari Hindi 400</div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 92, lineHeight: 1.35 }}>इतिहासनामा</div>
        <div style={{ fontFamily: 'monospace', fontSize: 18, color: B.gold, marginTop: 16 }}>HEADLINES — Noto Sans Devanagari 700</div>
        <div style={{ fontWeight: 700, fontSize: 64, lineHeight: 1.35, color: B.cream }}>
          सभ्यता का <span style={{ background: B.terracotta, padding: '0 14px 6px', borderRadius: 8 }}>अंत कैसे?</span>
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: 18, color: B.gold }}>TAGLINE / LABELS — Noto Sans Devanagari 600</div>
        <div style={{ fontWeight: 600, fontSize: 46, lineHeight: 1.45, color: B.gold }}>इतिहास की अनसुनी कहानियाँ</div>
        <div style={{ fontFamily: 'monospace', fontSize: 18, color: B.gold, marginTop: 16 }}>BODY / SUBTITLES — Noto Sans Devanagari 400</div>
        <div style={{ fontWeight: 400, fontSize: 30, lineHeight: 1.5, color: B.parchment }}>लगभग 4,500 साल पहले सिंधु नदी के किनारे बड़े शहर बसे थे।</div>
        <div style={{ fontFamily: 'monospace', fontSize: 18, color: B.gold, marginTop: 22 }}>SHAPING QA — top: vector paths (fontkit) · bottom: live browser text</div>
        <svg width={760} height={150} viewBox="0 0 760 150" style={{ display: 'block', marginTop: 8 }}>
          <VText g={G.tagline} x={0} y={52} size={46} fill={B.parchment} />
          <text x={0} y={128} fontFamily={FONT_SANS} fontWeight={600} fontSize={46} fill={B.parchment}>इतिहास की अनसुनी कहानियाँ</text>
        </svg>
      </div>
    </div>
  </AbsoluteFill>
);

export const BannerSafeAreaGuide: React.FC = () => {
  const zones = [
    { r: { x: 0, y: 0, w: BANNER_W, h: BANNER_H }, c: '#7FD1FF', label: 'TV  2560×1440 (whole image)' },
    { r: DESKTOP, c: '#FFD166', label: 'Desktop max  2560×423' },
    { r: TABLET, c: '#9BE564', label: 'Tablet  1855×423' },
    { r: SAFE, c: '#FF6B6B', label: 'Mobile / text & logo safe area  1546×423' },
  ];
  return (
    <AbsoluteFill>
      <BannerSvg id="bg" />
      <svg viewBox={`0 0 ${BANNER_W} ${BANNER_H}`} style={{ position: 'absolute', inset: 0 }}>
        <path fillRule="evenodd" d={`M0 0H${BANNER_W}V${BANNER_H}H0Z M${DESKTOP.x} ${DESKTOP.y}h${DESKTOP.w}v${DESKTOP.h}h-${DESKTOP.w}Z`} fill="#000" opacity={0.45} />
        {zones.map((z, i) => (
          <g key={i}>
            <rect x={z.r.x + 4} y={z.r.y + 4} width={z.r.w - 8} height={z.r.h - 8} fill="none" stroke={z.c} strokeWidth={6} strokeDasharray={i === 3 ? undefined : '24 14'} />
            <text x={z.r.x + 24} y={i === 0 ? 60 : i === 1 ? z.r.y - 20 : i === 2 ? z.r.y + z.r.h + 50 : z.r.y + z.r.h + 100} fill={z.c} fontFamily="monospace" fontSize={40} fontWeight={700}>
              {z.label}
            </text>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
export const STILLS = {
  BrandLogo: { w: 800, h: 800, C: () => <LogoSvg size={800} /> },
  BrandLogoTransparent: { w: 1024, h: 1024, C: () => <LogoSvg size={1024} background={false} id="lt" /> },
  BrandWatermark: { w: 150, h: 150, C: () => <LogoSvg size={150} background={false} id="wm" /> },
  BrandLogoSizeTest: { w: 1460, h: 1000, C: LogoSizeTest },
  BrandBanner: { w: BANNER_W, h: BANNER_H, C: () => <BannerSvg /> },
  BrandBannerSafeArea: { w: BANNER_W, h: BANNER_H, C: BannerSafeAreaGuide },
  ...Object.fromEntries(THUMBS.map((t, i) => [t.id, { w: THUMB_W, h: THUMB_H, C: () => thumbEl(i, t.id) }])),
  ThumbTemplateBlank: { w: THUMB_W, h: THUMB_H, C: () => <ThumbnailFrame id="blank" lines={[]} /> },
  ThumbTemplateGuide: {
    w: THUMB_W,
    h: THUMB_H,
    C: () => (
      <AbsoluteFill>
        {thumbEl(0, 'guide')}
        <ThumbGuideOverlay />
      </AbsoluteFill>
    ),
  },
  ThumbSmallSizeTest: { w: 1460, h: 700, C: ThumbSmallSizeTest },
  BrandPaletteType: { w: 1800, h: 1240, C: PaletteTypeSheet },
} as Record<string, { w: number; h: number; C: React.FC }>;

