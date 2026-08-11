/**
 * One-off brand recolour: orange family -> indigo (#1800AC) + gold accent.
 *
 * Pass A  arbitrary Tailwind utilities  bg-[#F2631F]      -> bg-primary-600
 * Pass B  named Tailwind utilities      bg-orange-600     -> bg-primary-600
 * Pass C  raw hex literals              '#F2631F'         -> '#1800AC'   (inline styles, SVG, JS)
 * Pass D  rgba() brand colours          rgba(255,77,0,.15)-> rgba(24,0,172,.15)
 *
 * Storefront themes shop1-shop4 are excluded — they keep their own identities.
 * Run with --dry to preview.
 */
import fs from 'fs';
import path from 'path';
import { scopeFiles } from './theme-scan.mjs';

const DRY = process.argv.includes('--dry');
const SRC = path.resolve('src');

// hex -> tailwind token step on the `primary` / `accent` scale
const TOKEN = {
  // --- core brand oranges -> primary-600 (#1800AC) ---
  '#F2631F': 'primary-600', // main storefront brand
  '#FF4D00': 'primary-600', // merchant + creator brand
  '#FF5733': 'primary-600', // superadmin brand
  '#F97316': 'primary-600', // hardcoded tailwind orange-500
  '#F47521': 'primary-600',
  '#FF6B00': 'primary-600',
  '#FF6D00': 'primary-600',
  '#FF6E00': 'primary-600',
  '#FF3800': 'primary-600',
  '#EA580C': 'primary-600', // hardcoded tailwind orange-600

  // --- hover / pressed / darker variants -> primary-700 ---
  '#FF4500': 'primary-700',
  '#E64500': 'primary-700',
  '#E55A1A': 'primary-700',
  '#E55A2B': 'primary-700',
  '#E25818': 'primary-700',
  '#E63D00': 'primary-700',
  '#E06A1D': 'primary-700',
  '#E04300': 'primary-700',

  // --- deepest variants -> primary-800 ---
  '#D44F12': 'primary-800',
  '#D04F12': 'primary-800',
  '#D95218': 'primary-800',
  '#D54D1A': 'primary-800',
  '#D1571B': 'primary-800',
  '#C2410C': 'primary-800', // hardcoded tailwind orange-700

  // --- lighter brand tints -> primary-400/500 ---
  '#FF8C33': 'primary-500',
  '#FF6B35': 'primary-500',
  '#E27A53': 'primary-500',
  '#FF8A4C': 'primary-400',
  '#FF7840': 'primary-400',
  '#FF7A4C': 'primary-400',
  '#FF9F7A': 'primary-300',
  '#FF9A6C': 'primary-300',
  '#FDBA74': 'primary-300', // hardcoded tailwind orange-300
  '#FED7AA': 'primary-200', // hardcoded tailwind orange-200
  '#FFD6C4': 'primary-200',

  // --- pale wash backgrounds -> primary-50/100 ---
  '#FFF5F0': 'primary-50',
  '#FFF8F5': 'primary-50',
  '#FFF3EE': 'primary-50',
  '#FFF7F1': 'primary-50',
  '#FFF7F2': 'primary-50',
  '#FFF6F2': 'primary-50',
  '#FFF7ED': 'primary-50', // hardcoded tailwind orange-50
  '#FDF6EE': 'primary-50',
  '#FFF5E6': 'primary-50',
  '#FFFAF3': 'primary-50',
  '#FFF3E6': 'primary-50',
  '#FFEDD5': 'primary-100', // hardcoded tailwind orange-100
  '#FFE7DB': 'primary-100',
  '#FFE5D9': 'primary-100',
  '#F6EADD': 'primary-100',

  // --- warm/gold usages that stay warm: re-point at the new gold accent ---
  '#FFF9E5': 'accent-50', // note/callout backgrounds
  '#FFBB28': 'accent-400', // recharts series
  '#FF8042': 'accent-500', // recharts series
  '#FFB366': 'accent-300', // chart: timeout errors
  '#FFDAB9': 'accent-200', // chart: network errors
  '#FACC15': 'accent-400', // hardcoded tailwind yellow-400
  '#EAB308': 'accent-500', // hardcoded tailwind yellow-500
  '#FFB347': 'accent-400',
};

// resolved hex for every token above (mirrors tailwind.config.js)
const SCALE = {
  primary: {
    50: '#F2F0FF', 100: '#E5E1FE', 200: '#C8C0FC', 300: '#A497F7', 400: '#7561EF',
    500: '#3B1EEB', 600: '#1800AC', 700: '#14008F', 800: '#120273', 900: '#100557', 950: '#0B0434',
  },
  accent: {
    50: '#FFFAEB', 100: '#FEF0C7', 200: '#FEDF89', 300: '#FEC84B', 400: '#FDB022',
    500: '#F79009', 600: '#DC6803', 700: '#B54708', 800: '#93370D', 900: '#7A2E0E', 950: '#4E1D09',
  },
};
const hexFor = (token) => {
  const [family, step] = token.split('-');
  return SCALE[family][step];
};

// rgba(...) forms of the brand oranges -> indigo, alpha preserved
const RGBA = [
  [/rgba?\(\s*255\s*,\s*77\s*,\s*0\s*([,)])/gi, 'rgba(24, 0, 172$1'], // #FF4D00
  [/rgba?\(\s*242\s*,\s*99\s*,\s*31\s*([,)])/gi, 'rgba(24, 0, 172$1'], // #F2631F
  [/rgba?\(\s*255\s*,\s*87\s*,\s*51\s*([,)])/gi, 'rgba(24, 0, 172$1'], // #FF5733
  [/rgba?\(\s*249\s*,\s*115\s*,\s*22\s*([,)])/gi, 'rgba(24, 0, 172$1'], // #F97316
  [/rgba?\(\s*255\s*,\s*69\s*,\s*0\s*([,)])/gi, 'rgba(20, 0, 143$1'], // #FF4500
];

// Tailwind utility roots that can carry a colour value.
const ROOT =
  '(?:bg|text|border|border-[trblxyse]|ring|ring-offset|from|to|via|fill|stroke|shadow|placeholder|decoration|accent|caret|outline|divide|divide-[xy])';

const stats = {};
const bump = (k, n) => { if (n) stats[k] = (stats[k] || 0) + n; };

let changedFiles = 0;
for (const file of scopeFiles()) {
  const before = fs.readFileSync(file, 'utf8');
  let text = before;

  for (const [hex, token] of Object.entries(TOKEN)) {
    const bare = hex.slice(1);

    // Pass A — arbitrary utility class: bg-[#F2631F] -> bg-primary-600 (keeps /opacity suffix)
    const arb = new RegExp(`\\b(${ROOT})-\\[#${bare}\\]`, 'gi');
    bump('A: arbitrary class -> token', (text.match(arb) || []).length);
    text = text.replace(arb, (_m, root) => `${root}-${token}`);

    // Pass C — any remaining raw hex (inline style, SVG attr, JS string, gradient stop)
    const raw = new RegExp(`#${bare}\\b`, 'gi');
    bump('C: raw hex -> new hex', (text.match(raw) || []).length);
    text = text.replace(raw, hexFor(token));
  }

  // Pass B — named orange utilities: bg-orange-600 -> bg-primary-600
  const named = new RegExp(`\\b(${ROOT})-orange-(50|100|200|300|400|500|600|700|800|900|950)\\b`, 'g');
  bump('B: orange-* -> primary-*', (text.match(named) || []).length);
  text = text.replace(named, (_m, root, step) => `${root}-primary-${step}`);

  // Pass D — rgba() brand colours
  for (const [re, to] of RGBA) {
    bump('D: rgba brand -> indigo', (text.match(re) || []).length);
    text = text.replace(re, to);
  }

  if (text !== before) {
    changedFiles++;
    if (!DRY) fs.writeFileSync(file, text);
  }
}

console.log(DRY ? '--- DRY RUN ---' : '--- APPLIED ---');
for (const [k, v] of Object.entries(stats).sort()) console.log(`  ${k.padEnd(30)} ${v}`);
console.log(`\n  files changed: ${changedFiles}`);
