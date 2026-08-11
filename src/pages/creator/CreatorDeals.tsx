import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  X, Upload, Clock, CheckCircle2, AlertCircle, ChevronRight,
  Wallet, Handshake, Package, Calendar, ArrowUpRight, RefreshCw,
  TrendingUp, BarChart2, Eye,
} from 'lucide-react';
import { SideDrawer } from '../../components/creator/ui/SideDrawer';
import { ConfirmModal } from '../../components/creator/ui/ConfirmModal';
import { getPayoutReady } from '../../components/creator/utils/payoutReadiness';

// ─── Types (match API spec) ───────────────────────────────────────────────────

type Tab        = 'offers' | 'active' | 'completed' | 'history';
type CommType   = 'percent_capped' | 'percent_unlimited';
type ReelStatus = 'upload_pending' | 'pending_approval' | 'approved' | 'rejected';
type DealStatus = 'sent' | 'active' | 'submitted' | 'completed' | 'rejected' | 'cancelled' | 'expired';

interface Brand   { name: string; initials: string; color: string; }
interface Product { name: string; price: number; image: string; category: string; }

interface Deal {
  id: number;
  code: string;
  status: DealStatus;
  brand: Brand;
  product: Product;
  commType: CommType;
  commPercent: number;
  commCap?: number;
  windowEnd: Date;
  sentAt?: Date;
  acceptedAt?: Date;
  reelStatus?: ReelStatus;
  rejectReason?: string;
  earned?: number;
  sales?: number;
}

// ─── Mock data (matches API spec — swap for real calls) ───────────────────────

const OFFERS: Deal[] = [
  {
    id: 1, code: 'CAMP-A7X2', status: 'sent',
    brand: { name: 'Libas', initials: 'LB', color: 'bg-rose-500' },
    product: { name: 'Handwoven Silk Kurta Set', price: 2490, category: 'Fashion',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=70' },
    commType: 'percent_capped', commPercent: 18, commCap: 150,
    windowEnd: new Date('2026-04-15'), sentAt: new Date('2026-03-30'),
  },
  {
    id: 2, code: 'CAMP-N8R1', status: 'sent',
    brand: { name: 'Noise', initials: 'NO', color: 'bg-slate-700' },
    product: { name: 'ColorFit Pro 5 Smartwatch', price: 4999, category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=70' },
    commType: 'percent_capped', commPercent: 15, commCap: 200,
    windowEnd: new Date('2026-04-20'), sentAt: new Date('2026-03-29'),
  },
  {
    id: 3, code: 'CAMP-F4T7', status: 'sent',
    brand: { name: 'FabIndia', initials: 'FI', color: 'bg-amber-600' },
    product: { name: 'Organic Cotton Block Print Saree', price: 3200, category: 'Fashion',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=70' },
    commType: 'percent_unlimited', commPercent: 20,
    windowEnd: new Date('2026-04-25'), sentAt: new Date('2026-03-28'),
  },
  {
    id: 4, code: 'CAMP-S2L9', status: 'sent',
    brand: { name: 'SUGAR Cosmetics', initials: 'SG', color: 'bg-pink-600' },
    product: { name: 'Matte Attack Transferproof Lip Color', price: 899, category: 'Beauty',
      image: 'https://images.unsplash.com/photo-1586495777744-4e6232bf0e26?w=600&auto=format&fit=crop&q=70' },
    commType: 'percent_capped', commPercent: 25, commCap: 300,
    windowEnd: new Date('2026-04-30'), sentAt: new Date('2026-03-27'),
  },
];

const ACTIVE: Deal[] = [
  {
    id: 5, code: 'CAMP-B3K9', status: 'active',
    brand: { name: 'boAt', initials: 'bA', color: 'bg-blue-600' },
    product: { name: 'Airdopes 141 True Wireless Earbuds', price: 1299, category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=70' },
    commType: 'percent_capped', commPercent: 22, commCap: 250,
    windowEnd: new Date(Date.now() + 5 * 3_600_000),
    acceptedAt: new Date('2026-03-20'), reelStatus: 'upload_pending',
  },
  {
    id: 6, code: 'CAMP-M9P2', status: 'submitted',
    brand: { name: 'Mamaearth', initials: 'ME', color: 'bg-green-600' },
    product: { name: 'Vitamin C Face Wash with Niacinamide', price: 349, category: 'Skincare',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&auto=format&fit=crop&q=70' },
    commType: 'percent_unlimited', commPercent: 30,
    windowEnd: new Date(Date.now() + 6 * 86_400_000),
    acceptedAt: new Date('2026-03-22'), reelStatus: 'pending_approval',
  },
];

const COMPLETED: Deal[] = [
  {
    id: 7, code: 'CAMP-W5X3', status: 'completed',
    brand: { name: 'W for Woman', initials: 'WW', color: 'bg-purple-600' },
    product: { name: 'Floral Print Midi Dress', price: 1890, category: 'Fashion',
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop&q=70' },
    commType: 'percent_capped', commPercent: 22, commCap: 100,
    windowEnd: new Date('2026-03-15'), earned: 3850, sales: 22,
  },
  {
    id: 8, code: 'CAMP-P2Q8', status: 'completed',
    brand: { name: 'Plum Goodness', initials: 'PG', color: 'bg-violet-600' },
    product: { name: 'Bright Years Niacinamide Serum', price: 595, category: 'Skincare',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=70' },
    commType: 'percent_unlimited', commPercent: 28,
    windowEnd: new Date('2026-03-01'), earned: 2240, sales: 28,
  },
];

const HISTORY: Deal[] = [
  {
    id: 9, code: 'CAMP-Z9X1', status: 'expired',
    brand: { name: 'Zivame', initials: 'ZV', color: 'bg-pink-700' },
    product: { name: 'Sports Bra Collection – Summer', price: 1200, category: 'Fashion',
      image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&auto=format&fit=crop&q=70' },
    commType: 'percent_capped', commPercent: 20, commCap: 150,
    windowEnd: new Date('2026-02-20'), sentAt: new Date('2026-02-10'),
  },
  {
    id: 10, code: 'CAMP-N3M5', status: 'rejected',
    brand: { name: 'Nykaa', initials: 'NK', color: 'bg-red-500' },
    product: { name: 'Luxury Skincare Gift Set', price: 4500, category: 'Beauty',
      image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop&q=70' },
    commType: 'percent_capped', commPercent: 16, commCap: 80,
    windowEnd: new Date('2026-02-28'), sentAt: new Date('2026-02-05'),
    rejectReason: 'Not aligned with our campaign brief',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function perSale(d: Deal) {
  return Math.round((d.commPercent / 100) * d.product.price);
}

function maxEarn(d: Deal) {
  if (d.commType === 'percent_unlimited') return null;
  return perSale(d) * (d.commCap ?? 0);
}

function deadlineLabel(date: Date) {
  const ms  = date.getTime() - Date.now();
  const hrs = Math.ceil(ms / 3_600_000);
  if (ms <= 0)    return { text: 'Expired', hot: true, color: 'text-red-500' };
  if (hrs < 24)   return { text: `${hrs}h left`, hot: true, color: 'text-red-500' };
  const days = Math.ceil(hrs / 24);
  if (days <= 3)  return { text: `${days}d left`, hot: true, color: 'text-primary-500' };
  return            { text: `${days} days left`, hot: false, color: 'text-gray-500' };
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeSince(d?: Date) {
  if (!d) return '';
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

const REEL_STATUS: Record<ReelStatus, { label: string; dot: string; desc: string }> = {
  upload_pending:    { label: 'Upload Pending',    dot: 'bg-primary-400', desc: 'Your reel hasn\'t been submitted yet.' },
  pending_approval:  { label: 'Under Review',      dot: 'bg-blue-400',   desc: 'Merchant is reviewing your reel.' },
  approved:          { label: 'Reel Approved',     dot: 'bg-emerald-400',desc: 'Your reel is live on the product page.' },
  rejected:          { label: 'Revision Needed',   dot: 'bg-red-400',    desc: 'Merchant requested changes. See feedback.' },
};

// ─── Deal Detail Sheet ────────────────────────────────────────────────────────

const DealSheet: React.FC<{
  deal: Deal;
  onClose: () => void;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
}> = ({ deal, onClose, onAccept, onDecline }) => {
  const [imgErr, setImgErr] = useState(false);
  const earn   = perSale(deal);
  const maxE   = maxEarn(deal);
  const dl     = deadlineLabel(deal.windowEnd);
  const rs     = deal.reelStatus ? REEL_STATUS[deal.reelStatus] : null;

  return (
    <SideDrawer
      open
      size="md"
      title="Deal Details"
      subtitle={deal.code}
      onClose={onClose}
      footer={
        (deal.status === 'sent' || deal.status === 'active' || deal.reelStatus === 'upload_pending' || deal.reelStatus === 'rejected') ? (
          <div className="p-4">
            {deal.status === 'sent' && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { onAccept?.(deal.id); onClose(); }}
                  className="flex-1 py-3 rounded-2xl bg-primary-600 text-white font-bold text-[14px] hover:bg-primary-700 transition-colors"
                >
                  Accept Deal
                </button>
                <button
                  type="button"
                  onClick={() => { onDecline?.(deal.id); onClose(); }}
                  className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-[14px] hover:bg-gray-50 transition-colors"
                >
                  Decline
                </button>
              </div>
            )}
            {(deal.reelStatus === 'upload_pending' || deal.reelStatus === 'rejected') && (
              <Link
                to="/creator/upload-reel"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-primary-600 text-white font-bold text-[14px] hover:bg-primary-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {deal.reelStatus === 'rejected' ? 'Re-upload Reel' : 'Upload Reel'}
              </Link>
            )}
          </div>
        ) : null
      }
    >

          {/* Product image */}
          <div className="relative h-48 bg-gray-100 shrink-0">
            {!imgErr ? (
              <img src={deal.product.image} alt={deal.product.name}
                className="w-full h-full object-cover" onError={() => setImgErr(true)} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-3 left-3 text-[10px] font-bold text-white/80 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg uppercase tracking-wide">
              {deal.product.category}
            </span>
          </div>

          <div className="p-5 space-y-5">

            {/* Brand + Product */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-lg ${deal.brand.color} flex items-center justify-center text-white text-[9px] font-black`}>
                  {deal.brand.initials}
                </div>
                <span className="text-[12px] font-semibold text-gray-500">{deal.brand.name}</span>
              </div>
              <h3 className="text-[17px] font-extrabold text-gray-900 leading-snug">{deal.product.name}</h3>
              <p className="text-[13px] text-gray-500 mt-1">Selling Price: <span className="font-bold text-gray-800">₹{deal.product.price.toLocaleString('en-IN')}</span></p>
            </div>

            {/* Commission breakdown */}
            <div className="rounded-2xl bg-primary-50 border border-primary-100 p-4">
              <p className="text-[11px] font-bold text-primary-400 uppercase tracking-widest mb-3">Your Commission</p>
              <div className="flex items-end gap-2">
                <p className="text-[32px] font-extrabold text-gray-900 leading-none tabular-nums">
                  ₹{earn.toLocaleString('en-IN')}
                </p>
                <p className="text-[13px] text-gray-500 mb-1 font-medium">per sale</p>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-500">Commission rate</span>
                  <span className="font-bold text-gray-800">{deal.commPercent}%</span>
                </div>
                {deal.commType === 'percent_capped' && deal.commCap && (
                  <>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-500">Order cap</span>
                      <span className="font-bold text-gray-800">{deal.commCap.toLocaleString('en-IN')} orders</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-500">Max potential</span>
                      <span className="font-extrabold text-primary-600">₹{(maxE ?? 0).toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
                {deal.commType === 'percent_unlimited' && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-500">Order cap</span>
                    <span className="font-bold text-emerald-600">Unlimited 🚀</span>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign window */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Campaign Window</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] text-gray-400 font-semibold">Deadline</p>
                  <p className={`text-[13px] font-extrabold mt-0.5 ${dl.color}`}>{dl.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(deal.windowEnd)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] text-gray-400 font-semibold">Deliverable</p>
                  <p className="text-[13px] font-extrabold text-gray-800 mt-0.5">1 Reel</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Vertical · 15–60 sec</p>
                </div>
              </div>
              {deal.sentAt && (
                <p className="text-[11px] text-gray-400">Offer received {timeSince(deal.sentAt)}</p>
              )}
            </div>

            {/* Reel status (active/submitted) */}
            {rs && (
              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${rs.dot}`} />
                  <span className="text-[12px] font-bold text-gray-900">{rs.label}</span>
                </div>
                <p className="text-[11px] text-gray-500">{rs.desc}</p>
                {deal.rejectReason && (
                  <div className="mt-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-[11px] text-red-700 font-medium">"{deal.rejectReason}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Completed earnings */}
            {deal.status === 'completed' && deal.earned != null && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Final Earnings</p>
                <p className="text-[28px] font-extrabold text-emerald-700 tabular-nums">
                  ₹{deal.earned.toLocaleString('en-IN')}
                </p>
                <p className="text-[12px] text-emerald-600 mt-1">{deal.sales} sales attributed to your reel</p>
              </div>
            )}

            {/* History reason */}
            {(deal.status === 'expired' || deal.status === 'rejected') && (
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                <p className="text-[12px] font-semibold text-gray-600">
                  {deal.status === 'expired'
                    ? 'This offer expired before you responded.'
                    : deal.rejectReason
                      ? `You declined: "${deal.rejectReason}"`
                      : 'You declined this offer.'}
                </p>
              </div>
            )}
          </div>
    </SideDrawer>
  );
};

// ─── Offer Card ───────────────────────────────────────────────────────────────

const OfferCard: React.FC<{
  deal: Deal;
  onSelect: () => void;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ deal, onSelect, onAccept, onDecline }) => {
  const [imgErr, setImgErr] = useState(false);
  const earn = perSale(deal);
  const maxE = maxEarn(deal);
  const dl   = deadlineLabel(deal.windowEnd);

  return (
    <div className="bg-white border border-gray-100/80 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onSelect}>

      {/* Product image */}
      <div className="relative h-[160px] bg-gray-100 shrink-0">
        {!imgErr ? (
          <img src={deal.product.image} alt={deal.product.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Brand pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-xl px-2 py-1">
          <div className={`w-5 h-5 rounded-md ${deal.brand.color} flex items-center justify-center text-white text-[8px] font-black shrink-0`}>
            {deal.brand.initials}
          </div>
          <span className="text-white text-[11px] font-semibold">{deal.brand.name}</span>
        </div>
        {/* Category */}
        <span className="absolute bottom-3 left-3 text-[9px] font-bold text-white/80 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-lg uppercase tracking-wide">
          {deal.product.category}
        </span>
        {/* Code */}
        <span className="absolute top-3 right-3 text-[9px] font-bold text-white/70 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-lg">
          {deal.code}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-2">{deal.product.name}</h3>
          <p className="text-[11px] text-gray-400 mt-1">Product price: ₹{deal.product.price.toLocaleString('en-IN')}</p>
        </div>

        {/* Commission highlight */}
        <div className="rounded-xl bg-primary-50 border border-primary-100 px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-primary-400 uppercase tracking-wide">You earn</p>
            <p className="text-[20px] font-extrabold text-gray-900 tabular-nums leading-tight">
              ₹{earn.toLocaleString('en-IN')}
              <span className="text-[11px] font-semibold text-gray-400 ml-1">/ sale</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-gray-400">{deal.commPercent}% commission</p>
            {deal.commType === 'percent_capped' && deal.commCap ? (
              <p className="text-[10px] text-gray-400">{deal.commCap} orders max</p>
            ) : (
              <p className="text-[10px] font-semibold text-emerald-600">Unlimited</p>
            )}
            {maxE != null && (
              <p className="text-[10px] font-bold text-primary-600">Max ₹{maxE.toLocaleString('en-IN')}</p>
            )}
          </div>
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-between">
          <span className={`flex items-center gap-1 text-[11px] font-semibold ${dl.color}`}>
            {dl.hot && <Clock className="w-3 h-3" />}
            {dl.text}
          </span>
          <span className="text-[10px] text-gray-400">{timeSince(deal.sentAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onAccept}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-[12px] font-bold hover:bg-primary-700 transition-colors">
            Accept
          </button>
          <button type="button" onClick={onDecline}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[12px] font-semibold hover:bg-gray-50 transition-colors">
            Decline
          </button>
          <button type="button" aria-label="View deal details" onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors shrink-0">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Active Campaign Card ─────────────────────────────────────────────────────

const ActiveCard: React.FC<{ deal: Deal; onSelect: () => void }> = ({ deal, onSelect }) => {
  const [imgErr, setImgErr] = useState(false);
  const dl = deadlineLabel(deal.windowEnd);
  const rs = deal.reelStatus ? REEL_STATUS[deal.reelStatus] : null;
  const earn = perSale(deal);

  return (
    <div className="bg-white border border-gray-100/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onSelect}>

      {/* Image + overlay */}
      <div className="relative h-[150px] bg-gray-100">
        {!imgErr ? (
          <img src={deal.product.image} alt={deal.product.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-xl px-2 py-1">
          <div className={`w-5 h-5 rounded-md ${deal.brand.color} flex items-center justify-center text-white text-[8px] font-black shrink-0`}>
            {deal.brand.initials}
          </div>
          <span className="text-white text-[11px] font-semibold">{deal.brand.name}</span>
        </div>
        <span className="absolute top-3 right-3 text-[9px] font-bold text-white/70 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-lg">
          {deal.code}
        </span>

        {/* Bottom: product name + deadline */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-[13px] leading-tight line-clamp-1">{deal.product.name}</h3>
          <span className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${dl.color === 'text-gray-500' ? 'text-gray-300' : dl.color}`}>
            {dl.hot && <AlertCircle className="w-3 h-3" />}
            {dl.text}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">

        {/* Reel status */}
        {rs && (
          <div className="flex items-start gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${rs.dot} ${deal.reelStatus === 'pending_approval' ? 'animate-pulse' : ''}`} />
            <div>
              <p className="text-[12px] font-bold text-gray-900">{rs.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{rs.desc}</p>
            </div>
          </div>
        )}

        {/* Commission row */}
        <div className="flex items-center justify-between py-2 border-t border-gray-50">
          <span className="text-[11px] text-gray-400">Your commission</span>
          <span className="text-[13px] font-extrabold text-gray-900 tabular-nums">
            ₹{earn.toLocaleString('en-IN')} / sale
          </span>
        </div>

        {/* CTA */}
        <div onClick={(e) => e.stopPropagation()}>
          {(deal.reelStatus === 'upload_pending' || deal.reelStatus === 'rejected') ? (
            <Link to="/creator/upload-reel"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary-600 text-white text-[12px] font-bold hover:bg-primary-700 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {deal.reelStatus === 'rejected' ? 'Re-upload Reel' : 'Upload Reel'}
            </Link>
          ) : deal.reelStatus === 'pending_approval' ? (
            <button type="button" disabled
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-50 text-blue-600 text-[12px] font-bold cursor-default">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Awaiting Merchant Review
            </button>
          ) : (
            <button type="button"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-[12px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Reel Approved & Live
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Completed Row ────────────────────────────────────────────────────────────

const CompletedRow: React.FC<{ deal: Deal; onSelect: () => void }> = ({ deal, onSelect }) => {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="bg-white border border-gray-100/80 rounded-2xl flex items-center gap-4 p-4 hover:shadow-sm transition-shadow cursor-pointer group"
      onClick={onSelect}>
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
        {!imgErr ? (
          <img src={deal.product.image} alt={deal.product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className={`w-4 h-4 rounded-md ${deal.brand.color} flex items-center justify-center text-white text-[7px] font-black shrink-0`}>
            {deal.brand.initials}
          </div>
          <span className="text-[10px] font-semibold text-gray-400">{deal.brand.name}</span>
          <span className="text-[9px] text-gray-300">·</span>
          <span className="text-[9px] text-gray-400">{deal.code}</span>
        </div>
        <p className="text-[13px] font-bold text-gray-900 truncate">{deal.product.name}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{deal.sales} sales attributed · {deal.commPercent}% commission</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[18px] font-extrabold text-emerald-600 tabular-nums">₹{(deal.earned ?? 0).toLocaleString('en-IN')}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Earned</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-gray-500 transition-colors" />
    </div>
  );
};

// ─── History Row ──────────────────────────────────────────────────────────────

const HistoryRow: React.FC<{ deal: Deal; onSelect: () => void }> = ({ deal, onSelect }) => {
  const [imgErr, setImgErr] = useState(false);
  const isExpired = deal.status === 'expired';

  return (
    <div className="bg-white border border-gray-100/80 rounded-2xl flex items-center gap-4 p-4 hover:shadow-sm transition-shadow cursor-pointer group opacity-70 hover:opacity-100"
      onClick={onSelect}>
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100 grayscale">
        {!imgErr ? (
          <img src={deal.product.image} alt={deal.product.name}
            className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className={`w-4 h-4 rounded-md ${deal.brand.color} flex items-center justify-center text-white text-[7px] font-black shrink-0`}>
            {deal.brand.initials}
          </div>
          <span className="text-[10px] font-semibold text-gray-400">{deal.brand.name}</span>
        </div>
        <p className="text-[13px] font-bold text-gray-700 truncate">{deal.product.name}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {isExpired ? `Offer expired ${fmtDate(deal.windowEnd)}` : `Declined · ${timeSince(deal.sentAt)}`}
        </p>
      </div>
      <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-xl ${isExpired ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-500'}`}>
        {isExpired ? 'Expired' : 'Declined'}
      </span>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const Empty: React.FC<{ icon: React.ElementType; title: string; sub: string }> = ({ icon: Icon, title, sub }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-gray-300" />
    </div>
    <p className="text-[14px] font-bold text-gray-700">{title}</p>
    <p className="text-[12px] text-gray-400 mt-1 max-w-xs">{sub}</p>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; count?: number }[] = [
  { key: 'offers',    label: 'Offers' },
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'history',   label: 'History' },
];

function readTabFromSearch(search: string): Tab | null {
  const v = new URLSearchParams(search).get('tab');
  if (v === 'offers' || v === 'active' || v === 'completed' || v === 'history') return v;
  return null;
}

function readDealIdFromSearch(search: string): number | null {
  const raw = new URLSearchParams(search).get('dealId');
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

const CreatorDeals: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(() => readTabFromSearch(location.search) ?? 'offers');
  const [offers,      setOffers]      = useState(OFFERS);
  const [active,      setActive]      = useState(ACTIVE);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [sort, setSort] = useState<'payout' | 'deadline' | 'recent'>('recent');
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [showPayoutGate, setShowPayoutGate] = useState(false);

  const dealIdFromUrl = useMemo(() => readDealIdFromSearch(location.search), [location.search]);
  const tabFromUrl = useMemo(() => readTabFromSearch(location.search), [location.search]);

  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const totalEarned = COMPLETED.reduce((s, d) => s + (d.earned ?? 0), 0);

  const allDealsByTab = useMemo(() => {
    return {
      offers,
      active,
      completed: COMPLETED,
      history: HISTORY,
    } satisfies Record<Tab, Deal[]>;
  }, [offers, active]);

  // Deep link: /creator/deals?tab=offers&dealId=123 opens drawer automatically.
  useEffect(() => {
    if (!dealIdFromUrl) return;

    const tabs: Tab[] = ['offers', 'active', 'completed', 'history'];
    let found: { tab: Tab; deal: Deal } | null = null;
    for (const t of tabs) {
      const d = allDealsByTab[t].find((x) => x.id === dealIdFromUrl);
      if (d) {
        found = { tab: t, deal: d };
        break;
      }
    }

    if (!found) return;

    // If URL tab is missing or doesn't match the deal, switch tab for consistent UI.
    if (!tabFromUrl || tabFromUrl !== found.tab) setActiveTab(found.tab);

    // Open drawer if not already open for this deal.
    if (!selectedDeal || selectedDeal.id !== found.deal.id) setSelectedDeal(found.deal);
  }, [dealIdFromUrl, tabFromUrl, allDealsByTab, selectedDeal]);

  const handleAccept = (id: number) => {
    if (!getPayoutReady()) {
      setShowPayoutGate(true);
      return;
    }
    setOffers((prev) => prev.filter((d) => d.id !== id));
  };

  const requestDecline = (id: number) => setDeclineId(id);

  const confirmDecline = () => {
    if (declineId == null) return;
    setOffers((prev) => prev.filter((d) => d.id !== declineId));
    if (selectedDeal?.id === declineId) setSelectedDeal(null);
    clearDealIdFromUrl();
    setDeclineId(null);
  };

  const clearDealIdFromUrl = () => {
    const sp = new URLSearchParams(location.search);
    if (!sp.has('dealId')) return;
    sp.delete('dealId');
    const next = sp.toString();
    navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
  };

  const setTabInUrl = (tab: Tab) => {
    const sp = new URLSearchParams(location.search);
    sp.set('tab', tab);
    const next = sp.toString();
    navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
  };

  const sortedOffers = [...offers].sort((a, b) => {
    if (sort === 'payout')   return perSale(b) - perSale(a);
    if (sort === 'deadline') return a.windowEnd.getTime() - b.windowEnd.getTime();
    return (b.sentAt?.getTime() ?? 0) - (a.sentAt?.getTime() ?? 0);
  });

  const tabCounts: Record<Tab, number> = {
    offers:    offers.length,
    active:    active.length,
    completed: COMPLETED.length,
    history:   HISTORY.length,
  };

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-[24px] font-extrabold text-gray-900 leading-tight">Deals</h1>
        <p className="text-[13px] text-gray-400 mt-0.5 font-medium">Manage brand offers, track campaigns, and view earnings.</p>
      </div>

      {/* ── Stats Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { Icon: Handshake, label: 'Pending Offers',     value: offers.length,      sub: 'awaiting response',    accent: offers.length > 0 },
          { Icon: Package,   label: 'Active Campaigns',   value: active.length,      sub: 'in progress'           },
          { Icon: Wallet,    label: 'Total Earned',        value: `₹${totalEarned.toLocaleString('en-IN')}`, sub: 'all time' },
          { Icon: BarChart2, label: 'Deals Completed',    value: COMPLETED.length,   sub: 'campaigns finished'    },
        ].map(({ Icon, label, value, sub, accent }) => (
          <div key={label} className={`rounded-2xl p-4 flex items-center gap-3 ${accent ? 'bg-primary-600' : 'bg-white border border-gray-100/80'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent ? 'bg-white/20' : 'bg-primary-50'}`}>
              <Icon className={`w-4.5 h-4.5 ${accent ? 'text-white' : 'text-primary-600'}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-[20px] font-extrabold leading-none tabular-nums ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
              <p className={`text-[10px] font-semibold mt-1 truncate ${accent ? 'text-white/70' : 'text-gray-400'}`}>{label}</p>
              <p className={`text-[9px] mt-0.5 ${accent ? 'text-white/40' : 'text-gray-300'}`}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-white border border-gray-100/80 rounded-2xl p-1.5 shadow-sm">
        {TABS.map(({ key, label }) => (
          <button
            type="button"
            key={key}
            onClick={() => setTabInUrl(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[12px] font-bold transition-all ${
              activeTab === key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {label}
            {tabCounts[key] > 0 && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                activeTab === key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tabCounts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Offers Tab ──────────────────────────────────────── */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          {/* Sort bar */}
          {sortedOffers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-400 mr-1">Sort:</span>
              {(['recent', 'payout', 'deadline'] as const).map((s) => (
                <button type="button" key={s} onClick={() => setSort(s)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    sort === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-800'
                  }`}>
                  {s === 'recent' ? 'Recent' : s === 'payout' ? 'Highest Payout' : 'Deadline Soon'}
                </button>
              ))}
            </div>
          )}
          {sortedOffers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedOffers.map((deal) => (
                <OfferCard
                  key={deal.id}
                  deal={deal}
                  onSelect={() => setSelectedDeal(deal)}
                  onAccept={() => handleAccept(deal.id)}
                  onDecline={() => requestDecline(deal.id)}
                />
              ))}
            </div>
          ) : (
            <Empty icon={Handshake} title="You're all caught up!"
              sub="No pending offers right now. New brand deals will appear here." />
          )}
        </div>
      )}

      {/* ── Active Tab ──────────────────────────────────────── */}
      {activeTab === 'active' && (
        <div>
          {active.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {active.map((deal) => (
                <ActiveCard key={deal.id} deal={deal} onSelect={() => setSelectedDeal(deal)} />
              ))}
            </div>
          ) : (
            <Empty icon={Package} title="No active campaigns"
              sub="Accept an offer to start a brand campaign and upload your reel." />
          )}
        </div>
      )}

      {/* ── Completed Tab ───────────────────────────────────── */}
      {activeTab === 'completed' && (
        <div className="space-y-3">
          {COMPLETED.length > 0 ? (
            <>
              {/* Summary banner */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Total Earned</p>
                  <p className="text-[28px] font-extrabold text-emerald-700 tabular-nums">
                    ₹{totalEarned.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-emerald-600">{COMPLETED.length} deals completed</p>
                  <Link to="/creator/earnings" className="mt-1 flex items-center gap-0.5 text-[12px] font-bold text-emerald-700 hover:underline justify-end">
                    View earnings <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              {COMPLETED.map((deal) => (
                <CompletedRow key={deal.id} deal={deal} onSelect={() => setSelectedDeal(deal)} />
              ))}
            </>
          ) : (
            <Empty icon={TrendingUp} title="No completed deals yet"
              sub="Your finished campaigns and earnings will show up here." />
          )}
        </div>
      )}

      {/* ── History Tab ─────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {HISTORY.length > 0 ? (
            HISTORY.map((deal) => (
              <HistoryRow key={deal.id} deal={deal} onSelect={() => setSelectedDeal(deal)} />
            ))
          ) : (
            <Empty icon={Calendar} title="No history yet"
              sub="Declined or expired offers will appear here." />
          )}
        </div>
      )}

      {/* ── Deal Detail Sheet ────────────────────────────────── */}
      {selectedDeal && (
        <DealSheet
          deal={selectedDeal}
          onClose={() => { setSelectedDeal(null); clearDealIdFromUrl(); }}
          onAccept={(id) => { handleAccept(id); clearDealIdFromUrl(); }}
          onDecline={(id) => { requestDecline(id); }}
        />
      )}

      <ConfirmModal
        open={declineId != null}
        tone="danger"
        title="Decline this deal?"
        description="You won’t be able to accept it again if it expires or the brand withdraws it."
        confirmText="Decline"
        cancelText="Cancel"
        onCancel={() => setDeclineId(null)}
        onConfirm={confirmDecline}
      />

      <ConfirmModal
        open={showPayoutGate}
        tone="neutral"
        title="Complete payout setup to accept deals"
        description="Add bank details and complete KYC so we can release your earnings safely."
        confirmText="Go to Payouts"
        cancelText="Not now"
        onCancel={() => setShowPayoutGate(false)}
        onConfirm={() => {
          setShowPayoutGate(false);
          navigate('/creator/payouts');
        }}
      />
    </div>
  );
};

export default CreatorDeals;
