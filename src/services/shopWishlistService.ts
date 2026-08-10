import {
  ShopWishlistItem,
  ShopWishlistResponse,
  ShopWishlistStatusResponse,
  ShopWishlistAddResponse,
  ShopWishlistRemoveResponse,
  ShopWishlistError
} from '../types/shopWishlist';

const getApiBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ;
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const API_BASE_URL = getApiBaseUrl();

class ShopWishlistService {
  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Handle API errors consistently
   */
  private handleApiError(error: any, shopId: number, action: string): ShopWishlistError {
    console.error(`Shop Wishlist API Error (${action} - Shop ${shopId}):`, error);
    
    if (error.response) {
      return {
        message: error.response.data?.message || `Failed to ${action}`,
        status: error.response.status,
        shopId
      };
    }
    
    return {
      message: error.message || `Failed to ${action}`,
      shopId
    };
  }

  /**
   * Add a product to shop wishlist
   */
  async addToWishlist(shopId: number, productId: number): Promise<ShopWishlistItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/shops/${shopId}/wishlist`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ product_id: productId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add item to wishlist');
      }

      const data: ShopWishlistAddResponse = await response.json();
      
      return data.data;
    } catch (error) {
      throw this.handleApiError(error, shopId, 'add item to wishlist');
    }
  }

  /**
   * Remove a product from shop wishlist
   */
  async removeFromWishlist(shopId: number, wishlistItemId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/shops/${shopId}/wishlist/${wishlistItemId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to remove item from wishlist');
      }

      await response.json();
      // Success if we get here and response was ok
    } catch (error) {
      throw this.handleApiError(error, shopId, 'remove item from wishlist');
    }
  }

  /**
   * Get all wishlist items for a specific shop
   */
  async getShopWishlist(shopId: number): Promise<ShopWishlistItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/shops/${shopId}/wishlist`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch wishlist');
      }

      const data: ShopWishlistResponse = await response.json();
      
      // Check if data.data exists and has wishlist_items
      if (!data.data || !data.data.wishlist_items) {
        throw new Error('Invalid response format');
      }

      return data.data.wishlist_items;
    } catch (error) {
      throw this.handleApiError(error, shopId, 'fetch wishlist');
    }
  }

  /**
   * Check if a product is in shop wishlist
   */
  async checkWishlistStatus(shopId: number, productId: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/shops/${shopId}/wishlist/check/${productId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        // If the check fails, assume item is not in wishlist rather than throwing error
        console.warn(`Failed to check wishlist status for shop ${shopId}, product ${productId}`);
        return false;
      }

      const data: ShopWishlistStatusResponse = await response.json();
      
      return data.data.is_in_wishlist;
    } catch (error) {
      console.warn(`Error checking wishlist status for shop ${shopId}, product ${productId}:`, error);
      // Return false instead of throwing to avoid breaking UI
      return false;
    }
  }

  /**
   * Get wishlist count for a specific shop
   */
  async getShopWishlistCount(shopId: number): Promise<number> {
    try {
      const items = await this.getShopWishlist(shopId);
      return items.length;
    } catch (error) {
      console.warn(`Failed to get wishlist count for shop ${shopId}:`, error);
      return 0;
    }
  }

  /**
   * Batch check wishlist status for multiple products in a shop
   */
  async batchCheckWishlistStatus(shopId: number, productIds: number[]): Promise<Record<number, boolean>> {
    const results: Record<number, boolean> = {};
    
    // Execute checks in parallel with limited concurrency to avoid overwhelming the server
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      const batch = productIds.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (productId) => {
        const isInWishlist = await this.checkWishlistStatus(shopId, productId);
        return { productId, isInWishlist };
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ productId, isInWishlist }) => {
        results[productId] = isInWishlist;
      });
    }
    
    return results;
  }
}

// Create and export singleton instance
export const shopWishlistService = new ShopWishlistService();
export default shopWishlistService;
