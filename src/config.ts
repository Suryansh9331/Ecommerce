// ─── Environment variable validation ───────────────────────────────────────
// Recommended variables. If any are missing we WARN (console) but never throw —
// a missing optional integration must not crash the whole app. Each feature
// that depends on one of these is responsible for degrading gracefully.

const RECOMMENDED_VARS = [
  'VITE_CHAT_API_URL',
  'VITE_AI_API_URL',
  'VITE_RAZORPAY_KEY_ID',
] as const;

const missing = RECOMMENDED_VARS.filter((key) => !import.meta.env[key]);
if (missing.length > 0) {
  console.warn(
    `[Config] Missing environment variables (related features will be disabled or use fallbacks):\n` +
    missing.map((k) => `  • ${k}`).join('\n')
  );
}

// ─── Exports ────────────────────────────────────────────────────────────────
// Safe fallbacks so the app always boots. Consumers should check the value
// (e.g. `if (!AI_API_URL) { ...degrade... }`) before relying on the feature.

// Chat/AI default to the main API base when their own var is absent.
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

export const CHAT_API_URL = (import.meta.env.VITE_CHAT_API_URL as string) || API_BASE;
export const AI_API_URL   = (import.meta.env.VITE_AI_API_URL   as string) || API_BASE;

// Razorpay
export const RAZORPAY_KEY_ID  = (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || '';
export const RAZORPAY_CURRENCY = 'INR';

// ─── Branding ───────────────────────────────────────────────────────────────
// Single source of truth for the platform logo. Change the value here (or set
// the env var) and every site header, footer, merchant dashboard, superadmin
// panel and the printed-invoice watermark follows.
//
// Two things are NOT driven by this and must be changed by hand:
//   • the favicon — a static file at public/assets/favicon/favicon.ico
//   • the "AOIN" text wordmarks in the shop1-shop3 storefronts and the
//     creator sidebar, which render the brand as styled text, not an image.

// The artwork is a horizontal lockup — 1920x819 (2.34:1) — containing both the
// ornate "A" mark and the "Aoin Store" wordmark, on an opaque blue gradient.
// Because the wordmark is part of the image, the headers render this on its own
// and do NOT add a text wordmark beside it.
//
// Consumers size it by height with `w-auto object-contain`, so the full lockup
// always stays visible and correctly proportioned. If you swap this for artwork
// with a very different aspect ratio, re-check those `h-*` classes.
// The `e_trim` segment is deliberate: the source artwork carries a wide white
// margin that wasted ~37% of the rendered height, making the logo look small.
// Cloudinary strips it on the fly, so the artwork itself fills the frame (~1.6x
// larger at the same height). KEEP `e_trim` in the path if you swap the image.
export const PLATFORM_LOGO_URL =
  (import.meta.env.VITE_PLATFORM_LOGO_URL as string) ||
  'https://res.cloudinary.com/dggzjpqdi/image/upload/e_trim/v1786438044/ChatGPT_Image_Aug_11_2026_02_17_02_PM_a9xrnl.png';

// Kept separate from PLATFORM_LOGO_URL on purpose: Razorpay's checkout modal
// renders this itself and does not reliably support SVG, so it needs a
// publicly-reachable raster (PNG/JPG) image.
export const PAYMENT_LOGO_URL =
  (import.meta.env.VITE_PAYMENT_LOGO_URL as string) || PLATFORM_LOGO_URL;