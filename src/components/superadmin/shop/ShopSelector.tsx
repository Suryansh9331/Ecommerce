import React, { useState, useEffect } from "react";
import { BasicShop } from "../../../types/shopGST";
import { fetchShopsForGST } from "../../../services/superadmin/shopGSTService";

interface ShopSelectorProps {
  selectedShopId: number | null;
  onShopChange: (shop: BasicShop | null) => void;
  disabled?: boolean;
}

const ShopSelector: React.FC<ShopSelectorProps> = ({
  selectedShopId,
  onShopChange,
  disabled = false,
}) => {
  const [shops, setShops] = useState<BasicShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedShops = await fetchShopsForGST();
      setShops(fetchedShops);
    } catch (err) {
      console.error("Error loading shops:", err);
      setError(err instanceof Error ? err.message : "Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  const handleShopChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const shopId = event.target.value;
    if (!shopId) {
      onShopChange(null);
    } else {
      const shop = shops.find(s => s.shop_id === Number(shopId));
      onShopChange(shop || null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Shop
        </label>
        <div className="relative">
          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 flex items-center justify-center min-h-[42px]">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading shops...</span>
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
          Select Shop
        </label>
        <div className="relative">
          <select
            disabled
            className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20 dark:border-red-600 text-red-700 dark:text-red-300"
          >
            <option>Error loading shops</option>
          </select>
          <button
            onClick={loadShops}
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
        Select Shop *
      </label>
      <div className="relative">
        <select
          value={selectedShopId || ""}
          onChange={handleShopChange}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${
            disabled
              ? "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed"
              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
          }`}
          required
        >
          <option value="">-- Select a Shop --</option>
          {shops.map((shop) => (
            <option key={shop.shop_id} value={shop.shop_id}>
              {shop.name}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`w-5 h-5 ${disabled ? "text-gray-400" : "text-gray-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Shop count indicator */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {shops.length} shop{shops.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
};

export default ShopSelector;
