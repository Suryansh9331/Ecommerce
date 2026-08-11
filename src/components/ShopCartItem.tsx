import React, { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ShopCartItem as ShopCartItemType } from '../services/shopCartService';

// Currency formatter for INR
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

interface ShopCartItemProps {
  item: ShopCartItemType;
  onRemove: (cartItemId: number) => void;
  onUpdateQuantity: (cartItemId: number, quantity: number) => void;
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

const ShopCartItem: React.FC<ShopCartItemProps> = ({
  item,
  onRemove,
  onUpdateQuantity
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { user } = useAuth();
  const isMerchant = user?.role === 'merchant';

  const handleIncrement = async () => {
    if (isMerchant) {
      toast.error('Merchants cannot modify cart items');
      return;
    }

    if (item.quantity >= item.product.stock) {
      toast.error('Maximum stock limit reached');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.cart_item_id, item.quantity + 1);
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrement = async () => {
    if (isMerchant) {
      toast.error('Merchants cannot modify cart items');
      return;
    }

    if (item.quantity <= 1) {
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.cart_item_id, item.quantity - 1);
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isMerchant) {
      toast.error('Merchants cannot remove cart items');
      return;
    }

    setIsRemoving(true);
    try {
      await onRemove(item.cart_item_id);
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setIsRemoving(false);
    }
  };

  // Calculate total price for this item
  const totalPrice = item.product.price * item.quantity;

  // If user is a merchant, render a disabled version of the cart item
  if (isMerchant) {
    return (
      <div className="flex items-center py-4 border-b border-gray-200 opacity-50">
        <div className="p-1 text-gray-400">
          <X size={18} />
        </div>

        <div className="flex items-center ml-4 flex-1">
          <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
            {item.product.image_url ? (
              <img
                src={item.product.image_url}
                alt={item.product.name}
                className="object-cover h-full w-full"
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
            ) : (
              <div className="text-gray-400 text-xs text-center p-2">No image</div>
            )}
          </div>
          <div className="ml-4 w-48">
            <p className="text-sm text-gray-600 line-clamp-2">{item.product.name}</p>
          </div>
        </div>

        <div className="text-gray-700 w-24 text-center">{formatCurrency(item.product.price)}</div>

        <div className="w-32 flex justify-center">
          <div className="flex items-center border border-gray-300 rounded opacity-50">
            <button disabled className="px-2 py-1 text-gray-600">
              <Minus size={16} />
            </button>
            <input
              type="text"
              value={item.quantity}
              readOnly
              className="w-10 text-center focus:outline-none text-sm"
            />
            <button disabled className="px-2 py-1 text-gray-600">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="text-gray-700 w-24 text-right font-medium">
          {formatCurrency(totalPrice)}
        </div>
      </div>
    );
  }

  return (
    // Responsive Shop Cart Item Component
    <div className="flex flex-col md:flex-row md:items-center py-4 border-b border-gray-200 gap-4 md:gap-0">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Top row - Image, Name, and Remove button */}
        <div className="flex items-start gap-3 mb-3">
          <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
            {item.product.image_url ? (
              <img
                src={item.product.image_url}
                alt={item.product.name}
                className="object-cover h-full w-full"
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
            ) : (
              <div className="text-gray-400 text-xs text-center p-2">No image</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 font-medium line-clamp-2 mb-1">{item.product.name}</p>
            <p className="text-sm text-gray-600">{formatCurrency(item.product.price)}</p>
            {formatSelectedAttributes(item.selected_attributes) && (
              <div className="mt-1 flex flex-wrap gap-1">
                {formatSelectedAttributes(item.selected_attributes)?.map((attr, index) => (
                  <span 
                    key={index}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    {attr}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className={`p-1 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 ${isRemoving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Bottom row - Quantity controls and total */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-3">Qty:</span>
            <div className={`flex items-center border border-gray-300 rounded ${isUpdating ? 'opacity-50' : ''
              }`}>
              <button
                onClick={handleDecrement}
                disabled={item.quantity <= 1 || isUpdating}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus size={14} />
              </button>
              <input
                type="text"
                value={item.quantity}
                readOnly
                className="w-12 text-center focus:outline-none text-sm"
              />
              <button
                onClick={handleIncrement}
                disabled={item.quantity >= item.product.stock || isUpdating}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-gray-800 font-semibold">{formatCurrency(totalPrice)}</div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Hidden on mobile */}
      <div className="hidden md:flex md:items-center md:w-full">
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className={`p-1 text-gray-400 hover:text-gray-700 transition-colors ${isRemoving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          <X size={18} />
        </button>

        <div className="flex items-center ml-4 flex-1">
          <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
            {item.product.image_url ? (
              <img
                src={item.product.image_url}
                alt={item.product.name}
                className="object-cover h-full w-full"
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
            ) : (
              <div className="text-gray-400 text-xs text-center p-2">No image</div>
            )}
          </div>
          <div className="ml-4 w-48">
            <p className="text-sm text-gray-600 line-clamp-2">{item.product.name}</p>
            {formatSelectedAttributes(item.selected_attributes) && (
              <div className="mt-1 flex flex-wrap gap-1">
                {formatSelectedAttributes(item.selected_attributes)?.map((attr, index) => (
                  <span 
                    key={index}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    {attr}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-gray-700 w-24 text-center">{formatCurrency(item.product.price)}</div>

        <div className="w-32 flex justify-center">
          <div className={`flex items-center border border-gray-300 rounded ${isUpdating ? 'opacity-50' : ''
            }`}>
            <button
              onClick={handleDecrement}
              disabled={item.quantity <= 1 || isUpdating}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus size={16} />
            </button>
            <input
              type="text"
              value={item.quantity}
              readOnly
              className="w-14 text-center focus:outline-none text-sm"
            />
            <button
              onClick={handleIncrement}
              disabled={item.quantity >= item.product.stock || isUpdating}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="text-gray-700 w-24 text-right font-medium">
          {formatCurrency(totalPrice)}
        </div>
      </div>
    </div>
  );
};

export default ShopCartItem;
