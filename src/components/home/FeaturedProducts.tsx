import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

// Product type for featured products from API
export type FeaturedProduct = {
  product_id: number;
  product_name: string;
  selling_price: number;
  special_price: number | null;
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

const FeaturedProducts: React.FC = () => {
  const { t } = useTranslation();
  const [itemsPerView, setItemsPerView] = useState(4);
  const [gapPx, setGapPx] = useState(28);
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    itemWidth: window.innerWidth < 640 ? (window.innerWidth - 32 - 12) / 2 : // 2 items on mobile (padding + gap-3)
               window.innerWidth < 768 ? (window.innerWidth - 32) / 2 - 6 : // 2 items on tablet
               window.innerWidth < 1024 ? (window.innerWidth - 32) / 3 - 8 : // 3 items on laptop
               window.innerWidth < 1280 ? (window.innerWidth - 32) / 4 - 9 : // 4 items on desktop
               (window.innerWidth - 32) / 5 - 10, // 5 items on large desktop
    gap: 12
  });

  // Fetch featured products
  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/featured-products/?per_page=12`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch featured products');
      }

      const data = await response.json();
      // console.log('API Response:', data);

      if (data.message?.products && Array.isArray(data.message.products)) {
        // console.log('Products array:', data.message.products);
        setProducts(data.message.products);
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
      console.error('Error fetching featured products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch featured products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  // Update items per view and gap based on screen size (mobile: 2 cards, smaller gap)
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      setGapPx(width < 640 ? 12 : 28); // gap-3 on mobile, gap-7 on sm+
      if (width < 640) {
        setItemsPerView(2);
      } else if (width < 768) {
        setItemsPerView(2);
      } else if (width < 1024) {
        setItemsPerView(3);
      } else if (width < 1280) {
        setItemsPerView(4);
      } else {
        setItemsPerView(5);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);
  
  if (loading) {
    return (
      <section className="pb-12">
        <div className="container mx-auto px-4 xl:px-14">
          <div className="flex justify-center items-center h-64 font-worksans">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="pb-12">
        <div className="container mx-auto px-4 xl:px-14">
          <div className="flex flex-col items-center justify-center h-64 font-worksans">
            <p className="text-red-500 mb-4">{t('common.error')}: {error}</p>
            <button 
              onClick={fetchFeaturedProducts}
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
      {products && <div className="container mx-auto px-4 xl:px-14">
        {/* Header with navigation */}
        <div className="flex justify-between items-center mb-6">
      <h6 className="text-xl font-medium font-worksans">{t('home.sections.featuredTitle')}</h6>
          <div className="flex items-center">
            <Link to="/featured-products" className="text-primary-500 text-sm font-medium mr-3 sm:mr-10 font-worksans">
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

        {/* Products carousel */}
        <div className="relative">
          <div
            ref={containerRef}
            className="flex overflow-x-auto gap-3 sm:gap-7 pb-4 scrollbar-hide scroll-smooth snap-x"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {products.map((product) => (
              <div 
                key={product.product_id} 
                className="flex-none snap-start"
                style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * gapPx / itemsPerView}px)` }}
              >
                <ProductCard 
                  product={{
                    id: product.product_id,
                    name: product.product_name,
                    price: product.price, // Use backend-calculated price
                    original_price: product.originalPrice || 0, // Use backend-calculated originalPrice
                    special_price: product.special_price,
                    image_url: product.images?.[0] || '',
                    images: product.images || [],
                    stock: product.stock?.stock_qty || 0,
                    is_deleted: false,
                    sku: '',
                    description: product.product_description,
                    category: product.category ?? { category_id: 0, name: '' },
                    brand: product.brand,
                    special_start: null,
                    special_end: null,
                    discount_pct: product.discount_pct,
                    placement: product.placement,
                    rating: 0,
                    reviews: 0,
                    isNew: false,
                    isBuiltIn: false,
                    featured: false,
                    favourite: false,
                    currency: 'INR',
                    tags: [],
                    primary_image: product.images?.[0] || '',
                    category_id: product.category?.category_id,
                    brand_id: product.brand?.brand_id,
                    attributes: [],
                    created_at: ''
                  }}
                  salePercentage={product.discount_pct || undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </div>}
    </section>
  );
};

export default FeaturedProducts;