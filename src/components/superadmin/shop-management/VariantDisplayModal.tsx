import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Package, Save, Settings } from 'lucide-react';
import { ShopProduct, shopManagementService, ShopAttribute } from '../../../services/shopManagementService';
import { useToastHelpers } from '../../../context/ToastContext';

interface VariantDisplayModalProps {
  product: ShopProduct;
  onClose: () => void;
  onRefresh: () => void;
}

interface Variant {
  variant_id: number;
  parent_product_id: number;
  variant_product_id: number;
  variant_sku: string;
  variant_name?: string;
  attribute_combination: Record<string, any>;
  price_override?: number;
  cost_override?: number;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
  effective_price: number;
  effective_cost: number;
  has_variant_specific_media: boolean;
  media_count: number;
  stock?: {
    stock_qty: number;
    low_stock_threshold: number;
    product_id: number;
  };
  media?: Array<{
    media_id: number;
    type: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
    file_name?: string;
    file_size?: number;
  }>;
  primary_media?: {
    media_id: number;
    type: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
    file_name?: string;
    file_size?: number;
  };
}

interface VariantFormData {
  sku: string;
  selling_price: number;
  cost_price: number;
  stock_qty: number;
  low_stock_threshold: number;
  attributes: Record<string, any>;
  is_default: boolean;
}

const VariantDisplayModal: React.FC<VariantDisplayModalProps> = ({
  product,
  onClose,
  onRefresh
}) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [attributes, setAttributes] = useState<ShopAttribute[]>([]);
  const [formData, setFormData] = useState<VariantFormData>({
    sku: '',
    selling_price: product.selling_price,
    cost_price: product.cost_price,
    stock_qty: 0,
    low_stock_threshold: 5,
    attributes: {},
    is_default: false
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
    if (showCreateForm && Object.keys(formData.attributes).length > 0) {
      const generatedSku = generateVariantSKU(product.sku, formData.attributes);
      setFormData(prev => ({ ...prev, sku: generatedSku }));
    }
  }, [formData.attributes, product.sku, showCreateForm]);

  useEffect(() => {
    fetchVariants();
    fetchAttributes();
  }, [product.product_id]);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const response = await shopManagementService.getProductVariants(product.product_id);
      console.log('Variants response:', response); // Debug log
      
      // Handle different response structures
      let variants = [];
      if (response.variants) {
        variants = response.variants;
      } else if (response.message && response.message.variants) {
        variants = response.message.variants;
      } else if (response.data && response.data.variants) {
        variants = response.data.variants;
      }
      
      setVariants(variants);
    } catch (error) {
      showError('Failed to fetch variants');
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttributes = async () => {
    try {
      const response = await shopManagementService.getActiveAttributesByShopCategory(
        product.shop_id, 
        product.category_id
      );
      setAttributes(response);
    } catch (error) {
      console.error('Error fetching attributes:', error);
    }
  };

  const handleCreateVariant = async () => {
    // Validate that we have attributes to generate SKU
    if (Object.keys(formData.attributes).length === 0) {
      showError('Please select at least one attribute to create a variant');
      return;
    }

    // Generate final SKU if not already done
    const finalSku = formData.sku || generateVariantSKU(product.sku, formData.attributes);
    
    if (!finalSku || !formData.selling_price) {
      showError('SKU generation failed or selling price is missing');
      return;
    }

    try {
      const variantData = {
        sku: finalSku,
        selling_price: formData.selling_price,
        cost_price: formData.cost_price,
        stock_qty: formData.stock_qty,
        low_stock_threshold: formData.low_stock_threshold,
        attributes: formData.attributes,
        is_default: formData.is_default
      };

      await shopManagementService.createVariant(product.product_id, variantData);
      showSuccess('Variant created successfully');
      
      // Reset form and refresh
      setFormData({
        sku: '',
        selling_price: product.selling_price,
        cost_price: product.cost_price,
        stock_qty: 0,
        low_stock_threshold: 5,
        attributes: {},
        is_default: false
      });
      setShowCreateForm(false);
      fetchVariants();
      onRefresh();
    } catch (error: any) {
      showError(error.message || 'Failed to create variant');
    }
  };

  const handleUpdateVariant = async (variantId: number, updateData: any) => {
    try {
      await shopManagementService.updateVariant(variantId, updateData);
      showSuccess('Variant updated successfully');
      fetchVariants();
      onRefresh();
    } catch (error: any) {
      showError(error.message || 'Failed to update variant');
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;
    
    try {
      await shopManagementService.deleteVariant(variantId);
      showSuccess('Variant deleted successfully');
      fetchVariants();
      onRefresh();
    } catch (error: any) {
      showError(error.message || 'Failed to delete variant');
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
                name={`create-${attribute.name}`}
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
                name={`create-${attribute.name}`}
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Variants</h2>
            <p className="text-gray-600 mt-1">
              {product.product_name} • SKU: {product.sku}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Variant</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showCreateForm && (
            <div className="bg-gradient-to-br from-primary-50 to-amber-50 border border-primary-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Plus className="mr-2 text-primary-500" size={20} />
                  Create New Variant
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Basic Information */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Package className="mr-2 text-blue-500" size={16} />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU * (Auto-generated)
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder="Will be generated from attributes"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      SKU will be auto-generated based on parent SKU and variant attributes
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
                        placeholder="0.00"
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
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.stock_qty}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock_qty: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 5 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="5"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_default}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Set as default variant</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Attributes */}
              {attributes.length > 0 ? (
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <Settings className="mr-2 text-green-500" size={16} />
                    Variant Attributes
                  </h4>
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
                  {Object.keys(formData.attributes).length === 0 && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Note:</strong> Please select values for at least one attribute to generate a unique variant SKU.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No attributes available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create some attributes for this category first to add variants.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVariant}
                  disabled={Object.keys(formData.attributes).length === 0 || !formData.selling_price}
                  className="bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-600 hover:to-amber-600 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Save size={16} />
                  <span>Create Variant</span>
                </button>
              </div>
            </div>
          )}

          {/* Variants List */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Variants Found</h3>
              <p className="text-gray-600 mb-4">This product doesn't have any variants yet.</p>
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg"
                >
                  Create First Variant
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant) => (
                <div key={variant.variant_id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {variant.variant_name || `Variant ${variant.variant_id}`}
                        </h4>
                        {variant.is_default && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          variant.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {variant.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">SKU: {variant.variant_sku}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <span className="text-xs text-gray-500">Selling Price</span>
                          <p className="font-medium">₹{variant.effective_price}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Cost Price</span>
                          <p className="font-medium">₹{variant.effective_cost}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Stock</span>
                          <p className="font-medium">{variant.stock?.stock_qty || 0}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Low Stock Alert</span>
                          <p className="font-medium">{variant.stock?.low_stock_threshold || 0}</p>
                        </div>
                      </div>
                      
                      {/* Attributes */}
                      {variant.attribute_combination && Object.keys(variant.attribute_combination).length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs text-gray-500">Attributes:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Object.entries(variant.attribute_combination).map(([key, value]) => (
                              <span key={key} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setEditingVariant(variant)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Variant"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteVariant(variant.variant_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Variant"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VariantDisplayModal;
