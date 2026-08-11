import React, { useState, useEffect } from 'react';
import { Store, Tag } from 'lucide-react';
import { Shop, ShopCategory, ShopBrand, shopManagementService } from '../../../../../services/shopManagementService';

interface BasicInfoStepProps {
  shop: Shop;
  category: ShopCategory;
  data: {
    product_name: string;
    sku: string;
    product_description: string;
    cost_price: number;
    selling_price: number;
    brand_id?: number;
  };
  onChange: (data: any) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  shop,
  category,
  data,
  onChange
}) => {
  const [brands, setBrands] = useState<ShopBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const brandsData = await shopManagementService.getBrandsByShopCategory(shop.shop_id, category.category_id);
      setBrands(brandsData);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSKU = (productName: string) => {
    const shopCode = `SH${shop.shop_id.toString().padStart(2, '0')}`;
    const categoryCode = category.name.substring(0, 3).toUpperCase();
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').substring(0, 12);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `${shopCode}-${categoryCode}-${timestamp}-${random}`;
  };

  const handleInputChange = (field: string, value: any) => {
    const newData = { ...data, [field]: value };
    
    // Auto-generate SKU when product name changes
    if (field === 'product_name' && value && !data.sku) {
      newData.sku = generateSKU(value);
    }
    
    // Clear errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    onChange(newData);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.product_name.trim()) newErrors.product_name = 'Product name is required';
    if (!data.sku.trim()) newErrors.sku = 'SKU is required';
    if (!data.product_description.trim()) newErrors.product_description = 'Description is required';
    if (data.cost_price <= 0) newErrors.cost_price = 'Cost price must be greater than 0';
    if (data.selling_price <= 0) newErrors.selling_price = 'Selling price must be greater than 0';
    if (data.selling_price <= data.cost_price) newErrors.selling_price = 'Selling price must be greater than cost price';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Store className="text-primary-500" size={32} />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Basic Product Information</h3>
        <p className="text-gray-600">Enter the essential details for your product</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Shop & Category Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Product Location</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Shop: </span>
              <span className="font-medium">{shop.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Category: </span>
              <span className="font-medium">{category.name}</span>
            </div>
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={data.product_name}
            onChange={(e) => handleInputChange('product_name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.product_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter product name"
          />
          {errors.product_name && <p className="text-red-500 text-xs mt-1">{errors.product_name}</p>}
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU *
            <span className="text-gray-500 font-normal">(Stock Keeping Unit)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.sku ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Auto-generated or enter custom SKU"
            />
            <Tag className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
          {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
        </div>

        {/* Brand Selection (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand (Optional)
          </label>
          <select
            value={data.brand_id || ''}
            onChange={(e) => handleInputChange('brand_id', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select a brand (optional)</option>
            {brands.map((brand) => (
              <option key={brand.brand_id} value={brand.brand_id}>
                {brand.name}
              </option>
            ))}
          </select>
          {loading && <p className="text-gray-500 text-xs mt-1">Loading brands...</p>}
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Description *
          </label>
          <textarea
            value={data.product_description}
            onChange={(e) => handleInputChange('product_description', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
              errors.product_description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Brief description of the product"
          />
          {errors.product_description && <p className="text-red-500 text-xs mt-1">{errors.product_description}</p>}
          <p className="text-gray-500 text-xs mt-1">This will be shown on product cards and used for meta description</p>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={data.cost_price || ''}
                onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 pl-8 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.cost_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              <span className="absolute left-2 top-2.5 text-gray-400 text-sm">₹</span>
            </div>
            {errors.cost_price && <p className="text-red-500 text-xs mt-1">{errors.cost_price}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={data.selling_price || ''}
                onChange={(e) => handleInputChange('selling_price', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 pl-8 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.selling_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              <span className="absolute left-2 top-2.5 text-gray-400 text-sm">₹</span>
            </div>
            {errors.selling_price && <p className="text-red-500 text-xs mt-1">{errors.selling_price}</p>}
          </div>
        </div>

        {/* Profit Margin Indicator */}
        {data.cost_price > 0 && data.selling_price > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-blue-700 font-medium">Profit Margin:</span>
              <span className={`font-semibold ${
                data.selling_price > data.cost_price ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{(data.selling_price - data.cost_price).toFixed(2)} 
                ({(((data.selling_price - data.cost_price) / data.cost_price) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicInfoStep;
