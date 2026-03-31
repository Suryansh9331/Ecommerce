import React, { useEffect } from 'react';

type DrawerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<DrawerSize, string> = {
  sm: 'max-w-[380px]',
  md: 'max-w-[420px]',
  lg: 'max-w-[520px]',
};

export interface SideDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  size?: DrawerSize;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  open,
  title,
  subtitle,
  size = 'md',
  onClose,
  footer,
  children,
}) => {
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
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed right-0 top-0 bottom-0 z-50 w-full ${SIZE_CLASS[size]} bg-white shadow-2xl flex flex-col`}
      >
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {subtitle && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                  {subtitle}
                </p>
              )}
              <h2 className="text-[15px] font-bold text-gray-900 leading-tight mt-0.5 truncate">
                {title}
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
            >
              <span className="text-[16px] leading-none">×</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && <div className="border-t border-gray-100 shrink-0">{footer}</div>}
      </aside>
    </>
  );
};

