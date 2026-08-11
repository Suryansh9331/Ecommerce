import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart2, ChevronRight, Eye, Link2, MapPin, Play, Upload, Video, X } from 'lucide-react';
import { SideDrawer } from '../../components/creator/ui/SideDrawer';
import { ConfirmModal } from '../../components/creator/ui/ConfirmModal';
import { StatusChip } from '../../components/creator/ui/StatusChip';

type ReelStatus = 'under_review' | 'approved' | 'rejected' | 'live';

interface ReelItem {
  id: number;
  campaignId: number;
  campaign: string;
  brand: string;
  status: ReelStatus;
  updatedAt: Date;
  thumbnailUrl?: string;
  videoUrl?: string;
  views: number;
  likes: number;
  shares: number;
  feedback?: string;
}

interface CreatorProfile {
  name: string;
  handle: string;
  bio: string;
  city?: string;
  avatarUrl?: string;
  openForDeals: boolean;
  nicheTags: string[];
  stats: {
    reels: number;
    deals: number;
    totalViews: number;
    followers: number;
  };
}

function fmtDateTime(d: Date) {
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${Math.round((n / 1_000_000) * 10) / 10}M`;
  if (n >= 1_000) return `${Math.round((n / 1_000) * 10) / 10}K`;
  return `${n}`;
}

function readReelIdFromSearch(search: string): number | null {
  const raw = new URLSearchParams(search).get('reelId');
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

function chipForStatus(status: ReelStatus) {
  if (status === 'under_review') return <StatusChip label="Under review" tone="info" dotClassName="bg-blue-400" />;
  if (status === 'approved') return <StatusChip label="Approved" tone="success" dotClassName="bg-emerald-400" />;
  if (status === 'live') return <StatusChip label="Live" tone="success" dotClassName="bg-emerald-400" />;
  return <StatusChip label="Revision needed" tone="danger" dotClassName="bg-red-400" />;
}

const CreatorReels: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const drawerVideoRef = useRef<HTMLVideoElement | null>(null);

  // Mock creator profile (swap to API later)
  const profile: CreatorProfile = useMemo(
    () => ({
      name: 'Aoin Creator',
      handle: 'aoin.creator',
      bio: 'Short-form commerce reels · Fashion + beauty edits · High-converting hooks + CTAs.',
      city: 'Mumbai',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&auto=format&fit=crop&q=70',
      openForDeals: true,
      nicheTags: ['Fashion', 'Beauty', 'UGC', 'Reels'],
      stats: {
        reels: 11,
        deals: 5,
        totalViews: 125_400,
        followers: 18_200,
      },
    }),
    [],
  );

  // Mock reels (swap to API later)
  const reels: ReelItem[] = useMemo(
    () => [
      {
        id: 11,
        campaignId: 1,
        campaign: "Monsoon Edit '26",
        brand: 'Libas',
        status: 'rejected',
        updatedAt: new Date(Date.now() - 2 * 3_600_000),
        thumbnailUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=70',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        views: 0,
        likes: 0,
        shares: 0,
        feedback: 'Please improve lighting and add a clearer CTA within the first 3 seconds.',
      },
      {
        id: 12,
        campaignId: 2,
        campaign: 'Pro Series Drop',
        brand: 'boAt',
        status: 'under_review',
        updatedAt: new Date(Date.now() - 45 * 60_000),
        thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=70',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        views: 0,
        likes: 0,
        shares: 0,
      },
      {
        id: 13,
        campaignId: 3,
        campaign: 'Desi Fusion Edit',
        brand: 'FabIndia',
        status: 'live',
        updatedAt: new Date(Date.now() - 3 * 86_400_000),
        thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=70',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        views: 12450,
        likes: 860,
        shares: 122,
      },
    ],
    [],
  );

  const [statusFilter, setStatusFilter] = useState<'all' | ReelStatus>('all');
  const [selected, setSelected] = useState<ReelItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [tab, setTab] = useState<'reels' | 'insights'>('reels');

  const reelIdFromUrl = useMemo(() => readReelIdFromSearch(location.search), [location.search]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return reels;
    return reels.filter((r) => r.status === statusFilter);
  }, [reels, statusFilter]);

  const clearReelIdFromUrl = () => {
    const sp = new URLSearchParams(location.search);
    if (!sp.has('reelId')) return;
    sp.delete('reelId');
    const next = sp.toString();
    navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
  };

  // Deep link: /creator/reels?reelId=13
  useEffect(() => {
    if (!reelIdFromUrl) return;
    const found = reels.find((r) => r.id === reelIdFromUrl);
    if (!found) return;
    if (!selected || selected.id !== found.id) setSelected(found);
  }, [reelIdFromUrl, reels, selected]);

  return (
    <div className="space-y-5 text-gray-900">
      {/* IG-style header */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-100/80 bg-white shadow-sm">
        <div className="relative h-[150px] bg-[radial-gradient(circle_at_12%_0%,rgba(24, 0, 172,0.55),transparent_55%),radial-gradient(circle_at_70%_25%,rgba(17,24,39,0.28),transparent_55%),linear-gradient(135deg,#12131f,#14192e)]">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />
        </div>

        <div className="px-5 pb-5">
          <div className="-mt-8 flex items-end justify-between gap-4 flex-wrap relative z-10">
            <div className="flex items-end gap-4 min-w-0">
              <div className="relative">
                <div className="w-[88px] h-[88px] rounded-[26px] p-[3px] bg-gradient-to-br from-primary-600 via-primary-400 to-primary-200 shadow-lg">
                  <div className="w-full h-full rounded-[23px] bg-white overflow-hidden">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Video className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow">
                  <span className={`block w-3 h-3 rounded-full ${profile.openForDeals ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                </span>
              </div>

              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[20px] font-extrabold text-white leading-none truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
                    <span className="inline-flex px-2.5 py-1.5 rounded-2xl bg-gray-900/90 border border-white/10 mb-2">
                      {profile.name}
                    </span>
                  </h1>
                  {profile.openForDeals ? (
                    <StatusChip label="Open for deals" tone="success" dotClassName="bg-emerald-400" />
                  ) : (
                    <StatusChip label="Not available" tone="neutral" />
                  )}
                </div>
                <p className="text-[12px] text-gray-600 font-semibold mt-1 relative z-10">@{profile.handle}</p>
                <p className="text-[13px] text-gray-700 mt-2 max-w-2xl">{profile.bio}</p>

                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {profile.city && (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {profile.city}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500">
                    <Link2 className="w-4 h-4 text-gray-400" />
                    aoinstore.com/{profile.handle}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/creator/upload-reel"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary-600 text-white text-[12px] font-bold hover:bg-primary-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload reel
              </Link>
              <Link
                to="/creator/settings"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 text-[12px] font-bold hover:bg-gray-50 transition-colors"
              >
                Edit profile
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { k: 'Reels', v: profile.stats.reels },
              { k: 'Deals', v: profile.stats.deals },
              { k: 'Total views', v: profile.stats.totalViews, fmt: true },
              { k: 'Followers', v: profile.stats.followers, fmt: true },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <p className="text-[18px] font-extrabold text-gray-900 tabular-nums">
                  {s.fmt ? fmtCompact(s.v) : s.v.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.k}</p>
              </div>
            ))}
          </div>

          {/* Niche tags */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {profile.nicheTags.map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[11px] font-bold text-gray-600">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs + filters bar */}
      <section className="bg-white border border-gray-100/80 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-2xl p-1">
            {([
              { key: 'reels' as const, label: 'Reels' },
              { key: 'insights' as const, label: 'Insights' },
            ]).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-xl text-[12px] font-extrabold transition-colors ${
                  tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'reels' && (
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'under_review', 'rejected', 'approved', 'live'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStatusFilter(k)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    statusFilter === k ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {k === 'all'
                    ? 'All'
                    : k === 'under_review'
                      ? 'Under review'
                      : k === 'approved'
                        ? 'Approved'
                        : k === 'rejected'
                          ? 'Needs fix'
                          : 'Live'}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white border border-gray-100/80 p-8 text-center">
          <p className="text-[14px] font-bold text-gray-700">No reels found</p>
          <p className="text-[12px] text-gray-400 mt-1">Try changing filters or upload your first reel.</p>
          <Link
            to="/creator/upload-reel"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-[12px] font-bold hover:bg-primary-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload reel
          </Link>
        </div>
      ) : tab === 'insights' ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-3xl bg-white border border-gray-100/80 p-6 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Insights</p>
            <h2 className="text-[18px] font-extrabold text-gray-900 mt-2">Your profile is performing well</h2>
            <p className="text-[13px] text-gray-500 mt-1">
              Once APIs are wired, this will show trends (views/likes/shares), top reels, and conversion insights.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { k: 'Avg views', v: 4180 },
                { k: 'Like rate', v: '6.9%' },
                { k: 'Share rate', v: '1.0%' },
              ].map((m) => (
                <div key={m.k} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                  <p className="text-[18px] font-extrabold text-gray-900 tabular-nums">{typeof m.v === 'number' ? fmtCompact(m.v) : m.v}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.k}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-white border border-gray-100/80 p-6 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Quick links</p>
            <div className="mt-4 space-y-2">
              <Link to="/creator/deals?tab=offers" className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-gray-50 text-gray-700 text-[13px] font-semibold hover:bg-gray-100 transition-colors">
                Find new deals
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link to="/creator/payouts" className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-gray-50 text-gray-700 text-[13px] font-semibold hover:bg-gray-100 transition-colors">
                Payout setup
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link to="/creator/settings" className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-gray-50 text-gray-700 text-[13px] font-semibold hover:bg-gray-100 transition-colors">
                Edit profile
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        // IG-style reels grid
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 group"
              aria-label={`Open reel ${r.id}`}
            >
              {r.thumbnailUrl ? (
                <img
                  src={r.thumbnailUrl}
                  alt={r.campaign}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Video className="w-6 h-6" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-sm border border-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-5 h-5 text-white fill-white translate-x-[1px]" />
                </div>
              </div>

              {/* Status pill */}
              <div className="absolute top-2 left-2 scale-[0.9] origin-top-left">
                {chipForStatus(r.status)}
              </div>

              {/* Bottom metrics */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="flex items-center justify-between">
                  <p className="text-white text-[10px] font-bold truncate">{r.brand}</p>
                  <p className="text-white/80 text-[10px] font-semibold">{fmtCompact(r.views)} views</p>
                </div>
                <p className="text-white/70 text-[10px] font-semibold mt-1 truncate">{r.campaign}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <SideDrawer
        open={selected != null}
        title="Reel Details"
        subtitle={selected ? `Reel #${selected.id}` : undefined}
        onClose={() => {
          setSelected(null);
          clearReelIdFromUrl();
        }}
        footer={
          selected ? (
            <div className="p-4 flex gap-2">
              {selected.status === 'rejected' ? (
                <Link
                  to={`/creator/upload-reel?campaignId=${selected.campaignId}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary-600 text-white font-bold text-[14px] hover:bg-primary-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Re-upload
                </Link>
              ) : (
                <Link
                  to="/creator/deals?tab=active"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-900 text-white font-bold text-[14px] hover:bg-black transition-colors"
                >
                  View campaign
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setDeleteId(selected.id)}
                className="w-12 h-12 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors shrink-0"
                aria-label="Delete reel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="p-5 space-y-5">
            {/* Video */}
            {selected.videoUrl && (
              <div className="rounded-2xl overflow-hidden bg-black">
                <video
                  ref={drawerVideoRef}
                  src={selected.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full aspect-[9/16] object-contain bg-black"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                <div className="mt-2">{chipForStatus(selected.status)}</div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Updated</p>
                <p className="text-[12px] font-semibold text-gray-700 mt-1">{fmtDateTime(selected.updatedAt)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Campaign</p>
              <p className="text-[15px] font-extrabold text-gray-900 mt-1">{selected.campaign}</p>
              <p className="text-[12px] text-gray-500 mt-1">{selected.brand}</p>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-gray-400" />
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Performance</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { k: 'Views', v: selected.views },
                  { k: 'Likes', v: selected.likes },
                  { k: 'Shares', v: selected.shares },
                ].map((m) => (
                  <div key={m.k} className="rounded-xl bg-white border border-gray-100 px-2 py-2 text-center">
                    <p className="text-[14px] font-extrabold text-gray-900 tabular-nums">{m.v.toLocaleString('en-IN')}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{m.k}</p>
                  </div>
                ))}
              </div>
            </div>

            {selected.status === 'rejected' && selected.feedback && (
              <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
                <p className="text-[11px] font-bold text-red-700 uppercase tracking-widest">Feedback</p>
                <p className="text-[12px] text-red-700 mt-2 font-semibold">"{selected.feedback}"</p>
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Actions</p>
              <div className="space-y-2">
                <Link
                  to={`/creator/reels?reelId=${selected.id}`}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 text-gray-700 text-[13px] font-semibold hover:bg-gray-100 transition-colors"
                >
                  Copy deep link
                  <Link2 className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  to="/creator/notifications"
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 text-gray-700 text-[13px] font-semibold hover:bg-gray-100 transition-colors"
                >
                  Go to notifications
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </SideDrawer>

      <ConfirmModal
        open={deleteId != null}
        tone="danger"
        title="Delete this reel?"
        description="This is a mock UI for now. Later, this will call the delete endpoint and remove it from your list."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          setDeleteId(null);
          setSelected(null);
          clearReelIdFromUrl();
        }}
      />
    </div>
  );
};

export default CreatorReels;

