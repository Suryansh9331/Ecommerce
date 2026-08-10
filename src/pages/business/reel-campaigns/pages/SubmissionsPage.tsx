import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RightDrawer } from '../ui/RightDrawer';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useReelCampaignsStore } from '../state/ReelCampaignsStore';
import type { MockSubmission, SubmissionStatus } from '../mock/submissions';

const SubmissionsPage: React.FC = () => {
  const { state, dispatch } = useReelCampaignsStore();
  const { submissions, campaigns } = state;

  const location = useLocation();
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | SubmissionStatus>('all');

  const submissionId = useMemo(() => {
    const raw = new URLSearchParams(location.search).get('submissionId');
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
    return n;
  }, [location.search]);

  const selected: MockSubmission | null = useMemo(
    () => submissions.find((s) => s.id === submissionId) ?? null,
    [submissions, submissionId]
  );

  const selectedCampaign = useMemo(() => {
    if (!selected) return null;
    return campaigns.find((c) => c.id === selected.campaignId) ?? null;
  }, [campaigns, selected]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return submissions.filter((s) => {
      const statusOk = status === 'all' ? true : s.status === status;
      if (!statusOk) return false;
      if (!query) return true;
      const c = campaigns.find((x) => x.id === s.campaignId);
      const hay = `${s.id} ${c?.code ?? ''} ${c?.product?.name ?? ''} ${c?.creator?.name ?? ''}`.toLowerCase();
      return hay.includes(query);
    });
  }, [submissions, status, q, campaigns]);

  const openSubmission = (id: number) => {
    const sp = new URLSearchParams(location.search);
    sp.set('submissionId', String(id));
    navigate({ pathname: location.pathname, search: `?${sp.toString()}` });
  };

  const closeSubmission = () => {
    const sp = new URLSearchParams(location.search);
    if (!sp.has('submissionId')) return;
    sp.delete('submissionId');
    const next = sp.toString();
    navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
  };

  const [feedback, setFeedback] = useState('');
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmRevision, setConfirmRevision] = useState(false);

  const statusLabel = (s: SubmissionStatus) =>
    s === 'pending_review' ? 'Pending review' : s === 'approved' ? 'Approved' : 'Revision requested';

  const statusPill = (s: SubmissionStatus) =>
    s === 'pending_review'
      ? 'bg-blue-100 text-blue-700'
      : s === 'approved'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-rose-100 text-rose-700';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Submissions</h2>
        <p className="text-sm text-gray-500 mt-0.5">Review creator reels and approve or request revisions.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by campaign code, product, creator…"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending_review">Pending review</option>
            <option value="approved">Approved</option>
            <option value="revision_requested">Revision requested</option>
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
            <p className="text-sm font-semibold text-gray-700">No submissions found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filtered.map((s) => {
              const c = campaigns.find((x) => x.id === s.campaignId);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openSubmission(s.id)}
                  className="w-full text-left p-4 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-md bg-gray-100 overflow-hidden shrink-0">
                      {s.thumbnailUrl ? <img src={s.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {c ? `${c.code} · ${c.product.name}` : `Submission #${s.id}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {c ? `${c.creator.name} · submitted ${s.submittedAt.toLocaleString('en-IN')}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusPill(s.status)}`}>
                      {statusLabel(s.status)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <RightDrawer
        open={selected != null}
        title={selectedCampaign ? `${selectedCampaign.code} — Submission` : 'Submission'}
        subtitle={selectedCampaign ? `${selectedCampaign.product.name} · ${selectedCampaign.creator.name}` : undefined}
        onClose={() => {
          setFeedback('');
          closeSubmission();
        }}
        footer={
          selected ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmRevision(true)}
                className="flex-1 px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                disabled={selected.status === 'approved'}
              >
                Request revision
              </button>
              <button
                type="button"
                onClick={() => setConfirmApprove(true)}
                className="flex-1 px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
                disabled={selected.status === 'approved'}
              >
                Approve
              </button>
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusPill(selected.status)}`}>
                {statusLabel(selected.status)}
              </span>
              {selectedCampaign && (
                <button
                  type="button"
                  onClick={() => navigate(`/business/reel-campaigns/campaigns?campaignId=${selectedCampaign.id}`)}
                  className="text-sm font-semibold text-orange-700 hover:underline"
                >
                  View campaign
                </button>
              )}
            </div>

            <div className="rounded-lg overflow-hidden bg-black">
              <video src={selected.videoUrl} controls className="w-full aspect-video bg-black" />
            </div>

            {selectedCampaign && (
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign brief</p>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{selectedCampaign.brief}</p>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Creator caption</p>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{selected.caption}</p>
            </div>

            {selected.status === 'revision_requested' && selected.feedback && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Previous feedback</p>
                <p className="text-sm text-rose-700 mt-2 whitespace-pre-wrap">{selected.feedback}</p>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Feedback (for revision)</p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
                placeholder="Tell the creator what to fix (lighting, CTA, product framing, etc.)"
              />
              {confirmRevision && !feedback.trim() && (
                <p className="text-xs text-rose-700 mt-2">Feedback is required to request revision.</p>
              )}
            </div>
          </div>
        )}
      </RightDrawer>

      <ConfirmModal
        open={confirmApprove}
        title="Approve this submission?"
        description="This is mock behavior. Approval will mark it approved and update the campaign status."
        confirmText="Approve"
        onCancel={() => setConfirmApprove(false)}
        onConfirm={() => {
          if (selected) dispatch({ type: 'submission/approve', submissionId: selected.id });
          setConfirmApprove(false);
        }}
      />

      <ConfirmModal
        open={confirmRevision}
        title="Request revision?"
        description="This is mock behavior. Feedback will be visible to the creator."
        confirmText="Send revision request"
        tone="danger"
        onCancel={() => setConfirmRevision(false)}
        onConfirm={() => {
          if (!selected) return;
          const msg = feedback.trim();
          if (!msg) return;
          dispatch({ type: 'submission/revision', submissionId: selected.id, feedback: msg });
          setConfirmRevision(false);
        }}
      />
    </div>
  );
};

export default SubmissionsPage;

