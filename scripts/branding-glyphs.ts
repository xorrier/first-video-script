/**
 * Converts brand text (logo glyph, wordmark, tagline) into SVG path data with fontkit's OpenType
 * shaper, so the logo/banner SVGs render identically everywhere – no font installation needed.
 * Output: src/branding/glyphs.json (consumed by the React brand components).
 */
import fs from 'node:fs';
import path from 'node:path';
import * as fontkit from 'fontkit';
import { ROOT } from './lib';

const FS = path.join(ROOT, 'node_modules', '@fontsource');
export const FONTS = {
  tiroDeva: path.join(FS, 'tiro-devanagari-hindi', 'files', 'tiro-devanagari-hindi-devanagari-400-normal.woff2'),
  tiroLatin: path.join(FS, 'tiro-devanagari-hindi', 'files', 'tiro-devanagari-hindi-latin-400-normal.woff2'),
  notoDeva600: path.join(FS, 'noto-sans-devanagari', 'files', 'noto-sans-devanagari-devanagari-600-normal.woff2'),
  notoDeva700: path.join(FS, 'noto-sans-devanagari', 'files', 'noto-sans-devanagari-devanagari-700-normal.woff2'),
  notoLatin600: path.join(FS, 'noto-sans-devanagari', 'files', 'noto-sans-devanagari-latin-600-normal.woff2'),
};

export type GlyphText = { d: string; width: number; ascent: number; descent: number; top: number; bottom: number; size: number };

const cache = new Map<string, any>();
const open = (f: string) => {
  if (!cache.has(f)) cache.set(f, (fontkit as any).openSync(f));
  return cache.get(f);
};

/**
 * Shape `text` and return one combined path. Origin = left end of the baseline, y down (SVG).
 * Spaces are not in the Devanagari subset files, so words are laid out separately.
 */
export function textToPath(fontFile: string, text: string, size: number, opts: { tracking?: number; space?: number } = {}): GlyphText {
  const font = open(fontFile);
  const s = size / font.unitsPerEm;
  const tracking = (opts.tracking ?? 0) * size;
  const spaceW = (opts.space ?? 0.26) * size;
  let x = 0;
  const parts: string[] = [];
  let top = Infinity;
  let bottom = -Infinity;
  text.split(' ').forEach((word, wi) => {
    if (wi > 0) x += spaceW;
    const run = font.layout(word);
    run.glyphs.forEach((g: any, i: number) => {
      const p = run.positions[i];
      const gx = x + p.xOffset * s;
      const gy = -p.yOffset * s;
      const cmds: string[] = [];
      for (const c of g.path.commands) {
        const a = c.args;
        const pt = (j: number) => `${(gx + a[j] * s).toFixed(2)} ${(gy - a[j + 1] * s).toFixed(2)}`;
        if (c.command === 'moveTo') cmds.push(`M${pt(0)}`);
        else if (c.command === 'lineTo') cmds.push(`L${pt(0)}`);
        else if (c.command === 'quadraticCurveTo') cmds.push(`Q${pt(0)} ${pt(2)}`);
        else if (c.command === 'bezierCurveTo') cmds.push(`C${pt(0)} ${pt(2)} ${pt(4)}`);
        else if (c.command === 'closePath') cmds.push('Z');
      }
      if (cmds.length) {
        parts.push(cmds.join(''));
        const bb = g.path.bbox;
        top = Math.min(top, gy - bb.maxY * s);
        bottom = Math.max(bottom, gy - bb.minY * s);
      }
      x += p.xAdvance * s + tracking;
    });
  });
  if (tracking) x -= tracking;
  return { d: parts.join(''), width: x, ascent: font.ascent * s, descent: -font.descent * s, top, bottom, size };
}

export function buildBrandGlyphs() {
  const out = {
    logoGlyph: textToPath(FONTS.tiroDeva, 'श', 1000),
    wordmarkDeva: textToPath(FONTS.tiroDeva, 'शिलालेख', 1000),
    wordmarkLatin: textToPath(FONTS.tiroLatin, 'SHILALEKH', 1000, { tracking: 0.32 }),
    tagline: textToPath(FONTS.notoDeva600, 'इतिहास की अनसुनी कहानियाँ', 1000, { space: 0.3 }),
  };
  const file = path.join(ROOT, 'src', 'branding', 'glyphs.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out));
  return out;
}

if (require.main === module) {
  const g = buildBrandGlyphs();
  for (const [k, v] of Object.entries(g)) console.log(k, `w=${v.width.toFixed(0)} top=${v.top.toFixed(0)} bottom=${v.bottom.toFixed(0)} pathLen=${v.d.length}`);
}
