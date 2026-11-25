/**
 * Unit tests for merchant order API helpers.
 *
 * The HTTP wrappers are thin so we don't test them here — we test the
 * classification helpers and the e-way bill threshold, which drive the
 * tab filter, action-button visibility, and the EWB nudge. A drift in any
 * of these silently misroutes orders between tabs or hides buttons on
 * orders the merchant must act on.
 */
import { describe, expect, it } from 'vitest';

import {
  tabForStatus,
  TO_SHIP_STATUSES,
  SHIPPED_STATUSES,
  DELIVERED_STATUSES,
  RETURN_STATUSES,
  EWAY_BILL_THRESHOLD,
} from './merchantOrderApi';

describe('tabForStatus', () => {
  it.each([
    ['pending_payment', 'to_ship'],
    ['awaiting_fulfillment', 'to_ship'],
    ['processing', 'to_ship'],
    ['pending_shipment', 'to_ship'],
  ])('routes %s to the To-Ship tab', (status, tab) => {
    expect(tabForStatus(status)).toBe(tab);
  });

  it.each([
    ['shipped', 'shipped'],
    ['in_transit', 'shipped'],
    ['out_for_delivery', 'shipped'],
  ])('routes %s to the Shipped tab', (status, tab) => {
    expect(tabForStatus(status)).toBe(tab);
  });

  it('routes delivered to its own tab', () => {
    expect(tabForStatus('delivered')).toBe('delivered');
  });

  it.each([
    'return_requested',
    'return_approved',
    'return_received',
    'return_completed',
    'return_rejected',
    'refund_requested',
    'refund_processing',
    'refunded',
    'partially_refunded',
  ])('routes %s to the Returns tab', (status) => {
    expect(tabForStatus(status)).toBe('returns');
  });

  it('returns null for cancelled statuses — they are excluded from the tab bar', () => {
    // Cancelled orders don't belong in To-Ship (merchant did nothing wrong)
    // and don't belong in Delivered/Returns either. The tab bar intentionally
    // drops them; the full order list keeps them.
    expect(tabForStatus('cancelled_by_merchant')).toBeNull();
    expect(tabForStatus('cancelled_by_admin')).toBeNull();
    expect(tabForStatus('cancelled_by_customer')).toBeNull();
  });

  it('is case-insensitive on the input', () => {
    expect(tabForStatus('PROCESSING')).toBe('to_ship');
    expect(tabForStatus('Delivered')).toBe('delivered');
  });
});

describe('status set invariants', () => {
  it('to-ship, shipped, delivered, returns are mutually disjoint', () => {
    const sets = [TO_SHIP_STATUSES, SHIPPED_STATUSES, DELIVERED_STATUSES, RETURN_STATUSES];
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const overlap = [...sets[i]].filter(s => sets[j].has(s));
        expect(overlap).toEqual([]);
      }
    }
  });

  it('delivered set contains exactly the one terminal happy-path state', () => {
    expect([...DELIVERED_STATUSES]).toEqual(['delivered']);
  });
});

describe('EWAY_BILL_THRESHOLD', () => {
  it('matches the GST threshold of Rs 50,000 — changing this is a tax compliance decision', () => {
    expect(EWAY_BILL_THRESHOLD).toBe(50000);
  });
});
