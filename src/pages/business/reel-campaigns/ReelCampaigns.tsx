import React, { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ReelCampaignsProvider } from './state/ReelCampaignsStore';

type SubPageKey = 'campaigns' | 'creators' | 'submissions' | 'sales' | 'payouts';

const SUBPAGES: Array<{ key: SubPageKey; label: string; subtitle: string; path: string }> = [
  { key: 'campaigns', label: 'Campaigns', subtitle: 'Create and manage deals', path: '/business/reel-campaigns/campaigns' },
  { key: 'creators', label: 'Creators', subtitle: 'Discover and shortlist creators', path: '/business/reel-campaigns/creators' },
  { key: 'submissions', label: 'Submissions', subtitle: 'Approve or request revisions', path: '/business/reel-campaigns/submissions' },
  { key: 'sales', label: 'Attribution & Sales', subtitle: 'Track campaign performance', path: '/business/reel-campaigns/sales' },
  { key: 'payouts', label: 'Commissions & Payouts', subtitle: 'Settlement summaries (mock)', path: '/business/reel-campaigns/payouts' },
];

function readSubPage(pathname: string): SubPageKey | null {
  const m = pathname.match(/\/business\/reel-campaigns\/(campaigns|creators|submissions|sales|payouts)(\/|$)/);
  const key = m?.[1];
  if (key === 'campaigns' || key === 'creators' || key === 'submissions' || key === 'sales' || key === 'payouts') return key;
  return null;
}

const ReelCampaigns: React.FC = () => {
  const location = useLocation();

  const activeKey = useMemo(() => readSubPage(location.pathname), [location.pathname]);
  const activeMeta = SUBPAGES.find((x) => x.key === (activeKey ?? 'campaigns')) ?? SUBPAGES[0];

  return (
    <ReelCampaignsProvider>
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Reel Campaigns</h1>
            <p className="text-sm text-gray-500 mt-1">{activeMeta.subtitle}</p>
          </div>
        </div>

        {activeKey == null ? <Navigate to="/business/reel-campaigns/campaigns" replace /> : <Outlet />}
      </div>
    </ReelCampaignsProvider>
  );
};

export default ReelCampaigns;

