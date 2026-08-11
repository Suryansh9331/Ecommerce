import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Heart, ChevronDown, ChevronUp, SlidersHorizontal, ArrowUpDown, X, Check, Star } from 'lucide-react';
import { Product } from '../types';
import ProductCard from '../components/product/ProductCard';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../hooks/useAmazonTranslate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Category {
  category_id: number;
  name: string;
  slug: string;
  icon_url: string;
  parent_id: number | null;
  children?: Category[];
}

const buildCategoryTree = (categories: Category[]): Category[] => {
  const categoryMap = new Map<number, Category>();
  const rootCategories: Category[] = [];

  // First pass: Create a map of all categories
  categories.forEach(category => {
    categoryMap.set(category.category_id, { ...category, children: [] });
  });

  // Second pass: Build the tree structure
  categories.forEach(category => {
    const currentCategory = categoryMap.get(category.category_id);
    if (currentCategory) {
      if (category.parent_id === null) {
        rootCategories.push(currentCategory);
      } else {
        const parentCategory = categoryMap.get(category.parent_id);
        if (parentCategory) {
          if (!parentCategory.children) {
            parentCategory.children = [];
          }
          parentCategory.children.push(currentCategory);
        }
      }
    }
  });

  return rootCategories;
};

const Products: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();
  const [products, setProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translatedCategories, setTranslatedCategories] = useState<Record<number, string>>({});
  
  // Translate categories when language changes or categories are loaded
  useEffect(() => {
    const translateCategories = async () => {
      if (categories.length === 0) return;
      
      // Skip translation for English
      if (i18n.language === 'en') {
        setTranslatedCategories({});
        return;
      }
      
      try {
        // Collect all category names for translation
        const collectCategoryNames = (cats: Category[]): { id: number; name: string }[] => {
          let names: { id: number; name: string }[] = [];
          cats.forEach(cat => {
            names.push({ id: cat.category_id, name: cat.name });
            if (cat.children && cat.children.length > 0) {
              names = names.concat(collectCategoryNames(cat.children));
            }
          });
          return names;
        };
        
        const allCategories = collectCategoryNames(categories);
        const textsToTranslate = allCategories.map(cat => ({ 
          id: String(cat.id), 
          text: cat.name 
        }));
        
        if (textsToTranslate.length > 0) {
          const translated = await translateBatch(textsToTranslate, i18n.language, 'text/plain');
          
          // Create mapping of category ID to translated name
          const translationMap: Record<number, string> = {};
          allCategories.forEach((cat) => {
            const translatedText = translated[String(cat.id)];
            if (translatedText) {
              translationMap[cat.id] = translatedText;
            }
          });
          
          setTranslatedCategories(translationMap);
        }
      } catch (error) {
        console.error('Error translating categories:', error);
        setTranslatedCategories({});
      }
    };
    
    translateCategories();
  }, [categories, i18n.language, translateBatch]);
  
  // Helper function to get category name (translated or original)
  const getCategoryName = (category: Category): string => {
    if (i18n.language === 'en') return category.name;
    return translatedCategories[category.category_id] || category.name;
  };
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [perPage] = useState(16);

  // Add new state for expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Mobile filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [isDesktopSortOpen, setIsDesktopSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('newest');
  const mobileSortRef = useRef<HTMLDivElement>(null);
  const desktopSortRef = useRef<HTMLDivElement>(null);
  const mobileFilterRef = useRef<HTMLDivElement>(null);

  // Sort options
  const sortOptions = [
    { label: 'Newest First', value: 'newest', sort_by: 'created_at', order: 'desc' },
    { label: 'Oldest First', value: 'oldest', sort_by: 'created_at', order: 'asc' },
    { label: 'Price: High to Low', value: 'price-desc', sort_by: 'selling_price', order: 'desc' },
    { label: 'Price: Low to High', value: 'price-asc', sort_by: 'selling_price', order: 'asc' }
  ];

  // Handle product click to track recently viewed
  const handleProductClick = async (productId: string) => {
    try {
      // Navigate to product detail page
      navigate(`/product/${productId}`);
      
      // Track the view if user is authenticated
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/products/${productId}/details`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        // Refresh recently viewed products
        fetchRecentlyViewed();
      }
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  // Fetch recently viewed products
  const fetchRecentlyViewed = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/products/recently-viewed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recently viewed products');
      }

      const data = await response.json();
      setRecentlyViewed(data);
    } catch (err) {
      console.error('Error fetching recently viewed products:', err);
    }
  };

  // Toggle category expansion
  const toggleCategoryExpand = (categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Render category tree recursively
  const renderCategoryTree = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories[category.category_id] || false;
    const hasSubcategories = category.children && category.children.length > 0;
    const isSelected = selectedCategory === String(category.category_id);

    let btnClass = 'w-full flex items-center justify-between py-2 px-2 transition-colors border-none text-left font-normal';
    let spanClass = 'text-sm font-normal';
    
    if (level === 0) {
      btnClass += ' bg-transparent text-black hover:bg-primary-50 rounded-none font-medium';
    } else if (hasSubcategories) {
      if (isSelected) {
        btnClass += ' bg-white border border-primary-600 text-black rounded-md shadow-sm';
      } else {
        btnClass += ' bg-transparent text-black hover:bg-primary-50 rounded-md';
      }
    } else {
      if (isSelected) {
        btnClass += ' bg-primary-600 text-white rounded-md shadow';
      } else {
        btnClass += ' bg-transparent text-black hover:bg-primary-50 rounded-md';
      }
    }

    return (
      <div key={category.category_id} className={`${level > 0 ? 'ml-4' : ''}`}>
        <button
          onClick={() => {
            if (hasSubcategories) {
              toggleCategoryExpand(category.category_id);
            } else {
              setSelectedCategory(String(category.category_id));
              const params = new URLSearchParams(location.search);
              params.set('category', String(category.category_id));
              navigate(`?${params.toString()}`);
            }
          }}
          className={btnClass}
          style={{ paddingLeft: level > 0 ? `${level * 0.5}rem` : '0.5rem' }}
        >
          <span className={spanClass}>{getCategoryName(category)}</span>
          {hasSubcategories && (
            <span className="flex items-center ml-auto">
              {isExpanded ? (
                <ChevronUp size={16} className="text-primary-600" />
              ) : (
                <ChevronDown size={16} className="text-primary-600" />
              )}
            </span>
          )}
        </button>
        {isExpanded && category.children && category.children.length > 0 && (
          <div className="mt-1">
            {category.children.map(subcategory => renderCategoryTree(subcategory, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Update selected category when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryId = params.get('category');
    const brandId = params.get('brand');
    const search = params.get('search');
    const minPrice = params.get('min_price');
    const maxPrice = params.get('max_price');

    // Update category
    if (categoryId) {
      setSelectedCategory(categoryId);
      const category = categories.find(cat => cat.category_id === Number(categoryId));
      if (category?.parent_id !== null && category?.parent_id !== undefined) {
        setExpandedCategories(prev => ({
          ...prev,
          [String(category.parent_id)]: true
        }));
      }
    } else {
      setSelectedCategory('');
    }

    // Update brand
    if (brandId) {
      setSelectedBrands([brandId]);
    } else {
      setSelectedBrands([]);
    }

    // Update search
    if (search) {
      setSearchQuery(search);
    } else {
      setSearchQuery('');
    }

    // Update price range
    if (minPrice || maxPrice) {
      setPriceRange([
        minPrice ? Number(minPrice) : 0,
        maxPrice ? Number(maxPrice) : 1000000
      ]);
    } else {
      setPriceRange([0, 1000000]);
    }
  }, [location.search, categories]);

  // Helper: find category depth and if leaf
  const getCategoryDepth = (cat: Category, parentDepth = 0): number => {
    if (!cat.children || cat.children.length === 0) return parentDepth;
    return Math.max(...cat.children.map(child => getCategoryDepth(child, parentDepth + 1)));
  };
  const isLeaf = (cat: Category) => !cat.children || cat.children.length === 0;

  // Fetch products with filters
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: sortOptions.find(opt => opt.value === selectedSort)?.sort_by || 'created_at',
        order: sortOptions.find(opt => opt.value === selectedSort)?.order || 'desc'
      });

      // Add filters if they exist
      if (selectedCategory) {
        params.append('category_id', selectedCategory);
      }
      if (selectedBrands.length > 0) {
        params.append('brand_id', selectedBrands.join(','));
      }
      if (priceRange[0] > 0) {
        params.append('min_price', priceRange[0].toString());
      }
      if (priceRange[1] < 1000000) {
        params.append('max_price', priceRange[1].toString());
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (selectedDiscounts && selectedDiscounts.length > 0) {
        const minDiscount = Math.max(...selectedDiscounts.map(d => parseInt(d)));
        params.append('min_discount', minDiscount.toString());
      }
      if (selectedRatings && selectedRatings.length > 0) {
        const minRating = Math.max(...selectedRatings.map(r => parseFloat(r)));
        params.append('min_rating', minRating.toString());
      }

      const response = await fetch(`${API_BASE_URL}/api/products?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      
      // Update state with backend-filtered data
      setProducts(data.products);
      setTotalPages(data.pagination.pages);
      setTotalProducts(data.pagination.total);

    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      // Transform flat category list into hierarchical structure
      const categoryTree = buildCategoryTree(data);
      setCategories(categoryTree);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch brands
  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/brands`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchRecentlyViewed(); // <-- Add this line
  }, []);

  // Refetch products when filters or pagination changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    location.search,
    currentPage,
    selectedCategory,
    selectedBrands,
    priceRange,
    searchQuery,
    selectedDiscounts,
    selectedRatings,
    selectedSort
  ]);

  // Toggle brand selection
  const toggleBrand = (brand: string) => {
    const newBrands = selectedBrands.includes(brand) ? [] : [brand];
    setSelectedBrands(newBrands);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Toggle color selection
  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  // Toggle discount selection
  const toggleDiscount = (discount: string) => {
    setSelectedDiscounts(prev => 
      prev.includes(discount) 
        ? prev.filter(d => d !== discount)
        : [...prev, discount]
    );
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Toggle rating selection
  const toggleRating = (rating: string) => {
    setSelectedRatings(prev => {
      if (prev.length === 1 && prev[0] === rating) {
        return []; // Deselect if clicking the same rating
      }
      return [rating]; // Select/change the rating
    });
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrands([]);
    setSelectedColors([]);
    setPriceRange([0, 1000000]);
    setSelectedDiscounts([]);
    setSelectedRatings([]);
    setCurrentPage(1);
    setSelectedSort('newest');
    
    // Clear URL parameters
    navigate('?');
  };

  // Sort products based on selected sort option
  const sortProducts = (productsToSort: Product[], sortValue: string) => {
    const sortedProducts = [...productsToSort];
    switch (sortValue) {
      case 'newest':
        return sortedProducts.sort((a, b) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
      case 'oldest':
        return sortedProducts.sort((a, b) => 
          new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
        );
      case 'price-desc':
        return sortedProducts.sort((a, b) => b.price - a.price);
      case 'price-asc':
        return sortedProducts.sort((a, b) => a.price - b.price);
      default:
        return sortedProducts;
    }
  };

  // Handle sort change
  const handleSort = (value: string) => {
    setSelectedSort(value);
    setIsMobileSortOpen(false);
    setIsDesktopSortOpen(false); // Close desktop sort dropdown
    setCurrentPage(1); // Reset to first page when sort changes
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileSortRef.current && !mobileSortRef.current.contains(event.target as Node)) {
        setIsMobileSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

        if (loading && products.length === 0) {
        return (
          <div className="min-h-screen flex items-center justify-center font-worksans">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        );
      }

        if (error) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-red-500 text-center font-worksans">
              <p className="text-xl font-semibold mb-2">Error Loading Products</p>
              <p>{error}</p>
              <button 
                onClick={() => fetchProducts()}
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
              >
                Try Again
              </button>
            </div>
          </div>
        );
      }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 sm:mb-6 font-worksans">
          <span>Home</span> / <span>Products</span>
        </div>
        
        {/* Mobile Filter and Sort Bar */}
        <div className="lg:hidden flex items-center gap-2 mb-4 sticky top-0 bg-white z-10 py-2">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <SlidersHorizontal size={20} />
            <span>Filters</span>
          </button>
          <button
            onClick={() => setIsMobileSortOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <ArrowUpDown size={20} />
            <span>Sort</span>
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Category Sidebar - Hidden on mobile and tablet */}
          <aside className="hidden lg:block w-72 pr-6 border-r border-gray-100">
            <div className="sticky top-4">
              <div className="mb-8">
                <h3 className="font-semibold text-base mb-4 text-black font-worksans">Categories</h3>
                <div className="space-y-1">
                  {categories.map(category => renderCategoryTree(category))}
                </div>
              </div>
            
              {/* Brand Filter */}
              <div className="mb-8">
                <h3 className="font-semibold text-base mb-4 text-black font-worksans">Brand</h3>
                <div className="flex flex-wrap gap-2">
                  {brands && brands.map((brand) => {
                    const isSelected = selectedBrands.includes(String(brand.brand_id || brand.id));
                    return (
                      <button
                        key={brand.brand_id || brand.id}
                        onClick={() => toggleBrand(String(brand.brand_id || brand.id))}
                        className={`px-3 py-1.5 rounded-full border text-xs font-normal transition-colors focus:outline-none ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow'
                            : 'bg-gray-100 border-gray-200 text-black hover:border-primary-600 hover:text-primary-600'
                        }`}
                      >
                        {brand.name || brand.brand_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            
              {/* Price Range */}
              <div className="mb-8">
                <h3 className="font-semibold text-base mb-4 text-black font-worksans">Price</h3>
                <div className="px-2">
                  {/* Manual Input Fields */}
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                      <input
                        type="number"
                        min="0"
                        max={priceRange[1]}
                        value={priceRange[0]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setPriceRange([value, Math.max(value, priceRange[1])]);
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-600"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                      <input
                        type="number"
                        min={priceRange[0]}
                        max="1000000"
                        value={priceRange[1] === 0 ? '' : priceRange[1]}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : Number(e.target.value);
                          if (value === '') {
                            setPriceRange([priceRange[0], 0]);
                          } else {
                          setPriceRange([priceRange[0], Math.max(priceRange[0], value)]);
                          }
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-600"
                        placeholder="1000000"
                      />
                    </div>
                  </div>
                  {/* Slider */}
                  <div className="flex justify-between text-xs text-gray-700 mb-2 font-normal">
                    <span>₹{priceRange[0].toLocaleString()}</span>
                    <span>₹{priceRange[1].toLocaleString()}</span>
                  </div>
                  <div className="relative pt-1">
                    <div className="w-full h-1 bg-gray-200 rounded-lg">
                      <div
                        className="absolute h-1 bg-primary-600 rounded-lg"
                        style={{ width: `${(priceRange[1] / 1000000) * 100}%` }}
                      ></div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={priceRange[1]}
                      onChange={(e) => {setPriceRange([priceRange[0], parseInt(e.target.value)])}}
                      className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Discount Filter */}
              <div className="mb-8">
                <h3 className="font-semibold text-base mb-4 text-black font-worksans">Discount</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '10% or more', value: '10' },
                    { label: '20% or more', value: '20' },
                    { label: '30% or more', value: '30' },
                    { label: '40% or more', value: '40' },
                    { label: '50% or more', value: '50' }
                  ].map((discount) => {
                    const isSelected = selectedDiscounts.includes(discount.value);
                    return (
                      <button
                        key={discount.value}
                        onClick={() => toggleDiscount(discount.value)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-normal transition-colors focus:outline-none ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow'
                            : 'bg-gray-100 border-gray-200 text-black hover:border-primary-600 hover:text-primary-600'
                        }`}
                      >
                        {discount.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ratings Filter */}
              <div className="mb-8">
                <h3 className="font-semibold text-base mb-4 text-black font-worksans">Ratings</h3>
                {(() => {
                  const selectedRatingValue = selectedRatings.length > 0 ? parseFloat(selectedRatings[0]) : 0;
                  return (
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => {
                          const isFull = selectedRatingValue >= star;
                          const isHalf = selectedRatingValue >= star - 0.5 && selectedRatingValue < star;
                          return (
                            <div key={star} className="relative cursor-pointer" style={{ width: 28, height: 28 }} onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const rating = clickX < rect.width / 2 ? star - 0.5 : star;
                              toggleRating(rating.toString());
                            }}>
                              <Star className="text-gray-300" fill="currentColor" size={28}/>
                              {isFull ? (
                                <div className="absolute top-0 left-0">
                                  <Star className="text-yellow-400" fill="currentColor" size={28}/>
                                </div>
                              ) : isHalf ? (
                                <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                                  <Star className="text-yellow-400" fill="currentColor" size={28}/>
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                      {selectedRatingValue > 0 && (
                        <span className="ml-2 text-sm font-medium text-gray-700">{selectedRatingValue}★ & up</span>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Reset Filters Button */}
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 text-sm font-normal text-primary-600 border border-primary-600 rounded hover:bg-primary-50 transition-colors font-worksans"
              >
                Reset Filters
              </button>
            </div>
          </aside>
          
          {/* Products Grid */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent font-worksans"
              />
            </div>

            {/* Desktop Sort Dropdown */}
            <div className="hidden lg:flex justify-end mb-6">
              <div className="relative" ref={desktopSortRef}>
                <button
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:border-primary-600 transition-colors"
                  onClick={() => setIsDesktopSortOpen(!isDesktopSortOpen)}
                >
                  <span>Sort By: </span>
                  <span className="text-primary-600">
                    {sortOptions.find(opt => opt.value === selectedSort)?.label}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {isDesktopSortOpen && (
                  <div className="absolute z-20 w-48 bg-white border rounded-lg shadow-lg top-full mt-1">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleSort(option.value)}
                        className={`flex items-center w-full px-4 py-2 text-left hover:bg-gray-50 ${
                          selectedSort === option.value ? 'bg-primary-50 text-primary-600' : ''
                        }`}
                      >
                        {selectedSort === option.value && <Check size={16} className="mr-2 text-primary-600" />}
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {products.length === 0 ? (
              <div className="flex justify-center items-center py-16">
                <p className="text-gray-500 font-worksans">No products found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 mb-8">
                {products.map((product) => (
                  <div 
                    key={product.id}
                    onClick={() => handleProductClick(String(product.id))}
                    className="cursor-pointer transform transition-transform hover:scale-[1.02]"
                  >
                    <ProductCard 
                      product={product}
                      isBuiltIn={product.isBuiltIn ?? false}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 my-8">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-50 hover:border-primary-600 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                {/* Page numbers with ... */}
                {(() => {
                  const pages = [];
                  let start = Math.max(1, currentPage - 2);
                  let end = Math.min(totalPages, currentPage + 2);

                  if (currentPage <= 3) {
                    end = Math.min(5, totalPages);
                  }
                  if (currentPage >= totalPages - 2) {
                    start = Math.max(1, totalPages - 4);
                  }

                  if (start > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${
                          currentPage === 1 
                            ? 'bg-primary-600 text-white border-primary-600' 
                            : 'border-gray-300 hover:border-primary-600'
                        }`}
                      >
                        1
                      </button>
                    );
                    if (start > 2) {
                      pages.push(<span key="start-ellipsis" className="px-2">...</span>);
                    }
                  }

                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${
                          currentPage === i 
                            ? 'bg-primary-600 text-white border-primary-600' 
                            : 'border-gray-300 hover:border-primary-600'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  if (end < totalPages) {
                    if (end < totalPages - 1) {
                      pages.push(<span key="end-ellipsis" className="px-2">...</span>);
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${
                          currentPage === totalPages 
                            ? 'bg-primary-600 text-white border-primary-600' 
                            : 'border-gray-300 hover:border-primary-600'
                        }`}
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-50 hover:border-primary-600 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mt-12 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold font-worksans">Recently Viewed</h2>
            </div>
            
            {/* Mobile: horizontal scroll with proper sizing */}
            <div className="lg:hidden -mx-4 px-4 overflow-x-auto">
              <div className="flex gap-5 snap-x snap-mandatory">
                {recentlyViewed.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(String(product.id))}
                    className="cursor-pointer transform transition-transform hover:scale-[1.02] snap-start flex-shrink-0 w-full sm:w-72"
                  >
                    <ProductCard
                      product={product}
                      isBuiltIn={product.isBuiltIn ?? false}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: keep grid layout */}
            <div className="hidden lg:grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 sm:gap-6">
              {recentlyViewed.map((product) => (
                <div 
                  key={product.id}
                  onClick={() => handleProductClick(String(product.id))}
                  className="cursor-pointer transform transition-transform hover:scale-[1.02]"
                >
                  <ProductCard
                    product={product}
                    isBuiltIn={product.isBuiltIn ?? false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b mt-6 sm:mt-10 nav:mt-20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold font-worksans">Filters</h3>
                <button onClick={() => setIsFilterOpen(false)} className="p-2">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 font-worksans">Category</h4>
                <div className="space-y-1">
                  {categories.map(category => renderCategoryTree(category))}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 font-worksans">Brand</h4>
                <div className="flex flex-wrap gap-2">
                  {brands && brands.map((brand) => {
                    const isSelected = selectedBrands.includes(String(brand.brand_id || brand.id));
                    return (
                      <button
                        key={brand.brand_id || brand.id}
                        onClick={() => toggleBrand(String(brand.brand_id || brand.id))}
                        className={`px-3 py-1.5 rounded-full border text-xs font-normal transition-colors focus:outline-none ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow'
                            : 'bg-gray-100 border-gray-200 text-black hover:border-primary-600 hover:text-primary-600'
                        }`}
                      >
                        {brand.name || brand.brand_name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h4 className="font-medium mb-3 font-worksans">Price</h4>
                <div className="px-2">
                  {/* Manual Input Fields */}
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                      <input
                        type="number"
                        min="0"
                        max={priceRange[1]}
                        value={priceRange[0]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setPriceRange([value, Math.max(value, priceRange[1])]);
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-600"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                      <input
                        type="number"
                        min={priceRange[0]}
                        max="1000000"
                        value={priceRange[1] === 0 ? '' : priceRange[1]}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : Number(e.target.value);
                          if (value === '') {
                            setPriceRange([priceRange[0], 0]);
                          } else {
                          setPriceRange([priceRange[0], Math.max(priceRange[0], value)]);
                          }
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-600"
                        placeholder="1000000"
                      />
                    </div>
                  </div>
                  
                  {/* Slider */}
                  <div className="flex justify-between text-xs text-gray-700 mb-2 font-normal">
                    <span>₹{priceRange[0].toLocaleString()}</span>
                    <span>₹{priceRange[1].toLocaleString()}</span>
                  </div>
                  <div className="relative pt-1">
                    <div className="w-full h-1 bg-gray-200 rounded-lg">
                      <div
                        className="absolute h-1 bg-primary-600 rounded-lg"
                        style={{ width: `${(priceRange[1] / 1000000) * 100}%` }}
                      ></div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={priceRange[1]}
                      onChange={(e) => {setPriceRange([priceRange[0], parseInt(e.target.value)])}}
                      className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Discount Filter */}
              <div className="mb-8">
                <h4 className="font-medium mb-3 font-worksans">Discount</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '10% or more', value: '10' },
                    { label: '20% or more', value: '20' },
                    { label: '30% or more', value: '30' },
                    { label: '40% or more', value: '40' },
                    { label: '50% or more', value: '50' }
                  ].map((discount) => {
                    const isSelected = selectedDiscounts.includes(discount.value);
                    return (
                      <button
                        key={discount.value}
                        onClick={() => toggleDiscount(discount.value)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-normal transition-colors focus:outline-none ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow'
                            : 'bg-gray-100 border-gray-200 text-black hover:border-primary-600 hover:text-primary-600'
                        }`}
                      >
                        {discount.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ratings Filter */}
              <div className="mb-8">
                <h4 className="font-medium mb-3 font-worksans">Ratings</h4>
                {(() => {
                  const selectedRatingValue = selectedRatings.length > 0 ? parseFloat(selectedRatings[0]) : 0;
                  return (
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => {
                          const isFull = selectedRatingValue >= star;
                          const isHalf = selectedRatingValue >= star - 0.5 && selectedRatingValue < star;

                          return (
                            <div key={star} className="relative cursor-pointer" style={{ width: 28, height: 28 }} onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const rating = clickX < rect.width / 2 ? star - 0.5 : star;
                              toggleRating(rating.toString());
                            }}>
                              <Star className="text-gray-300" fill="currentColor" size={28}/>
                              {isFull ? (
                                <div className="absolute top-0 left-0">
                                  <Star className="text-yellow-400" fill="currentColor" size={28}/>
                                </div>
                              ) : isHalf ? (
                                <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                                  <Star className="text-yellow-400" fill="currentColor" size={28}/>
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                      {selectedRatingValue > 0 && (
                        <span className="ml-2 text-sm font-medium text-gray-700">{selectedRatingValue}★ & up</span>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:border-primary-600 transition-colors font-worksans"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-worksans"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sort Dropdown */}
      {isMobileSortOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div ref={mobileSortRef} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold font-worksans">Sort By</h3>
                <button onClick={() => setIsMobileSortOpen(false)} className="p-2">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSort(option.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedSort === option.value
                        ? 'bg-primary-50 text-primary-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;