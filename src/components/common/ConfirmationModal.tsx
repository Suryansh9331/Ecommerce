import React from "react";
import Modal from "./Modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  icon?: React.ReactNode; // Optional icon prop
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  icon,
}) => {
  if (!isOpen) return null;

  const confirmButtonBaseClasses =
    "w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm disabled:opacity-50";
  const confirmButtonColorClasses = "bg-primary-500 hover:bg-primary-600 focus:ring-primary-500";

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="p-4 flex flex-col items-center text-center">
        {/* Icon area */}
        {icon && (
          <div className="mb-3 flex items-center justify-center">
            {icon}
          </div>
        )}
        {/* Title */}
        <div className={`text-lg font-semibold mb-2 text-gray-900`}>{title}</div>
        {/* Message */}
        <div className="text-sm text-gray-600 mb-4">{message}</div>
        {/* Buttons always side by side, each half width */}
        <div className="mt-5 flex flex-row justify-end  gap-3 w-3/5">
          <button
            type="button"
            disabled={isLoading}
            className="w-1/2 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm disabled:opacity-50"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            className={`w-1/2 ${confirmButtonBaseClasses} ${confirmButtonColorClasses}`}
            onClick={onConfirm}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
