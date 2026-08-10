/**
 * Currency picker for the navbar.
 *
 * Renders nothing when there is only one currency to choose from, so it is
 * invisible until the server actually offers a choice — which means it can ship
 * before multi-currency is switched on.
 *
 * Switching reloads the page. That is crude, but it is provably correct: 100+
 * pages hold prices in local component state, fetched once on mount, and there is
 * no reliable way to invalidate all of them. A reload guarantees every price on
 * screen came back from the server in the new currency. Granular invalidation can
 * come later, once fewer screens cache prices.
 */
import React, { useEffect, useRef, useState } from "react";

import { useMoney } from "../../context/CurrencyContext";
import { currencySymbol } from "../../utils/money";

interface Props {
  /** Drawer variant renders an inline list instead of a dropdown. */
  variant?: "dropdown" | "inline";
  className?: string;
}

const CURRENCY_LABELS: Record<string, string> = {
  INR: "Indian Rupee",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
};

const CurrencySwitcher: React.FC<Props> = ({ variant = "dropdown", className = "" }) => {
  const { currency, supported, setCurrency, locked } = useMoney();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Nothing to switch between.
  if (!supported || supported.length < 2) return null;

  const choose = (next: string) => {
    setOpen(false);
    if (next === currency) return;
    if (!setCurrency(next)) return; // refused — locked during checkout
    window.location.reload();
  };

  if (variant === "inline") {
    return (
      <div className={className}>
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Currency
        </p>
        {supported.map((code) => (
          <button
            key={code}
            onClick={() => choose(code)}
            disabled={locked}
            className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm disabled:opacity-50 ${
              code === currency ? "font-semibold text-orange-600" : "text-gray-700"
            }`}
          >
            <span className="w-6">{currencySymbol(code)}</span>
            <span>{code}</span>
            <span className="text-gray-400">{CURRENCY_LABELS[code] ?? ""}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={locked}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change currency, currently ${currency}`}
        title={locked ? "Currency is locked during checkout" : undefined}
        className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
      >
        <span>{currencySymbol(currency)}</span>
        <span>{currency}</span>
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[11rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {supported.map((code) => (
            <li key={code}>
              <button
                role="option"
                aria-selected={code === currency}
                onClick={() => choose(code)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  code === currency ? "font-semibold text-orange-600" : "text-gray-700"
                }`}
              >
                <span className="w-4">{currencySymbol(code)}</span>
                <span>{code}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {CURRENCY_LABELS[code] ?? ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CurrencySwitcher;
