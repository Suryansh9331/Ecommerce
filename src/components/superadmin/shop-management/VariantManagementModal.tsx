import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, DollarSign, Package, Save } from 'lucide-react';
import { Product } from '../../../types';
import { ShopAttribute, shopManagementService } from '../../../services/shopManagementService';
import { cloudinaryService, UploadProgress } from '../../../services/cloudinaryService';
import { useToast } from '../../../hooks/useToast';
import { ToastContainer } from '../../ui/ToastContainer';
interface VariantMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  isPrimary: boolean;
  file?: File;
  previewUrl?: string;
}

interface ProductVariant {
  id: string;
  productId: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  compareAtPrice: number;
  stock: number;
  lowStockThreshold: number;
  media: VariantMedia[];
  attributes: Record<string, string>;
  isActive: boolean;
}

interface VariantManagementModalProps {
  product: Product;
  shopId: number;
  categoryId: number;
  onComplete: () => void;
  onCancel: () => void;
}

const VariantManagementModal: React.FC<VariantManagementModalProps> = ({
  product,
  shopId,
  categoryId,
  onComplete,
  onCancel,
}) => {
  const [attributes, setAttributes] = useState<ShopAttribute[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  // Media validation constants
  const MAX_IMAGES = 4;
  const MAX_VIDEOS = 1;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/avi'];
const { toasts, error: showError, warning } = useToast();
  useEffect(() => {
    // Fetch shop attributes and existing variants
    if (shopId && categoryId) {
      fetchShopAttributes();
    }
    fetchProductVariants();
  }, [product.id, shopId, categoryId]);

  const fetchShopAttributes = async () => {
    try {
      setAttributesLoading(true);
      // Use getActiveAttributesByShopCategory to only show active attributes
      const data = await shopManagementService.getActiveAttributesByShopCategory(shopId, categoryId);
      setAttributes(data);
    } catch (error) {
      console.error('Error fetching shop attributes:', error);
    } finally {
      setAttributesLoading(false);
    }
  };

  const fetchProductVariants = async () => {
    try {
      setIsLoading(true);
      const response = await shopManagementService.getProductVariants(product.id);
      
      if (response && response.length > 0) {
        // Transform backend variant data to match our interface
        const transformedVariants = await Promise.all(
          response.map(async (variant: any) => {
            // Fetch media for each variant
            let variantMedia: VariantMedia[] = [];
            try {
              const mediaResponse = await shopManagementService.getVariantMedia(variant.variant_id);
              variantMedia = mediaResponse.map((media: any) => ({
                id: media.media_id.toString(),
                type: media.type as 'image' | 'video',
                url: media.url,
                isPrimary: media.is_primary || false
              }));
            } catch (error) {
              console.error(`Error fetching media for variant ${variant.variant_id}:`, error);
            }

            return {
              id: variant.variant_id.toString(),
              productId: product.id,
              name: variant.name || `Variant ${variant.variant_id}`,
              description: variant.description || '',
              sku: variant.sku,
              price: parseFloat(variant.selling_price) || 0,
              compareAtPrice: parseFloat(variant.cost_price) || 0,
              stock: variant.stock_qty || 0,
              lowStockThreshold: variant.low_stock_threshold || 5,
              media: variantMedia,
              attributes: variant.attribute_combination || {},
              isActive: variant.is_active !== false
            };
          })
        );
        
        setVariants(transformedVariants);
      } else {
        setVariants([]);
      }
    } catch (error) {
      console.error('Error fetching product variants:', error);
      setVariants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSKU = (baseProductName: string, variantAttributes: Record<string, string>) => {
    const baseSKU = baseProductName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 6)
      .toUpperCase();
    
    const attributePart = Object.values(variantAttributes)
      .map(value => value.substring(0, 3).toUpperCase())
      .join('');
    
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `${baseSKU}-${attributePart}-${randomSuffix}`;
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `temp-${Date.now()}`,
      productId: product.id!,
      name: '',
      description: '',
      sku: '',
      price: 0,
      compareAtPrice: 0,
      stock: 0,
      lowStockThreshold: 5,
      media: [],
      attributes: {},
      isActive: true,
    };
    setVariants([...variants, newVariant]);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value,
    };

    // Auto-generate SKU when attributes change
    if (field === 'attributes' || field === 'name') {
      const variant = updatedVariants[index];
      if (variant.name && Object.keys(variant.attributes).length > 0) {
        updatedVariants[index].sku = generateSKU(variant.name, variant.attributes);
      }
    }

    setVariants(updatedVariants);
  };

  const updateVariantAttribute = (variantIndex: number, attributeId: string, value: string) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].attributes = {
      ...updatedVariants[variantIndex].attributes,
      [attributeId]: value,
    };

    // Auto-generate SKU
    const variant = updatedVariants[variantIndex];
    if (variant.name && Object.keys(variant.attributes).length > 0) {
      updatedVariants[variantIndex].sku = generateSKU(variant.name, variant.attributes);
    }

    setVariants(updatedVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const validateFile = (file: File, variantIndex: number): string | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    const variant = variants[variantIndex];
    const imageCount = variant.media.filter((m: any) => m.type === 'image').length;
    const videoCount = variant.media.filter((m: any) => m.type === 'video').length;

    if (!isImage && !isVideo) {
      return 'Only image and video files are allowed';
    }

    if (isImage) {
      if (imageCount >= MAX_IMAGES) {
        return `Maximum ${MAX_IMAGES} images allowed`;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Invalid image format. Please use JPEG, PNG, SVG, or WebP';
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return 'Image size must be less than 5MB';
      }
    }

    if (isVideo) {
      if (videoCount >= MAX_VIDEOS) {
        return `Maximum ${MAX_VIDEOS} video allowed`;
      }
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return 'Invalid video format. Please use MP4, MOV, or AVI';
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return 'Video size must be less than 50MB';
      }
    }

    return null;
  };

  const handleImageUpload = async (variantIndex: number, files: File[]) => {
    const newErrors: string[] = [];
    const validFiles: File[] = [];
    
    // Validate all files first
    files.forEach(file => {
      const validationError = validateFile(file, variantIndex);
      if (validationError) {
        newErrors.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    });

    if (newErrors.length > 0) {
      showError(newErrors.join(' • '));
      return;
    }

    if (validFiles.length === 0) return;

    const updatedVariants = [...variants];
    
    try {
      // Create preview media items first
      const previewMediaItems: VariantMedia[] = validFiles.map((file) => {
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        const isPrimary = type === 'image' && updatedVariants[variantIndex].media.filter(m => m.type === 'image').length === 0;
        
        return {
          id: `temp-${Date.now()}-${Math.random()}`,
          type: type as 'image' | 'video',
          url: '', // Will be filled after upload
          isPrimary,
          file,
          previewUrl: cloudinaryService.generatePreviewUrl(file)
        };
      });

      // Add preview items to variant
      updatedVariants[variantIndex].media = [
        ...updatedVariants[variantIndex].media,
        ...previewMediaItems
      ];
      setVariants(updatedVariants);

      // Upload files to Cloudinary
      const uploadResults = await cloudinaryService.uploadMultipleFiles(
        validFiles,
        'product-variants',
        setUploadProgress
      );

      // Update media items with Cloudinary URLs
      const updatedVariantsAfterUpload = [...variants];
      previewMediaItems.forEach((previewItem, index) => {
        const result = uploadResults[index];
        const mediaIndex = updatedVariantsAfterUpload[variantIndex].media.findIndex(m => m.id === previewItem.id);
        
        if (mediaIndex !== -1) {
          // Clean up preview URL
          if (previewItem.previewUrl) {
            cloudinaryService.revokePreviewUrl(previewItem.previewUrl);
          }
          
          updatedVariantsAfterUpload[variantIndex].media[mediaIndex] = {
            ...previewItem,
            url: result.secure_url,
            previewUrl: undefined
          };
        }
      });

      setVariants(updatedVariantsAfterUpload);
      
    } catch (error: any) {
     showError(`Upload failed: ${error.message || 'Unknown error'}`);
      
      // Remove failed uploads from state
      const cleanedVariants = [...variants];
      cleanedVariants[variantIndex].media = cleanedVariants[variantIndex].media.filter(
        media => !validFiles.some(file => media.file === file)
      );
      setVariants(cleanedVariants);
    }
  };

  const removeImage = (variantIndex: number, imageIndex: number) => {
    const updatedVariants = [...variants];
    const mediaToRemove = updatedVariants[variantIndex].media[imageIndex];
    
    // Cleanup preview URL if it exists
    if (mediaToRemove.previewUrl) {
      cloudinaryService.revokePreviewUrl(mediaToRemove.previewUrl);
    }
    
    updatedVariants[variantIndex].media = updatedVariants[variantIndex].media.filter(
      (_: any, i: number) => i !== imageIndex
    );
    setVariants(updatedVariants);
  };

  const renderAttributeInput = (attribute: ShopAttribute, variant: ProductVariant, variantIndex: number) => {
    const value = variant.attributes[attribute.attribute_id.toString()] || '';

    switch (attribute.attribute_type?.toLowerCase()) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateVariantAttribute(variantIndex, attribute.attribute_id.toString(), e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
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
                  checked={value.split(',').includes(attrValue.value)}
                  onChange={(e) => {
                    const currentValues = value.split(',').filter((v: string) => v);
                    let newValues;
                    
                    if (e.target.checked) {
                      newValues = [...currentValues, attrValue.value];
                    } else {
                      newValues = currentValues.filter((v: string) => v !== attrValue.value);
                    }
                    
                    updateVariantAttribute(variantIndex, attribute.attribute_id.toString(), newValues.join(','));
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
            onChange={(e) => updateVariantAttribute(variantIndex, attribute.attribute_id.toString(), e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            placeholder={`Enter ${attribute.name}`}
          />
        );
        
      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={`attribute_${variantIndex}_${attribute.attribute_id}`}
                checked={value === 'true'}
                onChange={() => updateVariantAttribute(variantIndex, attribute.attribute_id.toString(), 'true')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`attribute_${variantIndex}_${attribute.attribute_id}`}
                checked={value === 'false' || value === ''}
                onChange={() => updateVariantAttribute(variantIndex, attribute.attribute_id.toString(), 'false')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        );
        
      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateVariantAttribute(variantIndex, attribute.attribute_id.toString(), e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            placeholder={`Enter ${attribute.name}`}
          />
        );
    }
  };

  const saveVariants = async () => {
    setIsLoading(true);
    try {
      // Validate variants
      for (const variant of variants) {
        if (!variant.name || !variant.sku || variant.price <= 0) {
          warning('Please fill in all required fields for each variant');
          setIsLoading(false);
          return;
        }
      }

      // Format data for the bulk variants API
      const variantData = {
        combinations: variants.map(variant => ({
          sku: variant.sku,
          selling_price: variant.price,
          cost_price: variant.compareAtPrice || variant.price,
          attributes: variant.attributes,
          stock_qty: variant.stock,
          low_stock_threshold: variant.lowStockThreshold || 5,
          media: variant.media.map((media, index) => ({
            type: media.type,
            url: media.url,
            file_name: media.file?.name,
            is_primary: media.isPrimary,
            sort_order: index + 1
          }))
        }))
      };

      // Save variants to backend using the bulk endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shop/products/${product.id}/variants/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(variantData),
      });

      if (response.ok) {
        onComplete();
      } else {
        const errorData = await response.json();
       showError(`Error saving variants: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving variants:', error);
     showError('Error saving variants');

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Variants - {product.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage product variants with different attributes
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Add Variant Button */}
          <div className="mb-6">
            <button
              onClick={addVariant}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Variant
            </button>
          </div>

          {/* Variants List */}
          <div className="space-y-6">
            {variants.map((variant, variantIndex) => (
              <div key={variant.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Variant {variantIndex + 1}
                  </h3>
                  <button
                    onClick={() => removeVariant(variantIndex)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Variant Name *
                      </label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(variantIndex, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., Red Small T-Shirt"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU *
                      </label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(variantIndex, 'sku', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Auto-generated or enter custom SKU"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            value={variant.price || ''}
                            onChange={(e) => updateVariant(variantIndex, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Compare At Price
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            value={variant.compareAtPrice || ''}
                            onChange={(e) => updateVariant(variantIndex, 'compareAtPrice', parseFloat(e.target.value) || 0)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock
                      </label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={variant.stock || ''}
                          onChange={(e) => updateVariant(variantIndex, 'stock', parseInt(e.target.value) || 0)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Low Stock Threshold
                      </label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={variant.lowStockThreshold || ''}
                          onChange={(e) => updateVariant(variantIndex, 'lowStockThreshold', parseInt(e.target.value) || 5)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="5"
                          min="0"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Get alerts when stock falls below this number</p>
                    </div>
                  </div>

                  {/* Attributes & Media */}
                  <div className="space-y-4">
                    {/* Attributes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attributes
                      </label>
                      {attributesLoading ? (
                        <div className="flex items-center justify-center h-20">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {attributes.map((attribute) => (
                            <div key={attribute.attribute_id}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                {attribute.name}
                                {attribute.is_required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              {renderAttributeInput(attribute, variant, variantIndex)}
                            </div>
                          ))}
                          {attributes.length === 0 && (
                            <p className="text-sm text-gray-500 italic">
                              No attributes available for this category
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Media Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variant Media
                        <span className="text-xs text-gray-500 ml-2">
                          (Max {MAX_IMAGES} images, {MAX_VIDEOS} video)
                        </span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              handleImageUpload(variantIndex, Array.from(e.target.files));
                            }
                          }}
                          className="hidden"
                          id={`variant-media-${variantIndex}`}
                        />
                        <label
                          htmlFor={`variant-media-${variantIndex}`}
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            Click to upload images and videos
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            Images: JPEG, PNG, WebP, SVG (max 5MB each) | Videos: MP4, MOV, AVI (max 50MB each)
                          </span>
                        </label>
                      </div>

                      {/* Media Preview */}
                      {variant.media.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {variant.media.map((media: any, imageIndex: number) => (
                            <div key={media.id} className="relative group">
                              {/* Show preview or uploaded image */}
                              {media.type === 'image' ? (
                                <img
                                  src={media.previewUrl || media.url}
                                  alt="Variant"
                                  className={`w-full h-20 object-cover rounded-lg ${
                                    media.previewUrl ? 'opacity-50' : ''
                                  }`}
                                />
                              ) : (
                                <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-xs text-gray-500">Video</span>
                                </div>
                              )}
                              
                              {/* Upload progress overlay */}
                              {media.previewUrl && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                  <div className="text-white text-xs">Uploading...</div>
                                </div>
                              )}
                              
                              {/* Primary badge */}
                              {media.isPrimary && (
                                <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                  Primary
                                </div>
                              )}
                              
                              {/* Remove button */}
                              <button
                                onClick={() => removeImage(variantIndex, imageIndex)}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {variants.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No variants yet</h3>
              <p className="text-gray-600 mb-4">
                Add variants to offer different options for this product
              </p>
              <button
                onClick={addVariant}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Variant
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveVariants}
            disabled={isLoading || variants.length === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Variants'}
          </button>
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default VariantManagementModal;
