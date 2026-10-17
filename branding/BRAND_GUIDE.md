# Shilalekh — Brand Guide

**शिलालेख · इतिहास की अनसुनी कहानियाँ**

A faceless Hindi history documentary channel. The look is a warm palette of earth, fire and old paper, built from flat 2D silhouettes and dusk light. The colours come from an excavated brick wall at sunset.

## 1. Logo — the seal mark

The logo is a terracotta square seal, a nod to the stamp seals of the Indus cities, carrying the Devanagari initial **श** (for शिलालेख, "stone inscription"). The seal reads as an inscribed stone. The letter's headline (shirorekha) runs edge to edge as a horizon, with a half sun rising behind it: *history rising over the horizon*.

| Rule | Value |
|---|---|
| Minimum size | 32 px (tested at 48 and 32 px circle crops in `logo/logo_size_test.png`) |
| Clear space | ≥ 15% of the seal width on every side |
| Backgrounds | charcoal `#1C1714` (preferred) or any dark, warm photo/illustration |
| Avatar crop | YouTube crops to a circle, so the seal is sized to fit inside it |
| Don't | recolour the seal, add outlines/glows, rotate, stretch, place text inside, or use it on bright busy backgrounds |

**Wordmark lockup** (banner, end screens): seal, then **शिलालेख** in Tiro Devanagari Hindi, then a small tracked **SHILALEKH**, then the tagline in gold. The Latin line is optional.

## 2. Colour palette

| Token | Hex | Role |
|---|---|---|
| charcoal | `#1C1714` | Primary dark background |
| night | `#120D0A` | Deepest shadow, silhouettes |
| umber | `#3A2418` | Secondary dark, gradients |
| **terracotta** | `#B5532F` | **Brand primary**: seal, highlight blocks, edge bar |
| terracottaLight | `#C96E44` | Seal highlight, warm light, colour grade |
| brickDark | `#6E3322` | Carved lines, pressed states |
| parchment | `#F1E4C6` | Logo mark, text on dark, paper |
| parchmentDark | `#DCC59C` | Secondary text |
| cream | `#FFF6E0` | Thumbnail headline text |
| gold | `#D9A441` | Accents, tagline, "discovery" highlights. Use sparingly |
| teal | `#3F7F7A` | Rivers/water only, as a rare cool accent |

Proportion guide: ~70% darks (charcoal/umber/night), ~20% terracotta/brick, ~10% parchment/gold.
Source of truth in code: `src/branding/brand.tsx` (`B`).

## 3. Typography

| Use | Font | Weight | Notes |
|---|---|---|---|
| Wordmark, display titles | **Tiro Devanagari Hindi** | 400 | Calligraphic, manuscript feel. Large sizes only |
| Thumbnail headlines | **Noto Sans Devanagari** | 700 | 100–120 px at 1280×720, line-height ≈ 1.2 |
| Tagline, labels, kickers | Noto Sans Devanagari | 600 | |
| Subtitles, body | Noto Sans Devanagari | 400 | |
| Latin companion | Tiro Devanagari (Latin) | 400 | Uppercase, tracking +0.32 em |

Both fonts are SIL Open Font License (via @fontsource) and are bundled in `public/fonts/`.
Always use real Unicode Devanagari. In the logo and banner SVGs the text is pre-shaped into vector paths with fontkit, so they render identically everywhere. `brand_palette_typography.png` includes a vector-vs-browser shaping check.

## 4. Thumbnail system (1280×720)

See `thumbnails/thumbnail_template_guide.png`.

1. **One dominant subject** on the right half: a monument, artifact or scene, lit by low warm light.
2. **Headline** bottom-left: 1–2 lines, **3–5 words**, cream on a dark gradient. Exactly **one** line sits on the terracotta highlight block.
3. **Seal badge + kicker** top-left: the kicker is the topic or series in 1–3 words, in a gold outline pill.
4. **Terracotta edge bar** (12 px) on the left, the channel's recognisable signature in a grid of thumbnails.
5. **Grade**: terracotta colour unify plus soft-light, left text gradient, vignette and fine grain.
6. **Keep clear**: bottom-right (timestamp) and top-right (hover icons).
7. Check legibility at 168×94 (see `thumbnails/thumbnail_small_size_test.png`).
8. **Honesty rule**: headlines may ask questions, but must not state contested theories as fact or show invented artifacts as real. Prefer "कैसे?", "क्यों?" and "क्या सच में…?" over definitive claims.

File limits: JPEG, ≤ 2 MB (ours are ~0.1 MB).

## 5. Banner (2560×1440)

- The lockup is centred inside the **1546×423 safe area** (x 507–2053, y 508–932), so it is visible on mobile, tablet, desktop and TV.
- Monuments sit in the 2560×423 desktop band:
  - **Left:** a Sanchi-style stupa with a torana gateway.
  - **Centre:** low flat-roofed Indus houses.
  - **Right:** a Nagara-style temple shikhara against the setting sun and an Ashokan-style pillar.
- The TV-only areas hold a starry sky above and Indus-proportion brick courses (1:2:4) below.
- See `banner/banner_safe_area_guide.jpg`.

*The silhouettes are stylised and span different eras. They are a collage evoking Indian history, not a reconstruction of a single site.*
