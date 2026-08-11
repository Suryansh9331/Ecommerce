import fs from 'fs';
import path from 'path';

const SRC = path.resolve('src');
const EXCL = [
  /^components\/shop\/shop[1-4]\//i,
  /^pages\/shop[1-4]\//i,
  /^pages\/Shop[1-4][A-Za-z]*\.tsx$/,
  /^pages\/Shop\/Shop[1-4][A-Za-z]*\.tsx$/,
];

export function scopeFiles() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(tsx?|jsx?|css)$/.test(e.name)) continue;
      const rel = path.relative(SRC, p).split(path.sep).join('/');
      if (EXCL.some((r) => r.test(rel))) continue;
      out.push(p);
    }
  })(SRC);
  return out;
}

const h2r = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

export const toHsl = (hex) => {
  let [r, g, b] = h2r(hex);
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let H = 0, S = 0; const L = (mx + mn) / 2; const d = mx - mn;
  if (d) {
    S = L > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    H = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    H *= 60;
  }
  return [H, S * 100, L * 100];
};

if (process.argv[1] && process.argv[1].endsWith('theme-scan.mjs')) {
  const files = scopeFiles();
  const counts = {}, where = {};
  for (const f of files) {
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
      const k = m[0].toUpperCase();
      counts[k] = (counts[k] || 0) + 1;
      (where[k] = where[k] || new Set()).add(path.relative(SRC, f).split(path.sep).join('/'));
    }
  }
  console.log('IN-SCOPE FILES:', files.length, '| distinct hexes:', Object.keys(counts).length);
  const warm = Object.entries(counts)
    .map(([k, n]) => [k, n, ...toHsl(k)])
    .filter(([, , H, S]) => ((H >= 0 && H <= 50) || H >= 345) && S >= 25)
    .sort((a, b) => b[1] - a[1]);
  console.log('\n=== WARM/BRAND HEXES IN SCOPE ===');
  for (const [k, n, H, , L] of warm) {
    const w = [...where[k]];
    console.log(`  ${k} x${String(n).padStart(4)}  h=${H.toFixed(0).padStart(3)} l=${L.toFixed(0).padStart(3)}  ${w.slice(0, 2).join(', ')}${w.length > 2 ? ' +' + (w.length - 2) : ''}`);
  }
}
