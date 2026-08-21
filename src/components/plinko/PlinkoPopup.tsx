import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import CouponReveal from './CouponReveal';
import PlinkoBoard from './PlinkoBoard';
import { usePlinkoPopup } from '../../hooks/usePlinkoPopup';
import {
  claimWithPhone,
  CouponResult,
  playPlinko,
  revealWithEmail,
} from '../../services/plinkoService';

/**
 * Full-screen lead-capture popup.
 *
 * Not built on components/common/Modal.tsx: that one is a centred card with no scroll
 * lock and no Esc handling, both of which a full-screen takeover needs.
 *
 * Layout follows the reference (board left, imagery right, prize strip under the
 * board) but the palette is AOIN's primary-* scale, not the reference's.
 */
type Stage = 'intro' | 'dropping' | 'email' | 'phone' | 'done';

const PHONE_DIGITS = 10;

const PlinkoPopup: React.FC = () => {
  const location = useLocation();
  const onHomepage = location.pathname === '/';
  const { campaign, isOpen, dismiss, complete } = usePlinkoPopup(onHomepage);

  const [stage, setStage] = useState<Stage>('intro');
  const [sessionToken, setSessionToken] = useState('');
  const [slotIndex, setSlotIndex] = useState<number | null>(null);
  const [prizeLabel, setPrizeLabel] = useState<string | null>(null);
  const [maskedCode, setMaskedCode] = useState('');
  const [coupon, setCoupon] = useState<CouponResult | null>(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Esc to close, and no background scrolling behind a full-screen takeover.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, dismiss]);

  if (!isOpen || !campaign?.active) return null;

  const slots = (campaign.prizes ?? []).map((p) => p.label);

  const handlePlay = async () => {
    setError('');
    setBusy(true);
    try {
      const result = await playPlinko(location.pathname);
      setSessionToken(result.session_token);
      setSlotIndex(result.slot_index);
      setPrizeLabel(result.prize_label);
      setStage('dropping');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the game.');
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { masked_code } = await revealWithEmail(sessionToken, email.trim());
      setMaskedCode(masked_code);
      setStage('phone');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your email.');
    } finally {
      setBusy(false);
    }
  };

  const handlePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await claimWithPhone(sessionToken, phone);
      setCoupon(result);
      setStage('done');
      complete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unlock your code.');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={campaign.headline || 'Win a discount'}
    >
      <div className="relative flex h-full w-full max-w-5xl flex-col overflow-y-auto bg-white sm:h-auto sm:max-h-[90vh] sm:flex-row sm:rounded-xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {/* Game */}
        <div className="flex w-full flex-col justify-center px-6 py-10 sm:w-1/2 sm:px-10">
          {stage === 'done' && coupon ? (
            <>
              <h2 className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                You&apos;ve got {coupon.label}
              </h2>
              <p className="mb-5 text-sm text-gray-500">
                Use this code at checkout — it&apos;s yours alone.
              </p>
              <CouponReveal
                code={coupon.code}
                fullyRevealed
                label={coupon.label}
                validUntil={coupon.valid_until}
                terms={coupon.terms}
                minOrderValue={coupon.min_order_value}
              />
              <button
                type="button"
                onClick={dismiss}
                className="mt-5 w-full rounded-md bg-primary-600 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
              >
                Start shopping
              </button>
            </>
          ) : (
            <>
              <h2 className="mb-1 text-3xl font-bold text-gray-900 sm:text-4xl">
                {campaign.headline}
              </h2>
              {campaign.subheadline && (
                <p className="mb-4 text-sm text-gray-500">{campaign.subheadline}</p>
              )}

              <PlinkoBoard
                slotLabels={slots}
                targetSlot={slotIndex}
                onLanded={() => stage === 'dropping' && setStage('email')}
              />

              {error && (
                <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              {stage === 'intro' && (
                <button
                  type="button"
                  onClick={handlePlay}
                  disabled={busy}
                  className="mt-5 w-full rounded-md bg-primary-600 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-400"
                >
                  {busy ? 'Dropping…' : 'Try your luck'}
                </button>
              )}

              {stage === 'dropping' && (
                <p className="mt-5 text-center text-sm text-gray-500">Dropping…</p>
              )}

              {stage === 'email' && (
                <form onSubmit={handleEmail} className="mt-5 space-y-3">
                  <p className="text-center text-sm font-medium text-gray-700">
                    You won {prizeLabel}! Enter your email to reveal your code.
                  </p>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className={inputClass}
                    autoComplete="email"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-md bg-primary-600 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-400"
                  >
                    {busy ? 'Checking…' : 'Reveal my code'}
                  </button>
                </form>
              )}

              {stage === 'phone' && (
                <form onSubmit={handlePhone} className="mt-5 space-y-3">
                  <CouponReveal code={maskedCode} fullyRevealed={false} label={prizeLabel} />
                  <div className="flex">
                    <span className="inline-flex select-none items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      required
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, PHONE_DIGITS))
                      }
                      placeholder="98765 43210"
                      className={`${inputClass} rounded-l-none`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy || phone.length !== PHONE_DIGITS}
                    className="w-full rounded-md bg-primary-600 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-400"
                  >
                    {busy ? 'Unlocking…' : 'Unlock full code'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Imagery */}
        <div className="hidden w-1/2 bg-primary-50 sm:block">
          <div className="grid h-full grid-cols-2 gap-3 p-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg bg-gradient-to-br from-primary-100 to-primary-200"
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlinkoPopup;
