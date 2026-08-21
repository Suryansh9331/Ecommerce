import { useCallback, useEffect, useState } from 'react';
import { getPlinkoCampaign, PlinkoCampaign } from '../services/plinkoService';

/**
 * Owns whether the lead-capture popup is open, and remembers the answer.
 *
 * There is no precedent for this in the app — MessengerPopup keeps its open state in
 * memory, so it reappears on every reload. Acceptable for a chat bubble; not for
 * something that asks for an email.
 *
 *   completed -> never again
 *   dismissed -> auto-opens again after the campaign's cooldown
 *   unseen    -> auto-opens after the configured delay
 *
 * Keyed by campaign id, so a new campaign gets everyone a fresh look rather than being
 * suppressed by stale state.
 *
 * `autoOpen` gates only the automatic opening (homepage). The campaign is fetched
 * everywhere so the manual re-entry trigger can follow the shopper around the site:
 * someone who dismissed the popup and then went browsing is exactly the person who
 * still needs a way back in.
 */
const STORAGE_KEY = 'aoin_plinko_state';

type Status = 'unseen' | 'dismissed' | 'completed';

interface StoredState {
  status: Status;
  lastShownAt: number;
  campaignId: number | null;
}

const readState = (): StoredState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredState) : null;
  } catch {
    // Corrupt or unavailable storage must not stop the page rendering.
    return null;
  }
};

const writeState = (state: StoredState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private browsing / quota — the popup just loses its memory. */
  }
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const usePlinkoPopup = (autoOpen: boolean) => {
  const [campaign, setCampaign] = useState<PlinkoCampaign | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Status>('unseen');
  // True once we have decided the popup is not opening by itself right now, which is
  // the moment the manual trigger becomes useful. Without it the trigger would flash
  // on screen during the opening delay and then be covered by the popup.
  const [triggerReady, setTriggerReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    getPlinkoCampaign()
      .then((data) => {
        if (cancelled || !data.active) return;
        setCampaign(data);

        const stored = readState();
        const sameCampaign = stored?.campaignId === (data.campaign_id ?? null);
        const storedStatus = sameCampaign ? stored?.status ?? 'unseen' : 'unseen';
        setStatus(storedStatus);

        if (storedStatus === 'completed') return;

        const cooldownPassed =
          storedStatus !== 'dismissed' ||
          Date.now() - (stored?.lastShownAt ?? 0) >=
            (data.redisplay_after_days ?? 7) * DAY_MS;

        if (autoOpen && cooldownPassed) {
          timer = setTimeout(() => {
            if (cancelled) return;
            setIsOpen(true);
            setTriggerReady(true);
          }, (data.popup_delay_seconds ?? 5) * 1000);
        } else {
          setTriggerReady(true);
        }
      })
      .catch(() => {
        /* No campaign, or the API is down. The storefront carries on regardless. */
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [autoOpen]);

  const remember = useCallback(
    (next: Status) => {
      setStatus(next);
      writeState({
        status: next,
        lastShownAt: Date.now(),
        campaignId: campaign?.campaign_id ?? null,
      });
    },
    [campaign]
  );

  const dismiss = useCallback(() => {
    setIsOpen(false);
    setTriggerReady(true);
    // Only downgrade to 'dismissed' if they had not already finished — closing the
    // popup after claiming a code must not put it back in the rotation.
    if (status !== 'completed') remember('dismissed');
  }, [status, remember]);

  const complete = useCallback(() => remember('completed'), [remember]);

  const reopen = useCallback(() => setIsOpen(true), []);

  return {
    campaign,
    isOpen,
    dismiss,
    complete,
    reopen,
    // The way back in for someone who closed the popup without playing.
    showTrigger:
      !!campaign?.active && !isOpen && triggerReady && status !== 'completed',
  };
};
