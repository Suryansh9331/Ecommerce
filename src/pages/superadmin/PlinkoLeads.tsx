import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { exportLeads, fetchLeads, fetchStats } from '../../services/superadmin/plinkoService';
import { PlinkoLeadRow, PlinkoStats } from '../../types/plinko';

const PER_PAGE = 20;

const STATUS_STYLES: Record<string, string> = {
  played: 'bg-gray-100 text-gray-700',
  email_captured: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

const STATUS_LABELS: Record<string, string> = {
  played: 'Played',
  email_captured: 'Email only',
  completed: 'Completed',
};

const StatCard: React.FC<{ label: string; value: string | number; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
  </div>
);

const PlinkoLeads: React.FC = () => {
  const [leads, setLeads] = useState<PlinkoLeadRow[]>([]);
  const [stats, setStats] = useState<PlinkoStats | null>(null);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filters = { status, search, per_page: PER_PAGE };

  const load = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      try {
        const data = await fetchLeads({ ...filters, page: targetPage });
        setLeads(data.leads || []);
        setTotalPages(data.pagination?.total_pages || 1);
        setTotalItems(data.pagination?.total_items || 0);
        setPage(data.pagination?.current_page || 1);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not load leads');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, search]
  );

  useEffect(() => {
    load(1);
    fetchStats().then(setStats).catch(() => undefined);
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportLeads(filters);
      toast.success('Export downloaded');
    } catch {
      toast.error('Could not export leads');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-white to-primary-50 p-1">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plinko Leads</h1>
          <p className="text-sm text-gray-500">
            Emails and phone numbers captured by the homepage game.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:bg-gray-400"
        >
          <Download size={16} />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Plays" value={stats.plays} />
          <StatCard label="Emails" value={stats.emails_captured} />
          <StatCard
            label="Completed"
            value={stats.completed}
            hint={`${stats.completion_rate}% of plays`}
          />
          <StatCard
            label="Redeemed"
            value={stats.codes_redeemed}
            hint={`₹${stats.discount_given.toFixed(2)} given`}
          />
          <StatCard
            label="Minted today"
            value={`${stats.minted_today}/${stats.daily_mint_ceiling}`}
            hint={`${stats.remaining_today} left`}
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search email, phone or code"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="all">All statuses</option>
          <option value="played">Played only</option>
          <option value="email_captured">Email captured</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-primary-50">
            <tr>
              {['Captured', 'Email', 'Phone', 'Prize', 'Code', 'Status', 'Redeemed'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-primary-600"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  No leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.lead_id} className="hover:bg-primary-50/30">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {lead.created_at ? new Date(lead.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{lead.email || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {lead.phone || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {lead.prize_label || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-700">
                    {lead.code || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        STATUS_STYLES[lead.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {STATUS_LABELS[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {lead.redeemed ? (
                      <span className="text-emerald-700">
                        ₹{lead.discount_given?.toFixed(2)}
                        {lead.order_id && (
                          <span className="ml-1 text-xs text-gray-400">{lead.order_id}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>{totalItems} leads</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => load(page - 1)}
              disabled={page === 1 || loading}
              className="rounded-md border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => load(page + 1)}
              disabled={page === totalPages || loading}
              className="rounded-md border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlinkoLeads;
