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
    // ring instead of border so the hover state can change colour without shifting layout
    <div className="group flex h-full w-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.08)] transition-all duration-300 hover:-translate-y-1 hover:ring-primary-200 hover:shadow-[0_16px_32px_-12px_rgba(16,24,40,0.20),0_4px_10px_-4px_rgba(16,24,40,0.08)]">
      <Link to={`/product/${product.id}`} className="flex flex-col flex-grow">
        {/* Image area — full-bleed to the card edges */}
        <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
          <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105">
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
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="bg-gray-900/90 text-white text-sm font-semibold px-4 py-2 rounded-lg tracking-wide">
                Sold Out
              </span>
            </div>
          )}

          {/* Discount badge - top left */}
          {discountPct > 0 && (
            <span className="absolute top-2 left-2 z-20 inline-flex items-center rounded-md bg-primary-600 px-2 py-1 text-[11px] font-bold leading-none text-white shadow-sm">
              {discountPct}% OFF
            </span>
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
              className={`w-4 h-4 ${isInWishlist(Number(product.id)) ? "fill-current text-primary-600" : ""
                }`}
              strokeWidth={2}
            />
          </button>

          {/* Cart - bottom right, circular orange button (large) */}
          <button
            type="button"
            className="absolute bottom-3 right-3 p-2.5 z-20 rounded-full bg-primary-600 text-white shadow-lg ring-2 ring-white hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
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

        {/* Product details — divider separates it cleanly from the image block */}
        <div className="flex flex-1 flex-col border-t border-gray-100 p-3 sm:p-4">
          {/* Rating first: small, quiet, acts as an eyebrow above the name */}
          <span className="mb-1.5 inline-flex w-fit items-center gap-1 rounded-md bg-accent-50 px-1.5 py-0.5">
            <Star className="h-3 w-3 fill-accent-500 text-accent-500" strokeWidth={0} />
            <span className="text-[11px] font-semibold leading-none text-accent-800">
              {displayRating.toFixed(1)}
            </span>
          </span>

          {/* Name — two lines, reserved height so cards in a grid stay aligned */}
          <h3 className="min-h-[2.5rem] text-[13px] sm:text-sm font-semibold leading-snug text-gray-900 line-clamp-2 font-['Work_Sans'] transition-colors group-hover:text-primary-600">
            {translatedName || product.name}
          </h3>

          {/* Price pinned to the bottom so it lines up across the whole row */}
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-lg font-bold leading-none tracking-tight text-gray-900">
              Rs.{currentPrice.toFixed(2)}
            </span>
            {originalPrice != null && originalPrice > currentPrice && (
              <>
                <span className="text-xs leading-none text-gray-400 line-through">
                  Rs.{Number(originalPrice).toFixed(2)}
                </span>
                <span className="text-[11px] font-semibold leading-none text-success-600">
                  Save Rs.{(Number(originalPrice) - currentPrice).toFixed(0)}
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
