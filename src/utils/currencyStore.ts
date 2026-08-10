/**
 * The active display currency.
 *
 * **Module-level state, deliberately not React state.** Providers render
 * outer-to-inner but their effects fire inner-to-outer, so a currency provider
 * wrapping CartProvider would install its value *after* CartProvider's first fetch
 * had already gone out — that first request would be missing `?currency=` and the
 * cart would render in the wrong currency until something re-fetched it.
 *
 * A module-level value is set at import time, before any component mounts, so the
 * fetch interceptor always has an answer.
 *
 * INR is the initial value and the fallback everywhere. While it stays INR, every
 * formatted string is byte-identical to what the app produced before this file
 * existed — so a half-migrated app is never a broken app.
 */

export type CurrencyCode = string;

const STORAGE_KEY = "aoin.currency";
export const BASE_CURRENCY = "INR";

interface CurrencyState {
  /** What prices are displayed in. */
  current: CurrencyCode;
  /** What the customer is actually charged in. INR until Razorpay international. */
  charge: CurrencyCode;
  supported: CurrencyCode[];
  /** True once the server's context response has been applied. */
  resolved: boolean;
  /** Set while a checkout is in flight — the currency must not change mid-payment. */
  locked: boolean;
}

const state: CurrencyState = {
  current: BASE_CURRENCY,
  charge: BASE_CURRENCY,
  supported: [BASE_CURRENCY],
  resolved: false,
  locked: false,
};

type Listener = (s: Readonly<CurrencyState>) => void;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) {
    try {
      l(getState());
    } catch (e) {
      console.error("currency listener failed:", e);
    }
  }
}

export function getState(): Readonly<CurrencyState> {
  return { ...state };
}

export function getCurrency(): CurrencyCode {
  return state.current;
}

export function getChargeCurrency(): CurrencyCode {
  return state.charge;
}

export function isBaseCurrency(): boolean {
  return state.current === BASE_CURRENCY;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Read a persisted choice. A user's explicit pick outranks geo detection. */
export function loadPersistedCurrency(): CurrencyCode | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing / storage disabled. Not being able to remember the choice
    // is survivable; throwing here would take the storefront down.
    return null;
  }
}

function persist(currency: CurrencyCode) {
  try {
    localStorage.setItem(STORAGE_KEY, currency);
  } catch {
    /* see loadPersistedCurrency */
  }
}

/**
 * Apply the server's answer from GET /api/currency/context.
 *
 * A currency the user already chose wins over the suggestion — geo detection must
 * never overrule someone who deliberately picked something.
 */
export function applyServerContext(ctx: {
  suggested_currency?: string;
  charge_currency?: string;
  supported_currencies?: string[];
}) {
  state.supported = ctx.supported_currencies?.length
    ? ctx.supported_currencies
    : [BASE_CURRENCY];
  state.charge = ctx.charge_currency || BASE_CURRENCY;

  const chosen = loadPersistedCurrency();
  const next =
    chosen && state.supported.includes(chosen)
      ? chosen
      : ctx.suggested_currency && state.supported.includes(ctx.suggested_currency)
      ? ctx.suggested_currency
      : BASE_CURRENCY;

  state.resolved = true;
  if (next !== state.current) {
    state.current = next;
    emit();
  } else {
    emit();
  }
}

/**
 * Switch currency in response to a user action.
 *
 * Returns false if the switch was refused. Refusing during checkout is the point:
 * the amount is already quoted and a currency change mid-payment would show one
 * number and charge another.
 */
export function setCurrency(currency: CurrencyCode): boolean {
  if (state.locked) {
    console.warn("Currency change refused: a checkout is in progress.");
    return false;
  }
  if (!state.supported.includes(currency)) {
    console.warn(`Currency ${currency} is not supported by this server.`);
    return false;
  }
  if (currency === state.current) return true;

  state.current = currency;
  persist(currency);
  emit();
  return true;
}

/** Lock the currency for the duration of a checkout. */
export function lockCurrency() {
  state.locked = true;
}

export function unlockCurrency() {
  state.locked = false;
}

export function isLocked(): boolean {
  return state.locked;
}

/** Test seam. */
export function __resetForTests() {
  state.current = BASE_CURRENCY;
  state.charge = BASE_CURRENCY;
  state.supported = [BASE_CURRENCY];
  state.resolved = false;
  state.locked = false;
  listeners.clear();
}
