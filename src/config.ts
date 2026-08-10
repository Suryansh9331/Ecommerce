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