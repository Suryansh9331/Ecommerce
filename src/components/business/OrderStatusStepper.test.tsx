/**
 * Component tests for the Orders status stepper.
 *
 * The component drives the merchant's visual sense of where each order sits
 * in the fulfillment flow. If the mapping of status string -> highlighted step
 * drifts, the badge lights up the wrong pill and merchants ship confused.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import OrderStatusStepper from './OrderStatusStepper';

describe('OrderStatusStepper', () => {
  it('renders all five canonical steps on the happy path', () => {
    render(<OrderStatusStepper status="processing" />);

    const stepper = screen.getByTestId('status-stepper');
    expect(stepper).toBeInTheDocument();
    expect(stepper.querySelector('[data-step="accepted"]')).not.toBeNull();
    expect(stepper.querySelector('[data-step="rts"]')).not.toBeNull();
    expect(stepper.querySelector('[data-step="shipped"]')).not.toBeNull();
    expect(stepper.querySelector('[data-step="ofd"]')).not.toBeNull();
    expect(stepper.querySelector('[data-step="delivered"]')).not.toBeNull();
  });

  it('collapses cancelled statuses to a single terminal pill', () => {
    render(<OrderStatusStepper status="cancelled_by_customer" />);

    expect(screen.queryByTestId('status-stepper')).not.toBeInTheDocument();
    expect(screen.getByTestId('status-stepper-terminal')).toBeInTheDocument();
  });

  it('collapses refunded to the terminal pill', () => {
    render(<OrderStatusStepper status="refunded" />);
    expect(screen.getByTestId('status-stepper-terminal')).toBeInTheDocument();
  });

  it('highlights RTS as current when status is pending_shipment', () => {
    render(<OrderStatusStepper status="pending_shipment" />);
    const rtsStep = screen.getByTestId('status-stepper').querySelector('[data-step="rts"]');
    // Current step gets amber background; earlier steps get emerald.
    expect(rtsStep?.className).toContain('amber');
    const accepted = screen.getByTestId('status-stepper').querySelector('[data-step="accepted"]');
    expect(accepted?.className).toContain('emerald');
  });

  it('marks earlier steps as done (emerald) and delivered as current (amber) when delivered', () => {
    render(<OrderStatusStepper status="delivered" />);
    const stepper = screen.getByTestId('status-stepper');
    ['accepted', 'rts', 'shipped', 'ofd'].forEach(step => {
      const el = stepper.querySelector(`[data-step="${step}"]`);
      expect(el?.className).toContain('emerald');
    });
    const delivered = stepper.querySelector('[data-step="delivered"]');
    expect(delivered?.className).toContain('amber');
  });

  it('paints the RTS pill rose when slaBreached is true and accepted but not RTS', () => {
    render(
      <OrderStatusStepper
        status="processing"
        accepted_at={new Date().toISOString()}
        slaBreached
      />
    );
    const rtsStep = screen.getByTestId('status-stepper').querySelector('[data-step="rts"]');
    expect(rtsStep?.className).toContain('rose');
  });

  it('does not flag SLA on the RTS pill when the order has already shipped', () => {
    render(
      <OrderStatusStepper status="shipped" slaBreached />
    );
    const rtsStep = screen.getByTestId('status-stepper').querySelector('[data-step="rts"]');
    // Even with slaBreached=true, once order is past RTS the breach is moot.
    expect(rtsStep?.className).not.toContain('rose');
  });

  it('exposes tooltip timestamps when accepted_at / rts_marked_at are provided', () => {
    const ts = '2026-11-25T10:00:00Z';
    render(
      <OrderStatusStepper
        status="pending_shipment"
        accepted_at={ts}
        rts_marked_at={ts}
      />
    );
    const accepted = screen.getByTestId('status-stepper').querySelector('[data-step="accepted"]');
    expect(accepted?.getAttribute('title')).toMatch(/Accepted at/);
    const rts = screen.getByTestId('status-stepper').querySelector('[data-step="rts"]');
    expect(rts?.getAttribute('title')).toMatch(/RTS at/);
  });

  it('shows no steps as done when status is pending_payment', () => {
    render(<OrderStatusStepper status="pending_payment" />);
    const stepper = screen.getByTestId('status-stepper');
    ['accepted', 'rts', 'shipped', 'ofd', 'delivered'].forEach(step => {
      const el = stepper.querySelector(`[data-step="${step}"]`);
      // None done yet -> gray text-gray
      expect(el?.className).toContain('gray');
    });
  });
});
