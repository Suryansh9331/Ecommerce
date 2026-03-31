import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import {
  Upload, CheckCircle2, Mail, Banknote, Clock, AlertCircle,
  ChevronRight, TrendingUp, X, ArrowUpRight, Zap,
} from 'lucide-react';
import { useCountUpCurrency, useCountUp } from '../../hooks/useCountUp';

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = 'upload_pending' | 'uploaded' | 'approved' | 'live' | 'rejected';
type AlertKind     = 'deadline' | 'offer' | 'approved' | 'rejected';
type ActivityKind  = 'approved' | 'offer' | 'payout' | 'deadline';

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = {
  earnings:       6800,
  pendingPayout:  1400,
  activeCampaigns: 2,
  pendingOffers:   4,
  reelsLive:       11,
};

const ALERT = {
  kind: 'deadline' as AlertKind,
  text: 'Monsoon Edit reel is due in 5 hours — don\'t miss the deadline',
  cta:     'Upload now',
  ctaPath: '/creator/upload-reel',
};

interface Campaign {
  id: number; brand: string; brandInitials: string; brandColor: string;
  name: string; status: CampaignStatus; dueDate: Date;
  payout: number; image: string;
}

interface Offer {
  id: number; brand: string; brandInitials: string; brandColor: string;
  campaign: string; payout: number; dueDate: Date; image: string; category: string;
}

interface ActivityItem {
  id: number; kind: ActivityKind; text: string; meta: string; time: string;
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 1, brand: 'Libas', brandInitials: 'LB', brandColor: 'bg-rose-500',
    name: 'Monsoon Edit \'26', status: 'upload_pending',
    dueDate: new Date(Date.now() + 5 * 60 * 60 * 1000), payout: 2500,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=70',
  },
  {
    id: 2, brand: 'boAt', brandInitials: 'bA', brandColor: 'bg-blue-600',
    name: 'Pro Series Drop', status: 'uploaded',
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), payout: 3200,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=70',
  },
];

const OFFERS: Offer[] = [
  {
    id: 1, brand: 'Mamaearth', brandInitials: 'ME', brandColor: 'bg-green-600',
    campaign: 'Glow Up Summer', payout: 2200,
    dueDate: new Date('2026-04-12'), category: 'Beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&auto=format&fit=crop&q=70',
  },
  {
    id: 2, brand: 'Noise', brandInitials: 'NO', brandColor: 'bg-slate-700',
    campaign: 'Game On Season 2', payout: 3500,
    dueDate: new Date('2026-04-18'), category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f3?w=400&auto=format&fit=crop&q=70',
  },
  {
    id: 3, brand: 'FabIndia', brandInitials: 'FI', brandColor: 'bg-amber-600',
    campaign: 'Desi Fusion Edit', payout: 2800,
    dueDate: new Date('2026-04-22'), category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=70',
  },
  {
    id: 4, brand: 'Yoga Bar', brandInitials: 'YB', brandColor: 'bg-teal-600',
    campaign: 'Fuel Your Day', payout: 1600,
    dueDate: new Date('2026-04-28'), category: 'Health',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&auto=format&fit=crop&q=70',
  },
];

const EARNINGS_TREND = [
  { d: '1M', v: 0 }, { d: '5M', v: 1200 }, { d: '9M', v: 2400 },
  { d: '13M', v: 3100 }, { d: '17M', v: 4200 }, { d: '21M', v: 5500 },
  { d: '25M', v: 6200 }, { d: '29M', v: 6800 },
];

const ACTIVITY: ActivityItem[] = [
  { id: 1, kind: 'approved', text: 'Reel approved — Pro Series Drop',    meta: 'boAt · ₹3,200 releasing', time: '1h ago' },
  { id: 2, kind: 'offer',    text: 'New offer from FabIndia',             meta: '₹2,800 · Fashion',         time: '3h ago' },
  { id: 3, kind: 'payout',   text: '₹2,500 credited to your account',    meta: 'HDFC Bank ••••4821',        time: 'Yesterday' },
  { id: 4, kind: 'deadline', text: 'Monsoon Edit deadline in 5 hours',   meta: 'Libas · Upload pending',    time: '2h ago' },
  { id: 5, kind: 'approved', text: 'Reel approved — Summer Wardrobe',    meta: 'W for Woman',               time: '3 days ago' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deadline(date: Date) {
  const ms   = date.getTime() - Date.now();
  const hrs  = Math.ceil(ms / 3_600_000);
  if (hrs <= 0)  return { label: 'Overdue',         hot: true };
  if (hrs < 24)  return { label: `${hrs}h left`,    hot: true };
  const days = Math.ceil(hrs / 24);
  return       { label: `${days}d left`,            hot: days <= 2 };
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const STATUS_META: Record<CampaignStatus, { label: string; ring: string; dot: string }> = {
  upload_pending: { label: 'Upload Pending', ring: 'bg-orange-500/15 text-orange-400 ring-orange-500/30', dot: 'bg-orange-400' },
  uploaded:       { label: 'Under Review',  ring: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',       dot: 'bg-blue-400'   },
  approved:       { label: 'Approved',      ring: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30', dot: 'bg-emerald-400' },
  live:           { label: 'Live 🔴',       ring: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30', dot: 'bg-emerald-400' },
  rejected:       { label: 'Needs Revision',ring: 'bg-red-500/15 text-red-400 ring-red-500/30',          dot: 'bg-red-400'    },
};

const ALERT_STYLE: Record<AlertKind, { wrap: string; icon: string; text: string; btn: string }> = {
  deadline: { wrap: 'bg-red-50 border-red-200',        icon: 'text-red-500',     text: 'text-red-800',     btn: 'bg-red-100 text-red-700 hover:bg-red-200' },
  offer:    { wrap: 'bg-blue-50 border-blue-200',       icon: 'text-blue-500',    text: 'text-blue-800',    btn: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  approved: { wrap: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600', text: 'text-emerald-800', btn: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  rejected: { wrap: 'bg-red-50 border-red-200',         icon: 'text-red-500',     text: 'text-red-800',     btn: 'bg-red-100 text-red-700 hover:bg-red-200' },
};

const ACTIVITY_STYLE: Record<ActivityKind, { Icon: React.ElementType; bg: string; ic: string }> = {
  approved: { Icon: CheckCircle2, bg: 'bg-emerald-50', ic: 'text-emerald-600' },
  offer:    { Icon: Mail,         bg: 'bg-blue-50',    ic: 'text-blue-600'    },
  payout:   { Icon: Banknote,     bg: 'bg-emerald-50', ic: 'text-emerald-600' },
  deadline: { Icon: Clock,        bg: 'bg-orange-50',  ic: 'text-orange-600'  },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const Stat: React.FC<{
  label: string; value: string | number; sub?: string;
  Icon: React.ElementType; accent?: boolean;
}> = ({ label, value, sub, Icon, accent }) => (
  <div className={`rounded-2xl p-4 flex flex-col gap-3 ${accent ? 'bg-[#FF4D00]' : 'bg-white border border-gray-100/80'}`}>
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? 'bg-white/20' : 'bg-[#fff3ee]'}`}>
      <Icon className={`w-4 h-4 ${accent ? 'text-white' : 'text-[#FF4D00]'}`} />
    </div>
    <div>
      <p className={`text-[22px] font-extrabold tabular-nums leading-none ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-[11px] font-medium mt-1.5 leading-none ${accent ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
      {sub && <p className={`text-[10px] mt-1 ${accent ? 'text-white/45' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  </div>
);

// ─── Campaign Card ────────────────────────────────────────────────────────────

const CampaignCard: React.FC<{ c: Campaign }> = ({ c }) => {
  const due    = deadline(c.dueDate);
  const status = STATUS_META[c.status];
  const isPending = c.status === 'upload_pending';
  const isRejected = c.status === 'rejected';
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="relative rounded-2xl overflow-hidden shrink-0 w-[270px] shadow-sm">
      {/* Image */}
      <div className="relative h-[200px] bg-gray-200">
        {!imgErr ? (
          <img
            src={c.image}
            alt={c.name}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <span className="text-4xl font-black text-white/40">{c.brand[0]}</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Top row: brand pill + status */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-xl px-2 py-1">
            <div className={`w-5 h-5 rounded-md ${c.brandColor} flex items-center justify-center text-white text-[9px] font-black leading-none shrink-0`}>
              {c.brandInitials}
            </div>
            <span className="text-white text-[11px] font-semibold">{c.brand}</span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold ring-1 backdrop-blur-md ${status.ring}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Bottom text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <h3 className="text-white font-bold text-[15px] leading-tight">{c.name}</h3>
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-[12px] font-semibold flex items-center gap-1 ${due.hot ? 'text-red-300' : 'text-gray-300'}`}>
              {due.hot && <AlertCircle className="w-3 h-3" />}
              {due.label}
            </span>
            <span className="text-white font-extrabold text-[13px]">₹{c.payout.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-white px-3.5 pt-3 pb-3.5">
        {isPending || isRejected ? (
          <Link
            to="/creator/upload-reel"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#FF4D00] text-white text-[13px] font-bold hover:bg-[#e64500] transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {isRejected ? 'Re-upload Reel' : 'Upload Reel'}
          </Link>
        ) : (
          <Link
            to="/creator/deals"
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-gray-50 text-gray-700 text-[13px] font-semibold hover:bg-gray-100 transition-colors border border-gray-200"
          >
            View Status
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

// ─── Offer Card ───────────────────────────────────────────────────────────────

const OfferCard: React.FC<{ o: Offer; onAccept: (id: number) => void; onDecline: (id: number) => void }> = ({ o, onAccept, onDecline }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="bg-white border border-gray-100/80 rounded-2xl overflow-hidden shrink-0 w-[200px] shadow-sm flex flex-col">
      {/* Offer image */}
      <div className="relative h-[110px] bg-gray-100 shrink-0">
        {!imgErr ? (
          <img
            src={o.image}
            alt={o.campaign}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="absolute bottom-2 left-2 text-[9px] font-bold text-white/80 uppercase tracking-wide bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded-lg">
          {o.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        {/* Brand */}
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-md ${o.brandColor} flex items-center justify-center text-white text-[8px] font-black shrink-0`}>
            {o.brandInitials}
          </div>
          <span className="text-[11px] font-semibold text-gray-500">{o.brand}</span>
          <Link
            to={`/creator/deals?tab=offers&dealId=${o.id}`}
            className="ml-auto text-[10px] font-bold text-[#FF4D00] hover:underline"
          >
            View
          </Link>
        </div>

        {/* Campaign name */}
        <p className="text-[13px] font-bold text-gray-900 mt-1.5 leading-tight line-clamp-2">{o.campaign}</p>

        {/* Payout */}
        <div className="mt-2">
          <p className="text-[20px] font-extrabold text-gray-900 leading-none tabular-nums">
            ₹{o.payout.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">per reel · Due {fmtDate(o.dueDate)}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 mt-3">
          <button
            type="button"
            onClick={() => onAccept(o.id)}
            className="flex-1 py-2 rounded-xl bg-[#FF4D00] text-white text-[11px] font-bold hover:bg-[#e64500] transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            aria-label="Decline offer"
            onClick={() => onDecline(o.id)}
            className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CreatorDashboard: React.FC = () => {
  const { user }  = useAuth();
  const [mounted,          setMounted]          = useState(false);
  const [alertDismissed,   setAlertDismissed]   = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [offers,           setOffers]           = useState(OFFERS);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const firstName     = user?.name?.split(' ')[0] || 'Creator';
  const earningsFmt   = useCountUpCurrency(STATS.earnings, 1400, mounted);
  const pendingFmt    = useCountUpCurrency(STATS.pendingPayout, 900, mounted);
  const activeCnt     = useCountUp(STATS.activeCampaigns, 700, mounted);
  const offersCnt     = useCountUp(STATS.pendingOffers, 700, mounted);
  const reelsCnt      = useCountUp(STATS.reelsLive, 900, mounted);

  const hour      = new Date().getHours();
  const greet     = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const alertCfg  = ALERT_STYLE[ALERT.kind];

  const handleAccept  = (id: number) => setOffers((prev) => prev.filter((o) => o.id !== id));
  const handleDecline = (id: number) => setOffers((prev) => prev.filter((o) => o.id !== id));

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-9 w-56 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="h-12 bg-gray-200 rounded-2xl" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(2)].map((_, i) => <div key={i} className="h-64 w-64 bg-gray-200 rounded-2xl shrink-0" />)}
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => <div key={i} className="h-72 w-48 bg-gray-200 rounded-2xl shrink-0" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-52 bg-gray-200 rounded-2xl" />
          <div className="h-52 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">

      {/* ── Greeting ────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold text-gray-900 leading-tight">
            {greet}, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {/* Earnings callout */}
        <div className="hidden sm:flex flex-col items-end">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Earned this month</p>
          <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{earningsFmt}</p>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat accent label="Earned this month" value={earningsFmt} sub={`${pendingFmt} pending`} Icon={Zap} />
        <Stat label="Active Campaigns"  value={activeCnt}  Icon={Upload} />
        <Stat label="Pending Offers"    value={offersCnt}  sub="Tap to review" Icon={Mail} />
        <Stat label="Reels Live"        value={reelsCnt}   Icon={TrendingUp} />
      </div>

      {/* ── Alert Banner ────────────────────────────────────── */}
      {!alertDismissed && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${alertCfg.wrap}`}>
          <AlertCircle className={`w-4 h-4 shrink-0 ${alertCfg.icon}`} />
          <p className={`flex-1 text-[13px] font-semibold ${alertCfg.text}`}>{ALERT.text}</p>
          <Link
            to={ALERT.ctaPath}
            className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap ${alertCfg.btn}`}
          >
            {ALERT.cta}
          </Link>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setAlertDismissed(true)}
            className={`shrink-0 opacity-50 hover:opacity-100 transition-opacity ${alertCfg.icon}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Next Actions ────────────────────────────────────── */}
      <section className="bg-white border border-gray-100/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Next up</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Quick actions to keep you on track</p>
          </div>
          <Link to="/creator/deals?tab=offers" className="flex items-center gap-1 text-[12px] font-bold text-[#FF4D00] hover:underline shrink-0">
            View deals <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/creator/deals?tab=offers"
            className="rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
          >
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Offers</p>
            <p className="text-[14px] font-extrabold text-gray-900 mt-1">Review pending offers</p>
            <p className="text-[12px] text-gray-400 mt-1">Accept the best deals before they expire.</p>
          </Link>

          <Link
            to="/creator/upload-reel?campaignId=1"
            className="rounded-2xl border border-orange-100 bg-[#fff8f5] p-4 hover:shadow-sm transition-shadow"
          >
            <p className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">Deliverable</p>
            <p className="text-[14px] font-extrabold text-gray-900 mt-1">Upload your next reel</p>
            <p className="text-[12px] text-gray-500 mt-1">Submit before deadline to avoid missing payout.</p>
          </Link>
        </div>
      </section>

      {/* ── Active Campaigns ────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Active Campaigns</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Your current brand deals</p>
          </div>
          <Link to="/creator/deals?tab=active" className="flex items-center gap-1 text-[12px] font-bold text-[#FF4D00] hover:underline">
            All deals <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {CAMPAIGNS.length > 0 ? (
          <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-0.5 px-0.5 snap-x scroll-smooth">
            {CAMPAIGNS.map((c) => (
              <div key={c.id} className="snap-start">
                <CampaignCard c={c} />
              </div>
            ))}
            {/* View all filler card */}
            <Link
              to="/creator/deals?tab=active"
              className="shrink-0 w-[100px] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#FF4D00] hover:border-[#FF4D00]/40 transition-colors snap-start"
            >
              <ChevronRight className="w-5 h-5" />
              <span className="text-[11px] font-semibold text-center leading-tight px-2">View All</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <p className="text-sm text-gray-500 font-medium">No active campaigns.</p>
            <Link to="/creator/deals?tab=offers" className="mt-2 inline-block text-sm font-bold text-[#FF4D00] hover:underline">
              Browse offers →
            </Link>
          </div>
        )}
      </section>

      {/* ── Pending Offers ──────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
              Pending Offers
              {offers.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#FF4D00] text-white text-[9px] font-black leading-none">
                  {offers.length}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Brands waiting for your response</p>
          </div>
          <Link to="/creator/deals?tab=offers" className="flex items-center gap-1 text-[12px] font-bold text-[#FF4D00] hover:underline">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {offers.length > 0 ? (
          <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-0.5 px-0.5 snap-x scroll-smooth">
            {offers.map((o) => (
              <div key={o.id} className="snap-start">
                <OfferCard o={o} onAccept={handleAccept} onDecline={handleDecline} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-400 font-medium">No pending offers right now.</p>
          </div>
        )}
      </section>

      {/* ── Earnings + Activity ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Earnings chart — wider */}
        <section className="lg:col-span-3 bg-white border border-gray-100/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-[14px] font-bold text-gray-900">Earnings this month</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{pendingFmt} pending release</p>
            </div>
            <Link to="/creator/earnings" className="flex items-center gap-0.5 text-[12px] font-bold text-[#FF4D00] hover:underline">
              Details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-[32px] font-extrabold text-gray-900 tabular-nums mt-3 leading-none">{earningsFmt}</p>
          <div className="h-32 mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={EARNINGS_TREND} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#FF4D00" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FF4D00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{ fontSize: 9, fill: '#9ca3af' }} stroke="transparent" />
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} stroke="transparent" />
                <RechartsTooltip
                  formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Earned']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, padding: '6px 10px' }}
                />
                <Area
                  type="monotone" dataKey="v"
                  stroke="#FF4D00" strokeWidth={2}
                  fill="url(#eg)" dot={false}
                  activeDot={{ r: 4, fill: '#FF4D00', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Activity feed */}
        <section className="lg:col-span-2 bg-white border border-gray-100/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between shrink-0">
            <h2 className="text-[14px] font-bold text-gray-900">Recent Activity</h2>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Last 7 days</span>
          </div>
          <ul className="divide-y divide-gray-50 overflow-y-auto flex-1">
            {ACTIVITY.map((item) => {
              const s = ACTIVITY_STYLE[item.kind];
              return (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${s.bg}`}>
                    <s.Icon className={`w-4 h-4 ${s.ic}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-900 leading-tight">{item.text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.meta}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5 shrink-0">{item.time}</span>
                </li>
              );
            })}
          </ul>
        </section>

      </div>
    </div>
  );
};

export default CreatorDashboard;
