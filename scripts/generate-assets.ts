import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { P, writeJSON, log } from './lib';

type LonLat = [number, number];
// ---------------------------------------------------------------------------
// Geography (lon, lat). Coordinates are approximate, hand-traced from public
// reference maps; they are illustrative, not survey-grade.
// ---------------------------------------------------------------------------
const RIVERS: Record<string, { name: string; w: number; pts: LonLat[]; paleo?: boolean }> = {
  indus: {
    name: 'सिंधु',
    w: 5,
    pts: [[81.3, 31.1], [79.6, 32.6], [77.6, 34.2], [75.6, 35.2], [74.5, 35.8], [73.4, 35.3], [72.7, 34.1], [72.2, 33.9], [71.6, 33.0], [71.0, 31.9], [70.7, 30.4], [70.4, 28.95], [69.4, 28.1], [68.9, 27.7], [68.15, 27.3], [68.0, 26.4], [68.4, 25.4], [67.9, 24.6], [67.4, 24.0]],
  },
  jhelum: { name: 'झेलम', w: 2, pts: [[75.3, 33.8], [74.8, 34.08], [73.9, 34.2], [73.5, 33.4], [73.6, 32.9], [73.0, 32.4], [72.15, 31.15]] },
  chenab: { name: 'चिनाब', w: 2.5, pts: [[76.9, 32.7], [76.0, 33.1], [75.0, 33.0], [74.5, 32.6], [73.4, 32.0], [72.15, 31.15], [71.6, 30.2], [71.0, 29.35], [70.4, 28.95]] },
  ravi: { name: 'रावी', w: 2, pts: [[76.4, 32.4], [75.7, 32.4], [75.1, 32.2], [74.3, 31.6], [73.5, 31.0], [72.86, 30.68], [72.1, 30.6], [71.9, 30.55]] },
  beas: { name: 'ब्यास', w: 1.6, pts: [[77.1, 32.25], [76.6, 31.8], [75.9, 31.8], [75.3, 31.5], [74.95, 31.15]] },
  sutlej: { name: 'सतलुज', w: 2.5, pts: [[78.5, 31.4], [77.5, 31.3], [76.6, 31.2], [76.5, 30.97], [75.6, 31.0], [74.95, 31.15], [74.6, 30.9], [73.9, 30.3], [73.1, 29.9], [72.3, 29.6], [71.7, 29.4], [71.0, 29.35]] },
  ghaggar: {
    name: 'घग्गर-हाकड़ा',
    w: 3,
    paleo: true,
    pts: [[77.0, 30.7], [76.6, 30.2], [75.9, 29.6], [75.0, 29.55], [74.13, 29.47], [73.2, 29.2], [72.3, 28.9], [71.4, 28.7], [70.6, 28.0], [69.8, 27.2], [69.5, 26.2], [69.6, 25.0], [69.8, 24.2]],
  },
  yamuna: { name: 'यमुना', w: 2.2, pts: [[78.4, 31.0], [77.7, 30.4], [77.3, 29.6], [77.25, 28.6], [77.6, 27.9], [78.0, 27.18], [79.0, 26.8], [80.0, 26.0], [81.0, 25.6], [81.84, 25.43]] },
  ganga: { name: 'गंगा', w: 3.5, pts: [[78.9, 30.95], [78.5, 30.4], [78.16, 29.95], [78.3, 29.0], [79.4, 27.8], [80.33, 26.45], [81.2, 25.8], [81.84, 25.43], [83.0, 25.3], [84.2, 25.6], [85.1, 25.6], [86.5, 25.3], [87.9, 24.8], [88.2, 23.8], [88.4, 22.6], [88.5, 21.8]] },
  narmada: { name: 'नर्मदा', w: 1.8, pts: [[81.7, 22.7], [80.0, 23.0], [78.5, 22.7], [77.0, 22.4], [75.5, 22.2], [74.0, 21.9], [73.0, 21.7]] },
};

const SITES: Record<string, { name: string; ll: LonLat; tier: number; late?: boolean }> = {
  harappa: { name: 'हड़प्पा', ll: [72.86, 30.63], tier: 1 },
  mohenjodaro: { name: 'मोहनजोदड़ो', ll: [68.14, 27.33], tier: 1 },
  rakhigarhi: { name: 'राखीगढ़ी', ll: [76.11, 29.29], tier: 1 },
  dholavira: { name: 'धोलावीरा', ll: [70.21, 23.89], tier: 1 },
  lothal: { name: 'लोथल', ll: [72.25, 22.52], tier: 1 },
  kalibangan: { name: 'कालीबंगन', ll: [74.13, 29.47], tier: 1 },
  ganweriwala: { name: 'गनेरीवाला', ll: [71.15, 28.57], tier: 2 },
  chanhudaro: { name: 'चन्हुदड़ो', ll: [68.32, 26.17], tier: 2 },
  banawali: { name: 'बनावली', ll: [75.4, 29.6], tier: 2 },
  sutkagendor: { name: 'सुत्कागेन डोर', ll: [61.95, 25.5], tier: 2 },
  shortugai: { name: 'शोर्तुगई', ll: [69.5, 37.35], tier: 2 },
  alamgirpur: { name: 'आलमगीरपुर', ll: [77.48, 29.0], tier: 2, late: true },
  rangpur: { name: 'रंगपुर', ll: [71.9, 22.4], tier: 2, late: true },
};

const LABELS: { text: string; ll: LonLat; kind: 'country' | 'sea' | 'range' }[] = [
  { text: 'आज का पाकिस्तान', ll: [66.2, 28.9], kind: 'country' },
  { text: 'भारत', ll: [79.2, 21.0], kind: 'country' },
  { text: 'अफ़ग़ानिस्तान', ll: [65.0, 34.0], kind: 'country' },
  { text: 'अरब सागर', ll: [64.0, 17.0], kind: 'sea' },
  { text: 'बंगाल की खाड़ी', ll: [88.5, 16.0], kind: 'sea' },
  { text: 'हिमालय', ll: [81.5, 31.2], kind: 'range' },
];

const HIMALAYA: LonLat[] = [[71.5, 36.4], [73.5, 36.0], [75.5, 35.0], [77.0, 33.6], [78.8, 32.0], [80.5, 30.4], [82.5, 29.3], [84.5, 28.4], [86.5, 27.9], [88.5, 27.8], [90.5, 27.9], [92.5, 28.0], [94.5, 28.6]];

const MONSOON: Record<string, LonLat[]> = {
  arabian: [[60.5, 10.5], [64.5, 15.0], [68.5, 20.0], [71.5, 25.0], [73.5, 29.0]],
  bengal: [[86.0, 12.5], [88.5, 17.5], [88.0, 22.5], [84.0, 26.0], [79.5, 28.5], [76.5, 30.0]],
};

// Schematic settlement clusters (illustrative distribution, NOT exact site data)
const CLUSTERS = {
  mature: [
    { c: [68.4, 27.0], r: 1.1, n: 14 },
    { c: [72.6, 30.4], r: 1.0, n: 12 },
    { c: [71.4, 28.7], r: 0.9, n: 16 },
    { c: [74.4, 29.4], r: 1.1, n: 14 },
    { c: [70.6, 23.5], r: 0.9, n: 9 },
    { c: [76.0, 29.4], r: 0.9, n: 10 },
  ],
  late: [
    { c: [77.3, 29.6], r: 1.2, n: 22 },
    { c: [78.2, 28.6], r: 1.0, n: 14 },
    { c: [71.6, 22.6], r: 1.2, n: 16 },
    { c: [76.0, 30.3], r: 0.9, n: 10 },
  ],
};

const TRADE_POINTS: Record<string, { name: string; ll: LonLat }> = {
  ur: { name: 'उर (मेसोपोटामिया)', ll: [46.1, 30.96] },
  dilmun: { name: 'दिलमुन (बहरीन)', ll: [50.55, 26.0] },
  lothal: { name: 'लोथल', ll: [72.25, 22.52] },
  mohenjodaro: { name: 'मोहनजोदड़ो', ll: [68.14, 27.33] },
  indusmouth: { name: '', ll: [67.4, 24.0] },
};
const TRADE_ROUTE: LonLat[] = [[67.4, 24.0], [64.5, 24.4], [61.0, 25.0], [57.5, 25.4], [56.6, 26.5], [54.5, 26.3], [51.5, 26.4], [50.55, 26.2], [49.5, 27.6], [48.4, 29.6], [47.6, 30.5], [46.1, 30.96]];
const TRADE_ROUTE_LOTHAL: LonLat[] = [[72.25, 22.52], [70.5, 21.6], [68.5, 22.8], [67.4, 24.0]];

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function buildGeo() {
  const d3 = await import('d3-geo');
  const topo = await import('topojson-client');
  const land50 = JSON.parse(fs.readFileSync(require.resolve('world-atlas/land-50m.json'), 'utf8'));
  const land = topo.feature(land50, land50.objects.land) as any;

  const make = (bbox: [LonLat, LonLat], pad: number) => {
    const box = {
      type: 'Feature',
      geometry: { type: 'MultiPoint', coordinates: [bbox[0], bbox[1]] },
      properties: {},
    } as any;
    const proj = d3.geoMercator().fitExtent([[pad, pad], [1920 - pad, 1080 - pad]], box);
    proj.clipExtent([[-400, -400], [2320, 1480]]);
    const pathGen = d3.geoPath(proj).digits(1);
    const pt = (ll: LonLat) => proj(ll)!.map((v) => Math.round(v * 10) / 10) as [number, number];
    // pixels per degree near the centre, for scatter sizing
    const c = proj.invert!([960, 540])!;
    const ppd = Math.abs(proj([c[0] + 1, c[1]])![0] - proj([c[0], c[1]])![0]);
    return { proj, pathGen, pt, ppd };
  };

  // Subcontinent map
  const sub = make([[57, 6], [97, 39]], 20);
  const rnd = mulberry32(7);
  const scatter = (cl: { c: number[]; r: number; n: number }[]) =>
    cl.flatMap((k) =>
      Array.from({ length: k.n }, () => {
        const a = rnd() * Math.PI * 2;
        const r = Math.sqrt(rnd()) * k.r;
        return sub.pt([k.c[0] + Math.cos(a) * r, k.c[1] + Math.sin(a) * r * 0.8]);
      }),
    );
  const subGeo = {
    land: sub.pathGen(land),
    ppd: sub.ppd,
    rivers: Object.fromEntries(Object.entries(RIVERS).map(([k, r]) => [k, { ...r, pts: r.pts.map(sub.pt) }])),
    sites: Object.fromEntries(Object.entries(SITES).map(([k, s]) => [k, { ...s, xy: sub.pt(s.ll) }])),
    labels: LABELS.map((l) => ({ ...l, xy: sub.pt(l.ll) })),
    himalaya: HIMALAYA.map(sub.pt),
    monsoon: Object.fromEntries(Object.entries(MONSOON).map(([k, v]) => [k, v.map(sub.pt)])),
    mature: scatter(CLUSTERS.mature),
    late: scatter(CLUSTERS.late),
  };

  // Trade map (Mesopotamia ↔ Indus)
  const tr = make([[43, 18], [76, 35]], 40);
  const tradeGeo = {
    land: tr.pathGen(land),
    points: Object.fromEntries(Object.entries(TRADE_POINTS).map(([k, s]) => [k, { ...s, xy: tr.pt(s.ll) }])),
    route: TRADE_ROUTE.map(tr.pt),
    routeLothal: TRADE_ROUTE_LOTHAL.map(tr.pt),
    indus: RIVERS.indus.pts.map(tr.pt),
    tigris: ([[42.5, 37.0], [43.2, 36.3], [44.2, 34.6], [44.4, 33.3], [45.6, 32.5], [46.6, 31.3], [47.4, 31.0], [48.0, 30.4]] as LonLat[]).map(tr.pt),
    euphrates: ([[38.5, 36.0], [40.1, 35.0], [41.3, 34.4], [42.8, 33.7], [44.3, 32.6], [45.3, 31.6], [46.1, 31.0], [47.4, 31.0]] as LonLat[]).map(tr.pt),
  };
  writeJSON(P.geo, { sub: subGeo, trade: tradeGeo });
  log(`geo.json written (land path ${(subGeo.land!.length / 1024).toFixed(0)} KB)`);
}

// ---------------------------------------------------------------------------
// Minimal PNG encoder + procedural textures
// ---------------------------------------------------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf: Buffer) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function png(file: string, w: number, h: number, channels: 3 | 4, data: Uint8Array) {
  const chunk = (type: string, body: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const tb = Buffer.concat([Buffer.from(type, 'ascii'), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(tb));
    return Buffer.concat([len, tb, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = channels === 4 ? 6 : 2;
  const raw = Buffer.alloc((w * channels + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * channels + 1)] = 0;
    Buffer.from(data.buffer, data.byteOffset + y * w * channels, w * channels).copy(raw, y * (w * channels + 1) + 1);
  }
  const out = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, out);
}

function valueNoise(seed: number, w: number, h: number, cell: number) {
  const r = mulberry32(seed);
  const gw = Math.ceil(w / cell) + 2;
  const gh = Math.ceil(h / cell) + 2;
  const g = Float32Array.from({ length: gw * gh }, () => r());
  const out = new Float32Array(w * h);
  const s = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < h; y++) {
    const gy = y / cell;
    const y0 = Math.floor(gy);
    const fy = s(gy - y0);
    for (let x = 0; x < w; x++) {
      const gx = x / cell;
      const x0 = Math.floor(gx);
      const fx = s(gx - x0);
      const a = g[y0 * gw + x0];
      const b = g[y0 * gw + x0 + 1];
      const c = g[(y0 + 1) * gw + x0];
      const d = g[(y0 + 1) * gw + x0 + 1];
      out[y * w + x] = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    }
  }
  return out;
}

function buildTextures() {
  fs.mkdirSync(P.assetsDir, { recursive: true });
  // film grain tiles (grey noise for overlay blending)
  for (let i = 0; i < 6; i++) {
    const f = path.join(P.assetsDir, `grain_${i}.png`);
    if (fs.existsSync(f)) continue;
    const S = 512;
    const r = mulberry32(100 + i);
    const d = new Uint8Array(S * S * 4);
    for (let p = 0; p < S * S; p++) {
      const v = Math.max(0, Math.min(255, 128 + (r() + r() + r() - 1.5) * 120));
      d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = v;
      d[p * 4 + 3] = 255;
    }
    png(f, S, S, 4, d);
  }
  // parchment/paper texture (alpha mask of stains + fibres, tinted in CSS)
  const pf = path.join(P.assetsDir, 'paper.png');
  if (!fs.existsSync(pf)) {
    const W = 1920;
    const H = 1080;
    const n1 = valueNoise(3, W, H, 260);
    const n2 = valueNoise(5, W, H, 60);
    const n3 = valueNoise(9, W, H, 9);
    const r = mulberry32(11);
    const d = new Uint8Array(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      const v = n1[i] * 0.55 + n2[i] * 0.3 + n3[i] * 0.15 + (r() - 0.5) * 0.08;
      const a = Math.max(0, Math.min(1, (v - 0.35) * 1.6));
      d[i * 4] = 90;
      d[i * 4 + 1] = 55;
      d[i * 4 + 2] = 25;
      d[i * 4 + 3] = Math.round(a * 110);
    }
    // a few fibres
    for (let k = 0; k < 700; k++) {
      let x = r() * W;
      let y = r() * H;
      const ang = r() * Math.PI * 2;
      const len = 10 + r() * 50;
      for (let s = 0; s < len; s++) {
        x += Math.cos(ang + Math.sin(s * 0.2) * 0.3);
        y += Math.sin(ang + Math.sin(s * 0.2) * 0.3);
        const xi = Math.round(x);
        const yi = Math.round(y);
        if (xi < 0 || yi < 0 || xi >= W || yi >= H) break;
        const o = (yi * W + xi) * 4;
        d[o + 3] = Math.min(255, d[o + 3] + 28);
      }
    }
    png(pf, W, H, 4, d);
  }
  log('textures ready (grain tiles, paper)');
}

function copyFonts() {
  fs.mkdirSync(P.fontsDir, { recursive: true });
  const files = [
    ['@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2', 'NotoSansDeva-400-deva.woff2'],
    ['@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-latin-400-normal.woff2', 'NotoSansDeva-400-latin.woff2'],
    ['@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-600-normal.woff2', 'NotoSansDeva-600-deva.woff2'],
    ['@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-latin-600-normal.woff2', 'NotoSansDeva-600-latin.woff2'],
    ['@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-700-normal.woff2', 'NotoSansDeva-700-deva.woff2'],
    ['@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-latin-700-normal.woff2', 'NotoSansDeva-700-latin.woff2'],
    ['@fontsource/tiro-devanagari-hindi/files/tiro-devanagari-hindi-devanagari-400-normal.woff2', 'TiroDevaHindi-400-deva.woff2'],
    ['@fontsource/tiro-devanagari-hindi/files/tiro-devanagari-hindi-latin-400-normal.woff2', 'TiroDevaHindi-400-latin.woff2'],
  ];
  for (const [src, dst] of files) fs.copyFileSync(require.resolve(src), path.join(P.fontsDir, dst));
  log(`fonts copied (${files.length} files, SIL OFL 1.1)`);
}

export async function generateAssets() {
  await buildGeo();
  buildTextures();
  copyFonts();
}

if (require.main === module) generateAssets().catch((e) => {
  console.error(e);
  process.exit(1);
});
