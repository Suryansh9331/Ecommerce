import React, { useState, useEffect } from 'react';
import ProductMediaUpload from './ProductMediaUpload';
import ShippingDetails from './ShippingDetails';
import ProductMeta from './ProductMeta';
import ProductVariants from './ProductVariants';
import AttributeSelection from './AttributeSelection';
import { CheckCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const labelClassName = "block text-sm font-medium text-gray-700";
const inputClassName = (hasError: boolean = false) => `mt-1 block w-full rounded-md ${hasError ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm`;
const errorTextClassName = "mt-1 text-sm text-red-600";
const sectionTitleClassName = "text-lg font-medium text-gray-900 mb-4";

interface VariantAttribute {
  name: string;
}

interface Variant {
  variant_id?: number;
  id: string;
  sku: string;
  price: string;
  stock: string;
  attributes: VariantAttribute[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CoreProductInfoProps {
  name: string;
  description: string;
  sku: string;
  costPrice: string;
  sellingPrice: string;
  categoryId: number | null;
  brandId: number | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_at?: string | null;
  approved_by?: number | null;
  rejection_reason?: string | null;
  onInfoChange: (field: string, value: string) => void;
  onProductCreated?: (productId: number) => void;
  errors?: {
    name?: string;
    description?: string;
    sku?: string;
    costPrice?: string;
    sellingPrice?: string;
    categoryId?: string;
    brandId?: string;
  };
}

const CoreProductInfo: React.FC<CoreProductInfoProps> = ({
  name,
  description,
  sku,
  costPrice,
  sellingPrice,
  categoryId,
  brandId,
  approval_status = 'pending',
  approved_at = null,
  approved_by = null,
  rejection_reason = null,
  onInfoChange,
  onProductCreated,
  errors = {},
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [categoryName, setCategoryName] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    sku?: string;
    costPrice?: string;
    sellingPrice?: string;
    categoryId?: string;
    brandId?: string;
  }>({});
  
  // Shipping state
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: ''
  });
  const [dimensionUnit, setDimensionUnit] = useState('cm');
  const [shippingClass, setShippingClass] = useState('');

  // Stock state
  const [stockQty, setStockQty] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('0');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockSuccess, setStockSuccess] = useState<string | null>(null);

  // Size-quantity state
  const [hasSize, setHasSize] = useState(false);
  const [sizeQuantities, setSizeQuantities] = useState<Array<{ size: string; quantity: string }>>([
    { size: '', quantity: '0' }
  ]);
  const [sizeAttributeId, setSizeAttributeId] = useState<number | null>(null);
  const [hasExistingVariants, setHasExistingVariants] = useState(false);

  // Meta state
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [productMedia, setProductMedia] = useState<{ url: string }[]>([]);

  // Variants state
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantErrors, setVariantErrors] = useState<{
    variants?: {
      [key: string]: {
        sku?: string;
        price?: string;
        stock?: string;
        attributes?: {
          [key: string]: string;
        };
      };
    };
  }>({});

  // Attributes state
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, string | string[]>>({});
  const [attributeErrors, setAttributeErrors] = useState<Record<string, any>>({});

  // Validation function
  const validateForm = () => {
    const newErrors: typeof validationErrors = {};

    // Name validation
    if (!name || name.trim().length === 0) {
      newErrors.name = 'Product name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    } else if (name.trim().length > 200) {
      newErrors.name = 'Product name must not exceed 200 characters';
    }

    // SKU validation
    if (!sku || sku.trim().length === 0) {
      newErrors.sku = 'SKU is required';
    } else if (sku.trim().length < 3) {
      newErrors.sku = 'SKU must be at least 3 characters';
    }

    // Cost price validation
    const cost = parseFloat(costPrice);
    if (!costPrice || costPrice.trim() === '') {
      newErrors.costPrice = 'Cost price is required';
    } else if (isNaN(cost)) {
      newErrors.costPrice = 'Cost price must be a valid number';
    } else if (cost < 0) {
      newErrors.costPrice = 'Cost price cannot be negative';
    } else if (cost === 0) {
      newErrors.costPrice = 'Cost price must be greater than 0';
    }

    // Selling price validation
    const selling = parseFloat(sellingPrice);
    if (!sellingPrice || sellingPrice.trim() === '') {
      newErrors.sellingPrice = 'Selling price is required';
    } else if (isNaN(selling)) {
      newErrors.sellingPrice = 'Selling price must be a valid number';
    } else if (selling < 0) {
      newErrors.sellingPrice = 'Selling price cannot be negative';
    } else if (selling === 0) {
      newErrors.sellingPrice = 'Selling price must be greater than 0';
    }

    // Category validation
    if (!categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    // Brand validation
    if (!brandId) {
      newErrors.brandId = 'Please select a brand';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid for submit button
  const isFormValid = () => {
    return (
      name.trim().length >= 3 &&
      sku.trim().length >= 3 &&
      parseFloat(costPrice) > 0 &&
      !isNaN(parseFloat(costPrice)) &&
      parseFloat(sellingPrice) > 0 &&
      !isNaN(parseFloat(sellingPrice)) &&
      categoryId !== null &&
      brandId !== null
    );
  };

  // Check if stock form is valid
  const isStockFormValid = () => {
    const stock = parseInt(stockQty);
    const threshold = parseInt(lowStockThreshold);
    return (
      productId !== null &&
      !isNaN(stock) &&
      stock >= 0 &&
      !isNaN(threshold) &&
      threshold >= 0
    );
  };

  useEffect(() => {
    const fetchCategoryName = async () => {
      if (categoryId) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/categories/${categoryId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            setCategoryName(data.name);
          }
        } catch (error) {
          console.error('Error fetching category name:', error);
        }
      } else {
        setCategoryName('');
      }
    };

    const fetchBrandName = async () => {
      if (brandId) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/brands/${brandId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            setBrandName(data.name);
          }
        } catch (error) {
          console.error('Error fetching brand name:', error);
        }
      } else {
        setBrandName('');
      }
    };

    fetchCategoryName();
    fetchBrandName();
  }, [categoryId, brandId]);

  // Check for existing variants when productId is available
  useEffect(() => {
    if (productId) {
      checkExistingVariants(productId);
    } else {
      setHasExistingVariants(false);
    }
  }, [productId]);

  // Check for Size attribute when category changes
  useEffect(() => {
    if (categoryId) {
      checkSizeAttribute(categoryId);
    } else {
      setSizeAttributeId(null);
    }
  }, [categoryId]);

  // Handle toggle change
  useEffect(() => {
    if (hasSize) {
      // When enabling, check if size attribute exists
      if (categoryId && !sizeAttributeId) {
        checkSizeAttribute(categoryId).then((attrId) => {
          if (!attrId) {
            setHasSize(false);
            setStockError('Size attribute not found for this category. Please contact admin to set it up.');
          }
        });
      }
    } else {
      // When disabling, reset size quantities
      setSizeQuantities([{ size: '', quantity: '0' }]);
    }
  }, [hasSize, categoryId, sizeAttributeId]);

  const generateSKU = (productName: string) => {
    if (!productName) return '';
    const cleanName = productName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .toUpperCase()
      .trim();
    const words = cleanName.split(/\s+/);
    const skuParts = words.map(word => word.slice(0, 3));
    const timestamp = Date.now().toString().slice(-4);
    return `${skuParts.join('-')}-${timestamp}`.slice(0, 20);
  };

  useEffect(() => {
    if (name && !sku) {
      const generatedSKU = generateSKU(name);
      onInfoChange('sku', generatedSKU);
    }
  }, [name]);

  useEffect(() => {
    const cost = parseFloat(costPrice) || 0;
    const selling = parseFloat(sellingPrice) || 0;
    
    if (cost > 0 && selling > 0 && selling < cost) {
      const calculatedDiscount = ((cost - selling) / cost) * 100;
      setDiscount(Math.round(calculatedDiscount * 100) / 100);
    } else {
      setDiscount(0);
    }
  }, [costPrice, sellingPrice]);

  // Check for Size attribute in category
  const checkSizeAttribute = async (categoryId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/categories/${categoryId}/attributes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const attributes = await response.json();
      const sizeAttribute = attributes.find((attr: any) => 
        attr.name && attr.name.toLowerCase() === 'size'
      );

      if (sizeAttribute) {
        setSizeAttributeId(sizeAttribute.attribute_id);
        return sizeAttribute.attribute_id;
      }
      return null;
    } catch (error) {
      console.error('Error checking size attribute:', error);
      return null;
    }
  };

  // Check if product has existing variants
  const checkExistingVariants = async (productId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${productId}/variants`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const variants = await response.json();
        setHasExistingVariants(variants && variants.length > 0);
        return variants && variants.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error checking existing variants:', error);
      return false;
    }
  };

  // Handle size-quantity changes
  const handleSizeQuantityChange = (index: number, field: 'size' | 'quantity', value: string) => {
    const updated = [...sizeQuantities];
    updated[index] = { ...updated[index], [field]: value };
    setSizeQuantities(updated);
    setStockError(null);
  };

  // Add new size-quantity row
  const addSizeQuantityRow = () => {
    setSizeQuantities([...sizeQuantities, { size: '', quantity: '0' }]);
  };

  // Remove size-quantity row
  const removeSizeQuantityRow = (index: number) => {
    if (sizeQuantities.length > 1) {
      setSizeQuantities(sizeQuantities.filter((_, i) => i !== index));
    }
  };

  // Validate size-quantity pairs
  const validateSizeQuantities = (): { valid: boolean; error?: string } => {
    if (!hasSize) {
      return { valid: true };
    }

    // Check for empty sizes
    const emptySizes = sizeQuantities.filter(sq => !sq.size.trim());
    if (emptySizes.length > 0) {
      return { valid: false, error: 'All sizes must be filled in' };
    }

    // Check for duplicate sizes
    const sizes = sizeQuantities.map(sq => sq.size.trim().toLowerCase());
    const uniqueSizes = new Set(sizes);
    if (sizes.length !== uniqueSizes.size) {
      return { valid: false, error: 'Duplicate sizes are not allowed' };
    }

    // Check for valid quantities
    const invalidQuantities = sizeQuantities.filter(sq => {
      const qty = parseInt(sq.quantity);
      return isNaN(qty) || qty < 0;
    });
    if (invalidQuantities.length > 0) {
      return { valid: false, error: 'All quantities must be valid non-negative numbers' };
    }

    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitError('Please fix all validation errors before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: name,
          product_description: description, 
          sku: sku,
          cost_price: parseFloat(costPrice) || 0,
          selling_price: parseFloat(sellingPrice) || 0,
          category_id: categoryId,
          brand_id: brandId,
          discount_percentage: discount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create product core info');
      }

      const data = await response.json();
      
      const newProductId = data.product_id;
      setProductId(newProductId);
      
      if (typeof onProductCreated === 'function') {
        onProductCreated(newProductId);
      }
      
      setValidationErrors({});
    } catch (error) {
      console.error('Error saving product core info:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save product core info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShippingChange = (field: string, value: string) => {
    switch (field) {
      case 'weight': setWeight(value); break;
      case 'weightUnit': setWeightUnit(value); break;
      case 'dimensionUnit': setDimensionUnit(value); break;
      case 'shippingClass': setShippingClass(value); break;
    }
  };

  const handleDimensionsChange = (field: string, value: string) => {
    setDimensions(prev => ({ ...prev, [field]: value }));
  };

  const handleMetaChange = (field: string, value: string) => {
    switch (field) {
      case 'metaTitle': setMetaTitle(value); break;
      case 'metaDescription': setMetaDescription(value); break;
      case 'metaKeywords': setMetaKeywords(value); break;
      case 'shortDescription': setShortDescription(value); break;
      case 'fullDescription': setFullDescription(value); break;
    }
  };

  const handleBulkSizeQuantityUpdate = async () => {
    if (!productId) {
      setStockError('Product ID is required to update stock. Save core product info first.');
      return;
    }

    // Validate size-quantity pairs
    const validation = validateSizeQuantities();
    if (!validation.valid) {
      setStockError(validation.error || 'Invalid size-quantity data');
      return;
    }

    if (!sizeAttributeId) {
      setStockError('Size attribute not found for this category. Please contact admin to set it up.');
      return;
    }

    try {
      setIsUpdatingStock(true);
      setStockError(null);
      setStockSuccess(null);
      
      const sizeQuantitiesData = sizeQuantities.map(sq => ({
        size: sq.size.trim(),
        quantity: parseInt(sq.quantity) || 0
      }));

      const requestData = {
        size_quantities: sizeQuantitiesData,
        low_stock_threshold: parseInt(lowStockThreshold) || 0
      };
      
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${productId}/size-quantities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create size variants');
      }
      
      const result = await response.json();
      setStockSuccess(`Successfully created ${result.variants?.length || sizeQuantitiesData.length} size variants!`);
      
      // Refresh variants list
      if (onProductCreated) {
        // Trigger variant refresh by calling the callback
        setTimeout(() => {
          window.location.reload(); // Simple refresh, or we could add a callback
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating size variants:', error);
      setStockError(error instanceof Error ? error.message : 'Failed to create size variants');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!productId) {
      setStockError('Product ID is required to update stock. Save core product info first.');
      return;
    }

    // If hasSize is enabled, use bulk size-quantity update
    if (hasSize) {
      await handleBulkSizeQuantityUpdate();
      return;
    }

    // Validate stock inputs
    const stock = parseInt(stockQty);
    const threshold = parseInt(lowStockThreshold);

    if (isNaN(stock) || stock < 0) {
      setStockError('Stock quantity must be a valid non-negative number');
      return;
    }

    if (isNaN(threshold) || threshold < 0) {
      setStockError('Low stock threshold must be a valid non-negative number');
      return;
    }

    try {
      setIsUpdatingStock(true);
      setStockError(null);
      setStockSuccess(null);
      
      const stockData = {
        stock_qty: stock,
        low_stock_threshold: threshold
      };
      
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update stock');
      }
      
      setStockSuccess('Stock updated successfully');
    } catch (error) {
      console.error('Error updating stock:', error);
      setStockError(error instanceof Error ? error.message : 'Failed to update stock');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleVariantsChange = (newVariants: Variant[]) => {
    setVariants(newVariants);
    setVariantErrors({});
  };

  const handleAttributeSelect = (attributeId: number, value: string | string[]) => {
    setSelectedAttributes(prev => ({ ...prev, [attributeId]: value }));
  };

  const ApprovalStatusDisplay = () => {
    const getStatusStyles = () => {
      switch (approval_status) {
        case 'approved':
          return 'bg-green-50 border-green-200 text-green-800';
        case 'rejected':
          return 'bg-red-50 border-red-200 text-red-800';
        case 'pending':
        default:
          return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      }
    };

    const getStatusText = () => {
      switch (approval_status) {
        case 'approved':
          return 'Approved';
        case 'rejected':
          return 'Rejected';
        case 'pending':
        default:
          return 'Pending Approval';
      }
    };

    return (
      <div className={`p-4 rounded-lg border ${getStatusStyles()}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Approval Status</h3>
            <p className="text-sm mt-1">{getStatusText()}</p>
            {approval_status === 'approved' && approved_at && (
              <p className="text-xs mt-1">Approved on: {new Date(approved_at).toLocaleDateString()}</p>
            )}
            {approval_status === 'rejected' && rejection_reason && (
              <p className="text-xs mt-1 text-red-600">Reason: {rejection_reason}</p>
            )}
          </div>
          {approval_status === 'rejected' && (
            <button
              onClick={() => {
                onInfoChange('approval_status', 'pending');
              }}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Resubmit for Approval
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <ApprovalStatusDisplay />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category and Brand Selection Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClassName}>Category *</label>
            <div className={`mt-1 flex items-center w-full rounded-md shadow-sm sm:text-sm p-2.5 border ${
                !categoryId ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-green-50 border-green-300 text-green-700'
              }`}>
              {categoryId ? <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" /> : <ShieldExclamationIcon className="h-5 w-5 mr-2 text-yellow-500" />}
              {categoryId ? `Category: ${categoryName}` : 'Please select a category'}
            </div>
            {(validationErrors.categoryId || errors.categoryId) && !categoryId && (
              <p className={errorTextClassName}>{validationErrors.categoryId || errors.categoryId}</p>
            )}
          </div>

          <div>
            <label className={labelClassName}>Brand *</label>
            <div className={`mt-1 flex items-center w-full rounded-md shadow-sm sm:text-sm p-2.5 border ${
                !brandId ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-green-50 border-green-300 text-green-700'
              }`}>
              {brandId ? <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" /> : <ShieldExclamationIcon className="h-5 w-5 mr-2 text-yellow-500" />}
              {brandId ? `Brand: ${brandName}` : 'Please select a brand'}
            </div>
            {(validationErrors.brandId || errors.brandId) && !brandId && (
              <p className={errorTextClassName}>{validationErrors.brandId || errors.brandId}</p>
            )}
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label htmlFor="name" className={labelClassName}>
            Product Name *
          </label>
          <input 
            type="text" 
            id="name" 
            value={name} 
            onChange={(e) => {
              onInfoChange('name', e.target.value);
              if (validationErrors.name) {
                const newErrors = { ...validationErrors };
                delete newErrors.name;
                setValidationErrors(newErrors);
              }
            }}
            onBlur={() => {
              if (!name.trim() || name.trim().length < 3) {
                setValidationErrors(prev => ({
                  ...prev,
                  name: !name.trim() ? 'Product name is required' : 'Product name must be at least 3 characters'
                }));
              }
            }}
            className={inputClassName(!!(validationErrors.name || errors.name))} 
            placeholder="e.g., Premium Cotton T-Shirt" 
            required
          />
          {(validationErrors.name || errors.name) && (
            <p className={errorTextClassName}>{validationErrors.name || errors.name}</p>
          )}
        </div>

        {/* SKU */}
        <div>
          <label htmlFor="sku" className={labelClassName}>
            SKU (Stock Keeping Unit) *
          </label>
          <input 
            type="text" 
            id="sku" 
            value={sku} 
            onChange={(e) => {
              onInfoChange('sku', e.target.value);
              if (validationErrors.sku) {
                const newErrors = { ...validationErrors };
                delete newErrors.sku;
                setValidationErrors(newErrors);
              }
            }}
            onBlur={() => {
              if (!sku.trim() || sku.trim().length < 3) {
                setValidationErrors(prev => ({
                  ...prev,
                  sku: !sku.trim() ? 'SKU is required' : 'SKU must be at least 3 characters'
                }));
              }
            }}
            className={`${inputClassName(!!(validationErrors.sku || errors.sku))} bg-gray-50`} 
            placeholder="e.g., TSHIRT-BLK-LG-001" 
            required
          />
          {(validationErrors.sku || errors.sku) && (
            <p className={errorTextClassName}>{validationErrors.sku || errors.sku}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Auto-generated if left empty, or you can provide your own.</p>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="costPrice" className={labelClassName}>
              Cost Price *
            </label>
            <input 
              type="number" 
              id="costPrice" 
              value={costPrice} 
              onChange={(e) => {
                onInfoChange('costPrice', e.target.value);
                if (validationErrors.costPrice) {
                  const newErrors = { ...validationErrors };
                  delete newErrors.costPrice;
                  setValidationErrors(newErrors);
                }
              }}
              onBlur={() => {
                const cost = parseFloat(costPrice);
                if (!costPrice || isNaN(cost) || cost <= 0) {
                  setValidationErrors(prev => ({
                    ...prev,
                    costPrice: !costPrice ? 'Cost price is required' : cost <= 0 ? 'Cost price must be greater than 0' : 'Cost price must be a valid number'
                  }));
                }
              }}
              step="0.01" 
              min="0.01" 
              className={inputClassName(!!(validationErrors.costPrice || errors.costPrice))} 
              placeholder="0.00" 
              required
            />
            {(validationErrors.costPrice || errors.costPrice) && (
              <p className={errorTextClassName}>{validationErrors.costPrice || errors.costPrice}</p>
            )}
          </div>
          <div>
            <label htmlFor="sellingPrice" className={labelClassName}>
              Selling Price *
            </label>
            <input 
              type="number" 
              id="sellingPrice" 
              value={sellingPrice} 
              onChange={(e) => {
                onInfoChange('sellingPrice', e.target.value);
                if (validationErrors.sellingPrice) {
                  const newErrors = { ...validationErrors };
                  delete newErrors.sellingPrice;
                  setValidationErrors(newErrors);
                }
              }}
              onBlur={() => {
                const selling = parseFloat(sellingPrice);
                if (!sellingPrice || isNaN(selling) || selling <= 0) {
                  setValidationErrors(prev => ({
                    ...prev,
                    sellingPrice: !sellingPrice ? 'Selling price is required' : selling <= 0 ? 'Selling price must be greater than 0' : 'Selling price must be a valid number'
                  }));
                }
              }}
              step="0.01" 
              min="0.01" 
              className={inputClassName(!!(validationErrors.sellingPrice || errors.sellingPrice))} 
              placeholder="0.00" 
              required
            />
            {(validationErrors.sellingPrice || errors.sellingPrice) && (
              <p className={errorTextClassName}>{validationErrors.sellingPrice || errors.sellingPrice}</p>
            )}
          </div>
        </div>

        {/* Discount Display */}
        {(parseFloat(costPrice) > 0 && parseFloat(sellingPrice) > 0) && (
          <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-700">
                Calculated {discount >= 0 ? 'Discount' : 'Markup'}
              </span>
              <span
                className={`text-lg font-semibold ${
                  discount >= 0
                    ? discount > 0
                      ? 'text-green-600'
                      : 'text-gray-600'
                    : 'text-red-600'
                }`}
              >
                {discount > 0
                  ? `${discount}%`
                  : discount < 0
                  ? `${Math.abs(discount)}% Markup`
                  : 'No discount/markup'}
              </span>
            </div>
            {discount !== 0 && (
              <p className="mt-1 text-sm text-orange-600">
                Based on cost price of ₹{parseFloat(costPrice).toFixed(2)} and selling
                price of ₹{parseFloat(sellingPrice).toFixed(2)}.
              </p>
            )}
          </div>
        )}

        {submitError && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid()}
            className="px-6 py-2.5 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isFormValid() ? 'Please fill all required fields correctly' : ''}
          >
            {isSubmitting ? 'Saving...' : approval_status === 'rejected' ? 'Resubmit Product' : 'Save Product'}
          </button>
        </div>
      </form>

      {/* Attribute Selection Section */}
      {categoryId && productId && (
        <div>
          <h2 className={sectionTitleClassName}>Product Attributes</h2>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <AttributeSelection
              categoryId={categoryId}
              productId={productId}
              selectedAttributes={selectedAttributes}
              onAttributeSelect={handleAttributeSelect}
              errors={attributeErrors}
            />
          </div>
        </div>
      )}

      {/* Other sections */}
      {productId && (
        <>
          <div>
            <h2 className={sectionTitleClassName}>Product Media</h2>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <ProductMediaUpload
                productId={productId}
                onMediaChange={(mediaFiles) => {
                  console.log('Media updated in Core:', mediaFiles);
                  setProductMedia(mediaFiles);
                }}
              />
            </div>
          </div>

          <div>
            <h2 className={sectionTitleClassName}>Shipping Details</h2>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <ShippingDetails
                productId={productId}
                weight={weight}
                weightUnit={weightUnit}
                dimensions={dimensions}
                dimensionUnit={dimensionUnit}
                shippingClass={shippingClass}
                onShippingChange={handleShippingChange}
                onDimensionsChange={handleDimensionsChange}
              />
            </div>
          </div>

          <div>
            <h2 className={sectionTitleClassName}>Stock Management</h2>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              {stockError && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{stockError}</p>
                </div>
              )}
              {stockSuccess && (
                <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700 text-sm">{stockSuccess}</p>
                </div>
              )}

              {/* Toggle for Has Size */}
              <div className="mb-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSize}
                    onChange={(e) => {
                      if (hasExistingVariants) {
                        setStockError('This product already has variants. Please manage them in the Variants section.');
                        return;
                      }
                      setHasSize(e.target.checked);
                      setStockError(null);
                    }}
                    disabled={hasExistingVariants}
                    className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className={`text-sm font-medium text-gray-700 ${hasExistingVariants ? 'text-gray-400' : ''}`}>
                    This product has sizes (e.g., S, M, L, XL)
                  </span>
                </label>
                {hasExistingVariants && (
                  <p className="mt-2 text-sm text-gray-500">
                    This product already has variants. Please manage them in the Variants section.
                  </p>
                )}
              </div>

              {hasSize ? (
                /* Size-Quantity Matrix */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900">Size & Quantity</h3>
                  </div>
                  
                  {sizeQuantities.map((sq, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Size
                        </label>
                        <input
                          type="text"
                          value={sq.size}
                          onChange={(e) => handleSizeQuantityChange(index, 'size', e.target.value)}
                          placeholder="e.g., S, M, L, XL, 8, 10"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={sq.quantity}
                          onChange={(e) => handleSizeQuantityChange(index, 'quantity', e.target.value)}
                          min="0"
                          placeholder="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        {sizeQuantities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSizeQuantityRow(index)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove this size"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addSizeQuantityRow}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Size
                  </button>

                  <div className="mt-4">
                    <label htmlFor="low_stock_threshold_size" className={labelClassName}>
                      Low Stock Threshold *
                    </label>
                    <input 
                      type="number" 
                      id="low_stock_threshold_size" 
                      value={lowStockThreshold} 
                      onChange={(e) => {
                        setLowStockThreshold(e.target.value);
                        setStockError(null);
                      }}
                      min="0" 
                      className={inputClassName()} 
                      required
                    />
                  </div>
                </div>
              ) : (
                /* Regular Stock Input */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="stock_qty" className={labelClassName}>
                      Stock Quantity *
                    </label>
                    <input 
                      type="number" 
                      id="stock_qty" 
                      value={stockQty} 
                      onChange={(e) => {
                        setStockQty(e.target.value);
                        setStockError(null);
                      }}
                      min="0" 
                      className={inputClassName()} 
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="low_stock_threshold" className={labelClassName}>
                      Low Stock Threshold *
                    </label>
                    <input 
                      type="number" 
                      id="low_stock_threshold" 
                      value={lowStockThreshold} 
                      onChange={(e) => {
                        setLowStockThreshold(e.target.value);
                        setStockError(null);
                      }}
                      min="0" 
                      className={inputClassName()} 
                      required
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUpdateStock}
                  disabled={isUpdatingStock || (hasSize ? !validateSizeQuantities().valid : !isStockFormValid())}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={hasSize ? (!validateSizeQuantities().valid ? validateSizeQuantities().error : '') : (!isStockFormValid() ? 'Please enter valid stock values' : '')}
                >
                  {isUpdatingStock ? (hasSize ? 'Creating Variants...' : 'Updating Stock...') : (hasSize ? 'Create Size Variants' : 'Update Stock')}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className={sectionTitleClassName}>Detailed Descriptions & SEO</h2>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <ProductMeta
                productId={productId}
                productName={name}
                productImages={productMedia.map(m => m.url)}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                metaKeywords={metaKeywords}
                shortDescription={shortDescription}
                fullDescription={fullDescription}
                onMetaChange={handleMetaChange}
              />
            </div>
          </div>
          
          <div>
            <h2 className={sectionTitleClassName}>Product Variants</h2>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <ProductVariants
                productId={productId}
                variants={variants}
                onVariantsChange={handleVariantsChange}
                errors={variantErrors}
                categoryId={categoryId}
                baseSku={sku}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CoreProductInfo;