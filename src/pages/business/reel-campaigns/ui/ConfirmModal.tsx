import React, { useEffect } from 'react';

export const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  description?: string;
  confirmText: string;
  cancelText?: string;
  tone?: 'danger' | 'neutral';
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, description, confirmText, cancelText = 'Cancel', tone = 'neutral', onConfirm, onCancel }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onCancel} aria-label="Close modal" />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 p-5">
        <p className="text-base font-semibold text-gray-900">{title}</p>
        {description && <p className="text-sm text-gray-600 mt-2">{description}</p>}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

