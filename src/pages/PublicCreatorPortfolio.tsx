import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart2, ExternalLink, Globe, Link2, MapPin, Sparkles } from 'lucide-react';
import { loadShareSnapshot } from '../components/creator/utils/portfolioShare';
import { StatusChip } from '../components/creator/ui/StatusChip';
import { DEFAULT_TARGETING } from '../components/creator/utils/creatorTargeting';
import { DEFAULT_PORTFOLIO } from '../components/creator/utils/creatorPortfolio';

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${Math.round((n / 1_000_000) * 10) / 10}M`;
  if (n >= 1_000) return `${Math.round((n / 1_000) * 10) / 10}K`;
  return `${n}`;
}

const PublicCreatorPortfolio: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const snap = useMemo(() => (slug ? loadShareSnapshot(slug) : null), [slug]);

  // Mock reels lookup for thumbnails (until API)
  const reels = useMemo(
    () => [
      { id: 11, brand: 'Libas', title: "Monsoon Edit '26", thumb: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop&q=70' },
      { id: 12, brand: 'boAt', title: 'Pro Series Drop', thumb: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=70' },
      { id: 13, brand: 'FabIndia', title: 'Desi Fusion Edit', thumb: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=70' },
      { id: 14, brand: 'Mamaearth', title: 'Glow Up Summer', thumb: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&auto=format&fit=crop&q=70' },
      { id: 15, brand: 'Noise', title: 'Game On Season 2', thumb: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f3?w=900&auto=format&fit=crop&q=70' },
      { id: 16, brand: 'W for Woman', title: 'Summer Wardrobe', thumb: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&auto=format&fit=crop&q=70' },
    ],
    [],
  );

  const effectiveSnap =
    snap ??
    ({
      createdAt: new Date().toISOString(),
      profile: {
        name: 'Aoin Creator',
        handle: 'aoin.creator',
        bio: 'Short-form commerce reels · Fashion + beauty edits · High-converting hooks + CTAs.',
        city: 'Mumbai',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&auto=format&fit=crop&q=70',
      },
      stats: {
        totalViews: 125400,
        totalLikes: 8600,
        totalShares: 1020,
        totalDeals: 18,
        followers: 18200,
      },
      targeting: DEFAULT_TARGETING,
      collaborations: [
        { brand: 'W for Woman', campaign: 'Floral Print Midi Dress', result: '₹3,850 earned · 22 sales', highlight: 'Strong CTA + try-on hook' },
        { brand: 'Plum Goodness', campaign: 'Niacinamide Serum', result: '₹2,240 earned · 28 sales', highlight: 'Before/after framing' },
        { brand: 'boAt', campaign: 'Pro Series Drop', result: 'Under review', highlight: 'Unboxing + lifestyle cutaways' },
      ],
      portfolio: DEFAULT_PORTFOLIO,
    } as const);

  const featured = effectiveSnap.portfolio.featuredReelIds
    .map((id) => reels.find((r) => r.id === id))
    .filter(Boolean) as typeof reels;

  const targeting = effectiveSnap.targeting ?? DEFAULT_TARGETING;
  const stats = effectiveSnap.stats;

  // Fallback stats for older share snapshots (before we started saving stats).
  const reelMetrics = useMemo(() => {
    return new Map<number, { views: number; likes: number; shares: number }>([
      [11, { views: 0, likes: 0, shares: 0 }],
      [12, { views: 0, likes: 0, shares: 0 }],
      [13, { views: 12450, likes: 860, shares: 122 }],
      [14, { views: 8450, likes: 540, shares: 86 }],
      [15, { views: 10220, likes: 620, shares: 97 }],
      [16, { views: 14110, likes: 940, shares: 140 }],
    ]);
  }, []);

  const derived = useMemo(() => {
    const ids = effectiveSnap.portfolio.featuredReelIds ?? [];
    const sums = ids.reduce(
      (acc, id) => {
        const m = reelMetrics.get(id);
        if (!m) return acc;
        acc.views += m.views;
        acc.likes += m.likes;
        acc.shares += m.shares;
        return acc;
      },
      { views: 0, likes: 0, shares: 0 },
    );
    return {
      totalViews: stats?.totalViews ?? sums.views,
      totalLikes: stats?.totalLikes ?? sums.likes,
      totalShares: stats?.totalShares ?? sums.shares,
      totalDeals: stats?.totalDeals ?? (snap.collaborations?.length ?? 0),
      followers: stats?.followers ?? 0,
    };
  }, [effectiveSnap.collaborations, effectiveSnap.portfolio.featuredReelIds, reelMetrics, stats?.followers, stats?.totalDeals, stats?.totalLikes, stats?.totalShares, stats?.totalViews]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-3xl overflow-hidden bg-gray-100 border border-gray-200">
            {effectiveSnap.profile.avatarUrl ? (
              <img src={effectiveSnap.profile.avatarUrl} alt={effectiveSnap.profile.name} className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-[18px] font-extrabold text-gray-900 truncate">{effectiveSnap.profile.name}</p>
            <p className="text-[12px] text-gray-500 font-semibold">@{effectiveSnap.profile.handle}</p>
            {effectiveSnap.profile.bio && <p className="text-[13px] text-gray-600 mt-2 max-w-2xl">{effectiveSnap.profile.bio}</p>}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <StatusChip label="Creator portfolio" tone="info" dotClassName="bg-blue-400" />
              <StatusChip label="Public preview" tone="neutral" />
              {!snap && <StatusChip label="Mock data" tone="warning" dotClassName="bg-orange-400" />}
            </div>
          </div>
        </div>

        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 text-[12px] font-bold hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to store
        </Link>
      </div>

      <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 bg-[radial-gradient(circle_at_15%_10%,rgba(255,77,0,0.14),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(17,24,39,0.12),transparent_55%),linear-gradient(135deg,#ffffff,#fff7f2)]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Creator media kit
              </p>
              <p className="text-[16px] font-extrabold text-gray-900 mt-2">Featured reels</p>
              <p className="text-[13px] text-gray-600 mt-1">Selected highlights and recent brand work.</p>
            </div>
            {targeting ? (
              <div className="flex items-center gap-2 flex-wrap">
                <StatusChip label={targeting.primaryNiches.slice(0, 2).join(' · ')} tone="neutral" />
                <StatusChip label={targeting.languages.slice(0, 2).join(' · ')} tone="neutral" />
              </div>
            ) : null}
          </div>
        </div>
        <div className="p-6">
          {featured.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
              No featured reels.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {featured.map((r) => (
                <div key={r.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-100">
                  <img src={r.thumb} alt={r.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-[11px] font-extrabold truncate">{r.brand}</p>
                    <p className="text-white/70 text-[10px] font-semibold truncate">{r.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Performance snapshot */}
      <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-6">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Performance snapshot</p>
        <p className="text-[13px] text-gray-600 mt-1">High-level proof for brands.</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { k: 'Views', v: derived.totalViews },
            { k: 'Likes', v: derived.totalLikes },
            { k: 'Shares', v: derived.totalShares },
            { k: 'Deals', v: derived.totalDeals },
            { k: 'Followers', v: derived.followers },
          ].map((m) => (
            <div key={m.k} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 text-center">
              <p className="text-[18px] font-extrabold text-gray-900 tabular-nums">{fmtCompact(m.v)}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.k}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Creator details */}
      {(targeting || effectiveSnap.profile.city) && (
        <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Creator details</p>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location
              </p>
              <p className="text-[13px] font-semibold text-gray-800 mt-3">
                {effectiveSnap.profile.city || (targeting?.audience?.city ?? '—')}
              </p>
              <p className="text-[12px] text-gray-500 mt-1">
                {(targeting?.audience?.state ?? '') && (targeting?.audience?.country ?? '')
                  ? `${targeting?.audience?.state}, ${targeting?.audience?.country}`
                  : targeting?.audience?.country ?? '—'}
              </p>
            </div>

            {targeting && (
              <>
                <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Primary niches</p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {targeting.primaryNiches.slice(0, 6).map((n) => (
                      <span key={n} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[11px] font-bold text-gray-700">
                        {n}
                      </span>
                    ))}
                  </div>
                  {targeting.secondaryNiches.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Secondary</p>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {targeting.secondaryNiches.slice(0, 6).map((n) => (
                          <span key={n} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[11px] font-bold text-gray-700 opacity-90">
                            {n}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Languages</p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {targeting.languages.slice(0, 6).map((l) => (
                      <span key={l} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[11px] font-bold text-gray-700">
                        {l}
                      </span>
                    ))}
                  </div>

                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Content formats</p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {targeting.contentFormats.length > 0 ? (
                      targeting.contentFormats.slice(0, 8).map((f) => (
                        <span key={f} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[11px] font-bold text-gray-700">
                          {f}
                        </span>
                      ))
                    ) : (
                      <span className="text-[12px] font-semibold text-gray-500">—</span>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Deal preferences</p>
                  <div className="mt-3 space-y-2 text-[12px] font-semibold text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Budget</span>
                      <span>{targeting.dealPrefs.budgets.join(', ') || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Turnaround</span>
                      <span>{targeting.dealPrefs.turnaround || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Collab</span>
                      <span>{targeting.dealPrefs.collabTypes.join(', ') || '—'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Collaborations */}
      {snap.collaborations && snap.collaborations.length > 0 && (
        <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Brand collaborations</p>
          <p className="text-[13px] text-gray-600 mt-1">Proof of outcomes and what worked.</p>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            {snap.collaborations.map((c) => (
              <div key={`${c.brand}-${c.campaign}`} className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.brand}</p>
                <p className="text-[15px] font-extrabold text-gray-900 mt-2">{c.campaign}</p>
                <div className="mt-3">
                  <StatusChip label={c.result} tone={c.result === 'Under review' ? 'info' : 'success'} dotClassName={c.result === 'Under review' ? 'bg-blue-400' : 'bg-emerald-400'} />
                </div>
                {c.highlight && (
                  <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold text-gray-600">
                    <BarChart2 className="w-4 h-4 text-gray-400" />
                    {c.highlight}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-6">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Links</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { k: 'Instagram', v: snap.portfolio.socialLinks.instagram, icon: <Link2 className="w-4 h-4 text-gray-400" /> },
            { k: 'YouTube', v: snap.portfolio.socialLinks.youtube, icon: <Link2 className="w-4 h-4 text-gray-400" /> },
            { k: 'Website', v: snap.portfolio.socialLinks.website, icon: <Globe className="w-4 h-4 text-gray-400" /> },
          ].map((x) => (
            <div key={x.k} className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">{x.icon}{x.k}</p>
              <p className="text-[12px] text-gray-700 font-semibold mt-3 break-all">{x.v || '—'}</p>
              {x.v ? (
                <a className="mt-3 inline-flex items-center gap-2 text-[12px] font-bold text-[#FF4D00] hover:underline" href={x.v} target="_blank" rel="noreferrer">
                  Open <ExternalLink className="w-4 h-4" />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {snap.portfolio.packages.showRates && (
        <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Packages</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reel rate</p>
              <p className="text-[18px] font-extrabold text-gray-900 tabular-nums mt-2">
                ₹{(snap.portfolio.packages.reelRate ?? 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Turnaround</p>
              <p className="text-[18px] font-extrabold text-gray-900 tabular-nums mt-2">
                {snap.portfolio.packages.turnaround || '—'}
              </p>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revision policy</p>
              <p className="text-[12px] font-semibold text-gray-700 mt-2">
                {snap.portfolio.packages.revisionPolicy || '—'}
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="text-[11px] text-gray-400">
        Share slug: <span className="font-mono">{slug}</span> · Stored locally for now (mock). In production this will be fetched from backend.
      </div>
    </div>
  );
};

export default PublicCreatorPortfolio;

