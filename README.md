# सिंधु घाटी: ख़ामोश शहरों का रहस्य — code-generated 2D Hindi documentary

A fully programmatic ~5-minute YouTube documentary (1920×1080, 30 fps, H.264 + AAC) about the
transformation and decline of the Indus Valley (Harappan) Civilization. Every visual is procedural
SVG/React drawn by [Remotion](https://www.remotion.dev); narration is free neural Hindi TTS; music and
sound effects are synthesised in code. No paid APIs, no remote images.

## Requirements

- Node.js 18+ (tested on 20.18)
- Python 3 with `edge-tts` for narration: `python -m pip install --user edge-tts` (needs internet once; audio is cached)
- ~2 GB free disk, 4+ CPU cores recommended. FFmpeg/ffprobe come from `ffmpeg-static` / `ffprobe-static`.

## Run

```powershell
npm install
npm run video          # full 1920×1080 render → output/indus_valley_documentary_hi.mp4
npm run video:draft    # 960×540 quick preview
npm run studio         # interactive Remotion Studio preview
```

Flags: `--force` (ignore render cache), `--concurrency=N`, `--chunk=FRAMES`.

The pipeline (`scripts/render-video.ts`) does everything in one go:

1. Checks Node, FFmpeg, ffprobe and edge-tts.
2. Validates `src/data/script.json`, including unique IDs and Devanagari text.
3. Generates map geometry, grain/paper textures and fonts (`generate-assets.ts`).
4. Synthesises narration per line, cached by text hash (`generate-audio.ts` + `tts.py`).
5. Builds the scene timeline from the real speech lengths, word-timed subtitles and `output/subtitles_hi.srt`.
6. Synthesises the music score and the ambient SFX (wind, water, footsteps, pottery) in `generate-music.ts`.
7. Bundles Remotion and renders a Hindi font test still.
8. Renders the video in 900-frame chunks, cached by a source hash, so an interrupted render resumes.
9. Mixes the audio and muxes the final MP4. Music is side-chain ducked under the voice; the mix is normalised to −14 LUFS, limited, and encoded as H.264 yuv420p BT.709.
10. Validates the output: codec, resolution, fps, duration, audio stream, a full decode, black-frame detection and clipping.
11. Builds a contact sheet, then writes `output/render_report.json`.

## Outputs (`output/`)

| File | What |
|---|---|
| `indus_valley_documentary_hi.mp4` | Final video |
| `subtitles_hi.srt` | Hindi subtitles (UTF-8 BOM), upload to YouTube as a separate track |
| `contact_sheet.jpg` | 25 representative frames |
| `font_test.png` | Devanagari glyph/conjunct rendering test |
| `render_report.json` | Measured specs, QA checks, warnings |
| `REPORT.md` | Dependencies, limitations, manual steps |

## Making another video

- **Narration and subtitles:** edit `src/data/script.json`. Wrap words in `*asterisks*` to emphasise them in subtitles. Use `pauseAfter` to add pauses, and set `tts` to an alternate pronunciation of a line.
- **Voice:** change `tts.voice`, for example `hi-IN-SwaraNeural`.
- **Own recordings:** set `tts.engine` to `"files"` and place recordings at `public/audio/narration-import/<lineId>.wav` (or `.mp3`).
- **No voice:** set `tts.engine` to `"none"` to get estimated timings.
- **Channel branding:** change `meta.channelName`, `meta.channelTagline` and `meta.nextVideoTitle`.
- **Visuals:** scenes live in `src/scenes/` and are built from reusable components in `src/components/`:

| Component(s) | Purpose |
|---|---|
| `Camera` | Camera moves |
| `Layer` | Parallax |
| `Map` | Map, path drawing, routes |
| `Timeline` | Timeline |
| `Particles` | Dust, wind |
| `Water` | Water |
| `Characters` | Walk cycles |
| `Text` | Reveals, lower-thirds |
| `Subtitle` | Subtitles |
| `Transition` | Transitions |
| `Overlay` | Grain, vignette |
| `art/*` | Buildings, props, sky |

## Project layout

```text
src/        Root.tsx, Video.tsx, scenes/, components/, data/, utils/, theme.ts
scripts/    render-video.ts (pipeline), generate-*.ts, tts.py, stills.ts (QA frames), lib.ts
public/     audio/ (generated), fonts/ (OFL), assets/ (generated textures)
.cache/     TTS + render chunk cache (safe to delete)
```

See `SOURCES.md` for historical references and the asset/licence manifest.
