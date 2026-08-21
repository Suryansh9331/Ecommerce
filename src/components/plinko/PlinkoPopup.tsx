import React, { useEffect, useState } from 'react';
import { Loader2, Lock, X } from 'lucide-react';
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
 * Full-viewport lead-capture takeover.
 *
 * Genuinely full-page — inset-0 with no max-width and no letterboxing — because a
 * centred card competes with the page behind it and reads as an ad. Filling the
 * viewport makes the game the only thing on screen, which is the point.
 *
 * Not built on components/common/Modal: that is a centred card with no scroll lock and
 * no Esc handling.
 *
 * Deliberately no decorative image grid. An earlier pass had one filled with empty
 * gradient blocks standing in for photography that does not exist yet, which looked
 * broken. Until there is real art to put there, the game plus a dark field is a
 * stronger composition than placeholders.
 */
type Stage = 'intro' | 'dropping' | 'email' | 'phone' | 'done';

const PHONE_DIGITS = 10;

const StepDots: React.FC<{ stage: Stage }> = ({ stage }) => {
  const order: Stage[] = ['intro', 'email', 'phone', 'done'];
  const active = stage === 'dropping' ? 0 : order.indexOf(stage);
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      {order.map((_, i) => (
        <span
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ${
            i <= active ? 'w-7 bg-primary-400' : 'w-3 bg-white/20'
          }`}
        />
      ))}
    </div>
  );
};

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
      setPrizeLabel(result.prize_label);
      setStage('dropping');
      // Set last: this is what starts the drop, and the solve is synchronous.
      setSlotIndex(result.slot_index);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the game.');
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
    'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-[15px] text-white placeholder:text-white/35 backdrop-blur transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40';

  const buttonClass =
    'flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-primary-600/30 transition-all hover:bg-primary-400 hover:shadow-primary-500/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none';

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-primary-950"
      role="dialog"
      aria-modal="true"
      aria-label={campaign.headline || 'Win a discount'}
    >
      {/* Depth: two soft light sources, so the field is not a flat block of colour. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(60rem 40rem at 50% -10%, rgba(59,30,235,0.42), transparent 65%),' +
            'radial-gradient(40rem 32rem at 85% 105%, rgba(103,227,249,0.14), transparent 60%)',
        }}
      />

      <button
        type="button"
        onClick={dismiss}
        aria-label="Close"
        className="fixed right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2.5 text-white/60 backdrop-blur transition-colors hover:bg-white/10 hover:text-white sm:right-6 sm:top-6"
      >
        <X size={20} />
      </button>

      <div className="relative flex min-h-full items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[30rem]">
          {stage === 'done' && coupon ? (
            <div className="text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">
                Unlocked
              </p>
              <h2 className="mb-2 text-4xl font-bold leading-tight text-white sm:text-5xl">
                You&apos;ve got {coupon.label}
              </h2>
              <p className="mb-7 text-[15px] text-white/50">
                This code is yours alone — use it at checkout.
              </p>
              <CouponReveal
                code={coupon.code}
                fullyRevealed
                label={coupon.label}
                validUntil={coupon.valid_until}
                terms={coupon.terms}
                minOrderValue={coupon.min_order_value}
              />
              <button type="button" onClick={dismiss} className={`${buttonClass} mt-6`}>
                Start shopping
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                  {campaign.headline}
                </h2>
                <p className="mt-2 text-[15px] text-white/50">
                  {campaign.subheadline || 'Every drop wins a discount.'}
                </p>
              </div>

              <PlinkoBoard
                slotLabels={slots}
                targetSlot={slotIndex}
                onLanded={() => {
                  setBusy(false);
                  setStage('email');
                }}
              />

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </p>
              )}

              <div className="mt-6">
                {stage === 'intro' && (
                  <button
                    type="button"
                    onClick={handlePlay}
                    disabled={busy}
                    className={buttonClass}
                  >
                    {busy && <Loader2 size={17} className="animate-spin" />}
                    {busy ? 'Dropping…' : 'Try your luck'}
                  </button>
                )}

                {stage === 'dropping' && (
                  <p className="text-center text-sm text-white/40">Watch it fall…</p>
                )}

                {stage === 'email' && (
                  <form onSubmit={handleEmail} className="space-y-3">
                    <p className="text-center text-[15px] text-white/80">
                      You won{' '}
                      <span className="font-semibold text-primary-300">{prizeLabel}</span>
                      ! Enter your email to reveal your code.
                    </p>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      className={inputClass}
                      autoComplete="email"
                    />
                    <button type="submit" disabled={busy} className={buttonClass}>
                      {busy && <Loader2 size={17} className="animate-spin" />}
                      {busy ? 'Checking…' : 'Reveal my code'}
                    </button>
                  </form>
                )}

                {stage === 'phone' && (
                  <form onSubmit={handlePhone} className="space-y-3">
                    <CouponReveal
                      code={maskedCode}
                      fullyRevealed={false}
                      label={prizeLabel}
                    />
                    <div className="flex">
                      <span className="inline-flex select-none items-center rounded-l-xl border border-r-0 border-white/15 bg-white/5 px-3.5 text-[15px] text-white/50">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        required
                        autoFocus
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
                      className={buttonClass}
                    >
                      {busy ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <Lock size={16} />
                      )}
                      {busy ? 'Unlocking…' : 'Unlock full code'}
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-7">
                <StepDots stage={stage} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlinkoPopup;
