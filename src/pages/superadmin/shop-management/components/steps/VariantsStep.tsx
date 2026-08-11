import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Package, AlertCircle, Eye, X, Image as ImageIcon, Play } from 'lucide-react';
import { shopManagementService, ShopAttribute } from '../../../../../services/shopManagementService';
import { cloudinaryService, UploadProgress } from '../../../../../services/cloudinaryService';

interface VariantAttribute {
  attribute_id: number;
  value: string | number | boolean;
}

interface VariantMedia {
  type: 'image' | 'video';
  file?: File;
  url: string; // Cloudinary URL after upload
  public_id?: string; // Cloudinary public ID
  is_primary: boolean;
  isExisting?: boolean;
  media_id?: number;
  isUploading?: boolean;
  previewUrl?: string; // Local preview URL before upload
}

interface Variant {
  id: string;
  sku: string;
  selling_price: number;
  cost_price: number;
  stock_qty: number;
  low_stock_threshold: number;
  attributes: VariantAttribute[];
  media: VariantMedia[];
  is_default: boolean;
  sort_order: number;
  variant_product_id?: number; // Store variant product ID for media operations
}

interface VariantsStepProps {
  data: {
    variants: Variant[];
    parent_sku?: string;
    parent_name?: string;
  };
  onUpdate: (field: string, value: any) => void;
  errors?: Record<string, string>;
  categoryId?: number;
  shopId?: number;
  editMode?: boolean; // Add this to detect edit vs create mode
  parentProductId?: number; // Add this for edit mode
}

const VariantsStep: React.FC<VariantsStepProps> = ({
  data,
  onUpdate,
  errors = {},
  categoryId,
  shopId,
  editMode = false,
  parentProductId
}) => {
  const [variants, setVariants] = useState<Variant[]>(data.variants || []);
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const [availableAttributes, setAvailableAttributes] = useState<ShopAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [previewModal, setPreviewModal] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const [hasLoadedExistingData, setHasLoadedExistingData] = useState(false);
  const [deletedVariantIds, setDeletedVariantIds] = useState<Set<string>>(new Set());

  // Reset state when switching between create/edit modes
  useEffect(() => {
    if (!editMode) {
      setHasLoadedExistingData(false);
      setVariants(data.variants || []);
      setDeletedVariantIds(new Set());
    }
  }, [editMode, data.variants]);

  // Load existing variant data in edit mode, but only after attributes are loaded and only once
  useEffect(() => {
    if (editMode && parentProductId && availableAttributes.length > 0 && !hasLoadedExistingData) {
      loadExistingVariantData();
    }
  }, [editMode, parentProductId, availableAttributes, hasLoadedExistingData]);

  const loadExistingVariantData = async () => {
    try {
      const response = await shopManagementService.getProductVariants(parentProductId!);
      
      // Handle the actual API response structure: response.message.variants
      if (response?.message?.variants && Array.isArray(response.message.variants)) {
        const existingVariants = response.message.variants
          .filter((variant: any) => !deletedVariantIds.has(variant.variant_id?.toString() || ''))
          .map((variant: any) => {
            // Convert attribute_combination object to attribute array format
            const attributeArray = variant.attribute_combination ? 
              Object.entries(variant.attribute_combination).map(([name, value]) => {
                // Find attribute by name to get the ID
                const attribute = availableAttributes.find(attr => 
                  attr.name.toLowerCase() === name.toLowerCase()
                );
                return {
                  attribute_id: attribute?.attribute_id || 0,
                  value: value as string
                };
              }).filter(attr => attr.attribute_id > 0) : [];

            // Use media directly from the variant response (no need for separate API call)
            let variantMedia: VariantMedia[] = [];
            if (variant.media && Array.isArray(variant.media)) {
              variantMedia = variant.media.map((media: any) => ({
                type: media.type?.toLowerCase() === 'image' ? 'image' : 'video',
                file: undefined,
                url: media.url || '',
                public_id: media.public_id || '',
                is_primary: media.is_primary || false,
                isExisting: true,
                media_id: media.media_id
              }));
            }

            return {
              id: variant.variant_id?.toString() || '',
              sku: variant.variant_sku || '',
              selling_price: parseFloat(variant.effective_price) || 0,
              cost_price: parseFloat(variant.effective_cost) || 0,
              stock_qty: variant.stock?.stock_qty || 0,
              low_stock_threshold: variant.stock?.low_stock_threshold || 5,
              attributes: attributeArray,
              media: variantMedia,
              is_default: variant.is_default || false,
              sort_order: variant.sort_order || 0,
              variant_product_id: variant.variant_product_id // Store this for media operations
            };
          });

        setVariants(existingVariants);
        onUpdate('variants', existingVariants);
        setHasLoadedExistingData(true);
      }
    } catch (error) {
      console.error('Error loading existing variant data:', error);
      setHasLoadedExistingData(true); // Set flag even on error to prevent infinite retries
    }
  };

  useEffect(() => {
    if (categoryId && shopId) {
      fetchAvailableAttributes();
    }
  }, [categoryId, shopId]);

  const fetchAvailableAttributes = async () => {
    try {
      setLoading(true);
      const attributes = await shopManagementService.getActiveAttributesByShopCategory(shopId!, categoryId!);
      setAvailableAttributes(attributes);
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
      // Fallback to common attributes
      const commonAttributes = [
        { 
          attribute_id: 1, 
          name: 'Color', 
          attribute_type: 'select' as const,
          values: [
            { value_id: 1, value: 'Red' },
            { value_id: 2, value: 'Blue' },
            { value_id: 3, value: 'Green' },
            { value_id: 4, value: 'Black' },
            { value_id: 5, value: 'White' }
          ]
        },
        { 
          attribute_id: 2, 
          name: 'Size', 
          attribute_type: 'select' as const,
          values: [
            { value_id: 6, value: 'XS' },
            { value_id: 7, value: 'S' },
            { value_id: 8, value: 'M' },
            { value_id: 9, value: 'L' },
            { value_id: 10, value: 'XL' }
          ]
        }
      ] as ShopAttribute[];
      setAvailableAttributes(commonAttributes);
    } finally {
      setLoading(false);
    }
  };

  const generateVariantSKU = (parentSku: string, attributes: VariantAttribute[]): string => {
    if (!parentSku || !attributes.length) return '';
    
    const attrCodes = attributes.map(attr => {
      const attribute = availableAttributes.find(a => a.attribute_id === attr.attribute_id);
      const attrName = attribute?.name || 'ATTR';
      const attrValue = String(attr.value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
      return `${attrName.toUpperCase().slice(0, 3)}${attrValue}`;
    }).join('-');
    
    return `${parentSku}-${attrCodes}`;
  };

  const addVariant = () => {
    const newVariant: Variant = {
      id: `variant-${Date.now()}`,
      sku: '',
      selling_price: 0,
      cost_price: 0,
      stock_qty: 0,
      low_stock_threshold: 5, // Default to 5 instead of 0
      attributes: [],
      media: [],
      is_default: variants.length === 0,
      sort_order: variants.length
    };
    
    const updatedVariants = [...variants, newVariant];
    setVariants(updatedVariants);
    onUpdate('variants', updatedVariants);
    setExpandedVariant(newVariant.id);
  };

  const updateVariant = (variantId: string, field: string, value: any) => {
    const updatedVariants = variants.map(variant => {
      if (variant.id === variantId) {
        const updated = { ...variant, [field]: value };
        
        if (field === 'attributes' && data.parent_sku) {
          updated.sku = generateVariantSKU(data.parent_sku, value);
        }
        
        return updated;
      }
      return variant;
    });
    
    setVariants(updatedVariants);
    onUpdate('variants', updatedVariants);
  };

  const removeVariant = (variantId: string) => {
    console.log('Removing variant with ID:', variantId);
    console.log('Current variants before removal:', variants);
    
    // Add to deleted variants set to prevent reappearance
    setDeletedVariantIds(prev => new Set([...prev, variantId]));
    
    const updatedVariants = variants.filter(v => v.id !== variantId);
    console.log('Variants after removal:', updatedVariants);
    
    setVariants(updatedVariants);
    onUpdate('variants', updatedVariants);
    
    if (expandedVariant === variantId) {
      setExpandedVariant(null);
    }
  };

  const addAttributeToVariant = (variantId: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const newAttribute: VariantAttribute = { attribute_id: 0, value: '' };
    updateVariant(variantId, 'attributes', [...variant.attributes, newAttribute]);
  };

  const updateVariantAttribute = (variantId: string, attrIndex: number, field: 'attribute_id' | 'value', value: any) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const updatedAttributes = [...variant.attributes];
    updatedAttributes[attrIndex] = { ...updatedAttributes[attrIndex], [field]: value };
    updateVariant(variantId, 'attributes', updatedAttributes);
  };

  const removeAttributeFromVariant = (variantId: string, attrIndex: number) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const updatedAttributes = variant.attributes.filter((_, index) => index !== attrIndex);
    updateVariant(variantId, 'attributes', updatedAttributes);
  };

  const getAttributeValue = (variantId: string, attributeId: number) => {
    const variant = variants.find(v => v.id === variantId);
    const attr = variant?.attributes.find(a => a.attribute_id === attributeId);
    return attr?.value ?? '';
  };

  const handleAttributeChange = (variantId: string, attributeId: number, value: string | number | boolean) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const updatedAttributes = [...variant.attributes];
    const existingIndex = updatedAttributes.findIndex(a => a.attribute_id === attributeId);
    
    if (existingIndex >= 0) {
      updatedAttributes[existingIndex] = { attribute_id: attributeId, value };
    } else {
      updatedAttributes.push({ attribute_id: attributeId, value });
    }
    
    updateVariant(variantId, 'attributes', updatedAttributes);
  };

  const renderAttributeInput = (attribute: ShopAttribute, variantId: string) => {
    const value = getAttributeValue(variantId, attribute.attribute_id);

    switch (attribute.attribute_type?.toLowerCase()) {
      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => handleAttributeChange(variantId, attribute.attribute_id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
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
                    
                    handleAttributeChange(variantId, attribute.attribute_id, newValues.join(','));
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
            onChange={(e) => handleAttributeChange(variantId, attribute.attribute_id, parseFloat(e.target.value) || 0)}
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
                name={`boolean-${variantId}-${attribute.attribute_id}`}
                checked={value === true}
                onChange={() => handleAttributeChange(variantId, attribute.attribute_id, true)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`boolean-${variantId}-${attribute.attribute_id}`}
                checked={value === false}
                onChange={() => handleAttributeChange(variantId, attribute.attribute_id, false)}
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
            value={value as string || ''}
            onChange={(e) => handleAttributeChange(variantId, attribute.attribute_id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={`Enter ${attribute.name}`}
          />
        );
    }
  };

  const handleMediaUpload = async (variantId: string, files: FileList) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const MAX_IMAGES = 4;
    const MAX_VIDEOS = 1;
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
    
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/avi'];

    const currentImages = variant.media.filter(m => m.type === 'image').length;
    const currentVideos = variant.media.filter(m => m.type === 'video').length;

    const newErrors: string[] = [];
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        newErrors.push(`${file.name}: Only image and video files are allowed`);
        return;
      }

      if (isImage) {
        if (currentImages >= MAX_IMAGES) {
          newErrors.push(`${file.name}: Maximum ${MAX_IMAGES} images allowed`);
          return;
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          newErrors.push(`${file.name}: Invalid image format. Use JPEG, PNG, SVG, or WebP`);
          return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          newErrors.push(`${file.name}: Image size must be less than 5MB`);
          return;
        }
      }

      if (isVideo) {
        if (currentVideos >= MAX_VIDEOS) {
          newErrors.push(`${file.name}: Maximum ${MAX_VIDEOS} video allowed`);
          return;
        }
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
          newErrors.push(`${file.name}: Invalid video format. Use MP4, MOV, or AVI`);
          return;
        }
        if (file.size > MAX_VIDEO_SIZE) {
          newErrors.push(`${file.name}: Video size must be less than 50MB`);
          return;
        }
      }

      validFiles.push(file);
    });

    if (newErrors.length > 0) {
      setUploadErrors(newErrors);
      return;
    }

    setUploadErrors([]);

    try {
      // Create preview media items first
      const previewMediaItems: VariantMedia[] = validFiles.map((file, index) => {
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        const is_primary = type === 'image' && currentImages === 0 && index === 0;
        
        return {
          type,
          file,
          url: '',
          previewUrl: cloudinaryService.generatePreviewUrl(file),
          is_primary,
          isUploading: true
        };
      });

      // Add preview items to variant
      const tempMedia = [...variant.media, ...previewMediaItems];
      updateVariant(variantId, 'media', tempMedia);

      // Upload files to Cloudinary
      const uploadResults = await cloudinaryService.uploadMultipleFiles(
        validFiles,
        'product-variants',
        setUploadProgress
      );

      // Update media items with Cloudinary URLs
      const updatedMediaItems: VariantMedia[] = previewMediaItems.map((item, index) => {
        const result = uploadResults[index];
        
        // Clean up preview URL
        if (item.previewUrl) {
          cloudinaryService.revokePreviewUrl(item.previewUrl);
        }
        
        return {
          ...item,
          url: result.secure_url,
          public_id: result.public_id,
          isUploading: false,
          previewUrl: undefined
        };
      });

      // Replace preview items with uploaded items
      const finalMedia = [
        ...variant.media,
        ...updatedMediaItems
      ];
      
      updateVariant(variantId, 'media', finalMedia);

    } catch (error: any) {
      console.error('Media upload error:', error);
      setUploadErrors(['Failed to upload media files']);
      
      // Remove failed uploads from state
      updateVariant(variantId, 'media', variant.media);
    } finally {
      setUploadProgress([]);
    }
  };

  const removeMedia = async (variantId: string, mediaIndex: number) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const mediaItem = variant.media[mediaIndex];
    if (!mediaItem) return;

    // Clean up preview URL if exists
    if (mediaItem.previewUrl) {
      URL.revokeObjectURL(mediaItem.previewUrl);
    }
    
    // Delete from Cloudinary if uploaded
    if (mediaItem.public_id) {
      try {
        await cloudinaryService.deleteMedia(mediaItem.public_id);
      } catch (error) {
        console.warn('Failed to delete media from Cloudinary:', error);
      }
    }

    const newMedia = [...variant.media];
    newMedia.splice(mediaIndex, 1);
    
    // If we removed the primary image, make the first image primary
    if (mediaItem.is_primary && mediaItem.type === 'image') {
      const firstImage = newMedia.find(item => item.type === 'image');
      if (firstImage) {
        firstImage.is_primary = true;
      }
    }
    
    updateVariant(variantId, 'media', newMedia);
  };

  const setPrimaryMedia = (variantId: string, mediaIndex: number) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const updatedMedia = variant.media.map((m, index) => ({
      ...m,
      is_primary: index === mediaIndex && m.type === 'image'
    }));
    
    updateVariant(variantId, 'media', updatedMedia);
  };

  const openPreview = (media: VariantMedia) => {
    setPreviewModal({
      type: media.type,
      url: media.url || media.previewUrl || ''
    });
  };

  const closePreview = () => {
    setPreviewModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Package className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Product Variants</h2>
        <p className="text-gray-600 mt-2">Create different variations of your product</p>
      </div>

      {/* Add Variant Button */}
      <div className="flex justify-center">
        <button
          onClick={addVariant}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Add Variant</span>
        </button>
      </div>

      {/* Variants List */}
      {variants.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 lg:p-12 text-center bg-gray-50">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No variants created yet</h3>
          <p className="text-gray-500 text-sm lg:text-base">Add variants to offer different options for your product</p>
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant) => (
            <div key={variant.id} className="border border-gray-200 rounded-lg bg-white shadow-sm">
              {/* Variant Header */}
              <div 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-gray-50 space-y-2 sm:space-y-0"
                onClick={() => setExpandedVariant(expandedVariant === variant.id ? null : variant.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                  <h3 className="font-medium text-gray-900">
                    Variant {variants.indexOf(variant) + 1}
                  </h3>
                  {variant.sku && (
                    <span className="text-sm text-gray-500">SKU: {variant.sku}</span>
                  )}
                  {variant.is_default && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full w-fit">Default</span>
                  )}
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-2">
                  <span className="text-sm text-gray-500">${variant.selling_price}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVariant(variant.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Variant Details */}
              {expandedVariant === variant.id && (
                <div className="border-t border-gray-200 p-4 lg:p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter SKU"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.selling_price}
                        onChange={(e) => updateVariant(variant.id, 'selling_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.cost_price}
                        onChange={(e) => updateVariant(variant.id, 'cost_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                      <input
                        type="number"
                        value={variant.stock_qty}
                        onChange={(e) => updateVariant(variant.id, 'stock_qty', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                      <input
                        type="number"
                        value={variant.low_stock_threshold}
                        onChange={(e) => updateVariant(variant.id, 'low_stock_threshold', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="5"
                      />
                      <p className="text-xs text-gray-500 mt-1">Alert when stock reaches this level</p>
                    </div>
                  </div>

                  {/* Attributes */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Variant Attributes</h4>
                    </div>
                    
                    {availableAttributes.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                        <div className="flex flex-col items-center space-y-2">
                          <AlertCircle className="h-12 w-12 text-gray-400" />
                          <p className="text-gray-500 font-medium">No attributes available</p>
                          <p className="text-gray-400 text-sm">This category doesn't have any attributes configured</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableAttributes.map((attribute) => (
                          <div key={attribute.attribute_id} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {attribute.name}
                              {attribute.is_required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            {renderAttributeInput(attribute, variant.id)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Media */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
                      <h4 className="text-lg font-medium text-gray-900">Variant Media</h4>
                      <label className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2 cursor-pointer transition-colors w-fit">
                        <Upload size={16} />
                        <span>Upload Media</span>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,video/mp4,video/mov,video/avi"
                          onChange={(e) => e.target.files && handleMediaUpload(variant.id, e.target.files)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Upload Errors */}
                    {uploadErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                        <h5 className="font-medium text-red-900 mb-2">Upload Errors:</h5>
                        <ul className="text-sm text-red-800 space-y-1">
                          {uploadErrors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Media Guidelines */}
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="text-primary-800 font-medium">Media Guidelines:</p>
                          <ul className="text-primary-700 mt-1 space-y-1">
                            <li>• Max 4 images (5MB each) • Max 1 video (50MB)</li>
                            <li>• Formats: JPEG, PNG, WebP, SVG, MP4, MOV, AVI</li>
                            <li>• First uploaded image becomes primary automatically</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {variant.media.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Upload className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">No media uploaded</p>
                          <p className="text-gray-400 text-sm">Drag and drop or click to upload images and videos</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {variant.media.map((media, mediaIndex) => (
                            <div key={`${variant.id}-${mediaIndex}`} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                                {media.type === 'image' ? (
                                  <img
                                    src={media.url || media.previewUrl}
                                    alt="Variant media"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="relative w-full h-full">
                                    <video
                                      src={media.url || media.previewUrl}
                                      className="w-full h-full object-cover"
                                      controls={false}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                      <div className="w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                                        <Play className="w-6 h-6 text-gray-700" />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Upload Progress */}
                                {media.isUploading && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <div className="bg-white rounded-lg p-3 text-center">
                                      <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                      <p className="text-xs text-gray-600">Uploading...</p>
                                      {uploadProgress.find(p => p.fileName === media.file?.name) && (
                                        <div className="w-20 bg-gray-200 rounded-full h-1 mt-2">
                                          <div 
                                            className="h-full bg-primary-500 transition-all duration-300 rounded-full"
                                            style={{ 
                                              width: `${uploadProgress.find(p => p.fileName === media.file?.name)?.progress || 0}%` 
                                            }}
                                          ></div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Primary Image Badge */}
                              {media.is_primary && (
                                <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                                  Primary
                                </div>
                              )}
                              
                              {/* Actions */}
                              {!media.isUploading && (
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center rounded-lg">
                                  <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                                    <button
                                      onClick={() => openPreview(media)}
                                      className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                                      title="Preview"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    
                                    {media.type === 'image' && !media.is_primary && (
                                      <button
                                        onClick={() => setPrimaryMedia(variant.id, mediaIndex)}
                                        className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                                        title="Set as primary"
                                      >
                                        <ImageIcon size={14} />
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => removeMedia(variant.id, mediaIndex)}
                                      className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                      title="Remove"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {/* File Info */}
                              <div className="mt-2 text-xs text-gray-500">
                                <p className="truncate">{media.file?.name || 'Uploaded media'}</p>
                                {media.file && (
                                  <p>{(media.file.size / 1024 / 1024).toFixed(1)} MB</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Options */}
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={variant.is_default}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const updatedVariants = variants.map(v => ({ ...v, is_default: false }));
                            const thisVariant = updatedVariants.find(v => v.id === variant.id);
                            if (thisVariant) {
                              thisVariant.is_default = true;
                            }
                            setVariants(updatedVariants);
                            onUpdate('variants', updatedVariants);
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Set as default variant</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {variants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Variant Summary</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>{variants.length} variant(s) created</p>
            <p>Total stock: {variants.reduce((sum, v) => sum + v.stock_qty, 0)} units</p>
            {variants.length > 0 && (
              <p>Price range: ${Math.min(...variants.map(v => v.selling_price))} - ${Math.max(...variants.map(v => v.selling_price))}</p>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl max-h-full">
            <div className="relative">
              <button
                onClick={closePreview}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
              >
                <X size={20} />
              </button>
              
              {previewModal.type === 'image' ? (
                <img
                  src={previewModal.url}
                  alt="Preview"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              ) : (
                <video
                  src={previewModal.url}
                  controls
                  className="max-w-full max-h-[80vh] rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantsStep;
