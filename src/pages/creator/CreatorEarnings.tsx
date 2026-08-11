import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Banknote, ChevronRight, Wallet } from 'lucide-react';
import { StatusChip } from '../../components/creator/ui/StatusChip';
import { SideDrawer } from '../../components/creator/ui/SideDrawer';
import { getPayoutReady } from '../../components/creator/utils/payoutReadiness';

type RowStatus = 'pending' | 'available' | 'paid';

interface EarningsRow {
  id: number;
  campaign: string;
  brand: string;
  amount: number;
  status: RowStatus;
  updatedAt: Date;
  sales: number;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function chip(status: RowStatus) {
  if (status === 'paid') return <StatusChip label="Paid" tone="success" dotClassName="bg-emerald-400" />;
  if (status === 'available') return <StatusChip label="Available" tone="info" dotClassName="bg-blue-400" />;
  return <StatusChip label="Pending" tone="warning" dotClassName="bg-primary-400" />;
}

const CreatorEarnings: React.FC = () => {
  const payoutReady = getPayoutReady();
  const [selected, setSelected] = useState<EarningsRow | null>(null);

  const rows: EarningsRow[] = useMemo(
    () => [
      { id: 1, brand: 'W for Woman', campaign: 'Floral Print Midi Dress', amount: 3850, status: 'paid', updatedAt: new Date(Date.now() - 4 * 86_400_000), sales: 22 },
      { id: 2, brand: 'Plum Goodness', campaign: 'Niacinamide Serum', amount: 2240, status: 'paid', updatedAt: new Date(Date.now() - 16 * 86_400_000), sales: 28 },
      { id: 3, brand: 'Libas', campaign: "Monsoon Edit '26", amount: 1400, status: 'pending', updatedAt: new Date(Date.now() - 2 * 86_400_000), sales: 9 },
      { id: 4, brand: 'boAt', campaign: 'Pro Series Drop', amount: 6800, status: 'available', updatedAt: new Date(Date.now() - 1 * 86_400_000), sales: 14 },
    ],
    [],
  );

  const totals = useMemo(() => {
    const available = rows.filter((r) => r.status === 'available').reduce((s, r) => s + r.amount, 0);
    const pending = rows.filter((r) => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
    const paid = rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
    return { available, pending, paid };
  }, [rows]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-[24px] font-extrabold text-gray-900 leading-tight">Earnings</h1>
            <p className="text-[13px] text-gray-400 font-medium mt-0.5">Track earnings and payout status from your campaigns.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {payoutReady ? (
            <StatusChip label="Payouts ready" tone="success" dotClassName="bg-emerald-400" />
          ) : (
            <StatusChip label="Complete payout setup" tone="warning" dotClassName="bg-primary-400" />
          )}
          <Link
            to="/creator/payouts"
            className="px-4 py-2.5 rounded-2xl bg-gray-900 text-white text-[12px] font-extrabold hover:bg-black transition-colors"
          >
            Payout setup <ArrowUpRight className="w-4 h-4 inline-block ml-1" />
          </Link>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { k: 'Available', v: totals.available, tone: 'info' as const, sub: payoutReady ? 'Ready to withdraw' : 'Setup required' },
          { k: 'Pending', v: totals.pending, tone: 'warning' as const, sub: 'Releasing soon' },
          { k: 'Paid', v: totals.paid, tone: 'success' as const, sub: 'All time' },
        ].map((c) => (
          <div key={c.k} className="rounded-3xl bg-white border border-gray-100/80 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{c.k}</p>
              <span>{c.tone === 'info' ? <Banknote className="w-4 h-4 text-blue-500" /> : c.tone === 'warning' ? <Banknote className="w-4 h-4 text-primary-500" /> : <Banknote className="w-4 h-4 text-emerald-600" />}</span>
            </div>
            <p className="text-[28px] font-extrabold text-gray-900 tabular-nums mt-3">₹{c.v.toLocaleString('en-IN')}</p>
            <p className="text-[12px] text-gray-500 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Earnings table */}
      <div className="rounded-3xl bg-white border border-gray-100/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-extrabold text-gray-900">Campaign earnings</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Click a row for breakdown</p>
          </div>
          <Link to="/creator/deals?tab=completed" className="text-[12px] font-bold text-primary-600 hover:underline">
            Completed deals <ChevronRight className="w-4 h-4 inline-block" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className="w-full text-left px-5 py-4 hover:bg-gray-50/60 transition-colors flex items-center gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-extrabold text-gray-900 truncate">{r.brand}</p>
                <p className="text-[12px] text-gray-500 truncate mt-0.5">{r.campaign}</p>
                <p className="text-[11px] text-gray-400 mt-1">Updated {fmtDate(r.updatedAt)} · {r.sales} sales</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[16px] font-extrabold text-gray-900 tabular-nums">₹{r.amount.toLocaleString('en-IN')}</p>
                <div className="mt-1">{chip(r.status)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <SideDrawer
        open={selected != null}
        title="Earning details"
        subtitle={selected ? `${selected.brand} · ₹${selected.amount.toLocaleString('en-IN')}` : undefined}
        onClose={() => setSelected(null)}
        footer={
          selected ? (
            <div className="p-4">
              <Link
                to={payoutReady ? '/creator/payouts' : '/creator/payouts'}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-900 text-white font-extrabold text-[13px] hover:bg-black transition-colors"
              >
                Manage payouts <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="p-5 space-y-4">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
              <div className="mt-2">{chip(selected.status)}</div>
              <p className="text-[12px] text-gray-600 mt-2">
                {selected.status === 'paid'
                  ? 'Paid to your bank account.'
                  : selected.status === 'available'
                    ? payoutReady ? 'Available for payout.' : 'Complete payout setup to withdraw.'
                    : 'Pending release (typically after campaign window ends).'}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Attribution</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sales</p>
                  <p className="text-[16px] font-extrabold text-gray-900 tabular-nums mt-1">{selected.sales}</p>
                </div>
                <div className="rounded-xl bg-white border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Per-sale (est.)</p>
                  <p className="text-[16px] font-extrabold text-gray-900 tabular-nums mt-1">₹{Math.max(1, Math.round(selected.amount / Math.max(1, selected.sales))).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Notes</p>
              <p className="text-[12px] text-gray-600 mt-2">
                This is mock data. When the API is wired, this drawer will show the exact calculation breakdown and payout transaction IDs.
              </p>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
};

export default CreatorEarnings;
