import React from 'react';

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-100',
  warning: 'bg-orange-50 text-orange-700 ring-orange-100',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  danger: 'bg-red-50 text-red-700 ring-red-100',
};

export interface StatusChipProps {
  label: string;
  tone?: StatusTone;
  dotClassName?: string; // e.g. "bg-emerald-400"
}

export const StatusChip: React.FC<StatusChipProps> = ({ label, tone = 'neutral', dotClassName }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-bold ring-1 ${TONE_CLASS[tone]}`}>
      {dotClassName && <span className={`w-1.5 h-1.5 rounded-full ${dotClassName}`} />}
      {label}
    </span>
  );
};

