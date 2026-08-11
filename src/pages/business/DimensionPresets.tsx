import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { TrashIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ShippingUnit {
  value: string;
  label: string;
  conversion: number;
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
  { value: 'm', label: 'Meters (m)', conversion: 100 },
  { value: 'in', label: 'Inches (in)', conversion: 2.54 },
  { value: 'ft', label: 'Feet (ft)', conversion: 30.48 }
];

interface DimensionPreset {
  preset_id: number;
  merchant_id: number;
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
  shipping_class?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const shippingClasses = [
  { value: 'standard', label: 'Standard Shipping' },
  { value: 'express', label: 'Express Shipping' },
  { value: 'overnight', label: 'Overnight Shipping' },
  { value: 'free', label: 'Free Shipping' }
];

const DimensionPresets: React.FC = () => {
  const { accessToken } = useAuth();
  const [presets, setPresets] = useState<DimensionPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<DimensionPreset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    shipping_class: '',
    description: ''
  });

  // Unit selection state
  const [weightUnit, setWeightUnit] = useState<string>('kg');
  const [dimensionUnit, setDimensionUnit] = useState<string>('cm');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/dimension-presets`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dimension presets');
      }

      const data = await response.json();
      setPresets(data);
    } catch (err) {
      console.error('Error fetching presets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dimension presets');
      toast.error('Failed to load dimension presets');
    } finally {
      setIsLoading(false);
    }
  };

  // Conversion functions
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.length || parseFloat(formData.length) <= 0) {
      errors.length = 'Length must be greater than 0';
    }

    if (!formData.width || parseFloat(formData.width) <= 0) {
      errors.width = 'Width must be greater than 0';
    }

    if (!formData.height || parseFloat(formData.height) <= 0) {
      errors.height = 'Height must be greater than 0';
    }

    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      errors.weight = 'Weight must be greater than 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert to base units (cm for dimensions, kg for weight)
      const payload = {
        name: formData.name.trim(),
        length_cm: convertToBaseUnit(formData.length, dimensionUnit, dimensionUnits),
        width_cm: convertToBaseUnit(formData.width, dimensionUnit, dimensionUnits),
        height_cm: convertToBaseUnit(formData.height, dimensionUnit, dimensionUnits),
        weight_kg: convertToBaseUnit(formData.weight, weightUnit, weightUnits),
        shipping_class: formData.shipping_class || null,
        description: formData.description.trim() || null
      };

      const url = editingPreset
        ? `${API_BASE_URL}/api/merchant-dashboard/dimension-presets/${editingPreset.preset_id}`
        : `${API_BASE_URL}/api/merchant-dashboard/dimension-presets`;
      const method = editingPreset ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save dimension preset');
      }

      toast.success(editingPreset ? 'Dimension preset updated successfully' : 'Dimension preset created successfully');
      setIsModalOpen(false);
      resetForm();
      fetchPresets();
    } catch (err) {
      console.error('Error saving preset:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save dimension preset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (presetId: number) => {
    if (!window.confirm('Are you sure you want to delete this dimension preset?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/dimension-presets/${presetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete dimension preset');
      }

      toast.success('Dimension preset deleted successfully');
      fetchPresets();
    } catch (err) {
      console.error('Error deleting preset:', err);
      toast.error('Failed to delete dimension preset');
    }
  };

  const handleEdit = (preset: DimensionPreset) => {
    setEditingPreset(preset);
    // Convert from base units (cm, kg) to display units
    setFormData({
      name: preset.name,
      length: convertFromBaseUnit(preset.length_cm, dimensionUnit, dimensionUnits).toString(),
      width: convertFromBaseUnit(preset.width_cm, dimensionUnit, dimensionUnits).toString(),
      height: convertFromBaseUnit(preset.height_cm, dimensionUnit, dimensionUnits).toString(),
      weight: convertFromBaseUnit(preset.weight_kg, weightUnit, weightUnits).toString(),
      shipping_class: preset.shipping_class || '',
      description: preset.description || ''
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    resetForm();
    setEditingPreset(null);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      length: '',
      width: '',
      height: '',
      weight: '',
      shipping_class: '',
      description: ''
    });
    setWeightUnit('kg');
    setDimensionUnit('cm');
    setValidationErrors({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
    setEditingPreset(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Product Dimensions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create reusable dimension presets to speed up product creation
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Preset
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Presets List */}
      {presets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No dimension presets found</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Your First Preset
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dimensions (L x W x H)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipping Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {presets.map((preset) => (
                <tr key={preset.preset_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{preset.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {preset.length_cm} × {preset.width_cm} × {preset.height_cm} cm
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{preset.weight_kg} kg</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {preset.shipping_class
                        ? shippingClasses.find(c => c.value === preset.shipping_class)?.label || preset.shipping_class
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {preset.description || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(preset)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(preset.preset_id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingPreset ? 'Edit Dimension Preset' : 'Create Dimension Preset'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Preset Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (validationErrors.name) {
                        setValidationErrors({ ...validationErrors, name: '' });
                      }
                    }}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      validationErrors.name ? 'border-red-300' : ''
                    }`}
                    placeholder="e.g., Shoes - Standard Size"
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
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
                        value={formData.length}
                        onChange={(e) => {
                          setFormData({ ...formData, length: e.target.value });
                          if (validationErrors.length) {
                            setValidationErrors({ ...validationErrors, length: '' });
                          }
                        }}
                        step="0.01"
                        min="0.01"
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                          validationErrors.length ? 'border-red-300' : ''
                        }`}
                        placeholder="Length"
                      />
                      {validationErrors.length && (
                        <p className="mt-1 text-xs text-red-600">{validationErrors.length}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="width" className="block text-xs text-gray-500 mb-1">
                        Width *
                      </label>
                      <input
                        type="number"
                        id="width"
                        value={formData.width}
                        onChange={(e) => {
                          setFormData({ ...formData, width: e.target.value });
                          if (validationErrors.width) {
                            setValidationErrors({ ...validationErrors, width: '' });
                          }
                        }}
                        step="0.01"
                        min="0.01"
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                          validationErrors.width ? 'border-red-300' : ''
                        }`}
                        placeholder="Width"
                      />
                      {validationErrors.width && (
                        <p className="mt-1 text-xs text-red-600">{validationErrors.width}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="height" className="block text-xs text-gray-500 mb-1">
                        Height *
                      </label>
                      <input
                        type="number"
                        id="height"
                        value={formData.height}
                        onChange={(e) => {
                          setFormData({ ...formData, height: e.target.value });
                          if (validationErrors.height) {
                            setValidationErrors({ ...validationErrors, height: '' });
                          }
                        }}
                        step="0.01"
                        min="0.01"
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                          validationErrors.height ? 'border-red-300' : ''
                        }`}
                        placeholder="Height"
                      />
                      {validationErrors.height && (
                        <p className="mt-1 text-xs text-red-600">{validationErrors.height}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <label htmlFor="dimensionUnit" className="block text-xs text-gray-500 mb-1">
                      Dimension Unit
                    </label>
                    <select
                      id="dimensionUnit"
                      value={dimensionUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value;
                        // Convert existing values when unit changes
                        if (formData.length && formData.width && formData.height) {
                          const lengthInCm = convertToBaseUnit(formData.length, dimensionUnit, dimensionUnits);
                          const widthInCm = convertToBaseUnit(formData.width, dimensionUnit, dimensionUnits);
                          const heightInCm = convertToBaseUnit(formData.height, dimensionUnit, dimensionUnits);
                          setFormData({
                            ...formData,
                            length: convertFromBaseUnit(lengthInCm, newUnit, dimensionUnits).toString(),
                            width: convertFromBaseUnit(widthInCm, newUnit, dimensionUnits).toString(),
                            height: convertFromBaseUnit(heightInCm, newUnit, dimensionUnits).toString()
                          });
                        }
                        setDimensionUnit(newUnit);
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      {dimensionUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                      value={formData.weight}
                      onChange={(e) => {
                        setFormData({ ...formData, weight: e.target.value });
                        if (validationErrors.weight) {
                          setValidationErrors({ ...validationErrors, weight: '' });
                        }
                      }}
                      step="0.001"
                      min="0.001"
                      className={`flex-1 rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        validationErrors.weight ? 'border-red-300' : ''
                      }`}
                      placeholder="Enter weight"
                    />
                    <select
                      value={weightUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value;
                        // Convert existing value when unit changes
                        if (formData.weight) {
                          const weightInKg = convertToBaseUnit(formData.weight, weightUnit, weightUnits);
                          setFormData({
                            ...formData,
                            weight: convertFromBaseUnit(weightInKg, newUnit, weightUnits).toString()
                          });
                        }
                        setWeightUnit(newUnit);
                      }}
                      className="rounded-r-md border-l-0 border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      {weightUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {validationErrors.weight && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.weight}</p>
                  )}
                </div>

                {/* Shipping Class */}
                <div>
                  <label htmlFor="shipping_class" className="block text-sm font-medium text-gray-700">
                    Shipping Class
                  </label>
                  <select
                    id="shipping_class"
                    value={formData.shipping_class}
                    onChange={(e) => setFormData({ ...formData, shipping_class: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="">Select shipping class (optional)</option>
                    {shippingClasses.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Optional description or notes"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : editingPreset ? 'Update Preset' : 'Create Preset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DimensionPresets;

