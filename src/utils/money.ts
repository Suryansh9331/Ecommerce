/**
 * Money formatting, in one place.
 *
 * The app currently has 18 local money formatters and 236 hardcoded `₹` literals
 * across 67 files. This replaces them one surface at a time.
 *
 * **While the store is pinned to INR, `formatMoney` output is byte-identical to
 * the formatter it replaces** — the five duplicated `formatCurrency` copies all do
 * `Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', min/max 2})`, and
 * so does this when the currency is INR. That is what makes a half-migrated app
 * indistinguishable from the current one rather than half-broken.
 */
import { BASE_CURRENCY, getCurrency } from "./currencyStore";

/** Locale to format each currency in. Falls back to the browser's default. */
const LOCALE_BY_CURRENCY: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

export interface FormatOptions {
  /** Override the active currency. */
  currency?: string;
  /** Drop the decimals — for compact contexts like listing cards. */
  compact?: boolean;
  /** Render null/undefined as this. Defaults to an em dash. */
  fallback?: string;
}

/**
 * Format an amount in the active display currency.
 *
 * Accepts a string as well as a number, because the API emits money as strings
 * (invariant I9). Strings are parsed here at the very edge, for display only —
 * never for arithmetic.
 */
export function formatMoney(
  amount: number | string | null | undefined,
  options: FormatOptions = {}
): string {
  const { currency = getCurrency(), compact = false, fallback = "—" } = options;

  if (amount === null || amount === undefined || amount === "") return fallback;

  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return fallback;

  const locale = LOCALE_BY_CURRENCY[currency] || undefined;
  const digits = compact ? 0 : 2;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    // Intl throws on a currency code it does not know. Better a plain number with
    // the code beside it than a crashed price.
    return `${currency} ${value.toFixed(digits)}`;
  }
}

/** The symbol alone, for places that lay out the number themselves. */
export function currencySymbol(currency: string = getCurrency()): string {
  try {
    const parts = new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency] || undefined, {
      style: "currency",
      currency,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

/**
 * Read the presentment price off an API object.
 *
 * Handles both shapes the backend can return: the new `prices` block, and the bare
 * scalar that every existing call site already reads. Prefer this over touching
 * `product.price` directly in newly written code.
 */
export function priceOf(
  obj: Record<string, any> | null | undefined,
  key: "list" | "special" | "display" | "original" = "display"
): number | null {
  if (!obj) return null;

  const block = obj.prices?.[key];
  if (block?.amount !== undefined) return Number(block.amount);

  // Legacy scalars, in the order they map onto the block names.
  const legacy: Record<string, string> = {
    list: "selling_price",
    special: "special_price",
    display: "price",
    original: "originalPrice",
  };
  const raw = obj[legacy[key]];
  return raw === null || raw === undefined ? null : Number(raw);
}

/**
 * The INR amount behind a displayed price.
 *
 * Use this anywhere a number feeds arithmetic that must stay in the book currency
 * — never the presentment scalar, which changes meaning with the active currency.
 */
export function baseAmountOf(
  obj: Record<string, any> | null | undefined,
  key: "list" | "special" | "display" | "original" = "display"
): number | null {
  if (!obj) return null;

  const block = obj.prices?.[key];
  if (block?.amount_base !== undefined) return Number(block.amount_base);

  const inrKeys: Record<string, string> = {
    list: "selling_price_inr",
    special: "special_price_inr",
    display: "price_inr",
    original: "price_inr",
  };
  const inr = obj[inrKeys[key]];
  if (inr !== undefined && inr !== null) return Number(inr);

  // No presentment in this response, so the scalar IS the base amount.
  return priceOf(obj, key);
}

/** True when the displayed currency is not the one the customer will be charged in. */
export function isPresentmentOnly(chargeCurrency: string): boolean {
  return getCurrency() !== chargeCurrency;
}

export { BASE_CURRENCY };
