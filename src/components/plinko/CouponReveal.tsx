import React from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * The coupon card, in one of three states: hidden, half revealed, fully revealed.
 *
 * It renders exactly the string the server sent and nothing more. Before the phone
 * number arrives that string genuinely does not contain the hidden characters, so the
 * blur here is decoration on top of a server-side split — not the thing protecting the
 * code. Reading it out of the DOM gets you bullets.
 */
interface CouponRevealProps {
  /** Server-supplied string: bullets, half code, or the whole thing. */
  code: string;
  state: 'hidden' | 'half' | 'full';
  label?: string | null;
  validUntil?: string | null;
  terms?: string | null;
  minOrderValue?: number | null;
}

const CouponReveal: React.FC<CouponRevealProps> = ({
  code,
  state,
  label,
  validUntil,
  terms,
  minOrderValue,
}) => {
  const [copied, setCopied] = React.useState(false);
  const isFull = state === 'full';

  // The server sends the real prefix followed by bullets for whatever it is still
  // withholding, so the split point is simply the first bullet.
  const display = code || '••••••••••••';
  const firstBullet = display.indexOf('\u2022');
  const revealed = firstBullet === -1 ? display : display.slice(0, firstBullet);
  const masked = firstBullet === -1 ? '' : display.slice(firstBullet);

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
    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-primary-300 bg-primary-50 px-5 py-4">
      {/* Ticket notches, so it reads as a coupon rather than an input box. */}
      <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white" aria-hidden />
      <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white" aria-hidden />

      {label && (
        <p className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600">
          {label} coupon
        </p>
      )}

      <div className="flex items-center justify-center gap-2.5">
        {/* The revealed characters are rendered crisp and the masked ones blurred
            separately. Blurring the whole string — which is what this did — made the
            half-revealed state unreadable, so "half unlocked" showed the customer
            nothing and the progressive reveal had no visible payoff. */}
        <span className="font-mono text-xl font-bold tracking-[0.14em] sm:text-2xl">
          {revealed && (
            <span className="text-gray-900 transition-all duration-500">{revealed}</span>
          )}
          {masked && (
            <span className="select-none text-gray-400 blur-[4px]" aria-hidden>
              {masked}
            </span>
          )}
        </span>
        {isFull && (
          <button
            type="button"
            onClick={copy}
            aria-label="Copy coupon code"
            className="shrink-0 rounded-lg border border-primary-200 bg-white p-2 text-primary-600 transition-colors hover:bg-primary-100"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        )}
      </div>

      {copied && (
        <p className="mt-1.5 text-center text-[11px] font-medium text-emerald-600">
          Copied to clipboard
        </p>
      )}

      {state === 'hidden' && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Enter your email below to reveal it
        </p>
      )}
      {state === 'half' && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Half unlocked — add your mobile number for the rest
        </p>
      )}

      {isFull && (
        <div className="mt-3 space-y-0.5 border-t border-primary-200/70 pt-2.5 text-center text-[11px] leading-relaxed text-gray-500">
          {validUntil && <p>Valid until {validUntil}</p>}
          {minOrderValue ? <p>Minimum order ₹{minOrderValue}</p> : null}
          {terms && <p className="text-gray-400">{terms}</p>}
        </div>
      )}
    </div>
  );
};

export default CouponReveal;
