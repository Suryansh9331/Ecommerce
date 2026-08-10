import React, { useEffect } from 'react';

export const RightDrawer: React.FC<{
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ open, title, subtitle, onClose, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close drawer"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 w-full max-w-[520px] bg-white shadow-xl flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
              {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">{children}</div>

        {footer && <div className="border-t border-gray-200 p-4">{footer}</div>}
      </div>
    </div>
  );
};

