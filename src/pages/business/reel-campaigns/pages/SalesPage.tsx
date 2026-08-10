import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReelCampaignsStore } from '../state/ReelCampaignsStore';

const SalesPage: React.FC = () => {
  const { state } = useReelCampaignsStore();
  const { campaigns } = state;
  const navigate = useNavigate();

  const [days, setDays] = useState<7 | 30 | 90>(30);

  const rows = useMemo(() => {
    return campaigns.map((c, idx) => {
      const base = 12 + idx * 7;
      const orders = Math.max(0, Math.floor((base * (days / 30)) % 57));
      const revenue = orders * c.product.price;
      const commission = Math.round((c.commissionPercent / 100) * revenue);
      const aoinFee = Math.round(0.05 * revenue);
      const merchantNet = revenue - commission - aoinFee;
      return { c, orders, revenue, commission, aoinFee, merchantNet };
    });
  }, [campaigns, days]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.orders += r.orders;
        acc.revenue += r.revenue;
        acc.commission += r.commission;
        acc.aoinFee += r.aoinFee;
        acc.merchantNet += r.merchantNet;
        return acc;
      },
      { orders: 0, revenue: 0, commission: 0, aoinFee: 0, merchantNet: 0 }
    );
  }, [rows]);

  const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Attribution &amp; Sales</h2>
          <p className="text-sm text-gray-500 mt-0.5">Mock performance for campaign-attributed commerce.</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { k: 'Attributed orders', v: totals.orders.toLocaleString('en-IN') },
          { k: 'Attributed revenue', v: money(totals.revenue) },
          { k: 'Creator commission', v: money(totals.commission) },
          { k: 'AOIN fee (5%)', v: money(totals.aoinFee) },
          { k: 'Merchant net', v: money(totals.merchantNet) },
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
                {['Campaign', 'Product', 'Creator', 'Orders', 'Revenue', 'Commission', 'AOIN fee', 'Net'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((r) => (
                <tr key={r.c.id} className="hover:bg-orange-50">
                  <td className="px-4 py-3 text-sm font-semibold text-orange-700 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => navigate(`/business/reel-campaigns/campaigns?campaignId=${r.c.id}`)}
                      className="hover:underline"
                    >
                      {r.c.code}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{r.c.product.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{r.c.creator.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap tabular-nums">{r.orders}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap tabular-nums">{money(r.revenue)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap tabular-nums">{money(r.commission)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap tabular-nums">{money(r.aoinFee)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap tabular-nums font-semibold">{money(r.merchantNet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;

