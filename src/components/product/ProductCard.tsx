import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product } from "../../types";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useAmazonTranslate } from "../../hooks/useAmazonTranslate";

// Stable dummy rating 4.5–4.9 per product id
const getDisplayRating = (id: string | number): number => {
  const n = String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 4.5 + (n % 5) / 10;
};

interface ProductCardProps {
  product: Product;
  isBuiltIn?: boolean;
  salePercentage?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isBuiltIn = false,
  salePercentage,
}) => {
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    loading: wishlistLoading,
    wishlistItems,
  } = useWishlist();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate(import.meta.env.VITE_API_BASE_URL);
  const [translatedName, setTranslatedName] = useState<string>('');

  // Translate product name when language changes
  useEffect(() => {
    const doTranslate = async () => {
      const lang = (i18n.language || 'en').split('-')[0];
      if (lang === 'en' || !product.name) {
        setTranslatedName('');
        return;
      }
      try {
        const result = await translateBatch([{ id: 'name', text: product.name }], lang, 'text/plain');
        setTranslatedName(result['name'] || '');
      } catch (e) {
        setTranslatedName('');
      }
    };
    doTranslate();
  }, [product.name, i18n.language, translateBatch]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      // Store the current URL to redirect back after sign in
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/sign-in?returnUrl=${returnUrl}`);
      return;
    }

    // Check if user is a merchant or admin (they shouldn't be able to add to cart)
    if (user?.role === "merchant" || user?.role === "admin") {
      toast.error("Merchants and admins cannot add items to cart");
      return;
    }

    try {
      await addToCart(product, 1);
    } catch (error) {
      toast.error("Failed to add item to cart");
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please sign in to proceed with purchase");
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/sign-in?returnUrl=${returnUrl}`);
      return;
    }

    // Check if user is a merchant or admin
    if (user?.role === "merchant" || user?.role === "admin") {
      toast.error("Merchants and admins cannot make purchases");
      return;
    }

    // Create direct purchase item with default attributes (if any)
    const defaultAttributes: { [key: number]: string | string[] } = {};
    if (product.attributes && product.attributes.length > 0) {
      // For product cards, we'll use first available attribute values as defaults
      product.attributes.forEach((attr: any) => {
        if (!defaultAttributes[attr.attribute_id]) {
          defaultAttributes[attr.attribute_id] =
            attr.value_text || attr.value_label;
        }
      });
    }

    const directPurchaseItem = {
      product: {
        ...product,
        image_url: product.image_url || product.primary_image || "/placeholder-image.png",
      },
      quantity: 1,
      selected_attributes:
        Object.keys(defaultAttributes).length > 0
          ? defaultAttributes
          : undefined,
    };

    // Navigate to payment page with direct purchase data
    navigate("/payment", {
      state: {
        directPurchase: directPurchaseItem,
        discount: 0,
        appliedPromo: null,
        itemDiscounts: {},
      },
    });
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please sign in to add items to wishlist");
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/sign-in?returnUrl=${returnUrl}`);
      return;
    }

    // Check if user is a merchant or admin
    if (user?.role === "merchant" || user?.role === "admin") {
      toast.error("Merchants and admins cannot add items to wishlist");
      return;
    }

    try {
      const productId = Number(product.id);
      const isInWishlistItem = isInWishlist(productId);

      if (isInWishlistItem) {
        // Find the wishlist item ID from the wishlist items
        const wishlistItem = wishlistItems.find(
          (item) => item.product_id === productId
        );
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem.wishlist_item_id);
        }
      } else {
        // console.log("Attempting to add to wishlist, product ID:", productId);
        await addToWishlist(productId);
      }
    } catch (error) {
      console.error("Wishlist error details:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update wishlist"
      );
    }
  };



  const originalPrice =
    (product as { original_price?: number }).original_price ??
    (product as { originalPrice?: number }).originalPrice;
  const currentPrice = Number(product.price);

  const calculateSalePercentage = () => {
    if (originalPrice && currentPrice && originalPrice > currentPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return 0;
  };

  const discountPct = salePercentage ?? calculateSalePercentage();
  const displayRating = getDisplayRating(product.id);

  const firstImage =
    product.primary_image ||
    (product as { image_url?: string }).image_url ||
    (product as { image?: string }).image ||
    (product.images && product.images[0]) ||
    "/placeholder-image.png";
  const secondImage = product.images && product.images.length > 1 ? product.images[1] : null;

  return (
    <div className="group bg-white rounded-2xl overflow-visible shadow-sm hover:shadow-md transition-all duration-300 flex flex-col w-full border border-gray-200 p-3">
      <Link to={`/product/${product.id}`} className="flex flex-col flex-grow">
        {/* Image area: first image default, second image on hover */}
        <div className="relative w-full aspect-square bg-gray-50 overflow-hidden rounded-t-xl rounded-b-2xl">
          <div
            className="absolute inset-0 z-0"
            style={{
              clipPath: "polygon(0 0, 100% 0, 97% 100%, 3% 100%)",
            }}
          >
            <img
              src={firstImage}
              alt={product.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${secondImage ? "group-hover:opacity-0" : ""}`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-image.png";
              }}
            />
            {secondImage && (
              <img
                src={secondImage}
                alt={`${product.name} - view 2`}
                className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-image.png";
                }}
              />
            )}
          </div>

          {/* Sold out overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-t-xl rounded-b-2xl">
              <span className="bg-gray-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg">
                Sold Out
              </span>
            </div>
          )}

          {/* Wishlist - top right (small) */}
          <button
            type="button"
            className="absolute top-2 right-2 p-1.5 z-20 rounded-full bg-white/90 shadow-sm border border-gray-200 text-gray-800 hover:bg-white hover:shadow transition-all"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWishlist(e);
            }}
            disabled={wishlistLoading}
            aria-label="Wishlist"
          >
            <Heart
              className={`w-4 h-4 ${isInWishlist(Number(product.id)) ? "fill-current text-[#F2631F]" : ""
                }`}
              strokeWidth={2}
            />
          </button>

          {/* Cart - bottom right, circular orange button (large) */}
          <button
            type="button"
            className="absolute bottom-2 right-4 p-2 z-20 rounded-full bg-[#F2631F] text-white shadow-md hover:bg-[#e55a1a] transition-all disabled:opacity-50 disabled:pointer-events-none"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart(e);
            }}
            disabled={
              product.stock === 0 ||
              user?.role === "merchant" ||
              user?.role === "admin"
            }
            aria-label="Add to Cart"
          >
            <ShoppingCart className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Product details - smaller text on mobile */}
        <div className="px-1 pt-2 sm:pt-3 flex flex-col gap-1 sm:gap-1.5">
          {/* Line 1: name + rating */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate flex-1 font-['Work_Sans']">
              {translatedName || product.name}
            </h3>
            <span className="flex items-center gap-0.5 shrink-0 text-gray-700">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" strokeWidth={0} />
              <span className="text-[10px] sm:text-sm font-medium">{displayRating.toFixed(1)}</span>
            </span>
          </div>

          {/* Line 2: price, original price, discount badge */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base font-bold text-gray-900">
              Rs.{currentPrice.toFixed(2)}
            </span>
            {originalPrice != null && originalPrice > currentPrice && (
              <>
                <span className="text-[10px] sm:text-xs text-gray-500 line-through">
                  Rs.{Number(originalPrice).toFixed(2)}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-orange-100 text-[#F2631F] text-[9px] sm:text-[10px] font-semibold">
                  {discountPct}% OFF
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
