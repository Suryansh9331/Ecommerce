// Pure helpers extracted from the wizard components so they're trivially
// testable. The components still import these so there's one source of truth.
import { MediaItem, WizardFormData } from './types';

/**
 * Re-apply sort_order and MAIN/thumbnail flags so index 0 is always the
 * primary product image. Used after any add / remove / reorder in Tab 1.
 */
export function normalizeMedia(list: MediaItem[]): MediaItem[] {
  return list.map((m, i) => ({
    ...m,
    sort_order: i,
    is_main_image: i === 0,
    is_thumbnail: i === 0,
  }));
}

/**
 * Move an image from index `from` to index `to`, returning a new array
 * with normalized sort_order / is_main_image / is_thumbnail flags.
 *
 * Returns the original array unchanged if either index is out of bounds
 * or the move is a no-op.
 */
export function reorderMedia(
  list: MediaItem[],
  from: number,
  to: number
): MediaItem[] {
  if (
    from < 0 ||
    from >= list.length ||
    to < 0 ||
    to >= list.length ||
    from === to
  ) {
    return list;
  }
  const next = Array.from(list);
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return normalizeMedia(next);
}

/**
 * Per-step validation rules for the Meesho wizard. Returns a map of
 * fieldName -> error message; empty map means the step is valid.
 *
 * Kept as a pure function so the wizard container and tests share
 * exactly the same rules.
 */
export function validateWizardStep(
  stepIndex: number,
  d: WizardFormData
): Record<string, string> {
  const e: Record<string, string> = {};

  if (stepIndex === 0) {
    if (!d.category_id) e.category_id = 'Select a category';
    if (!d.brand_id) e.brand_id = 'Select a brand';
    if (!d.product_name.trim()) e.product_name = 'Product name is required';
    else if (d.product_name.trim().length < 3)
      e.product_name = 'Use at least 3 characters';
    if (!d.product_description.trim())
      e.product_description = 'Description is required';
    if (d.media.length < 1) e.media = 'Upload at least one product image';
  }

  if (stepIndex === 1) {
    if (!d.selling_price) e.selling_price = 'Selling price is required';
    if (!d.mrp) e.mrp = 'MRP is required';
    if (d.mrp && d.selling_price && Number(d.mrp) < Number(d.selling_price)) {
      e.mrp = 'MRP must be greater than or equal to selling price';
    }
    if (d.wdrp && d.selling_price && Number(d.wdrp) > Number(d.selling_price)) {
      e.wdrp = 'WDRP must be less than or equal to selling price';
    }
  }

  if (stepIndex === 2) {
    if (!d.hsn_code.trim()) e.hsn_code = 'HSN code is required';
    else if (!/^\d{4,10}$/.test(d.hsn_code.trim()))
      e.hsn_code = 'HSN must be 4 to 10 digits';
    if (!d.country_of_origin.trim())
      e.country_of_origin = 'Country of origin is required';
    if (!d.manufacturer_details.trim())
      e.manufacturer_details = 'Manufacturer details required by Legal Metrology';
    if (!d.weight_g) e.weight_g = 'Package weight is required for shipping';
  }

  return e;
}

/**
 * Derived pricing used by Tab 2's live breakdown. Pure — safe to reuse
 * in tests to confirm calculations don't drift.
 */
export function computePriceBreakdown(d: {
  selling_price: string | number;
  wdrp?: string | number;
  mrp?: string | number;
  gst_rate?: string | number;
  commission_pct?: string | number;
}): {
  listed: number;
  wdrp: number;
  mrp: number;
  gst: number;
  shippingToCustomer: number;
  customerPrice: number;
  commissionAmt: number;
  gstOnCommission: number;
  bankSettlement: number;
} {
  const listed = Number(d.selling_price) || 0;
  const wdrp = Number(d.wdrp) || 0;
  const mrp = Number(d.mrp) || 0;
  const gst = Number(d.gst_rate) || 0;
  const commissionPct = Number(d.commission_pct) || 0;
  const shippingToCustomer = 0;
  const customerPrice = listed + shippingToCustomer;
  const commissionAmt = (listed * commissionPct) / 100;
  const gstOnCommission = (commissionAmt * 18) / 100;
  const bankSettlement = Math.max(listed - commissionAmt - gstOnCommission, 0);
  return {
    listed,
    wdrp,
    mrp,
    gst,
    shippingToCustomer,
    customerPrice,
    commissionAmt,
    gstOnCommission,
    bankSettlement,
  };
}
