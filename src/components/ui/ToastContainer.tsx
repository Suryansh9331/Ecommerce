import React from 'react';
import type { Toast } from '../../hooks/useToast';

const STYLES: Record<string, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50   border-red-200   text-red-800',
  info:    'bg-blue-50  border-blue-200  text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const ICONS: Record<string, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
};

export const ToastContainer: React.FC<{ toasts: Toast[] }> = ({ toasts }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-md ${STYLES[t.type]}`}
        >
          <span className="flex-shrink-0 mt-0.5">{ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};