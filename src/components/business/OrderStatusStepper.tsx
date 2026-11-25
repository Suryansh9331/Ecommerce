/**
 * Horizontal status pill flow for a single order.
 *
 * Shows the 5 canonical fulfillment milestones (Accepted → RTS → Shipped →
 * Out-for-Delivery → Delivered) with the current step highlighted. Mirrors
 * Meesho's merchant-side order card UX so the step is readable at a glance.
 *
 * Cancelled / Return statuses collapse to a single rose pill since they
 * short-circuit the happy path.
 */
import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

type Step = {
  key: string;
  label: string;
};

const STEPS: Step[] = [
  { key: 'accepted', label: 'Accepted' },
  { key: 'rts', label: 'Ready to Ship' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'ofd', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

function indexForStatus(status: string): number {
  const s = (status || '').toLowerCase();
  // -1 = haven't accepted yet
  if (s === 'pending_payment' || s === 'awaiting_fulfillment') return -1;
  if (s === 'processing') return 0;
  if (s === 'pending_shipment') return 1;
  if (s === 'shipped' || s === 'in_transit') return 2;
  if (s === 'out_for_delivery') return 3;
  if (s === 'delivered') return 4;
  return -1;
}

function isTerminalNegative(status: string): boolean {
  const s = (status || '').toLowerCase();
  return (
    s.startsWith('cancelled') ||
    s.startsWith('refund') ||
    s.startsWith('return')
  );
}

export interface OrderStatusStepperProps {
  status: string;
  accepted_at?: string | null;
  rts_marked_at?: string | null;
  slaBreached?: boolean;
  compact?: boolean;
}

export const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({
  status,
  accepted_at,
  rts_marked_at,
  slaBreached,
  compact,
}) => {
  if (isTerminalNegative(status)) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full bg-rose-100 text-rose-800 ${
          compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        }`}
        data-testid="status-stepper-terminal"
      >
        <XCircleIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        <span>
          {status
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ')}
        </span>
      </div>
    );
  }

  const activeIdx = indexForStatus(status);

  return (
    <div
      className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}
      data-testid="status-stepper"
    >
      {STEPS.map((step, i) => {
        const isCurrent = i === activeIdx;
        const done = i < activeIdx;
        const breached =
          slaBreached &&
          step.key === 'rts' &&
          activeIdx === 0; // accepted but not RTS yet

        const base = compact
          ? 'px-2 py-0.5 text-[10px]'
          : 'px-2.5 py-1 text-xs';

        let cls = 'rounded-full font-medium';
        if (breached) {
          cls += ' bg-rose-100 text-rose-800';
        } else if (isCurrent) {
          cls += ' bg-amber-100 text-amber-800';
        } else if (done) {
          cls += ' bg-emerald-100 text-emerald-800';
        } else {
          cls += ' bg-gray-100 text-gray-500';
        }

        return (
          <React.Fragment key={step.key}>
            <div
              className={`inline-flex items-center gap-1 ${base} ${cls}`}
              title={
                breached
                  ? 'SLA breach — accepted > 48h ago'
                  : step.key === 'accepted' && accepted_at
                  ? `Accepted at ${new Date(accepted_at).toLocaleString()}`
                  : step.key === 'rts' && rts_marked_at
                  ? `RTS at ${new Date(rts_marked_at).toLocaleString()}`
                  : step.label
              }
              data-step={step.key}
            >
              {done && !breached && (
                <CheckCircleIcon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
              )}
              <span>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`h-px ${compact ? 'w-2' : 'w-3'} ${
                  i < activeIdx ? 'bg-emerald-300' : 'bg-gray-200'
                }`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default OrderStatusStepper;
