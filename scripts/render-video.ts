/**
 * One-command pipeline: script → narration → timeline/subtitles → music/SFX → render → mix → validate.
 *
 *   npm run video                  full-quality 1920×1080 render
 *   npm run video:draft            half-resolution quick render (960×540) for review
 *
 * Flags:  --draft  --force (ignore render cache)  --concurrency=N  --chunk=FRAMES
 *         --reuse-before=FRAME  keep cached chunks that end before FRAME even though the source changed
 *                               (use only when your edit cannot affect earlier frames, e.g. end-screen tweaks)
 *
 * The render is split into chunks that are cached by a hash of the source code, so an interrupted
 * run resumes where it stopped and unchanged chunks are never rendered twice.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  P, ROOT, Script, readJSON, writeJSON, log, step, warn, warnings, ffmpegPath, ffprobePath, run, hashOf,
} from './lib';
import { generateAssets } from './generate-assets';
import { generateNarration, buildTimeline } from './generate-audio';
import { generateMusic } from './generate-music';

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string, d: number) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? Number(a.split('=')[1]) : d;
};
const DRAFT = flag('draft');
const FORCE = flag('force');
const CONCURRENCY = opt('concurrency', Math.max(1, Math.min(4, Math.floor(os.cpus().length / 2))));
const CHUNK = opt('chunk', 900);
const REUSE_BEFORE = opt('reuse-before', 0);
const SCALE = DRAFT ? 0.5 : 1;
const CRF = DRAFT ? 26 : 18;
const SCENE_IDS = ['hook', 'context', 'city', 'change', 'mystery', 'conclusion', 'end'];

const OUT = {
  final: path.join(P.output, DRAFT ? 'indus_valley_documentary_hi_draft.mp4' : 'indus_valley_documentary_hi.mp4'),
  silent: path.join(P.cache, DRAFT ? 'video_silent_draft.mp4' : 'video_silent.mp4'),
  chunks: path.join(P.cache, DRAFT ? 'chunks-draft' : 'chunks'),
  srt: path.join(P.output, 'subtitles_hi.srt'),
  contact: path.join(P.output, DRAFT ? 'contact_sheet_draft.jpg' : 'contact_sheet.jpg'),
  fontTest: path.join(P.output, 'font_test.png'),
  report: path.join(P.output, 'render_report.json'),
};

const fmtTime = (s: number) => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, '0')}s`;

function hashTree(dirs: string[]): string {
  const parts: string[] = [];
  const walk = (d: string) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else parts.push(`${path.relative(ROOT, f)}:${hashOf(fs.readFileSync(f).toString('base64'))}`);
    }
  };
  dirs.forEach(walk);
  return hashOf(parts.join('\n'));
}

function probe(file: string) {
  const r = run(ffprobePath(), ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  return JSON.parse(r.stdout.toString());
}

// ------------------------------------------------------------------------------------------------
async function main() {
  const t0 = Date.now();
  console.log(`\x1b[1mIndus Valley documentary – ${DRAFT ? 'DRAFT (960×540)' : 'FULL (1920×1080)'} render\x1b[0m`);
  fs.mkdirSync(P.output, { recursive: true });
  fs.mkdirSync(P.cache, { recursive: true });

  // 1 ── environment
  step(1, 'Checking dependencies');
  const [maj] = process.versions.node.split('.').map(Number);
  if (maj < 18) throw new Error(`Node.js 18+ required (found ${process.version})`);
  log(`node ${process.version}, ${os.cpus().length} CPUs, ${(os.freemem() / 2 ** 30).toFixed(1)} GB free RAM`);
  const ff = ffmpegPath();
  const fp = ffprobePath();
  log(`ffmpeg: ${ff}`);
  if (spawnSync(fp, ['-version']).status !== 0) throw new Error('ffprobe not found. Run `npm install` or set FFPROBE_PATH.');
  log(`ffprobe: ${fp}`);
  const script = readJSON<Script>(P.script);
  if (script.tts.engine === 'edge') {
    const py = process.env.PYTHON ?? 'python';
    const r = spawnSync(py, ['-c', 'import edge_tts']);
    if (r.status !== 0) {
      warn('edge-tts (Python) not available – narration falls back to cached/imported audio or silent timing.');
    } else log('edge-tts available');
  } else log(`TTS engine: ${script.tts.engine}`);

  // 2 ── script validation
  step(2, 'Validating narration script');
  const ids = new Set<string>();
  const sceneIds = script.scenes.map((s) => s.id);
  for (const id of SCENE_IDS) if (!sceneIds.includes(id)) throw new Error(`script.json is missing scene "${id}"`);
  for (const id of sceneIds) if (!SCENE_IDS.includes(id)) throw new Error(`script.json has unknown scene "${id}" (no component)`);
  for (const sc of script.scenes) {
    if (!sc.lines.length) throw new Error(`scene "${sc.id}" has no narration lines`);
    for (const l of sc.lines) {
      if (ids.has(l.id)) throw new Error(`duplicate line id "${l.id}"`);
      ids.add(l.id);
      if (!l.text?.trim()) throw new Error(`line "${l.id}" is empty`);
      if (!/[\u0900-\u097F]/.test(l.text)) warn(`line "${l.id}" contains no Devanagari text`);
    }
  }
  const words = script.scenes.flatMap((s) => s.lines).reduce((n, l) => n + l.text.split(/\s+/).length, 0);
  log(`${script.scenes.length} scenes, ${ids.size} lines, ~${words} words`);

  // 3 ── procedural assets
  step(3, 'Generating procedural assets (map geometry, textures, fonts)');
  await generateAssets();

  // 4/5 ── narration + timeline + subtitles
  step(4, 'Generating narration');
  let info;
  try {
    info = generateNarration(script);
  } catch (e) {
    warn(`Narration engine failed: ${(e as Error).message.split('\n')[0]}`);
    warn('Continuing with estimated timings and NO narration. Fix TTS or add recordings to public/audio/narration-import/.');
    script.tts.engine = 'none';
    info = generateNarration(script);
  }
  step(5, 'Building timeline and subtitles');
  const { timeline, cues } = buildTimeline(script, info);
  for (const s of timeline.scenes) log(`${s.id.padEnd(11)} ${fmtTime(s.start).padStart(7)} → ${fmtTime(s.end).padStart(7)}`);
  log(`total ${timeline.totalSec.toFixed(1)}s (${timeline.durationInFrames} frames), ${cues.length} subtitle cues`);
  if (!timeline.hasNarration) warn('Video has no narration track (TTS unavailable).');
  if (Math.abs(timeline.totalSec - script.meta.targetDurationSec) > 30)
    warn(`Duration ${timeline.totalSec.toFixed(0)}s differs from target ${script.meta.targetDurationSec}s by >30s`);
  if (!fs.existsSync(OUT.srt)) throw new Error('SRT export failed');
  log(`SRT → ${path.relative(ROOT, OUT.srt)}`);

  // 6 ── music + sfx
  step(6, 'Synthesising music and sound effects');
  generateMusic();

  // 7 ── bundle + font check
  step(7, 'Bundling Remotion project and testing Hindi fonts');
  const { bundle } = await import('@remotion/bundler');
  const { renderStill, renderMedia, selectComposition } = await import('@remotion/renderer');
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: path.join(ROOT, 'public') });
  const fontComp = await selectComposition({ serveUrl, id: 'FontTest' });
  await renderStill({ serveUrl, composition: fontComp, output: OUT.fontTest, scale: 0.5 });
  log(`font test still → ${path.relative(ROOT, OUT.fontTest)}`);
  const inputProps = { previewAudio: false };
  const comp = await selectComposition({ serveUrl, id: 'Documentary', inputProps });
  if (comp.durationInFrames !== timeline.durationInFrames) throw new Error('Composition length does not match timeline');

  // 8 ── render video in cached chunks
  step(8, `Rendering ${comp.durationInFrames} frames (${CONCURRENCY} parallel, chunks of ${CHUNK})`);
  const srcHash = hashTree([path.join(ROOT, 'src'), P.assetsDir, P.fontsDir]) + `-${SCALE}-${CRF}`;
  fs.mkdirSync(OUT.chunks, { recursive: true });
  const chunkFiles: string[] = [];
  const renderStart = Date.now();
  let framesDone = 0;
  let framesToRender = 0;
  const ranges: [number, number][] = [];
  for (let a = 0; a < comp.durationInFrames; a += CHUNK) ranges.push([a, Math.min(comp.durationInFrames, a + CHUNK) - 1]);
  const chunkPath = (r: [number, number]) => path.join(OUT.chunks, `c${String(r[0]).padStart(5, '0')}-${r[1]}-${srcHash}.mp4`);
  if (REUSE_BEFORE > 0 && !FORCE) {
    for (const r of ranges) {
      if (r[1] >= REUSE_BEFORE || fs.existsSync(chunkPath(r))) continue;
      const prefix = `c${String(r[0]).padStart(5, '0')}-${r[1]}-`;
      const suffix = `-${SCALE}-${CRF}.mp4`;
      const old = fs.readdirSync(OUT.chunks).find((f) => f.startsWith(prefix) && f.endsWith(suffix) && !f.includes('.part.'));
      if (old) {
        fs.renameSync(path.join(OUT.chunks, old), chunkPath(r));
        log(`chunk ${r[0]}–${r[1]} reused from an earlier source version (--reuse-before=${REUSE_BEFORE})`);
      }
    }
  }
  for (const r of ranges) if (FORCE || !fs.existsSync(chunkPath(r))) framesToRender += r[1] - r[0] + 1;
  // remove stale chunks from earlier source versions
  const wanted = new Set(ranges.map((r) => path.basename(chunkPath(r))));
  for (const f of fs.readdirSync(OUT.chunks)) if (!wanted.has(f)) fs.rmSync(path.join(OUT.chunks, f), { force: true });

  for (const r of ranges) {
    const file = chunkPath(r);
    chunkFiles.push(file);
    if (!FORCE && fs.existsSync(file)) {
      log(`chunk ${r[0]}–${r[1]} cached`);
      continue;
    }
    const tmp = file.replace(/\.mp4$/, '.part.mp4');
    let lastPct = -1;
    await renderMedia({
      serveUrl,
      composition: comp,
      codec: 'h264',
      crf: CRF,
      pixelFormat: 'yuv420p',
      muted: true,
      scale: SCALE,
      frameRange: r,
      concurrency: CONCURRENCY,
      inputProps,
      outputLocation: tmp,
      overwrite: true,
      chromiumOptions: { gl: 'angle' },
      onProgress: ({ renderedFrames }) => {
        const done = framesDone + renderedFrames;
        const pct = Math.floor((done / framesToRender) * 100);
        if (pct !== lastPct && pct % 2 === 0) {
          lastPct = pct;
          const el = (Date.now() - renderStart) / 1000;
          const eta = done > 0 ? (el / done) * (framesToRender - done) : 0;
          log(`frames ${r[0] + renderedFrames}/${comp.durationInFrames}  ${pct}% of pending  elapsed ${fmtTime(el)}  eta ${fmtTime(eta)}`);
        }
      },
    });
    fs.renameSync(tmp, file);
    framesDone += r[1] - r[0] + 1;
    log(`chunk ${r[0]}–${r[1]} done`);
  }
  const listFile = path.join(P.cache, 'concat.txt');
  fs.writeFileSync(listFile, chunkFiles.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n'));
  run(ff, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', OUT.silent]);
  log(`silent video → ${path.relative(ROOT, OUT.silent)} (${fmtTime((Date.now() - renderStart) / 1000)})`);

  // 9 ── mix + mux
  step(9, 'Mixing narration, music and SFX; encoding final MP4');
  const dur = comp.durationInFrames / comp.fps;
  const narr = path.join(P.audioDir, 'narration.wav');
  const inputs = ['-i', OUT.silent];
  let fc = '';
  if (timeline.hasNarration && fs.existsSync(narr)) {
    inputs.push('-i', narr, '-i', path.join(P.audioDir, 'music.wav'), '-i', path.join(P.audioDir, 'sfx.wav'));
    fc =
      '[1:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[nar][key];' +
      '[2:a]volume=0.22[mus0];[mus0][key]sidechaincompress=threshold=0.03:ratio=4:attack=25:release=450[mus];' +
      '[3:a]volume=0.40[sfx];' +
      '[nar][mus][sfx]amix=inputs=3:normalize=0:duration=longest';
  } else {
    inputs.push('-i', path.join(P.audioDir, 'music.wav'), '-i', path.join(P.audioDir, 'sfx.wav'));
    fc = '[1:a]volume=0.5[mus];[2:a]volume=0.5[sfx];[mus][sfx]amix=inputs=2:normalize=0:duration=longest';
  }
  fc +=
    `,atrim=0:${dur.toFixed(3)},afade=t=out:st=${(dur - 1.5).toFixed(3)}:d=1.5,` +
    'loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.89:level=false,aresample=48000[a]';
  run(ff, [
    '-y', '-v', 'error', ...inputs, '-filter_complex', fc,
    // Remotion's chunks are full-range (yuvj420p); convert to broadcast-range yuv420p BT.709 for YouTube/players
    '-map', '0:v', '-map', '[a]',
    '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', DRAFT ? 'veryfast' : 'medium', '-crf', String(CRF), '-profile:v', 'high',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-t', dur.toFixed(3), '-movflags', '+faststart', OUT.final,
  ]);
  log(`final → ${path.relative(ROOT, OUT.final)}`);

  // 10 ── validation
  step(10, 'Validating output');
  const pr = probe(OUT.final);
  const v = pr.streams.find((s: any) => s.codec_type === 'video');
  const a = pr.streams.find((s: any) => s.codec_type === 'audio');
  const [fn, fd] = String(v?.r_frame_rate ?? '0/1').split('/').map(Number);
  const fps = fn / fd;
  const duration = Number(pr.format.duration);
  const sizeMB = fs.statSync(OUT.final).size / 2 ** 20;
  const expectW = Math.round(timeline.width * SCALE);
  const expectH = Math.round(timeline.height * SCALE);
  const checks: [string, boolean, string][] = [
    ['video codec H.264', v?.codec_name === 'h264', v?.codec_name],
    [`resolution ${expectW}×${expectH}`, v?.width === expectW && v?.height === expectH, `${v?.width}×${v?.height}`],
    ['frame rate 30', Math.abs(fps - timeline.fps) < 0.01, fps.toFixed(3)],
    ['duration matches timeline', Math.abs(duration - dur) < 0.5, `${duration.toFixed(2)}s`],
    ['audio stream AAC', a?.codec_name === 'aac', a?.codec_name ?? 'none'],
    ['pixel format yuv420p', v?.pix_fmt === 'yuv420p', v?.pix_fmt],
  ];
  // full decode pass: catches corrupt frames, long black gaps and clipping
  const qa = spawnSync(ff, ['-v', 'info', '-i', OUT.final, '-vf', 'blackdetect=d=2:pix_th=0.06', '-af', 'volumedetect', '-f', 'null', '-'], {
    maxBuffer: 1024 * 1024 * 64,
  });
  const qaLog = qa.stderr.toString();
  const blacks = [...qaLog.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const maxVol = Number(/max_volume: ([-\d.]+) dB/.exec(qaLog)?.[1] ?? NaN);
  const meanVol = Number(/mean_volume: ([-\d.]+) dB/.exec(qaLog)?.[1] ?? NaN);
  checks.push(['decodes without errors', qa.status === 0 && !/Error|corrupt/i.test(qaLog.replace(/error_?resilience/gi, '')), `exit ${qa.status}`]);
  checks.push(['no blank (black) segments ≥2s', blacks.length === 0, blacks.map((b) => `${b[0].toFixed(1)}–${b[1].toFixed(1)}s`).join(', ') || 'none']);
  checks.push(['audio not clipping', maxVol <= -0.5, `peak ${maxVol} dB, mean ${meanVol} dB`]);
  let ok = true;
  for (const [name, pass, detail] of checks) {
    console.log(`   ${pass ? '\x1b[32m✔' : '\x1b[31m✘'}\x1b[0m ${name.padEnd(32)} ${detail}`);
    if (!pass) ok = false;
  }

  // 11 ── contact sheet
  step(11, 'Contact sheet');
  const every = Math.max(1, duration / 25);
  run(ff, ['-y', '-v', 'error', '-i', OUT.final, '-vf', `fps=1/${every.toFixed(3)}:start_time=${(every / 2).toFixed(2)},scale=384:-1,tile=5x5:padding=4:color=0x1a120c`, '-frames:v', '1', '-q:v', '3', OUT.contact]);
  log(`contact sheet → ${path.relative(ROOT, OUT.contact)} (one frame every ${every.toFixed(1)}s)`);

  writeJSON(OUT.report, {
    file: path.relative(ROOT, OUT.final),
    draft: DRAFT,
    durationSec: Number(duration.toFixed(2)),
    width: v?.width,
    height: v?.height,
    fps,
    videoCodec: v?.codec_name,
    audioCodec: a?.codec_name,
    sizeMB: Number(sizeMB.toFixed(1)),
    audioPeakDb: maxVol,
    audioMeanDb: meanVol,
    narration: timeline.hasNarration ? script.tts.engine : 'none',
    scenes: timeline.scenes.map((s: any) => ({ id: s.id, start: s.start, end: s.end })),
    subtitleCues: cues.length,
    checks: checks.map(([name, pass, detail]) => ({ name, pass, detail })),
    warnings,
    renderedAt: new Date().toISOString(),
    totalPipelineSec: Math.round((Date.now() - t0) / 1000),
  });

  // 12 ── summary
  step(12, 'Done');
  log(`video        ${OUT.final}`);
  log(`subtitles    ${OUT.srt}`);
  log(`contact      ${OUT.contact}`);
  log(`font test    ${OUT.fontTest}`);
  log(`report       ${OUT.report}`);
  log(`${duration.toFixed(1)}s · ${v?.width}×${v?.height} · ${fps} fps · ${sizeMB.toFixed(1)} MB · pipeline ${fmtTime((Date.now() - t0) / 1000)}`);
  if (warnings.length) {
    console.log('\n\x1b[33mWarnings:\x1b[0m');
    warnings.forEach((w) => console.log(`   - ${w}`));
  }
  if (!ok) {
    console.error('\n\x1b[31mValidation failed – see checks above.\x1b[0m');
    process.exit(2);
  }
}

main().catch((e) => {
  console.error(`\n\x1b[31mPipeline failed:\x1b[0m ${e?.stack ?? e}`);
  process.exit(1);
});
