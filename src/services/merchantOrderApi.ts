/**
 * Phase 2 Sprint 2 — merchant order fulfillment API.
 *
 * Wraps the accept / mark-RTS / bulk-RTS / e-way-bill endpoints the merchant
 * dashboard calls. Centralised so component code just imports a function and
 * gets type-checked responses instead of writing fetch() boilerplate inline.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJsonOrThrow<T>(resp: Response): Promise<T> {
  const body = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg =
      (body && typeof body === 'object' && 'error' in body && (body as { error: string }).error) ||
      `${resp.status} ${resp.statusText}`;
    throw new Error(msg);
  }
  return body as T;
}

export interface AcceptOrderResponse {
  order_id: string;
  accepted_at: string;
  order_status: string;
  already_accepted: boolean;
}

export interface MarkRtsResponse {
  order_id: string;
  rts_marked_at: string | null;
  order_status: string;
  invoice_number: string | null;
  label_url: string | null;
  already_rts: boolean;
  shiprocket: {
    success: boolean;
    error?: string;
    awb_code?: string | null;
    shipment_id?: number | null;
  } | null;
}

export interface BulkRtsResult {
  order_id: string;
  success: boolean;
  error?: string;
  invoice_number?: string | null;
  label_url?: string | null;
  order_status?: string;
}

export interface BulkRtsResponse {
  requested: number;
  succeeded: number;
  failed: number;
  results: BulkRtsResult[];
}

export interface EwayBillResponse {
  order_id: string;
  eway_bill_number: string;
}

export interface LabelResponse {
  order_id: string;
  shipment_id: number;
  label_url: string;
  cached: boolean;
}

export async function acceptOrder(orderId: string): Promise<AcceptOrderResponse> {
  const resp = await fetch(
    `${API_BASE_URL}/api/merchant-dashboard/orders/${orderId}/accept`,
    { method: 'POST', headers: authHeaders() }
  );
  return parseJsonOrThrow<AcceptOrderResponse>(resp);
}

export async function markRts(
  orderId: string,
  courierId?: number
): Promise<MarkRtsResponse> {
  const resp = await fetch(
    `${API_BASE_URL}/api/merchant-dashboard/orders/${orderId}/mark-rts`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(courierId ? { courier_id: courierId } : {}),
    }
  );
  return parseJsonOrThrow<MarkRtsResponse>(resp);
}

export async function bulkRts(
  orderIds: string[],
  courierId?: number
): Promise<BulkRtsResponse> {
  const resp = await fetch(
    `${API_BASE_URL}/api/merchant-dashboard/orders/bulk-rts`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        order_ids: orderIds,
        ...(courierId ? { courier_id: courierId } : {}),
      }),
    }
  );
  return parseJsonOrThrow<BulkRtsResponse>(resp);
}

export async function getLabel(
  orderId: string,
  refresh = false
): Promise<LabelResponse> {
  const url = `${API_BASE_URL}/api/merchant-dashboard/orders/${orderId}/label${
    refresh ? '?refresh=1' : ''
  }`;
  const resp = await fetch(url, { headers: authHeaders() });
  return parseJsonOrThrow<LabelResponse>(resp);
}

export async function setEwayBill(
  orderId: string,
  ewayBillNumber: string
): Promise<EwayBillResponse> {
  const resp = await fetch(
    `${API_BASE_URL}/api/merchant-dashboard/orders/${orderId}/eway-bill`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ eway_bill_number: ewayBillNumber }),
    }
  );
  return parseJsonOrThrow<EwayBillResponse>(resp);
}

// -------- status helpers --------

/** Statuses the merchant considers "still mine to ship". */
export const TO_SHIP_STATUSES = new Set([
  'pending_payment',
  'awaiting_fulfillment',
  'processing',
  'pending_shipment',
]);

export const SHIPPED_STATUSES = new Set([
  'shipped',
  'in_transit',
  'out_for_delivery',
]);

export const DELIVERED_STATUSES = new Set([
  'delivered',
]);

export const RETURN_STATUSES = new Set([
  'return_requested',
  'return_approved',
  'return_received',
  'return_completed',
  'return_rejected',
  'refund_requested',
  'refund_processing',
  'refunded',
  'partially_refunded',
]);

export type OrderTab = 'to_ship' | 'shipped' | 'delivered' | 'returns';

export function tabForStatus(status: string): OrderTab | null {
  const s = status.toLowerCase();
  if (TO_SHIP_STATUSES.has(s)) return 'to_ship';
  if (SHIPPED_STATUSES.has(s)) return 'shipped';
  if (DELIVERED_STATUSES.has(s)) return 'delivered';
  if (RETURN_STATUSES.has(s)) return 'returns';
  return null;
}

/** For the EWB nudge. Inter-state rupee threshold mandated by GST. */
export const EWAY_BILL_THRESHOLD = 50000;
