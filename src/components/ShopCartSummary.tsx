import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ShopCartItem } from '../services/shopCartService';

// Currency formatter for INR
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

interface ShopCartSummaryProps {
  cartItems?: ShopCartItem[];
  totalPrice: number;
  discount?: number;
  appliedPromo?: { id: number; code: string } | null;
  onApplyPromo: (code: string) => Promise<void>;
  onRemovePromo?: () => void;
  onCheckout: () => void;
  onContinueShopping?: () => void;
  onClearCart?: () => void;
  loading?: boolean;
  finalTotal?: number;
}

// Helper function to format selected attributes for display
const formatSelectedAttributes = (selectedAttributes: {[key: number]: string | string[]} | undefined) => {
  if (!selectedAttributes || Object.keys(selectedAttributes).length === 0) {
    return null;
  }

  const formattedAttributes: string[] = [];
  
  Object.entries(selectedAttributes).forEach(([, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        formattedAttributes.push(...value);
      }
    } else if (value) {
      formattedAttributes.push(value);
    }
  });

  return formattedAttributes.length > 0 ? formattedAttributes : null;
};

const ShopCartSummary: React.FC<ShopCartSummaryProps> = ({
  cartItems,
  totalPrice,
  discount,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
  onCheckout,
  onContinueShopping,
  onClearCart,
  loading = false,
  finalTotal
}) => {
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setIsApplyingPromo(true);
    try {
      await onApplyPromo(promoCode);
      setPromoCode('');
      setIsPromoOpen(false);
    } catch (error) {
      toast.error('Failed to apply promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <h2 className="text-xl font-medium mb-6">Shop Cart</h2>
      
      {/* Cart Items Summary */}
      {cartItems && cartItems.length > 0 && (
        <div className="mb-6 max-h-64 overflow-y-auto">
          {cartItems.map((item) => {
            const selectedAttributes = formatSelectedAttributes(item.selected_attributes);
            
            return (
              <div key={item.cart_item_id} className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-shrink-0">
                  <img 
                    src={item.product.image_url} 
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-md"
                    onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                // Guard against a loop: if the placeholder itself fails to load,
                // onError fires again and reassigns the same missing src forever.
                // That produced thousands of requests and a page that never
                // finished loading. One swap per element, then give up.
                if (img.dataset.fallbackApplied === "1") return;
                img.dataset.fallbackApplied = "1";
                img.src = "/placeholder-image.png";
              }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Qty: {item.quantity} × {formatCurrency(item.product.price)}
                  </p>
                  {selectedAttributes && (
                    <div className="mt-1">
                      {selectedAttributes.map((attr, index) => (
                        <span 
                          key={index}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-1 mb-1"
                        >
                          {attr}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-sm font-medium text-gray-900">
                  {formatCurrency(item.product.price * item.quantity)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="flex justify-between mb-4">
        <p className="text-gray-600">Sub Total</p>
        <p className="font-medium">{formatCurrency(totalPrice)}</p>
      </div>

      {/* Shipping */}
      <div className="flex justify-between mb-4">
        <p className="text-gray-600">Shipping</p>
        <p className="text-gray-600">Free</p>
      </div>

      {typeof discount === 'number' && discount > 0 && appliedPromo && (
        <div className="flex justify-between mb-4 text-green-600">
          <p>Discount ({appliedPromo.code})</p>
          <p>-{formatCurrency(discount)}</p>
        </div>
      )}

      <div className="border-b border-gray-200 pb-3 mb-4">
        <div 
          className="flex items-center justify-between cursor-pointer py-2"
          onClick={() => setIsPromoOpen(!isPromoOpen)}
        >
          <p className="text-gray-600">Apply Promo Code</p>
          <div>
            {isPromoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        
        {isPromoOpen && !appliedPromo && (
          <div className="mt-2 space-y-3">
            <input 
              type="text" 
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code" 
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500" 
              disabled={isApplyingPromo}
            />
            <button 
              onClick={handleApplyPromo}
              disabled={isApplyingPromo || loading}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplyingPromo ? 'Applying...' : 'Apply'}
            </button>
          </div>
        )}

        {appliedPromo && (
          <div className="mt-2 flex justify-between items-center bg-green-50 p-2 rounded-md">
            <p className="text-green-700 text-sm">Promo applied: <span className="font-bold">{appliedPromo.code}</span></p>
            {onRemovePromo && (
              <button onClick={onRemovePromo} className="text-red-500 hover:text-red-700">
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-between mb-6">
        <p className="font-medium">Total</p>
        <p className="font-bold">{formatCurrency(finalTotal || totalPrice)}</p>
      </div>
      
      <button 
        onClick={onCheckout}
        disabled={loading || (finalTotal || totalPrice) === 0}
        className="w-full bg-primary-500 text-white py-3 rounded font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Proceed to Checkout'}
      </button>

      {/* Additional Action Buttons */}
      <div className="mt-4 space-y-2">
        {onContinueShopping && (
          <button 
            onClick={onContinueShopping}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded font-medium hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </button>
        )}
        
        {onClearCart && (
          <button 
            onClick={onClearCart}
            disabled={loading}
            className="w-full bg-red-100 text-red-700 py-2 rounded font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Clearing...' : 'Clear Cart'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ShopCartSummary;
