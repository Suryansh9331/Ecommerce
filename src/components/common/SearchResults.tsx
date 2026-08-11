import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronsDownUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  primary_image?: string;
  category?: string;
}

interface Category {
  category_id: number;
  name: string;
  slug: string;
  icon_url?: string;
}

interface Brand {
  brand_id: number;
  name: string;
  slug: string;
  logo_url?: string;
}

interface SearchResultsProps {
  isVisible: boolean;
  searchQuery: string;
  searchType: 'all' | 'products' | 'categories' | 'brands';
  onItemClick?: (item: any) => void;
  setIsVisible: (visible: boolean) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SearchResults: React.FC<SearchResultsProps> = ({
  isVisible,
  searchQuery,
  searchType,
  onItemClick,
  setIsVisible,
}) => {
  const [results, setResults] = useState<{
    products: Product[];
    categories: Category[];
    brands: Brand[];
  }>({
    products: [],
    categories: [],
    brands: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.trim() || !isVisible) {
        setResults({ products: [], categories: [], brands: [] });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/products/search-suggestions?q=${encodeURIComponent(searchQuery)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setResults({ products: [], categories: [], brands: [] });
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, isVisible]);

  if (!isVisible || !searchQuery.trim()) return null;

  const handleItemClick = (item: Product | Category | Brand, type: string) => {
    setIsVisible(false);
    if (onItemClick) {
      onItemClick(item);
    }
    setTimeout(() => {
      if (type === 'product') {
        navigate(`/product/${(item as Product).id}`);
      } else if (type === 'category') {
        navigate(`/products/${(item as Category).category_id}`);
      } else if (type === 'brand') {
        navigate(`/brands/${(item as Brand).brand_id}`);
      }
    }, 0);
  };

  if (loading) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const hasResults =
    (searchType === 'all' || searchType === 'products') && results.products.length > 0 ||
    (searchType === 'all' || searchType === 'categories') && results.categories.length > 0 ||
    (searchType === 'all' || searchType === 'brands') && results.brands.length > 0;

  if (!hasResults) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <p className="text-gray-500 text-sm">No results found</p>
      </div>
    );
  }

  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[70vh] overflow-y-auto">
      {(searchType === 'all' || searchType === 'products') && results.products.length > 0 && (
        <div className="p-2">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Products</h3>
          {results.products.map((product) => (
            <div
              key={product.id}
              onMouseDown={() => handleItemClick(product, 'product')}
              onTouchStart={() => handleItemClick(product, 'product')}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded"
            >
              {product.primary_image && (
                <img
                  src={product.primary_image}
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded"
                />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">₹{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {(searchType === 'all' || searchType === 'categories') && results.categories.length > 0 && (
        <div className="p-2 border-t">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Categories</h3>
          {results.categories.map((category) => (
            <div
              key={category.category_id}
              onMouseDown={() => handleItemClick(category, 'category')}
              onTouchStart={() => handleItemClick(category, 'category')}
              className="flex items-center text-black gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded"
            >
              {category.icon_url && (
                <img
                  src={category.icon_url}
                  alt={category.name}
                  className="w-6 h-6 object-contain"
                />
              )}
              <p className="text-sm">{category.name}</p>
            </div>
          ))}
        </div>
      )}

      {(searchType === 'all' || searchType === 'brands') && results.brands.length > 0 && (
        <div className="p-2 border-t">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Brands</h3>
          {results.brands.map((brand) => (
            <div
              key={brand.brand_id}
              onMouseDown={() => handleItemClick(brand, 'brand')}
              onTouchStart={() => handleItemClick(brand, 'brand')}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded"
            >
              {brand.logo_url && (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-6 h-6 object-contain"
                />
              )}
              <p className="text-sm">{brand.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
