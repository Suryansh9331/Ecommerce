import React from 'react';
import { Gift, X } from 'lucide-react';

/**
 * The way back into the game for someone who closed the popup without playing.
 *
 * Without this the offer is a one-shot: dismiss it once and the only way back is a
 * cooldown measured in days. That loses precisely the shopper who was interested but
 * busy at the time.
 *
 * Two shapes rather than one scaled down. On desktop there is room for a badge that
 * says what the offer is, and an unlabelled icon in the corner just reads as clutter.
 * On a phone that badge would eat the width a storefront needs, so it collapses to a
 * single gift button.
 *
 * Sits bottom-left because MessengerPopup already owns bottom-right.
 */
interface PlinkoTriggerProps {
  onOpen: () => void;
  onHide: () => void;
  label?: string;
}

const PlinkoTrigger: React.FC<PlinkoTriggerProps> = ({ onOpen, onHide, label }) => (
  <div className="fixed bottom-4 left-4 z-40 sm:bottom-5 sm:left-5">
    <div className="group relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={label || 'Open the discount game'}
        className="flex items-center gap-2.5 rounded-full bg-primary-600 px-3.5 py-3.5 text-white shadow-lg shadow-primary-600/30 transition-all hover:bg-primary-700 hover:shadow-xl active:scale-95 sm:px-5 sm:py-3"
      >
        <span className="relative flex items-center">
          {/* A slow ping rather than a bounce: noticeable in peripheral vision,
              not something that pulls the eye off the page every second. */}
          <span
            aria-hidden
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40 opacity-60"
          />
          <Gift size={20} className="relative" />
        </span>
        <span className="hidden text-sm font-semibold sm:inline">
          {label || 'Win a discount'}
        </span>
      </button>

      {/* Dismissing the reminder is not the same as declining the offer: this hides
          the badge for the session without touching the stored campaign state. */}
      <button
        type="button"
        onClick={onHide}
        aria-label="Hide this reminder"
        className="absolute -right-1 -top-1 rounded-full border border-gray-200 bg-white p-1 text-gray-400 opacity-0 shadow-sm transition-opacity hover:text-gray-700 focus:opacity-100 group-hover:opacity-100"
      >
        <X size={12} />
      </button>
    </div>
  </div>
);

export default PlinkoTrigger;
