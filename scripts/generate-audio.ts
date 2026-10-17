import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  P, SR, Script, ScriptLine, readJSON, writeJSON, log, warn, decodeMono, writeWav, plain, hashOf,
} from './lib';

type Word = { t: number; d: number; w: string };
type LineInfo = { id: string; dur: number; speechStart: number; speechEnd: number; words: Word[] | null; source: string };

const ttsText = (l: ScriptLine) => plain(l.tts ?? l.text);

/** Step 1: produce narration audio for every line (edge-tts, imported recordings, or none). */
export function generateNarration(script: Script): Record<string, LineInfo> {
  fs.mkdirSync(P.narrationDir, { recursive: true });
  fs.mkdirSync(P.narrationImportDir, { recursive: true });
  const { engine, voice, rate, pitch } = script.tts;
  const lines = script.scenes.flatMap((s) => s.lines);

  const imported = (id: string) =>
    ['wav', 'mp3', 'm4a', 'flac'].map((e) => path.join(P.narrationImportDir, `${id}.${e}`)).find((f) => fs.existsSync(f));

  if (engine === 'edge') {
    const jobs = lines
      .filter((l) => !imported(l.id))
      .filter((l) => {
        const meta = path.join(P.narrationDir, `${l.id}.meta.json`);
        const h = hashOf([ttsText(l), voice, rate, pitch].join('|'));
        return !(fs.existsSync(meta) && readJSON(meta).hash === h && fs.existsSync(path.join(P.narrationDir, `${l.id}.mp3`)));
      })
      .map((l) => ({
        id: l.id,
        text: ttsText(l),
        audio: path.join(P.narrationDir, `${l.id}.mp3`),
        words: path.join(P.narrationDir, `${l.id}.words.json`),
      }));
    if (jobs.length) {
      log(`synthesising ${jobs.length} line(s) with edge-tts voice ${voice}`);
      const jf = path.join(P.narrationDir, '_jobs.json');
      writeJSON(jf, { voice, rate, pitch, jobs });
      const py = process.env.PYTHON ?? 'python';
      const r = spawnSync(py, [path.join(__dirname, 'tts.py'), jf], { stdio: 'inherit' });
      fs.rmSync(jf, { force: true });
      if (r.status !== 0) {
        throw new Error(
          'edge-tts narration failed. Check internet access and `python -m pip install --user edge-tts`, ' +
            'or set tts.engine to "files" (own recordings in public/audio/narration-import/<lineId>.wav) or "none".',
        );
      }
      for (const j of jobs) {
        const l = lines.find((x) => x.id === j.id)!;
        writeJSON(path.join(P.narrationDir, `${l.id}.meta.json`), { hash: hashOf([ttsText(l), voice, rate, pitch].join('|')) });
      }
    } else log('narration cache is up to date');
  }

  const info: Record<string, LineInfo> = {};
  for (const l of lines) {
    const imp = imported(l.id);
    const mp3 = path.join(P.narrationDir, `${l.id}.mp3`);
    const src = imp ?? (engine === 'edge' ? mp3 : null);
    if (!src || !fs.existsSync(src)) {
      if (engine !== 'none') warn(`no narration audio for line ${l.id}; using estimated timing`);
      const est = Math.max(1.2, plain(l.text).length * 0.068);
      info[l.id] = { id: l.id, dur: est, speechStart: 0, speechEnd: est, words: null, source: 'estimate' };
      continue;
    }
    const pcm = decodeMono(src);
    const wav = path.join(P.narrationDir, `${l.id}.wav`);
    const fresh = fs.existsSync(wav) && fs.statSync(wav).mtimeMs >= fs.statSync(src).mtimeMs && fs.statSync(wav).size === 44 + pcm.length * 2;
    if (!fresh) writeWav(wav, [pcm]);
    const thr = 0.012;
    let a = 0;
    let b = pcm.length - 1;
    while (a < pcm.length && Math.abs(pcm[a]) < thr) a++;
    while (b > a && Math.abs(pcm[b]) < thr) b--;
    const wordsFile = path.join(P.narrationDir, `${l.id}.words.json`);
    const words = !imp && fs.existsSync(wordsFile) ? (readJSON(wordsFile) as Word[]) : null;
    info[l.id] = {
      id: l.id,
      dur: pcm.length / SR,
      speechStart: a / SR,
      speechEnd: Math.min(pcm.length / SR, b / SR + 0.05),
      words,
      source: imp ? 'import' : 'edge-tts',
    };
  }
  return info;
}

type Tok = { w: string; em: boolean; t0: number; t1: number };
export type Cue = { i: number; line: string; start: number; end: number; segs: { t: string; em: boolean }[] };

const PUNCT_ONLY = /^[\s,।.!?…—\-–:;'"“”()]+$/;
const clean = (w: string) => w.replace(/[,।.!?…—\-–:;'"“”()]/g, '');

/** Attach a time to every display token, from TTS word boundaries when they align, else by character share. */
function timeTokens(line: ScriptLine, li: LineInfo, at: number): Tok[] {
  let em = false;
  const toks: Tok[] = line.text.split(/\s+/).filter(Boolean).map((raw) => {
    let tokEm = false;
    let w = '';
    for (const ch of raw) {
      if (ch === '*') em = !em;
      else {
        if (em) tokEm = true;
        w += ch;
      }
    }
    return { w, em: tokEm, t0: 0, t1: 0 };
  });
  const speakable = toks.filter((t) => !PUNCT_ONLY.test(t.w));
  const words = li.words;
  const sameText = !line.tts;
  if (words && sameText) {
    const ws = words.filter((w) => !PUNCT_ONLY.test(w.w));
    // greedy alignment by cleaned text
    let j = 0;
    let ok = true;
    for (const t of speakable) {
      const target = clean(t.w);
      while (j < ws.length && clean(ws[j].w) !== target && !target.startsWith(clean(ws[j].w))) j++;
      if (j >= ws.length) {
        ok = false;
        break;
      }
      t.t0 = ws[j].t;
      // tokens may be split into several boundary events (e.g. hyphenated words)
      let k = j;
      let acc = clean(ws[k].w);
      while (acc.length < target.length && k + 1 < ws.length) {
        k++;
        acc += clean(ws[k].w);
      }
      t.t1 = ws[k].t + ws[k].d;
      j = k + 1;
    }
    if (ok) {
      fillPunct(toks);
      toks.forEach((t) => ((t.t0 += at), (t.t1 += at)));
      return toks;
    }
  }
  // proportional fallback
  const total = speakable.reduce((s, t) => s + t.w.length + 1, 0);
  let acc = 0;
  const span = li.speechEnd - li.speechStart;
  for (const t of speakable) {
    t.t0 = li.speechStart + (acc / total) * span;
    acc += t.w.length + 1;
    t.t1 = li.speechStart + (acc / total) * span;
  }
  fillPunct(toks);
  toks.forEach((t) => ((t.t0 += at), (t.t1 += at)));
  return toks;
}

function fillPunct(toks: Tok[]) {
  for (let i = 0; i < toks.length; i++) {
    if (PUNCT_ONLY.test(toks[i].w)) {
      const prev = toks[i - 1];
      toks[i].t0 = toks[i].t1 = prev ? prev.t1 : toks[i + 1]?.t0 ?? 0;
    }
  }
}

const MAX_CHARS = 46;
const POSTPOS = new Set(['ने', 'को', 'में', 'की', 'के', 'का', 'से', 'पर', 'तक', 'है', 'हैं', 'था', 'थी', 'थीं', 'थे', 'नाम']);
const tlen = (ts: Tok[]) => ts.map((t) => t.w).join(' ').length;

/** Split into phrases at punctuation, merge short neighbours, balance-split long phrases. */
function chunk(toks: Tok[]): Tok[][] {
  const phrases: Tok[][] = [];
  let cur: Tok[] = [];
  for (const t of toks) {
    cur.push(t);
    if (/[,।?!…—]$/.test(t.w)) {
      phrases.push(cur);
      cur = [];
    }
  }
  if (cur.length) phrases.push(cur);
  // attach punctuation-only phrases (e.g. a lone "—") to the previous phrase
  const ph: Tok[][] = [];
  for (const p of phrases) {
    if (ph.length && p.every((t) => PUNCT_ONLY.test(t.w))) ph[ph.length - 1].push(...p);
    else ph.push(p);
  }
  const merged: Tok[][] = [];
  for (const p of ph) {
    const last = merged[merged.length - 1];
    if (last && tlen(last) + 1 + tlen(p) <= MAX_CHARS && (tlen(last) < 24 || tlen(p) < 14)) last.push(...p);
    else merged.push([...p]);
  }
  const out: Tok[][] = [];
  for (const p of merged) {
    const L = tlen(p);
    if (L <= MAX_CHARS) {
      out.push(p);
      continue;
    }
    const n = Math.ceil(L / MAX_CHARS);
    const target = L / n;
    let part: Tok[] = [];
    for (let i = 0; i < p.length; i++) {
      part.push(p[i]);
      const remaining = p.slice(i + 1);
      if (tlen(part) >= target - 4 && remaining.length && !PUNCT_ONLY.test(remaining[0].w) && !POSTPOS.has(clean(remaining[0].w)) && tlen(remaining) >= 8) {
        out.push(part);
        part = [];
      }
    }
    if (part.length) out.push(part);
  }
  return out;
}

/** Step 2: lay out scenes and lines on the timeline, build cues, narration stem and SRT. */
export function buildTimeline(script: Script, info: Record<string, LineInfo>) {
  const fps = script.meta.fps;
  const gap = script.meta.defaultGapSec;
  const snap = (s: number) => Math.round(s * fps) / fps;
  let t = 0;
  const scenes: any[] = [];
  const lines: any[] = [];
  const cues: Cue[] = [];
  for (const sc of script.scenes) {
    const sceneStart = snap(t);
    let cursor = sceneStart + sc.leadIn;
    for (const l of sc.lines) {
      const li = info[l.id];
      const clipStart = cursor - li.speechStart;
      const toks = timeTokens(l, li, clipStart);
      for (const group of chunk(toks)) {
        const segs: { t: string; em: boolean }[] = [];
        for (const tk of group) {
          const last = segs[segs.length - 1];
          if (last && last.em === tk.em) last.t += ' ' + tk.w;
          else segs.push({ t: (segs.length ? ' ' : '') + tk.w, em: tk.em });
        }
        cues.push({ i: cues.length + 1, line: l.id, start: group[0].t0, end: group[group.length - 1].t1, segs });
      }
      lines.push({
        id: l.id,
        scene: sc.id,
        clipStart,
        clipDur: li.dur,
        start: cursor,
        end: cursor + (li.speechEnd - li.speechStart),
        source: li.source,
      });
      cursor += li.speechEnd - li.speechStart + gap + (l.pauseAfter ?? 0);
    }
    const sceneEnd = snap(cursor - gap + sc.tail);
    scenes.push({
      id: sc.id,
      title: sc.title,
      mood: sc.mood,
      start: sceneStart,
      end: sceneEnd,
      from: Math.round(sceneStart * fps),
      durationInFrames: Math.round((sceneEnd - sceneStart) * fps),
    });
    t = sceneEnd;
  }
  // subtitle hold: stay a little after speech, never overlapping the next cue
  for (let i = 0; i < cues.length; i++) {
    const next = cues[i + 1];
    const hold = cues[i].end + 0.45;
    cues[i].end = next ? Math.min(hold, next.start - 0.04) : hold;
    if (cues[i].end - cues[i].start < 0.9) cues[i].end = next ? Math.min(cues[i].start + 0.9, next.start - 0.04) : cues[i].start + 0.9;
  }
  const totalSec = t;
  const timeline = {
    fps,
    width: script.meta.width,
    height: script.meta.height,
    totalSec,
    durationInFrames: Math.round(totalSec * fps),
    scenes,
    lines,
    hasNarration: Object.values(info).some((x) => x.source !== 'estimate'),
  };
  writeJSON(P.timeline, timeline);
  writeJSON(P.subtitles, cues);

  // SRT
  const ts = (s: number) => {
    const ms = Math.max(0, Math.round(s * 1000));
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const r = ms % 1000;
    const p = (n: number, w = 2) => String(n).padStart(w, '0');
    return `${p(h)}:${p(m)}:${p(sec)},${p(r, 3)}`;
  };
  const srt = cues.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.segs.map((s) => s.t).join('').trim()}\n`).join('\n');
  fs.mkdirSync(P.output, { recursive: true });
  fs.writeFileSync(path.join(P.output, 'subtitles_hi.srt'), '\ufeff' + srt, 'utf8');

  // narration stem
  const total = Math.ceil(totalSec * SR) + SR;
  const stem = new Float32Array(total);
  for (const l of lines) {
    const wav = path.join(P.narrationDir, `${l.id}.wav`);
    if (!fs.existsSync(wav) || l.source === 'estimate') continue;
    const pcm = decodeMono(wav);
    const off = Math.round(l.clipStart * SR);
    for (let i = 0; i < pcm.length; i++) if (off + i >= 0 && off + i < total) stem[off + i] += pcm[i];
  }
  writeWav(path.join(P.audioDir, 'narration.wav'), [stem]);
  return { timeline, cues };
}

if (require.main === module) {
  const script = readJSON<Script>(P.script);
  const info = generateNarration(script);
  const { timeline, cues } = buildTimeline(script, info);
  for (const s of timeline.scenes) log(`${s.id.padEnd(11)} ${s.start.toFixed(1).padStart(6)}s → ${s.end.toFixed(1).padStart(6)}s  (${(s.end - s.start).toFixed(1)}s)`);
  log(`total ${timeline.totalSec.toFixed(1)}s, ${cues.length} subtitle cues`);
}
