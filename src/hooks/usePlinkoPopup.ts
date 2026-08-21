import { useCallback, useEffect, useState } from 'react';
import { getPlinkoCampaign, PlinkoCampaign } from '../services/plinkoService';

/**
 * Decides whether the lead-capture popup should open, and remembers the answer.
 *
 * There is no existing precedent for this in the app — MessengerPopup keeps its
 * open/closed state in memory, so it reappears on every reload. A popup that does that
 * while asking for an email is just an annoyance, so the decision is persisted:
 *
 *   completed -> never show again
 *   dismissed -> show again after the campaign's redisplay_after_days
 *   unseen    -> show after popup_delay_seconds
 *
 * Keyed by campaign id, so launching a new campaign gives everyone a fresh look
 * without stale state suppressing it.
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
    // A corrupt or unavailable localStorage must not stop the page rendering.
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

export const usePlinkoPopup = (enabled: boolean) => {
  const [campaign, setCampaign] = useState<PlinkoCampaign | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    getPlinkoCampaign()
      .then((data) => {
        if (cancelled || !data.active) return;
        setCampaign(data);

        const stored = readState();
        const sameCampaign = stored?.campaignId === (data.campaign_id ?? null);

        if (sameCampaign && stored?.status === 'completed') return;
        if (sameCampaign && stored?.status === 'dismissed') {
          const cooldown = (data.redisplay_after_days ?? 7) * DAY_MS;
          if (Date.now() - stored.lastShownAt < cooldown) return;
        }

        timer = setTimeout(
          () => !cancelled && setIsOpen(true),
          (data.popup_delay_seconds ?? 5) * 1000
        );
      })
      .catch(() => {
        /* No campaign, or the API is down. The storefront carries on regardless. */
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled]);

  const remember = useCallback(
    (status: Status) => {
      writeState({
        status,
        lastShownAt: Date.now(),
        campaignId: campaign?.campaign_id ?? null,
      });
    },
    [campaign]
  );

  const dismiss = useCallback(() => {
    setIsOpen(false);
    remember('dismissed');
  }, [remember]);

  const complete = useCallback(() => remember('completed'), [remember]);

  return { campaign, isOpen, dismiss, complete };
};
