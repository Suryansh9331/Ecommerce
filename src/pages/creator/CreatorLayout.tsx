import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderOpen,
  Briefcase,
  Handshake,
  Video,
  Wallet,
  Film,
  Bell,
  Landmark,
  Settings,
  Menu,
  X,
  LogOut,
  Zap,
  ExternalLink,
  Star,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const NAV_MAIN: NavItem[] = [
  { path: '/creator/dashboard', label: 'Home', icon: LayoutDashboard },
];

const NAV_CONTENT: NavItem[] = [
  { path: '/creator/deals',       label: 'Deals',       icon: Handshake },
  { path: '/creator/upload-reel', label: 'Upload Reel', icon: Video },
  { path: '/creator/categories',  label: 'Categories',  icon: FolderOpen },
  { path: '/creator/portfolio',   label: 'Portfolio',   icon: Briefcase },
];

const NAV_MANAGE: NavItem[] = [
  { path: '/creator/reels', label: 'My Reels', icon: Film },
];

const NAV_FINANCE: NavItem[] = [
  { path: '/creator/earnings', label: 'Earnings', icon: Wallet },
  { path: '/creator/payouts',  label: 'Payouts',  icon: Landmark },
];

const NAV_BOTTOM: NavItem[] = [
  { path: '/creator/notifications', label: 'Notifications', icon: Bell },
  { path: '/creator/settings', label: 'Settings', icon: Settings },
];

interface SidebarContentProps {
  user: { name?: string; email?: string; role?: string } | null;
  pathname: string;
  available: boolean;
  badges?: Partial<Record<string, number>>;
  onToggleAvailable: () => void;
  onLogout: () => void;
  onClose?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  user,
  pathname,
  available,
  badges,
  onToggleAvailable,
  onLogout,
  onClose,
}) => {
  const name  = user?.name  || 'Creator';
  const email = user?.email || '';
  const initial = name.charAt(0).toUpperCase();

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const active = pathname === item.path;
    const badge = item.badge ?? badges?.[item.path];
    return (
      <Link
        to={item.path}
        onClick={onClose}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
          active
            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
            : 'text-[#8b8fa8] hover:bg-white/6 hover:text-white'
        }`}
      >
        <item.icon
          className="w-[17px] h-[17px] shrink-0"
          strokeWidth={active ? 2.5 : 1.8}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {badge != null && badge > 0 && !active && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const NavGroup: React.FC<{ label: string; items: NavItem[] }> = ({ label, items }) => (
    <div>
      <p className="px-3 mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#3d3f52]">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => <NavLink key={item.path} item={item} />)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0d0d14]">

      {/* ── Brand ── */}
      <div className="px-5 pt-6 pb-5 shrink-0">
        <Link
          to="/creator/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-600/30 shrink-0">
            <Zap className="w-[15px] h-[15px] text-white fill-white" />
          </div>
          <div>
            <p className="text-[13px] font-extrabold text-white leading-none tracking-wide">AOIN</p>
            <p className="text-[9px] text-[#3d3f52] mt-[3px] leading-none tracking-[0.2em] uppercase font-semibold">
              Creator Studio
            </p>
          </div>
        </Link>
      </div>

      {/* ── Creator Profile ── */}
      <div className="mx-3 mb-5 rounded-2xl overflow-hidden shrink-0 bg-[#161622] border border-[#1f2030]">
        <div className="p-3.5">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-primary-600 to-primary-300 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-primary-600/20">
                {initial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#161622] flex items-center justify-center bg-[#0d0d14]">
                <span className={`w-2 h-2 rounded-full ${available ? 'bg-emerald-400' : 'bg-gray-600'}`} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white truncate leading-tight">{name}</p>
              <p className="text-[10px] text-[#5a5d7a] truncate mt-0.5">{email}</p>
            </div>
          </div>

          {/* Creator tier */}
          <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1e1e2e]">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
            <span className="text-[11px] font-semibold text-amber-400">Rising Creator</span>
            <span className="ml-auto text-[10px] text-[#5a5d7a]">8 reels · 5 deals</span>
          </div>

          {/* Availability toggle */}
          <button
            type="button"
            onClick={onToggleAvailable}
            className={`mt-2 w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
              available
                ? 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/15'
                : 'bg-[#1a1a25] text-[#5a5d7a] hover:bg-white/5'
            }`}
          >
            <span>{available ? 'Open for brand deals' : 'Not available'}</span>
            <span className={`text-[9px] font-extrabold uppercase tracking-widest ${available ? 'text-emerald-500' : 'text-[#3d3f52]'}`}>
              {available ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto min-h-0">
        <div className="space-y-0.5">
          {NAV_MAIN.map((item) => <NavLink key={item.path} item={item} />)}
        </div>
        <NavGroup label="Content" items={NAV_CONTENT} />
        <NavGroup label="Manage" items={NAV_MANAGE} />
        <NavGroup label="Finance" items={NAV_FINANCE} />
      </nav>

      {/* ── Bottom ── */}
      <div className="px-3 pt-3 pb-5 shrink-0 space-y-0.5 border-t border-[#1a1a25]">
        {NAV_BOTTOM.map((item) => <NavLink key={item.path} item={item} />)}
        <Link
          to="/"
          target="_blank"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#3d3f52] hover:text-[#8b8fa8] hover:bg-white/4 transition-colors"
        >
          <ExternalLink className="w-[17px] h-[17px] shrink-0" strokeWidth={1.8} />
          Visit Store
        </Link>
        <button
          type="button"
          onClick={() => { onClose?.(); onLogout(); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#3d3f52] hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-[17px] h-[17px] shrink-0" strokeWidth={1.8} />
          Log out
        </button>
      </div>
    </div>
  );
};

const CreatorLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [available, setAvailable]   = useState(true);
  // Phase 2: mock badge counts. Replace with API-driven counts later.
  const [pendingOffersCount] = useState<number>(3);
  const [unreadNotificationsCount] = useState<number>(2);

  if (!isAuthenticated || user?.role !== 'creator') {
    return <Navigate to="/creator/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/creator/login', { replace: true });
  };

  const sidebarProps: SidebarContentProps = {
    user,
    pathname: location.pathname,
    available,
    badges: {
      '/creator/deals': pendingOffersCount,
      '/creator/notifications': unreadNotificationsCount,
    },
    onToggleAvailable: () => setAvailable((v) => !v),
    onLogout: handleLogout,
  };

  return (
    <div className="min-h-screen flex bg-[#F4F5F7]">

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[270px] shrink-0">
        <div className="fixed top-0 left-0 w-[270px] h-full">
          <SidebarContent {...sidebarProps} />
        </div>
      </aside>

      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] transition-transform duration-200 ease-out lg:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent {...sidebarProps} onClose={() => setDrawerOpen(false)} />
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="absolute top-[22px] right-3 p-1 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-[#0d0d14]">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg text-[#5a5d7a] hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-[13px] font-extrabold text-white tracking-wide">AOIN Creator</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreatorLayout;
