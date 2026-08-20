/**
 * Server-authoritative checkout quotes.
 *
 * The browser no longer states what a basket costs. It states *intent* — which
 * products, how many, which promo code — and the server answers with money it
 * computed itself, addressed by an opaque quote id. That id is what goes to the
 * payment gateway; the amount never travels from here again.
 *
 * See Ecommerce_Backend/docs/MULTI_CURRENCY.md, Phase 4.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** One priced line, as the server computed it. All money fields are strings. */
export interface CheckoutQuoteItem {
  product_id: number;
  merchant_id: number;
  quantity: number;
  product_name: string;
  unit_price_inclusive_gst: string;
  original_listed_inclusive_price_per_unit: string;
  discount_amount_per_unit_applied: string;
  gst_rate: string;
  gst_amount_per_unit: string;
  line_item_total_inclusive_gst: string;
}

/**
 * Money arrives as strings, never numbers — a float total is how 1299.00 becomes
 * 1298.9999999 in transit. Use `total_amount_minor` (an integer number of paise)
 * for anything that has to be exact, and the strings for display.
 */
export interface CheckoutQuote {
  quote_id: string;
  status: string;
  // Charge view: the currency and amounts the customer is actually charged
  // (presentment/USD when set, otherwise the INR book figure).
  currency: string;
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  shipping_amount: string;
  total_amount: string;
  total_amount_minor: number;
  // Book (INR) view + presentment metadata.
  base_currency?: string;
  base_total_amount?: string;
  is_presentment?: boolean;
  fx_rate_id?: number | null;
  expires_at: string;
  created_at: string;
  items: CheckoutQuoteItem[];
}

export interface QuoteRequestItem {
  product_id: number;
  quantity: number;
  selected_attributes?: Record<string, unknown>;
}

export interface QuoteRequest {
  items?: QuoteRequestItem[];
  promo_code?: string;
  shipping_address_id?: number | null;
  billing_address_id?: number | null;
  shipping_method_name?: string;
  // The currency the customer is browsing in. The server validates it and either
  // prices the quote in it (USD) or falls back to INR — it never trusts an amount.
  presentment_currency?: string;
}

export class QuoteError extends Error {}

/**
 * Ask the server to price a basket.
 *
 * Deliberately takes no amount, discount or shipping figure. If you find yourself
 * wanting to pass one, that number belongs on the server instead — passing it here
 * is the bug Phase 4 exists to remove.
 */
export async function createCheckoutQuote(
  request: QuoteRequest,
  accessToken: string
): Promise<CheckoutQuote> {
  const response = await fetch(`${API_BASE_URL}/api/checkout/quote`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });

  const text = await response.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = { message: text };
  }

  if (!response.ok) {
    // The server's message is written for the customer ("Insufficient stock for
    // X", "Quote has expired"), so surface it rather than a generic failure.
    throw new QuoteError(body?.message || "Could not price your basket.");
  }

  const quote = body?.data ?? body;
  if (!quote?.quote_id) {
    throw new QuoteError("The server did not return a usable quote.");
  }
  return quote as CheckoutQuote;
}

/** Display helper: a quote's total, formatted in its own currency. */
export function formatQuoteTotal(quote: CheckoutQuote): string {
  const symbol = quote.currency === "INR" ? "₹" : "";
  return `${symbol}${quote.total_amount}`;
}
