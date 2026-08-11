/**
 * Appends `?currency=` to our own API calls.
 *
 * There are 606 `fetch` call sites across 150 files and no shared API client, so
 * migrating them one by one is not realistic. This wraps `window.fetch` once
 * instead — which makes it the single riskiest piece of code in the currency work,
 * because a mistake here breaks every network request in the app rather than one
 * screen.
 *
 * Hence the rules below, all of which exist because the alternative was observed
 * in this codebase:
 *
 *  1. **Allowlist, never denylist.** Only our own API origin is touched. Requests
 *     to the local debug ingest endpoint (main.tsx, App.tsx, CartContext.tsx all
 *     POST to 127.0.0.1:7247), Cloudinary uploads and the Razorpay checkout script
 *     pass through completely untouched.
 *  2. **Never overwrite an existing `currency` param.** A caller that set one
 *     meant it.
 *  3. **Body and headers are never touched.** FormData uploads break if the body
 *     is read or re-created, and adding a header would turn every public product
 *     GET into a CORS preflight round-trip.
 *  4. **`Request` objects are preserved.** Rebuilding one drops properties.
 *  5. **`/api/auth/*` is excluded.** Auth has nothing to do with currency and is
 *     the last thing that should break from a display feature.
 *  6. **Install-once**, guarded against Vite HMR double-wrapping — a double wrap
 *     would append the param twice.
 */
import { BASE_CURRENCY, getCurrency } from "./currencyStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

const INSTALL_FLAG = "__aoinCurrencyFetchInstalled";

/** Paths that must never be modified, even on our own origin. */
const EXCLUDED_PATH_PREFIXES = ["/api/auth/", "/api/razorpay/", "/api/checkout/"];

function apiOrigin(): string | null {
  if (!API_BASE_URL) return null;
  try {
    return new URL(API_BASE_URL, window.location.origin).origin;
  } catch {
    return null;
  }
}

/** Is this a request to our own API, and one we are allowed to touch? */
export function shouldAppendCurrency(url: URL): boolean {
  const ours = apiOrigin();
  if (!ours || url.origin !== ours) return false;

  // Amounts on these paths are decided by the server from a quote or a plan;
  // presentment has no business in them.
  if (EXCLUDED_PATH_PREFIXES.some((p) => url.pathname.startsWith(p))) return false;

  // Respect a currency the caller chose explicitly.
  if (url.searchParams.has("currency")) return false;

  return true;
}

function withCurrency(rawUrl: string, currency: string): string {
  try {
    const url = new URL(rawUrl, window.location.origin);
    if (!shouldAppendCurrency(url)) return rawUrl;
    url.searchParams.set("currency", currency);
    return url.toString();
  } catch {
    // Not a parseable URL — leave it exactly as it was.
    return rawUrl;
  }
}

export function installCurrencyFetchInterceptor() {
  if (typeof window === "undefined") return;

  const w = window as unknown as Record<string, unknown>;
  if (w[INSTALL_FLAG]) return; // HMR re-import, or a second call
  w[INSTALL_FLAG] = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    let currency: string;
    try {
      currency = getCurrency();
    } catch {
      return originalFetch(input as RequestInfo, init);
    }

    // While the store is on the base currency there is nothing to add, so the
    // interceptor is a pure passthrough — which is the state the app ships in.
    if (!currency || currency === BASE_CURRENCY) {
      return originalFetch(input as RequestInfo, init);
    }

    try {
      if (typeof input === "string") {
        return originalFetch(withCurrency(input, currency), init);
      }

      if (input instanceof URL) {
        return originalFetch(withCurrency(input.toString(), currency), init);
      }

      if (input instanceof Request) {
        const patched = withCurrency(input.url, currency);
        if (patched === input.url) return originalFetch(input, init);
        // Clone via the Request constructor so method, headers, body, mode,
        // credentials and signal all carry over untouched.
        return originalFetch(new Request(patched, input), init);
      }
    } catch (e) {
      // Any failure here must degrade to the original request, never to a
      // rejected promise. A broken currency param is a cosmetic bug; a fetch
      // wrapper that throws takes down the whole site.
      console.error("currency fetch interceptor failed; passing through:", e);
    }

    return originalFetch(input as RequestInfo, init);
  } as typeof window.fetch;
}

/** Test seam — restores the original fetch. */
export function __uninstallForTests(original?: typeof window.fetch) {
  const w = window as unknown as Record<string, unknown>;
  w[INSTALL_FLAG] = false;
  if (original) window.fetch = original;
}
