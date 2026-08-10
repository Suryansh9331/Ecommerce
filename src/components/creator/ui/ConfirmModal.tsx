import React, { useEffect } from 'react';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'neutral' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'neutral',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const primary =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-gray-900 hover:bg-black text-white';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-[2px]" onClick={onCancel} aria-hidden />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-[420px] rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-5">
            <h3 className="text-[15px] font-extrabold text-gray-900">{title}</h3>
            {description && <p className="text-[13px] text-gray-500 mt-2">{description}</p>}
          </div>
          <div className="px-5 pb-5 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-[13px] hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-colors ${primary}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

