import React, { useState, useEffect } from 'react';
import { Save, X, Package, Settings } from 'lucide-react';
import { ShopProduct, shopManagementService, ShopAttribute } from '../../../../services/shopManagementService';
import { useToastHelpers } from '../../../../context/ToastContext';

interface VariantEditFormProps {
  variant: ShopProduct;
  onComplete: () => void;
  onCancel: () => void;
}

const VariantEditForm: React.FC<VariantEditFormProps> = ({
  variant,
  onComplete,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState<ShopAttribute[]>([]);
  const [variantRelation, setVariantRelation] = useState<any>(null);
  const [formData, setFormData] = useState({
    sku: variant.sku || '',
    selling_price: variant.selling_price || 0,
    cost_price: variant.cost_price || 0,
    stock_qty: variant.stock?.stock_qty || 0,
    low_stock_threshold: variant.stock?.low_stock_threshold || 5,
    attributes: {} as Record<string, any>,
    is_active: variant.active_flag ?? true
  });
  const { showSuccess, showError } = useToastHelpers();

  const generateVariantSKU = (parentSku: string, attributes: Record<string, any>): string => {
    if (!parentSku || !Object.keys(attributes).length) return '';
    
    const attrCodes = Object.entries(attributes).map(([attrName, attrValue]) => {
      const cleanAttrName = attrName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
      const cleanAttrValue = String(attrValue).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
      return `${cleanAttrName}${cleanAttrValue}`;
    }).join('-');
    
    return `${parentSku}-${attrCodes}`;
  };

  useEffect(() => {
    fetchVariantDetails();
  }, [variant]);

  // Regenerate SKU when attributes change
  useEffect(() => {
    if (variant.parent_product_id && variantRelation && Object.keys(formData.attributes).length > 0) {
      // Get parent SKU - we'll need to fetch parent product details for this
      // For now, we'll extract it from current SKU by removing the suffix
      const currentSku = formData.sku;
      const parentSku = currentSku.split('-')[0]; // Assume parent SKU is before the first dash
      const newSku = generateVariantSKU(parentSku, formData.attributes);
      if (newSku !== currentSku) {
        setFormData(prev => ({ ...prev, sku: newSku }));
      }
    }
  }, [formData.attributes, variant.parent_product_id, variantRelation]);

  const fetchVariantDetails = async () => {
    try {
      // Fetch variant details including relation data
      const variantData = await shopManagementService.getVariantDetails(variant.product_id);
      setVariantRelation(variantData.variantRelation);
      
      // Load attributes from variant relation's attribute_combination
      if (variantData.variantRelation?.attribute_combination) {
        setFormData(prev => ({ 
          ...prev, 
          attributes: variantData.variantRelation.attribute_combination 
        }));
      }
      
      // Fetch available attributes for this category
      await fetchAttributes();
    } catch (error) {
      console.error('Error fetching variant details:', error);
      showError('Failed to load variant details');
    }
  };

  const fetchAttributes = async () => {
    try {
      const response = await shopManagementService.getActiveAttributesByShopCategory(
        variant.shop_id, 
        variant.category_id
      );
      setAttributes(response);
    } catch (error) {
      console.error('Error fetching attributes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selling_price) {
      showError('Selling price is required');
      return;
    }

    // Ensure SKU is generated if attributes exist
    let finalSku = formData.sku;
    if (!finalSku && Object.keys(formData.attributes).length > 0) {
      const currentSku = variant.sku;
      const parentSku = currentSku.split('-')[0];
      finalSku = generateVariantSKU(parentSku, formData.attributes);
    }

    try {
      setLoading(true);
      
      // Update the variant product itself
      await shopManagementService.updateProduct(variant.product_id, {
        sku: finalSku || formData.sku,
        selling_price: formData.selling_price,
        cost_price: formData.cost_price,
        active_flag: formData.is_active
      });

      // Update stock separately
      await shopManagementService.updateProductStock(variant.product_id, {
        stock_qty: formData.stock_qty,
        low_stock_threshold: formData.low_stock_threshold
      });

      // Update variant attributes if variantRelation exists
      if (variantRelation?.variant_id) {
        await shopManagementService.updateVariantAttributes(variantRelation.variant_id, formData.attributes);
      }

      showSuccess('Variant updated successfully');
      onComplete();
    } catch (error: any) {
      showError(error.message || 'Failed to update variant');
    } finally {
      setLoading(false);
    }
  };

  const renderAttributeInput = (attribute: ShopAttribute) => {
    const value = formData.attributes[attribute.name] || '';
    
    switch (attribute.attribute_type?.toLowerCase()) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              attributes: { ...prev.attributes, [attribute.name]: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">Select {attribute.name}</option>
            {attribute.values?.map((val) => (
              <option key={val.value_id} value={val.value}>
                {val.value}
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
                    
                    setFormData(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, [attribute.name]: newValues.join(',') }
                    }));
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
            value={value}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              attributes: { ...prev.attributes, [attribute.name]: parseFloat(e.target.value) || 0 }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={`Enter ${attribute.name}`}
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={`edit-${attribute.name}`}
                checked={value === true}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  attributes: { ...prev.attributes, [attribute.name]: true }
                }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`edit-${attribute.name}`}
                checked={value === false}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  attributes: { ...prev.attributes, [attribute.name]: false }
                }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              attributes: { ...prev.attributes, [attribute.name]: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={`Enter ${attribute.name}`}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Variant</h2>
            <p className="text-gray-600 mt-1">
              {variant.product_name} • SKU: {variant.sku}
            </p>
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full mt-2">
              <Package size={12} className="mr-1" />
              Variant Product
            </span>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Variant Info */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="mr-2 text-purple-500" size={20} />
                Variant Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU * (Generated from attributes)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    SKU is auto-generated based on variant attributes
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stock Management */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="mr-2 text-blue-500" size={20} />
                Stock Management
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stock_qty}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_qty: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Variant Attributes */}
            {attributes.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="mr-2 text-green-500" size={20} />
                  Variant Attributes
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attributes.map((attribute) => (
                    <div key={attribute.attribute_id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {attribute.name}
                        {attribute.is_required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderAttributeInput(attribute)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Variant Product Editing
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      This is a variant product. You can only edit variant-specific details like SKU, prices, stock, and attributes. 
                      Other details like product name, description, shipping, and meta information are inherited from the parent product.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.selling_price}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save size={16} />
                )}
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VariantEditForm;
