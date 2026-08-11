import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Save,
  X
} from 'lucide-react';
import { shopManagementService, Shop, ShopCategory, ShopProduct } from '../../../../services/shopManagementService';
import { useToastHelpers } from '../../../../context/ToastContext';

// Step Components
import {
  BasicInfoStep,
  AttributesStep,
  MediaStep,
  VariantsStep,
  ShippingStep,
  StockStep,
  MetaStep
} from './steps';

interface MultiStepProductFormProps {
  selectedShop: Shop;
  selectedCategory: ShopCategory;
  editingProduct?: ShopProduct | null;
  onComplete: () => void;
  onCancel: () => void;
}

interface ProductData {
  // Step 1: Basic Info
  product_name: string;
  sku: string;
  product_description: string;
  cost_price: number;
  selling_price: number;
  brand_id?: number;
  
  // Step 2: Attributes
  attributes: Array<{
    attribute_id: number;
    value: string | number | boolean;
  }>;
  
  // Step 3: Media
  media: Array<{
    type: 'image' | 'video';
    file: File;
    url: string;
    is_primary: boolean;
    isExisting?: boolean; // Flag to identify existing media vs new uploads
    media_id?: number; // For existing media
  }>;
  
  // Step 4: Variants
  variants: Array<{
    id: string;
    sku: string;
    selling_price: number;
    cost_price: number;
    stock_qty: number;
    low_stock_threshold: number;
    attributes: Array<{
      attribute_id: number;
      value: string | number | boolean;
    }>;
    media: Array<{
      id: string;
      type: 'image' | 'video';
      file?: File;
      url: string;
      is_primary: boolean;
      isExisting?: boolean;
      media_id?: number;
    }>;
    is_default: boolean;
    sort_order: number;
    variant_product_id?: number; // Add variant product ID for media operations
  }>;
  
  // Step 5: Shipping
  shipping: {
    length_cm: number;
    width_cm: number;
    height_cm: number;
    weight_kg: number;
    shipping_class: string;
  };
  
  // Step 6: Stock
  stock: {
    stock_qty: number;
    low_stock_threshold: number;
  };
  
  // Step 7: Meta
  meta: {
    short_desc: string;
    full_desc: string;
    meta_title: string;
    meta_desc: string;
    meta_keywords: string;
  };
}

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Product name, SKU, prices' },
  { id: 2, title: 'Attributes', description: 'Product specifications' },
  { id: 3, title: 'Media', description: 'Images and videos' },
  { id: 4, title: 'Variants', description: 'Product variations' },
  { id: 5, title: 'Shipping', description: 'Dimensions and weight' },
  { id: 6, title: 'Stock', description: 'Inventory management' },
  { id: 7, title: 'Meta', description: 'SEO and descriptions' }
];

const MultiStepProductForm: React.FC<MultiStepProductFormProps> = ({
  selectedShop,
  selectedCategory,
  editingProduct,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<number | null>(editingProduct?.product_id || null);
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { showSuccess, showError } = useToastHelpers();

  // Initialize product data based on whether we're editing or creating
  const initializeProductData = (): ProductData => {
    if (editingProduct) {
      return {
        product_name: editingProduct.product_name || '',
        sku: editingProduct.sku || '',
        product_description: editingProduct.product_description || '',
        cost_price: editingProduct.cost_price || 0,
        selling_price: editingProduct.selling_price || 0,
        brand_id: editingProduct.brand_id || undefined,
        attributes: editingProduct.attributes?.map(attr => ({
          attribute_id: attr.attribute_id,
          value: attr.value
        })) || [],
        media: [], // Will be populated from database
        variants: [], // Will be populated from database
        shipping: {
          length_cm: editingProduct.shipping?.length_cm || 0,
          width_cm: editingProduct.shipping?.width_cm || 0,
          height_cm: editingProduct.shipping?.height_cm || 0,
          weight_kg: editingProduct.shipping?.weight_kg || 0,
          shipping_class: editingProduct.shipping?.shipping_class || 'standard'
        },
        stock: {
          stock_qty: editingProduct.stock?.stock_qty || 0,
          low_stock_threshold: editingProduct.stock?.low_stock_threshold || 5
        },
        meta: {
          short_desc: editingProduct.meta?.short_desc || '',
          full_desc: editingProduct.meta?.full_desc || '',
          meta_title: editingProduct.meta?.meta_title || editingProduct.product_name || '',
          meta_desc: editingProduct.meta?.meta_desc || '',
          meta_keywords: editingProduct.meta?.meta_keywords || ''
        }
      };
    }
    
    return {
      product_name: '',
      sku: '',
      product_description: '',
      cost_price: 0,
      selling_price: 0,
      brand_id: undefined,
      attributes: [],
      media: [],
      variants: [],
      shipping: {
        length_cm: 0,
        width_cm: 0,
        height_cm: 0,
        weight_kg: 0,
        shipping_class: 'standard'
      },
      stock: {
        stock_qty: 0,
        low_stock_threshold: 5
      },
      meta: {
        short_desc: '',
        full_desc: '',
        meta_title: '',
        meta_desc: '',
        meta_keywords: ''
      }
    };
  };

  const [productData, setProductData] = useState<ProductData>(initializeProductData());
  const [loadingProductData, setLoadingProductData] = useState(false);

  // Load complete product data when editing
  useEffect(() => {
    if (editingProduct && editingProduct.product_id) {
      loadCompleteProductData();
    }
  }, [editingProduct]);

  const loadCompleteProductData = async () => {
    if (!editingProduct) return;
    
    try {
      setLoadingProductData(true);
      const completeProduct = await shopManagementService.getProductDetails(editingProduct.product_id);
      
      setProductData({
        product_name: completeProduct.product_name || '',
        sku: completeProduct.sku || '',
        product_description: completeProduct.product_description || '',
        cost_price: completeProduct.cost_price || 0,
        selling_price: completeProduct.selling_price || 0,
        brand_id: completeProduct.brand_id || undefined,
        attributes: completeProduct.attributes?.map(attr => ({
          attribute_id: attr.attribute_id,
          value: attr.value
        })) || [],
        media: completeProduct.media?.map(media => ({
          type: media.type.toLowerCase() as 'image' | 'video',
          file: new File([], ''), // Placeholder file for existing media
          url: media.url,
          is_primary: media.is_primary || false,
          isExisting: true, // Mark as existing media
          media_id: media.media_id
        })) || [],
        variants: completeProduct.variants?.map(variant => ({
          id: variant.variant_id?.toString() || `variant-${Date.now()}`,
          sku: variant.sku || '',
          selling_price: variant.selling_price || 0,
          cost_price: variant.cost_price || 0,
          stock_qty: variant.stock?.stock_qty || 0,
          low_stock_threshold: variant.stock?.low_stock_threshold || 0,
          attributes: variant.attributes?.map((attr: any) => ({
            name: attr.name || '',
            value: attr.value || ''
          })) || [],
          media: (() => {
            // Handle both old array format and new object format
            if (Array.isArray(variant.media)) {
              // Old format: array of media objects
              return variant.media.map((media: any) => ({
                id: media.media_id?.toString() || `media-${Date.now()}`,
                type: media.type.toLowerCase() as 'image' | 'video',
                url: media.url,
                is_primary: media.is_primary || false,
                isExisting: true,
                media_id: media.media_id
              }));
            } else if (variant.media && typeof variant.media === 'object') {
              // New format: object with images and videos arrays
              const allMedia = [
                ...(variant.media.images || []),
                ...(variant.media.videos || [])
              ];
              return allMedia.map((media: any) => ({
                id: media.media_id?.toString() || `media-${Date.now()}`,
                type: media.type.toLowerCase() as 'image' | 'video',
                url: media.url,
                is_primary: media.is_primary || false,
                isExisting: true,
                media_id: media.media_id
              }));
            }
            return [];
          })(),
          is_default: variant.is_default || false,
          sort_order: variant.sort_order || 0
        })) || [],
        shipping: {
          length_cm: completeProduct.shipping?.length_cm || 0,
          width_cm: completeProduct.shipping?.width_cm || 0,
          height_cm: completeProduct.shipping?.height_cm || 0,
          weight_kg: completeProduct.shipping?.weight_kg || 0,
          shipping_class: completeProduct.shipping?.shipping_class || 'standard'
        },
        stock: {
          stock_qty: completeProduct.stock?.stock_qty || 0,
          low_stock_threshold: completeProduct.stock?.low_stock_threshold || 5
        },
        meta: {
          short_desc: completeProduct.meta?.short_desc || '',
          full_desc: completeProduct.meta?.full_desc || completeProduct.product_description || '',
          meta_title: completeProduct.meta?.meta_title || completeProduct.product_name || '',
          meta_desc: completeProduct.meta?.meta_desc || '',
          meta_keywords: completeProduct.meta?.meta_keywords || ''
        }
      });
      
      // Mark steps as completed for editing
      setCompletedSteps(new Set([1, 2, 3, 4, 5, 6]));
      
    } catch (error: any) {
      showError(`Failed to load product data: ${error.message}`);
    } finally {
      setLoadingProductData(false);
    }
  };

  // Auto-fill meta fields appropriately
  useEffect(() => {
    if (productData.product_description && !productData.meta.full_desc && !editingProduct) {
      setProductData(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          full_desc: prev.product_description // Use product description as full description
        }
      }));
    }
  }, [productData.product_description, editingProduct]);

  const handleStepData = (stepData: any) => {
    setProductData(prev => ({ ...prev, ...stepData }));
  };

  // Memoized variant update handler to prevent infinite re-renders
  const handleVariantUpdate = useCallback((field: string, value: any) => {
    handleStepData({ [field]: value });
  }, []);

  const handleNext = async () => {
    if (currentStep === 1) {
      // Save basic info to database
      await saveBasicInfo();
    } else if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final step - complete product creation
      await completeProductCreation();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const saveBasicInfo = async () => {
    try {
      setLoading(true);
      setStepErrors(prev => ({ ...prev, 1: '' }));
      
      // Frontend validation
      if (!productData.product_name.trim()) {
        throw new Error('Product name is required');
      }
      if (!productData.sku.trim()) {
        throw new Error('SKU is required');
      }
      if (productData.cost_price <= 0) {
        throw new Error('Cost price must be greater than 0');
      }
      if (productData.selling_price <= 0) {
        throw new Error('Selling price must be greater than 0');
      }
      
      const basicData = {
        shop_id: selectedShop.shop_id,
        category_id: selectedCategory.category_id,
        brand_id: productData.brand_id,
        product_name: productData.product_name,
        product_description: productData.product_description,
        sku: productData.sku,
        cost_price: productData.cost_price,
        selling_price: productData.selling_price
      };

      let response;
      if (editingProduct && editingProduct.product_id) {
        // EDIT MODE: call update endpoint
        response = await shopManagementService.updateProductStep1(editingProduct.product_id, basicData);
      } else {
        // ADD MODE: call create endpoint
        response = await shopManagementService.createProductStep1(basicData);
      }
      
      if (response.status === 'success') {
        setCreatedProductId(response.data.product_id);
        setProductData(prev => ({ ...prev, sku: response.data.sku }));
        setCompletedSteps(prev => new Set(prev).add(1));
        showSuccess('Basic product information saved');
        setCurrentStep(2);
      } else {
        throw new Error(response.message || 'Failed to save basic information');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save basic information';
      setStepErrors(prev => ({ ...prev, 1: errorMessage }));
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const completeProductCreation = async () => {
    try {
      setLoading(true);
      
      // Save all remaining data step by step to track which fails
      const steps = [
        { id: 2, name: 'Attributes', fn: saveAttributes },
        { id: 3, name: 'Media', fn: saveMedia },
        { id: 4, name: 'Variants', fn: saveVariants },
        { id: 5, name: 'Shipping', fn: saveShipping },
        { id: 6, name: 'Stock', fn: saveStock },
        { id: 7, name: 'Meta', fn: saveMeta }
      ];
      
      let failedStep = null;
      
      for (const step of steps) {
        try {
          await step.fn();
        } catch (error: any) {
          failedStep = step;
          showError(`Failed to save ${step.name.toLowerCase()}: ${error.message}`);
          break;
        }
      }
      
      if (failedStep) {
        showError(`Product creation failed at step ${failedStep.id} (${failedStep.name}). Please review and try again.`);
        setCurrentStep(failedStep.id);
        return;
      }

      // Mark product as published
      await updateProductStatus({ is_published: true });
      
      showSuccess('Product created successfully!');
      onComplete();
    } catch (error) {
      showError('Failed to complete product creation');
    } finally {
      setLoading(false);
    }
  };

  const saveAttributes = async () => {
    if (!createdProductId || productData.attributes.length === 0) return;
    
    try {
      setStepErrors(prev => ({ ...prev, 2: '' }));
      
      const attributeData = {
        product_id: createdProductId,
        attributes: productData.attributes
      };
      
      await shopManagementService.createProductStep2(attributeData);
      setCompletedSteps(prev => new Set(prev).add(2));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save attributes';
      setStepErrors(prev => ({ ...prev, 2: errorMessage }));
      throw error;
    }
  };

  const saveMedia = async () => {
    if (!createdProductId || productData.media.length === 0) return;
    
    try {
      setStepErrors(prev => ({ ...prev, 3: '' }));
      
      // Frontend validation - only for new media, skip existing media
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg', 'image/webp'];
      const validVideoTypes = ['video/mp4', 'video/mov', 'video/avi'];
      const maxImageSize = 5 * 1024 * 1024; // 5MB
      const maxVideoSize = 50 * 1024 * 1024; // 50MB
      
      for (const media of productData.media) {
        // Skip validation for existing media
        if (media.isExisting) {
          continue;
        }
        
        if (media.type === 'image') {
          if (!validImageTypes.includes(media.file.type)) {
            throw new Error('Invalid image format. Please use JPEG, PNG, SVG, or WebP.');
          }
          if (media.file.size > maxImageSize) {
            throw new Error('Image size must be less than 5MB.');
          }
        } else if (media.type === 'video') {
          if (!validVideoTypes.includes(media.file.type)) {
            throw new Error('Invalid video format. Please use MP4, MOV, or AVI.');
          }
          if (media.file.size > maxVideoSize) {
            throw new Error('Video size must be less than 50MB.');
          }
        }
      }
      
      // Prepare media data - differentiate between existing and new media
      const mediaData = {
        product_id: createdProductId,
        media: productData.media.map((item, index) => ({
          type: item.type.toLowerCase(),
          url: item.url,
          sort_order: index + 1,
          is_primary: item.is_primary,
          // Only include file info for new media
          ...(item.isExisting ? 
            { 
              media_id: item.media_id,
              isExisting: true 
            } : {
              file_size: item.file.size,
              file_name: item.file.name,
              isExisting: false
            }
          )
        }))
      };
      
      await shopManagementService.createProductStep3(mediaData);
      setCompletedSteps(prev => new Set(prev).add(3));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save media';
      setStepErrors(prev => ({ ...prev, 3: errorMessage }));
      throw error;
    }
  };

  const saveVariantMedia = async (variant: any, variantProductId: number) => {
    // Save new media (non-existing) to shop_product_media using variant_product_id
    const newMedia = variant.media.filter((m: any) => !m.isExisting && m.url);
    
    if (newMedia.length === 0) return;
    
    // Prepare all media data
    const allMediaData = newMedia.map((media: any, index: number) => ({
      type: media.type.toLowerCase(),
      url: media.url,
      file_size: media.file?.size || 0,
      file_name: media.file?.name || media.url?.split('/').pop() || '',
      is_primary: media.is_primary,
      sort_order: index + 1,
      public_id: media.public_id || ''
    }));
    
    try {
      // Send all media in a single request
      await shopManagementService.addVariantProductMediaBatch(variantProductId, allMediaData);
    } catch (error) {
      console.error('Failed to save variant media:', error);
    }
  };

  const saveVariants = async () => {
    if (!createdProductId) return;
    
    try {
      setStepErrors(prev => ({ ...prev, 4: '' }));
      
      // Skip if no variants
      if (productData.variants.length === 0) {
        setCompletedSteps(prev => new Set(prev).add(4));
        return;
      }
      
      // Frontend validation
      for (const variant of productData.variants) {
        if (!variant.sku) {
          throw new Error('All variants must have a SKU');
        }
        if (variant.selling_price <= 0) {
          throw new Error('All variants must have a selling price greater than 0');
        }
        if (variant.stock_qty < 0) {
          throw new Error('Variant stock quantity cannot be negative');
        }
        if (variant.attributes.length === 0) {
          throw new Error('All variants must have at least one attribute');
        }
      }

      if (editingProduct) {
        // EDIT MODE: Update existing variants individually
        // Get available attributes to map IDs to names
        const availableAttributes = await shopManagementService.getActiveAttributesByShopCategory(selectedShop.shop_id, selectedCategory.category_id);
        
        for (const variant of productData.variants) {
          const variantData = {
            sku: variant.sku,
            selling_price: variant.selling_price,
            cost_price: variant.cost_price,
            stock_qty: variant.stock_qty,
            low_stock_threshold: variant.low_stock_threshold,
            attributes: variant.attributes.reduce((acc, attr) => {
              // Find the attribute name by ID
              const attribute = availableAttributes?.find(a => a.attribute_id === attr.attribute_id);
              const attributeName = attribute?.name || `attribute_${attr.attribute_id}`;
              return {
                ...acc,
                [attributeName]: attr.value
              };
            }, {}),
            is_default: variant.is_default,
            sort_order: variant.sort_order
            // Remove media from variant data - will be handled separately
          };

          if (variant.id && !variant.id.startsWith('variant-')) {
            // Update existing variant using PUT
            await shopManagementService.updateVariant(parseInt(variant.id), variantData);
            
            // Handle media separately for existing variants - save to product_media using variant_product_id
            if (variant.media && variant.media.length > 0 && variant.variant_product_id) {
              await saveVariantMedia(variant, variant.variant_product_id);
            }
          } else {
            // Create new variant in edit mode using POST  
            const createResult = await shopManagementService.createVariant(createdProductId, variantData);
            
            // Handle media separately for new variants
            if (variant.media && variant.media.length > 0 && createResult?.message?.variant?.variant_product_id) {
              await saveVariantMedia(variant, createResult.message.variant.variant_product_id);
            }
          }
        }
      } else {
        // CREATE MODE: Use bulk creation as before
        // Get available attributes to map IDs to names
        const availableAttributes = await shopManagementService.getActiveAttributesByShopCategory(selectedShop.shop_id, selectedCategory.category_id);
        
        // Prepare variant data in the format expected by the backend
        const variantData = {
          combinations: productData.variants.map((variant, index) => ({
            name: `Variant ${index + 1}`,
            sku: variant.sku,
            selling_price: variant.selling_price,
            cost_price: variant.cost_price,
            stock_qty: variant.stock_qty,
            low_stock_threshold: variant.low_stock_threshold,
            attributes: variant.attributes.reduce((acc, attr) => {
              // Find the attribute name by ID
              const attributeName = availableAttributes?.find(a => a.attribute_id === attr.attribute_id)?.name || `attribute_${attr.attribute_id}`;
              return {
                ...acc,
                [attributeName]: attr.value
              };
            }, {}),
            is_default: variant.is_default,
            sort_order: variant.sort_order,
            // Handle variant media if any
            media: variant.media.filter(m => !m.isExisting).map((media, mediaIndex) => ({
              type: media.type.toLowerCase(),
              url: media.url,
              public_id: (media as any).public_id,
              file_size: media.file?.size,
              file_name: media.file?.name,
              is_primary: media.is_primary,
              sort_order: mediaIndex + 1
            }))
          }))
        };
        
        // Save variants using the correct API endpoint with product ID
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5110'}/api/shop/products/${createdProductId}/variants/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(variantData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save variants');
        }
      }
      
      setCompletedSteps(prev => new Set(prev).add(4));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save variants';
      setStepErrors(prev => ({ ...prev, 4: errorMessage }));
      throw error;
    }
  };

  const saveShipping = async () => {
    if (!createdProductId) return;
    
    try {
      setStepErrors(prev => ({ ...prev, 5: '' }));
      
      // Frontend validation
      if (productData.shipping.weight_kg <= 0) {
        throw new Error('Weight must be greater than 0');
      }
      if (productData.shipping.length_cm <= 0 || productData.shipping.width_cm <= 0 || productData.shipping.height_cm <= 0) {
        throw new Error('All dimensions must be greater than 0');
      }
      
      const shippingData = {
        product_id: createdProductId,
        length_cm: productData.shipping.length_cm,
        width_cm: productData.shipping.width_cm,
        height_cm: productData.shipping.height_cm,
        weight_kg: productData.shipping.weight_kg,
        shipping_class: productData.shipping.shipping_class
      };
      
      await shopManagementService.createProductStep4(shippingData);
      setCompletedSteps(prev => new Set(prev).add(5));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save shipping information';
      setStepErrors(prev => ({ ...prev, 5: errorMessage }));
      throw error;
    }
  };

  const saveStock = async () => {
    if (!createdProductId) return;
    
    try {
      setStepErrors(prev => ({ ...prev, 6: '' }));
      
      // Frontend validation
      if (productData.stock.stock_qty < 0) {
        throw new Error('Stock quantity cannot be negative');
      }
      if (productData.stock.low_stock_threshold < 0) {
        throw new Error('Low stock threshold cannot be negative');
      }
      
      const stockData = {
        product_id: createdProductId,
        stock_qty: productData.stock.stock_qty,
        low_stock_threshold: productData.stock.low_stock_threshold
      };
      
      await shopManagementService.createProductStep5(stockData);
      setCompletedSteps(prev => new Set(prev).add(6));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save stock information';
      setStepErrors(prev => ({ ...prev, 6: errorMessage }));
      throw error;
    }
  };

  const saveMeta = async () => {
    if (!createdProductId) return;
    
    try {
      setStepErrors(prev => ({ ...prev, 7: '' }));
      
      // Auto-generate meta title if not provided
      const metaTitle = productData.meta.meta_title || productData.product_name;
      const metaDesc = productData.meta.meta_desc || productData.meta.short_desc;
      
      const metaData = {
        product_id: createdProductId,
        short_desc: productData.meta.short_desc,
        full_desc: productData.meta.full_desc,
        meta_title: metaTitle,
        meta_desc: metaDesc,
        meta_keywords: productData.meta.meta_keywords
      };
      
      await shopManagementService.createProductStep6(metaData);
      setCompletedSteps(prev => new Set(prev).add(7));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save meta information';
      setStepErrors(prev => ({ ...prev, 7: errorMessage }));
      throw error;
    }
  };

  const updateProductStatus = async (statusData: any) => {
    if (!createdProductId) return;
    
    // For now, we'll use a direct fetch call since the service doesn't have this method yet
    // You could add this to the service later if needed
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5110'}/api/shop/products/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        product_id: createdProductId,
        ...statusData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update product status');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            shop={selectedShop}
            category={selectedCategory}
            data={productData}
            onChange={handleStepData}
          />
        );
      case 2:
        return (
          <AttributesStep
            shopId={selectedShop.shop_id}
            categoryId={selectedCategory.category_id}
            data={productData.attributes}
            onChange={(attributes: any) => handleStepData({ attributes })}
          />
        );
      case 3:
        return (
          <MediaStep
            data={productData.media}
            onChange={(media: any) => handleStepData({ media })}
          />
        );
      case 4:
        return (
          <VariantsStep
            data={{
              variants: productData.variants,
              parent_sku: productData.sku,
              parent_name: productData.product_name
            }}
            onUpdate={handleVariantUpdate}
            categoryId={selectedCategory.category_id}
            shopId={selectedShop.shop_id}
            editMode={!!editingProduct}
            parentProductId={editingProduct?.product_id}
          />
        );
      case 5:
        return (
          <ShippingStep
            data={productData.shipping}
            onChange={(shipping: any) => handleStepData({ shipping })}
          />
        );
      case 6:
        return (
          <StockStep
            data={productData.stock}
            onChange={(stock: any) => handleStepData({ stock })}
          />
        );
      case 7:
        return (
          <MetaStep
            data={productData.meta}
            onChange={(meta: any) => handleStepData({ meta })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-screen overflow-hidden flex flex-col">
        {/* Loading state for editing */}
        {loadingProductData ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading product data for editing...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-gray-600">
                  {selectedShop.name} → {selectedCategory.name}
                </p>
              </div>
              <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const hasError = !!stepErrors[step.id];
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div 
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 cursor-pointer ${
                      hasError
                        ? 'bg-red-500 border-red-500 text-white'
                        : isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'border-gray-300 text-gray-400'
                    }`}
                    onClick={() => setCurrentStep(step.id)}
                    title={hasError ? stepErrors[step.id] : ''}
                  >
                    {hasError ? '!' : isCompleted ? <Check size={16} /> : step.id}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      hasError
                        ? 'text-red-600'
                        : isCompleted
                        ? 'text-green-600'
                        : isCurrent
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    }`}>
                      {step.title}
                      {hasError && ' (Error)'}
                      {isCompleted && ' ✓'}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                    {hasError && (
                      <p className="text-xs text-red-500 mt-1">{stepErrors[step.id]}</p>
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : currentStep === STEPS.length ? (
                <>
                  <Save size={16} />
                  <span>Complete</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default MultiStepProductForm;
