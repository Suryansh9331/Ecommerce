import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, TrashIcon, PlusIcon, StarIcon, PhotoIcon, SparklesIcon, Bars3Icon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useDropzone } from 'react-dropzone';
import AIProductAssistant from './AIProductAssistant';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Category {
  category_id: number;
  name: string;
}

interface Brand {
  brand_id: number;
  name: string;
}

interface Media {
  media_id: number;
  url: string;
  type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  public_id: string | null;
  product_id: number;
  is_thumbnail?: boolean;
  is_main_image?: boolean;
}

interface Shipping {
  product_id: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  shipping_class: string;
  free_shipping: boolean;
}

interface ShippingUnit {
  value: string;
  label: string;
  conversion: number; // conversion factor to base unit (kg for weight, cm for dimensions)
}

interface ProductMeta {
  product_id: number;
  short_desc: string;
  full_desc: string;
  meta_title: string;
  meta_desc: string;
  meta_keywords: string;
}


interface Product {
  product_id: number;
  product_name: string;
  sku: string;
  category_id: number;
  brand_id: number;
  cost_price: number;
  selling_price: number;
  active_flag: boolean;
  category?: {
    category_id: number;
    name: string;
  };
  brand?: {
    brand_id: number;
    name: string;
  };
  media?: Media[];
  shipping?: Shipping;
  meta?: ProductMeta;
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

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingMedia, setIsUpdatingMedia] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mediaIdPendingDelete, setMediaIdPendingDelete] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    category_id: '',
    brand_id: '',
    cost_price: '',
    selling_price: '',
    active_flag: true,
    weight: '',
    weightUnit: 'kg',
    length: '',
    width: '',
    height: '',
    dimensionUnit: 'cm'
  });
  const [shippingData, setShippingData] = useState({
    weight_kg: 0,
    length_cm: 0,
    width_cm: 0,
    height_cm: 0
  });
  const [metaData, setMetaData] = useState<ProductMeta>({
    product_id: 0,
    short_desc: '',
    full_desc: '',
    meta_title: '',
    meta_desc: '',
    meta_keywords: ''
  });
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  
  // Dimension presets state
  const [presets, setPresets] = useState<Array<{
    preset_id: number;
    name: string;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    weight_kg: number;
    shipping_class?: string;
  }>>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCategories();
      fetchBrands();
      fetchProduct();
      fetchShipping();
      fetchProductMeta();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/brands`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }

      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch product data
      const productResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!productResponse.ok) {
        throw new Error('Failed to fetch product');
      }

      const productData = await productResponse.json();

      // Fetch media data
      const mediaResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${id}/media`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!mediaResponse.ok) {
        throw new Error('Failed to fetch media');
      }

      const mediaData = await mediaResponse.json();
      // console.log('Media data from API:', mediaData);

      // Combine product and media data
      const combinedData = {
        ...productData,
        media: mediaData
      };

      // console.log('Combined data:', combinedData);
      // console.log('Media type check:', mediaData.map((m: Media) => ({ id: m.media_id, type: m.type, url: m.url })));
      setProduct(combinedData);
      setFormData({
        product_name: productData.product_name,
        sku: productData.sku,
        category_id: productData.category_id.toString(),
        brand_id: productData.brand_id.toString(),
        cost_price: productData.cost_price.toString(),
        selling_price: productData.selling_price.toString(),
        active_flag: productData.active_flag,
        weight: productData.shipping?.weight?.toString() || '',
        length: productData.shipping?.dimensions?.length?.toString() || '',
        width: productData.shipping?.dimensions?.width?.toString() || '',
        height: productData.shipping?.dimensions?.height?.toString() || '',
        weightUnit: 'kg',
        dimensionUnit: 'cm'
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };


  const fetchShipping = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${id}/shipping`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shipping details');
      }

      const data = await response.json();
      // console.log('Raw shipping data from API:', data);

      // Store the raw data
      setShippingData({
        weight_kg: parseFloat(data.weight_kg || '0'),
        length_cm: parseFloat(data.length_cm || '0'),
        width_cm: parseFloat(data.width_cm || '0'),
        height_cm: parseFloat(data.height_cm || '0')
      });

      // Update form data with converted values
      setFormData(prev => ({
        ...prev,
        weight: data.weight_kg || '0',
        length: data.length_cm || '0',
        width: data.width_cm || '0',
        height: data.height_cm || '0'
      }));

    } catch (error) {
      console.error('Error fetching shipping details:', error);
      setError('Failed to load shipping details. Please try again later.');
    }
  };

  // Conversion function for units (convertFromBaseUnit added for preset functionality)
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

    if (id) {
      fetchPresets();
    }
  }, [id]);

  // Handle preset selection
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    
    if (presetId === '') {
      return;
    }

    const preset = presets.find(p => p.preset_id.toString() === presetId);
    if (preset) {
      // Convert from base units (cm, kg) to selected display units
      const lengthInDisplayUnit = convertFromBaseUnit(preset.length_cm, formData.dimensionUnit, dimensionUnits);
      const widthInDisplayUnit = convertFromBaseUnit(preset.width_cm, formData.dimensionUnit, dimensionUnits);
      const heightInDisplayUnit = convertFromBaseUnit(preset.height_cm, formData.dimensionUnit, dimensionUnits);
      const weightInDisplayUnit = convertFromBaseUnit(preset.weight_kg, formData.weightUnit, weightUnits);

      // Update form data
      setFormData(prev => ({
        ...prev,
        length: lengthInDisplayUnit.toString(),
        width: widthInDisplayUnit.toString(),
        height: heightInDisplayUnit.toString(),
        weight: weightInDisplayUnit.toString()
      }));
    }
  };

  const fetchProductMeta = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${id}/meta`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product meta');
      }

      const data = await response.json();
      setMetaData(data);
    } catch (error) {
      console.error('Error fetching product meta:', error);
      setError('Failed to load product meta. Please try again later.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | File[] | null } }) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Convert FileList to Array if needed
    const filesArray = Array.from(files);

    // Check if we have space for all files
    const currentMediaCount = product?.media?.length || 0;
    const remainingSlots = 5 - currentMediaCount;
    
    if (files.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more file(s). Maximum 5 files allowed.`);
      return;
    }

    // Validate all files - only images are allowed
    const validFiles: File[] = [];
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const isImage = file.type.startsWith('image/');

      if (!isImage) {
        setError(`Invalid file type: ${file.name}. Please upload only images (PNG, JPG, JPEG, GIF, WebP, SVG).`);
        return;
      }
      
      // Check file size (10MB max for images)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name}: File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 10 MB.`);
        return;
      }
      
      validFiles.push(file);
    }

    // Set uploading state
    setIsUpdatingMedia(true);
    const fileNames = validFiles.map(file => file.name);
    setUploadingFiles(fileNames);
    setUploadProgress({});

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileName = file.name;
        
        // Update progress for this file
        setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));

        const formData = new FormData();
        formData.append('media_file', file);
        formData.append('type', 'IMAGE'); // Only images are supported
        formData.append('sort_order', '0');

        // Log request details for debugging
        console.log(`[UPLOAD] Starting upload for ${fileName}`);
        console.log(`[UPLOAD] URL: ${API_BASE_URL}/api/merchant-dashboard/products/${id}/media`);
        console.log(`[UPLOAD] File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`[UPLOAD] File type: ${file.type}`);

        // Create AbortController for timeout (2 minutes for images)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min for images
        
        try {
          const uploadUrl = `${API_BASE_URL}/api/merchant-dashboard/products/${id}/media`;
          console.log(`[UPLOAD] Sending fetch request to: ${uploadUrl}`);
          console.log(`[UPLOAD] API_BASE_URL: ${API_BASE_URL}`);
          
          // Test if server is reachable first
          try {
            const testResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${id}/media`, {
              method: 'OPTIONS',
              headers: {
                'Origin': window.location.origin,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type, Authorization'
              }
            });
            console.log(`[UPLOAD] Preflight test response: ${testResponse.status}`);
          } catch (preflightError) {
            console.error(`[UPLOAD] Preflight test failed:`, preflightError);
          }
          
          const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              // DO NOT set Content-Type - browser sets it automatically with boundary for FormData
            },
            body: formData,
            signal: controller.signal,
            credentials: 'include', // Important for CORS with credentials
            mode: 'cors', // Explicitly set CORS mode
          });
          
          console.log(`[UPLOAD] Response received: ${response.status} ${response.statusText}`);
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json();
            // Handle specific error types with better messages
            if (errorData.error_type === 'FileTooLarge') {
              const fileType = errorData.file_type || 'file';
              const fileSize = errorData.file_size_mb || 'unknown';
              const maxSize = errorData.max_size_mb || 'unknown';
              throw new Error(`${fileName}: ${fileType} file is too large (${fileSize} MB). Maximum allowed size is ${maxSize} MB.`);
            } else if (errorData.error_type === 'ClientDisconnected') {
              throw new Error(`${fileName}: Upload failed - connection was closed. This may be due to network issues or timeout. Please try again.`);
            } else if (errorData.error_type === 'MissingContentLength') {
              throw new Error(`${fileName}: File size could not be determined. Please try again.`);
            }
            throw new Error(errorData.message || `Failed to upload ${fileName}`);
          }

          // Mark this file as completed
          setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          console.error(`[UPLOAD_ERROR] Error details for ${fileName}:`, {
            name: fetchError.name,
            message: fetchError.message,
            stack: fetchError.stack,
            cause: fetchError.cause
          });
          
          if (fetchError.name === 'AbortError') {
            throw new Error(`Upload timeout: ${fileName} took too long to upload. Please try a smaller file.`);
          }
          
          // Provide more detailed error message
          if (fetchError.message === 'Failed to fetch' || fetchError.name === 'TypeError') {
            throw new Error(`Network error: Could not connect to server. Please check your connection and try again. Original error: ${fetchError.message}`);
          }
          
          throw fetchError;
        }
      }

      // Fetch the updated product data
      await fetchProduct();

      // Clear the file input if it's a real input element
      if (e.target && 'value' in e.target) {
      e.target.value = '';
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload media. Please try again.');
    } finally {
      setIsUpdatingMedia(false);
      setUploadingFiles([]);
      setUploadProgress({});
    }
  };

  // Drag and drop handler for uploading new files - defined after handleFileUpload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !id) return;
    
    // Create a synthetic event for handleFileUpload
    const syntheticEvent = {
      target: {
        files: acceptedFiles,
        value: ''
      }
    } as any;
    
    await handleFileUpload(syntheticEvent);
  }, [id, product?.media?.length]);

  const onDropRejected = useCallback((fileRejections: any[]) => {
    fileRejections.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          setError(`${file.name}: ${error.message}`);
        } else if (error.code === 'file-invalid-type') {
          setError(`${file.name}: Invalid file type. Please upload only images (PNG, JPG, JPEG, GIF, WebP, SVG).`);
        } else {
          setError(`${file.name}: ${error.message}`);
        }
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB max for images
    disabled: isUpdatingMedia || !id,
    multiple: true,
    noClick: false,
    noKeyboard: false,
    validator: (file) => {
      // Safety check for file properties
      if (!file || !file.name) {
        return {
          code: "file-invalid",
          message: `Invalid file. Please try again.`
        };
      }

      // Get file extension as fallback if MIME type is not set
      const fileName = file.name.toLowerCase();
      const lastDotIndex = fileName.lastIndexOf('.');
      const fileExtension = lastDotIndex > -1 ? fileName.substring(lastDotIndex) : '';
      const imageExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'];
      
      // Check file type by MIME type first, then by extension
      const hasImageMimeType = file.type && file.type.startsWith('image/');
      const isImage = hasImageMimeType || imageExtensions.includes(fileExtension);
      
      // Reject videos explicitly
      if (file.type && file.type.startsWith('video/')) {
        return {
          code: "file-invalid-type",
          message: `Video files are not supported. Please upload only images (PNG, JPG, JPEG, GIF, WebP, SVG).`
        };
      }
      
      // First check file type
      if (!isImage) {
        return {
          code: "file-invalid-type",
          message: `Invalid file type. Please upload only images (PNG, JPG, JPEG, GIF, WebP, SVG).`
        };
      }
      
      // Then check file size
      if (file.size > 10 * 1024 * 1024) {
        return {
          code: "file-too-large",
          message: `Image file is too large. Maximum size is 10MB.`
        };
      }
      
      if (isImage && file.size > 10 * 1024 * 1024) {
        return {
          code: "file-too-large",
          message: `Image file is too large. Maximum size is 10MB.`
        };
      }
      
      return null;
    }
  });

  const openDeleteMediaModal = (mediaId: number) => {
    setMediaIdPendingDelete(mediaId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMedia = async () => {
    if (!mediaIdPendingDelete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/media/${mediaIdPendingDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      await fetchProduct();
      setIsDeleteModalOpen(false);
      setMediaIdPendingDelete(null);
    } catch (error) {
      console.error('Error deleting media:', error);
      setError('Failed to delete media. Please try again.');
      setIsDeleteModalOpen(false);
    }
  };

  const cancelDeleteMedia = () => {
    setIsDeleteModalOpen(false);
    setMediaIdPendingDelete(null);
  };

  const handleSetThumbnail = async (mediaId: number) => {
    try {
      setIsUpdatingMedia(true);
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${id}/media/${mediaId}/set-thumbnail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to set thumbnail');
      }

      await fetchProduct();
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      setError('Failed to set thumbnail. Please try again.');
    } finally {
      setIsUpdatingMedia(false);
    }
  };

  const handleSetMainImage = async (mediaId: number) => {
    try {
      setIsUpdatingMedia(true);
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${id}/media/${mediaId}/set-main-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to set main image');
      }

      await fetchProduct();
    } catch (error) {
      console.error('Error setting main image:', error);
      setError('Failed to set main image. Please try again.');
    } finally {
      setIsUpdatingMedia(false);
    }
  };

  const handleMediaDragEnd = async (result: DropResult) => {
    if (!result.destination || !product?.media) {
      return; // Dropped outside the list
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return; // No change in position
    }

    // Create a new array with reordered items
    const reorderedMedia = Array.from(product.media);
    const [removed] = reorderedMedia.splice(sourceIndex, 1);
    reorderedMedia.splice(destinationIndex, 0, removed);

    // Update local state immediately for better UX
    setProduct(prev => prev ? { ...prev, media: reorderedMedia } : null);

    // Update sort orders in the backend
    try {
      setIsUpdatingMedia(true);
      const updatePromises = reorderedMedia.map((item, index) => {
        // Only update if the sort order actually changed
        const newSortOrder = index;
        if (item.sort_order !== newSortOrder) {
          return fetch(`${API_BASE_URL}/api/merchant-dashboard/products/media/${item.media_id}/update-order`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sort_order: newSortOrder }),
          });
        }
        return Promise.resolve(null);
      });

      await Promise.all(updatePromises.filter(p => p !== null));
      
      // Refresh product to get updated sort orders from backend
      await fetchProduct();
    } catch (error) {
      console.error('Error updating media order:', error);
      setError('Failed to update media order. Please try again.');
      // Revert to original order on error
      await fetchProduct();
    } finally {
      setIsUpdatingMedia(false);
    }
  };

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        category_id: parseInt(formData.category_id),
        brand_id: parseInt(formData.brand_id),
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length),
        width: parseFloat(formData.width),
        height: parseFloat(formData.height),
      };

      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      navigate('/business/catalog/products');
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error instanceof Error ? error.message : 'Failed to update product. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleUpdateShipping = async () => {
    try {
      // Convert to base units (kg and cm) before sending to API
      const shippingData = {
        weight: convertToBaseUnit(formData.weight, formData.weightUnit, weightUnits),
        dimensions: {
          length: convertToBaseUnit(formData.length, formData.dimensionUnit, dimensionUnits),
          width: convertToBaseUnit(formData.width, formData.dimensionUnit, dimensionUnits),
          height: convertToBaseUnit(formData.height, formData.dimensionUnit, dimensionUnits),
        }
      };

      // console.log('Sending shipping data:', shippingData);

      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${id}/shipping`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shippingData),
      });

      if (!response.ok) {
        throw new Error('Failed to update shipping details');
      }

      // Refresh shipping data after successful update
      await fetchShipping();
    } catch (error) {
      console.error('Error updating shipping details:', error);
      setError('Failed to update shipping details. Please try again.');
    }
  };

  const handleUpdateMeta = async () => {
    try {
      // Create a copy of metaData without product_id
      const { product_id, ...metaDataToSend } = metaData;

      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${id}/meta`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaDataToSend),
      });

      if (!response.ok) {
        throw new Error('Failed to update meta data');
      }

      const updatedData = await response.json();
      setMetaData(updatedData);
    } catch (error) {
      console.error('Error updating meta data:', error);
      setError('Failed to update meta data. Please try again.');
    }
  };


  const convertToBaseUnit = (value: string, unit: string, units: ShippingUnit[]): number => {
    const numericValue = parseFloat(value) || 0;
    const unitConfig = units.find(u => u.value === unit);
    if (!unitConfig) return numericValue;
    return numericValue * unitConfig.conversion;
  };

  // Function to generate meta keywords from description
  const generateMetaKeywords = (text: string): string => {
    if (!text) return '';
    
    // Remove special characters and convert to lowercase
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Split into words and remove common words
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as'];
    const words = cleanText.split(/\s+/).filter(word => 
      word.length > 3 && !commonWords.includes(word)
    );
    
    // Get unique words and limit to 10 keywords
    const uniqueWords = [...new Set(words)].slice(0, 10);
    
    return uniqueWords.join(', ');
  };

  // Function to handle description changes and auto-generate meta data
  const handleDescriptionChange = (field: 'short_desc' | 'full_desc', value: string) => {
    setMetaData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Generate meta title from short description
      if (field === 'short_desc') {
        updated.meta_title = value.slice(0, 100);
      }
      
      // Generate meta description from full description
      if (field === 'full_desc') {
        updated.meta_desc = value.slice(0, 255);
        // Generate keywords from full description
        updated.meta_keywords = generateMetaKeywords(value);
      }
      
      return updated;
    });
  };

  // Handle AI suggestions apply
  const handleAIApply = (suggestions: {
    shortDescription: string;
    fullDescription: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  }) => {
    setMetaData(prev => ({
      ...prev,
      short_desc: suggestions.shortDescription,
      full_desc: suggestions.fullDescription,
      meta_title: suggestions.metaTitle,
      meta_desc: suggestions.metaDescription,
      meta_keywords: suggestions.metaKeywords
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchProduct}
          className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/business/catalog/products')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Products
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Edit Product</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="product_name" className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                id="product_name"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700">
                Brand
              </label>
              <select
                id="brand_id"
                name="brand_id"
                value={formData.brand_id}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                required
              >
                <option value="">Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand.brand_id} value={brand.brand_id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700">
                Cost Price
              </label>
              <input
                type="number"
                id="cost_price"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700">
                Selling Price
              </label>
              <input
                type="number"
                id="selling_price"
                name="selling_price"
                value={formData.selling_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active_flag"
                name="active_flag"
                checked={formData.active_flag}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="active_flag" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
          </div>
        </div>

        {/* Product Media Section */}
        <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Product Media</h3>
              {product?.media && (
                <p className="text-sm text-gray-500 mt-1">
                  {product.media.length} {product.media.length === 1 ? 'image' : 'images'}
                  {' '}({Math.max(0, 5 - product.media.length)} {Math.max(0, 5 - product.media.length) === 1 ? 'slot' : 'slots'} remaining)
                </p>
              )}
            </div>
            {product?.media && product.media.length < 5 && (
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="media-upload"
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none cursor-pointer disabled:opacity-50"
                  style={{ opacity: isUpdatingMedia ? 0.5 : 1 }}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {isUpdatingMedia ? 'Uploading...' : 'Add Media Files'}
                </label>
                <input
                  id="media-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUpdatingMedia}
                />
              </div>
            )}
          </div>

          {/* Upload Progress Indicator */}
          {uploadingFiles.length > 0 && (
            <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-orange-800 mb-3">Uploading Files...</h4>
              <div className="space-y-2">
                {uploadingFiles.map((fileName) => (
                  <div key={fileName} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-orange-700 truncate">{fileName}</span>
                        <span className="text-orange-600 font-medium">
                          {uploadProgress[fileName] || 0}%
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-orange-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[fileName] || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product?.media && product.media.length > 0 ? (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <PhotoIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Media Management Tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Set one image as thumbnail (appears in product listings)</li>
                      <li>Set one image as main image (primary product image)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Media Grid with Drag and Drop */}
              <DragDropContext onDragEnd={handleMediaDragEnd}>
                <Droppable droppableId="edit-product-media-grid" direction="horizontal">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${
                        snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                      }`}
                    >
                      {product.media.map((media, index) => (
                        <Draggable
                    key={media.media_id} 
                          draggableId={`edit-media-${media.media_id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`relative group bg-gray-50 rounded-lg overflow-hidden border-2 ${
                                snapshot.isDragging
                                  ? 'border-orange-500 shadow-2xl ring-2 ring-orange-500 z-50 scale-105'
                                  : 'border-gray-200 hover:border-orange-300'
                              } transition-all duration-200`}
                  >
                    {/* Media Content */}
                    <div className="aspect-w-16 aspect-h-9 relative">
                      <img
                        src={media.url}
                        alt="Product media"
                        className="w-full h-48 object-cover"
                        draggable={false}
                      />
                                
                                {/* Drag Handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
                                  title="Drag to reorder"
                                >
                                  <Bars3Icon className="h-4 w-4 text-gray-600" />
                                </div>
                      
                      {/* Status Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {media.is_thumbnail && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <StarIcon className="h-3 w-3 mr-1" />
                            Thumbnail
                          </span>
                        )}
                        {media.is_main_image && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <PhotoIcon className="h-3 w-3 mr-1" />
                            Main Image
                          </span>
                        )}
                      </div>

                                {/* Order Indicator */}
                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  #{index + 1}
                                </div>
                    </div>

                    {/* Media Info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Image
                        </span>
                        <span className="text-xs text-gray-500" />
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {/* Thumbnail and Main Image buttons (only for images) */}
                        {media.type.toLowerCase() === 'image' && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleSetThumbnail(media.media_id)}
                              disabled={isUpdatingMedia || media.is_thumbnail}
                              className={`flex-1 inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                                media.is_thumbnail
                                  ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-700 hover:bg-yellow-100 hover:text-yellow-800'
                              }`}
                            >
                              <StarIcon className="h-3 w-3 mr-1" />
                              {media.is_thumbnail ? 'Thumbnail' : 'Set Thumbnail'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(media.media_id)}
                              disabled={isUpdatingMedia || media.is_main_image}
                              className={`flex-1 inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                                media.is_main_image
                                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
                              }`}
                            >
                              <PhotoIcon className="h-3 w-3 mr-1" />
                              {media.is_main_image ? 'Main' : 'Set Main'}
                            </button>
                          </div>
                        )}

                        {/* No order controls */}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => openDeleteMediaModal(media.media_id)}
                          disabled={isUpdatingMedia}
                          className="w-full inline-flex items-center justify-center px-2 py-1 border border-transparent rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50"
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                          )}
                        </Draggable>
                ))}
                      {provided.placeholder}
              </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-orange-500 bg-orange-50'
                  : isUpdatingMedia
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-orange-500 bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <CloudArrowUpIcon className={`mx-auto h-16 w-16 ${
                isUpdatingMedia ? 'text-gray-400' : isDragActive ? 'text-orange-500' : 'text-gray-400'
              }`} />
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-700">
                  {isUpdatingMedia
                    ? 'Uploading...'
                    : isDragActive
                    ? 'Drop the files here...'
                    : 'Drag and drop files here, or click to select files'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: JPEG, PNG, GIF, WebP, SVG (max 10MB)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum 5 images allowed.
                </p>
              </div>
            </div>
          )}
        </div>

        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={cancelDeleteMedia} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Delete media?</h3>
              <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDeleteMedia}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteMedia}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Section */}
        <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Details</h3>
          
          {/* Dimension Preset Selector */}
          <div className="mb-6">
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
          
          {/* Current Values Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Current Weight</h4>
                <p className="text-lg font-semibold text-gray-900">
                  {shippingData.weight_kg} kg
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Current Dimensions</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Length</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {shippingData.length_cm} cm
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Width</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {shippingData.width_cm} cm
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Height</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {shippingData.height_cm} cm
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                Weight
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  step="0.001"
                  min="0"
                  className="flex-1 rounded-l-md border-gray-300 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
                <select
                  name="weightUnit"
                  value={formData.weightUnit}
                  onChange={handleChange}
                  className="rounded-r-md border-l-0 border-gray-300 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                >
                  {weightUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensions
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="number"
                    name="length"
                    value={formData.length}
                    onChange={handleChange}
                    placeholder="Length"
                    step="0.01"
                    min="0"
                    className="block w-full rounded-md border-gray-300 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="width"
                    value={formData.width}
                    onChange={handleChange}
                    placeholder="Width"
                    step="0.01"
                    min="0"
                    className="block w-full rounded-md border-gray-300 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="Height"
                    step="0.01"
                    min="0"
                    className="block w-full rounded-md border-gray-300 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-2">
                <select
                  name="dimensionUnit"
                  value={formData.dimensionUnit}
                  onChange={handleChange}
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
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleUpdateShipping}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Update Shipping
            </button>
          </div>
        </div>

        {/* Product Meta Section */}
        <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Product Meta Data</h3>
            <button
              type="button"
              onClick={() => setIsAIAssistantOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Generate with AI
            </button>
          </div>

          {/* AI Assistant Modal */}
          <AIProductAssistant
            isOpen={isAIAssistantOpen}
            onClose={() => setIsAIAssistantOpen(false)}
            onApplySuggestions={handleAIApply}
            productName={formData.product_name}
            productImages={product?.media?.filter(m => m.type.toLowerCase() === 'image').map(m => m.url) || []}
          />
          
          <div className="space-y-6">
            {/* Short Description */}
            <div>
              <label htmlFor="short_desc" className="block text-sm font-medium text-gray-700">
                Short Description
              </label>
              <textarea
                id="short_desc"
                value={metaData.short_desc}
                onChange={(e) => handleDescriptionChange('short_desc', e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder="Enter a brief description (max 255 characters)"
                maxLength={255}
              />
            </div>

            {/* Full Description */}
            <div>
              <label htmlFor="full_desc" className="block text-sm font-medium text-gray-700">
                Full Description
              </label>
              <textarea
                id="full_desc"
                value={metaData.full_desc}
                onChange={(e) => handleDescriptionChange('full_desc', e.target.value)}
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder="Enter detailed product description"
              />
            </div>

            {/* Meta Title */}
            <div>
              <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700">
                Meta Title
              </label>
              <input
                type="text"
                id="meta_title"
                value={metaData.meta_title}
                onChange={(e) => setMetaData(prev => ({ ...prev, meta_title: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder="Enter meta title (max 100 characters)"
                maxLength={100}
              />
            </div>

            {/* Meta Description */}
            <div>
              <label htmlFor="meta_desc" className="block text-sm font-medium text-gray-700">
                Meta Description
              </label>
              <textarea
                id="meta_desc"
                value={metaData.meta_desc}
                onChange={(e) => setMetaData(prev => ({ ...prev, meta_desc: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder="Enter meta description (max 255 characters)"
                maxLength={255}
              />
            </div>

            {/* Meta Keywords */}
            <div>
              <label htmlFor="meta_keywords" className="block text-sm font-medium text-gray-700">
                Meta Keywords
              </label>
              <input
                type="text"
                id="meta_keywords"
                value={metaData.meta_keywords}
                onChange={(e) => setMetaData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder="Enter keywords separated by commas"
              />
              <p className="mt-1 text-sm text-gray-500">
                Keywords are automatically generated from the full description. You can modify them manually.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUpdateMeta}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Update Meta
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/business/catalog/products')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;