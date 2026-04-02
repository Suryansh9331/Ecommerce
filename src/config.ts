// ─── Environment variable validation ───────────────────────────────────────
// This runs at build time in production. If any required variable is missing,
// the build throws immediately — preventing a broken deploy.

const REQUIRED_VARS = [
  'VITE_CHAT_API_URL',
  'VITE_AI_API_URL',
  'VITE_RAZORPAY_KEY_ID',
] as const;

if (import.meta.env.PROD) {
  const missing = REQUIRED_VARS.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `\n\n[Config Error] Missing required environment variables:\n` +
      missing.map((k) => `  ✗ ${k}`).join('\n') +
      `\n\nAdd these to your .env.production file before building.\n`
    );
  }
}

// ─── Exports ────────────────────────────────────────────────────────────────
// No fallbacks below. In production, missing vars crash the build above.
// In development, you must have a .env.local with these set.

export const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL as string;
export const AI_API_URL   = import.meta.env.VITE_AI_API_URL   as string;

// Razorpay
export const RAZORPAY_KEY_ID  = import.meta.env.VITE_RAZORPAY_KEY_ID as string;
export const RAZORPAY_CURRENCY = 'INR';