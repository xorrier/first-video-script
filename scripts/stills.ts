/**
 * Render preview stills of the Documentary composition.
 *   npx tsx scripts/stills.ts 100 450 2400        (global frames)
 *   npx tsx scripts/stills.ts --scene city 0 300   (scene-relative frames)
 * Output: output/stills/f<frame>.jpg at half resolution.
 */
import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import timeline from '../src/data/timeline.json';

async function main() {
  const args = process.argv.slice(2);
  let offset = 0;
  const si = args.indexOf('--scene');
  if (si >= 0) {
    const sc = timeline.scenes.find((s) => s.id === args[si + 1]);
    if (!sc) throw new Error(`unknown scene ${args[si + 1]}`);
    offset = sc.from;
    args.splice(si, 2);
  }
  const scale = Number(process.env.STILL_SCALE ?? 0.5);
  const frames = args.map((a) => Number(a) + offset);
  const root = path.resolve(__dirname, '..');
  const outDir = path.join(root, 'output', 'stills');
  fs.mkdirSync(outDir, { recursive: true });
  const serveUrl = await bundle({ entryPoint: path.join(root, 'src', 'index.ts'), publicDir: path.join(root, 'public') });
  const composition = await selectComposition({ serveUrl, id: 'Documentary', inputProps: { previewAudio: false } });
  for (const frame of frames) {
    const output = path.join(outDir, `f${frame}.jpg`);
    const t0 = Date.now();
    await renderStill({ serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 85, scale, inputProps: { previewAudio: false } });
    console.log(`frame ${frame} → ${path.relative(root, output)} (${Date.now() - t0} ms)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
