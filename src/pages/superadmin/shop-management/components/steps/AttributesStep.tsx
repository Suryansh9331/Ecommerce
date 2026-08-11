import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle } from 'lucide-react';
import { shopManagementService, ShopAttribute } from '../../../../../services/shopManagementService';

interface AttributesStepProps {
  shopId: number;
  categoryId: number;
  data: Array<{
    attribute_id: number;
    value: string | number | boolean;
  }>;
  onChange: (attributes: Array<{ attribute_id: number; value: string | number | boolean }>) => void;
}

const AttributesStep: React.FC<AttributesStepProps> = ({
  shopId,
  categoryId,
  data,
  onChange
}) => {
  const [attributes, setAttributes] = useState<ShopAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchAttributes();
  }, [shopId, categoryId]);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      
      // Use getActiveAttributesByShopCategory to only show active attributes for product creation
      const attributes = await shopManagementService.getActiveAttributesByShopCategory(shopId, categoryId);
      setAttributes(attributes);
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeChange = (attributeId: number, value: string | number | boolean) => {
    const updatedData = [...data];
    const existingIndex = updatedData.findIndex(item => item.attribute_id === attributeId);
    
    if (existingIndex >= 0) {
      updatedData[existingIndex] = { attribute_id: attributeId, value };
    } else {
      updatedData.push({ attribute_id: attributeId, value });
    }
    
    // Clear error for this attribute
    if (errors[attributeId]) {
      setErrors(prev => ({ ...prev, [attributeId]: '' }));
    }
    
    onChange(updatedData);
  };

  const getAttributeValue = (attributeId: number) => {
    const item = data.find(item => item.attribute_id === attributeId);
    return item?.value || '';
  };

  const validateForm = () => {
    const newErrors: Record<number, string> = {};
    
    attributes.forEach(attribute => {
      if (attribute.is_required) {
        const value = getAttributeValue(attribute.attribute_id);
        if (!value || value === '') {
          newErrors[attribute.attribute_id] = `${attribute.name} is required`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderAttributeInput = (attribute: ShopAttribute) => {
    const value = getAttributeValue(attribute.attribute_id);
    const hasError = !!errors[attribute.attribute_id];

    switch (attribute.attribute_type?.toLowerCase()) {
      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => handleAttributeChange(attribute.attribute_id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select {attribute.name}</option>
            {attribute.values?.map((attrValue) => (
              <option key={attrValue.value_id} value={attrValue.value}>
                {attrValue.value}
              </option>
            ))}
          </select>
        );
        
      case 'multiselect':
        return (
          <div className="space-y-2">
            {attribute.values?.map((attrValue) => (
              <label key={attrValue.value_id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(value as string)?.split(',').includes(attrValue.value) || false}
                  onChange={(e) => {
                    const currentValues = (value as string)?.split(',').filter(v => v) || [];
                    let newValues;
                    
                    if (e.target.checked) {
                      newValues = [...currentValues, attrValue.value];
                    } else {
                      newValues = currentValues.filter(v => v !== attrValue.value);
                    }
                    
                    handleAttributeChange(attribute.attribute_id, newValues.join(','));
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{attrValue.value}</span>
              </label>
            ))}
          </div>
        );
        
      case 'number':
        return (
          <input
            type="number"
            value={value as number || ''}
            onChange={(e) => handleAttributeChange(attribute.attribute_id, parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={`Enter ${attribute.name}`}
          />
        );
        
      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={`attribute_${attribute.attribute_id}`}
                checked={value === true || value === 'true'}
                onChange={() => handleAttributeChange(attribute.attribute_id, true)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`attribute_${attribute.attribute_id}`}
                checked={value === false || value === 'false' || value === ''}
                onChange={() => handleAttributeChange(attribute.attribute_id, false)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        );
        
      default: // text
        return (
          <input
            type="text"
            value={value as string || ''}
            onChange={(e) => handleAttributeChange(attribute.attribute_id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={`Enter ${attribute.name}`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Settings className="text-primary-500" size={32} />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Product Attributes</h3>
        <p className="text-gray-600">Define the specifications and characteristics of your product</p>
      </div>

      {/* Attributes Form */}
      <div className="max-w-2xl mx-auto">
        {attributes.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No attributes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              This category doesn't have any attributes configured. You can skip this step.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {attributes.map((attribute) => (
              <div key={attribute.attribute_id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {attribute.name}
                  {attribute.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {renderAttributeInput(attribute)}
                
                {errors[attribute.attribute_id] && (
                  <p className="text-red-500 text-xs">{errors[attribute.attribute_id]}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttributesStep;
