import React from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * The progressive reveal.
 *
 * This renders whatever string the server sent and nothing more. Before the phone
 * number arrives the server sends a masked string whose hidden half simply does not
 * exist client-side, so the blur below is a visual flourish rather than the thing
 * protecting the code.
 */
interface CouponRevealProps {
  code: string;
  fullyRevealed: boolean;
  label?: string | null;
  validUntil?: string | null;
  terms?: string | null;
  minOrderValue?: number | null;
}

const CouponReveal: React.FC<CouponRevealProps> = ({
  code,
  fullyRevealed,
  label,
  validUntil,
  terms,
  minOrderValue,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard blocked — the code is on screen to type. */
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-primary-400/40 bg-white/[0.04] p-5 text-center backdrop-blur">
      {label && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-300">
          {label}
        </p>
      )}

      <div className="flex items-center justify-center gap-2.5">
        <span
          className={`font-mono text-2xl font-bold tracking-[0.18em] text-white transition-all duration-500 ${
            fullyRevealed ? '' : 'select-none blur-[4px]'
          }`}
        >
          {code}
        </span>
        {fullyRevealed && (
          <button
            type="button"
            onClick={copy}
            aria-label="Copy coupon code"
            className="rounded-lg p-1.5 text-primary-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
          </button>
        )}
      </div>

      {!fullyRevealed && (
        <p className="mt-3 text-xs text-white/45">
          Add your mobile number to unlock the full code.
        </p>
      )}

      {fullyRevealed && (
        <div className="mt-4 space-y-1 text-[11px] leading-relaxed text-white/45">
          {validUntil && <p>Valid until {validUntil}.</p>}
          {minOrderValue ? <p>Minimum order ₹{minOrderValue}.</p> : null}
          {terms && <p>{terms}</p>}
        </div>
      )}
    </div>
  );
};

export default CouponReveal;
