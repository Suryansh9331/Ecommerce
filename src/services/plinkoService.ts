/**
 * Storefront client for the lead-capture game.
 *
 * Three calls, and the split matters: the server only sends the full coupon code once
 * the phone number is in. The blur in the UI is presentation — if it were the only
 * thing hiding the code, anyone could read it from the network tab.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface PlinkoPrizeSlot {
  prize_id: number;
  label: string;
  slot_kind: 'coupon' | 'decoy';
  display_order: number;
}

export interface PlinkoCampaign {
  active: boolean;
  campaign_id?: number;
  headline?: string;
  subheadline?: string;
  terms_text?: string;
  popup_delay_seconds?: number;
  redisplay_after_days?: number;
  min_order_value?: number | null;
  prizes?: PlinkoPrizeSlot[];
}

export interface PlayResult {
  session_token: string;
  slot_index: number;
  prize_label: string;
  code_length: number;
}

export interface CouponResult {
  code: string;
  label: string | null;
  discount_type: string;
  discount_value: number;
  valid_until: string;
  terms: string | null;
  min_order_value: number | null;
  max_discount_amount: number | null;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/plinko/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data as T;
}

export const getPlinkoCampaign = async (): Promise<PlinkoCampaign> => {
  const response = await fetch(`${API_BASE_URL}/api/plinko/campaign`);
  if (!response.ok) return { active: false };
  return response.json();
};

export const playPlinko = (sourcePage: string) =>
  post<PlayResult>('play', { source_page: sourcePage });

export const revealWithEmail = (sessionToken: string, email: string) =>
  post<{ masked_code: string }>('reveal', { session_token: sessionToken, email });

export const claimWithPhone = (sessionToken: string, phone: string) =>
  post<CouponResult>('claim', { session_token: sessionToken, phone });
