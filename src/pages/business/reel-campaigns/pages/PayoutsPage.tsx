import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RightDrawer } from '../ui/RightDrawer';
import { useReelCampaignsStore } from '../state/ReelCampaignsStore';

const PayoutsPage: React.FC = () => {
  const { state } = useReelCampaignsStore();
  const { campaigns } = state;
  const location = useLocation();
  const navigate = useNavigate();

  const [days, setDays] = useState<7 | 30 | 90>(30);

  const creatorRows = useMemo(() => {
    const byCreator = new Map<number, { creatorName: string; campaignsCount: number; eligible: number; pending: number; aoinFee: number }>();
    campaigns.forEach((c, idx) => {
      const base = 12 + idx * 7;
      const orders = Math.max(0, Math.floor((base * (days / 30)) % 57));
      const revenue = orders * c.product.price;
      const commission = Math.round((c.commissionPercent / 100) * revenue);
      const fee = Math.round(0.05 * revenue);
      const eligible = Math.round(commission * 0.55);
      const pending = commission - eligible;

      const prev = byCreator.get(c.creator.id) ?? { creatorName: c.creator.name, campaignsCount: 0, eligible: 0, pending: 0, aoinFee: 0 };
      prev.campaignsCount += 1;
      prev.eligible += eligible;
      prev.pending += pending;
      prev.aoinFee += fee;
      byCreator.set(c.creator.id, prev);
    });
    return [...byCreator.entries()].map(([creatorId, v]) => ({ creatorId, ...v }));
  }, [campaigns, days]);

  const totals = useMemo(() => {
    return creatorRows.reduce(
      (acc, r) => {
        acc.eligible += r.eligible;
        acc.pending += r.pending;
        acc.aoinFee += r.aoinFee;
        return acc;
      },
      { eligible: 0, pending: 0, aoinFee: 0 }
    );
  }, [creatorRows]);

  const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const creatorId = useMemo(() => {
    const raw = new URLSearchParams(location.search).get('creatorId');
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
    return n;
  }, [location.search]);

  const openCreatorLedger = (id: number) => {
    const sp = new URLSearchParams(location.search);
    sp.set('creatorId', String(id));
    navigate({ pathname: location.pathname, search: `?${sp.toString()}` });
  };

  const closeCreatorLedger = () => {
    const sp = new URLSearchParams(location.search);
    if (!sp.has('creatorId')) return;
    sp.delete('creatorId');
    const next = sp.toString();
    navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
  };

  const selectedCreator = creatorId != null ? creatorRows.find((r) => r.creatorId === creatorId) ?? null : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Commissions &amp; Payouts</h2>
          <p className="text-sm text-gray-500 mt-0.5">Mock finance summary per creator.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Range:</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value) as any)}
            className="rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { k: 'Eligible commission', v: money(totals.eligible) },
          { k: 'Pending commission', v: money(totals.pending) },
          { k: 'AOIN fee total', v: money(totals.aoinFee) },
        ].map((x) => (
          <div key={x.k} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{x.k}</p>
            <p className="text-lg font-semibold text-gray-900 mt-1 tabular-nums">{x.v}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Creator', 'Campaigns', 'Eligible', 'Pending', 'AOIN fee', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {creatorRows.map((r) => (
                <tr key={r.creatorId} className="hover:bg-orange-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{r.creatorName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap tabular-nums">{r.campaignsCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap tabular-nums">{money(r.eligible)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap tabular-nums">{money(r.pending)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap tabular-nums">{money(r.aoinFee)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openCreatorLedger(r.creatorId)}
                      className="text-sm font-semibold text-orange-700 hover:underline"
                    >
                      View ledger
                    </button>
                  </td>
                </tr>
              ))}
              {creatorRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RightDrawer
        open={selectedCreator != null}
        title={selectedCreator ? `${selectedCreator.creatorName} — Ledger` : 'Ledger'}
        subtitle={selectedCreator ? `Mock breakdown · last ${days} days` : undefined}
        onClose={closeCreatorLedger}
      >
        {selectedCreator && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { k: 'Eligible', v: money(selectedCreator.eligible) },
                  { k: 'Pending', v: money(selectedCreator.pending) },
                  { k: 'AOIN fee', v: money(selectedCreator.aoinFee) },
                ].map((x) => (
                  <div key={x.k} className="rounded-md bg-gray-50 border border-gray-200 p-3">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{x.k}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1 tabular-nums">{x.v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mock line items</p>
              </div>
              <div className="divide-y divide-gray-200">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Order item #{creatorId}-{i + 1}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Delivered · eligible after return window</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        {money(Math.round((selectedCreator.eligible + selectedCreator.pending) / 10))}
                      </p>
                      <p className="text-xs text-gray-500">commission</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </RightDrawer>
    </div>
  );
};

export default PayoutsPage;

