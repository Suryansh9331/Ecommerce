import React, { useState } from 'react';
import { Package, Ruler, Weight } from 'lucide-react';

interface ShippingData {
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
  shipping_class: string;
}

interface ShippingStepProps {
  data: ShippingData;
  onChange: (shipping: ShippingData) => void;
}

const ShippingStep: React.FC<ShippingStepProps> = ({ data, onChange }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const SHIPPING_CLASSES = [
    { value: 'standard', label: 'Standard Shipping', description: '3-5 business days' },
    { value: 'express', label: 'Express Shipping', description: '1-2 business days' },
    { value: 'overnight', label: 'Overnight Shipping', description: 'Next business day' },
    { value: 'economy', label: 'Economy Shipping', description: '7-10 business days' },
    { value: 'free', label: 'Free Shipping', description: '5-7 business days' }
  ];

  const handleInputChange = (field: keyof ShippingData, value: number | string) => {
    const newData = { ...data, [field]: value };
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    onChange(newData);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (data.length_cm <= 0) newErrors.length_cm = 'Length is required';
    if (data.width_cm <= 0) newErrors.width_cm = 'Width is required';
    if (data.height_cm <= 0) newErrors.height_cm = 'Height is required';
    if (data.weight_kg <= 0) newErrors.weight_kg = 'Weight is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateVolume = () => {
    const { length_cm, width_cm, height_cm } = data;
    if (length_cm > 0 && width_cm > 0 && height_cm > 0) {
      return (length_cm * width_cm * height_cm / 1000000).toFixed(3); // Convert to cubic meters
    }
    return 0;
  };

  const getShippingCategory = () => {
    const volume = parseFloat(calculateVolume().toString());
    const weight = data.weight_kg;
    
    if (volume <= 0.01 && weight <= 0.5) return { category: 'Small Package', color: 'text-green-600' };
    if (volume <= 0.05 && weight <= 2) return { category: 'Medium Package', color: 'text-yellow-600' };
    if (volume <= 0.1 && weight <= 5) return { category: 'Large Package', color: 'text-primary-600' };
    return { category: 'Oversized Package', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Package className="text-primary-500" size={32} />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Shipping Information</h3>
        <p className="text-gray-600">Enter the dimensions and weight for shipping calculations</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Dimensions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Ruler className="mr-2 text-gray-500" size={20} />
            Package Dimensions
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Length (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={data.length_cm || ''}
                onChange={(e) => handleInputChange('length_cm', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.length_cm ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {errors.length_cm && <p className="text-red-500 text-xs mt-1">{errors.length_cm}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Width (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={data.width_cm || ''}
                onChange={(e) => handleInputChange('width_cm', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.width_cm ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {errors.width_cm && <p className="text-red-500 text-xs mt-1">{errors.width_cm}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={data.height_cm || ''}
                onChange={(e) => handleInputChange('height_cm', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.height_cm ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {errors.height_cm && <p className="text-red-500 text-xs mt-1">{errors.height_cm}</p>}
            </div>
          </div>
        </div>

        {/* Weight */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Weight className="mr-2 text-gray-500" size={20} />
            Package Weight
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={data.weight_kg || ''}
                onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.weight_kg ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.weight_kg && <p className="text-red-500 text-xs mt-1">{errors.weight_kg}</p>}
            </div>
          </div>
        </div>

        {/* Shipping Class */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Package className="mr-2 text-gray-500" size={20} />
            Shipping Class
          </h4>
          
          <div className="space-y-3">
            {SHIPPING_CLASSES.map((shippingClass) => (
              <label
                key={shippingClass.value}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  data.shipping_class === shippingClass.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="shipping_class"
                  value={shippingClass.value}
                  checked={data.shipping_class === shippingClass.value}
                  onChange={(e) => handleInputChange('shipping_class', e.target.value)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">{shippingClass.label}</div>
                  <div className="text-sm text-gray-600">{shippingClass.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Calculated Information */}
        {data.length_cm > 0 && data.width_cm > 0 && data.height_cm > 0 && data.weight_kg > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-900">Calculated Shipping Information</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Volume:</span>
                <span className="font-medium ml-2">{calculateVolume()} m³</span>
              </div>
              
              <div>
                <span className="text-gray-600">Package Category:</span>
                <span className={`font-medium ml-2 ${getShippingCategory().color}`}>
                  {getShippingCategory().category}
                </span>
              </div>
              
              <div>
                <span className="text-gray-600">Dimensional Weight:</span>
                <span className="font-medium ml-2">
                  {((data.length_cm * data.width_cm * data.height_cm) / 5000).toFixed(2)} kg
                </span>
              </div>
              
              <div>
                <span className="text-gray-600">Billable Weight:</span>
                <span className="font-medium ml-2">
                  {Math.max(
                    data.weight_kg,
                    (data.length_cm * data.width_cm * data.height_cm) / 5000
                  ).toFixed(2)} kg
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Guidelines */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Shipping Guidelines:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Measure the outer dimensions of your packaging</li>
            <li>• Include packaging materials in weight calculations</li>
            <li>• Dimensional weight = (L × W × H) ÷ 5000</li>
            <li>• Billable weight is the higher of actual weight or dimensional weight</li>
            <li>• Accurate measurements help calculate correct shipping costs</li>
          </ul>
        </div>

        {/* Visual Dimension Helper */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Package Visualization</h4>
          <div className="flex items-center justify-center">
            <div 
              className="border-2 border-dashed border-gray-400 bg-gray-100 relative"
              style={{
                width: Math.max(60, Math.min(data.length_cm * 2, 120)),
                height: Math.max(40, Math.min(data.width_cm * 2, 80)),
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600">
                {data.length_cm > 0 && data.width_cm > 0 && data.height_cm > 0 
                  ? `${data.length_cm}×${data.width_cm}×${data.height_cm}cm` 
                  : 'Package Preview'
                }
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">Approximate package size visualization</p>
        </div>
      </div>
    </div>
  );
};

export default ShippingStep;
