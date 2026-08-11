import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ProductCard from '../product/ProductCard';
import { Product } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// How many products the home screen shows (4 rows of 5 on xl). The rest live
// behind "See All". Capped by whatever /api/products/trendy-deals returns.
const VISIBLE_COUNT = 20;

const TrendingDeals: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <section className="pt-0 pb-4 nav:pt-0 nav:pb-6">
      <div className="container mx-auto px-4 xl:px-14">

        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-row justify-between items-center w-full space-y-0 mb-4 md:mb-0">
            <h6 className="text-xl font-medium font-worksans">{t('home.sections.trendingTitle')}</h6>
            <Link to="/trendy-deals" className="text-primary-600 text-sm font-medium hover:underline">
              {t('home.seeAll')}
            </Link>
          </div>

          {/* Products grid — 5 per row on xl, so VISIBLE_COUNT fills exactly two rows */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {products.slice(0, VISIBLE_COUNT).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isNew={product.isNew ?? false}
                isBuiltIn={product.isBuiltIn ?? false}
              />
            ))}
          </div>

          {/* See All — only when there is more than the grid shows */}
          {products.length > VISIBLE_COUNT && (
            <div className="flex justify-center pt-2">
              <Link
                to="/trendy-deals"
                className="inline-flex items-center rounded-lg border border-primary-600 px-8 py-2.5 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-600 hover:text-white"
              >
                {t('home.seeAll')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TrendingDeals; 