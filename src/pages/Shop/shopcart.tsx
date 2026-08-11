import React, { useState, useEffect } from 'react';
import ShopCartItem from '../../components/ShopCartItem';
import ShopCartSummary from '../../components/ShopCartSummary';
import { useNavigate } from 'react-router-dom';
import { useShopCartOperations } from '../../context/ShopCartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react';
import { ShopCartItem as ShopCartItemType } from '../../services/shopCartService';
import ConfirmationModal from '../../components/common/ConfirmationModal';


const Shopcart: React.FC = () => {
  const navigate = useNavigate();
  const location = window.location.pathname;
  
  // Extract shopId from URL path (e.g., /shop1/cart -> 1)
  const getShopIdFromPath = () => {
    const match = location.match(/\/shop(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };
  
  const currentShopId = getShopIdFromPath();
  
  const {
    getShopCartItems,
    updateShopCartItem,
    removeFromShopCart,
    clearShopCart,
    canPerformShopCartOperations
  } = useShopCartOperations();
  const { accessToken } = useAuth();

  // Local state for cart items
  const [cartItems, setCartItems] = useState<ShopCartItemType[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Promotion State ---
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    id: number;
    code: string;
  } | null>(null);
  const [itemDiscounts, setItemDiscounts] = useState<{
    [productId: number]: number;
  }>({});

  const [clearCartModalOpen, setClearCartModalOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Load cart items
  const loadCartItems = async () => {
    setLoading(true);
    try {
      const items = await getShopCartItems(currentShopId);
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart items:', error);
      toast.error('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCartItems();
  }, [currentShopId]);

  // Calculate totals
  const totalPrice = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  const handleCheckout = () => {
    if (!accessToken) {
      toast.error("Please sign in to proceed with checkout");
      navigate("/sign-in", { state: { returnUrl: `/shop${currentShopId}/cart` } });
      return;
    }
    // Navigate to shop-specific order page
    navigate(`/shop${currentShopId}/order`, { state: { discount, appliedPromo, itemDiscounts } });
  };

  const handleApplyPromo = async (promoCode: string) => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promotion code.");
      return;
    }
    setPromoLoading(true);
    setDiscount(0);
    setAppliedPromo(null);

    try {
      const cartItemsPayload = cartItems.map((item: ShopCartItemType) => ({
        product_id: item.shop_product_id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      // Note: This may need to be updated to use shop-specific promo codes
      const response = await fetch(`${API_BASE_URL}/api/promo-code/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          promo_code: promoCode,
          cart_items: cartItemsPayload,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to apply promo code.");
      }

      toast.success(result.message);
      setDiscount(result.discount_amount);

      setAppliedPromo({
        id: result.promotion_id,
        code: promoCodeInput.toUpperCase(),
      });
      setItemDiscounts(result.item_discounts || {});

    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setDiscount(0);
    setPromoCodeInput("");
    setAppliedPromo(null);
    setItemDiscounts({});
    toast.success("Promotion removed.");
  };

  const handleContinueShopping = () => {
    navigate(`/shop${currentShopId}-allproductpage`);
  };

  const handleClearCart = async () => {
    setClearCartModalOpen(true);
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      await removeFromShopCart(currentShopId, cartItemId);
      await loadCartItems(); // Refresh cart items
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleUpdateQuantity = async (cartItemId: number, quantity: number) => {
    try {
      await updateShopCartItem(currentShopId, cartItemId, quantity);
      await loadCartItems(); // Refresh cart items
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  if (!canPerformShopCartOperations()) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
          <p className="text-gray-600 mb-4 text-lg">Please sign in to view your cart</p>
          <button
            onClick={() => navigate("/signin", { state: { returnUrl: `/shop${currentShopId}/cart` } })}
            className="bg-primary-500 text-white px-6 py-2 rounded hover:bg-primary-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  const activeCartItems = cartItems.filter(
    (item: ShopCartItemType) => !item.product.is_deleted
  );
  const finalTotal = totalPrice - discount;

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Shop {currentShopId} Cart</h1>

      {activeCartItems.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4 text-lg">Your cart is empty</p>
          <button
            onClick={handleContinueShopping}
            className="bg-primary-500 text-white px-6 py-2 rounded hover:bg-primary-600 transition-colors w-full sm:w-auto max-w-xs"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          <div className="lg:col-span-2 mb-8 lg:mb-0">
            <div className="bg-white rounded-lg p-6">
              <div className="hidden md:flex text-sm text-gray-500 mb-2">
                <div className="w-8"></div>
                <div className="flex-1 ml-4">
                  <span className="ml-20">Product</span>
                </div>
                <div className="w-24 text-center">Price</div>
                <div className="w-32 text-center">Qty</div>
                <div className="w-24 text-right">Sub Total</div>
              </div>

              {activeCartItems.map((item: ShopCartItemType) => (
                <ShopCartItem
                  key={item.cart_item_id}
                  item={item}
                  onRemove={handleRemoveItem}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}

              <div className="flex flex-col sm:flex-row mt-6 gap-4 w-full justify-between">
                <button
                  onClick={handleContinueShopping}
                  className="bg-primary-500 text-white px-6 py-2 rounded hover:bg-primary-600 transition-colors w-full sm:w-auto"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={handleClearCart}
                  disabled={loading}
                  className="bg-primary-500 text-white px-6 py-2 rounded hover:bg-primary-600 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Clearing..." : "Clear Cart"}
                </button>
              </div>
            </div>
          </div>

          {/* Cart summary section integrated here */}
          <div className="lg:col-span-1 sticky top-4">
            <ShopCartSummary
              cartItems={activeCartItems}
              totalPrice={totalPrice}
              discount={discount}
              appliedPromo={appliedPromo}
              onApplyPromo={handleApplyPromo}
              onRemovePromo={removePromo}
              onCheckout={handleCheckout}
              onContinueShopping={handleContinueShopping}
              onClearCart={handleClearCart}
              loading={loading}
              finalTotal={finalTotal}
            />
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={clearCartModalOpen}
        title="Clear Cart"
        message="Are you sure you want to clear your entire cart? This action cannot be undone."
        onConfirm={async () => {
          try {
            await clearShopCart(currentShopId);
            await loadCartItems(); // Refresh cart items
            toast.success("Cart cleared successfully");
          } catch (error) {
            toast.error("Failed to clear cart");
          }
          setClearCartModalOpen(false);
        }}
        onCancel={() => setClearCartModalOpen(false)}
        confirmText="Clear Cart"
        cancelText="Cancel"
        icon={
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 mb-2">
            <ShoppingCart className="w-8 h-8 text-primary-500" />
          </span>
        }
      />
    </div>
  );
};

export default Shopcart;
