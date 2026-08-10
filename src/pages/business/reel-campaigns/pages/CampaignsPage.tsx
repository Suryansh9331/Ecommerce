import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CommissionType, MockCampaign, MockCreator, MockProduct } from '../mock/types';
import { StatusChip } from '../ui/StatusChip';
import { RightDrawer } from '../ui/RightDrawer';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useReelCampaignsStore } from '../state/ReelCampaignsStore';

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtMoney(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function readCampaignId(search: string): number | null {
  const raw = new URLSearchParams(search).get('campaignId');
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

function readMode(search: string): 'create' | null {
  const raw = new URLSearchParams(search).get('mode');
  return raw === 'create' ? 'create' : null;
}

function readCreatorId(search: string): number | null {
  const raw = new URLSearchParams(search).get('creatorId');
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

function stripParam(search: string, key: string): string {
  const sp = new URLSearchParams(search);
  sp.delete(key);
  const next = sp.toString();
  return next ? `?${next}` : '';
}

const CampaignsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { state, dispatch } = useReelCampaignsStore();
  const campaigns = state.campaigns;
  const products = state.products;
  const creators = state.creators;

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | MockCampaign['status']>('all');

  const campaignIdFromUrl = useMemo(() => readCampaignId(location.search), [location.search]);
  const selected = useMemo(
    () => campaigns.find((c) => c.id === campaignIdFromUrl) ?? null,
    [campaignIdFromUrl, campaigns]
  );

  const mode = useMemo(() => readMode(location.search), [location.search]);
  const createFromUrl = mode === 'create';
  const creatorIdFromUrl = useMemo(() => readCreatorId(location.search), [location.search]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null);
  const [commissionType, setCommissionType] = useState<CommissionType>('percent_capped');
  const [commissionPercent, setCommissionPercent] = useState<number>(18);
  const [capQuantity, setCapQuantity] = useState<number>(150);
  const [windowEnd, setWindowEnd] = useState<string>(() => {
    const d = new Date(Date.now() + 10 * 86_400_000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [brief, setBrief] = useState<string>(
    'Hook in first 3 seconds. Show product benefits clearly. Add CTA: “Shop now on AOIN”.'
  );
  const [confirmSend, setConfirmSend] = useState(false);
  const [isSendingOffer, setIsSendingOffer] = useState(false);
  const [offerSentOpen, setOfferSentOpen] = useState(false);
  const [lastCreatedCampaignId, setLastCreatedCampaignId] = useState<number | null>(null);

  useEffect(() => {
    if (createFromUrl) setCreateOpen(true);
  }, [createFromUrl]);

  useEffect(() => {
    if (!createFromUrl) return;
    if (!creatorIdFromUrl) return;
    // Preselect creator if deep-linked from Creators module
    if (!selectedCreatorId) setSelectedCreatorId(creatorIdFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createFromUrl, creatorIdFromUrl]);

  const selectedProduct: MockProduct | null = useMemo(
    () => (selectedProductId ? products.find((p) => p.id === selectedProductId) ?? null : null),
    [products, selectedProductId]
  );
  const selectedCreator: MockCreator | null = useMemo(
    () => (selectedCreatorId ? creators.find((x) => x.id === selectedCreatorId) ?? null : null),
    [creators, selectedCreatorId]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return campaigns.filter((c) => {
      const statusOk = status === 'all' ? true : c.status === status;
      if (!statusOk) return false;
      if (!query) return true;
      const hay = `${c.code} ${c.product.name} ${c.creator.name} ${c.creator.handle}`.toLowerCase();
      return hay.includes(query);
    });
  }, [campaigns, q, status]);

  const canContinueStep1 = selectedProduct != null;
  const canContinueStep2 = selectedCreator != null;
  const canContinueStep3 =
    commissionPercent >= 1 &&
    commissionPercent <= 100 &&
    (commissionType === 'percent_unlimited' || Number.isFinite(capQuantity) && capQuantity > 0);
  const canContinueStep4 = brief.trim().length >= 10;
  const canSend = canContinueStep1 && canContinueStep2 && canContinueStep3 && canContinueStep4;

  const clearCampaignIdFromUrl = () => {
    const sp = new URLSearchParams(location.search);
    if (!sp.has('campaignId')) return;
    sp.delete('campaignId');
    const next = sp.toString();
    navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
  };

  const openCampaignInUrl = (id: number) => {
    const sp = new URLSearchParams(location.search);
    sp.set('campaignId', String(id));
    navigate({ pathname: location.pathname, search: `?${sp.toString()}` });
  };

  const clearCreateModeFromUrl = () => {
    const sp = new URLSearchParams(location.search);
    if (!sp.has('mode')) return;
    sp.delete('mode');
    const next = sp.toString();
    navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
  };

  const resetCreateForm = () => {
    setCreateStep(1);
    setSelectedProductId(null);
    setSelectedCreatorId(null);
    setCommissionType('percent_capped');
    setCommissionPercent(18);
    setCapQuantity(150);
    setBrief('Hook in first 3 seconds. Show product benefits clearly. Add CTA: “Shop now on AOIN”.');
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setConfirmSend(false);
    setIsSendingOffer(false);
    // When create closes, remove creatorId preselect too (if it was used)
    const searchWithoutCreator = stripParam(location.search, 'creatorId');
    navigate({ pathname: location.pathname, search: searchWithoutCreator }, { replace: true });
    clearCreateModeFromUrl();
    resetCreateForm();
  };

  const startCreate = () => {
    const sp = new URLSearchParams(location.search);
    sp.set('mode', 'create');
    navigate({ pathname: location.pathname, search: `?${sp.toString()}` });
    setCreateStep(1);
  };

  const submitCreateMock = (): number | null => {
    if (!canSend || !selectedProduct || !selectedCreator) return null;
    const nextId = Math.max(...campaigns.map((c) => c.id)) + 1;
    const code = `RC-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const end = new Date(`${windowEnd}T23:59:59`);
    const now = new Date();
    const newCampaign: MockCampaign = {
      id: nextId,
      code,
      status: 'Sent',
      product: selectedProduct,
      creator: selectedCreator,
      commissionType,
      commissionPercent,
      capQuantity: commissionType === 'percent_capped' ? capQuantity : undefined,
      windowEnd: end,
      deliverableCount: 1,
      brief: brief.trim(),
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'campaign/create', campaign: newCampaign });
    setLastCreatedCampaignId(newCampaign.id);
    return newCampaign.id;
  };

  const [cancelId, setCancelId] = useState<number | null>(null);
  const cancelCampaign = (id: number) => {
    dispatch({ type: 'campaign/cancel', campaignId: id });
    setCancelId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create offers, track statuses, and manage creator campaigns.</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
        >
          Create campaign
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by code, product, creator…"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
          >
            <option value="all">All statuses</option>
            {(['Draft', 'Sent', 'Accepted', 'Active', 'Submitted', 'Approved', 'Live', 'Completed', 'Rejected', 'Cancelled', 'Expired'] as const).map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </select>
          <div className="text-sm text-gray-500 flex items-center justify-between sm:justify-end sm:text-right">
            <span className="sm:hidden">Results</span>
            <span className="font-semibold text-gray-700">{filtered.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-gray-700">No campaigns found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting filters or create a new campaign.</p>
            <button
              type="button"
              onClick={startCreate}
              className="mt-4 px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
            >
              Create campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Product', 'Creator', 'Terms', 'Window end', 'Status', 'Updated'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => openCampaignInUrl(c.id)} className="hover:bg-orange-50 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-semibold text-orange-700 whitespace-nowrap">{c.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 min-w-[240px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden shrink-0">
                          {c.product.imageUrl ? (
                            <img src={c.product.imageUrl} alt={c.product.name} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{c.product.name}</p>
                          <p className="text-xs text-gray-500">
                            {c.product.category} · {fmtMoney(c.product.price)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden">
                          {c.creator.avatarUrl ? (
                            <img src={c.creator.avatarUrl} alt={c.creator.name} className="w-full h-full object-cover" />
                          ) : null}
                        </span>
                        <div>
                          <p className="font-semibold leading-tight">{c.creator.name}</p>
                          <p className="text-xs text-gray-500">@{c.creator.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {c.commissionPercent}% {c.commissionType === 'percent_capped' ? `· cap ${c.capQuantity}` : '· unlimited'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmtDate(c.windowEnd)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <StatusChip status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmtDate(c.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RightDrawer
        open={selected != null}
        title={selected ? `Campaign ${selected.code}` : 'Campaign'}
        subtitle={selected ? `${selected.product.name} · ${selected.creator.name}` : undefined}
        onClose={clearCampaignIdFromUrl}
        footer={
          selected ? (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCancelId(selected.id)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel campaign
              </button>
              <button
                type="button"
                onClick={() => navigate('/business/reel-campaigns/submissions')}
                className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-semibold hover:bg-black"
              >
                View submissions
              </button>
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusChip status={selected.status} />
              <p className="text-xs text-gray-500">Updated {fmtDate(selected.updatedAt)}</p>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Terms</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {selected.commissionPercent}% commission
                {selected.commissionType === 'percent_capped' ? ` (cap ${selected.capQuantity} orders)` : ' (unlimited)'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Window ends: {fmtDate(selected.windowEnd)}</p>
              <p className="text-sm text-gray-600 mt-1">Deliverables: {selected.deliverableCount} reel</p>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Brief</p>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{selected.brief}</p>
            </div>
          </div>
        )}
      </RightDrawer>

      <ConfirmModal
        open={cancelId != null}
        title="Cancel this campaign?"
        description="This is mock behavior for now. Later, this will call the cancel endpoint."
        confirmText="Cancel campaign"
        tone="danger"
        onCancel={() => setCancelId(null)}
        onConfirm={() => {
          if (cancelId != null) cancelCampaign(cancelId);
        }}
      />

      <ConfirmModal
        open={confirmSend}
        title="Send offer to creator?"
        description="This will create a new campaign in Sent status (mock)."
        confirmText={isSendingOffer ? 'Sending…' : 'Send offer'}
        onCancel={() => setConfirmSend(false)}
        onConfirm={() => {
          if (isSendingOffer) return;
          setIsSendingOffer(true);
          // Mock network latency for a realistic UX
          window.setTimeout(() => {
            const id = submitCreateMock();
            setIsSendingOffer(false);
            setConfirmSend(false);
            closeCreate();
            if (id != null) setOfferSentOpen(true);
          }, 900);
        }}
      />

      <ConfirmModal
        open={offerSentOpen}
        title="Offer sent successfully"
        description="The creator will see this offer in their Deals. You can track status and submissions from this campaign."
        confirmText="View campaign"
        cancelText="Close"
        onCancel={() => setOfferSentOpen(false)}
        onConfirm={() => {
          setOfferSentOpen(false);
          if (lastCreatedCampaignId != null) openCampaignInUrl(lastCreatedCampaignId);
        }}
      />

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={closeCreate} aria-label="Close modal" />
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-gray-900">Create campaign</p>
                <p className="text-sm text-gray-500 mt-0.5">Step {createStep}/5</p>
              </div>
              <button
                type="button"
                onClick={closeCreate}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
              {createStep === 1 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Select product</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {products.map((p) => {
                      const active = selectedProductId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProductId(p.id)}
                          className={`text-left rounded-lg border p-4 transition-colors ${
                            active ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {p.category} · {fmtMoney(p.price)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {createStep === 2 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Select creator</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {creators.map((c) => {
                      const active = selectedCreatorId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCreatorId(c.id)}
                          className={`text-left rounded-lg border p-4 transition-colors ${
                            active ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            @{c.handle} · {c.availability === 'available' ? 'Available' : 'Busy'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{c.categories.join(' · ')}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {createStep === 3 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Set terms</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Commission type</label>
                      <select
                        value={commissionType}
                        onChange={(e) => setCommissionType(e.target.value as CommissionType)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
                      >
                        <option value="percent_capped">Percent capped</option>
                        <option value="percent_unlimited">Percent unlimited</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Commission percent</label>
                      <input
                        type="number"
                        value={commissionPercent}
                        onChange={(e) => setCommissionPercent(Number(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
                        min={1}
                        max={100}
                      />
                    </div>
                    {commissionType === 'percent_capped' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Cap quantity (orders)</label>
                        <input
                          type="number"
                          value={capQuantity}
                          onChange={(e) => setCapQuantity(Number(e.target.value))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
                          min={1}
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Window end</label>
                      <input
                        type="date"
                        value={windowEnd}
                        onChange={(e) => setWindowEnd(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
                      />
                    </div>
                  </div>
                  {!canContinueStep3 && (
                    <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-md p-3">
                      Please enter valid commission values.
                    </p>
                  )}
                </div>
              )}

              {createStep === 4 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Add brief</p>
                  <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    rows={6}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
                    placeholder="What should the creator say/show? CTA? Do/Don't?"
                  />
                  {!canContinueStep4 && (
                    <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-md p-3">
                      Brief is too short. Add more details.
                    </p>
                  )}
                </div>
              )}

              {createStep === 5 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Review &amp; send</p>
                  <div className="rounded-lg border border-gray-200 p-4 space-y-2">
                    <p className="text-sm font-semibold text-gray-900">{selectedProduct?.name ?? '-'}</p>
                    <p className="text-sm text-gray-600">Creator: {selectedCreator?.name ?? '-'}</p>
                    <p className="text-sm text-gray-600">
                      Terms: {commissionPercent}% · {commissionType === 'percent_capped' ? `cap ${capQuantity}` : 'unlimited'} · ends {windowEnd}
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap pt-2 border-t border-gray-100">{brief.trim() || '-'}</p>
                  </div>
                  {!canSend && (
                    <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-md p-3">
                      Please complete previous steps before sending.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCreateStep((s) => (s === 1 ? 1 : ((s - 1) as any)))}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                disabled={createStep === 1}
              >
                Back
              </button>
              <div className="flex gap-2">
                {createStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => setCreateStep((s) => ((s + 1) as any))}
                    disabled={
                      (createStep === 1 && !canContinueStep1) ||
                      (createStep === 2 && !canContinueStep2) ||
                      (createStep === 3 && !canContinueStep3) ||
                      (createStep === 4 && !canContinueStep4)
                    }
                    className="px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmSend(true)}
                    disabled={!canSend || isSendingOffer}
                    className="px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
                  >
                    Send offer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;

