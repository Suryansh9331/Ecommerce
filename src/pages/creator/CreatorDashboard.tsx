import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Handshake,
  Clock,
  Wallet,
  Video,
  ChevronRight,
  Sparkles,
  Calendar,
  TrendingUp,
} from 'lucide-react';

const CreatorDashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Active Deals',
      value: '3',
      sub: 'Campaigns in progress',
      icon: Handshake,
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Pending Approvals',
      value: '1',
      sub: 'Reel awaiting review',
      icon: Clock,
      color: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Earnings (This month)',
      value: '₹2,400',
      sub: 'From 2 completed reels',
      icon: Wallet,
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Reels Uploaded',
      value: '5',
      sub: 'All time',
      icon: Video,
      color: 'from-[#FF4D00] to-[#e64500]',
      bg: 'bg-[#FFF5F0]',
      border: 'border-orange-100',
    },
  ];

  const deadlines = [
    { id: 1, title: 'Submit reel for "Summer Fashion"', campaign: 'Brand X', due: 'Mar 8, 2026', urgent: true },
    { id: 2, title: 'Reel review feedback', campaign: 'Brand Y', due: 'Mar 12, 2026', urgent: false },
  ];

  const quickActions = [
    { label: 'Upload a reel', path: '/creator/upload-reel', icon: Video },
    { label: 'View deals', path: '/creator/deals', icon: Handshake },
    { label: 'Edit portfolio', path: '/creator/portfolio', icon: Sparkles },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Creator'} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here’s what’s happening with your creator account.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4 text-[#FF4D00]" />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`rounded-2xl border ${border} ${bg} p-5 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming deadlines */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FF4D00]" />
              Upcoming deadlines
            </h2>
            <Link
              to="/creator/deals"
              className="text-sm font-medium text-[#FF4D00] hover:underline flex items-center gap-0.5"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {deadlines.length === 0 ? (
              <li className="px-5 py-8 text-center text-gray-500 text-sm">
                No upcoming deadlines. Great job staying on top of things!
              </li>
            ) : (
              deadlines.map(({ id, title, campaign, due, urgent }) => (
                <li key={id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  {urgent && (
                    <span className="flex shrink-0 w-2 h-2 rounded-full bg-amber-500" title="Urgent" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{title}</p>
                    <p className="text-sm text-gray-500">{campaign} · Due {due}</p>
                  </div>
                  <Link
                    to="/creator/upload-reel"
                    className="shrink-0 text-sm font-medium text-[#FF4D00] hover:underline"
                  >
                    Open
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Quick actions + tip */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Quick actions</h2>
            </div>
            <ul className="p-3 space-y-1">
              {quickActions.map(({ label, path, icon: Icon }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#FFF5F0] hover:text-[#FF4D00] transition-colors"
                  >
                    <Icon className="w-4 h-4 text-gray-400" />
                    {label}
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 flex gap-3">
            <TrendingUp className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 text-sm">Tip</p>
              <p className="text-sm text-amber-800/90 mt-0.5">
                Submitting reels before the deadline improves your chances of being picked for more campaigns.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#e64500] p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Your creator journey</h3>
              <p className="text-white/90 text-sm mt-1 max-w-md">
                Track deals, upload reels, and grow your earnings—all from one place.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to="/creator/portfolio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#FF4D00] font-medium text-sm hover:bg-white/90 transition-colors"
            >
              Edit portfolio
            </Link>
            <Link
              to="/creator/earnings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white font-medium text-sm hover:bg-white/30 transition-colors"
            >
              View earnings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
