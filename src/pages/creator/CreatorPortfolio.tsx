import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BarChart2, Briefcase, CheckCircle2, Copy, ExternalLink, Globe, Link2, Sparkles } from 'lucide-react';
import { SideDrawer } from '../../components/creator/ui/SideDrawer';
import { StatusChip } from '../../components/creator/ui/StatusChip';
import { validateMaxLength } from '../../components/creator/utils/validation';
import { CreatorPortfolioData, loadCreatorPortfolio, saveCreatorPortfolio } from '../../components/creator/utils/creatorPortfolio';
import { getOrCreateShareSlug, saveShareSnapshot } from '../../components/creator/utils/portfolioShare';
import { loadCreatorTargeting } from '../../components/creator/utils/creatorTargeting';

const CreatorPortfolio: React.FC = () => {
  // Mock reels/case studies (swap to API later)
  const reels = useMemo(
    () => [
      { id: 11, brand: 'Libas', title: "Monsoon Edit '26", thumb: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop&q=70', views: 0, likes: 0, shares: 0 },
      { id: 12, brand: 'boAt', title: 'Pro Series Drop', thumb: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=70', views: 0, likes: 0, shares: 0 },
      { id: 13, brand: 'FabIndia', title: 'Desi Fusion Edit', thumb: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=70', views: 12450, likes: 860, shares: 122 },
      { id: 14, brand: 'Mamaearth', title: 'Glow Up Summer', thumb: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&auto=format&fit=crop&q=70', views: 8450, likes: 540, shares: 86 },
      { id: 15, brand: 'Noise', title: 'Game On Season 2', thumb: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f3?w=900&auto=format&fit=crop&q=70', views: 10220, likes: 620, shares: 97 },
      { id: 16, brand: 'W for Woman', title: 'Summer Wardrobe', thumb: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&auto=format&fit=crop&q=70', views: 14110, likes: 940, shares: 140 },
    ],
    [],
  );

  const caseStudies = useMemo(
    () => [
      { id: 1, brand: 'W for Woman', campaign: 'Floral Print Midi Dress', result: '₹3,850 earned · 22 sales', highlight: 'Strong CTA + try-on hook' },
      { id: 2, brand: 'Plum Goodness', campaign: 'Niacinamide Serum', result: '₹2,240 earned · 28 sales', highlight: 'Before/after framing' },
      { id: 3, brand: 'boAt', campaign: 'Pro Series Drop', result: 'Under review', highlight: 'Unboxing + lifestyle cutaways' },
    ],
    [],
  );

  const [saved, setSaved] = useState<CreatorPortfolioData>(() => loadCreatorPortfolio());
  const [draft, setDraft] = useState<CreatorPortfolioData>(() => loadCreatorPortfolio());
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  const featured = useMemo(() => {
    const map = new Map(reels.map((r) => [r.id, r]));
    return draft.featuredReelIds.map((id) => map.get(id)).filter(Boolean) as typeof reels;
  }, [draft.featuredReelIds, reels]);

  const totals = useMemo(() => {
    const views = featured.reduce((s, r) => s + r.views, 0);
    const likes = featured.reduce((s, r) => s + r.likes, 0);
    const shares = featured.reduce((s, r) => s + r.shares, 0);
    return { views, likes, shares };
  }, [featured]);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareSlug] = useState<string>(() => getOrCreateShareSlug());

  const noteErr = useMemo(() => {
    const r = validateMaxLength(draft.packages.revisionPolicy ?? '', 200, 'Revision policy');
    return r.ok ? null : r.message;
  }, [draft.packages.revisionPolicy]);

  const TURNAROUND_OPTIONS = useMemo(() => ['24h', '48h', '72h', '7d'], []);

  const onSave = () => {
    if (noteErr) return;
    setSaved(draft);
    saveCreatorPortfolio(draft);
  };

  const toggleFeatured = (id: number) => {
    setDraft((d) => {
      const has = d.featuredReelIds.includes(id);
      const next = has ? d.featuredReelIds.filter((x) => x !== id) : [id, ...d.featuredReelIds];
      return { ...d, featuredReelIds: next.slice(0, 12) };
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF5F0] flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-[#FF4D00]" />
          </div>
          <div>
            <h1 className="text-[24px] font-extrabold text-gray-900 leading-tight">Portfolio</h1>
            <p className="text-[13px] text-gray-400 font-medium mt-0.5">A shareable media kit for brands.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dirty ? <StatusChip label="Unsaved changes" tone="warning" dotClassName="bg-orange-400" /> : <StatusChip label="Saved" tone="success" dotClassName="bg-emerald-400" />}
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 text-[12px] font-bold hover:bg-gray-50 transition-colors"
          >
            Share <ExternalLink className="w-4 h-4 inline-block ml-1" />
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || !!noteErr}
            className={`px-4 py-2.5 rounded-2xl text-[12px] font-extrabold transition-colors ${
              dirty && !noteErr ? 'bg-[#FF4D00] text-white hover:bg-[#e64500]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>

      {/* Media kit top */}
      <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-6 bg-[radial-gradient(circle_at_15%_10%,rgba(255,77,0,0.14),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(17,24,39,0.12),transparent_55%),linear-gradient(135deg,#ffffff,#fff7f2)]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Media kit
              </p>
              <p className="text-[18px] font-extrabold text-gray-900 mt-2">Featured reels + performance snapshot</p>
              <p className="text-[13px] text-gray-600 mt-1 max-w-2xl">
                Curate your best work. Brands use this to decide whether to send offers and what kind of campaign fits you.
              </p>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-gray-200 text-[12px] font-bold text-gray-700">
                  <Link2 className="w-4 h-4 text-gray-400" />
                  {draft.socialLinks.instagram ? 'Instagram linked' : 'Add Instagram'}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-gray-200 text-[12px] font-bold text-gray-700">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {draft.socialLinks.website ? 'Website linked' : 'Add website'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { k: 'Views', v: totals.views },
                { k: 'Likes', v: totals.likes },
                { k: 'Shares', v: totals.shares },
              ].map((m) => (
                <div key={m.k} className="rounded-2xl bg-white border border-gray-200 px-4 py-3 text-center min-w-[110px]">
                  <p className="text-[16px] font-extrabold text-gray-900 tabular-nums">{m.v.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.k}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured reels */}
      <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Featured reels</p>
            <p className="text-[13px] text-gray-600 mt-1">Select up to 12 reels to appear in your media kit.</p>
          </div>
          <Link to="/creator/reels" className="text-[12px] font-bold text-[#FF4D00] hover:underline">
            Manage reels <ArrowUpRight className="w-4 h-4 inline-block" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {featured.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
              No featured reels yet. Pick some from below.
            </div>
          ) : (
            featured.map((r) => (
              <div key={r.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-100">
                <img src={r.thumb} alt={r.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-[11px] font-extrabold truncate">{r.brand}</p>
                  <p className="text-white/70 text-[10px] font-semibold truncate">{r.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFeatured(r.id)}
                  className="absolute top-2 right-2 px-2 py-1 rounded-xl bg-white/90 text-gray-900 text-[10px] font-extrabold"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pick from your reels</p>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {reels.map((r) => {
              const on = draft.featuredReelIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleFeatured(r.id)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border transition-colors ${
                    on ? 'border-[#FF4D00]' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <img src={r.thumb} alt={r.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute top-2 left-2">
                    {on ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-[#FF4D00] text-white text-[10px] font-extrabold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Featured
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-xl bg-white/90 text-gray-900 text-[10px] font-extrabold">
                        Add
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Case studies */}
      <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Brand collaborations</p>
            <p className="text-[13px] text-gray-600 mt-1">Quick proof for brands: outcomes + what worked.</p>
          </div>
          <Link to="/creator/deals?tab=completed" className="text-[12px] font-bold text-[#FF4D00] hover:underline">
            Completed deals <ArrowUpRight className="w-4 h-4 inline-block" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          {caseStudies.map((c) => (
            <div key={c.id} className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.brand}</p>
              <p className="text-[15px] font-extrabold text-gray-900 mt-2">{c.campaign}</p>
              <div className="mt-3 inline-flex items-center gap-2">
                <StatusChip label={c.result} tone={c.result === 'Under review' ? 'info' : 'success'} dotClassName={c.result === 'Under review' ? 'bg-blue-400' : 'bg-emerald-400'} />
              </div>
              <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold text-gray-600">
                <BarChart2 className="w-4 h-4 text-gray-400" />
                {c.highlight}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Packages (optional)</p>
            <p className="text-[13px] text-gray-600 mt-1">You can keep rates private and still share your work.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-[12px] font-bold text-gray-700">
            <input
              type="checkbox"
              checked={draft.packages.showRates}
              onChange={(e) => setDraft((d) => ({ ...d, packages: { ...d.packages, showRates: e.target.checked } }))}
            />
            Show rates in portfolio
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
            <p className="text-[12px] font-extrabold text-gray-900">Rates</p>
            <p className="text-[12px] text-gray-500 mt-1">Set rough pricing. You can adjust per brand later.</p>
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-gray-500">Reel rate</label>
              <input
                value={draft.packages.reelRate ?? ''}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  setDraft((d) => ({ ...d, packages: { ...d.packages, reelRate: v ? Number(v) : undefined } }));
                }}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                placeholder="₹"
                disabled={!draft.packages.showRates}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
            <p className="text-[12px] font-extrabold text-gray-900">Policies</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500">Turnaround</label>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {TURNAROUND_OPTIONS.map((t) => {
                    const on = (draft.packages.turnaround ?? '') === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, packages: { ...d.packages, turnaround: t } }))}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                          on ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500">Revision policy</label>
                <input
                  value={draft.packages.revisionPolicy ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, packages: { ...d.packages, revisionPolicy: e.target.value } }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                  placeholder="1 revision included"
                />
                {noteErr && <p className="text-[11px] text-red-600 font-semibold mt-1">{noteErr}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social links */}
      <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Links</p>
        <p className="text-[13px] text-gray-600 mt-1">Add links brands can open quickly.</p>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            { k: 'Instagram', key: 'instagram' as const, icon: <Link2 className="w-4 h-4 text-gray-400" /> },
            { k: 'YouTube', key: 'youtube' as const, icon: <Link2 className="w-4 h-4 text-gray-400" /> },
            { k: 'Website', key: 'website' as const, icon: <Globe className="w-4 h-4 text-gray-400" /> },
          ].map((f) => (
            <div key={f.k} className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">{f.icon}{f.k}</p>
              <input
                value={draft.socialLinks[f.key] ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, socialLinks: { ...d.socialLinks, [f.key]: e.target.value } }))}
                className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                placeholder="https://"
              />
              {draft.socialLinks[f.key] ? (
                <a
                  href={draft.socialLinks[f.key]}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-[12px] font-bold text-[#FF4D00] hover:underline"
                >
                  Open <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <p className="mt-3 text-[12px] text-gray-400">Optional</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <SideDrawer
        open={shareOpen}
        title="Share portfolio"
        subtitle="Public preview"
        onClose={() => setShareOpen(false)}
        footer={
          <div className="p-4 flex gap-2">
            <button
              type="button"
              onClick={async () => {
                // Save snapshot for this slug (mock local storage). Later this will be an API call.
                const totalDeals = caseStudies.length;
                saveShareSnapshot(shareSlug, {
                  createdAt: new Date().toISOString(),
                  profile: {
                    name: 'Aoin Creator',
                    handle: 'aoin.creator',
                    bio: 'Short-form commerce reels · Fashion + beauty edits · High-converting hooks + CTAs.',
                    city: 'Mumbai',
                    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&auto=format&fit=crop&q=70',
                  },
                  stats: {
                    totalViews: totals.views,
                    totalLikes: totals.likes,
                    totalShares: totals.shares,
                    totalDeals,
                    followers: 18200,
                  },
                  targeting: loadCreatorTargeting(),
                  collaborations: [
                    { brand: 'W for Woman', campaign: 'Floral Print Midi Dress', result: '₹3,850 earned · 22 sales', highlight: 'Strong CTA + try-on hook' },
                    { brand: 'Plum Goodness', campaign: 'Niacinamide Serum', result: '₹2,240 earned · 28 sales', highlight: 'Before/after framing' },
                    { brand: 'boAt', campaign: 'Pro Series Drop', result: 'Under review', highlight: 'Unboxing + lifestyle cutaways' },
                  ],
                  portfolio: draft,
                });

                const url = `${window.location.origin}/portfolio/${shareSlug}`;
                try {
                  await navigator.clipboard.writeText(url);
                } catch {
                  // ignore (some browsers block clipboard)
                }
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-900 text-white font-extrabold text-[13px] hover:bg-black transition-colors"
            >
              <Copy className="w-4 h-4" /> Copy link
            </button>
            <a
              href={`${window.location.origin}/portfolio/${shareSlug}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#FF4D00] text-white font-extrabold text-[13px] hover:bg-[#e64500] transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open
            </a>
          </div>
        }
      >
        <div className="p-5 space-y-4">
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-[12px] font-extrabold text-gray-900">What brands will see</p>
            <p className="text-[12px] text-gray-600 mt-1">
              Featured reels, performance snapshot, collaborations, and optional packages.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Preview URL</p>
            <p className="text-[13px] font-semibold text-gray-900 mt-2 break-all">
              {window.location.origin}/portfolio/{shareSlug}
            </p>
          </div>
          <div className="text-[11px] text-gray-400">
            This is stored locally for now. When APIs are ready, this slug will resolve from the backend.
          </div>
        </div>
      </SideDrawer>
    </div>
  );
};

export default CreatorPortfolio;
