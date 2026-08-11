import React, { useState } from 'react';
import { Package2, AlertTriangle, TrendingUp } from 'lucide-react';

interface StockData {
  stock_qty: number;
  low_stock_threshold: number;
}

interface StockStepProps {
  data: StockData;
  onChange: (stock: StockData) => void;
}

const StockStep: React.FC<StockStepProps> = ({ data, onChange }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof StockData, value: number) => {
    const newData = { ...data, [field]: value };
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    onChange(newData);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (data.stock_qty < 0) newErrors.stock_qty = 'Stock quantity cannot be negative';
    if (data.low_stock_threshold < 0) newErrors.low_stock_threshold = 'Low stock threshold cannot be negative';
    if (data.low_stock_threshold >= data.stock_qty && data.stock_qty > 0) {
      newErrors.low_stock_threshold = 'Low stock threshold should be less than current stock';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getStockStatus = () => {
    if (data.stock_qty === 0) {
      return { status: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertTriangle };
    } else if (data.stock_qty <= data.low_stock_threshold) {
      return { status: 'Low Stock', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertTriangle };
    } else {
      return { status: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-50', icon: TrendingUp };
    }
  };

  const stockStatus = getStockStatus();
  const StatusIcon = stockStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Package2 className="text-primary-500" size={32} />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Stock Management</h3>
        <p className="text-gray-600">Set initial inventory and configure stock alerts</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Stock Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initial Stock Quantity *
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={data.stock_qty || ''}
            onChange={(e) => handleInputChange('stock_qty', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.stock_qty ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter initial stock quantity"
          />
          {errors.stock_qty && <p className="text-red-500 text-xs mt-1">{errors.stock_qty}</p>}
          <p className="text-gray-500 text-xs mt-1">Number of units available for sale</p>
        </div>

        {/* Low Stock Threshold */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Low Stock Alert Threshold *
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={data.low_stock_threshold || ''}
            onChange={(e) => handleInputChange('low_stock_threshold', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.low_stock_threshold ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter low stock threshold"
          />
          {errors.low_stock_threshold && <p className="text-red-500 text-xs mt-1">{errors.low_stock_threshold}</p>}
          <p className="text-gray-500 text-xs mt-1">Get alerts when stock falls below this number</p>
        </div>

        {/* Stock Status Indicator */}
        {(data.stock_qty > 0 || data.low_stock_threshold > 0) && (
          <div className={`p-4 rounded-lg ${stockStatus.bgColor}`}>
            <div className="flex items-center">
              <StatusIcon className={`mr-3 ${stockStatus.color}`} size={20} />
              <div>
                <h4 className={`font-medium ${stockStatus.color}`}>
                  Current Status: {stockStatus.status}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {data.stock_qty === 0 && 'Product will be marked as out of stock'}
                  {data.stock_qty > 0 && data.stock_qty <= data.low_stock_threshold && 
                    'Stock is below threshold - consider restocking soon'
                  }
                  {data.stock_qty > data.low_stock_threshold && 
                    'Stock levels are healthy'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stock Management Guidelines */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Stock Management Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Set initial stock to the actual number of units you have</li>
            <li>• Low stock threshold should be based on your reorder time</li>
            <li>• Consider seasonal demand when setting thresholds</li>
            <li>• You can update stock quantities later from the product management page</li>
            <li>• Stock will automatically decrease when orders are placed</li>
          </ul>
        </div>

        {/* Quick Stock Presets */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Quick Stock Presets</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Small Batch', stock: 10, threshold: 2 },
              { label: 'Medium Stock', stock: 50, threshold: 10 },
              { label: 'Large Stock', stock: 100, threshold: 20 },
              { label: 'Bulk Inventory', stock: 500, threshold: 50 }
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => onChange({
                  stock_qty: preset.stock,
                  low_stock_threshold: preset.threshold
                })}
                className="p-3 border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">{preset.label}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {preset.stock} units / {preset.threshold} threshold
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stock Value Calculation */}
        {data.stock_qty > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Inventory Value</h4>
            <div className="text-sm text-gray-600">
              <p>Based on your stock quantity, this represents your inventory investment.</p>
              <p className="mt-1">
                <span className="font-medium">Note:</span> Cost and selling prices will be used to calculate actual inventory value
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockStep;
