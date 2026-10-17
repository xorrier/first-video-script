/**
 * Render the Shilalekh brand kit into branding/.
 *   npm run branding                    all assets
 *   npm run branding -- BrandLogo       only selected still ids
 */
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { ROOT, run, ffprobePath } from './lib';
import { buildBrandGlyphs } from './branding-glyphs';
import { THUMBS } from '../src/branding/thumbnails';

const OUT = path.join(ROOT, 'branding');

type Job = { id: string; out: string; format: 'png' | 'jpeg'; quality?: number; maxMB?: number };
export const JOBS: Job[] = [
  { id: 'BrandLogo', out: 'logo/shilalekh_logo_800.png', format: 'png' },
  { id: 'BrandLogoTransparent', out: 'logo/shilalekh_logo_transparent_1024.png', format: 'png' },
  { id: 'BrandWatermark', out: 'logo/shilalekh_watermark_150.png', format: 'png' },
  { id: 'BrandLogoSizeTest', out: 'logo/logo_size_test.png', format: 'png' },
  { id: 'BrandBanner', out: 'banner/shilalekh_banner_2560x1440.jpg', format: 'jpeg', quality: 92, maxMB: 6 },
  { id: 'BrandBannerSafeArea', out: 'banner/banner_safe_area_guide.jpg', format: 'jpeg', quality: 85 },
  ...THUMBS.map((t): Job => ({ id: t.id, out: t.file, format: 'jpeg', quality: 90, maxMB: 2 })),
  { id: 'ThumbTemplateBlank', out: 'thumbnails/thumbnail_template_blank.png', format: 'png' },
  { id: 'ThumbTemplateGuide', out: 'thumbnails/thumbnail_template_guide.png', format: 'png' },
  { id: 'ThumbSmallSizeTest', out: 'thumbnails/thumbnail_small_size_test.png', format: 'png' },
  { id: 'BrandPaletteType', out: 'brand_palette_typography.png', format: 'png' },
];

async function exportSvgs() {
  // Pure SVG components (no Remotion hooks) → standalone files with text already converted to paths.
  const { LogoSvg } = await import('../src/branding/Logo');
  const { BannerSvg } = await import('../src/branding/Banner');
  const files: [string, React.ReactElement][] = [
    ['logo/shilalekh_logo.svg', React.createElement(LogoSvg, { size: 1000 })],
    ['logo/shilalekh_logo_transparent.svg', React.createElement(LogoSvg, { size: 1000, background: false, id: 'lt' })],
    ['banner/shilalekh_banner.svg', React.createElement(BannerSvg, { id: 'bn' })],
  ];
  for (const [rel, el] of files) {
    const f = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, '<?xml version="1.0" encoding="UTF-8"?>\n' + renderToStaticMarkup(el));
    console.log(`  svg  ${rel} (${(fs.statSync(f).size / 1024).toFixed(0)} KB)`);
  }
}

async function main() {
  const only = process.argv.slice(2);
  console.log('[1] Shaping brand text into vector paths (fontkit)');
  buildBrandGlyphs();
  console.log('[2] Bundling');
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: path.join(ROOT, 'public') });
  console.log('[3] Rendering stills');
  const problems: string[] = [];
  for (const j of JOBS.filter((x) => !only.length || only.includes(x.id))) {
    const composition = await selectComposition({ serveUrl, id: j.id });
    const output = path.join(OUT, j.out);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    await renderStill({ serveUrl, composition, output, imageFormat: j.format, jpegQuality: j.quality, overwrite: true });
    const mb = fs.statSync(output).size / 2 ** 20;
    const probe = JSON.parse(run(ffprobePath(), ['-v', 'error', '-show_streams', '-of', 'json', output]).stdout.toString()).streams[0];
    const ok = probe.width === composition.width && probe.height === composition.height && (!j.maxMB || mb <= j.maxMB);
    if (!ok) problems.push(`${j.out}: ${probe.width}×${probe.height}, ${mb.toFixed(2)} MB`);
    console.log(`  ${ok ? '✔' : '✘'} ${j.out.padEnd(52)} ${probe.width}×${probe.height}  ${mb.toFixed(2)} MB${j.maxMB ? ` (limit ${j.maxMB} MB)` : ''}`);
  }
  if (!only.length) {
    console.log('[4] Exporting standalone SVGs');
    await exportSvgs();
  }
  if (problems.length) {
    console.error('Problems:\n  ' + problems.join('\n  '));
    process.exit(2);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
