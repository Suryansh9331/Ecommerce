import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Star } from "lucide-react";
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

  const mediaImages = Array.isArray((product as any).media)
    ? (product as any).media
        .map((m: any) => m?.url || m?.image_url || m?.src)
        .filter(Boolean)
    : [];

  const images = Array.from(
    new Set([
      firstImage,
      ...(product.images && product.images.length > 0 ? product.images : []),
      ...mediaImages,
    ].filter(Boolean))
  );
  const hasMultipleImages = images.length > 1;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [prevImageIndex, setPrevImageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1); // 1 => next, -1 => prev
  const [slidePhase, setSlidePhase] = useState<"idle" | "initial" | "animating">("idle");
  const slideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveImageIndex(0);
    setPrevImageIndex(0);
    setSlidePhase("idle");
    setSlideDirection(1);
  }, [product.id]);

  useEffect(() => {
    return () => {
      if (slideTimeoutRef.current) window.clearTimeout(slideTimeoutRef.current);
    };
  }, []);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    if (slidePhase !== "idle") return;

    const nextIndex = (activeImageIndex - 1 + images.length) % images.length;
    setPrevImageIndex(activeImageIndex);
    setSlideDirection(-1);
    setActiveImageIndex(nextIndex);
    setSlidePhase("initial");

    requestAnimationFrame(() => setSlidePhase("animating"));
    if (slideTimeoutRef.current) window.clearTimeout(slideTimeoutRef.current);
    slideTimeoutRef.current = window.setTimeout(() => {
      setSlidePhase("idle");
    }, 260);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    if (slidePhase !== "idle") return;

    const nextIndex = (activeImageIndex + 1) % images.length;
    setPrevImageIndex(activeImageIndex);
    setSlideDirection(1);
    setActiveImageIndex(nextIndex);
    setSlidePhase("initial");

    requestAnimationFrame(() => setSlidePhase("animating"));
    if (slideTimeoutRef.current) window.clearTimeout(slideTimeoutRef.current);
    slideTimeoutRef.current = window.setTimeout(() => {
      setSlidePhase("idle");
    }, 260);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-visible shadow-sm hover:shadow-md transition-all duration-300 flex flex-col w-full border border-gray-200 p-3">
      <Link to={`/product/${product.id}`} className="flex flex-col flex-grow">
        {/* Image area */}
        <div className="relative w-full aspect-square bg-gray-50 overflow-hidden rounded-t-xl rounded-b-2xl">
          <div
            className="absolute inset-0 z-0"
            style={{
              clipPath: "polygon(0 0, 100% 0, 97% 100%, 3% 100%)",
            }}
          >
          {slidePhase === "idle" ? (
            <img
              src={images[activeImageIndex] || firstImage}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-image.png";
              }}
            />
          ) : (
            <>
              {/* Previous image layer */}
              <img
                src={images[prevImageIndex] || firstImage}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-in-out"
                style={{
                  transform:
                    slidePhase === "initial"
                      ? "translateX(0%)"
                      : slideDirection === 1
                        ? "translateX(-100%)"
                        : "translateX(100%)",
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-image.png";
                }}
              />

              {/* Active (incoming) image layer */}
              <img
                src={images[activeImageIndex] || firstImage}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-in-out"
                style={{
                  transform:
                    slidePhase === "initial"
                      ? slideDirection === 1
                        ? "translateX(100%)"
                        : "translateX(-100%)"
                      : "translateX(0%)",
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-image.png";
                }}
              />
              {/* Transition effect via Tailwind transition classes */}
            </>
          )}
          </div>

          {/* Image navigation arrows */}
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-white/95 border border-gray-200 text-gray-700 hover:bg-white shadow-sm transition-opacity opacity-100 md:opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-white/95 border border-gray-200 text-gray-700 hover:bg-white shadow-sm transition-opacity opacity-100 md:opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={2.5} />
              </button>
            </>
          )}

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
