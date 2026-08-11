import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string) => void;
  isExporting: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, isExporting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Export Report</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choose the format to export your report:</p>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => onExport('csv')}
              disabled={isExporting}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Export as CSV
            </button>
            
            <button
              onClick={() => onExport('excel')}
              disabled={isExporting}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Export as Excel
            </button>
            
            <button
              onClick={() => onExport('pdf')}
              disabled={isExporting}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Export as PDF
            </button>
          </div>

          {isExporting && (
            <div className="flex items-center justify-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500 mr-2"></div>
              Exporting...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
