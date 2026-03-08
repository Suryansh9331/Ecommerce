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
  Settings,
  Menu,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { path: '/creator/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/creator/categories', label: 'My Categories', icon: FolderOpen },
  { path: '/creator/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/creator/deals', label: 'Deals', icon: Handshake },
  { path: '/creator/upload-reel', label: 'Upload Reel', icon: Video },
  { path: '/creator/earnings', label: 'Earnings', icon: Wallet },
  { path: '/creator/settings', label: 'Settings', icon: Settings },
];

const CreatorLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isCreator = user?.role === 'creator';
  if (!isAuthenticated || !isCreator) {
    return <Navigate to="/creator/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/creator/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50/80 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200/80 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <Link to="/creator/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF4D00] to-[#e64500] flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Creator Studio</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#FFF5F0] text-[#FF4D00]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <Link to="/creator/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF4D00] to-[#e64500] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Creator Studio</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? 'bg-[#FFF5F0] text-[#FF4D00]' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <button
            onClick={() => { setSidebarOpen(false); handleLogout(); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 h-14 px-4 lg:px-8 bg-white/90 backdrop-blur border-b border-gray-200/80">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:inline">Hey,</span>
            <span className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[180px]">
              {user?.name || 'Creator'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CreatorLayout;
