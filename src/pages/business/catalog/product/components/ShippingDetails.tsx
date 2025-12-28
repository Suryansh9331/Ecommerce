import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface DimensionPreset {
  preset_id: number;
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
  shipping_class?: string;
}

interface ShippingUnit {
  value: string;
  label: string;
  conversion: number;
}

interface ShippingDetailsProps {
  productId: number;
  weight: string;
  weightUnit: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  dimensionUnit: string;
  shippingClass: string;
  onShippingChange: (field: string, value: string) => void;
  onDimensionsChange: (field: string, value: string) => void;
  errors?: {
    weight?: string;
    dimensions?: {
      length?: string;
      width?: string;
      height?: string;
    };
    shippingClass?: string;
  };
}

const weightUnits: ShippingUnit[] = [
  { value: 'kg', label: 'Kilograms (kg)', conversion: 1 },
  { value: 'g', label: 'Grams (g)', conversion: 0.001 },
  { value: 'lb', label: 'Pounds (lb)', conversion: 0.453592 },
  { value: 'oz', label: 'Ounces (oz)', conversion: 0.0283495 }
];

const dimensionUnits: ShippingUnit[] = [
  { value: 'cm', label: 'Centimeters (cm)', conversion: 1 },
  { value: 'mm', label: 'Millimeters (mm)', conversion: 0.1 },
  { value: 'in', label: 'Inches (in)', conversion: 2.54 },
  { value: 'ft', label: 'Feet (ft)', conversion: 30.48 }
];

const shippingClasses = [
  { value: 'standard', label: 'Standard Shipping' },
  { value: 'express', label: 'Express Shipping' },
  { value: 'overnight', label: 'Overnight Shipping' },
  { value: 'free', label: 'Free Shipping' }
];

const ShippingDetails: React.FC<ShippingDetailsProps> = ({
  productId,
  weight,
  weightUnit,
  dimensions,
  dimensionUnit,
  shippingClass,
  onShippingChange,
  onDimensionsChange,
  errors = {},
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    weight?: string;
    length?: string;
    width?: string;
    height?: string;
    shippingClass?: string;
  }>({});
  const [presets, setPresets] = useState<DimensionPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);

  // Validation function
  const validateShippingForm = (): boolean => {
    const newErrors: typeof validationErrors = {};

    // Weight validation (convert to kg for validation)
    const weightValue = parseFloat(weight);
    const weightInKg = convertToBaseUnit(weight, weightUnit, weightUnits);
    
    if (!weight || weight.trim() === '') {
      newErrors.weight = 'Weight is required';
    } else if (isNaN(weightValue)) {
      newErrors.weight = 'Weight must be a valid number';
    } else if (weightValue <= 0) {
      newErrors.weight = 'Weight must be greater than 0';
    } else if (weightInKg > 50) {
      newErrors.weight = 'Weight cannot exceed 50 kg';
    }

    // Length validation
    const lengthValue = parseFloat(dimensions.length);
    if (!dimensions.length || dimensions.length.trim() === '') {
      newErrors.length = 'Length is required';
    } else if (isNaN(lengthValue)) {
      newErrors.length = 'Length must be a valid number';
    } else if (lengthValue <= 0) {
      newErrors.length = 'Length must be greater than 0';
    }

    // Width validation
    const widthValue = parseFloat(dimensions.width);
    if (!dimensions.width || dimensions.width.trim() === '') {
      newErrors.width = 'Width is required';
    } else if (isNaN(widthValue)) {
      newErrors.width = 'Width must be a valid number';
    } else if (widthValue <= 0) {
      newErrors.width = 'Width must be greater than 0';
    }

    // Height validation
    const heightValue = parseFloat(dimensions.height);
    if (!dimensions.height || dimensions.height.trim() === '') {
      newErrors.height = 'Height is required';
    } else if (isNaN(heightValue)) {
      newErrors.height = 'Height must be a valid number';
    } else if (heightValue <= 0) {
      newErrors.height = 'Height must be greater than 0';
    }

    // Shipping class validation
    if (!shippingClass || shippingClass === '') {
      newErrors.shippingClass = 'Shipping class is required';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid for button enabling
  const isFormValid = (): boolean => {
    const weightValue = parseFloat(weight);
    const weightInKg = convertToBaseUnit(weight, weightUnit, weightUnits);
    const lengthValue = parseFloat(dimensions.length);
    const widthValue = parseFloat(dimensions.width);
    const heightValue = parseFloat(dimensions.height);

    return (
      weight &&
      !isNaN(weightValue) &&
      weightValue > 0 &&
      weightInKg <= 50 &&
      dimensions.length &&
      !isNaN(lengthValue) &&
      lengthValue > 0 &&
      dimensions.width &&
      !isNaN(widthValue) &&
      widthValue > 0 &&
      dimensions.height &&
      !isNaN(heightValue) &&
      heightValue > 0 &&
      shippingClass &&
      shippingClass !== ''
    );
  };

  const handleUpdateShipping = async () => {
    if (!productId || typeof productId !== 'number' || isNaN(productId)) {
      console.error('Invalid product ID in handleUpdateShipping:', productId);
      setError('Invalid product ID. Please try again.');
      return;
    }

    // Validate before submitting
    if (!validateShippingForm()) {
      setError('Please fix all validation errors before updating shipping details.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const shippingData = {
        weight: convertToBaseUnit(weight, weightUnit, weightUnits),
        dimensions: {
          length: convertToBaseUnit(dimensions.length, dimensionUnit, dimensionUnits),
          width: convertToBaseUnit(dimensions.width, dimensionUnit, dimensionUnits),
          height: convertToBaseUnit(dimensions.height, dimensionUnit, dimensionUnits),
        },
        shipping_class: shippingClass
      };

      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${productId}/shipping`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shippingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update shipping details');
      }

      const updatedData = await response.json();
      setSuccess('Shipping details updated successfully');
      setValidationErrors({});
    } catch (error) {
      console.error('Error updating shipping details:', error);
      setError('Failed to update shipping details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const convertToBaseUnit = (value: string, unit: string, units: ShippingUnit[]): number => {
    const numericValue = parseFloat(value) || 0;
    const unitConfig = units.find(u => u.value === unit);
    if (!unitConfig) return numericValue;
    return numericValue * unitConfig.conversion;
  };

  const convertFromBaseUnit = (value: number, unit: string, units: ShippingUnit[]): number => {
    if (!value || isNaN(value)) return 0;
    const unitConfig = units.find(u => u.value === unit);
    if (!unitConfig) return value;
    return value / unitConfig.conversion;
  };

  // Fetch dimension presets
  useEffect(() => {
    const fetchPresets = async () => {
      setIsLoadingPresets(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/dimension-presets`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPresets(data);
        }
      } catch (err) {
        console.error('Error fetching dimension presets:', err);
      } finally {
        setIsLoadingPresets(false);
      }
    };

    fetchPresets();
  }, []);

  // Handle preset selection
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    
    if (presetId === '') {
      // Clear preset
      return;
    }

    const preset = presets.find(p => p.preset_id.toString() === presetId);
    if (preset) {
      // Convert from base units (cm, kg) to selected display units
      const lengthInDisplayUnit = convertFromBaseUnit(preset.length_cm, dimensionUnit, dimensionUnits);
      const widthInDisplayUnit = convertFromBaseUnit(preset.width_cm, dimensionUnit, dimensionUnits);
      const heightInDisplayUnit = convertFromBaseUnit(preset.height_cm, dimensionUnit, dimensionUnits);
      const weightInDisplayUnit = convertFromBaseUnit(preset.weight_kg, weightUnit, weightUnits);

      // Update dimensions
      onDimensionsChange('length', lengthInDisplayUnit.toString());
      onDimensionsChange('width', widthInDisplayUnit.toString());
      onDimensionsChange('height', heightInDisplayUnit.toString());
      
      // Update weight
      onShippingChange('weight', weightInDisplayUnit.toString());
      
      // Update shipping class if preset has one
      if (preset.shipping_class) {
        onShippingChange('shippingClass', preset.shipping_class);
      }

      // Clear validation errors
      setValidationErrors({});
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Dimension Preset Selector */}
      <div>
        <label htmlFor="dimensionPreset" className="block text-sm font-medium text-gray-700 mb-2">
          Use Dimension Preset (Optional)
        </label>
        <div className="flex gap-2">
          <select
            id="dimensionPreset"
            value={selectedPresetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            disabled={isLoadingPresets}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          >
            <option value="">Select a preset or enter manually...</option>
            {presets.map((preset) => (
              <option key={preset.preset_id} value={preset.preset_id.toString()}>
                {preset.name} ({preset.length_cm}×{preset.width_cm}×{preset.height_cm} cm, {preset.weight_kg} kg)
              </option>
            ))}
          </select>
          {selectedPresetId && (
            <button
              type="button"
              onClick={() => handlePresetChange('')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Select a preset to auto-fill dimensions. You can still edit the values after selection.
        </p>
      </div>

      {/* Weight */}
      <div>
        <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
          Weight *
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="number"
            id="weight"
            value={weight}
            onChange={(e) => {
              onShippingChange('weight', e.target.value);
              if (validationErrors.weight) {
                const newErrors = { ...validationErrors };
                delete newErrors.weight;
                setValidationErrors(newErrors);
              }
              setError(null);
            }}
            onBlur={() => {
              const weightValue = parseFloat(weight);
              const weightInKg = convertToBaseUnit(weight, weightUnit, weightUnits);
              if (!weight || isNaN(weightValue) || weightValue <= 0) {
                setValidationErrors(prev => ({
                  ...prev,
                  weight: !weight ? 'Weight is required' : weightValue <= 0 ? 'Weight must be greater than 0' : 'Weight must be a valid number'
                }));
              } else if (weightInKg > 50) {
                setValidationErrors(prev => ({
                  ...prev,
                  weight: 'Weight cannot exceed 50 kg'
                }));
              }
            }}
            step="0.001"
            min="0.001"
            className={`flex-1 rounded-l-md border-gray-300 focus:border-orange-500 focus:ring-orange-500 sm:text-sm ${
              validationErrors.weight || errors.weight ? 'border-red-300' : ''
            }`}
            placeholder="Enter product weight"
            required
          />
          <select
            value={weightUnit}
            onChange={(e) => onShippingChange('weightUnit', e.target.value)}
            className="rounded-r-md border-l-0 border-gray-300 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          >
            {weightUnits.map(unit => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>
        {(validationErrors.weight || errors.weight) && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.weight || errors.weight}</p>
        )}
      </div>

      {/* Dimensions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dimensions *
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="length" className="block text-xs text-gray-500 mb-1">
              Length *
            </label>
            <input
              type="number"
              id="length"
              value={dimensions.length}
              onChange={(e) => {
                onDimensionsChange('length', e.target.value);
                if (validationErrors.length) {
                  const newErrors = { ...validationErrors };
                  delete newErrors.length;
                  setValidationErrors(newErrors);
                }
                setError(null);
              }}
              onBlur={() => {
                const lengthValue = parseFloat(dimensions.length);
                if (!dimensions.length || isNaN(lengthValue) || lengthValue <= 0) {
                  setValidationErrors(prev => ({
                    ...prev,
                    length: !dimensions.length ? 'Length is required' : lengthValue <= 0 ? 'Length must be greater than 0' : 'Length must be a valid number'
                  }));
                }
              }}
              step="0.01"
              min="0.01"
              className={`block w-full rounded-md shadow-sm sm:text-sm ${
                validationErrors.length || errors.dimensions?.length
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
              }`}
              placeholder="Length"
              required
            />
            {(validationErrors.length || errors.dimensions?.length) && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.length || errors.dimensions?.length}</p>
            )}
          </div>
          <div>
            <label htmlFor="width" className="block text-xs text-gray-500 mb-1">
              Width *
            </label>
            <input
              type="number"
              id="width"
              value={dimensions.width}
              onChange={(e) => {
                onDimensionsChange('width', e.target.value);
                if (validationErrors.width) {
                  const newErrors = { ...validationErrors };
                  delete newErrors.width;
                  setValidationErrors(newErrors);
                }
                setError(null);
              }}
              onBlur={() => {
                const widthValue = parseFloat(dimensions.width);
                if (!dimensions.width || isNaN(widthValue) || widthValue <= 0) {
                  setValidationErrors(prev => ({
                    ...prev,
                    width: !dimensions.width ? 'Width is required' : widthValue <= 0 ? 'Width must be greater than 0' : 'Width must be a valid number'
                  }));
                }
              }}
              step="0.01"
              min="0.01"
              className={`block w-full rounded-md shadow-sm sm:text-sm ${
                validationErrors.width || errors.dimensions?.width
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
              }`}
              placeholder="Width"
              required
            />
            {(validationErrors.width || errors.dimensions?.width) && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.width || errors.dimensions?.width}</p>
            )}
          </div>
          <div>
            <label htmlFor="height" className="block text-xs text-gray-500 mb-1">
              Height *
            </label>
            <input
              type="number"
              id="height"
              value={dimensions.height}
              onChange={(e) => {
                onDimensionsChange('height', e.target.value);
                if (validationErrors.height) {
                  const newErrors = { ...validationErrors };
                  delete newErrors.height;
                  setValidationErrors(newErrors);
                }
                setError(null);
              }}
              onBlur={() => {
                const heightValue = parseFloat(dimensions.height);
                if (!dimensions.height || isNaN(heightValue) || heightValue <= 0) {
                  setValidationErrors(prev => ({
                    ...prev,
                    height: !dimensions.height ? 'Height is required' : heightValue <= 0 ? 'Height must be greater than 0' : 'Height must be a valid number'
                  }));
                }
              }}
              step="0.01"
              min="0.01"
              className={`block w-full rounded-md shadow-sm sm:text-sm ${
                validationErrors.height || errors.dimensions?.height
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
              }`}
              placeholder="Height"
              required
            />
            {(validationErrors.height || errors.dimensions?.height) && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.height || errors.dimensions?.height}</p>
            )}
          </div>
        </div>
        <div className="mt-2">
          <select
            value={dimensionUnit}
            onChange={(e) => onShippingChange('dimensionUnit', e.target.value)}
            className="block w-full rounded-md border-gray-300 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          >
            {dimensionUnits.map(unit => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shipping Class */}
      <div>
        <label htmlFor="shippingClass" className="block text-sm font-medium text-gray-700">
          Shipping Class *
        </label>
        <div className="mt-1">
          <select
            id="shippingClass"
            value={shippingClass}
            onChange={(e) => {
              onShippingChange('shippingClass', e.target.value);
              if (validationErrors.shippingClass) {
                const newErrors = { ...validationErrors };
                delete newErrors.shippingClass;
                setValidationErrors(newErrors);
              }
              setError(null);
            }}
            onBlur={() => {
              if (!shippingClass || shippingClass === '') {
                setValidationErrors(prev => ({
                  ...prev,
                  shippingClass: 'Shipping class is required'
                }));
              }
            }}
            className={`block w-full rounded-md shadow-sm sm:text-sm ${
              validationErrors.shippingClass || errors.shippingClass
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
            }`}
            required
          >
            <option value="">Select a shipping class</option>
            {shippingClasses.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {(validationErrors.shippingClass || errors.shippingClass) && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.shippingClass || errors.shippingClass}</p>
          )}
        </div>
      </div>

      {/* Shipping Calculator Preview */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Shipping Calculator Preview
        </h4>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Weight: {convertToBaseUnit(weight, weightUnit, weightUnits).toFixed(2)} kg
          </div>
          <div className="text-sm text-gray-600">
            Dimensions: {convertToBaseUnit(dimensions.length, dimensionUnit, dimensionUnits).toFixed(2)} x {convertToBaseUnit(dimensions.width, dimensionUnit, dimensionUnits).toFixed(2)} x {convertToBaseUnit(dimensions.height, dimensionUnit, dimensionUnits).toFixed(2)} cm
          </div>
          <div className="text-sm text-gray-600">
            Shipping Class: {shippingClasses.find(c => c.value === shippingClass)?.label || 'Not selected'}
          </div>
        </div>
      </div>

      {/* Update Button */}
      <div className="flex justify-end">
        <button
          onClick={handleUpdateShipping}
          disabled={isLoading || !isFormValid()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          title={!isFormValid() ? 'Please fill all required shipping fields correctly' : ''}
        >
          {isLoading ? 'Updating...' : 'Update Shipping'}
        </button>
      </div>
    </div>
  );
};

export default ShippingDetails;