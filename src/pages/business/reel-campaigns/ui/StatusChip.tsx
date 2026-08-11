import React from 'react';
import type { CampaignStatus } from '../mock/types';

const STATUS_STYLE: Record<CampaignStatus, { bg: string; text: string; dot: string }> = {
  Draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  Sent: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Accepted: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  Active: { bg: 'bg-primary-100', text: 'text-primary-800', dot: 'bg-primary-500' },
  Submitted: { bg: 'bg-sky-100', text: 'text-sky-800', dot: 'bg-sky-500' },
  Approved: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  Live: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  Completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  Rejected: { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500' },
  Cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  Expired: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
};

export const StatusChip: React.FC<{ status: CampaignStatus }> = ({ status }) => {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

