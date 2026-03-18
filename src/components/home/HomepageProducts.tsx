import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../product/ProductCard';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../hooks/useAmazonTranslate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PRODUCTS_PER_PAGE = 4;

interface Category {
  category_id: number;
  name: string;
  slug: string;
  icon_url: string | null;
}

interface ProductMedia {
  media_id: number;
  product_id: number;
  type: string;
  url: string;
  sort_order: number;
  public_id: string | null;
}

interface Product {
  product_id: number;
  product_name: string;
  product_description: string;
  price: number;  // Use price from backend (already calculated with special price logic)
  originalPrice: number;  // Use originalPrice from backend
  selling_price?: number;  // Keep for backward compatibility
  cost_price?: number;  // Keep for backward compatibility
  image: string;
  stock: number;
  isNew?: boolean;
  featured?: boolean;
  favourite?: boolean;
  attributes: any[];
  brand_id: number;
  category_id: number;
  active_flag: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  discount_pct: number;
  merchant_id: number;
  sku: string;
  special_price: number | null;
  special_start: string | null;
  special_end: string | null;
  media: ProductMedia[];
}

interface CategoryWithProducts {
  category: Category;
  products: Product[];
  subcategories: {
    category: Category;
    products: Product[];
  }[];
}

interface CategoryState {
  activeCategory: string;
  currentPage: number;
}

// Scrollable product carousel with its own ref (one per category so each section scrolls)
const ProductCarousel: React.FC<{
  products: Product[];
  renderCard: (product: Product) => React.ReactNode;
  itemsPerView: number;
  gapPx: number;
}> = ({ products, renderCard, itemsPerView, gapPx }) => {
  const {
    containerRef,
    isDragging,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useHorizontalScroll({
    snapToItems: true,
    itemWidth: window.innerWidth < 640 ? (window.innerWidth - 32 - 12) / 2 : window.innerWidth < 768 ? (window.innerWidth - 32) / 2 - 6 : window.innerWidth < 1024 ? (window.innerWidth - 32) / 3 - 8 : window.innerWidth < 1280 ? (window.innerWidth - 32) / 4 - 9 : (window.innerWidth - 32) / 5 - 10,
    gap: 12,
  });

  return (
    <div
      ref={containerRef}
      className="flex overflow-x-auto gap-3 sm:gap-7 pb-4 scrollbar-hide scroll-smooth snap-x min-w-0"
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
          className="flex-none snap-start min-w-0"
          style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * gapPx / itemsPerView}px)` }}
        >
          {renderCard(product)}
        </div>
      ))}
    </div>
  );
};

const HomepageProducts: React.FC = () => {
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryStates, setCategoryStates] = useState<Record<number, CategoryState>>({});
  const [itemsPerView, setItemsPerView] = useState(4);
  const [gapPx, setGapPx] = useState(28);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();
  const [translatedCategories, setTranslatedCategories] = useState<Record<number, string>>({});
  const hasFetched = useRef(false);

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

  useEffect(() => {
    const fetchHomepageProducts = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        const response = await fetch(`${API_BASE_URL}/api/homepage/products`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch homepage products');
        }

        const data = await response.json();

        if (data.status === 'success') {
          setCategoriesWithProducts(data.data);
          const initialStates: Record<number, CategoryState> = {};
          data.data.forEach((category: CategoryWithProducts) => {
            initialStates[category.category.category_id] = {
              activeCategory: 'All',
              currentPage: 1
            };
          });
          setCategoryStates(initialStates);
        } else {
          setError('Failed to fetch products');
        }
      } catch (err) {
        setError('Error loading products');
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageProducts();
  }, []);

  // Translate category names when language changes
  useEffect(() => {
    const doTranslate = async () => {
      const lang = (i18n.language || 'en').split('-')[0];
      if (lang === 'en' || !categoriesWithProducts.length) {
        setTranslatedCategories({});
        return;
      }
      try {
        const items = categoriesWithProducts.map(catWithProducts => ({ 
          id: String(catWithProducts.category.category_id), 
          text: catWithProducts.category.name 
        }));
        const result = await translateBatch(items, lang, 'text/plain');
        const map: Record<number, string> = {};
        categoriesWithProducts.forEach(catWithProducts => {
          const translated = result[String(catWithProducts.category.category_id)];
          if (translated) map[catWithProducts.category.category_id] = translated;
        });
        setTranslatedCategories(map);
      } catch {
        setTranslatedCategories({});
      }
    };
    doTranslate();
  }, [categoriesWithProducts, i18n.language, translateBatch]);

  // Helper function to get category name (translated or original)
  const getCategoryName = (category: Category) => {
    const lang = (i18n.language || 'en').split('-')[0];
    if (lang === 'en') return category.name;
    return translatedCategories[category.category_id] || category.name;
  };

  const renderProductCard = (product: Product) => {
    return (
      <ProductCard
        key={product.product_id}
        product={{
          id: product.product_id,
          name: product.product_name,
          price: product.price || product.selling_price || 0,  // Use backend-calculated price, fallback to selling_price
          original_price: product.originalPrice || product.cost_price || 0,  // Use backend-calculated originalPrice, fallback to cost_price
          special_price: product.special_price,
          image_url: product.media?.[0]?.url || product.image,
          images: product.media?.map(m => m.url) || [product.image],
          primary_image: product.media?.[0]?.url || product.image,  // Add primary_image field
          stock: product.stock,
          is_deleted: false,
          sku: product.sku,
          description: product.product_description,
          category: {
            category_id: product.category_id,
            name: 'General'
          },
          brand: {
            brand_id: product.brand_id,
            name: 'Brand'
          },
          special_start: product.special_start,
          special_end: product.special_end,
          discount_pct: product.discount_pct,
          rating: 0,
          reviews: 0,
          isNew: product.isNew,
          currency: 'INR',
          tags: [],
        }}
        isNew={product.isNew}
        salePercentage={product.discount_pct}
      />
    );
  };

  // Get all products for the active category
  const getActiveCategoryProducts = (categoryData: CategoryWithProducts) => {
    const categoryState = categoryStates[categoryData.category.category_id];
    const activeCategory = categoryState?.activeCategory || categoryData.category.name;

    if (activeCategory === 'All') {
      // Include main category's direct products plus all subcategory products
      const mainProducts = categoryData.products || [];
      const subcategoryProducts = categoryData.subcategories.flatMap(sub => sub.products || []);
      return [...mainProducts, ...subcategoryProducts];
    }

    const selectedSubcategory = categoryData.subcategories.find(
      sub => sub.category.name === activeCategory
    );

    if (selectedSubcategory) {
      return selectedSubcategory.products || [];
    }

    return [];
  };

  // Handle category change for a specific section
  const handleCategoryChange = (categoryId: number, categoryName: string) => {
    setCategoryStates(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        activeCategory: categoryName,
        currentPage: 1
      }
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className=" py-4">
      {categoriesWithProducts.map((categoryData) => (
        <section key={categoryData.category.category_id} className="pb-12">
          {/* Full-width category banner with icon_url and overlay */}
          <div
            className="relative w-full h-[220px] md:h-[560px] overflow-hidden bg-gray-200 mb-6"
            style={{
              backgroundImage: categoryData.category.icon_url
                ? `url(${categoryData.category.icon_url})`
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-start px-4 sm:px-6 md:px-8 lg:px-14 py-6">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight font-worksans drop-shadow-lg">
                {getCategoryName(categoryData.category)}
              </h2>
            </div>
          </div>

          <div className="container mx-auto px-4 xl:px-14">
            <div className="flex flex-col space-y-6">
              {/* Category tabs (All + subcategories) - no heading, no arrows */}
              <div className="flex items-center w-full overflow-x-auto pb-2 space-x-6 scrollbar-hide">
                <button
                  className={`whitespace-nowrap ${
                    categoryStates[categoryData.category.category_id]?.activeCategory === 'All'
                      ? 'text-[#F2631F] border-b-2 border-[#F2631F]'
                      : 'text-gray-600 hover:text-[#F2631F]'
                  } pb-1`}
                  onClick={() => handleCategoryChange(categoryData.category.category_id, 'All')}
                >
                  All
                </button>
                {categoryData.subcategories.map((subcategory) => (
                  <button
                    key={subcategory.category.category_id}
                    className={`whitespace-nowrap ${
                      categoryStates[categoryData.category.category_id]?.activeCategory === subcategory.category.name
                        ? 'text-[#F2631F] border-b-2 border-[#F2631F]'
                        : 'text-gray-600 hover:text-[#F2631F]'
                    } pb-1`}
                    onClick={() => handleCategoryChange(categoryData.category.category_id, subcategory.category.name)}
                  >
                    {getCategoryName(subcategory.category)}
                  </button>
                ))}
              </div>

              {/* Products carousel - all products, horizontally scrollable */}
              <div className="relative min-w-0">
                <ProductCarousel
                  products={getActiveCategoryProducts(categoryData)}
                  renderCard={renderProductCard}
                  itemsPerView={itemsPerView}
                  gapPx={gapPx}
                />
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default HomepageProducts; 