import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Hero from '../components/home/Hero';
import ConditionalFeaturedProducts from '../components/home/ConditionalFeaturedProducts';
import Categories from '../components/home/Categories';
import ConditionalPromoProducts from '../components/home/ConditionalPromoProducts';
import TrendingDeals from '../components/home/TrendingDeals';
import Brands from '../components/home/brands';
// import Shop from '../components/home/Shop';
import Services from '../components/home/Services';
import NewSection from '../components/home/NewSection';
import HomepageProducts from '../components/home/HomepageProducts';
import SearchResults from '../components/common/SearchResults';
import useClickOutside from '../hooks/useClickOutside';
import NewProductCarousel from '../components/home/NewProductCarousel';

const Home = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'products' | 'categories'>('all');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  // #region agent log
  useEffect(() => {
    const t = performance.now();
    fetch('http://127.0.0.1:7247/ingest/59cab846-9e60-4704-8103-2f60eefca997',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f7305f'},body:JSON.stringify({sessionId:'f7305f',location:'Home.tsx:useEffect',message:'home_mounted',data:{t},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
  }, []);
  // #endregion
  useClickOutside(searchRef, () => {
    setShowSearchResults(false);
  });

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchParams = new URLSearchParams({
        q: searchQuery.trim(),
        type: searchType
      });
      navigate(`/search?${searchParams.toString()}`);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="pb-10">
      {/* Mobile Search Bar (Copied from Navbar) */}
      <div className="container mx-auto px-4 nav:hidden mt-8 mb-4 py-2">
        <div ref={searchRef} className="relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            {/* Layout for screens >= sm and < nav */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Search Input and Category Select Group */}
              <div className="flex flex-1 rounded-md overflow-hidden bg-white border border-gray-300 shadow-sm">
                <input
                  type="text"
                  placeholder={t('home.searchPlaceholder')}
                  className="w-full border-0 py-1.5 px-4 text-gray-900 focus:ring-0 focus:outline-none"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                />
                {/* Category Select */}
                <div className="relative flex items-center bg-gray-100">
                  <select
                    className="h-full appearance-none bg-transparent py-1.5 pl-3 pr-8 text-gray-900 focus:ring-0 focus:outline-none text-sm"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'all' | 'products' | 'categories')}
                  >
                    <option value="all">{t('home.searchCategories.all')}</option>
                    <option value="products">{t('home.searchCategories.products')}</option>
                    <option value="categories">{t('home.searchCategories.categories')}</option>
                  </select>
                </div>
              </div>
              {/* Search Button */}
              <button
                type="submit"
                className="bg-[#F2631F] text-white py-1.5 px-6 rounded-md text-base hover:bg-orange-600 transition-colors"
              >
                {t('home.searchButton')}
              </button>
            </div>

            {/* Layout for screens < sm */}
            <div className="sm:hidden space-y-2">
              {/* Search Input */}
              <div>
                <input
                  type="text"
                  placeholder={t('home.searchPlaceholder')}
                  className="w-full rounded-md border border-gray-300 shadow-sm py-1.5 px-4 text-gray-900 focus:ring-0 focus:outline-none text-base"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                />
              </div>
              {/* Category Dropdown Button and Search Button */}
              <div className="flex items-center gap-2">
                {/* Category Select - styled as a button */}
                <select
                  className="flex-1 appearance-none bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-4 text-base text-gray-900 focus:ring-0 focus:outline-none pr-8"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'all' | 'products' | 'categories')}
                >
                  <option value="all">{t('home.searchCategories.all')}</option>
                  <option value="products">{t('home.searchCategories.products')}</option>
                  <option value="categories">{t('home.searchCategories.categories')}</option>
                </select>
                {/* Search Button */}
                <button
                  type="submit"
                  className="flex-1 bg-[#F2631F] text-white py-2 px-4 rounded-md text-base hover:bg-orange-600 transition-colors"
                >
                  {t('home.searchButton')}
                </button>
              </div>
            </div>

            {/* SearchResults positioned below the flex container */}
            <SearchResults
              isVisible={showSearchResults}
              searchQuery={searchQuery}
              searchType={searchType}
              onItemClick={() => {
                setShowSearchResults(false);
                setSearchQuery('');
              }}
              setIsVisible={setShowSearchResults}
            />
          </form>
        </div>
      </div>

      {/* Content sections below mobile search bar */}
      <div className="nav:pt-4">
        <div className="space-y-8">
          <Hero />
          <Categories />
          <Brands />
          {/* <Shop /> */}

          <ConditionalFeaturedProducts />
          <ConditionalPromoProducts />
          <NewProductCarousel />
          <TrendingDeals />
          <NewSection />
          <HomepageProducts />
          <Services />
        </div>
      </div>
    </div>
  );
};

export default Home;