import { spawnSync, SpawnSyncOptions } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(__dirname, '..');
export const P = {
  script: path.join(ROOT, 'src', 'data', 'script.json'),
  timeline: path.join(ROOT, 'src', 'data', 'timeline.json'),
  subtitles: path.join(ROOT, 'src', 'data', 'subtitles.json'),
  geo: path.join(ROOT, 'src', 'data', 'geo.json'),
  narrationDir: path.join(ROOT, '.cache', 'narration'),
  narrationImportDir: path.join(ROOT, 'public', 'audio', 'narration-import'),
  audioDir: path.join(ROOT, 'public', 'audio'),
  fontsDir: path.join(ROOT, 'public', 'fonts'),
  assetsDir: path.join(ROOT, 'public', 'assets'),
  output: path.join(ROOT, 'output'),
  cache: path.join(ROOT, '.cache'),
};

export const SR = 48000;

export type ScriptLine = { id: string; text: string; tts?: string; pauseAfter?: number };
export type ScriptScene = {
  id: string;
  title: string;
  mood: string;
  leadIn: number;
  tail: number;
  lines: ScriptLine[];
};
export type Script = {
  meta: Record<string, any> & { fps: number; width: number; height: number; targetDurationSec: number; defaultGapSec: number };
  tts: { engine: 'edge' | 'files' | 'none'; voice: string; rate: string; pitch: string };
  scenes: ScriptScene[];
};

export const readJSON = <T = any>(f: string): T => JSON.parse(fs.readFileSync(f, 'utf8'));
export const writeJSON = (f: string, d: unknown) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf8');
};

export const log = (...a: unknown[]) => console.log('  ', ...a);
export const step = (n: number | string, title: string) => console.log(`\n\x1b[36m[${n}] ${title}\x1b[0m`);
export const warn = (m: string) => {
  warnings.push(m);
  console.log(`\x1b[33m   ! ${m}\x1b[0m`);
};
export const warnings: string[] = [];

export function ffmpegPath(): string {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH;
  try {
    const p = require('ffmpeg-static') as string;
    if (p && fs.existsSync(p)) return p;
  } catch {}
  const r = spawnSync('ffmpeg', ['-version']);
  if (r.status === 0) return 'ffmpeg';
  throw new Error('FFmpeg not found. Run `npm install` (installs ffmpeg-static) or set FFMPEG_PATH.');
}

export function ffprobePath(): string {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) return process.env.FFPROBE_PATH;
  try {
    const p = require('ffprobe-static').path as string;
    if (p && fs.existsSync(p)) return p;
  } catch {}
  return 'ffprobe';
}

export function run(cmd: string, args: string[], opts: SpawnSyncOptions & { quiet?: boolean } = {}) {
  const r = spawnSync(cmd, args, { maxBuffer: 1024 * 1024 * 512, ...opts });
  if (r.status !== 0) {
    const err = (r.stderr ?? '').toString().slice(-3000);
    throw new Error(`Command failed: ${path.basename(cmd)} ${args.slice(0, 6).join(' ')} ...\n${err}`);
  }
  return r;
}

/** Decode any audio file to mono float32 PCM at SR. */
export function decodeMono(file: string): Float32Array {
  const r = run(ffmpegPath(), ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-']);
  const buf = r.stdout as Buffer;
  const out = new Float32Array(buf.length / 4);
  for (let i = 0; i < out.length; i++) out[i] = buf.readFloatLE(i * 4);
  return out;
}

/** Write 16-bit PCM WAV from planar float channels. */
export function writeWav(file: string, channels: Float32Array[], sr = SR) {
  const n = channels[0].length;
  const ch = channels.length;
  const data = Buffer.alloc(n * ch * 2);
  let o = 0;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      data.writeInt16LE(Math.round(v * 32767), o);
      o += 2;
    }
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(ch, 22);
  h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * ch * 2, 28);
  h.writeUInt16LE(ch * 2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  writeFileRetry(file, Buffer.concat([h, data]));
}

/** writeFileSync that survives transient Windows locks (antivirus / indexer holding the file). */
export function writeFileRetry(file: string, buf: Buffer, attempts = 8) {
  for (let i = 1; ; i++) {
    try {
      fs.writeFileSync(file, buf);
      return;
    } catch (e) {
      if (i >= attempts) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250 * i);
    }
  }
}

/** Text with *emphasis* markers stripped (for TTS / SRT). */
export const plain = (s: string) => s.replace(/\*/g, '');

export const hashOf = (s: string) => require('node:crypto').createHash('sha1').update(s).digest('hex').slice(0, 12);
