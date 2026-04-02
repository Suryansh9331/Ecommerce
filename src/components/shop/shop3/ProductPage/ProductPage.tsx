import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import shop3ApiService, { Product } from '../../../../services/shop3ApiService';
import SimilarProducts from './SimilarProducts';
import { useShopCartOperations } from '../../../../context/ShopCartContext';
import { toast } from 'react-hot-toast';
import { Star, X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../../../hooks/useAmazonTranslate';
import { useToast } from '../../../../hooks/useToast';
import { ToastContainer } from '../../../ui/ToastContainer';
const ProductPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [currentVariant, setCurrentVariant] = useState<Product | null>(null);
  const [stockError, setStockError] = useState<string>('');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedMainImage, setSelectedMainImage] = useState<number>(0);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState<boolean>(false);
  // Dynamic translation state (display-only)
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();
  const [tName, setTName] = useState<string>('');
  const [tCategory, setTCategory] = useState<string>('');
  const [tBrand, setTBrand] = useState<string>('');
  const [tShort, setTShort] = useState<string>('');
  const [tFull, setTFull] = useState<string>('');
  const [tAttrValues, setTAttrValues] = useState<Record<string, string>>({});
  
  // Image gallery modal state
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState<number>(0);

  // Cart functionality
  const { addToShopCart, canPerformShopCartOperations } = useShopCartOperations();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Shop3 has a fixed shop ID of 3
  const SHOP_ID = 3;

  // Helper function to get color style for color attributes (same as Shop1)
  const getColorStyleForValue = (value: string) => {
    // Map common color names to CSS colors
    const colorMap: Record<string, string> = {
      'aliceblue': '#F0F8FF',
      'antiquewhite': '#FAEBD7',
      'aqua': '#00FFFF',
      'aquamarine': '#7FFFD4',
      'azure': '#F0FFFF',
      'beige': '#F5F5DC',
      'bisque': '#FFE4C4',
      'black': '#000000',
      'blanchedalmond': '#FFEBCD',
      'blue': '#0000FF',
      'blueviolet': '#8A2BE2',
      'brown': '#A52A2A',
      'burlywood': '#DEB887',
      'cadetblue': '#5F9EA0',
      'chartreuse': '#7FFF00',
      'chocolate': '#D2691E',
      'coral': '#FF7F50',
      'cornflowerblue': '#6495ED',
      'cornsilk': '#FFF8DC',
      'crimson': '#DC143C',
      'cyan': '#00FFFF',
      'darkblue': '#00008B',
      'darkcyan': '#008B8B',
      'darkgoldenrod': '#B8860B',
      'darkgray': '#A9A9A9',
      'darkgreen': '#006400',
      'darkgrey': '#A9A9A9',
      'darkkhaki': '#BDB76B',
      'darkmagenta': '#8B008B',
      'darkolivegreen': '#556B2F',
      'darkorange': '#FF8C00',
      'darkorchid': '#9932CC',
      'darkred': '#8B0000',
      'darksalmon': '#E9967A',
      'darkseagreen': '#8FBC8F',
      'darkslateblue': '#483D8B',
      'darkslategray': '#2F4F4F',
      'darkslategrey': '#2F4F4F',
      'darkturquoise': '#00CED1',
      'darkviolet': '#9400D3',
      'deeppink': '#FF1493',
      'deepskyblue': '#00BFFF',
      'dimgray': '#696969',
      'dimgrey': '#696969',
      'dodgerblue': '#1E90FF',
      'firebrick': '#B22222',
      'floralwhite': '#FFFAF0',
      'forestgreen': '#228B22',
      'fuchsia': '#FF00FF',
      'gainsboro': '#DCDCDC',
      'ghostwhite': '#F8F8FF',
      'gold': '#FFD700',
      'goldenrod': '#DAA520',
      'gray': '#808080',
      'green': '#008000',
      'greenyellow': '#ADFF2F',
      'grey': '#808080',
      'honeydew': '#F0FFF0',
      'hotpink': '#FF69B4',
      'indianred': '#CD5C5C',
      'indigo': '#4B0082',
      'ivory': '#FFFFF0',
      'khaki': '#F0E68C',
      'lavender': '#E6E6FA',
      'lavenderblush': '#FFF0F5',
      'lawngreen': '#7CFC00',
      'lemonchiffon': '#FFFACD',
      'lightblue': '#ADD8E6',
      'lightcoral': '#F08080',
      'lightcyan': '#E0FFFF',
      'lightgoldenrodyellow': '#FAFAD2',
      'lightgray': '#D3D3D3',
      'lightgreen': '#90EE90',
      'lightgrey': '#D3D3D3',
      'lightpink': '#FFB6C1',
      'lightsalmon': '#FFA07A',
      'lightseagreen': '#20B2AA',
      'lightskyblue': '#87CEFA',
      'lightslategray': '#778899',
      'lightslategrey': '#778899',
      'lightsteelblue': '#B0C4DE',
      'lightyellow': '#FFFFE0',
      'lime': '#00FF00',
      'limegreen': '#32CD32',
      'linen': '#FAF0E6',
      'magenta': '#FF00FF',
      'maroon': '#800000',
      'mediumaquamarine': '#66CDAA',
      'mediumblue': '#0000CD',
      'mediumorchid': '#BA55D3',
      'mediumpurple': '#9370DB',
      'mediumseagreen': '#3CB371',
      'mediumslateblue': '#7B68EE',
      'mediumspringgreen': '#00FA9A',
      'mediumturquoise': '#48D1CC',
      'mediumvioletred': '#C71585',
      'midnightblue': '#191970',
      'mintcream': '#F5FFFA',
      'mistyrose': '#FFE4E1',
      'moccasin': '#FFE4B5',
      'navajowhite': '#FFDEAD',
      'navy': '#000080',
      'oldlace': '#FDF5E6',
      'olive': '#808000',
      'olivedrab': '#6B8E23',
      'orange': '#FFA500',
      'orangered': '#FF4500',
      'orchid': '#DA70D6',
      'palegoldenrod': '#EEE8AA',
      'palegreen': '#98FB98',
      'paleturquoise': '#AFEEEE',
      'palevioletred': '#DB7093',
      'papayawhip': '#FFEFD5',
      'peachpuff': '#FFDAB9',
      'peru': '#CD853F',
      'pink': '#FFC0CB',
      'plum': '#DDA0DD',
      'powderblue': '#B0E0E6',
      'purple': '#800080',
      'rebeccapurple': '#663399',
      'red': '#FF0000',
      'rosybrown': '#BC8F8F',
      'royalblue': '#4169E1',
      'saddlebrown': '#8B4513',
      'salmon': '#FA8072',
      'sandybrown': '#F4A460',
      'seagreen': '#2E8B57',
      'seashell': '#FFF5EE',
      'sienna': '#A0522D',
      'silver': '#C0C0C0',
      'skyblue': '#87CEEB',
      'slateblue': '#6A5ACD',
      'slategray': '#708090',
      'slategrey': '#708090',
      'snow': '#FFFAFA',
      'springgreen': '#00FF7F',
      'steelblue': '#4682B4',
      'tan': '#D2B48C',
      'teal': '#008080',
      'thistle': '#D8BFD8',
      'tomato': '#FF6347',
      'turquoise': '#40E0D0',
      'violet': '#EE82EE',
      'wheat': '#F5DEB3',
      'white': '#FFFFFF',
      'whitesmoke': '#F5F5F5',
      'yellow': '#FFFF00',
      'yellowgreen': '#9ACD32'
    };

    return colorMap[value.toLowerCase()] || value;
  };

  // Extract and combine attributes from both parent product attributes and variant attributes
  const availableAttributes = useMemo(() => {
    if (!product) return [];

    // Get variant options
    const variantAttrs = product.variant_attributes || [];

    // Get parent product attributes for default values
    const parentAttrs = product.attributes || [];

    // Create a map to combine all attribute options
    const attributeMap = new Map();

    // First, collect parent product attribute values as defaults
    const parentDefaults: Record<string, string> = {};
    parentAttrs.forEach(attr => {
      const attrName = attr.attribute?.name;
      const attrValue = attr.value;
      if (attrName && attrValue) {
        parentDefaults[attrName] = attrValue;
      }
    });

    // Add variant attributes with their available options (only if product has variants)
    if (product.has_variants) {
      variantAttrs.forEach(attr => {
        const allValues = new Set<string>();

        // Add parent value if it exists for this attribute
        if (parentDefaults[attr.name]) {
          allValues.add(parentDefaults[attr.name]);
        }

        // Add all variant values
        (attr.values || []).forEach(value => allValues.add(value));

        attributeMap.set(attr.name, {
          name: attr.name,
          values: Array.from(allValues).sort(),
          defaultValue: parentDefaults[attr.name] || (attr.values && attr.values[0]) || ''
        });
      });
    }

    // Add any parent attributes that don't have variant options OR for non-variant products
    parentAttrs.forEach(attr => {
      const attrName = attr.attribute?.name;
      const attrValue = attr.value;

      if (attrName && attrValue && !attributeMap.has(attrName)) {
        // For non-variant products, only use the actual value from backend
        attributeMap.set(attrName, {
          name: attrName,
          values: [attrValue],
          defaultValue: attrValue
        });
      }
    });

    const result = Array.from(attributeMap.values());
    return result;
  }, [product?.product_id, product?.variant_attributes, product?.attributes, product?.has_variants]);

  // Extract variant data from product data (no API calls needed)
  const variants = product?.variants || [];

  // Set default attributes when product changes
  useEffect(() => {
    if (availableAttributes.length > 0) {
      // Set default selection to parent product attributes (auto-selected)
      const defaultAttributes: Record<string, string> = {};
      availableAttributes.forEach(attr => {
        // Use the default value from parent product (auto-selected)
        defaultAttributes[attr.name] = attr.defaultValue || (attr.values.length > 0 ? attr.values[0] : '');
      });
      setSelectedAttributes(defaultAttributes);
    } else {
      setSelectedAttributes({});
      setCurrentVariant(null);
    }
  }, [product?.product_id, availableAttributes]);

  // Find matching variant when attributes change (for variant products)
  useEffect(() => {
    if (!product?.has_variants || Object.keys(selectedAttributes).length === 0) return;

    const findVariantByAttributes = () => {
      setStockError('');

      // Find variant by matching SKU pattern or by checking if selection matches available variants
      let matchingVariant = null;

      // Method 1: Try to find variant by SKU pattern (most reliable)
      if (Object.keys(selectedAttributes).length > 0) {
        matchingVariant = variants.find(variant => {
          const sku = variant.sku?.toUpperCase() || '';
          let matches = 0;
          let totalSelectedAttributes = 0;

          // Check each selected attribute
          Object.entries(selectedAttributes).forEach(([attrName, attrValue]) => {
            if (attrValue) {
              totalSelectedAttributes++;

              // Create SKU pattern for this attribute
              const attrCode = attrName.toUpperCase().substring(0, 3); // COL, SIZ, etc.
              const valueCode = attrValue.toUpperCase().substring(0, 3); // BLU, RED, S, M, etc.
              const pattern = `${attrCode}${valueCode}`;

              if (sku.includes(pattern)) {
                matches++;
              }
            }
          });

          return matches === totalSelectedAttributes && totalSelectedAttributes > 0;
        });
      }

      // Method 2: Fallback - if only one variant, check if selected attributes are available
      if (!matchingVariant && variants.length === 1) {
        const variant = variants[0];
        // Use the available_attributes from the API response (it exists in the actual response)
        const availableAttrs = (product as any).available_attributes || {};

        // Check if all selected attributes have available values
        const allAttributesAvailable = Object.entries(selectedAttributes).every(([attrName, attrValue]) => {
          const availableValues = availableAttrs[attrName] || [];
          return availableValues.includes(attrValue);
        });

        if (allAttributesAvailable) {
          matchingVariant = variant;
        }
      }

      // Update state based on variant match
      if (matchingVariant) {
        setCurrentVariant(matchingVariant);

        // Check stock and show warning if low
        const stockQty = matchingVariant.stock?.stock_qty || 0;
        const lowStockThreshold = (matchingVariant.stock as any)?.low_stock_threshold || 5;

        if (stockQty <= 0) {
          setStockError('This variant is out of stock');
        } else if (stockQty <= lowStockThreshold) {
          setStockError(`Only ${stockQty} left in stock!`);
        }
      } else {
        setCurrentVariant(null);

        // Check if selected attributes match parent product attributes
        const parentAttributes: Record<string, string> = {};
        if (product?.attributes) {
          product.attributes.forEach(attr => {
            if (attr.attribute?.name && attr.value) {
              parentAttributes[attr.attribute.name] = attr.value;
            }
          });
        }

        // Check if current selection matches parent product attributes
        const matchesParentAttributes = Object.keys(selectedAttributes).length > 0 &&
          Object.entries(selectedAttributes).every(([attrName, attrValue]) =>
            parentAttributes[attrName] === attrValue
          );

        if (Object.keys(selectedAttributes).length > 0 && !matchesParentAttributes) {
          setStockError('This combination is not available. Please choose a different combination.');
        }
        // If it matches parent attributes, don't show any error (user is viewing parent product)
      }
    };

    findVariantByAttributes();
  }, [selectedAttributes, variants, product?.has_variants, product?.attributes]);

  // Handle attribute validation for non-variant products
  useEffect(() => {
    if (product?.has_variants || Object.keys(selectedAttributes).length === 0) return;

    const validateNonVariantAttributes = () => {
      setStockError('');
      setCurrentVariant(null);

      // For non-variant products, check if selected attributes match product attributes
      const parentAttributes: Record<string, string> = {};
      if (product?.attributes) {
        product.attributes.forEach(attr => {
          if (attr.attribute?.name && attr.value) {
            parentAttributes[attr.attribute.name] = attr.value;
          }
        });
      }

      // Check if current selection matches parent product attributes
      const matchesParentAttributes = Object.entries(selectedAttributes).every(([attrName, attrValue]) => {
        const parentValue = parentAttributes[attrName];
        if (!parentValue) {
          // If the attribute doesn't exist in parent, check if it's a valid option
          const attr = availableAttributes.find(a => a.name === attrName);
          return attr?.values.includes(attrValue) || false;
        }
        return parentValue === attrValue;
      });

      if (!matchesParentAttributes && Object.keys(selectedAttributes).length > 0) {
        setStockError('This combination is not available. Please choose a different combination.');
      }
    };

    validateNonVariantAttributes();
  }, [selectedAttributes, product?.has_variants, product?.attributes, availableAttributes]);

  // Translate dynamic display strings (do not affect logic/data)
  useEffect(() => {
    const run = async () => {
      if (!product) return;
      const lang = i18n.language || 'en';
      if (!lang || lang.toLowerCase() === 'en') {
        setTName('');
        setTCategory('');
        setTBrand('');
        setTShort('');
        setTFull('');
        setTAttrValues({});
        return;
      }

      try {
        const plainItems: { id: string; text: string }[] = [];
        // Core product fields
        if (product.product_name) plainItems.push({ id: 'name', text: product.product_name });
        if (product.category_name) plainItems.push({ id: 'category', text: product.category_name });
        if (product.brand_name) plainItems.push({ id: 'brand', text: product.brand_name });

        const shortTxt = product.short_description || product.product_description || '';
        const fullTxt = product.full_description || product.product_description || '';
        if (shortTxt) plainItems.push({ id: 'short', text: shortTxt });
        if (fullTxt) plainItems.push({ id: 'full', text: fullTxt });

        // Attribute labels and values
  availableAttributes.forEach(attr => {
          (attr.values || []).forEach((val: string) => {
            if (val) plainItems.push({ id: `attrVal:${attr.name}|${val}`, text: val });
          });
        });

        const tPlain = await translateBatch(plainItems, lang, 'text/plain');

        setTName(tPlain['name'] || '');
        setTCategory(tPlain['category'] || '');
        setTBrand(tPlain['brand'] || '');
        setTShort(tPlain['short'] || '');
        setTFull(tPlain['full'] || '');

        const valueMap: Record<string, string> = {};
  availableAttributes.forEach(attr => {
          (attr.values || []).forEach((val: string) => {
            const vk = `attrVal:${attr.name}|${val}`;
            if (tPlain[vk]) valueMap[`${attr.name}|${val}`] = tPlain[vk];
          });
        });
        setTAttrValues(valueMap);
      } catch (e) {
        // Fail open – keep originals
        console.error('Translate (shop3) failed', e);
      }
    };
    run();
    // include only stable identifiers
  }, [product?.product_id, i18n.language, availableAttributes]);

  const handleAttributeSelect = (attributeName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: value
    }));
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!canPerformShopCartOperations()) {
      toast.error("Please sign in to add items to cart");
      return;
    }

    if (!product) {
      toast.error("Product not available");
      return;
    }

    // Check if product is in stock
    const currentProduct = currentVariant || product;
    const stockQty = currentProduct.stock?.stock_qty || 0;
    if (stockQty <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    try {
      setIsAddingToCart(true);

      // Create selected attributes object from current selections
      const cartAttributes: Record<string, string[]> = {};
      Object.entries(selectedAttributes).forEach(([key, value]) => {
        if (value) {
          cartAttributes[key] = [value];
        }
      });

      await addToShopCart(SHOP_ID, product.product_id, 1, cartAttributes);
      toast.success("Product added to cart");
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error("Failed to add product to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Simple markdown parser for basic formatting with Shop3 styling
  const parseMarkdown = (text: string): JSX.Element[] => {
    if (!text) return [];

    const lines = text.split('\n').filter(line => line.trim() !== '');
    const elements: JSX.Element[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        const content = trimmed.slice(2, -2);
        elements.push(
          <h4 key={index} className="text-xl font-bold text-white mb-2">
            {content}
          </h4>
        );
      }
      // Italic text
      else if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
        const content = trimmed.slice(1, -1);
        elements.push(
          <p key={index} className="text-[#FAF8F8] italic mb-2">
            {content}
          </p>
        );
      }
      // Numbered lists
      else if (/^\d+\./.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s*/, '');
        elements.push(
          <div key={index} className="flex items-start mb-2">
            <span className="w-6 h-6 rounded-full bg-[#CCFF00] text-black text-sm flex items-center justify-center mr-3 mt-0.5 font-semibold">
              {trimmed.match(/^\d+/)?.[0]}
            </span>
            <span className="text-[#FAF8F8]">{content}</span>
          </div>
        );
      }
      // Bullet points
      else if (trimmed.startsWith('- ')) {
        const content = trimmed.slice(2);
        elements.push(
          <div key={index} className="flex items-start mb-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] mr-4 mt-2"></span>
            <span className="text-[#FAF8F8]">{content}</span>
          </div>
        );
      }
      // Regular text
      else if (trimmed) {
        elements.push(
          <p key={index} className="text-[#FAF8F8] mb-2">
            {trimmed}
          </p>
        );
      }
    });

    return elements;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const productId = parseInt(id);
        const response = await shop3ApiService.getProductById(productId);
        if (response && response.success) {
          setProduct(response.product);
          setRelatedProducts(response.related_products || []);
        } else {
          setProduct(null);
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
        setRelatedProducts([]);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full mx-auto min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full mx-auto min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Product not found</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto min-h-screen bg-black">
      {/* Header Navigation */}
      <header className="bg-black max-w-[1920px] w-full mx-auto text-white px-4 sm:px-6 py-3 border-b border-gray-800">
        <div className="mx-auto">
          <nav className="text-sm sm:text-base md:text-lg lg:text-[22px] font-bebas overflow-x-auto">
            <span className="text-gray-400">HOME</span>
            <span className="mx-1 sm:mx-2 text-gray-400">{'>'}</span>
            <span className="text-gray-400">MEN</span>
            <span className="mx-1 sm:mx-2 text-gray-400">{'>'}</span>
            <span className="text-gray-400">{(tCategory || product.category_name)?.toUpperCase() || 'PRODUCT'}</span>
            <span className="mx-1 sm:mx-2 text-gray-400">{'>'}</span>
            <span className="text-white">{(tName || product.product_name)?.toUpperCase()}</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row max-w-[1920px] w-full mx-auto">
        {/* Left Section - Product Images */}
        <div className="w-full lg:w-[1332px]">
          <div className="px-4 sm:px-6 rounded-lg">
            {/* Mobile/Tablet Layout (up to lg): One main image on top, others below */}
            <div className="lg:hidden">
              {/* Main Image on Top */}
              <div className="border border-black mb-2 rounded-lg overflow-hidden">
                <img 
                  src={
                    currentVariant?.media?.images?.[selectedMainImage]?.url || 
                    currentVariant?.primary_image ||
                    product.media?.images?.[selectedMainImage]?.url || 
                    product.primary_image || 
                    "assets/shop3/ProductPage/pd1.svg"
                  } 
                  alt="Product main view"
                  className="w-full h-64 sm:h-96 md:h-[448px] object-contain"
                />
              </div>
              
              {/* Other Images Below in Single Row */}
              <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {/* Dynamically render all available images */}
                {(() => {
                  // Get all available images from both variant and product
                  const variantImages = currentVariant?.media?.images || [];
                  const productImages = product?.media?.images || [];
                  const allImages = [...variantImages, ...productImages];
                  
                  // Create unique array of image URLs
                  const imageUrls = allImages
                    .map(img => img?.url)
                    .filter(url => url) // Remove undefined/null
                    .filter((url, index, arr) => arr.indexOf(url) === index); // Remove duplicates
                  
                  // If no images from backend, use fallback images
                  if (imageUrls.length === 0) {
                    return [1, 2, 3, 4].map((index) => (
                      <div 
                        key={index}
                        className={`border border-black flex-1 rounded-lg overflow-hidden cursor-pointer transition-all flex-shrink-0 ${
                          selectedMainImage === index ? 'ring-2 ring-[#CCFF00]' : ''
                        }`}
                        onClick={() => setSelectedMainImage(index)}
                      >
                        <img 
                          src={`assets/shop3/ProductPage/pd${index}.svg`}
                          alt={`Product view ${index}`}
                          className="w-full h-32 sm:h-48 md:h-64 object-cover"
                        />
                      </div>
                    ));
                  }
                  
                  // Render actual images from backend (show first 4)
                  const imagesToShow = imageUrls.slice(0, 4);
                  const hasMoreImages = imageUrls.length > 4;
                  const hasVideos = (currentVariant?.media?.videos && currentVariant.media.videos.length > 0) || 
                                   (product?.media?.videos && product.media.videos.length > 0);
                  
                  return (
                    <>
                      {imagesToShow.map((imageUrl, index) => {
                        const isFourthImage = index === 3;
                        const shouldShowMoreOverlay = isFourthImage && (hasMoreImages || hasVideos);
                        
                        return (
                          <div 
                            key={index}
                            className={`border border-black rounded-lg overflow-hidden cursor-pointer transition-all flex-shrink-0 relative group ${
                              selectedMainImage === index ? 'ring-2 ring-[#CCFF00]' : ''
                            }`}
                            onClick={() => {
                              if (shouldShowMoreOverlay) {
                                setCurrentGalleryIndex(0);
                                setIsGalleryOpen(true);
                              } else {
                                setSelectedMainImage(index);
                              }
                            }}
                            style={{ 
                              width: '25%',
                              minWidth: 'auto'
                            }}
                          >
                            <img 
                              src={imageUrl}
                              alt={`Product view ${index + 1}`}
                              className="w-full h-32 sm:h-48 md:h-64 object-cover"
                            />
                            {shouldShowMoreOverlay && (
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-white text-lg sm:text-xl font-bold mb-1">
                                    +{Math.max(0, imageUrls.length - 4) + (hasVideos ? (currentVariant?.media?.videos?.length || 0) + (product?.media?.videos?.length || 0) : 0)}
                                  </div>
                                  <div className="text-gray-300 text-xs sm:text-sm">
                                    More
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* Desktop Layout (lg and above): Original 2x2 grid */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {/* Top Left Image */}
              <div className="border border-black rounded-lg overflow-hidden">
                <img 
                  src={
                    currentVariant?.media?.images?.[0]?.url || 
                    currentVariant?.primary_image ||
                    product.media?.images?.[0]?.url || 
                    product.primary_image || 
                    "assets/shop3/ProductPage/pd1.svg"
                  } 
                  alt="Product front view"
                  className="w-full h-[896px] object-cover"
                />
              </div>
              
              {/* Top Right Image */}
              <div className="border border-black rounded-lg overflow-hidden">
                <img 
                  src={
                    currentVariant?.media?.images?.[1]?.url || 
                    product.media?.images?.[1]?.url || 
                    currentVariant?.primary_image ||
                    product.primary_image || 
                    "assets/shop3/ProductPage/pd2.svg"
                  } 
                  alt="Product side view"
                  className="w-full h-[896px] object-cover"
                />
              </div>
              
              {/* Bottom Left Image */}
              <div className="border border-black rounded-lg overflow-hidden">
                <img 
                  src={
                    currentVariant?.media?.images?.[2]?.url || 
                    product.media?.images?.[2]?.url || 
                    currentVariant?.primary_image ||
                    product.primary_image || 
                    "assets/shop3/ProductPage/pd3.svg"
                  } 
                  alt="Product back view"
                  className="w-full h-[896px] object-cover"
                />
              </div>
              
              {/* Bottom Right Image - Only this one opens gallery */}
              <div className="border border-black rounded-lg overflow-hidden relative group cursor-pointer" onClick={() => {
                setCurrentGalleryIndex(0);
                setIsGalleryOpen(true);
              }}>
                <img 
                  src={
                    currentVariant?.media?.images?.[3]?.url || 
                    product.media?.images?.[3]?.url || 
                    currentVariant?.primary_image ||
                    product.primary_image || 
                    "assets/shop3/ProductPage/pd4.svg"
                  } 
                  alt="Product angled view"
                  className="w-full h-[896px] object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="text-white text-lg font-semibold">
                    MORE IMAGES
                  </div>
                </div>
              </div>
              
              {/* More Images Button - Show if there are more than 4 images (hidden on desktop) */}
              {(() => {
                const variantImages = currentVariant?.media?.images || [];
                const productImages = product?.media?.images || [];
                const allImages = [...variantImages, ...productImages];
                const imageUrls = allImages
                  .map(img => img?.url)
                  .filter(url => url)
                  .filter((url, index, arr) => arr.indexOf(url) === index);
                
                // Show if there are more than 4 images or if we have videos (but not on desktop)
                const hasMoreImages = imageUrls.length > 4;
                const hasVideos = (currentVariant?.media?.videos && currentVariant.media.videos.length > 0) || 
                                 (product?.media?.videos && product.media.videos.length > 0);
                
                // Don't show this section on desktop since there's already a more comprehensive image section
                return null;
              })()}
            </div>
          </div>
        </div>

        {/* Right Section - Product Details */}
        <div className="w-full lg:w-[546px] mt-2 px-4 sm:px-6 lg:px-4 text-white">
          {/* Reference Number */}
          <div className="text-left mb-4">
            <span className="text-sm text-[#FFFFFF] font-sans">Ref.{product.sku || product.product_id}</span>
          </div>

          {/* Product Title */}
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-[24px] font-bold mb-4 sm:mb-6 font-alexandria text-[#CCFF00]">
            {tName || product.product_name}
          </h1>

          {/* Price Information */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 mb-2">
              {(() => {
                const currentProduct = currentVariant || product;
                const hasSpecialPrice = currentProduct.special_price && currentProduct.special_price < currentProduct.price;
                return hasSpecialPrice ? (
                  <>
                    <span className="text-white line-through text-base sm:text-lg lg:text-[20px] font-sans">₹{currentProduct.price}</span>
                    <span className="text-base sm:text-lg lg:text-[20px] font-bold text-[#FE5335] font-sans">₹{currentProduct.special_price}</span>
                  </>
                ) : (
                  <span className="text-base sm:text-lg lg:text-[20px] font-bold text-white font-sans">₹{currentProduct.price}</span>
                );
              })()}
            </div>
            <p className="text-xs sm:text-sm lg:text-[14px] text-[#EDEAEA] font-sans">Tax free (21%) outside US</p>
            {/* Stock indicators similar to Shop1 */}
            {(() => {
              const currentProduct = currentVariant || product;
              const stockQty = currentProduct.stock?.stock_qty || 0;
              
              if (stockQty === 0) {
                return (
                  <p className="text-red-400 text-sm font-medium mt-2 font-sans">Out of Stock</p>
                );
              } else if (stockQty <= 5 && stockQty > 0) {
                return (
                  <p className="text-yellow-400 text-sm font-medium mt-2 font-sans">
                    Only {stockQty} left!
                  </p>
                );
              }
              return null;
            })()}
          </div>

          {/* Product Description */}
          <div className="text-[#F4EDED] mb-6 sm:mb-8 text-sm sm:text-base lg:text-[16px] leading-relaxed font-alexandria">
            {(() => {
              const text = tShort || product.short_description || product.product_description || '';
              return text ? parseMarkdown(text) : <p>A stunning product featuring modern design and exceptional quality.</p>;
            })()}
          </div>

          {/* Product Links */}
          <div className="flex flex-col sm:flex-row font-[14px] space-y-2 sm:space-y-0 sm:space-x-8 mb-6 sm:mb-8">
            <button className="text-white font-openSans underline text-left">
              Product details
            </button>
            {/* <button className="text-white font-openSans underline text-left">
              Size guide
            </button> */}
          </div>

          {/* Color Selection */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-16">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                {availableAttributes
                  .filter(attr => attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('colour'))
                  .map(colorAttr => (
                    colorAttr.values.map((colorValue: string) => {
                      // Use dynamic color mapping from Shop1 approach
                      const colorStyle = getColorStyleForValue(colorValue);
                      
                      return (
                        <button
                          key={colorValue}
                          onClick={() => handleAttributeSelect(colorAttr.name, colorValue)}
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded border-2 ${
                            selectedAttributes[colorAttr.name] === colorValue ? 'border-white' : 'border-transparent'
                          }`}
                          style={{ 
                            backgroundColor: colorStyle.startsWith('#') ? colorStyle : '#808080' 
                          }}
                          title={colorValue}
                        />
                      );
                    })
                  )).flat()}
              </div>
              <span className="text-xs sm:text-sm lg:text-[14px] text-[#757575] font-sans">
                {(() => {
                  const colorAttr = availableAttributes.find(attr => attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('colour'));
                  const selectedColorValue = colorAttr ? selectedAttributes[colorAttr.name] : '';
                  const tVal = selectedColorValue ? (tAttrValues[`${colorAttr.name}|${selectedColorValue}`] || selectedColorValue) : '';
                  return tVal || 'None';
                })()}
              </span>
            </div>
          </div>

          {/* Size Selection */}
          {/* <div className="mb-4 flex justify-center">
            <div className="relative w-full sm:w-3/4 lg:w-full">
              <button
                onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                className="w-full bg-[#CCFF00] text-black font-medium py-2 px-4 rounded cursor-pointer font-sans text-sm sm:text-base flex items-center justify-between"
              >
                <span>
                  {(() => {
                    const sizeAttr = availableAttributes.find(attr => attr.name.toLowerCase().includes('size'));
                    const selectedSize = sizeAttr ? selectedAttributes[sizeAttr.name] : '';
                    const tVal = selectedSize ? (tAttrValues[`${sizeAttr?.name}|${selectedSize}`] || selectedSize) : '';
                    return tVal || 'Choose your size';
                  })()}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${isSizeDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isSizeDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                  {availableAttributes
                    .filter(attr => attr.name.toLowerCase().includes('size'))
                    .map(sizeAttr => 
                      sizeAttr.values.map((sizeValue: string) => (
                        <button
                          key={sizeValue}
                          onClick={() => {
                            handleAttributeSelect(sizeAttr.name, sizeValue);
                            setIsSizeDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black text-sm sm:text-base block"
                        >
                          {tAttrValues[`${sizeAttr.name}|${sizeValue}`] || sizeValue}
                        </button>
                      ))
                    ).flat()}
                </div>
              )}
            </div>
          </div> */}

          {/* Combination Error Message */}
          {stockError && (
            <div className={`mb-4 p-3 rounded text-sm font-medium font-sans ${
              stockError.includes('out of stock') || stockError.includes('Out of Stock')
                ? 'bg-red-900/20 border border-red-500/30 text-red-400'
                : 'bg-yellow-900/20 border border-yellow-500/30 text-yellow-400'
            }`}>
              {stockError}
            </div>
          )}

          {/* Add to Bag Button */}
          <button 
            onClick={handleAddToCart}
            disabled={isAddingToCart || (() => {
              const currentProduct = currentVariant || product;
              const stockQty = currentProduct.stock?.stock_qty || 0;
              return stockQty <= 0;
            })()}
            className={`w-full py-3 px-6 font-medium font-openSans mb-4 transition-all text-sm sm:text-base ${
              isAddingToCart || (() => {
                const currentProduct = currentVariant || product;
                const stockQty = currentProduct.stock?.stock_qty || 0;
                return stockQty <= 0;
              })()
                ? 'bg-gray-600 border-gray-400 text-gray-300 cursor-not-allowed'
                : 'bg-[#CCFF00] border-white text-black hover:bg-gray-800'
            }`}
          >
            {isAddingToCart ? 'Adding...' : (() => {
              const currentProduct = currentVariant || product;
              const stockQty = currentProduct.stock?.stock_qty || 0;
              return stockQty <= 0 ? 'Out of Stock' : 'Add to bag';
            })()}
          </button>

          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-6 space-y-4 sm:space-y-0">
            <span className="text-white font-openSans underline text-sm sm:text-base">Product details</span>
            <div className="flex items-center space-x-2 text-white">
              <span className="font-sans text-sm sm:text-base">Share</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#CCFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Product Details Section */}
      <div className="w-full flex justify-center items-start bg-black py-8 sm:py-10 lg:py-14">
        <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-8 lg:gap-16 px-4 sm:px-6">
          {/* Left: Product Details */}
          <div className="flex-1">
            <h2 className="text-base sm:text-lg lg:text-[18px] font-bold mb-4 sm:mb-6 font-alexandria text-white">Product details</h2>
            <div className="text-[#FAF8F8] font-openSans text-sm sm:text-base lg:text-[16px] font-normal leading-relaxed lg:leading-[30px]">
              {(() => {
                const text = tFull || product.full_description || product.product_description || '';
                return text ? parseMarkdown(text) : <p>Detailed product information will be displayed here.</p>;
              })()}
            </div>
            <ul className="list-disc ml-5 mt-6 sm:mt-8 text-[#FAF8F8] mb-6 sm:mb-8 text-sm sm:text-base lg:text-[16px] font-openSans font-normal leading-relaxed lg:leading-[26px] space-y-1">
              <li>Premium quality materials</li>
              <li>Exceptional craftsmanship</li>
              <li>Perfect fit and comfort</li>
            </ul>
            <div className="flex flex-wrap gap-2 sm:gap-4 font-montserrat mt-4">
              <button className="bg-[#CCFF00] bg-opacity-70 text-[#F9F9F9] font-bold py-2 px-3 rounded shadow-md font-sans whitespace-nowrap text-xs sm:text-sm">Material &amp; Care</button>
              <button className="bg-[#CCFF00] bg-opacity-70 text-[#F9F9F9] font-bold py-2 px-3 rounded shadow-md font-sans whitespace-nowrap text-xs sm:text-sm">Fit &amp; Style</button>
              <button className="bg-[#CCFF00] bg-opacity-70 text-[#F9F9F9] font-bold py-2 px-2 rounded shadow-md font-sans whitespace-nowrap text-xs sm:text-sm">Design</button>
              <button className="bg-[#CCFF00] bg-opacity-70 text-[#F9F9F9] font-bold py-2 px-4 rounded shadow-md font-sans whitespace-nowrap text-xs sm:text-sm">Premium quality</button>
            </div>
          </div>
          {/* Right: Information */}
          <div className="flex-1">
            <h2 className="text-base sm:text-lg lg:text-[18px] font-bold mb-4 sm:mb-6 font-alexandria text-white">Information</h2>
            <ul className="list-disc ml-4 mt-4 sm:mt-6 text-[#FAF8F8] mb-4 sm:mb-6 text-sm sm:text-base lg:text-[16px] font-openSans font-normal leading-relaxed lg:leading-[26px] space-y-1">
              <li>Brand: {tBrand || product.brand_name || 'Premium Brand'}</li>
              <li>Category: {tCategory || product.category_name}</li>
              <li>SKU: {product.sku}</li>
              <li>Stock: {product.is_in_stock ? 'In Stock' : 'Out of Stock'}</li>
            </ul>
            <p className="text-white mb-6 sm:mb-8 text-sm sm:text-base lg:text-[16px] font-openSans">
              High-quality product with excellent features <br className="hidden sm:block" /> and modern design for the perfect look.
            </p>
            <div className="flex flex-col sm:flex-row font-montserrat gap-4 sm:gap-8 mt-6 sm:mt-8">
              <a href="#" className="underline text-white text-xs sm:text-sm">Delivery</a>
              <a href="#" className="underline text-white text-xs sm:text-sm">Return</a>
              <a href="#" className="underline text-white text-xs sm:text-sm">Help</a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Similar Products Section */}
      <SimilarProducts relatedProducts={relatedProducts} />

      {/* Reviews Section (real data with delivered-order gating) */}
      <Shop3ReviewsSection shopProductId={product.product_id} />
      
      {/* Image Gallery Modal */}
      {isGalleryOpen && (
        <ImageGalleryModal
          product={product}
          currentVariant={currentVariant}
          currentIndex={currentGalleryIndex}
          onClose={() => setIsGalleryOpen(false)}
          onIndexChange={setCurrentGalleryIndex}
        />
      )}
    </div>
  );
};

// Image Gallery Modal Component
interface ImageGalleryModalProps {
  product: Product;
  currentVariant: Product | null;
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  product,
  currentVariant,
  currentIndex,
  onClose,
  onIndexChange
}) => {
  // Get all media (images and videos)
  const getAllMedia = () => {
    const variantImages = currentVariant?.media?.images || [];
    const productImages = product?.media?.images || [];
    const variantVideos = currentVariant?.media?.videos || [];
    const productVideos = product?.media?.videos || [];
    
    // Combine all images
    const allImages = [...variantImages, ...productImages]
      .map(img => ({ type: 'image' as const, url: img?.url, alt: 'Product image' }))
      .filter(item => item.url);
    
    // Combine all videos
    const allVideos = [...variantVideos, ...productVideos]
      .map(video => ({ type: 'video' as const, url: video?.url, alt: 'Product video' }))
      .filter(item => item.url);
    
    // Remove duplicates
    const allMedia = [...allImages, ...allVideos];
    const uniqueMedia = allMedia.filter((item, index, arr) => 
      arr.findIndex(m => m.url === item.url) === index
    );
    
    return uniqueMedia;
  };

  const allMedia = getAllMedia();
  const currentMedia = allMedia[currentIndex];

  const handlePrevious = () => {
    const newIndex = currentIndex === 0 ? allMedia.length - 1 : currentIndex - 1;
    onIndexChange(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex === allMedia.length - 1 ? 0 : currentIndex + 1;
    onIndexChange(newIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
        aria-label="Close gallery"
      >
        <X size={32} />
      </button>

      {/* Navigation Buttons */}
      {allMedia.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Main Content */}
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Media Display */}
        <div className="flex-1 flex items-center justify-center">
          {currentMedia?.type === 'video' ? (
            <div className="relative">
              <video
                src={currentMedia.url}
                controls
                className="max-w-full max-h-[70vh] object-contain"
                autoPlay
                muted
              />
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                <Play size={16} />
                Video
              </div>
            </div>
          ) : (
            <img
              src={currentMedia?.url || "assets/shop3/ProductPage/pd1.svg"}
              alt={currentMedia?.alt || "Product image"}
              className="max-w-full max-h-[70vh] object-contain"
            />
          )}
        </div>

        {/* Thumbnail Navigation */}
        {allMedia.length > 1 && (
          <div className="mt-4 flex justify-center">
            <div className="flex gap-2 overflow-x-auto max-w-full pb-2">
              {allMedia.map((media, index) => (
                <button
                  key={index}
                  onClick={() => onIndexChange(index)}
                  className={`flex-shrink-0 border-2 rounded-lg overflow-hidden transition-all ${
                    index === currentIndex 
                      ? 'border-[#CCFF00] scale-110' 
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {media.type === 'video' ? (
                    <div className="relative">
                      <video
                        src={media.url}
                        className="w-16 h-16 object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <Play size={16} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={media.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-16 h-16 object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Counter */}
        {allMedia.length > 1 && (
          <div className="text-center text-white text-sm mt-2">
            {currentIndex + 1} of {allMedia.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;

// --- Reviews Section Component for Shop3 ---
interface ShopReviewImage { image_id: number; image_url: string }
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

const Shop3ReviewsSection: React.FC<{ shopProductId: number }> = ({ shopProductId }) => {
  const [shopReviews, setShopReviews] = useState<ShopReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPages, setReviewsPages] = useState(1);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '', orderId: '' });
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  const { toasts, error: showError } = useToast();
  // Images for review
  type SelectedImage = { file: File; preview: string };
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const MAX_IMAGES = 5;
  const MAX_BYTES = 5 * 1024 * 1024;
  const readFileAsDataURL = (file: File) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file); });
  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageError(null);
    const available = Math.max(0, MAX_IMAGES - selectedImages.length);
    const toAdd = files.slice(0, available);
    if (files.length > available) setImageError(`You can upload up to ${MAX_IMAGES} images`);
    const valid: File[] = [];
    for (const f of toAdd) { if (f.size > MAX_BYTES) { setImageError('Each image must be smaller than 5 MB'); continue; } valid.push(f); }
    const newSel: SelectedImage[] = [];
    for (const f of valid) { const preview = await readFileAsDataURL(f); newSel.push({ file: f, preview }); }
    setSelectedImages(prev => [...prev, ...newSel]);
    e.currentTarget.value = '';
  };
  const removeImageAt = (idx: number) => setSelectedImages(prev => prev.filter((_, i) => i !== idx));

  const fetchShopReviews = async (p: number = 1) => {
    try {
      setReviewsLoading(true);
      const res = await shop3ApiService.getShopProductReviews(Number(shopProductId), p, 5);
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

  useEffect(() => { fetchShopReviews(1); }, [shopProductId]);

  // Display-only translation for review titles and bodies
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();
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
        setTReviews(prev => prev);
      }
    };
    run();
  }, [shopReviews, i18n.language, translateBatch]);

  // Eligibility will be checked on clicking Write Review

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
  const jwt = localStorage.getItem('access_token') || '';
      const payload = {
        shop_order_id: newReview.orderId.trim(),
        shop_product_id: Number(shopProductId),
        rating: newReview.rating,
        title: newReview.title.trim() || 'Review',
        body: newReview.comment.trim(),
        images: selectedImages.map(si => si.preview),
      };
      await shop3ApiService.createShopReview(payload, jwt);
      setShowWriteReview(false);
      setNewReview({ rating: 5, title: '', comment: '', orderId: '' });
      setSelectedImages([]);
      fetchShopReviews(1);
    } catch (err: any) {
    showError(err.message || 'Failed to submit review');    }
  };

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
  // Candidate product IDs (current product only in this scoped component)
  const candidateIds = new Set<number>([Number(shopProductId)]);
      let latestMatch: any = null;
      while (hasNext && page <= 5) {
        const res = await shop3ApiService.getMyShopOrders(page, 50, jwt);
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

  return (
    <div className="w-full bg-black py-8 sm:py-12">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
            <h2 className="text-2xl sm:text-3xl lg:text-[42px] font-normal font-bebas text-white">REVIEWS</h2>
            <p className="underline text-xs sm:text-sm text-gray-300">Showing {shopReviews.length} review{shopReviews.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            <button onClick={handleOpenReview} className="px-4 sm:px-6 py-3 bg-[#CCFF00] text-black rounded-full font-gilroy text-sm sm:text-base font-semibold w-full sm:w-auto">Write Review</button>
            {eligibilityChecked && eligibilityError && (
              <p className="text-red-400 text-xs">{eligibilityError}</p>
            )}
          </div>
        </div>

        {showWriteReview && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-5 mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-white">Write your review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-3">
              {/* orderId is set after eligibility check */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Rating</label>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(star=> (
                    <button type="button" key={star} onClick={()=>setNewReview(prev=>({...prev, rating: star}))}>
                      <Star className={`w-4 h-4 ${star <= newReview.rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-600'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title</label>
                <input value={newReview.title} onChange={(e)=>setNewReview(prev=>({...prev, title: e.target.value}))} className="w-full p-2 border rounded bg-black text-white border-gray-700" placeholder="Great product!" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Your review</label>
                <textarea value={newReview.comment} onChange={(e)=>setNewReview(prev=>({...prev, comment: e.target.value}))} className="w-full p-2 border rounded min-h-[100px] bg-black text-white border-gray-700" placeholder="Share your thoughts…" required />
              </div>
              {/* Images uploader */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Add photos (optional)</label>
                <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#CCFF00] file:text-black hover:file:bg-[#b7ea00]" />
                <p className="text-xs text-gray-400 mt-1">Up to 5 images, each less than 5 MB.</p>
                {imageError && <p className="text-xs text-red-400 mt-1">{imageError}</p>}
                {selectedImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {selectedImages.map((si, idx) => (
                      <div key={idx} className="relative group">
                        <img src={si.preview} alt={`preview-${idx}`} className="h-16 w-16 object-cover rounded border border-gray-700" />
                        <button type="button" onClick={() => removeImageAt(idx)} className="absolute -top-2 -right-2 bg-black border border-gray-600 rounded-full w-6 h-6 text-xs font-bold hidden group-hover:flex items-center justify-center text-white" aria-label="Remove image">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={!eligibilityChecked || !newReview.orderId} className={`px-4 py-2 rounded text-black ${(!eligibilityChecked || !newReview.orderId) ? 'bg-gray-600 text-white cursor-not-allowed' : 'bg-[#CCFF00]'}`}>Submit</button>
                <button type="button" onClick={()=>{setShowWriteReview(false); setSelectedImages([]);}} className="px-4 py-2 rounded border border-gray-700 text-white">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {reviewsLoading ? (
          <div className="text-gray-400">Loading reviews…</div>
        ) : shopReviews.length > 0 ? (
          <div>
            {shopReviews.map((review)=> (
              <div key={review.review_id} className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 rounded-full flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold font-bebas text-lg sm:text-xl uppercase truncate text-left text-white">{review.user?.first_name || 'User'}</h3>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < review.rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-600'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-base text-gray-400 font-gilroy whitespace-nowrap self-start sm:self-auto text-left">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-xs sm:text-sm text-gray-200 font-gilroy leading-relaxed text-left">{(tReviews[review.review_id]?.title || review.title) ? `${tReviews[review.review_id]?.title || review.title} — ` : ''}{tReviews[review.review_id]?.body || review.body}</p>
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
                            (window as any).__shop3_setViewer({ urls, index: idx });
                          } catch {}
                        }}
                        aria-label="View image"
                      >
                        <img src={img.image_url} alt={`review image ${idx + 1}`} className="h-16 w-16 object-cover rounded border border-gray-700" />
                      </button>
                    ))}
                  </div>
                )}
                <hr className="mt-3 sm:mt-4 border-gray-800" />
              </div>
            ))}
            {reviewsPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button disabled={reviewsPage===1} onClick={()=>fetchShopReviews(reviewsPage-1)} className="px-3 py-1 border rounded disabled:opacity-50 border-gray-700 text-white">Prev</button>
                  <span className="text-gray-400">Page {reviewsPage} of {reviewsPages}</span>
                  <button disabled={reviewsPage===reviewsPages} onClick={()=>fetchShopReviews(reviewsPage+1)} className="px-3 py-1 border rounded disabled:opacity-50 border-gray-700 text-white">Next</button>
                </div>
            )}
          </div>
        ) : (
          <div className="text-gray-400">No reviews yet.</div>
        )}
      </div>
      {/* Mount viewer overlay at page root */}
     <ToastContainer toasts={toasts} />
      <ReviewImageViewerShop3 />
    </div>
  );
};

// Lightweight viewer for review images (Shop3)
function ReviewImageViewerShop3() {
  const [state, setState] = React.useState<{ urls: string[]; index: number } | null>(null);
  React.useEffect(() => {
    (window as any).__shop3_setViewer = (payload: any) => setState(payload);
    return () => { delete (window as any).__shop3_setViewer; };
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
            <img key={i} src={u} alt={`thumb-${i}`} className={`h-12 w-12 object-cover rounded border ${i===index?'border-[#CCFF00]':'border-gray-700'}`} onClick={() => setState({ urls, index: i })} />
          ))}
        </div>
      </div>
    </div>
  );
}
