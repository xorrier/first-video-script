# Render report

## Final output (measured with ffprobe, validated by `npm run video`)

| Property | Value |
|---|---|
| File | `output/indus_valley_documentary_hi.mp4` |
| Duration | 303.4 s (5 min 03 s), 9103 frames |
| Resolution / fps | 1920 × 1080 @ 30 fps |
| Video | H.264 High, yuv420p, BT.709, CRF 18 |
| Audio | AAC 192 kbps, 48 kHz stereo; peak −1.4 dBFS, mean −16.6 dB (loudnorm −14 LUFS) |
| Size | 390.5 MB |
| Subtitles | 110 cues, burned in, plus `output/subtitles_hi.srt` |
| QA | All 9 checks passed: codec, resolution, fps, duration, AAC, pixel format, full decode, no black gaps, no clipping |

Scene timings:

| Scene | Start | End |
|---|---|---|
| Hook | 0:00 | 0:29 |
| Context | 0:29 | 1:19 |
| City life | 1:19 | 2:18 |
| Change | 2:18 | 3:17 |
| Mystery | 3:17 | 4:21 |
| Conclusion | 4:21 | 4:49 |
| End screen | 4:49 | 5:03 |

All scenes are slightly longer than the brief so that the visuals match the real narration length.

## Dependencies

Remotion 4.0.536 (React 19.1, TypeScript), d3-geo, topojson-client, world-atlas, @fontsource Noto Sans Devanagari and Tiro Devanagari Hindi, ffmpeg-static, ffprobe-static, tsx, and Python `edge-tts`.

## Performance

On a 4-core laptop with about 1 GB of free RAM:

- The first full render takes about 40 min.
- A re-run with cached chunks takes about 40 min, mostly the final x264 encode.
- Narration and render chunks are cached, so changing one scene only re-renders the affected chunks.

## Limitations

- **Narration:** uses Microsoft's free Edge neural voice and needs internet on the first run. Check its terms before monetising, or import your own recordings with `tts.engine = "files"`.
- **Music and SFX:** synthesised procedurally. They are tasteful but simpler than a licensed score; replace `public/audio/music.wav` if you like, and the mix ducks it automatically.
- **Historical fidelity:** river courses, site positions and reconstructions are schematic, and are labelled on screen as reconstruction or schematic.
- **Subtitle timing:** derived from TTS word boundaries. Imported recordings fall back to proportional timing.

## Manual steps

None after `npm install` and `pip install edge-tts`. Upload `subtitles_hi.srt` to YouTube as a separate track if you want closed captions in addition to the burned-in ones.
