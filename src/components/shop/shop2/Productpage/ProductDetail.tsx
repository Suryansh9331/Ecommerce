import { useState, useEffect, useMemo } from 'react';
import { Heart, ShoppingCart, Image as ImageIcon, ChevronDown, ChevronUp, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import shop2ApiService, { Product, ProductVariant } from '../../../../services/shop2ApiService';
import chroma from 'chroma-js';
import SizeGuide from './SizeGuide';
import { useShopCartOperations } from '../../../../context/ShopCartContext';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../../../hooks/useAmazonTranslate';
import { useToast } from '../../../../hooks/useToast';
import { ToastContainer } from '../../../ui/ToastContainer';
const ProductDetail = () => {
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [, setVariantsLoading] = useState(false);
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToShopCart, canPerformShopCartOperations } = useShopCartOperations();
  const [addingToCart, setAddingToCart] = useState(false);
  const SHOP_ID = 2; // Shop2 ID
const { toasts, error: showError } = useToast();
  // For accordion
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggleSection = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Mobile carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Mobile carousel navigation functions
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Placeholder sections (reviews replaced with real API)
  const sections = [
    { title: "Overview", content: product?.full_description || product?.product_description || "No description available." },
    { title: "Materials", content: "Made from eco-friendly materials." },
    { title: "Return Policy", content: "Returns accepted within 30 days." },
  ];

  // --- Display-only translations (Amazon Translate) ---
  const [tName, setTName] = useState<string | null>(null);
  const [tCategory, setTCategory] = useState<string | null>(null);
  const [tOverviewHTML, setTOverviewHTML] = useState<string | null>(null);
  const [tAttrNames, setTAttrNames] = useState<Record<string, string>>({});
  const [tAttrValues, setTAttrValues] = useState<Record<string, string>>({});

  // Helper function to extract available attributes from product data (similar to Shop4)
  const extractAvailableAttributes = (product: Product): Array<{name: string, value: string, attribute_id: number}> => {
    const attributes: Array<{name: string, value: string, attribute_id: number}> = [];
    
    // Get parent product attributes first
    const parentAttrs = product.attributes || [];
    const variantAttrs = product.variant_attributes || [];
    
    // Build parent defaults map
    const parentDefaults: Record<string, string> = {};
    parentAttrs.forEach(attr => {
      const attrName = attr.attribute?.name;
      const attrValue = attr.value;
      if (attrName && attrValue) {
        parentDefaults[attrName] = attrValue;
      }
    });

    if (product.has_variants) {
      // For variant products: Use variant attributes as the primary source
      // This prevents duplicates by only using variant attributes
      variantAttrs.forEach(attr => {
        if (attr.name && attr.values && Array.isArray(attr.values)) {
          const allValues = new Set<string>();

          // Add parent value if it exists for this attribute
          if (parentDefaults[attr.name]) {
            allValues.add(parentDefaults[attr.name]);
          }

          // Add all variant values
          attr.values.forEach(value => allValues.add(value));

          attributes.push({
            name: attr.name,
            value: Array.from(allValues).sort().join(', '),
            attribute_id: 0 // Use 0 as default since VariantAttribute doesn't have attribute_id
          });
        }
      });
    } else {
      // For non-variant products: Show parent product attributes (read-only)
      // console.log('Product does not have variants, showing parent product attributes');
      parentAttrs.forEach(attr => {
        const attrName = attr.attribute?.name;
        const attrValue = attr.value;

        if (attrName && attrValue) {
          attributes.push({
            name: attrName,
            value: attrValue, // Single value, non-selectable
            attribute_id: attr.attribute_id
          });
        }
      });
    }

    return attributes;
  };

  const availableAttrsMemo = useMemo(() => (product ? extractAvailableAttributes(product) : []), [product]);

  useEffect(() => {
    const lang = i18n.language || 'en';
    if (!product || lang === 'en') {
      setTName(null);
      setTCategory(null);
      setTOverviewHTML(null);
      setTAttrNames({});
      setTAttrValues({});
      return;
    }

    const plainItems: { id: string; text: string }[] = [];
    const htmlItems: { id: string; text: string }[] = [];

    // Names and category
    if (product.product_name) plainItems.push({ id: 'name', text: product.product_name });
    if (product.category_name) plainItems.push({ id: 'category', text: product.category_name });

    // Overview uses HTML if provided
    const overview = product.full_description || product.product_description;
    if (overview) htmlItems.push({ id: 'overview', text: overview });

    // Attribute labels and values
    for (const attr of availableAttrsMemo) {
      if (attr.name) plainItems.push({ id: `attrName:${attr.name}`, text: attr.name });
      const values = String(attr.value || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      for (const v of values) {
        plainItems.push({ id: `attrVal:${attr.name}|${v}`, text: v });
      }
    }

    const doTranslate = async () => {
      try {
        const [plainMap, htmlMap] = await Promise.all([
          translateBatch(plainItems, lang, 'text/plain'),
          translateBatch(htmlItems, lang, 'text/html'),
        ]);
        setTName(plainMap['name'] ?? null);
        setTCategory(plainMap['category'] ?? null);
        setTOverviewHTML(htmlMap['overview'] ?? null);
        const nMap: Record<string, string> = {};
        const vMap: Record<string, string> = {};
        for (const k of Object.keys(plainMap)) {
          if (k.startsWith('attrName:')) nMap[k.split(':')[1]] = plainMap[k];
          if (k.startsWith('attrVal:')) vMap[k.substring('attrVal:'.length)] = plainMap[k];
        }
        setTAttrNames(nMap);
        setTAttrValues(vMap);
      } catch {
        // fail open
      }
    };
    doTranslate();
  }, [product, i18n.language, translateBatch, availableAttrsMemo]);

  // --- Shop Reviews (real data) ---
  interface ShopReviewImage { image_id: number; image_url: string; }
  interface ShopReview {
    review_id: number;
    shop_product_id: number;
    user_id: number;
    shop_order_id: string;
    rating: number;
    title: string;
    body: string;
    created_at: string;
    images?: ShopReviewImage[];
    user?: { first_name?: string; last_name?: string } | null;
  }

  const [shopReviews, setShopReviews] = useState<ShopReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPages, setReviewsPages] = useState(1);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '', orderId: '' });
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  // Review images state
  type SelectedImage = { file: File; preview: string };
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const MAX_IMAGES = 5;
  const MAX_BYTES = 5 * 1024 * 1024;
  const readFileAsDataURL = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageError(null);
    const availableSlots = Math.max(0, MAX_IMAGES - selectedImages.length);
    const toAdd = files.slice(0, availableSlots);
    if (files.length > availableSlots) setImageError(`You can upload up to ${MAX_IMAGES} images`);
    const valid: File[] = [];
    for (const f of toAdd) {
      if (f.size > MAX_BYTES) { setImageError('Each image must be smaller than 5 MB'); continue; }
      valid.push(f);
    }
    const newSel: SelectedImage[] = [];
    for (const f of valid) { const preview = await readFileAsDataURL(f); newSel.push({ file: f, preview }); }
    setSelectedImages(prev => [...prev, ...newSel]);
    e.currentTarget.value = '';
  };
  const removeImageAt = (idx: number) => setSelectedImages(prev => prev.filter((_, i) => i !== idx));

  const fetchShopReviews = async (p: number = 1) => {
    if (!productId) return;
    try {
      setReviewsLoading(true);
      const res = await shop2ApiService.getShopProductReviews(Number(productId), p, 5);
      if (res.status === 'success') {
        setShopReviews(res.data.reviews as ShopReview[]);
        setReviewsPage(res.data.current_page);
        setReviewsPages(res.data.pages);
      }
    } catch (e) {
      console.error('Failed to load reviews', e);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchShopReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Display-only translation for review titles and bodies
  const [tReviews, setTReviews] = useState<Record<number, { title?: string; body?: string }>>({});
  useEffect(() => {
    const lang = i18n.language || 'en';
    if (!shopReviews.length || lang === 'en') {
      setTReviews({});
      return;
    }
    const run = async () => {
      try {
        const items: { id: string; text: string }[] = [];
        shopReviews.forEach(r => {
          if (r.title) items.push({ id: `t:${r.review_id}`, text: r.title });
          if (r.body) items.push({ id: `b:${r.review_id}`, text: r.body });
        });
        if (!items.length) { setTReviews({}); return; }
        const map = await translateBatch(items, lang, 'text/plain');
        const out: Record<number, { title?: string; body?: string }> = {};
        shopReviews.forEach(r => {
          const title = map[`t:${r.review_id}`];
          const body = map[`b:${r.review_id}`];
          if (title || body) out[r.review_id] = { title, body };
        });
        setTReviews(out);
      } catch {
        // fail open
        setTReviews(prev => prev);
      }
    };
    run();
  }, [shopReviews, i18n.language, translateBatch]);

  // Eligibility is checked when user clicks "Write Review"

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
  const jwt = localStorage.getItem('access_token') || '';
      const payload = {
        shop_order_id: newReview.orderId.trim(),
        shop_product_id: Number(productId),
        rating: newReview.rating,
        title: newReview.title.trim() || 'Review',
        body: newReview.comment.trim(),
        images: selectedImages.map(si => si.preview),
      };
      await shop2ApiService.createShopReview(payload, jwt);
      setShowWriteReview(false);
      setNewReview({ rating: 5, title: '', comment: '', orderId: '' });
      setSelectedImages([]);
      fetchShopReviews(1);
    } catch (err: any) {
      showError(err.message || 'Failed to submit review');
    }
  };

  // Check eligibility when opening the review form
  const handleOpenReview = async () => {
    setEligibilityChecked(false);
    setEligibilityError(null);
    try {
  const jwt = localStorage.getItem('access_token') || '';
      if (!jwt) {
        setEligibilityError('Please sign in to review.');
        setEligibilityChecked(true);
        return;
      }
      let page = 1;
      let hasNext = true;
      // Build candidate product IDs (parent + variants)
      const candidateIds = new Set<number>([Number(productId)]);
      if (product && Array.isArray((product as any).variants)) {
        (product as any).variants.forEach((v: any) => {
          if (typeof v?.product_id === 'number') candidateIds.add(Number(v.product_id));
          if (typeof v?.variant_product_id === 'number') candidateIds.add(Number(v.variant_product_id));
        });
      }
      let latestMatch: any = null;
      while (hasNext && page <= 5) {
        const res = await shop2ApiService.getMyShopOrders(page, 50, jwt);
        if (res.success) {
          (res.data.orders || []).forEach((o: any) => {
            const isDelivered = String(o.order_status).toLowerCase() === 'delivered';
            const hasProduct = Array.isArray(o.items) && o.items.some((it: any) => candidateIds.has(Number(it.product_id)));
            if (isDelivered && hasProduct) {
              if (!latestMatch || new Date(o.order_date) > new Date(latestMatch.order_date)) {
                latestMatch = o;
              }
            }
          });
          hasNext = Boolean(res.data?.pagination?.has_next);
          page += 1;
        } else {
          hasNext = false;
        }
      }
      if (latestMatch) {
        setNewReview(prev => ({ ...prev, orderId: latestMatch.order_id }));
        setShowWriteReview(true);
      } else {
        setEligibilityError("Not allowed: either this product wasn't ordered, or the order isn't delivered yet.");
      }
    } catch (e: any) {
      setEligibilityError(e?.message || 'Failed to check eligibility');
    } finally {
      setEligibilityChecked(true);
    }
  };



  // Removed helper functions for available variants filtering



  // Helper to check if this is a variant product
  function isVariantProduct(product: Product | null): boolean {
    return !!(product?.has_variants && !product?.is_parent_product);
  }

  // State for selected attributes (simplified like Shop4)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  
  // Variant selection state
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);
  const [stockError, setStockError] = useState<string>('');

  // Quantity and cart handlers
  const [quantity, setQuantity] = useState<number>(1);
  const handleQuantityChange = (increase: boolean) => {
    setQuantity((prev) => Math.max(1, prev + (increase ? 1 : -1)));
  };

  // Check if current selection is in stock (like Hero.tsx)
  const isInStock = () => {
    if (currentVariant) {
      return (currentVariant.stock_qty || 0) > 0;
    }
    return product?.is_in_stock !== false;
  };

  // Get stock quantity for display (like Hero.tsx)
  const getStockQuantity = () => {
    if (currentVariant) {
      return currentVariant.stock_qty || 0;
    }
    return product?.stock?.stock_qty || 0;
  };
  
  const handleAddToCart = async () => {
    if (!canPerformShopCartOperations()) {
      toast.error('Please sign in to add items to cart');
      navigate('/sign-in');
      return;
    }

    if (!product) {
      toast.error('Product not available');
      return;
    }

    if (stockError) {
      toast.error(stockError);
      return;
    }

    try {
      setAddingToCart(true);
      
      // Convert selectedAttributes to the format expected by the API (like Hero.tsx)
      const attributesForApi: { [key: number]: string | string[] } = {};
      Object.entries(selectedAttributes).forEach(([, value], index) => {
        if (value) {
          attributesForApi[index + 1] = [value]; // API expects numbered keys
        }
      });

      // Use variant_product_id for variants, or product_id for parent product
      const productIdToAdd = currentVariant ? currentVariant.variant_product_id : product.product_id;
      await addToShopCart(SHOP_ID, productIdToAdd, quantity, attributesForApi);
      toast.success('Added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!canPerformShopCartOperations()) {
      toast.error('Please sign in to purchase items');
      navigate('/sign-in');
      return;
    }

    if (!product) {
      toast.error('Product not available');
      return;
    }

    if (stockError) {
      toast.error(stockError);
      return;
    }

    try {
      setAddingToCart(true);
      
      // Convert selectedAttributes to the format expected by the API (like Hero.tsx)
      const attributesForApi: { [key: number]: string | string[] } = {};
      Object.entries(selectedAttributes).forEach(([, value], index) => {
        if (value) {
          attributesForApi[index + 1] = [value]; // API expects numbered keys
        }
      });

      // Use variant_product_id for variants, or product_id for parent product
      const productIdToAdd = currentVariant ? currentVariant.variant_product_id : product.product_id;
      await addToShopCart(SHOP_ID, productIdToAdd, quantity, attributesForApi);
      toast.success('Added to cart successfully!');
      // Navigate to cart page
      navigate('/shop2/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };



  // Handle attribute selection (simplified like Shop4)
  const handleAttributeSelect = (attributeName: string, value: string) => {
    // console.log(`Selecting attribute: ${attributeName} = ${value}`);
    setSelectedAttributes(prev => {
      const newAttrs = {
        ...prev,
        [attributeName]: value
      };
      // console.log('New selected attributes:', newAttrs);
      return newAttrs;
    });
  };

  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Fetch product variants
  const fetchVariants = async (productId: number) => {
    setVariantsLoading(true);
    try {
      
      const response = await shop2ApiService.getProductVariants(productId);
      if (response && response.success) {
        setVariants(response.variants);
      }
    } catch (err) {
      console.error('Failed to fetch variants:', err);
    } finally {
      setVariantsLoading(false);
    }
  };

  // State for parent product data
  const [parentProduct, setParentProduct] = useState<Product | null>(null);

  // Fetch parent product data when variants are loaded
  const fetchParentProduct = async (parentProductId: number) => {
    try {
      const response = await shop2ApiService.getProductById(parentProductId);
      if (response && response.success) {
        setParentProduct(response.product);
      }
    } catch (err) {
      console.error('Failed to fetch parent product:', err);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!productId) {
          setError('No product ID provided');
          setLoading(false);
          return;
        }
        const response = await shop2ApiService.getProductById(Number(productId));
        if (response && response.success) {
          setProduct(response.product);
          // Fetch variants after product is loaded
          await fetchVariants(Number(productId));
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError('Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Initialize selected attributes when product changes (like Shop4)
  useEffect(() => {
    if (product) {
      const initialAttributes: Record<string, string> = {};
      
      // Extract available attributes and set defaults
      const availableAttrs = extractAvailableAttributes(product);
      
      // Get parent product attributes first
      const parentAttrs = product.attributes || [];
      const parentDefaults: Record<string, string> = {};
      parentAttrs.forEach(attr => {
        const attrName = attr.attribute?.name;
        const attrValue = attr.value;
        if (attrName && attrValue) {
          parentDefaults[attrName] = attrValue;
        }
      });
      
      // Set default attributes based on parent product (like Shop4)
      availableAttrs.forEach(attr => {
        if (parentDefaults[attr.name]) {
          // Use parent product value as default
          initialAttributes[attr.name] = parentDefaults[attr.name];
        } else if (attr.value.split(',').length > 0) {
          // Fallback to first available value
          initialAttributes[attr.name] = attr.value.split(',')[0].trim();
        }
      });
      
      // console.log('Default selected attributes (from parent product):', initialAttributes);
      setSelectedAttributes(initialAttributes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Find matching variant when attributes change
  useEffect(() => {
    if (variants.length === 0 || Object.keys(selectedAttributes).length === 0) {
      setCurrentVariant(null);
      setStockError('');
      return;
    }

    // console.log('Finding variant with selected attributes:', selectedAttributes);
    // console.log('Available variants:', variants);

    const findMatchingVariant = () => {
      // First check if selected attributes match parent product (like Shop4)
      if (product) {
        const parentAttrs = product.attributes || [];
        const parentDefaults: Record<string, string> = {};
        parentAttrs.forEach(attr => {
          const attrName = attr.attribute?.name;
          const attrValue = attr.value;
          if (attrName && attrValue) {
            parentDefaults[attrName] = attrValue;
          }
        });

        // Check if selected attributes match parent product attributes
        const matchesParent = Object.entries(selectedAttributes).every(([attrName, attrValue]) => {
          return parentDefaults[attrName] === attrValue;
        });

        if (matchesParent && Object.keys(parentDefaults).length === Object.keys(selectedAttributes).length) {
          // console.log('Selected attributes match parent product - showing parent');
          setCurrentVariant(null);
          setStockError('');
          return;
        }
      }

      // Try to find variant by matching attribute combination
      const matchingVariant = variants.find(variant => {
        // console.log('Checking variant:', variant.variant_id, 'with attributes:', variant.attribute_combination);
        
        if (!variant.attribute_combination) {
          // console.log('Variant has no attribute_combination');
          return false;
        }
        
        // Check if all selected attributes match the variant's attribute combination
        const matches = Object.entries(selectedAttributes).every(([attrName, attrValue]) => {
          const variantValue = variant.attribute_combination[attrName];
          const isMatch = variantValue === attrValue;
          // console.log(`Attribute ${attrName}: selected="${attrValue}", variant="${variantValue}", match=${isMatch}`);
          return isMatch;
        });
        
        // console.log(`Variant ${variant.variant_id} matches: ${matches}`);
        return matches;
      });

      if (matchingVariant) {
        // console.log('Found matching variant:', matchingVariant);
        setCurrentVariant(matchingVariant);
        // Reset image carousel to first image when variant changes
        setCurrentImageIndex(0);
        
        // Check stock status
        if (!matchingVariant.is_in_stock || matchingVariant.stock_qty <= 0) {
          setStockError('This variant is out of stock');
        } else if (matchingVariant.stock_qty <= 5) {
          setStockError(`Only ${matchingVariant.stock_qty} left in stock!`);
        } else {
          setStockError('');
        }
      } else {
        //  console.log('No matching variant found');
        setCurrentVariant(null);
        // Reset to parent media when no variant is selected
        setCurrentImageIndex(0);
        setStockError('This combination is not available. Please choose a different combination.');
      }
    };

    findMatchingVariant();
  }, [selectedAttributes, variants, product]);

  // Fetch parent product when variants are available and this is a variant product
  useEffect(() => {
    if (product && variants.length > 0 && isVariantProduct(product)) {
      const parentProductId = variants[0]?.parent_product_id;
      if (parentProductId && !parentProduct) {
        fetchParentProduct(parentProductId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, variants]);

  if (loading) return <div className="flex justify-center items-center h-96 text-lg">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-96 text-red-500 text-lg">{error}</div>;
  if (!product) return <div className="flex justify-center items-center h-96 text-lg">No product data.</div>;

  // Get all media (images and videos) for the carousel - prioritize variant media
  const allMedia = (() => {
    // If we have a current variant with media, use that
    if (currentVariant?.media) {
      const variantMedia = [
        ...currentVariant.media.images || [],
        ...currentVariant.media.videos || []
      ];
      
      // If variant has media, use it
      if (variantMedia.length > 0) {
        return variantMedia;
      }
    }

    // Otherwise, use product media
    if (product.media) {
      return [
        ...product.media.images || [],
        ...product.media.videos || []
      ];
    }

    return [];
  })();

  const images = allMedia;
  
  // Handle case when no images are available
  const hasImages = images.length > 0;

  return (
    <>
    <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-1 pb-6 sm:pb-8 lg:pb-10 flex flex-col gap-0">
      {/* Photos Modal */}
      {showPhotosModal && hasImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setShowPhotosModal(false)}>
          <div
            className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-4 relative flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl font-bold"
              onClick={() => setShowPhotosModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            {/* Main Image */}
            <div className="w-full flex items-center justify-center relative" style={{ minHeight: 320 }}>
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow hover:bg-gray-100"
                onClick={() => setCurrentPhotoIdx((currentPhotoIdx - 1 + images.length) % images.length)}
                disabled={images.length <= 1}
                style={{ zIndex: 2 }}
              >
                &#8592;
              </button>
              <img
                src={images[currentPhotoIdx]?.url}
                alt={`Product photo ${currentPhotoIdx + 1}`}
                className="max-h-[400px] object-contain rounded-lg"
                style={{ maxWidth: '90%' }}
              />
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow hover:bg-gray-100"
                onClick={() => setCurrentPhotoIdx((currentPhotoIdx + 1) % images.length)}
                disabled={images.length <= 1}
                style={{ zIndex: 2 }}
              >
                &#8594;
              </button>
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 mt-4 overflow-x-auto max-w-full">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`h-16 w-16 object-cover rounded border cursor-pointer ${currentPhotoIdx === idx ? 'border-blue-500' : 'border-gray-300'}`}
                  onClick={() => setCurrentPhotoIdx(idx)}
                  style={{ minWidth: 64 }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      <hr className="border-black border-t-1 mb-4 sm:mb-6" />
      {/* Top Container: Responsive grid for images and details */}
      <div className="grid grid-cols-1 max-w-[1580px]  md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 lg:gap-4 2xl:gap-2 items-start lg:items-center">
        {/* Mobile/Tablet Carousel - Hidden on large desktop */}
        <div className="lg:hidden relative order-1">
          <div className="relative w-full h-[300px] sm:h-[380px] rounded-2xl overflow-hidden">
            {hasImages ? (
              <img 
                src={images[currentImageIndex]?.url} 
                alt={`Product image ${currentImageIndex + 1}`} 
                className="w-full h-full object-contain" 
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No image available</span>
              </div>
            )}
            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-lg transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-800" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-lg transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-gray-800" />
                </button>
              </>
            )}
            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
            {/* Heart icon */}
            <button className="absolute top-4 right-4 p-2 rounded-full transition-all">
              <Heart className="w-6 h-6 text-white" />
            </button>

          </div>
          
          {/* Mobile Photo Gallery Section */}
          {hasImages && (
            <div className="mt-4 grid grid-cols-4 gap-2 w-full">
              {images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`aspect-square cursor-pointer rounded-lg border-2 transition-all ${
                    currentImageIndex === idx 
                      ? 'border-orange-400 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Desktop First image - Hidden on mobile/tablet */}
        <div className="hidden lg:flex justify-center order-1 md:order-1 lg:order-1">
          {hasImages ? (
            <img 
              src={images[0]?.url} 
              alt="Front View" 
              className="rounded-2xl w-full max-w-[320px] sm:max-w-[390px] lg:w-[390px] h-[300px] sm:h-[380px] lg:h-[456px] object-cover" 
            />
          ) : (
            <div className="rounded-2xl w-full max-w-[320px] sm:max-w-[390px] lg:w-[390px] h-[300px] sm:h-[380px] lg:h-[456px] bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No image available</span>
            </div>
          )}
        </div>
        {/* Desktop Second image with Heart Icon - Hidden on mobile/tablet */}
        <div className="hidden lg:relative lg:flex justify-center order-2 md:order-2 lg:order-2">
          {hasImages ? (
            <img 
              src={images[1]?.url || images[0]?.url} 
              alt="Back View" 
              className="rounded-2xl w-full max-w-[320px] sm:max-w-[360px] lg:w-[390px] h-[300px] sm:h-[380px] lg:h-[456px] object-cover" 
            />
          ) : (
            <div className="rounded-2xl w-full max-w-[320px] sm:max-w-[360px] lg:w-[390px] h-[300px] sm:h-[380px] lg:h-[456px] bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No image available</span>
            </div>
          )}
          <button className="absolute top-4 right-4 sm:right-8 p-2 rounded-full transition-all">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </button>
        </div>
        {/* Product Details */}
        <div className="relative flex flex-col justify-center min-w-0 lg:min-w-[340px] h-auto lg:h-[456px] px-2 mb-4 lg:mb-8 self-center order-3 md:order-3 lg:order-3">
          <div className="text-xs sm:text-sm uppercase text-gray-400 mb-2 sm:mb-4 font-bebas font-semibold tracking-wide">{tCategory || product.category_name || 'CATEGORY'}</div>
          <p className="text-2xl sm:text-3xl lg:text-[42px] font-normal font-bebas leading-tight mb-2 sm:mb-3">{tName || product.product_name}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">
            ₹{Number(currentVariant?.effective_price || product.price).toLocaleString('en-IN')}
          </p>
          {/* Stock Warning */}
          {stockError && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${stockError.includes('out of stock')
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
              }`}>
              {stockError}
            </div>
          )}
          {/* Stock indicator */}
          {!isInStock() && !stockError && (
            <p className="text-red-600 text-sm font-medium mb-4">Out of Stock</p>
          )}
          {isInStock() && getStockQuantity() <= 5 && getStockQuantity() > 0 && !stockError && (
            <p className="text-yellow-600 text-sm font-medium mb-4">
              Only {getStockQuantity()} left!
            </p>
          )}
                     {/* Dynamic Attribute Selection */}
           {(() => {
             const currentAttributes = extractAvailableAttributes(product);
             
             if (currentAttributes.length === 0) return null;

             return (
               <div className="mb-4 sm:mb-6">
                                   {currentAttributes.map((attr) => {
                    const attrName = attr.name;
                    const selectedValues = selectedAttributes[attrName];

                   // Get all available values for this attribute from variants
                   const valuesToShow = attr.value.split(',').map((v: string) => v.trim()).filter(Boolean);

                   return (
                     <div key={`${attrName.toLowerCase()}-${attr.attribute_id}`} className="mb-3 sm:mb-4">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-xs sm:text-[14px] font-bebas font-bold tracking-wide">
                           {(tAttrNames[attrName]?.toUpperCase()) || attrName.toUpperCase()}
                         </span>
                         {attrName.toLowerCase() === 'size' && (
                           <span 
                             className="text-xs sm:text-[13px] text-black underline cursor-pointer font-medium hover:text-gray-600 transition-colors"
                             onClick={() => setShowSizeGuide(true)}
                           >
                             Size Guide
                           </span>
                         )}
                       </div>
                       <div className="flex items-center justify-between">
                         <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
                                                       {valuesToShow.map((value: string, index: number) => {
                              const isSelected = selectedValues === value;

                             return (
                               <button
                                 key={`${attr.attribute_id}-${index}`}
                                                                   onClick={() => handleAttributeSelect(
                                    attr.name,
                                    value
                                  )}
                                 className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-[10px] sm:text-[12px] font-semibold shadow-sm transition-all focus:outline-none ${
                                   isSelected 
                                     ? 'bg-orange-100 border-orange-400 shadow-md text-black' 
                                     : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                 }`}
                                 style={{ 
                                   boxShadow: isSelected ? '0 2px 8px rgba(255, 165, 0, 0.15)' : undefined 
                                 }}
                               >
                                 {attrName.toLowerCase() === 'color' && (
                                   <span
                                     className="inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-1 sm:mr-2 border"
                                     style={{ backgroundColor: chroma.valid(value) ? chroma(value).hex() : '#ccc' }}
                                   />
                                 )}
                                 {tAttrValues[`${attr.name}|${value}`] || value}
                               </button>
                             );
                           })}
                         </div>
                         {attrName.toLowerCase() === 'size' && (
                           <div className="flex items-center gap-2 ml-4">
                             <button 
                               className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-100 transition-colors"
                               onClick={() => handleQuantityChange(false)}
                             >
                               -
                             </button>
                             <span className="font-semibold min-w-[2rem] text-center">{quantity}</span>
                             <button 
                               className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-100 transition-colors"
                               onClick={() => handleQuantityChange(true)}
                             >
                               +
                             </button>
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             );
           })()}

                     {/* Action Buttons */}
           <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2">
             <button 
               className={`w-full sm:flex-1 text-[16px] font-gilroy px-3 py-4 rounded-full font-bold flex items-center justify-center gap-2 text-base shadow transition-all ${
                 isInStock() && !addingToCart
                   ? 'bg-black text-white hover:bg-gray-900' 
                   : 'bg-gray-400 text-gray-600 cursor-not-allowed'
               }`}
               onClick={handleAddToCart}
               disabled={!isInStock() || addingToCart}
             >
               {addingToCart ? (
                 <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
               ) : (
                 <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
               )}
               {addingToCart ? 'Adding...' : (!isInStock() ? 'Out of Stock' : 'Add to Cart')}
             </button>
             <button 
               className={`w-full sm:flex-1 border-2 border-black text-black px-3 py-3 sm:py-4 rounded-full font-bold text-base transition-all ${
                 isInStock() && !addingToCart
                   ? 'hover:bg-gray-100'
                   : 'border-gray-400 text-gray-400 cursor-not-allowed'
               }`}
               onClick={handleBuyNow}
               disabled={!isInStock() || addingToCart}
             >
               {addingToCart ? (
                 <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mx-auto" />
               ) : (
                 !isInStock() ? 'Out of Stock' : 'Buy Now'
               )}
             </button>
           </div>
        </div>
      </div>

      {/* Bottom Container: Next two images - Hidden on mobile/tablet since we have carousel */}
      {hasImages && (
        <div className="hidden lg:flex flex-col lg:flex-row w-full max-w-[1230px] mx-auto items-center mt-4 sm:mt-6 lg:mt-1 gap-4">
          <img 
            src={images[2]?.url || images[0]?.url} 
            alt="Side View" 
            className="rounded-xl w-full lg:w-[486px] h-[250px] sm:h-[300px] lg:h-[412px] object-cover" 
          />
          <div className="relative rounded-xl overflow-hidden flex-1 h-[250px] sm:h-[300px] lg:h-[412px] w-full lg:ml-0">
            <img 
              src={images[3]?.url || images[1]?.url || images[0]?.url} 
              alt="Closeup" 
              className="rounded-xl w-full h-full object-cover" 
            />
            <button
              className="absolute bottom-8 sm:bottom-14 left-6 sm:left-12 bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 shadow-lg border border-gray-200"
              onClick={() => { setShowPhotosModal(true); setCurrentPhotoIdx(0); }}
            >
              <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" /> See All Photos
            </button>
          </div>
        </div>
      )}
             

      {/* Description & Reviews Section */}
      <div className="max-w-[1310px]  pt-8 sm:pt-10 lg:pt-12 flex flex-col items-start">
        {/* Accordion Section */}
        <div className="max-w-3xl w-full  pt-8 sm:pt-10 lg:pt-12 pl-0 text-left self-start">
          <h2 className="text-2xl sm:text-3xl lg:text-[42px] font-bold mb-3 sm:mb-4 text-left font-bebas">DESCRIPTION</h2>
          <div className="divide-y border-t border-b">
            {sections.map((section, index) => (
              <div key={index}>
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full flex font-gilroy items-center justify-between py-3 sm:py-4 text-left"
                >
                  <span className="text-sm sm:text-base font-medium">{section.title}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="pb-3 sm:pb-4 text-xs sm:text-sm text-gray-600 text-left">
                    {section.title === "Overview" ? (
                      <div dangerouslySetInnerHTML={{ __html: (tOverviewHTML || section.content) }} />
                    ) : (
                      section.content
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Reviews Section (real data with delivered-order gating) */}
        <div className="max-w-3xl w-full mt-8 sm:mt-12 lg:mt-16 pl-0 pt-6 sm:pt-8 lg:pt-9 text-left self-start">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
              <h2 className="text-2xl sm:text-3xl lg:text-[42px] font-normal text-left font-bebas">REVIEWS</h2>
              <p className="underline text-xs sm:text-sm">Showing {shopReviews.length} review{shopReviews.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
              <button onClick={handleOpenReview} className="px-4 sm:px-6 py-3 bg-black text-white rounded-full font-gilroy text-sm sm:text-base font-semibold w-full sm:w-auto">Write Review</button>
              {eligibilityChecked && eligibilityError && (
                <p className="text-red-500 text-xs">{eligibilityError}</p>
              )}
            </div>
          </div>

          {showWriteReview && (
            <div className="bg-gray-50 border rounded-lg p-4 sm:p-5 mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3">Write your review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-3">
                {/* orderId is pre-filled after eligibility check */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Rating</label>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(star=> (
                      <button type="button" key={star} onClick={()=>setNewReview(prev=>({...prev, rating: star}))}>
                        <Star className={`w-4 h-4 ${star <= newReview.rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Title</label>
                  <input value={newReview.title} onChange={(e)=>setNewReview(prev=>({...prev, title: e.target.value}))} className="w-full p-2 border rounded" placeholder="Great product!" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Your review</label>
                  <textarea value={newReview.comment} onChange={(e)=>setNewReview(prev=>({...prev, comment: e.target.value}))} className="w-full p-2 border rounded min-h-[100px]" placeholder="Share your thoughts…" required />
                </div>
                {/* Images uploader */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Add photos (optional)</label>
                  <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800" />
                  <p className="text-xs text-gray-500 mt-1">Up to 5 images, each less than 5 MB.</p>
                  {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
                  {selectedImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {selectedImages.map((si, idx) => (
                        <div key={idx} className="relative group">
                          <img src={si.preview} alt={`preview-${idx}`} className="h-16 w-16 object-cover rounded border" />
                          <button type="button" onClick={() => removeImageAt(idx)} className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 text-xs font-bold hidden group-hover:flex items-center justify-center" aria-label="Remove image">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={!eligibilityChecked || !newReview.orderId} className={`px-4 py-2 rounded text-white ${(!eligibilityChecked || !newReview.orderId) ? 'bg-gray-400 cursor-not-allowed' : 'bg-black'}`}>Submit</button>
                  <button type="button" onClick={()=>{setShowWriteReview(false); setSelectedImages([]);}} className="px-4 py-2 rounded border">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {reviewsLoading ? (
            <div className="text-gray-500">Loading reviews…</div>
          ) : shopReviews.length > 0 ? (
            <div>
              {shopReviews.map((review)=> (
                <div key={review.review_id} className="mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold font-bebas text-lg sm:text-xl uppercase truncate text-left">{review.user?.first_name || 'User'}</h3>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < review.rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-base text-gray-400 font-gilroy whitespace-nowrap self-start sm:self-auto text-left">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs sm:text-sm text-black font-gilroy leading-relaxed text-left">{(tReviews[review.review_id]?.title || review.title) ? `${tReviews[review.review_id]?.title || review.title} — ` : ''}{tReviews[review.review_id]?.body || review.body}</p>
                  {Array.isArray(review.images) && review.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.images.slice(0,5).map((img, idx) => (
                        <button
                          key={img.image_id ?? idx}
                          type="button"
                          className="group relative"
                          onClick={() => {
                            try {
                              const urls = (review.images || []).map((ri: any) => ri.image_url).filter(Boolean);
                              (window as any).__shop2_setViewer({ urls, index: idx });
                            } catch {}
                          }}
                          aria-label="View image"
                        >
                          <img src={img.image_url} alt={`review image ${idx + 1}`} className="h-16 w-16 object-cover rounded border" />
                        </button>
                      ))}
                    </div>
                  )}
                  <hr className="mt-3 sm:mt-4" />
                </div>
              ))}
              {reviewsPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button disabled={reviewsPage===1} onClick={()=>fetchShopReviews(reviewsPage-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                  <span className="text-gray-500">Page {reviewsPage} of {reviewsPages}</span>
                  <button disabled={reviewsPage===reviewsPages} onClick={()=>fetchShopReviews(reviewsPage+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">No reviews yet.</div>
          )}
        </div>
      </div>
    </div>
    <ToastContainer toasts={toasts} />
    {/* Review images lightbox */}
    <ReviewImageViewerShop2 />
    
    {/* Size Guide Modal */}
    <SizeGuide 
      isOpen={showSizeGuide} 
      onClose={() => setShowSizeGuide(false)} 
    />
    </>
  );
};

export default ProductDetail;

// Lightweight viewer for review images (Shop2)
import React from 'react';
function ReviewImageViewerShop2() {
  const [state, setState] = React.useState<{ urls: string[]; index: number } | null>(null);
  React.useEffect(() => {
    (window as any).__shop2_setViewer = (payload: any) => setState(payload);
    return () => { delete (window as any).__shop2_setViewer; };
  }, []);
  if (!state) return null;
  const { urls, index } = state;
  const close = () => setState(null);
  const prev = () => setState({ urls, index: (index - 1 + urls.length) % urls.length });
  const next = () => setState({ urls, index: (index + 1) % urls.length });
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={close}>
      <div className="relative max-w-3xl w-[90%]" onClick={(e) => e.stopPropagation()}>
        <button className="absolute -top-10 right-0 text-white text-2xl" onClick={close} aria-label="Close">×</button>
        <div className="relative flex items-center justify-center bg-black rounded">
          <button className="absolute left-0 p-3 text-white" onClick={prev} aria-label="Previous">‹</button>
          <img src={urls[index]} alt="review" className="max-h-[80vh] w-auto object-contain" />
          <button className="absolute right-0 p-3 text-white" onClick={next} aria-label="Next">›</button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {urls.map((u, i) => (
            <img key={i} src={u} alt={`thumb-${i}`} className={`h-12 w-12 object-cover rounded border ${i===index?'border-black':'border-gray-300'}`} onClick={() => setState({ urls, index: i })} />
          ))}
        </div>
      </div>
    </div>
  );
}