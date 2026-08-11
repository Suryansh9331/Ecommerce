import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../hooks/useAmazonTranslate';

interface Category {
  category_id: number;
  name: string;
  slug: string;
  icon_url: string;
  parent_id: number | null;
  children?: Category[];
}

interface CategoryDropdownProps {
  isOpen: boolean;
  closeDropdown?: () => void;
  isMobile?: boolean;
}

const collectAllCategories = (categories: Category[]): Category[] => {
  const collected: Category[] = [];
  const traverse = (category: Category) => {
    collected.push(category);
    if (category.children && category.children.length > 0) {
      category.children.forEach(traverse);
    }
  };
  categories.forEach(traverse);
  return collected;
};

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ isOpen, closeDropdown, isMobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);
  const [expandedSidebarCategory, setExpandedSidebarCategory] = useState<string | null>(null);
  const [translatedCategories, setTranslatedCategories] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Update selected category when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryId = params.get('category');
    setSelectedCategory(categoryId || '');
  }, [location.search]);

  // Translate category names when language changes
  useEffect(() => {
    const doTranslate = async () => {
      const lang = (i18n.language || 'en').split('-')[0];
      if (lang === 'en' || !categories.length) {
        setTranslatedCategories({});
        return;
      }
      const allCategories = collectAllCategories(categories);
      if (!allCategories.length) {
        setTranslatedCategories({});
        return;
      }
      try {
        const items = allCategories.map(cat => ({ 
          id: String(cat.category_id), 
          text: cat.name 
        }));
        const result = await translateBatch(items, lang, 'text/plain');
        const map: Record<number, string> = {};
        allCategories.forEach(cat => {
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories/all`);
      
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

  const handleCategoryClick = (category: Category) => {
    if (closeDropdown) {
      closeDropdown();
    }
    setSelectedCategory(String(category.category_id));
    navigate(`/all-products?category=${category.category_id}`);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className={`${isMobile ? 'px-2' : 'container mx-auto px-4 sm:px-6 md:px-4 lg:px-4 xl:px-4 max-w-full md:max-w-[98%] mid:max-w-[92%] xl:max-w-[1200px] -mt-0.5 z-40'}`}>
        <div className={`${isMobile ? 'bg-white rounded-lg shadow-md' : 'bg-primary-50 border border-[#e8e8e8] shadow-lg rounded-b-lg w-full max-w-xl'}`}>
          <div className="p-4">Loading categories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isMobile ? 'px-2' : 'container mx-auto px-4 sm:px-6 md:px-4 lg:px-4 xl:px-4 max-w-full md:max-w-[98%] mid:max-w-[92%] xl:max-w-[1200px] -mt-0.5 z-40 flex justify-start'}`}>
        <div className={`${isMobile ? 'bg-white rounded-lg shadow-md' : 'bg-primary-50 border border-[#e8e8e8] shadow-lg rounded-b-lg w-full max-w-5xl'}`}>
          <div className="p-4 text-red-500">Error loading categories: {error}</div>
        </div>
      </div>
    );
  }

  // Mobile View
  if (isMobile) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b sticky top-0 z-10">
          <h3 className="text-sm font-medium text-gray-900">Categories</h3>
        </div>
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          <button
            onClick={() => {
              if (closeDropdown) closeDropdown();
              setSelectedCategory('');
              navigate('/all-products');
            }}
            className={`flex items-center justify-between w-full px-4 py-3 text-sm border-b transition-colors duration-200 ${
              selectedCategory === '' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span> </span>
          </button>
          {categories.map(category => (
            <div key={category.category_id}>
              <button
                onClick={() => {
                  if (category.children && category.children.length > 0) {
                    setSelectedParentCategory(
                      selectedParentCategory?.category_id === category.category_id ? null : category
                    );
                  } else {
                    handleCategoryClick(category);
                  }
                }}
                className={`flex items-center justify-between w-full px-4 py-3 text-sm border-b hover:bg-gray-50 transition-colors duration-200 ${
                  selectedCategory === String(category.category_id) ? 'bg-primary-600 text-white' : 'text-gray-700'
                }`}
              >
                <span>{getCategoryName(category)}</span>
                {category.children && category.children.length > 0 && (
                  <ChevronRight 
                    className={`w-5 h-5 transition-transform duration-200 ${
                      selectedParentCategory?.category_id === category.category_id ? 'rotate-90' : ''
                    }`} 
                  />
                )}
              </button>
              {category.children && category.children.length > 0 && selectedParentCategory?.category_id === category.category_id && (
                <div className="bg-gray-50 transition-all duration-200 ease-in-out">
                  {category.children.map(child => (
                    <button
                      key={child.category_id}
                      onClick={() => handleCategoryClick(child)}
                      className={`flex items-center justify-between w-full px-8 py-3 text-sm border-b last:border-b-0 transition-colors duration-200 ${
                        selectedCategory === String(child.category_id) ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{getCategoryName(child)}</span>
                      {child.children && child.children.length > 0 && (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop View (existing code)
  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-4 lg:px-4 xl:px-4 max-w-full md:max-w-[98%] mid:max-w-[92%] xl:max-w-[1200px] -mt-0.5 z-40 flex justify-center">
      <div className="bg-primary-50 border border-[#e8e8e8] shadow-lg rounded-b-lg w-full max-w-full md:max-w-[1360px]">
        <div className="flex flex-col md:flex-row">
          {/* Left sidebar categories */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#e8e8e8] bg-primary-50">
            <button 
              onClick={() => {
                if (closeDropdown) closeDropdown();
                setSelectedCategory('');
                navigate('/all-products');
              }}
              className={`flex items-center justify-between px-3 md:px-5 py-2 md:py-3 hover:bg-primary-100 text-gray-800 text-sm md:text-base w-full text-left ${
                selectedCategory === '' ? 'bg-primary-600 text-white' : ''
              }`}
            >
              <span>All Products</span>
            </button>
            {categories.map(category => (
              <div key={category.category_id}>
                <button 
                  onClick={() => {
                    if (category.children && category.children.length > 0) {
                      setExpandedSidebarCategory(
                        expandedSidebarCategory === String(category.category_id) ? null : String(category.category_id)
                      );
                    } else {
                      handleCategoryClick(category);
                    }
                  }}
                  className={`flex items-center justify-between px-3 md:px-5 py-2 md:py-3 hover:bg-primary-100 text-gray-800 text-sm md:text-base w-full text-left ${
                    expandedSidebarCategory === String(category.category_id) ? 'bg-primary-600 text-white' : ''
                  }`}
                >
                  <span>{getCategoryName(category)}</span>
                  {category.children && category.children.length > 0 && <span>›</span>}
                </button>
                {category.children && category.children.length > 0 && expandedSidebarCategory === String(category.category_id) && (
                  <div className="ml-4">
                    {category.children.map(child => (
                      <button
                        key={child.category_id}
                        onClick={() => handleCategoryClick(child)}
                        className={`flex items-center justify-between px-3 md:px-5 py-2 md:py-3 hover:bg-primary-100 text-gray-800 text-sm md:text-base w-full text-left ${
                          selectedCategory === String(child.category_id) ? 'bg-primary-600 text-white' : ''
                        }`}
                      >
                        <span>{getCategoryName(child)}</span>
                      </button>
                    ))}
                    
                  </div>
                )}
              </div>
              
            ))}
            
          </div>
          
          
          {/* Right content area - Show subcategories of selected category */}
          <div className="flex-1 p-4 md:p-6 bg-primary-50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-x-10">
              {categories.map(category => (
                category.children && category.children.length > 0 && (
                  <div key={category.category_id}>
                    <h3 className="text-gray-800 font-medium mb-2 md:mb-4 text-sm md:text-base">
                      {getCategoryName(category)}
                    </h3>
                    <ul className="space-y-1 md:space-y-3">
                      {category.children.map(child => (
                        <li key={child.category_id}>
                          <button 
                            onClick={() => handleCategoryClick(child)}
                            className={`text-gray-600 hover:text-primary-600 text-xs md:text-sm text-left w-full ${
                              selectedCategory === String(child.category_id) ? 'text-primary-600 font-medium' : ''
                            }`}
                          >
                            {getCategoryName(child)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </div>
            
            <div className="mt-4 md:mt-8">
                      <button 
                        onClick={() => {
                          if (closeDropdown) closeDropdown();
                          setSelectedCategory('');
                          navigate('/all-products');
                        }}
                        className="bg-primary-600 text-white py-2 md:py-3 px-3 md:px-4 inline-block w-full text-center text-sm md:text-base rounded-md hover:bg-primary-700 transition-colors"
                      >
                        All Categories
                      </button>
                    </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDropdown; 