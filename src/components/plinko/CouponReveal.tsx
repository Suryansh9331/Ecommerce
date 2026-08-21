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
    <div className="rounded-lg border border-dashed border-primary-300 bg-primary-50 p-4 text-center">
      {label && (
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary-600">
          {label}
        </p>
      )}

      <div className="flex items-center justify-center gap-2">
        <span
          className={`font-mono text-xl font-bold tracking-[0.15em] text-gray-900 ${
            fullyRevealed ? '' : 'blur-[3px] select-none'
          }`}
        >
          {code}
        </span>
        {fullyRevealed && (
          <button
            type="button"
            onClick={copy}
            aria-label="Copy coupon code"
            className="rounded p-1 text-primary-600 hover:bg-primary-100"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        )}
      </div>

      {!fullyRevealed && (
        <p className="mt-2 text-xs text-gray-500">
          Add your mobile number to unlock the full code.
        </p>
      )}

      {fullyRevealed && (
        <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-gray-500">
          {validUntil && <p>Valid until {validUntil}.</p>}
          {minOrderValue ? <p>Minimum order ₹{minOrderValue}.</p> : null}
          {terms && <p>{terms}</p>}
        </div>
      )}
    </div>
  );
};

export default CouponReveal;
