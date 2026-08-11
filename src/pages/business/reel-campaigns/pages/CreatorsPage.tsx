import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RightDrawer } from '../ui/RightDrawer';
import { StatusChip } from '../ui/StatusChip';
import type { MockCreator } from '../mock/types';
import { useReelCampaignsStore } from '../state/ReelCampaignsStore';

const CreatorsPage: React.FC = () => {
  const { state } = useReelCampaignsStore();
  const creators = state.creators;

  const location = useLocation();
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [availability, setAvailability] = useState<'all' | 'available' | 'busy'>('all');

  const creatorId = useMemo(() => {
    const raw = new URLSearchParams(location.search).get('creatorId');
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
    return n;
  }, [location.search]);

  const selected = useMemo(() => creators.find((c) => c.id === creatorId) ?? null, [creators, creatorId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return creators.filter((c) => {
      const availOk = availability === 'all' ? true : c.availability === availability;
      if (!availOk) return false;
      if (!query) return true;
      const hay = `${c.name} ${c.handle} ${c.categories.join(' ')}`.toLowerCase();
      return hay.includes(query);
    });
  }, [creators, q, availability]);

  const openCreator = (id: number) => {
    const sp = new URLSearchParams(location.search);
    sp.set('creatorId', String(id));
    navigate({ pathname: location.pathname, search: `?${sp.toString()}` });
  };

  const closeCreator = () => {
    const sp = new URLSearchParams(location.search);
    if (!sp.has('creatorId')) return;
    sp.delete('creatorId');
    const next = sp.toString();
    navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
  };

  const startCreateCampaignWithCreator = (creator: MockCreator) => {
    // Deep-link into Campaigns create mode (CampaignsPage listens to ?mode=create)
    navigate(`/business/reel-campaigns/campaigns?mode=create&creatorId=${creator.id}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Creators</h2>
        <p className="text-sm text-gray-500 mt-0.5">Discover creators and start a reel campaign offer.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search creators…"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value as any)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="all">All availability</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
          </select>
          <div className="text-sm text-gray-500 flex items-center justify-between sm:justify-end sm:text-right">
            <span className="sm:hidden">Results</span>
            <span className="font-semibold text-gray-700">{filtered.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => openCreator(c.id)}
            className="text-left bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                {c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-500 truncate">@{c.handle}</p>
              </div>
              <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${
                c.availability === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {c.availability === 'available' ? 'Available' : 'Busy'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.categories.slice(0, 4).map((t) => (
                <span key={t} className="text-[11px] font-semibold px-2 py-1 rounded-full bg-primary-50 text-primary-700">
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <RightDrawer
        open={selected != null}
        title={selected ? selected.name : 'Creator'}
        subtitle={selected ? `@${selected.handle}` : undefined}
        onClose={closeCreator}
        footer={
          selected ? (
            <button
              type="button"
              onClick={() => startCreateCampaignWithCreator(selected)}
              className="w-full px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
            >
              Create campaign with this creator
            </button>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                selected.availability === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {selected.availability === 'available' ? 'Available' : 'Busy'}
              </span>
              {/* Placeholder: show a campaign-style chip for consistency */}
              <StatusChip status="Active" />
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.categories.map((t) => (
                  <span key={t} className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </RightDrawer>
    </div>
  );
};

export default CreatorsPage;

