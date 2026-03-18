import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, SlidersHorizontal, ArrowUpDown, X, Check, ChevronDown } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { Product } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const NewProduct: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDesktopSortOpen, setIsDesktopSortOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('newest');
  
  // Price filter states
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [perPage] = useState(16);

  // Refs for dropdowns
  const desktopSortRef = useRef<HTMLDivElement>(null);
  const mobileSortRef = useRef<HTMLDivElement>(null);
  const mobileFilterRef = useRef<HTMLDivElement>(null);

  // Sort options
  const sortOptions = [
    { label: 'Newest First', value: 'newest', sort_by: 'created_at', order: 'desc' },
    { label: 'Oldest First', value: 'oldest', sort_by: 'created_at', order: 'asc' },
    { label: 'Price: High to Low', value: 'price-desc', sort_by: 'selling_price', order: 'desc' },
    { label: 'Price: Low to High', value: 'price-asc', sort_by: 'selling_price', order: 'asc' }
  ];

  // Price filter options
  const priceFilterOptions = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under ₹500', value: 'under-500', min: 0, max: 500 },
    { label: '₹500 - ₹1,000', value: '500-1000', min: 500, max: 1000 },
    { label: '₹1,000 - ₹2,500', value: '1000-2500', min: 1000, max: 2500 },
    { label: '₹2,500 - ₹5,000', value: '2500-5000', min: 2500, max: 5000 },
    { label: 'Above ₹5,000', value: 'above-5000', min: 5000, max: Infinity },
    { label: 'Custom Range', value: 'custom' }
  ];

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

  // Filter products by price
  const filterProductsByPrice = (productsToFilter: Product[], filterValue: string) => {
    if (filterValue === 'all') {
      return productsToFilter;
    }

    if (filterValue === 'custom') {
      const minPrice = parseFloat(customMinPrice) || 0;
      const maxPrice = parseFloat(customMaxPrice) || Infinity;
      return productsToFilter.filter(product => 
        product.price >= minPrice && product.price <= maxPrice
      );
    }

    const filterOption = priceFilterOptions.find(option => option.value === filterValue);
    if (filterOption && 'min' in filterOption && 'max' in filterOption) {
      return productsToFilter.filter(product => 
        product.price >= filterOption.min! && product.price <= filterOption.max!
      );
    }

    return productsToFilter;
  };

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let filtered = filterProductsByPrice(products, priceFilter);
    let sorted = sortProducts(filtered, selectedSort);
    setFilteredProducts(sorted);
  };

  // Fetch new products
  const fetchNewProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString()
      });

      const apiUrl = `${API_BASE_URL}/api/products/new?${params}`;
      // console.log('Fetching new products with URL:', apiUrl);

      const response = await fetch(apiUrl, {  
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch new products: ${response.status}`);
      }

      const data = await response.json();
      // console.log('New products response:', data);
      
      // Transform the API response to match the Product type
      const transformedProducts = data.products.map((product: any) => {
        const imageUrl = product.image || product.primary_image || '';
        
        return {
          id: product.id || product.product_id.toString(),
          name: product.name || product.product_name,
          price: parseFloat(product.price || product.selling_price),
          originalPrice: parseFloat(product.originalPrice || product.cost_price),
          description: product.description || product.product_description || '',
          sku: product.sku,
          stock: product.stock || 0,
          rating: product.rating || 0,
          reviews: product.reviews || [],
          currency: 'INR',
          primary_image: imageUrl,
          image: imageUrl,
          isNew: true,
          isBuiltIn: false,
          category: {
            category_id: product.category?.category_id || product.category_id || 0,
            name: product.category?.name || ''
          },
          brand: {
            brand_id: product.brand?.brand_id || product.brand_id || 0,
            name: product.brand?.name || ''
          },
          active_flag: product.active_flag,
          approval_status: product.approval_status,
          approved_at: product.approved_at,
          attributes: product.attributes || [],
          created_at: product.created_at
        };
      });
      
      setProducts(transformedProducts);
      setTotalPages(data.pagination.pages);
      setTotalProducts(data.pagination.total);
    } catch (err) {
      console.error('Error fetching new products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch new products');
    } finally {
      setLoading(false);
    }
  };

  // Handle sort change
  const handleSort = (value: string) => {
    setSelectedSort(value);
    setIsMobileSortOpen(false);
    setIsDesktopSortOpen(false);
  };

  // Handle price filter change
  const handlePriceFilter = (value: string) => {
    setPriceFilter(value);
    if (value !== 'custom') {
      setCustomMinPrice('');
      setCustomMaxPrice('');
    }
  };

  // Apply filters
  const applyFilters = () => {
    setIsFilterOpen(false);
    setCurrentPage(1); // Reset to first page when applying filters
  };

  // Reset filters
  const resetFilters = () => {
    setActiveFilter(null);
    setFilterType(null);
    setIsFilterOpen(false);
    setSelectedSort('newest');
    setPriceFilter('all');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setCurrentPage(1);
  };

  // Apply filters and sort whenever dependencies change
  useEffect(() => {
    if (products.length > 0) {
      applyFiltersAndSort();
    }
  }, [products, priceFilter, selectedSort, customMinPrice, customMaxPrice]);

  // Fetch products on mount and when pagination changes
  useEffect(() => {
    fetchNewProducts();
  }, [currentPage]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopSortRef.current && !desktopSortRef.current.contains(event.target as Node)) {
        setIsDesktopSortOpen(false);
      }
      if (mobileSortRef.current && !mobileSortRef.current.contains(event.target as Node)) {
        setIsMobileSortOpen(false);
      }
      if (mobileFilterRef.current && !mobileFilterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center font-worksans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center font-worksans">
          <p className="text-xl font-semibold mb-2">Error Loading Products</p>
          <p>{error}</p>
          <button 
            onClick={() => fetchNewProducts()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : products;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 xl:px-14 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-0">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 font-worksans">New Products</h1>
            {(priceFilter !== 'all' || activeFilter) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {priceFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    Price: {priceFilterOptions.find(opt => opt.value === priceFilter)?.label || 'Custom'}
                    <button 
                      onClick={() => setPriceFilter('all')}
                      className="hover:bg-orange-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {activeFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {filterType === 'category' && `Category: ${activeFilter}`}
                    {filterType === 'brand' && `Brand: ${activeFilter}`}
                    <button 
                      onClick={() => {
                        setActiveFilter(null);
                        setFilterType(null);
                      }}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Desktop Sort Dropdown */}
          <div className="hidden sm:flex relative" ref={desktopSortRef}>
            <button
              className="flex items-center gap-2 px-4 py-2 border rounded-md bg-white"
              onClick={() => setIsDesktopSortOpen(!isDesktopSortOpen)}
            >
              <span>Sort By: </span>
              <span>
                {sortOptions.find(opt => opt.value === selectedSort)?.label}
              </span>
              <ChevronDown size={16} />
            </button>

            {isDesktopSortOpen && (
              <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg top-full">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleSort(option.value)}
                    className={`flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 ${
                      selectedSort === option.value ? 'bg-gray-100' : ''
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

        {/* Mobile Filter and Sort Bar */}
        <div className="sm:hidden flex items-center gap-2 mb-4">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <SlidersHorizontal size={20} />
            <span>Filters</span>
            {priceFilter !== 'all' && (
              <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                1
              </span>
            )}
          </button>
          <button
            onClick={() => setIsMobileSortOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <ArrowUpDown size={20} />
            <span>Sort</span>
          </button>
        </div>

        {displayProducts.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <p className="text-gray-500 font-worksans">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mb-8">
            {displayProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isNew={product.isNew}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex md:justify-end justify-center items-center gap-1 my-6">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-50 p-2"
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
                    className={`w-10 h-10 flex items-center justify-center border rounded-lg ${currentPage === 1 ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300'}`}
                  >
                    1
                  </button>
                );
                if (start > 2) {
                  pages.push(<span key="start-ellipsis" className="px-1">...</span>);
                }
              }

              for (let i = start; i <= end; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`py-2 px-1 w-10 h-10 flex items-center justify-center border rounded-lg ${currentPage === i ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300'}`}
                  >
                    {i}
                  </button>
                );
              }

              if (end < totalPages) {
                if (end < totalPages - 1) {
                  pages.push(<span key="end-ellipsis" className="px-1">...</span>);
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className={`py-2 px-1 w-10 h-10 flex items-center justify-center border rounded-lg ${currentPage === totalPages ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300'}`}
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
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-50 p-2"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div ref={mobileFilterRef} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold font-worksans">Filters</h3>
                <button onClick={() => setIsFilterOpen(false)} className="p-2">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* Price Filter Section */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 font-worksans">Price Range</h4>
                <div className="space-y-2">
                  {priceFilterOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="priceFilter"
                        value={option.value}
                        checked={priceFilter === option.value}
                        onChange={(e) => handlePriceFilter(e.target.value)}
                        className="mr-3 text-orange-500"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                
                {/* Custom Price Range Inputs */}
                {priceFilter === 'custom' && (

                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[120px]">
                        <input
                          type="number"
                          placeholder="Min"
                          value={customMinPrice}
                          onChange={(e) => setCustomMinPrice(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                      <span className="text-gray-500 text-sm">to</span>
                      <div className="flex-1 max-w-[120px]">
                        <input
                          type="number"
                          placeholder="Max"
                          value={customMaxPrice}
                          onChange={(e) => setCustomMaxPrice(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                        />
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-worksans"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-worksans"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
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
                    className={`w-full text-left px-4 py-3 rounded-lg ${
                      selectedSort === option.value
                        ? 'bg-orange-50 text-[#F2631F]'
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

export default NewProduct;