import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAmazonTranslate } from '../../hooks/useAmazonTranslate';

interface Category {
  category_id: number;
  name: string;
  slug: string;
  icon_url: string | null;
}

// Premium fallback colors for categories without image (stable per category_id)
const FALLBACK_COLORS = [
  'bg-amber-100',
  'bg-rose-100',
  'bg-sky-100',
  'bg-emerald-100',
  'bg-violet-100',
  'bg-teal-100',
  'bg-orange-100',
  'bg-pink-100',
];

const getFallbackColorClass = (categoryId: number) =>
  FALLBACK_COLORS[categoryId % FALLBACK_COLORS.length];

const Categories: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { translateBatch } = useAmazonTranslate();
  const [translatedCategories, setTranslatedCategories] = useState<Record<number, string>>({});

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Translate category names when language changes
  useEffect(() => {
    const doTranslate = async () => {
      const lang = (i18n.language || 'en').split('-')[0];
      if (lang === 'en' || !categories.length) {
        setTranslatedCategories({});
        return;
      }
      try {
        const items = categories.map(cat => ({ 
          id: String(cat.category_id), 
          text: cat.name 
        }));
        const result = await translateBatch(items, lang, 'text/plain');
        const map: Record<number, string> = {};
        categories.forEach(cat => {
          const translated = result[String(cat.category_id)];
          if (translated) map[cat.category_id] = translated;
        });
        setTranslatedCategories(map);
      } catch {
        setTranslatedCategories({});
      }
    };
    doTranslate();
  }, [categories, i18n.language, translateBatch]);

  // Helper function to get category name (translated or original)
  const getCategoryName = (category: Category) => {
    const lang = (i18n.language || 'en').split('-')[0];
    if (lang === 'en') return category.name;
    return translatedCategories[category.category_id] || category.name;
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories/with-icons`);

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="pt-8">
        <div className="container mx-auto px-4 xl:px-14">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t('home.sections.categoriesTitle')}</h2>
          </div>
          <div className="flex gap-8 overflow-x-auto pb-4 pt-2 pl-2 scrollbar-hide">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="flex-shrink-0 flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="pt-8">
        <div className="container mx-auto px-4 xl:px-14">
          <div className="text-red-500 text-center">
            <p>{t('common.error')}: {error}</p>
            <button 
              onClick={fetchCategories}
              className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              {t('common.retry', 'Try Again')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-8 py-4">
      <div className="container mx-auto px-4 xl:px-14">
        {/* Categories header with navigation */}
        <div className="flex justify-between items-center mb-6">
      <h6 className="text-xl font-medium font-worksans">{t('home.sections.categoriesTitle')}</h6>
          <div className="flex items-center">
            <Link to="/all-products" className="text-orange-500 text-sm font-medium mr-3 sm:mr-10">
        {t('home.seeAll')}
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <button
                onClick={scrollLeft}
                className="focus:outline-none"
                aria-label="Scroll Left"
              >
                <ChevronLeft size={20} className="text-gray-500 hover:text-black duration-300" />
              </button>
              <button
                onClick={scrollRight}
                className="focus:outline-none"
                aria-label="Scroll Right"
              >
                <ChevronRight size={20} className="text-gray-500 hover:text-black duration-300" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Categories slider - premium circular UI */}
        <div
          ref={scrollRef}
          className="flex gap-10 overflow-x-auto pb-6 pt-2 pl-2 scroll-smooth scrollbar-hide"
        >
          {categories.map((category) => (
            <button
              key={category.category_id}
              type="button"
              onClick={() => navigate(`/all-products?category=${category.category_id}`)}
              className="group flex-shrink-0 flex flex-col items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2631F] focus-visible:ring-offset-2 rounded-2xl"
            >
              {/* Circular image / colored circle with orange border and hover */}
              <div
                className={`
                  w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden
                  border-2 border-[#F2631F]/40 bg-gray-50
                  transition-all duration-300 ease-out
                  group-hover:border-[#F2631F] group-hover:shadow-lg group-hover:shadow-orange-200/50
                  group-hover:scale-105 group-active:scale-[0.98]
                  flex items-center justify-center
                `}
              >
                {category.icon_url ? (
                  <img
                    src={category.icon_url}
                    alt={getCategoryName(category)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className={`w-full h-full rounded-full ${getFallbackColorClass(category.category_id)} flex items-center justify-center text-2xl sm:text-3xl select-none`}
                    aria-hidden
                  >
                    📦
                  </span>
                )}
              </div>
              {/* Category name below */}
              <span className="font-medium text-sm sm:text-base font-worksans text-gray-800 group-hover:text-[#F2631F] transition-colors duration-200 max-w-[7rem] text-center leading-tight line-clamp-2">
                {getCategoryName(category)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
