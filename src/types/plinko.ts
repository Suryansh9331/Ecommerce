export interface PlinkoLeadRow {
  lead_id: number;
  campaign_id: number;
  prize_label: string | null;
  promotion_id: number | null;
  email: string | null;
  phone: string | null;
  status: 'played' | 'email_captured' | 'completed';
  source_page: string | null;
  created_at: string | null;
  coupon_revealed_at: string | null;
  code: string | null;
  discount: string | null;
  valid_until: string | null;
  redeemed: boolean;
  redeemed_at: string | null;
  order_id: string | null;
  discount_given: number | null;
}

export interface Pagination {
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PlinkoStats {
  plays: number;
  emails_captured: number;
  completed: number;
  completion_rate: number;
  codes_redeemed: number;
  discount_given: number;
  minted_today: number;
  daily_mint_ceiling: number;
  remaining_today: number;
}

export interface PlinkoPrizeConfig {
  prize_id?: number;
  label: string;
  slot_kind: 'coupon' | 'decoy';
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number | null;
  weight: number;
  display_order: number;
  is_active: boolean;
}

export interface PlinkoCampaignConfig {
  campaign_id?: number;
  name: string;
  is_active: boolean;
  headline: string;
  subheadline: string | null;
  terms_text: string | null;
  coupon_prefix: string;
  validity_days: number;
  min_order_value: number | null;
  max_discount_amount: number | null;
  popup_delay_seconds: number;
  redisplay_after_days: number;
  daily_mint_ceiling: number;
  start_date: string | null;
  end_date: string | null;
  prizes: PlinkoPrizeConfig[];
}

export interface LeadFilters {
  status?: string;
  campaign_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
}
