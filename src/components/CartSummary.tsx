import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, ShieldCheck, RefreshCcw, BadgeCheck, Headphones } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CartItem } from '../types';

// Currency formatter for INR
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

interface CartSummaryProps {
  cartItems?: CartItem[];
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
  
  Object.entries(selectedAttributes).forEach(([attributeId, value]) => {
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

const trustItems = [
  {
    icon: <ShieldCheck size={20} className="text-primary-500" />,
    label: 'Secure Payments',
  },
  {
    icon: <RefreshCcw size={20} className="text-primary-500" />,
    label: 'Easy Returns',
  },
  {
    icon: <BadgeCheck size={20} className="text-primary-500" />,
    label: 'Genuine Products',
  },
  {
    icon: <Headphones size={20} className="text-primary-500" />,
    label: '24/7 Support',
  },
];

const CartSummary: React.FC<CartSummaryProps> = ({
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
      <h2 className="text-xl font-medium mb-6">Summary</h2>
      
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

      {/* Trust Bar */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-3">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {item.icon}
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CartSummary;