# Itihasnama brand kit

Every asset here is generated from code: React/SVG components rendered by Remotion's headless Chrome. Brand text in the SVG exports is converted to vector paths with fontkit.

## Files

| File | Size | Use |
|---|---|---|
| `logo/itihasnama_logo_800.png` | 800×800 | **YouTube profile picture** |
| `logo/itihasnama_logo.svg` | vector | Master logo (charcoal background) |
| `logo/itihasnama_logo_transparent.svg` / `_1024.png` | vector / 1024² | Seal on transparency (overlays, merch, end screens) |
| `logo/itihasnama_watermark_150.png` | 150×150 | **YouTube video watermark** (Customisation → Branding) |
| `logo/logo_size_test.png` | — | Circle-crop legibility test, 400 → 32 px |
| `banner/itihasnama_banner_2560x1440.jpg` | 2560×1440, 0.6 MB | **YouTube banner** |
| `banner/itihasnama_banner.svg` | vector | Editable master banner |
| `banner/banner_safe_area_guide.jpg` | — | Banner with TV/desktop/tablet/mobile crop zones |
| `thumbnails/ep01_indus_valley_thumbnail.jpg` | 1280×720 | **Ep01 thumbnail** — "सभ्यता का / अंत कैसे?" |
| `thumbnails/ep01_indus_valley_thumbnail_alt.jpg` | 1280×720 | Ep01 A/B variant — "शहर ख़ाली / क्यों हुए?" |
| `thumbnails/template_example_indus_script.jpg` | 1280×720 | Template demo — "ये लिपि / आज तक रहस्य" |
| `thumbnails/thumbnail_template_blank.png` | 1280×720 | Graded frame + badge, no art or text |
| `thumbnails/thumbnail_template_guide.png` | 1280×720 | Layout zones |
| `thumbnails/thumbnail_small_size_test.png` | — | Ep01 at 640/360/246/168 px wide |
| `brand_palette_typography.png` | 1800×1240 | Palette, type specimens, shaping QA |
| `BRAND_GUIDE.md` | — | Colours, typography, logo and thumbnail rules |
| `IMAGE_PROMPTS.md` | — | Optional prompts for painterly artwork |

## Reproduce

From the project root (`history-documentary/`):

```powershell
npm install
npm run branding                 # renders everything above + exports the SVGs (~2–3 min)
npm run branding -- ThumbEp01    # re-render selected asset ids only
```

The script:
1. Shapes the brand text to vector paths (`scripts/branding-glyphs.ts` → `src/branding/glyphs.json`).
2. Bundles the project and renders each still.
3. Validates the output with ffprobe: exact dimensions, and the YouTube limits of banner ≤ 6 MB and thumbnail ≤ 2 MB.
4. Writes the standalone SVGs.

To preview and tweak the designs live, run `npx remotion studio` and open the `Brand*` / `Thumb*` compositions.

## Make a thumbnail for a new video

1. Add an entry to `THUMBS` in `src/branding/thumbnails.tsx`:
   ```tsx
   {
     id: 'ThumbEp02',
     file: 'thumbnails/ep02_<topic>_thumbnail.jpg',
     kicker: 'मौर्य साम्राज्य',                          // 1–3 words
     lines: [{ text: 'अशोक ने' }, { text: 'युद्ध क्यों छोड़ा?', hl: true }], // 3–5 words, one highlighted line
     Art: MyEp02Art,                                    // any 1920×1080 SVG/React scene, subject on the right
   },
   ```
   For `Art` you can reuse the documentary components (`CityScape`, `Seal`, `Pot`, `Walker`, `Map`…). Or use an image: `() => <Img src={staticFile('assets/ep02.jpg')} style={{width:1920,height:1080,objectFit:'cover'}} />`.
2. Run `npm run branding -- ThumbEp02`, then check the result against the rules in `BRAND_GUIDE.md` §4.

## Source code

| File | Contents |
|---|---|
| `src/branding/brand.tsx` | Palette, vector-text helper, paper/grain filters |
| `src/branding/Logo.tsx` | Seal mark + logo |
| `src/branding/Banner.tsx` | Banner, monuments and safe areas |
| `src/branding/Thumbnail.tsx` | Thumbnail template (frame, grade, badge, headline) + guide overlay |
| `src/branding/thumbnails.tsx` | Per-video thumbnail definitions |
| `src/branding/Stills.tsx` | All brand stills registered as Remotion `<Still>`s |
| `scripts/branding.ts` | Render, validate and SVG export |

Fonts: Tiro Devanagari Hindi and Noto Sans Devanagari (SIL OFL 1.1). All artwork is original.
