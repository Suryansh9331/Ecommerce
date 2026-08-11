import React, { useState } from 'react';
import { FaMoneyBillWave, FaTimes } from 'react-icons/fa';

interface Merchant {
  id: string;
  merchantName: string;
  pendingAmount: number;
}

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selections: { merchantId: string; amount: number }[]) => void;
  merchants: Merchant[];
}

const BulkPaymentModal: React.FC<BulkPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  merchants,
}) => {
  const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMerchants([]);
    } else {
      const allIds = merchants.map(m => m.id);
      setSelectedMerchants(allIds);
      // Initialize amounts to full pending by default
      const init: Record<string, number> = {};
      merchants.forEach(m => { init[m.id] = m.pendingAmount; });
      setAmounts(init);
    }
    setSelectAll(!selectAll);
  };

  const handleMerchantToggle = (merchantId: string) => {
    setSelectedMerchants(prev => {
      if (prev.includes(merchantId)) {
        setSelectAll(false);
        return prev.filter(id => id !== merchantId);
      } else {
        const newSelected = [...prev, merchantId];
        if (newSelected.length === merchants.length) {
          setSelectAll(true);
        }
        // Initialize amount if not set
        const m = merchants.find(x => x.id === merchantId);
        if (m && amounts[merchantId] === undefined) {
          setAmounts(a => ({ ...a, [merchantId]: m.pendingAmount }));
        }
        return newSelected;
      }
    });
  };

  const handleAmountChange = (merchantId: string, value: string) => {
    const num = Math.max(0, Number(value) || 0);
    const m = merchants.find(x => x.id === merchantId);
    const capped = m ? Math.min(num, m.pendingAmount) : num;
    setAmounts(prev => ({ ...prev, [merchantId]: capped }));
  };

  const selectedAmount = merchants
    .filter(m => selectedMerchants.includes(m.id))
    .reduce((sum, m) => sum + (amounts[m.id] ?? 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl border border-primary-100 transform transition-all duration-300 scale-95 hover:scale-100">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-600">Confirm Bulk Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <FaTimes className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-center mb-6 text-primary-500">
              <FaMoneyBillWave className="text-4xl sm:text-5xl" />
            </div>
            
            <p className="text-gray-600 mb-6 text-center text-sm sm:text-base">
              Select the merchants you want to process payments for. Only orders delivered more than 7 days ago are eligible.
            </p>

            <div className="mb-6">
              <div className="flex items-center p-3 bg-primary-50 rounded-t-xl">
                <label className="flex items-center space-x-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="form-checkbox h-5 w-5 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span>Select All Merchants</span>
                </label>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-b-xl">
                {merchants.map(merchant => (
                  <div key={merchant.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 hover:bg-gray-50 border-b last:border-b-0">
                    <label className="flex items-center space-x-3 sm:col-span-6">
                      <input
                        type="checkbox"
                        checked={selectedMerchants.includes(merchant.id)}
                        onChange={() => handleMerchantToggle(merchant.id)}
                        className="form-checkbox h-5 w-5 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{merchant.merchantName}</span>
                    </label>
                    <div className="sm:col-span-3 text-xs sm:text-sm text-gray-600">
                      Pending: <span className="text-green-700 font-medium">₹{merchant.pendingAmount.toLocaleString()}</span>
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min={0}
                        max={merchant.pendingAmount}
                        step="0.01"
                        disabled={!selectedMerchants.includes(merchant.id)}
                        value={selectedMerchants.includes(merchant.id) ? (amounts[merchant.id] ?? merchant.pendingAmount) : ''}
                        onChange={(e) => handleAmountChange(merchant.id, e.target.value)}
                        placeholder="Enter amount"
                        className="w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary-50 p-4 sm:p-6 rounded-xl mb-6">
              <div className="flex justify-between mb-3">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Selected Merchants:</span>
                <span className="font-bold text-primary-700 text-sm sm:text-base">{selectedMerchants.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Selected Amount:</span>
                <span className="font-bold text-green-600 text-sm sm:text-base">₹{selectedAmount.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 text-center">
              This action cannot be undone. Please confirm that you want to proceed with the payments.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="w-full px-4 sm:px-6 py-2 sm:py-3 border border-primary-200 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedMerchants.map(id => ({ merchantId: id, amount: amounts[id] ?? 0 })).filter(s => s.amount > 0))}
              disabled={selectedMerchants.length === 0}
              className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-colors font-medium shadow-lg hover:shadow-xl text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkPaymentModal; 