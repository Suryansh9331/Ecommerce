import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon, StarIcon as SolidStarIcon, ShoppingBagIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/solid';
import { StarIcon as OutlineStarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'; 
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../hooks/useAmazonTranslate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface MerchantProduct {
  product_id: number;
  name: string;
}

interface ProductPlacement {
  placement_id: number;
  product_id: number;
  merchant_id: number;
  placement_type: 'featured' | 'promoted';
  sort_order: number;
  is_active: boolean;
  expires_at: string | null;
  added_at: string;
  product_details: {
    product_id: number;
    product_name: string;
    selling_price?: number;
    special_price?: number;
    special_start?: string;
    special_end?: string;
    is_on_special_offer?: boolean;
    // Legacy fields for backward compatibility
    original_price?: number;
    promotional_price?: number;
  };
}

interface SubscriptionStatus {
  is_subscribed: boolean;
  can_place_premium: boolean;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  monthly_featured_used: number;
  monthly_promo_used: number;
  plan: {
    plan_id: number;
    name: string;
    description: string;
    featured_limit: number;
    promo_limit: number;
    duration_days: number;
    price: number;
    can_place_premium: boolean;
  } | null;
}

const ProductPlacements: React.FC = () => {
  const { accessToken, user } = useAuth();
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();
  
  // State for subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const [placements, setPlacements] = useState<ProductPlacement[]>([]);
  const [merchantProducts, setMerchantProducts] = useState<MerchantProduct[]>([]);
  // Display-only translated names
  const [tProductNames, setTProductNames] = useState<Record<string, string>>({});
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [placementToDelete, setPlacementToDelete] = useState<number | null>(null);

  const [selectedPlacementTypeToAdd, setSelectedPlacementTypeToAdd] = useState<'FEATURED' | 'PROMOTED'>('FEATURED');
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState<string>('');
  const [sortOrderToAdd, setSortOrderToAdd] = useState<number>(0);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<MerchantProduct | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Edit placement states
  const [editingPlacement, setEditingPlacement] = useState<ProductPlacement | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [filterType, setFilterType] = useState<'ALL' | 'FEATURED' | 'PROMOTED'>('ALL');

  const [promotionalPrice, setPromotionalPrice] = useState<string>('');
  const [specialStartDate, setSpecialStartDate] = useState<string>('');
  const [specialEndDate, setSpecialEndDate] = useState<string>('');

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!accessToken || !user) {
        setIsSubscriptionLoading(false);
        setSubscriptionError("User not authenticated.");
        return;
      }
      setIsSubscriptionLoading(true);
      setSubscriptionError(null);
      try {
        // console.log('Fetching subscription status...');
        const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/subscription/current`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Subscription status error:', errorData);
          throw new Error(errorData.message || `Failed to fetch subscription status (${response.status})`);
        }
        
        const statusData = await response.json();
        // console.log('Subscription status received:', statusData);
        setSubscriptionStatus(statusData);
      } catch (error) {
        console.error("Error fetching subscription status:", error);
        setSubscriptionError(error instanceof Error ? error.message : 'Could not load subscription status.');
        toast.error(error instanceof Error ? error.message : 'Could not load subscription status.');
      } finally {
        setIsSubscriptionLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [accessToken, user]);

  const refreshSubscriptionStatus = useCallback(async () => {
    if (!accessToken || !user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/subscription/current`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      
      if (response.ok) {
        const statusData = await response.json();
        setSubscriptionStatus(statusData);
      }
    } catch (error) {
      console.error("Error refreshing subscription status:", error);
    }
  }, [accessToken, user]);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingData(true);
    try {
      // Fetch merchant products
      const productsResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!productsResponse.ok) throw new Error('Failed to fetch merchant products');
      const productsData = await productsResponse.json();
      setMerchantProducts(productsData.map((p: any) => ({ product_id: p.product_id, name: p.product_name })));

      // Fetch current placements
      const placementsResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/product-placements`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!placementsResponse.ok) throw new Error('Failed to fetch product placements');
      const placementsData = await placementsResponse.json();
      setPlacements(placementsData);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to load product data.');
    } finally {
      setIsLoadingData(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isSubscriptionLoading && !subscriptionError) {
      fetchData();
    }
  }, [fetchData, isSubscriptionLoading, subscriptionError]);

  // Translate product names for search list and table display
  useEffect(() => {
    const run = async () => {
      const lang = i18n.language || 'en';
      const items: { id: string; text: string }[] = [];
      merchantProducts.forEach((p) => {
        if (p.name) items.push({ id: `mp:${p.product_id}`, text: p.name });
      });
      placements.forEach((pl) => {
        const name = pl.product_details?.product_name;
        if (name) items.push({ id: `pl:${pl.placement_id}`, text: name });
      });
      if (!items.length) {
        setTProductNames({});
        return;
      }
      try {
        const res = await translateBatch(items, lang, 'text/plain');
        const map: Record<string, string> = {};
        items.forEach(({ id, text }) => {
          if (res[id]) map[text] = res[id];
        });
        setTProductNames(map);
      } catch {
        // fail open
      }
    };
    run();
  }, [merchantProducts, placements, i18n.language, translateBatch]);

  const canPlacePremium = useMemo(() => {
    // console.log('Current subscription status:', subscriptionStatus);
    return subscriptionStatus?.can_place_premium === true;
  }, [subscriptionStatus]);

  const handleAddPlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedProductIdToAdd) {
      toast.error('Please select a product.');
      return;
    }
    if (!canPlacePremium) {
      toast.error('Your subscription does not allow adding premium placements.');
      return;
    }

    // Validate promotional data for promoted products
    if (selectedPlacementTypeToAdd === 'PROMOTED') {
      if (!promotionalPrice || isNaN(parseFloat(promotionalPrice)) || parseFloat(promotionalPrice) <= 0) {
        toast.error('Please enter a valid promotional price.');
        return;
      }
      if (!specialStartDate || !specialEndDate) {
        toast.error('Please select both start and end dates for the promotion.');
        return;
      }
      
      const startDate = new Date(specialStartDate);
      const endDate = new Date(specialEndDate);
      const today = new Date();
      
      // Set today's time to start of day for comparison
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        toast.error('Promotion start date cannot be in the past.');
        return;
      }
      if (endDate <= startDate) {
        toast.error('Promotion end date must be after the start date.');
        return;
      }
      if (endDate > new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))) {
        toast.error('Promotion cannot last more than 30 days.');
        return;
      }
      
      // Check if promotional end date exceeds subscription end date
      if (subscriptionStatus?.subscription_expires_at) {
        const subscriptionExpiryDate = new Date(subscriptionStatus.subscription_expires_at);
        subscriptionExpiryDate.setHours(0, 0, 0, 0);
        if (endDate > subscriptionExpiryDate) {
          toast.error(`Promotion end date cannot be beyond your subscription expiry date (${subscriptionExpiryDate.toLocaleDateString()}).`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/product-placements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: parseInt(selectedProductIdToAdd),
          placement_type: selectedPlacementTypeToAdd,
          sort_order: sortOrderToAdd,
          promotional_price: selectedPlacementTypeToAdd === 'PROMOTED' ? parseFloat(promotionalPrice) : undefined,
          special_start: selectedPlacementTypeToAdd === 'PROMOTED' ? specialStartDate : undefined,
          special_end: selectedPlacementTypeToAdd === 'PROMOTED' ? specialEndDate : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add placement');
      }

      toast.success('Product placement added successfully!');
      setSelectedProductIdToAdd('');
      setSelectedProduct(null);
      setSearchQuery('');
      setIsSearchDropdownOpen(false);
      setSortOrderToAdd(0);
      setPromotionalPrice('');
      setSpecialStartDate('');
      setSpecialEndDate('');
      await fetchData();
      await refreshSubscriptionStatus(); // Refresh to update monthly usage
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error("Error adding placement:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to add placement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlacement = async (placementId: number) => {
    setPlacementToDelete(placementId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!placementToDelete) return;
    
    setIsDeleting(placementToDelete);
    try {
      const placementToRemove = placements.find(p => p.placement_id === placementToDelete);
      
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/product-placements/${placementToDelete}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cleanup_promotion: placementToRemove?.placement_type === 'promoted'
        })
      });

      if (response.status !== 204 && !response.ok ) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete placement');
      }
      
      toast.success('Product placement removed successfully!');
      await fetchData();
      await refreshSubscriptionStatus(); // Refresh to update monthly usage
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error("Error deleting placement:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete placement.');
    } finally {
      setIsDeleting(null);
      setDeleteModalOpen(false);
      setPlacementToDelete(null);
    }
  };

  const handleEditPlacement = (placement: ProductPlacement) => {
    if (placement.placement_type === 'promoted') {
      setEditingPlacement(placement);
      // Use special_price if available, fallback to promotional_price for backward compatibility
      const currentPrice = placement.product_details?.special_price ?? placement.product_details?.promotional_price;
      setPromotionalPrice(currentPrice?.toString() || '');
      setSpecialStartDate(placement.product_details?.special_start || '');
      setSpecialEndDate(placement.product_details?.special_end || '');
      setEditModalOpen(true);
    }
  };

  const handleUpdatePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlacement) return;

    // Validate promotional data
    if (!promotionalPrice || isNaN(parseFloat(promotionalPrice)) || parseFloat(promotionalPrice) <= 0) {
      toast.error('Please enter a valid promotional price.');
      return;
    }
    if (!specialStartDate || !specialEndDate) {
      toast.error('Please select both start and end dates for the promotion.');
      return;
    }
    
    const startDate = new Date(specialStartDate);
    const endDate = new Date(specialEndDate);
    const today = new Date();
    
    // Set today's time to start of day for comparison
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      toast.error('Promotion start date cannot be in the past.');
      return;
    }
    if (endDate <= startDate) {
      toast.error('Promotion end date must be after the start date.');
      return;
    }
    if (endDate > new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))) {
      toast.error('Promotion cannot last more than 30 days.');
      return;
    }
    
    // Check if promotional end date exceeds subscription end date
    if (subscriptionStatus?.subscription_expires_at) {
      const subscriptionExpiryDate = new Date(subscriptionStatus.subscription_expires_at);
      subscriptionExpiryDate.setHours(0, 0, 0, 0);
      if (endDate > subscriptionExpiryDate) {
        toast.error(`Promotion end date cannot be beyond your subscription expiry date (${subscriptionExpiryDate.toLocaleDateString()}).`);
        return;
      }
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/product-placements/${editingPlacement.placement_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promotional_price: parseFloat(promotionalPrice),
          special_start: specialStartDate,
          special_end: specialEndDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update placement');
      }

      toast.success('Product placement updated successfully!');
      setEditModalOpen(false);
      setEditingPlacement(null);
      setPromotionalPrice('');
      setSpecialStartDate('');
      setSpecialEndDate('');
      await fetchData();
      await refreshSubscriptionStatus(); // Refresh to update monthly usage
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error("Error updating placement:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to update placement.');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredPlacements = useMemo(() => {
    if (filterType === 'ALL') return placements;
    return placements.filter(p => p.placement_type.toUpperCase() === filterType);
  }, [placements, filterType]);

  const getSlotInfo = useCallback((type: 'featured' | 'promoted') => {
    const planLimit = type === 'featured' 
      ? subscriptionStatus?.plan?.featured_limit || 0
      : subscriptionStatus?.plan?.promo_limit || 0;
    
    const monthlyUsed = type === 'featured'
      ? subscriptionStatus?.monthly_featured_used || 0
      : subscriptionStatus?.monthly_promo_used || 0;
    
    const currentActive = placements.filter(p => p.placement_type === type).length;
    
    return {
      used: monthlyUsed,
      currentActive: currentActive,
      remaining: Math.max(0, planLimit - monthlyUsed),
      limitReached: monthlyUsed >= planLimit,
      planLimit: planLimit
    };
  }, [placements, subscriptionStatus]);

  const featuredSlots = getSlotInfo('featured');
  const promotedSlots = getSlotInfo('promoted');
  
  const currentSlotsInfo = selectedPlacementTypeToAdd === 'FEATURED' ? featuredSlots : promotedSlots;

  // Simple similarity function for fuzzy matching
  const similarity = useCallback((str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }, []);

  // Levenshtein distance for string similarity
  const levenshteinDistance = useCallback((str1: string, str2: string): number => {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }, []);

  // Search and filter products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return merchantProducts;
    
    const query = searchQuery.toLowerCase().trim();
    return merchantProducts.filter(product => {
      const displayName = tProductNames[product.name] || product.name;
      const name = displayName.toLowerCase();
      
      // Exact match
      if (name.includes(query)) return true;
      
      // Word-based fuzzy search
      const queryWords = query.split(' ').filter(word => word.length > 0);
      const nameWords = name.split(' ');
      
      return queryWords.every(queryWord => 
        nameWords.some(nameWord => 
          nameWord.includes(queryWord) || 
          queryWord.includes(nameWord) ||
          // Simple character similarity for typos
          similarity(queryWord, nameWord) > 0.6
        )
      );
    }).slice(0, 10); // Limit to 10 results for performance
  }, [merchantProducts, searchQuery, similarity, tProductNames]);

  const handleProductSelect = (product: MerchantProduct) => {
    setSelectedProduct(product);
    setSelectedProductIdToAdd(product.product_id.toString());
  setSearchQuery(tProductNames[product.name] || product.name);
    setIsSearchDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    setIsSearchDropdownOpen(true);
    setHighlightedIndex(-1);
    
    // Clear selected product if user is typing a new search
    if (selectedProduct && value !== selectedProduct.name) {
      setSelectedProduct(null);
      setSelectedProductIdToAdd('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchDropdownOpen || filteredProducts.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredProducts.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
          handleProductSelect(filteredProducts[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsSearchDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedProduct(null);
    setSelectedProductIdToAdd('');
    setIsSearchDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const getMaxPromotionEndDate = useCallback(() => {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    if (subscriptionStatus?.subscription_expires_at) {
      const subscriptionExpiryDate = new Date(subscriptionStatus.subscription_expires_at);
      return thirtyDaysFromNow <= subscriptionExpiryDate ? thirtyDaysFromNow : subscriptionExpiryDate;
    }
    
    return thirtyDaysFromNow;
  }, [subscriptionStatus?.subscription_expires_at]);

  if (isSubscriptionLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
        <p className="ml-3 text-gray-600">Loading subscription status...</p>
      </div>
    );
  }
  
  if (subscriptionError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium">Could not load subscription status.</p>
        <p className="text-red-600 text-sm mt-1">{subscriptionError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPlacementToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this product placement? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPlacementToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting === placementToDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isDeleting === placementToDelete ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Promoted Placement Modal */}
      {editModalOpen && editingPlacement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Promoted Product</h3>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingPlacement(null);
                  setPromotionalPrice('');
                  setSpecialStartDate('');
                  setSpecialEndDate('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Product:</span> {editingPlacement.product_details?.product_name}
              </p>
            </div>

            <form onSubmit={handleUpdatePlacement} className="space-y-4">
              <div>
                <label htmlFor="editPromotionalPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Promotional Price
                </label>
                <div className="relative">
                  <span className="absolute ml-2 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    id="editPromotionalPrice"
                    value={promotionalPrice}
                    onChange={(e) => setPromotionalPrice(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-full pl-8 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500"
                    placeholder="0.00"
                    disabled={isUpdating}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editSpecialStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="editSpecialStartDate"
                    value={specialStartDate}
                    onChange={(e) => setSpecialStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500"
                    disabled={isUpdating}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="editSpecialEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="editSpecialEndDate"
                    value={specialEndDate}
                    onChange={(e) => setSpecialEndDate(e.target.value)}
                    min={specialStartDate || new Date().toISOString().split('T')[0]}
                    max={getMaxPromotionEndDate().toISOString().split('T')[0]}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500"
                    disabled={isUpdating}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingPlacement(null);
                    setPromotionalPrice('');
                    setSpecialStartDate('');
                    setSpecialEndDate('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Placement'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Featured & Promoted Products</h1>

      <div className="bg-white p-6 rounded-lg shadow-md border border-primary-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-1">Add Product to Placement</h2>
        
        {subscriptionStatus?.is_subscribed && (
          <div className="mt-4 p-3 bg-primary-50 text-primary-700 border border-primary-200 rounded-md text-sm">
            <div className="flex items-center justify-between">
              <span className="text-primary-600">
                Current Plan: {subscriptionStatus.plan?.name}
              </span>
              <a 
                href="/business/subscription" 
                className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Change Plan
              </a>
            </div>
          </div>
        )}

        {!canPlacePremium && (
          <div className="mt-4 p-3 bg-primary-50 text-primary-700 border border-primary-200 rounded-md text-sm">
            <p>
              <OutlineStarIcon className="h-5 w-5 inline-block mr-2 text-primary-500" />
              {subscriptionStatus?.is_subscribed 
                ? "Your current subscription plan doesn't include premium placements."
                : "You need an active subscription to use premium placements."}
              {' '}
              <a href="/business/subscription" className="font-medium underline hover:text-primary-800">
                {subscriptionStatus?.is_subscribed ? 'Upgrade your plan' : 'Subscribe now'}
              </a>
            </p>
          </div>
        )}

        <form onSubmit={handleAddPlacement} className="space-y-4 mt-4 max-w-xl">
          <div>
            <label htmlFor="placementTypeToAdd" className="block text-sm font-medium text-gray-700 mb-1">Placement Type</label>
            <div className="relative">
                <select
                id="placementTypeToAdd"
                value={selectedPlacementTypeToAdd}
                onChange={(e) => {
                  setSelectedPlacementTypeToAdd(e.target.value as 'FEATURED' | 'PROMOTED');
                  // Refresh subscription status when placement type changes to get latest slot info
                  refreshSubscriptionStatus();
                }}
                className="w-full p-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 appearance-none"
                disabled={!canPlacePremium || isSubmitting}
                >
                <option value="FEATURED">Featured</option>
                <option value="PROMOTED">Promoted</option>
                </select>
                {/* <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" /> */}
            </div>
          </div>

          <div>
            <label htmlFor="productSearch" className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  id="productSearch"
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  placeholder="Search for a product..."
                  className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500"
                  disabled={!canPlacePremium || isSubmitting || currentSlotsInfo.limitReached}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
                {!searchQuery && (
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
              </div>
              
              {/* Search Dropdown */}
              {isSearchDropdownOpen && filteredProducts.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product.product_id}
                      className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                        index === highlightedIndex 
                          ? 'bg-accent-100 text-accent-800' 
                          : selectedProduct?.product_id === product.product_id 
                            ? 'bg-accent-50 border-accent-200' 
                            : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleProductSelect(product)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div className="text-sm font-medium text-gray-900 truncate" title={product.name}>
                        {/* Highlight matching text */}
                        {searchQuery ? (
                          <span dangerouslySetInnerHTML={{
                            __html: (tProductNames[product.name] || product.name).replace(
                              new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                              '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                            )
                          }} />
                        ) : (
                          tProductNames[product.name] || product.name
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {product.product_id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Results Message */}
              {isSearchDropdownOpen && searchQuery && filteredProducts.length === 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
                  <div className="text-sm text-gray-500 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    <p className="font-medium">No products found</p>
                    <p className="text-xs mt-1 text-gray-400">
                      No matches for "<span className="font-medium">{searchQuery}</span>". Try different keywords or check spelling.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Click outside to close dropdown */}
              {isSearchDropdownOpen && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsSearchDropdownOpen(false)}
                />
              )}
            </div>
            
            {/* Helper text */}
            <p className="text-xs text-gray-500 mt-1">
              Search by product name. Use arrow keys to navigate, Enter to select, Esc to close.
            </p>
            
            {/* Selected Product Indicator */}
            {selectedProduct && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700 font-medium">Selected: {tProductNames[selectedProduct.name] || selectedProduct.name}</span>
                </div>
              </div>
            )}
            
            {merchantProducts.length === 0 && !isLoadingData && (
              <p className="text-xs text-gray-500 mt-1">You have no products to add.</p>
            )}
          </div>

          {selectedPlacementTypeToAdd === 'PROMOTED' && (
            <>
              <div>
                <label htmlFor="promotionalPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Promotional Price
                </label>
                <div className="relative">
                  <span className="absolute  top-1/2 transform -translate-y-1/2 text-gray-500 ml-2 ">₹</span>
                  <input
                    type="number"
                    id="promotionalPrice"
                    value={promotionalPrice}
                    onChange={(e) => setPromotionalPrice(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-full pl-8 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500"
                    placeholder="0.00"
                    disabled={!canPlacePremium || isSubmitting || currentSlotsInfo.limitReached}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter the special promotional price for this product.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="specialStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Promotion Start Date
                  </label>
                  <input
                    type="date"
                    id="specialStartDate"
                    value={specialStartDate}
                    onChange={(e) => setSpecialStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500"
                    disabled={!canPlacePremium || isSubmitting || currentSlotsInfo.limitReached}
                  />
                  <p className="text-xs text-gray-500 mt-1">When should the promotion start? (Can start today)</p>
                </div>

                <div>
                  <label htmlFor="specialEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Promotion End Date
                  </label>
                  <input
                    type="date"
                    id="specialEndDate"
                    value={specialEndDate}
                    onChange={(e) => setSpecialEndDate(e.target.value)}
                    min={specialStartDate || new Date().toISOString().split('T')[0]}
                    max={getMaxPromotionEndDate().toISOString().split('T')[0]}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500"
                    disabled={!canPlacePremium || isSubmitting || currentSlotsInfo.limitReached}
                  />
                  <p className="text-xs text-gray-500 mt-1">When should the promotion end? {subscriptionStatus?.subscription_expires_at ? `(Cannot exceed subscription expiry: ${new Date(subscriptionStatus.subscription_expires_at).toLocaleDateString()})` : '(max 30 days)'}</p>
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="sortOrderToAdd" className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              type="number"
              id="sortOrderToAdd"
              value={sortOrderToAdd}
              onChange={(e) => setSortOrderToAdd(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500"
              disabled={!canPlacePremium || isSubmitting || currentSlotsInfo.limitReached}
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first. Default is 0.</p>
          </div>

          <div className="text-sm text-gray-600 p-3 bg-primary-50 rounded-md border border-primary-100">
            <p>Monthly slots for <span className="font-medium">{selectedPlacementTypeToAdd.toLowerCase()}</span>: <span className="font-semibold">{currentSlotsInfo.used} / {currentSlotsInfo.planLimit}</span></p>
            <p>Currently active: <span className="font-semibold">{currentSlotsInfo.currentActive}</span></p>
            <p className={`font-semibold ${currentSlotsInfo.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Remaining slots this month: {currentSlotsInfo.remaining}
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-accent-500 hover:bg-accent-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            disabled={!canPlacePremium || isSubmitting || !selectedProduct || currentSlotsInfo.limitReached}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <PlusIcon className="h-5 w-5 mr-2"/> Add to {selectedPlacementTypeToAdd.toLowerCase()}
              </>
            )}
          </button>
          {currentSlotsInfo.limitReached && canPlacePremium && (
            <p className="text-xs text-red-600 mt-2 text-center">
                Monthly slot limit reached for {selectedPlacementTypeToAdd.toLowerCase()} products. You can still manage existing placements.
            </p>
          )}
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-primary-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2 sm:mb-0">Your Current Placements</h2>
          <div className="w-full sm:w-auto relative">
            <select
              id="filterPlacementType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'ALL' | 'FEATURED' | 'PROMOTED')}
              className="w-full sm:w-auto p-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:ring-accent-500 focus:border-accent-500 appearance-none"
            >
              <option value="ALL">All Placements</option>
              <option value="FEATURED">Featured Only</option>
              <option value="PROMOTED">Promoted Only</option>
            </select>
            {/* <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" /> */}
          </div>
        </div>

        {isLoadingData && placements.length === 0 ? (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-500"></div>
                <p className="ml-3 text-gray-600">Loading placements...</p>
            </div>
        ) : !isLoadingData && filteredPlacements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingBagIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No products found for the selected filter.</p>
            {filterType === 'ALL' && <p className="text-sm">Try adding a product to a placement using the form above.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Sort Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Added</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Promotion Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlacements.map(placement => (
                  <tr key={placement.placement_id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 mr-3 rounded-md bg-primary-100 flex items-center justify-center text-primary-500">
                            <SolidStarIcon className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{tProductNames[placement.product_details?.product_name || ''] || placement.product_details?.product_name || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        placement.placement_type === 'featured' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {placement.placement_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {/* 
                        Price Display Logic:
                        - For promoted products with active special offers: show special_price with strikethrough selling_price
                        - For all other cases (featured products or promoted without special offers): show selling_price
                      */}
                      {placement.placement_type === 'promoted' && 
                       placement.product_details?.special_price != null && 
                       placement.product_details?.is_on_special_offer ? (
                        <div className="text-sm">
                          {placement.product_details.selling_price != null && (
                            <span className="text-gray-500 line-through ml-2 ">₹{placement.product_details.selling_price.toFixed(2)}</span>
                          )}
                          <span className="ml-2 text-red-600 font-semibold">₹{placement.product_details.special_price.toFixed(2)}</span>
                          <div className="text-xs text-green-600 mt-1">Special Offer Active</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 ml-2">₹{placement.product_details?.selling_price?.toFixed(2) || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{placement.sort_order}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(placement.added_at).toLocaleDateString()}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {placement.placement_type === 'promoted' && placement.product_details?.special_start && placement.product_details?.special_end ? (
                        <div>
                          <div className="text-gray-600">
                            {new Date(placement.product_details.special_start).toLocaleDateString()} - {new Date(placement.product_details.special_end).toLocaleDateString()}
                          </div>
                          {new Date(placement.product_details.special_end) > new Date() && (
                            <div className="text-xs text-red-600">
                              {Math.ceil((new Date(placement.product_details.special_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                            </div>
                          )}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {placement.placement_type === 'promoted' && (
                          <button
                            onClick={() => handleEditPlacement(placement)}
                            className="text-blue-400 hover:text-blue-600 disabled:opacity-50 p-1 rounded-full hover:bg-blue-50"
                            disabled={isDeleting === placement.placement_id || isUpdating}
                            title="Edit Placement"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePlacement(placement.placement_id)}
                          className="text-red-400 hover:text-red-600 disabled:opacity-50 p-1 rounded-full hover:bg-red-50"
                          disabled={isDeleting === placement.placement_id}
                          title="Delete Placement"
                        >
                          {isDeleting === placement.placement_id ? (
                            <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <TrashIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPlacements;