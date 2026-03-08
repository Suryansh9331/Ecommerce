import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  ChevronRight,
  Handshake,
  Wallet,
  FolderOpen,
  CheckCircle2,
  Mail,
  Banknote,
  Clock,
  Sparkles,
  Upload,
  FileQuestion,
} from 'lucide-react';
import { useCountUp, useCountUpCurrency } from '../../hooks/useCountUp';

// Mock data — replace with API later
const EARNINGS_TREND_DATA = [
  { date: '1 Mar', amount: 0 },
  { date: '3 Mar', amount: 800 },
  { date: '5 Mar', amount: 1200 },
  { date: '7 Mar', amount: 1600 },
  { date: '9 Mar', amount: 2000 },
  { date: '11 Mar', amount: 2200 },
  { date: '13 Mar', amount: 2400 },
];

const PIPELINE = [
  { stage: 'Offers', count: 5, key: 'offers' },
  { stage: 'Accepted', count: 3, key: 'accepted' },
  { stage: 'Pending', count: 1, key: 'pending' },
  { stage: 'Live', count: 2, key: 'live' },
];

const CATEGORY_EARNINGS = [
  { name: 'Fashion', value: 40, color: '#FF4D00' },
  { name: 'Electronics', value: 35, color: '#F97316' },
  { name: 'Beauty', value: 25, color: '#FB923C' },
];

const ACTIVITY_ITEMS = [
  { id: 1, type: 'approval', text: 'Reel approved for Summer Fashion', meta: 'Brand X', time: '2 hours ago', icon: CheckCircle2 },
  { id: 2, type: 'offer', text: 'New offer from Brand Y', meta: 'Electronics campaign', time: '1 day ago', icon: Mail },
  { id: 3, type: 'payout', text: '₹1,200 credited', meta: 'Bank transfer', time: '2 days ago', icon: Banknote },
  { id: 4, type: 'deadline', text: 'Deadline: Submit reel for Winter Collection', meta: 'Brand Z', time: '3 days ago', icon: Clock },
  { id: 5, type: 'approval', text: 'Reel approved for Tech Drop', meta: 'Brand A', time: '5 days ago', icon: CheckCircle2 },
];

const NEXT_DEADLINE = {
  id: 1,
  campaignName: 'Summer Fashion',
  brand: 'Brand X',
  dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  imagePlaceholder: true,
};

const COLORS = ['#FF4D00', '#F97316', '#FB923C', '#FDBA74', '#FED7AA'];

function daysLeft(d: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}

function progressPercent(d: Date, totalDays = 14) {
  const left = daysLeft(d);
  return Math.min(100, Math.max(0, ((totalDays - left) / totalDays) * 100));
}

const CreatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Creator';
  const earningsTotal = 2400;
  const hasDeadline = true;
  const deadline = NEXT_DEADLINE;
  const daysRemaining = deadline ? daysLeft(deadline.dueDate) : 0;
  const progress = deadline ? progressPercent(deadline.dueDate) : 0;

  const earningsDisplay = useCountUpCurrency(earningsTotal, 1400, mounted);
  const offersCount = useCountUp(PIPELINE[0].count, 800, mounted);
  const acceptedCount = useCountUp(PIPELINE[1].count, 800, mounted);
  const pendingCount = useCountUp(PIPELINE[2].count, 800, mounted);
  const liveCount = useCountUp(PIPELINE[3].count, 800, mounted);
  const pipelineCounts = [
    { ...PIPELINE[0], animatedCount: offersCount },
    { ...PIPELINE[1], animatedCount: acceptedCount },
    { ...PIPELINE[2], animatedCount: pendingCount },
    { ...PIPELINE[3], animatedCount: liveCount },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="space-y-1">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="rounded-2xl bg-gray-100 h-36 sm:h-[140px]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-gray-100 h-52" />
          <div className="rounded-2xl bg-gray-100 h-52" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-gray-100 h-56" />
          <div className="rounded-2xl bg-gray-100 h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Welcome strip */}
      <div className="flex flex-wrap items-center gap-3 py-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4D00] to-[#e64500] flex items-center justify-center text-white font-semibold shrink-0">
          {firstName.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hi, {firstName}</h1>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Available
        </span>
      </div>

      {/* 2. Next deadline hero */}
      <section className="rounded-2xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
        {hasDeadline && deadline ? (
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-48 h-36 sm:h-auto sm:min-h-[140px] bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center shrink-0">
              <Sparkles className="w-12 h-12 text-[#FF4D00]/40" />
            </div>
            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-[#FF4D00]">{deadline.brand}</p>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5">{deadline.campaignName}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Due in <span className="font-semibold text-gray-700">{daysRemaining} days</span>
                {' · '}
                {deadline.dueDate.toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </p>
              <div className="mt-3">
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#FF4D00] transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <Link
                to="/creator/upload-reel"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF4D00] text-white font-medium text-sm hover:bg-[#e64500] transition-colors w-fit"
              >
                <Upload className="w-4 h-4" />
                Upload Reel
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">No upcoming deadlines</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Accept a deal to get a campaign and upload your reel.</p>
            <Link
              to="/creator/deals"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF4D00] text-white font-medium text-sm hover:bg-[#e64500]"
            >
              View Deals
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* 3. Earnings trend + Campaign pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3a. Earnings trend */}
        <section className="rounded-2xl bg-white border border-gray-200/80 shadow-sm overflow-hidden p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#FF4D00]" />
              Earnings this month
            </h2>
            <Link to="/creator/earnings" className="text-sm font-medium text-[#FF4D00] hover:underline flex items-center gap-0.5">
              View
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {earningsTotal > 0 ? (
            <>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{earningsDisplay}</p>
              <div className="h-32 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={EARNINGS_TREND_DATA} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF4D00" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#FF4D00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                    <YAxis hide domain={[0, 'auto']} />
                    <RechartsTooltip
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Earnings']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#FF4D00" strokeWidth={2} fill="url(#earningsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">No earnings yet</p>
              <Link to="/creator/deals" className="mt-2 inline-block text-sm font-medium text-[#FF4D00] hover:underline">
                Accept a deal to start earning
              </Link>
            </div>
          )}
        </section>

        {/* 3b. Campaign pipeline */}
        <section className="rounded-2xl bg-white border border-gray-200/80 shadow-sm overflow-hidden p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-[#FF4D00]" />
              Campaign pipeline
            </h2>
            <Link to="/creator/deals" className="text-sm font-medium text-[#FF4D00] hover:underline flex items-center gap-0.5">
              View Deals
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {pipelineCounts.map(({ stage, animatedCount, key }, i) => (
              <React.Fragment key={key}>
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                  <span className="text-lg font-bold text-gray-900 tabular-nums">{animatedCount}</span>
                  <span className="text-xs text-gray-500 mt-0.5 truncate w-full">{stage}</span>
                </div>
                {i < pipelineCounts.length - 1 && (
                  <div className="w-4 sm:w-6 shrink-0 flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-4 h-2 rounded-full bg-gray-100 flex overflow-hidden">
            {PIPELINE.map((p, idx) => (
              <div
                key={p.key}
                className="h-full transition-all duration-700"
                style={{
                  width: `${(p.count / PIPELINE.reduce((s, x) => s + x.count, 0)) * 100}%`,
                  backgroundColor: COLORS[idx % COLORS.length],
                }}
              />
            ))}
          </div>
        </section>
      </div>

      {/* 4. Earnings by category + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4a. Earnings by category */}
        <section className="rounded-2xl bg-white border border-gray-200/80 shadow-sm overflow-hidden p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#FF4D00]" />
              Earnings by category
            </h2>
            <Link to="/creator/categories" className="text-sm font-medium text-[#FF4D00] hover:underline flex items-center gap-0.5">
              My Categories
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {CATEGORY_EARNINGS.some((c) => c.value > 0) ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-36 h-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={CATEGORY_EARNINGS}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={58}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {CATEGORY_EARNINGS.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => [`${value}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-1.5">
                {CATEGORY_EARNINGS.map((c) => (
                  <li key={c.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-gray-700">{c.name}</span>
                    <span className="font-medium text-gray-900 ml-auto">{c.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">Complete a deal to see breakdown</p>
              <Link to="/creator/deals" className="mt-2 inline-block text-sm font-medium text-[#FF4D00] hover:underline">
                View Deals
              </Link>
            </div>
          )}
        </section>

        {/* 4b. Recent activity */}
        <section className="rounded-2xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent activity</h2>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>
          <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {ACTIVITY_ITEMS.map((item) => (
              <li key={item.id} className="px-5 py-3 flex gap-3 hover:bg-gray-50/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#FFF5F0] flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-[#FF4D00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.text}</p>
                  <p className="text-xs text-gray-500">{item.meta} · {item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 5. Quick actions strip */}
      <section className="flex flex-wrap items-center gap-2 pt-2">
        <Link
          to="/creator/upload-reel"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF4D00] text-white font-medium text-sm hover:bg-[#e64500] transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Reel
        </Link>
        <Link
          to="/creator/deals"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          <Handshake className="w-4 h-4" />
          View offers
        </Link>
        <Link
          to="/creator/earnings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          <Wallet className="w-4 h-4" />
          Earnings
        </Link>
      </section>
    </div>
  );
};

export default CreatorDashboard;
