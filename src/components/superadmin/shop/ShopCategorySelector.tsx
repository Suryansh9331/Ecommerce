import React, { useState, useEffect } from "react";
import { BasicShopCategory } from "../../../types/shopGST";
import { fetchShopCategoriesForGST } from "../../../services/superadmin/shopGSTService";

interface ShopCategorySelectorProps {
  shopId: number | null;
  selectedCategoryId: number | null;
  onCategoryChange: (category: BasicShopCategory | null) => void;
  disabled?: boolean;
}

const ShopCategorySelector: React.FC<ShopCategorySelectorProps> = ({
  shopId,
  selectedCategoryId,
  onCategoryChange,
  disabled = false,
}) => {
  const [categories, setCategories] = useState<BasicShopCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shopId) {
      loadCategories(shopId);
    } else {
      setCategories([]);
      onCategoryChange(null);
    }
  }, [shopId]);

  const loadCategories = async (shopId: number) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCategories = await fetchShopCategoriesForGST(shopId);
      setCategories(fetchedCategories);
    } catch (err) {
      console.error("Error loading categories:", err);
      setError(err instanceof Error ? err.message : "Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = event.target.value;
    if (!categoryId) {
      onCategoryChange(null);
    } else {
      const category = categories.find(c => c.category_id === Number(categoryId));
      onCategoryChange(category || null);
    }
  };

  const renderCategory = (category: BasicShopCategory) => {
    // Add indentation for subcategories
    const indent = category.parent_id ? "— " : "";
    return `${indent}${category.name}`;
  };

  if (!shopId) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Category
        </label>
        <div className="relative">
          <select
            disabled
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          >
            <option>Select a shop first</option>
          </select>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Please select a shop to view categories
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Category
        </label>
        <div className="relative">
          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 flex items-center justify-center min-h-[42px]">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading categories...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Category
        </label>
        <div className="relative">
          <select
            disabled
            className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20 dark:border-red-600 text-red-700 dark:text-red-300"
          >
            <option>Error loading categories</option>
          </select>
          <button
            onClick={() => shopId && loadCategories(shopId)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
          >
            Retry
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Category *
      </label>
      <div className="relative">
        <select
          value={selectedCategoryId || ""}
          onChange={handleCategoryChange}
          disabled={disabled || categories.length === 0}
          className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${
            disabled || categories.length === 0
              ? "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed"
              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
          }`}
          required
        >
          <option value="">
            {categories.length === 0 ? "No categories available" : "-- Select a Category --"}
          </option>
          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {renderCategory(category)}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`w-5 h-5 ${disabled || categories.length === 0 ? "text-gray-400" : "text-gray-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Category count indicator */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {categories.length > 0 ? (
          `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'} available`
        ) : (
          "No categories found for this shop"
        )}
      </div>
    </div>
  );
};

export default ShopCategorySelector;
