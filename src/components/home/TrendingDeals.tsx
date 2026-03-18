import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';
import { Product } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TrendingDeals: React.FC = () => {
  const { t } = useTranslation();
  const [itemsPerView, setItemsPerView] = useState(4);
  const [gapPx, setGapPx] = useState(28);
  const [products, setProducts] = useState<Product[]>([]);
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

  // Fetch trending deals
  const fetchTrendingDeals = async () => {
    try {
      setLoading(true);
      // console.log('Fetching trending deals from:', `${API_BASE_URL}/api/products/trendy-deals`);
      
      const response = await fetch(`${API_BASE_URL}/api/products/trendy-deals`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('API Response Status:', response.status);
        console.error('API Response Status Text:', response.statusText);
        throw new Error(`Failed to fetch trending deals: ${response.status}`);
      }

      const data = await response.json();
      // console.log('=== API Response Debug ===');
      // console.log('Full API Response:', data);
      // console.log('Response Type:', typeof data);
      // console.log('Response Keys:', Object.keys(data));
      // console.log('Products Array:', data.products);
      // console.log('First Product Sample:', data.products?.[0]);
      // console.log('Products Length:', data.products?.length);
      // console.log('========================');

      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        setError(null);
      } else {
        console.error('Invalid data structure:', {
          hasProducts: Boolean(data.products),
          isProductsArray: Array.isArray(data.products),
          dataType: typeof data.products,
          dataKeys: Object.keys(data)
        });
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching trending deals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trending deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingDeals();
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
          <div className="flex justify-center items-center h-64">
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
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-500 mb-4">{t('common.error')}: {error}</p>
            <button 
              onClick={fetchTrendingDeals}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              {t('common.retry', 'Try Again')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-0 pb-4 nav:pt-0 nav:pb-6">
      <div className="container mx-auto px-4 xl:px-14">

        <div className="flex flex-col space-y-6">
          {/* Header with navigation */}
          <div className="flex flex-row justify-between items-center w-full space-y-0 mb-4 md:mb-0">
            <h6 className="text-xl font-medium font-worksans">{t('home.sections.trendingTitle')}</h6>
            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Link to="/trendy-deals" className="text-orange-500 text-sm font-medium">
                {t('home.seeAll')}
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3">
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
                  key={product.id} 
                  className="flex-none snap-start"
                  style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * gapPx / itemsPerView}px)` }}
                >
                  <ProductCard 
                    product={product}
                    isNew={product.isNew ?? false}
                    isBuiltIn={product.isBuiltIn ?? false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendingDeals; 