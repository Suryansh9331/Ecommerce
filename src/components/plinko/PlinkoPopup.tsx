import React, { useEffect, useState } from 'react';
import { Loader2, Lock, Mail, PartyPopper, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import Celebration from './Celebration';
import PlinkoTrigger from './PlinkoTrigger';
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
 * Lead-capture popup: play, win, then trade contact details for the code.
 *
 * Two panels — the game and form on the left, campaign artwork on the right. The
 * artwork comes from the campaign record rather than being hardcoded; an earlier pass
 * shipped empty gradient blocks as stand-ins and they read as a broken page.
 *
 * 90vw x 90vh on desktop rather than a full bleed: keeping a margin of the storefront
 * visible around the edges makes this feel like a layer over the shop instead of a
 * separate page the customer got navigated to.
 *
 * Once the ball lands the board is replaced, in place, by the celebration and the
 * coupon — so the reward appears exactly where the player was looking.
 */
// 'landed' is a deliberate beat between the ball settling and the form appearing.
// Cutting straight to "give us your email" the instant it lands throws away the only
// moment the player actually cares about, and reads as a bait-and-switch.
type Stage = 'intro' | 'dropping' | 'landed' | 'email' | 'phone' | 'done';

const CELEBRATION_HOLD_MS = 2400;

const PHONE_DIGITS = 10;

const PlinkoPopup: React.FC = () => {
  const location = useLocation();
  // The popup opens by itself only on the homepage; the re-entry badge follows the
  // shopper everywhere, since someone who dismissed it and went browsing is exactly
  // who still needs a way back to the offer.
  const onHomepage = location.pathname === '/';
  const { campaign, isOpen, dismiss, complete, reopen, showTrigger } =
    usePlinkoPopup(onHomepage);
  const [triggerHidden, setTriggerHidden] = useState(false);

  const [stage, setStage] = useState<Stage>('intro');
  const [sessionToken, setSessionToken] = useState('');
  const [slotIndex, setSlotIndex] = useState<number | null>(null);
  const [prizeLabel, setPrizeLabel] = useState<string | null>(null);
  const [codeLength, setCodeLength] = useState(12);
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

  // Hold on the result before asking for anything.
  useEffect(() => {
    if (stage !== 'landed') return;
    const timer = setTimeout(() => setStage('email'), CELEBRATION_HOLD_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  if (!isOpen || !campaign?.active) {
    if (!showTrigger || triggerHidden) return null;
    return (
      <PlinkoTrigger onOpen={reopen} onHide={() => setTriggerHidden(true)} />
    );
  }

  const slots = (campaign.prizes ?? []).map((p) => p.label);
  const images = campaign.image_urls ?? [];
  // 'landed' still shows the board, so the winning slot stays lit during the hold.
  const hasWon = stage === 'email' || stage === 'phone' || stage === 'done';

  const handlePlay = async () => {
    setError('');
    setBusy(true);
    try {
      const result = await playPlinko(location.pathname);
      setSessionToken(result.session_token);
      setPrizeLabel(result.prize_label);
      setCodeLength(result.code_length);
      setStage('dropping');
      // Last: this is what starts the drop.
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
    'w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25';

  const buttonClass =
    'flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none';

  const couponState = stage === 'done' ? 'full' : stage === 'phone' ? 'half' : 'hidden';
  const couponCode =
    stage === 'done' && coupon
      ? coupon.code
      : stage === 'phone'
      ? maskedCode
      : '•'.repeat(codeLength);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-0 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={campaign.headline || 'Win a discount'}
      onMouseDown={(e) => e.target === e.currentTarget && dismiss()}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-white sm:h-[90vh] sm:w-[90vw] sm:flex-row sm:rounded-2xl sm:shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-30 rounded-full bg-white/90 p-2.5 text-gray-400 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-700 sm:right-5 sm:top-5"
        >
          <X size={20} />
        </button>

        {/* ---------------- Left: game, then reward ---------------- */}
        <div className="relative flex w-full flex-1 items-center justify-center overflow-y-auto px-6 py-10 sm:w-1/2 sm:px-10 lg:px-14">
          {(stage === 'landed' || stage === 'email' || stage === 'phone') && (
            <Celebration key="win" />
          )}
          {stage === 'done' && <Celebration key="done" intensity="small" />}

          <div className="relative z-10 w-full max-w-md">
            {!hasWon ? (
              <>
                <h2 className="text-center text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl">
                  {campaign.headline}
                </h2>
                <p className="mt-2 text-center text-[15px] text-gray-500">
                  {campaign.subheadline || 'Every drop wins a discount.'}
                </p>

                <div className="mt-7">
                  <PlinkoBoard
                    slotLabels={slots}
                    targetSlot={slotIndex}
                    onLanded={() => {
                      setBusy(false);
                      setStage('landed');
                    }}
                  />
                </div>

                <div className="mt-7">
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
                    <p className="text-center text-sm text-gray-400">Watch it fall…</p>
                  )}
                  {stage === 'landed' && (
                    <p className="animate-pulse text-center text-lg font-semibold text-primary-600">
                      You won {prizeLabel}!
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* The board is gone; the prize takes its place. */}
                <div className="text-center">
                  <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <PartyPopper size={26} />
                  </span>
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
                    {stage === 'done' ? 'Your code is ready' : 'Congratulations!'}
                  </h2>
                  <p className="mt-2 text-[15px] text-gray-500">
                    You won{' '}
                    <span className="font-semibold text-primary-600">{prizeLabel}</span>
                    {stage === 'done' ? ' — use it at checkout.' : ' on today’s order.'}
                  </p>
                </div>

                <div className="mt-6">
                  <CouponReveal
                    code={couponCode}
                    state={couponState}
                    label={prizeLabel}
                    validUntil={coupon?.valid_until}
                    terms={coupon?.terms}
                    minOrderValue={coupon?.min_order_value}
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}

                <div className="mt-5">
                  {stage === 'email' && (
                    <form onSubmit={handleEmail} className="space-y-3">
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
                        {busy ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Mail size={16} />
                        )}
                        {busy ? 'Checking…' : 'Reveal my code'}
                      </button>
                    </form>
                  )}

                  {stage === 'phone' && (
                    <form onSubmit={handlePhone} className="space-y-3">
                      <div className="flex">
                        <span className="inline-flex select-none items-center rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 px-3.5 text-[15px] text-gray-500">
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

                  {stage === 'done' && (
                    <button type="button" onClick={dismiss} className={buttonClass}>
                      Claim your discount
                    </button>
                  )}
                </div>

                <p className="mt-4 text-center text-[11px] text-gray-400">
                  {stage === 'done'
                    ? 'Apply the code at checkout to use your discount.'
                    : 'We’ll only use these to send your coupon and order updates.'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ---------------- Right: campaign artwork ---------------- */}
        <div className="hidden w-1/2 bg-primary-50 sm:block">
          {images.length === 1 ? (
            // A lone image is treated as a finished poster, not a tile: campaign
            // creatives carry their own headline, offer badge and CTA, and cropping
            // one into a grid cell cuts that copy off. object-contain guarantees
            // nothing is lost.
            //
            // The panel behind it is near-white rather than dark. A poster rarely
            // matches this panel's proportions, so there will be letterbox bars, and
            // the current artwork carries its own pale margin — dark bars around a
            // white-edged poster look like a rendering fault, a light ground reads as
            // matting. Swap this if a campaign's artwork is dark to its edges.
            <div className="flex h-full items-center justify-center bg-[#F8F8F9]">
              <img
                src={images[0]}
                alt=""
                aria-hidden
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                }}
              />
            </div>
          ) : images.length > 1 ? (
            <div className="grid h-full grid-cols-2 grid-rows-2 gap-2.5 p-2.5">
              {images.slice(0, 4).map((src, i) => (
                <div key={`${src}-${i}`} className="overflow-hidden rounded-xl bg-primary-100">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    aria-hidden
                    className="h-full w-full object-cover"
                    // A broken campaign URL should leave a clean tile, not a torn icon.
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            // No artwork configured yet: a plain branded field beats placeholder boxes.
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
              <span className="text-5xl font-bold tracking-tight text-primary-600/30">
                AOIN
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlinkoPopup;
