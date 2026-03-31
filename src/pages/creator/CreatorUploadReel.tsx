import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronRight, Upload, Video, X } from 'lucide-react';
import { StatusChip } from '../../components/creator/ui/StatusChip';
import { validateFileExtension, validateFileSize, validateMaxLength, validateRequired } from '../../components/creator/utils/validation';

type Step = 1 | 2 | 3 | 4 | 5;

type SubmissionStatus = 'draft' | 'under_review' | 'approved' | 'rejected';

interface Campaign {
  id: number;
  brand: string;
  campaign: string;
  dueAt: Date;
  payout: number;
}

const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv'] as const;
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_DURATION_SECONDS = 60;
const MAX_DESCRIPTION_LEN = 5000;

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function safeNumber(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

const CreatorUploadReel: React.FC = () => {
  const location = useLocation();
  const campaignIdFromUrl = safeNumber(new URLSearchParams(location.search).get('campaignId'));

  // Mock campaigns (swap to API later)
  const campaigns: Campaign[] = useMemo(
    () => [
      { id: 1, brand: 'Libas', campaign: "Monsoon Edit '26", dueAt: new Date(Date.now() + 5 * 3_600_000), payout: 2500 },
      { id: 2, brand: 'boAt', campaign: 'Pro Series Drop', dueAt: new Date(Date.now() + 6 * 86_400_000), payout: 3200 },
      { id: 3, brand: 'FabIndia', campaign: 'Desi Fusion Edit', dueAt: new Date(Date.now() + 10 * 86_400_000), payout: 2800 },
    ],
    [],
  );

  const [step, setStep] = useState<Step>(1);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(campaignIdFromUrl);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId],
  );

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [agreeBrief, setAgreeBrief] = useState(false);

  const [submitStatus, setSubmitStatus] = useState<SubmissionStatus>('draft');
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  // Keep URL preselect in sync if user opened via campaign deep-link
  useEffect(() => {
    if (campaignIdFromUrl && !selectedCampaignId) setSelectedCampaignId(campaignIdFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignIdFromUrl]);

  // Preview URL lifecycle
  useEffect(() => {
    if (!file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const validateVideoFile = async (f: File) => {
    const extRes = validateFileExtension(f, [...ALLOWED_EXTENSIONS]);
    if (!extRes.ok) return { ok: false as const, message: extRes.message };

    const sizeRes = validateFileSize(f, MAX_SIZE_BYTES);
    if (!sizeRes.ok) return { ok: false as const, message: sizeRes.message };

    return { ok: true as const };
  };

  const readDuration = async (f: File) => {
    const url = URL.createObjectURL(f);
    try {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.src = url;
      await new Promise<void>((resolve, reject) => {
        v.onloadedmetadata = () => resolve();
        v.onerror = () => reject(new Error('metadata_error'));
      });
      const dur = Number(v.duration);
      if (!Number.isFinite(dur) || dur <= 0) return null;
      return dur;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const onPickFile = async (f: File | null) => {
    setFileError(null);
    setDurationError(null);
    setDurationSeconds(null);
    setRejectReason(null);
    setSubmitStatus('draft');

    if (!f) {
      setFile(null);
      return;
    }

    const base = await validateVideoFile(f);
    if (!base.ok) {
      setFile(null);
      setFileError(base.message);
      return;
    }

    setFile(f);

    const dur = await readDuration(f);
    setDurationSeconds(dur);
    if (dur != null && dur > MAX_DURATION_SECONDS) {
      setDurationError(`Video is too long. Max duration is ${MAX_DURATION_SECONDS} seconds.`);
    }
  };

  const canGoStep2 = selectedCampaignId != null;
  const canGoStep3 = file != null && !fileError && !durationError;
  const canGoStep4 = (() => {
    const r1 = validateRequired(description, 'Description');
    const r2 = validateMaxLength(description, MAX_DESCRIPTION_LEN, 'Description');
    return r1.ok && r2.ok;
  })();
  const canSubmit = canGoStep4 && agreeBrief && canGoStep3 && canGoStep2;

  const onSubmitMock = () => {
    if (!canSubmit) return;
    setStep(5);
    setSubmitStatus('under_review');
    setRejectReason(null);

    // Mock async review result (swap to API later)
    window.setTimeout(() => {
      // deterministic-ish: reject if description is extremely short, else approve
      const shouldReject = description.trim().length < 12;
      if (shouldReject) {
        setSubmitStatus('rejected');
        setRejectReason('Please add clearer product benefits + CTA. Keep framing within campaign brief.');
      } else {
        setSubmitStatus('approved');
      }
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] flex items-center justify-center">
          <Video className="w-5 h-5 text-[#FF4D00]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Upload Reel</h1>
          <p className="text-sm text-gray-500">Select a campaign, upload your video, and submit for approval.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {[
          { s: 1, label: 'Campaign' },
          { s: 2, label: 'Upload' },
          { s: 3, label: 'Details' },
          { s: 4, label: 'Review' },
          { s: 5, label: 'Submitted' },
        ].map(({ s, label }) => {
          const active = step === s;
          const done = step > (s as Step);
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-extrabold ${
                  active ? 'bg-[#FF4D00] text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-gray-200 text-gray-500'
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className={`text-[12px] font-bold ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
              {s !== 5 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm p-6">
        {/* Step 1 — Campaign */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[16px] font-extrabold text-gray-900">Select a campaign</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Choose an active campaign to upload your deliverable reel.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {campaigns.map((c) => {
                const selected = selectedCampaignId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCampaignId(c.id)}
                    className={`text-left rounded-2xl border p-4 transition-shadow ${
                      selected ? 'border-[#FF4D00] shadow-sm bg-[#fff8f5]' : 'border-gray-100 hover:shadow-sm'
                    }`}
                  >
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Campaign #{c.id}</p>
                    <p className="text-[14px] font-extrabold text-gray-900 mt-1">{c.campaign}</p>
                    <p className="text-[12px] text-gray-500 mt-1">{c.brand}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-500">Due {fmtDate(c.dueAt)}</span>
                      <span className="text-[12px] font-extrabold text-gray-900">₹{c.payout.toLocaleString('en-IN')}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link to="/creator/deals?tab=active" className="text-[12px] font-bold text-gray-500 hover:underline">
                View active campaigns
              </Link>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canGoStep2}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${
                  canGoStep2 ? 'bg-[#FF4D00] text-white hover:bg-[#e64500]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Upload */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-extrabold text-gray-900">Upload video</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Allowed: {ALLOWED_EXTENSIONS.join(', ')} · Max {Math.round(MAX_SIZE_BYTES / (1024 * 1024))}MB · Max {MAX_DURATION_SECONDS}s
                </p>
              </div>
              {selectedCampaign && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selected</p>
                  <p className="text-[12px] font-extrabold text-gray-900">{selectedCampaign.campaign}</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-5">
              <div className="flex items-start gap-4 flex-col sm:flex-row">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-800">Choose a video file</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">We’ll validate file type, size, and duration before submission.</p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <label className="inline-flex">
                      <input
                        type="file"
                        accept={ALLOWED_EXTENSIONS.map((e) => `video/*`).join(',')}
                        className="hidden"
                        onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                      />
                      <span className="px-4 py-2.5 rounded-xl bg-[#FF4D00] text-white text-[13px] font-bold hover:bg-[#e64500] transition-colors cursor-pointer">
                        Browse file
                      </span>
                    </label>
                    {file && (
                      <button
                        type="button"
                        onClick={() => onPickFile(null)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-[13px] font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {(fileError || durationError) && (
                    <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-[12px] text-red-700 font-semibold">{fileError ?? durationError}</p>
                    </div>
                  )}

                  {file && !fileError && (
                    <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[12px] font-semibold text-gray-700 truncate">{file.name}</p>
                        <button type="button" onClick={() => onPickFile(null)} className="text-gray-400 hover:text-gray-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Size: {(file.size / (1024 * 1024)).toFixed(1)}MB
                        {durationSeconds != null ? ` · Duration: ${Math.round(durationSeconds)}s` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {previewUrl && (
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  className="w-full bg-black max-h-[320px]"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="text-[12px] font-bold text-gray-500 hover:underline">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canGoStep3}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${
                  canGoStep3 ? 'bg-[#FF4D00] text-white hover:bg-[#e64500]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Details */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[16px] font-extrabold text-gray-900">Add details</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Write a clear caption. Keep it aligned with the campaign brief.</p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                placeholder="Example: Styling this Kurta set for monsoon — breathable fabric, perfect fit. Shop now via my link."
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-gray-400">Max {MAX_DESCRIPTION_LEN} chars</p>
                <p className={`text-[11px] font-semibold ${description.length > MAX_DESCRIPTION_LEN ? 'text-red-600' : 'text-gray-500'}`}>
                  {description.length}/{MAX_DESCRIPTION_LEN}
                </p>
              </div>

              {(!validateRequired(description, 'Description').ok || !validateMaxLength(description, MAX_DESCRIPTION_LEN, 'Description').ok) && (
                <div className="mt-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-red-700 font-semibold">
                    {!validateRequired(description, 'Description').ok
                      ? validateRequired(description, 'Description').message
                      : validateMaxLength(description, MAX_DESCRIPTION_LEN, 'Description').message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setStep(2)} className="text-[12px] font-bold text-gray-500 hover:underline">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!canGoStep4}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${
                  canGoStep4 ? 'bg-[#FF4D00] text-white hover:bg-[#e64500]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[16px] font-extrabold text-gray-900">Review & submit</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Double-check campaign, file, and caption before submitting.</p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Campaign</p>
                <p className="text-[12px] font-extrabold text-gray-900">{selectedCampaign?.campaign ?? '-'}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Video</p>
                <p className="text-[12px] font-semibold text-gray-700 truncate max-w-[60%] text-right">{file?.name ?? '-'}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Duration</p>
                <p className="text-[12px] font-semibold text-gray-700">{durationSeconds != null ? `${Math.round(durationSeconds)}s` : '-'}</p>
              </div>
              <div className="pt-2 border-t border-gray-50">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                <p className="text-[13px] text-gray-800 whitespace-pre-wrap">{description.trim() || '-'}</p>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4">
              <input
                type="checkbox"
                checked={agreeBrief}
                onChange={(e) => setAgreeBrief(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="text-[13px] font-bold text-gray-900">I followed the campaign brief</p>
                <p className="text-[12px] text-gray-400 mt-0.5">You confirm the reel meets deliverable requirements and brand guidelines.</p>
              </div>
            </label>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setStep(3)} className="text-[12px] font-bold text-gray-500 hover:underline">
                Back
              </button>
              <button
                type="button"
                onClick={onSubmitMock}
                disabled={!canSubmit}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${
                  canSubmit ? 'bg-[#FF4D00] text-white hover:bg-[#e64500]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Submit for review
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Submitted */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[16px] font-extrabold text-gray-900">Submission</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Track your reel review status here.</p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                <div className="mt-2">
                  {submitStatus === 'under_review' && <StatusChip label="Under review" tone="info" dotClassName="bg-blue-400" />}
                  {submitStatus === 'approved' && <StatusChip label="Approved" tone="success" dotClassName="bg-emerald-400" />}
                  {submitStatus === 'rejected' && <StatusChip label="Revision needed" tone="danger" dotClassName="bg-red-400" />}
                  {submitStatus === 'draft' && <StatusChip label="Draft" tone="neutral" />}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400 font-semibold">Campaign</p>
                <p className="text-[12px] font-extrabold text-gray-900">{selectedCampaign?.campaign ?? '-'}</p>
              </div>
            </div>

            {submitStatus === 'rejected' && (
              <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
                <p className="text-[12px] font-bold text-red-700">Feedback</p>
                <p className="text-[12px] text-red-700 mt-1">{rejectReason ?? 'Needs revision.'}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Link to="/creator/reels" className="text-[12px] font-bold text-gray-500 hover:underline">
                Go to My Reels
              </Link>
              {submitStatus === 'rejected' ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    setSubmitStatus('draft');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#FF4D00] text-white text-[13px] font-bold hover:bg-[#e64500] transition-colors"
                >
                  Re-upload
                </button>
              ) : (
                <Link
                  to="/creator/deals?tab=active"
                  className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-[13px] font-bold hover:bg-black transition-colors"
                >
                  Back to campaigns
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorUploadReel;
