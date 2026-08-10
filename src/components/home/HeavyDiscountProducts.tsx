import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface HeavyDiscountProduct {
  product_id: string;
  product_name: string;
  primary_image?: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  selling_price?: number;
  cost_price?: number;
  discount_pct?: number;
}

interface ApiResponse {
  message?: {
    products: HeavyDiscountProduct[];
    pagination?: { total: number; pages: number; current_page: number; per_page: number };
  };
}

const HeavyDiscountProducts: React.FC = () => {
  const [products, setProducts] = useState<HeavyDiscountProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/heavy-discount-products/`);
        if (!response.ok) throw new Error('Failed to fetch');
        const json: ApiResponse = await response.json();
        const list = json.message?.products ?? [];
        setProducts(Array.isArray(list) ? list.slice(0, 4) : []);
      } catch (err) {
        console.error('HeavyDiscountProducts fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="relative px-4 pt-5 pb-4 nav:pt-8 nav:pb-6 overflow-hidden bg-orange-100/90">
        <div className="absolute top-0 right-0 w-40 h-40 nav:w-56 nav:h-56 rounded-full bg-[#F2631F]/12 -translate-y-1/2 translate-x-1/2" />
        <div className="container relative mx-auto max-w-6xl">
          <div className="grid grid-cols-2 nav:grid-cols-4 gap-3 nav:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-white/60 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !products.length) return null;

  return (
    <section className="relative px-4 pt-5 pb-4 nav:pt-8 nav:pb-6 overflow-hidden bg-gradient-to-b from-orange-100 via-amber-100/95 to-orange-100">
      {/* Decorative orange circles - top right */}
      <div
        className="absolute top-0 right-0 w-48 h-48 nav:w-72 nav:h-72 rounded-full bg-[#F2631F]/18 -translate-y-1/2 translate-x-1/4"
        aria-hidden
      />
      <div className="absolute top-4 right-8 nav:top-8 nav:right-16 w-24 h-24 nav:w-32 nav:h-32 rounded-full bg-[#F2631F]/12" aria-hidden />
      <div className="absolute bottom-1/4 left-0 w-32 h-32 nav:w-44 nav:h-44 rounded-full bg-amber-200/40 -translate-x-1/2" aria-hidden />

      <div className="container relative mx-auto max-w-6xl">
        <div className="text-center mb-5 nav:mb-7">
          <h2 className="text-xl nav:text-2xl font-semibold text-gray-900 font-['Playfair_Display',serif] tracking-tight">
            Heavy Discounts
          </h2>
          <p className="text-sm text-gray-700/90 mt-1">Limited time offers</p>
        </div>

        <div className="grid grid-cols-2 nav:grid-cols-4 gap-3 nav:gap-8">
          {products.map((product) => {
            const imageUrl = product.primary_image ?? product.images?.[0] ?? '';
            const discount = product.discount_pct ?? 0;

            return (
              <Link
                key={product.product_id}
                to={`/product/${product.product_id}`}
                className="group block rounded-2xl overflow-hidden bg-white/60 shadow-md hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2631F] focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.product_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-center min-h-[3.5rem]">
                    <span className="text-white text-lg nav:text-xl font-bold drop-shadow-lg tracking-tight">
                      {Math.round(discount)}% OFF
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HeavyDiscountProducts;
