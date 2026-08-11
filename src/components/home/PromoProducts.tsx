import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../hooks/useAmazonTranslate';

// Product type for promo products from API
export type PromoProduct = {
  product_id: number;
  product_name: string;
  selling_price: number;
  special_price: number | null;
  special_start: string | null;
  special_end: string | null;
  discount_pct: number;
  product_description: string;
  images: string[];
  // Backend-calculated pricing fields
  price: number;
  originalPrice: number | null;
  category: {
    category_id: number;
    name: string;
  };
  brand: {
    brand_id: number;
    name: string;
  };
  placement?: {
    placement_id: number;
    sort_order: number;
    added_at: string;
    expires_at: string | null;
  };
  stock?: {
    stock_qty: number;
  };
};

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const PromoProducts: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    loading: wishlistLoading,
    wishlistItems
  } = useWishlist();
  const navigate = useNavigate();
  const [itemsPerView, setItemsPerView] = useState(2);
  const [promoProducts, setPromoProducts] = useState<PromoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<Record<number, Countdown>>({});
  const [nameMap, setNameMap] = useState<Record<number, string>>({});
  const { translateBatch } = useAmazonTranslate();

  const {
    containerRef,
    isDragging,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    scroll
  } = useHorizontalScroll({
    snapToItems: true,
    itemWidth: window.innerWidth < 1024 ? window.innerWidth - 32 : // 1 item on mobile/tablet (accounting for padding)
               (window.innerWidth - 32) / 2 - 6, // 2 items on desktop
    gap: 12
  });

  // Update items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width < 1024) { // lg breakpoint
        setItemsPerView(1);
      } else {
        setItemsPerView(2);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Calculate countdown for a product
  const calculateCountdown = (specialEnd: string): Countdown => {
    const endDate = new Date(specialEnd);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  // Update countdowns every second
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: Record<number, Countdown> = {};
      promoProducts.forEach(product => {
        if (product.special_end) {
          newCountdowns[product.product_id] = calculateCountdown(product.special_end);
        }
      });
      setCountdowns(newCountdowns);
    };

    // Initial update
    updateCountdowns();

    // Update every second
    const interval = setInterval(updateCountdowns, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [promoProducts]);

  // Fetch promo products
  const fetchPromoProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/promo-products/?per_page=12`);

      if (!response.ok) {
        throw new Error('Failed to fetch promo products');
      }

      const data = await response.json();
      // console.log('API Response:', data);

      if (data.message?.products && Array.isArray(data.message.products)) {
        // console.log('Products array:', data.message.products);
        setPromoProducts(data.message.products);
        setError(null);
      } else {
        console.error('Invalid data structure:', {
          hasMessage: Boolean(data.message),
          hasProducts: Boolean(data.message?.products),
          isProductsArray: Array.isArray(data.message?.products),
          dataType: typeof data.message?.products,
          dataKeys: Object.keys(data)
        });
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching promo products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch promo products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoProducts();
  }, []);

  // Translate product names display-only
  useEffect(() => {
    const doTranslate = async () => {
      if (!promoProducts.length) return;
      const lang = i18n.language;
      if (!lang || lang.startsWith('en')) { // reset to originals in English
        setNameMap({});
        return;
      }
      const items = promoProducts.map((p) => ({ id: String(p.product_id), text: p.product_name }));
      try {
        const res = await translateBatch(items, lang, 'text/plain');
        const map: Record<number, string> = {};
        for (const p of promoProducts) {
          const tr = res[String(p.product_id)];
          if (tr) map[p.product_id] = tr;
        }
        setNameMap(map);
      } catch (_) {
        // fail-open: keep originals
      }
    };
    doTranslate();
  }, [promoProducts, i18n.language, translateBatch]);

  const handleAddToCart = async (e: React.MouseEvent, product: PromoProduct) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/sign-in?returnUrl=${returnUrl}`);
      return;
    }

    // Check if user is a merchant or admin
    if (user?.role === 'merchant' || user?.role === 'admin') {
      toast.error('Merchants and admins cannot add items to cart');
      return;
    }

    try {
      await addToCart({
        id: product.product_id,
        name: product.product_name,
        price: product.price, // Use the backend-calculated price
        original_price: product.originalPrice || product.selling_price, // Use the backend-calculated originalPrice or fallback
        special_price: product.special_price,
        image_url: product.images?.[0] || '/placeholder-image.jpg',
        stock: product.stock?.stock_qty || 0,
        sku: product.product_id.toString(),
        is_deleted: false
      }, 1);
      toast.success(`${product.product_name} added to cart`);
    } catch {
      toast.error('Failed to add item to cart');
    }
  };

  const handleWishlist = async (e: React.MouseEvent, product: PromoProduct) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to add items to wishlist');
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/sign-in?returnUrl=${returnUrl}`);
      return;
    }

    // Check if user is a merchant or admin
    if (user?.role === 'merchant' || user?.role === 'admin') {
      toast.error('Merchants and admins cannot add items to wishlist');
      return;
    }

    try {
      const productId = product.product_id;
      const isInWishlistItem = isInWishlist(productId);

      if (isInWishlistItem) {
        const wishlistItem = wishlistItems.find(item => item.product_id === productId);
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem.wishlist_item_id);
          toast.success('Product removed from wishlist');
        }
      } else {
        await addToWishlist(productId);
        toast.success('Product added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist error details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update wishlist');
    }
  };



  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 xl:px-14">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-worksans">{t('home.sections.promoTitle')}</h2>
          </div>
          <div className="flex justify-center items-center h-64 font-worksans">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 xl:px-14">
          <div className="flex flex-col items-center justify-center h-64 font-worksans">
            <p className="text-red-500 mb-4">{t('common.error')}: {error}</p>
            <button
              onClick={fetchPromoProducts}
              className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              {t('common.retry', 'Try Again')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4">
      {promoProducts && <div className="container mx-auto px-4 xl:px-14">
        {/* Header with navigation */}
        <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-medium font-worksans">{t('home.sections.promoTitle')}</h2>
          <div className="flex items-center">
            <Link to="/promo-products" className="text-primary-500 text-sm font-medium mr-3 sm:mr-10 font-worksans">
        {t('home.seeAll')}
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <button
                onClick={() => scroll('left')}
                className="focus:outline-none"
                aria-label="Scroll Left"
              >
                <ChevronLeft size={20} className="text-gray-500 hover:text-black duration-300" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="focus:outline-none"
                aria-label="Scroll Right"
              >
                <ChevronRight size={20} className="text-gray-500 hover:text-black duration-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Promo Products Cards */}
        <div className="relative">
          <div
            ref={containerRef}
            className="flex overflow-x-auto gap-6 mb-10 scrollbar-hide scroll-smooth snap-x"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {promoProducts.map((product) => {
              const countdown = product.special_end ? countdowns[product.product_id] : null;
              const discount = product.originalPrice && product.price !== product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <div
                  key={product.product_id}
                  className="flex-none snap-start"
                  style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 24 / itemsPerView}px)` }}
                >
                  <Link 
                    to={`/product/${product.product_id}`}
                    className="block h-full"
                    onClick={(e) => {
                      if (isDragging) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="bg-white rounded-lg overflow-hidden border border-primary-100 shadow-sm transition-all duration-300 flex flex-col md:flex-row relative h-full">
                      {/* Discount Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-primary-600 text-white text-xs py-[3px] px-3 rounded-[4px]">
                          - {discount}%
                        </span>
                      </div>

                      {/* Product Image */}
                      <div className="md:w-2/5 pl-3 pt-2 pb-2 pr-3 h-64 md:h-auto relative flex-shrink-0">
                        <div className="w-full h-full rounded transition duration-300 hover:shadow-[0_0_30px_rgba(253,224,71,0.5)] bg-transparent flex items-center justify-center">
                          <img
                            src={product.images?.[0] || '/placeholder-image.jpg'}
                            alt={product.product_name}
                            className="w-full h-full object-contain rounded"
                          />
                        </div>
                        {/* Wishlist Button */}
                        <button
                          className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all duration-300 ${isInWishlist(product.product_id)
                            ? 'text-primary-600 bg-white shadow-md'
                            : 'text-gray-400 hover:text-primary-600 hover:bg-white hover:shadow-md'
                            }`}
                          onClick={(e) => handleWishlist(e, product)}
                          disabled={wishlistLoading}
                        >
                          <Heart className={`w-4 h-4 ${isInWishlist(product.product_id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Product Details */}
                      <div className="md:w-3/5 p-6 flex flex-col justify-between flex-grow">
                        <div>
                          <p className="font-normal text-sm font-worksans mb-2">{nameMap[product.product_id] || product.product_name}</p>
                          <div className="flex items-baseline mb-4">
                            <span className="text-xl font-bold">₹{product.price.toFixed(2)}</span>
                            {product.originalPrice && product.originalPrice !== product.price && (
                              <span className="text-sm text-gray-500 line-through ml-3">
                                ₹{product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Countdown Timer */}
                          {countdown && (
                            <div className="grid grid-cols-4 gap-2 mb-6 w-[203px] h-[62px]">
                              <div className="text-center">
                                <div className="bg-gray-100 p-2 rounded">
                                  <span className="text-base font-medium">{countdown.days}</span>
                                </div>
                                <span className="text-xs text-gray-500">{t('home.sections.day')}</span>
                              </div>
                              <div className="text-center">
                                <div className="bg-gray-100 p-2 rounded">
                                  <span className="text-base font-medium">{countdown.hours}</span>
                                </div>
                                <span className="text-xs text-gray-500">{t('home.sections.hour')}</span>
                              </div>
                              <div className="text-center">
                                <div className="bg-gray-100 p-2 rounded">
                                  <span className="text-base font-medium">{countdown.minutes.toString().padStart(2, '0')}</span>
                                </div>
                                <span className="text-xs text-gray-500">{t('home.sections.minute')}</span>
                              </div>
                              <div className="text-center">
                                <div className="bg-gray-100 p-2 rounded">
                                  <span className="text-base font-medium">{countdown.seconds.toString().padStart(2, '0')}</span>
                                </div>
                                <span className="text-xs text-gray-500">{t('home.sections.second')}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          className="w-full font-worksans hover:bg-black duration-300 font-medium text-sm bg-primary-600 text-white py-2 px-[94.5px] rounded-lg transition flex items-center justify-center gap-1.5"
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={product.stock?.stock_qty === 0 || user?.role === 'merchant' || user?.role === 'admin'}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {product.stock?.stock_qty === 0 ? t('home.sections.soldOut') : t('home.sections.addToCart')}
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>


      </div>}
    </section>
  );
};

export default PromoProducts; 