import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { toast } from "react-hot-toast";
import { Share2, Heart, Check, Copy, Facebook, Twitter, Mail } from "lucide-react";

import { formatMoney } from "../utils/money";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Product {
  product_id: number;
  name: string;
  image?: string | null;
  media?: ProductMedia[]; // <-- add this line
  product_name: string;
  product_description: string;
  price: number;
  special_price?: number;
  originalPrice?: number;
  brand_name?: string;
  category_name?: string;
  // Add more fields as needed
}

interface LiveStream {
  stream_id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  scheduled_time: string | null;
  is_live: boolean;
  status: string;
  stream_key: string; // YouTube video ID
  merchant: {
    id: number;
    business_name: string;
    business_email: string;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  } | null;
  product?: Product;
}

interface ProductMedia {
  media_id: number;
  type: string;
  url: string;
  sort_order: number;
}

interface ProductAttribute {
  attribute_id: number;
  attribute_name: string;
  value_code: string;
  value_text: string;
  value_label: string | null;
  is_text_based: boolean;
}

interface ProductDetails {
  product_id: number;
  product_name: string;
  cost_price: number;
  selling_price: number;
  price?: number;
  originalPrice?: number;
  discount_pct: number;
  special_price: number | null;
  is_on_special_offer?: boolean;
  product_description: string;
  media: ProductMedia[];
  attributes: ProductAttribute[];
  category: {
    category_id: number;
    name: string;
  };
  brand: {
    brand_id: number;
    name: string;
  };
}

const LiveShopProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedAttributes, setSelectedAttributes] = useState<{ [key: number]: string | string[] }>({});
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    loading: wishlistLoading,
    wishlistItems,
  } = useWishlist();

  useEffect(() => {
    const fetchStream = async () => {
      console.log('Fetching stream with ID:', productId);
      setLoading(true);
      setError(null);

      // Validate productId (which is actually the stream_id)
      if (!productId) {
        console.error('No stream ID provided');
        setError('No stream ID provided');
        setLoading(false);
        return;
      }

      const url = `${API_BASE_URL}/api/live-streams/${productId}`;
      console.log('Fetching from URL:', url);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch live stream');
        }
        const data = await response.json();
        console.log('Stream API Response:', data);

        // Validate stream data
        if (!data) {
          console.error('No stream data received');
          setError('Stream not found');
          setLoading(false);
          return;
        }

        console.log('Setting stream data:', data);
        setStream(data);

        // Validate and fetch product details
        if (data.product && data.product.product_id) {
          console.log('Found product ID in stream:', data.product.product_id);
          await fetchProductDetails(data.product.product_id);
        } else {
          console.log('No product found in stream data');
          setError('No product associated with this stream');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching stream:', err);
        setError('Failed to fetch live stream');
        setLoading(false);
      }
    };

    const fetchProductDetails = async (productId: number) => {
      console.log('Fetching product details for ID:', productId);
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}/details`);
        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }
        const data = await response.json();
        console.log('Product API Response:', data);

        // Validate product data
        if (!data || !data.product_id) {
          throw new Error('Invalid product data received');
        }

        setProduct(data);
        if (data.media && data.media.length > 0) {
          console.log('Setting initial product image:', data.media[0].url);
          setSelectedImage(data.media[0].url);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to fetch product details');
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [productId]); // Make sure productId is in dependency array

  // Attribute selection logic (from ProductDetail)
  const handleAttributeSelect = (
    attributeId: number,
    value: string,
    isMultiSelect: boolean
  ) => {
    setSelectedAttributes((prev) => {
      if (isMultiSelect) {
        const currentValues = (prev[attributeId] as string[]) || [];
        const newValues = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value];
        return { ...prev, [attributeId]: newValues };
      } else {
        return { ...prev, [attributeId]: value };
      }
    });
  };

  // Add to Cart logic
  const handleAddToCart = () => {
    if (!product) return;
    const calculatedPrice = product.price || product.selling_price;
    const calculatedOriginalPrice = product.originalPrice || product.cost_price;
    const cartProduct = {
      ...product,
      id: product.product_id,
      name: product.product_name,
      price: calculatedPrice,
      original_price: calculatedOriginalPrice,
      special_price: product.special_price,
      currency: "INR",
      image: product.media[0]?.url || "",
      image_url: product.media[0]?.url || "",
      stock: 100,
      isNew: true,
      isBuiltIn: false,
      rating: 0,
      reviews: 0,
      sku: `SKU-${product.product_id}`,
      category: product.category,
      brand: product.brand,
      is_deleted: false,
    };
    addToCart(cartProduct, quantity, selectedAttributes);
    toast.success("Added to cart!");
  };

  // Wishlist logic
  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to wishlist");
      return;
    }
    try {
      const productId = Number(product?.product_id);
      const isInWishlistItem = isInWishlist(productId);
      if (isInWishlistItem) {
        const wishlistItem = wishlistItems.find(
          (item) => item.product_id === productId
        );
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem.wishlist_item_id);
        }
      } else {
        await addToWishlist(productId);
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  // Share logic
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToClipboard(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedToClipboard(false), 2000);
    setShowShareOptions(false);
  };
  const shareViaPlatform = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(product?.product_name || "Check out this product");
    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${title}&body=Check out this product: ${url}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, "_blank");
    setShowShareOptions(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <div className="mt-4 text-gray-400 text-sm">Loading live stream details...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center font-semibold">{error || 'Live stream not found.'}</div>
      </div>
    );
  }

  // Attribute selection UI (from ProductDetail)
  const renderAttributeOptions = () => {
    if (!product?.attributes || product.attributes.length === 0) return null;
    // Group attributes by name
    const groupedAttributes = product.attributes.reduce((groups, attr) => {
      const key = attr.attribute_name.toLowerCase();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(attr);
      return groups;
    }, {} as { [key: string]: typeof product.attributes });
    return (
      <div className="mb-6 space-y-4">
        {Object.entries(groupedAttributes).map(([groupKey, attributes]) => {
          const firstAttr = attributes[0];
          const isMultiSelect = firstAttr.attribute_name.toLowerCase().includes("size") || firstAttr.attribute_name.toLowerCase().includes("color");
          if (isMultiSelect) {
            const selectedValues = (selectedAttributes[firstAttr.attribute_id] as string[]) || [];
            return (
              <div key={groupKey} className="flex flex-wrap items-center gap-4">
                <div className="text-sm font-medium text-gray-700 min-w-[100px]">{firstAttr.attribute_name}:</div>
                <div className="flex flex-wrap gap-3">
                  {attributes.map((attr) => {
                    const currentValue = attr.is_text_based ? attr.value_text : attr.value_label || attr.value_text;
                    const isSelected = selectedValues.includes(currentValue);
                    return (
                      <button
                        key={attr.attribute_id}
                        onClick={() => handleAttributeSelect(firstAttr.attribute_id, currentValue, true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isSelected ? "border-2 border-primary-500 bg-primary-50 text-primary-700 shadow-sm" : "border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
                      >
                        {currentValue}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          } else {
            const selectedValue = selectedAttributes[firstAttr.attribute_id] as string;
            return (
              <div key={groupKey} className="flex flex-wrap items-center gap-4">
                <div className="text-sm font-medium text-gray-700 min-w-[100px]">{firstAttr.attribute_name}:</div>
                <div className="flex flex-wrap gap-3">
                  {attributes.map((attr) => {
                    const value = attr.is_text_based ? attr.value_text : attr.value_label || attr.value_text;
                    const isSelected = selectedValue === value;
                    return (
                      <button
                        key={attr.attribute_id}
                        onClick={() => handleAttributeSelect(firstAttr.attribute_id, value, false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isSelected ? "border-2 border-primary-500 bg-primary-50 text-primary-700 shadow-sm" : "border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // Share dropdown UI
  const renderShareDropdown = () => (
    <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10">
      <div className="p-3 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700">Share this product</h3>
      </div>
      <div className="p-2">
        <button onClick={copyToClipboard} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
          {copiedToClipboard ? (<><Check size={16} className="text-green-500 mr-2" /> Copied!</>) : (<><Copy size={16} className="mr-2" /> Copy link</>)}
        </button>
        <button onClick={() => shareViaPlatform("facebook")} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
          <Facebook size={16} className="text-[#1877F2] mr-2" /> Facebook
        </button>
        <button onClick={() => shareViaPlatform("twitter")} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
          <Twitter size={16} className="text-[#1DA1F2] mr-2" /> Twitter
        </button>
        <button onClick={() => shareViaPlatform("email")} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
          <Mail size={16} className="text-gray-600 mr-2" /> Email
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen mt-5 bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 2xl:px-4 xl:px-2 lg:px-4 xs:px-4 ">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3">
          <h1 className="text-primary-600 text-lg font-medium">{stream?.title}</h1>
        </div>
        <div className="flex flex-col lg:flex-row">
          {/* Left Section - Live Stream or Product Image */}
          <div className="w-full lg:w-1/2 h-[400px] lg:h-[600px] relative ">
            {stream?.stream_key ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${stream.stream_key}?autoplay=1&mute=0&enablejsapi=1`}
                title={stream?.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-lg"
              ></iframe>
            ) : product.media && product.media.length > 0 ? (
              <img
                src={selectedImage}
                alt={product.product_name}
                className="w-full h-full object-contain rounded-lg bg-white border"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg text-gray-500">
                No live stream or product image available
              </div>
            )}
          </div>
          {/* Right Section - Product Details */}
          <div className="w-full lg:w-[48%] p-4 sm:p-6 ">
            <div className="max-w-lg mx-auto">
              {/* Centered small product image card with product image from media array */}
              <div className="flex justify-center mb-6">
                <div className="bg-white border rounded-lg shadow p-2 w-40 h-40 flex items-center justify-center">
                  <img
                    src={
                      product?.media?.find((m: any) => m.type === 'image')?.url ||
                      'https://source.unsplash.com/random/200x200?product'
                    }
                    alt={product?.product_name}
                    className="object-contain max-h-36 max-w-36"
                  />
                </div>
              </div>
              <h2 className="text-lg font-bold mb-4">About Product</h2>
              <h3 className="text-xl font-semibold mb-2">{product.product_name}</h3>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {formatMoney(product.special_price || product.price || product.selling_price)}
                </span>
                {product.originalPrice && (
                  <span className="text-base text-gray-400 line-through ml-2">
                    {formatMoney(product.originalPrice)}
                  </span>
                )}
                {!product.originalPrice && product.cost_price > (product.special_price || product.price || product.selling_price) && (
                  <span className="text-base text-gray-400 line-through ml-2">
                    {formatMoney(product.cost_price)}
                  </span>
                )}
                {product.is_on_special_offer && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium ml-2">
                    Special Offer
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-sm text-gray-500 mb-2">
                {product.brand?.name && <span>Brand: {product.brand.name}</span>}
                {product.category?.name && <span>Category: {product.category.name}</span>}
              </div>
              <p className="text-gray-700 mb-2">{product.product_description}</p>
              {renderAttributeOptions()}
              {/* Quantity Selector and Action Buttons */}
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">Quantity:</div>
                <div className="flex flex-row items-center gap-2 w-full">
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-[90px] h-9">
                    <button
                      className="w-8 h-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg disabled:opacity-30"
                      onClick={() => setQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm select-none">{quantity}</span>
                    <button
                      className="w-8 h-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  {/* Share Button */}
                  <div className="relative">
                    <button
                      className={`p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors min-w-[40px] text-gray-600 flex items-center justify-center`}
                      onClick={() => setShowShareOptions(!showShareOptions)}
                      aria-label="Share this product"
                    >
                      <Share2 size={18} />
                    </button>
                    {showShareOptions && renderShareDropdown()}
                  </div>
                  {/* Wishlist Button */}
                  <button
                    className={`p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors min-w-[40px] ${isInWishlist(Number(product?.product_id)) ? "text-primary-600" : "text-gray-600 flex items-center justify-center"}`}
                    onClick={handleWishlist}
                    disabled={wishlistLoading}
                    aria-label="Add to Wishlist"
                  >
                    {wishlistLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto"></div>
                    ) : (
                      <Heart size={18} className={isInWishlist(Number(product?.product_id)) ? "fill-current" : ""} />
                    )}
                  </button>
                </div>
                {/* Add to Cart Button */}
                <div className="flex gap-2 w-full mt-2">
                  <button
                    onClick={handleAddToCart}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-black duration-300 transition-colors w-full"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveShopProductDetailPage; 