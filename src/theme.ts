import { continueRender, delayRender, staticFile } from 'remotion';

export const C = {
  parchment: '#F1E4C6',
  parchmentDark: '#DCC59C',
  sand: '#E3CB9C',
  sandDark: '#C9A973',
  terracotta: '#B5532F',
  brick: '#A0522D',
  brickLight: '#C46A43',
  brickDark: '#6E3322',
  brown: '#4A2E1F',
  ink: '#2B1D14',
  charcoal: '#1C1714',
  teal: '#3F7F7A',
  river: '#4F8FA6',
  riverLight: '#8EC1CC',
  gold: '#D9A441',
  goldLight: '#F2CF7A',
  cream: '#FFF6E0',
  red: '#A8322A',
};

export const FONT_SANS = "'NotoDeva', 'Nirmala UI', sans-serif";
export const FONT_SERIF = "'TiroDeva', 'NotoDeva', 'Nirmala UI', serif";

const faces: [string, string, string, string][] = [
  ['NotoDeva', 'NotoSansDeva-400-deva.woff2', '400', 'U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF'],
  ['NotoDeva', 'NotoSansDeva-400-latin.woff2', '400', 'U+0000-00FF, U+2000-206F, U+2190-21FF'],
  ['NotoDeva', 'NotoSansDeva-600-deva.woff2', '600', 'U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF'],
  ['NotoDeva', 'NotoSansDeva-600-latin.woff2', '600', 'U+0000-00FF, U+2000-206F, U+2190-21FF'],
  ['NotoDeva', 'NotoSansDeva-700-deva.woff2', '700', 'U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF'],
  ['NotoDeva', 'NotoSansDeva-700-latin.woff2', '700', 'U+0000-00FF, U+2000-206F, U+2190-21FF'],
  ['TiroDeva', 'TiroDevaHindi-400-deva.woff2', '400', 'U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF'],
  ['TiroDeva', 'TiroDevaHindi-400-latin.woff2', '400', 'U+0000-00FF, U+2000-206F, U+2190-21FF'],
];

let loaded = false;
export function loadFonts() {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('Loading Devanagari fonts');
  Promise.all(
    faces.map(([family, file, weight, range]) => {
      const ff = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, { weight, unicodeRange: range });
      return ff.load().then((f) => document.fonts.add(f));
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error('Font loading failed', e);
      continueRender(handle);
    });
}
