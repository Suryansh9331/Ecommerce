/**
 * React binding over the module-level currency store.
 *
 * The store, not this provider, is the source of truth — see the note at the top
 * of `utils/currencyStore.ts` about provider effects firing inner-to-outer. This
 * component only subscribes so that components re-render when the store changes,
 * and kicks off the one-time fetch of the server's currency context.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  BASE_CURRENCY,
  applyServerContext,
  getState,
  lockCurrency,
  setCurrency as storeSetCurrency,
  subscribe,
  unlockCurrency,
} from "../utils/currencyStore";
import { formatMoney, type FormatOptions } from "../utils/money";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CurrencyContextValue {
  currency: string;
  chargeCurrency: string;
  supported: string[];
  resolved: boolean;
  locked: boolean;
  /** True when prices are shown in one currency but charged in another. */
  isPresentmentOnly: boolean;
  setCurrency: (c: string) => boolean;
  lock: () => void;
  unlock: () => void;
  format: (amount: number | string | null | undefined, o?: FormatOptions) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [snapshot, setSnapshot] = useState(getState);

  useEffect(() => subscribe(setSnapshot), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/currency/context`);
        if (!resp.ok) return;
        const ctx = await resp.json();
        if (!cancelled) applyServerContext(ctx);
      } catch (e) {
        // No context means the store stays on INR, which is the correct and safe
        // default. Never let this fail the app.
        console.warn("Currency context unavailable; staying on base currency.", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value: CurrencyContextValue = {
    currency: snapshot.current,
    chargeCurrency: snapshot.charge,
    supported: snapshot.supported,
    resolved: snapshot.resolved,
    locked: snapshot.locked,
    isPresentmentOnly: snapshot.current !== snapshot.charge,
    setCurrency: useCallback((c: string) => storeSetCurrency(c), []),
    lock: useCallback(() => lockCurrency(), []),
    unlock: useCallback(() => unlockCurrency(), []),
    format: useCallback(
      (amount, o) => formatMoney(amount, { currency: snapshot.current, ...o }),
      [snapshot.current]
    ),
  };

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
};

/**
 * Read the active currency and a formatter.
 *
 * Safe to call outside the provider — it degrades to the base currency rather
 * than throwing, so a component can be migrated before the provider is mounted
 * everywhere it renders.
 */
export function useMoney(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;

  return {
    currency: BASE_CURRENCY,
    chargeCurrency: BASE_CURRENCY,
    supported: [BASE_CURRENCY],
    resolved: false,
    locked: false,
    isPresentmentOnly: false,
    setCurrency: () => false,
    lock: () => {},
    unlock: () => {},
    format: (amount, o) => formatMoney(amount, { currency: BASE_CURRENCY, ...o }),
  };
}

export default CurrencyContext;
