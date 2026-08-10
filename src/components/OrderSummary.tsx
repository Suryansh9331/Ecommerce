import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { DirectPurchaseItem } from "../types";

interface OrderSummaryProps {
  className?: string;
  selectedCountry?: {
    code: string;
    name: string;
  };
  discount?: number; // NEW: total discount amount (in base currency)
  promoCode?: string; // NEW: applied promo code string
  itemDiscounts?: { [productId: number]: number }; // NEW: per-item discount amounts
  shippingCost?: number; // NEW: shipping cost
  shippingLoading?: boolean; // NEW: shipping calculation loading state
  availableCouriers?: any[]; // NEW: available couriers from ShipRocket
  selectedCourier?: any; // NEW: selected courier
  onRefreshShipping?: () => void; // NEW: callback to refresh shipping
  directPurchaseItem?: DirectPurchaseItem | null; // NEW: direct purchase item
  onApplyPromo?: (code: string) => void; // NEW: callback to apply promo code
  onRemovePromo?: () => void; // NEW: callback to remove promo code
  promoLoading?: boolean; // NEW: promo code loading state
}

interface ExchangeRates {
  [key: string]: number;
}

// Helper function to format selected attributes for display
const formatSelectedAttributes = (
  selectedAttributes: { [key: number]: string | string[] } | undefined
) => {
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

const OrderSummary: React.FC<OrderSummaryProps> = ({
  className = "",
  selectedCountry,
  discount = 0, // default to zero
  promoCode = "",
  itemDiscounts = {},
  shippingCost = 0,
  shippingLoading = false,
  availableCouriers = [],
  selectedCourier,
  onRefreshShipping,
  directPurchaseItem = null,
  onApplyPromo,
  onRemovePromo,
  promoLoading = false,
}) => {
  const { cart } = useCart();
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState("");

  // Determine if this is direct purchase mode
  const isDirectPurchase = directPurchaseItem !== null;

  // Get items to display - either cart items or direct purchase item
  const displayItems =
    isDirectPurchase && directPurchaseItem
      ? [
        {
          cart_item_id: 0,
          product_id: directPurchaseItem.product.id,
          merchant_id: 1,
          quantity: directPurchaseItem.quantity,
          selected_attributes: directPurchaseItem.selected_attributes,
          product: {
            id: directPurchaseItem.product.id,
            name: directPurchaseItem.product.name,
            price: directPurchaseItem.product.price,
            original_price:
              directPurchaseItem.product.original_price ||
              directPurchaseItem.product.price,
            special_price: directPurchaseItem.product.special_price,
            image_url: directPurchaseItem.product.image_url,
            stock: directPurchaseItem.product.stock,
            is_deleted: false,
            sku: directPurchaseItem.product.sku,
          },
        },
      ]
      : cart.filter((item) => !item.product.is_deleted);

  // Calculate totals based on display items
  const itemsTotal = displayItems.reduce((total, item) => {
    const price = item.product.price || item.product.original_price;
    return total + price * item.quantity;
  }, 0);

  const displayTotalItems = displayItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
        const response = await fetch(`${baseUrl}/api/exchange-rates`);

        if (!response.ok) {
          throw new Error("Failed to fetch exchange rates");
        }

        const data = await response.json();
        setExchangeRates(data.conversion_rates);
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
        setError("Failed to load currency conversion rates");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchangeRates();
  }, []);

  // Format price based on country with currency conversion
  const formatPrice = (price: number) => {
    if (isLoading) {
      return "Loading...";
    }

    if (error) {
      return "Error loading rates";
    }

    const currencyMap: { [key: string]: string } = {
      US: "USD",
      GB: "GBP",
      IN: "INR",
      EU: "EUR",
      CA: "CAD",
      AU: "AUD",
      JP: "JPY",
      CN: "CNY",
      SG: "SGD",
      AE: "AED",
      SA: "SAR",
      NZ: "NZD",
      SE: "SEK",
      DE: "EUR",
      FR: "EUR",
      IT: "EUR",
      ES: "EUR",
      RU: "RUB",
      BR: "BRL",
      ZA: "ZAR",
      MX: "MXN",
    };

    const requestedCurrency = currencyMap[selectedCountry?.code || "IN"] || "INR";

    // Prices arrive in INR, so a rate of 1 is only ever correct for INR itself.
    // This used to read `exchangeRates[currency] || 1`, which meant a missing rate
    // printed the untouched rupee figure under a foreign symbol — a 1299 item shown
    // as "$1299.00" instead of about $15. Fall back to showing the real INR amount
    // rather than a confidently wrong foreign one.
    const rawRate: number | undefined =
      requestedCurrency === "INR" ? 1 : exchangeRates[requestedCurrency];
    const hasUsableRate =
      typeof rawRate === "number" && Number.isFinite(rawRate) && rawRate > 0;

    if (!hasUsableRate) {
      console.warn(
        `No usable exchange rate for ${requestedCurrency}; showing INR instead.`
      );
    }

    const currency = hasUsableRate ? requestedCurrency : "INR";
    const rate = hasUsableRate ? (rawRate as number) : 1;
    const convertedPrice = price * rate;

    const currencySymbols: { [key: string]: string } = {
      USD: "$",
      GBP: "£",
      INR: "₹",
      EUR: "€",
      CAD: "C$",
      AUD: "A$",
      JPY: "¥",
      CNY: "¥",
      SGD: "S$",
      AED: "د.إ",
      SAR: "﷼",
      NZD: "NZ$",
      SEK: "kr",
      RUB: "₽",
      BRL: "R$",
      ZAR: "R",
      MXN: "Mex$",
    };

    const symbol = currencySymbols[currency] || currency;

    return `${symbol}${convertedPrice.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Compute final total after discount, clamped to >=0
  const discountedTotal = Math.max(itemsTotal - discount, 0);

  if (isLoading) {
    return (
      <div
        className={`w-full lg:w-[400px] bg-white rounded-lg p-8 h-fit text-left ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`w-full lg:w-[400px] bg-white rounded-lg p-8 h-fit text-left ${className}`}
      >
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div
      className={`w-full lg:w-[400px] bg-white rounded-lg p-2 pb-5 h-fit text-left ${className}`}
    >
      <h2 className="text-lg font-semibold mb-6">Your Order</h2>
      <div className="space-y-4 mb-6">
        {displayItems.map((item) => {
     
          // Calculate the item's effective price after discount
          const itemDiscount =
            itemDiscounts[item.product.id || item.product_id] || 0;
          const originalItemTotal = item.product.price * item.quantity;
          const effectiveItemTotal = originalItemTotal - itemDiscount;
          const selectedAttributes = formatSelectedAttributes(
            item.selected_attributes
          );

          return (
            <div
              key={item.cart_item_id || item.product.id}
              className="flex items-start gap-4"
            >
              <img
                src={
                  item.product.primary_image ||
                  item.product.image_url ||
                  "/placeholder-image.png"
                }
                alt={item.product.name}
                className="w-16 h-16 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {item.product.name}
                </div>
                <div className="text-xs text-gray-500">
                  Qty: {item.quantity}
                </div>
                {selectedAttributes && (
                  <div className="mt-1">
                    {selectedAttributes.map((attr: string, index: number) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-1 mb-1"
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                )}
                {itemDiscount > 0 && (
                  <div className="text-xs text-green-600">
                    Discount: -{formatPrice(itemDiscount)}
                  </div>
                )}
              </div>
              <div className="font-medium text-sm text-gray-900 flex-shrink-0">
                {formatPrice(effectiveItemTotal)}
                {itemDiscount > 0 && (
                  <div className="text-xs text-gray-500 line-through">
                    {formatPrice(originalItemTotal)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Promo Code Section (only for direct purchases) */}
      {directPurchaseItem && onApplyPromo && (
        <div className="border-t pt-4 mb-4">
          <h3 className="font-medium text-sm mb-3">Promo Code</h3>
          {!promoCode ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter promo code"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                disabled={promoLoading}
              />
              <button
                onClick={() => onApplyPromo(promoCodeInput)}
                disabled={promoLoading || !promoCodeInput.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {promoLoading ? "Applying..." : "Apply"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md gap-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-green-800">
                  Code: {promoCode}
                </div>
                <div className="text-xs text-green-600">
                  Discount: {formatPrice(discount)}
                </div>
              </div>
              {onRemovePromo && (
                <button
                  onClick={onRemovePromo}
                  className="text-red-500 hover:text-red-700 text-sm self-start sm:self-auto"
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal ({displayTotalItems} items)</span>
          <span>{formatPrice(itemsTotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount{promoCode ? ` (${promoCode})` : ""}</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          {shippingLoading ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Calculating...</span>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
            </div>
          ) : shippingCost > 0 ? (
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span>{formatPrice(shippingCost)}</span>
                {onRefreshShipping && (
                  <button
                    onClick={onRefreshShipping}
                    className="text-orange-500 hover:text-orange-600 text-xs"
                    title="Refresh shipping cost"
                  >
                    ↻
                  </button>
                )}
              </div>
              {selectedCourier && (
                <div className="text-xs text-gray-500">
                  {selectedCourier.courier_name}
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-500">Free</span>
          )}
        </div>

        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>Included</span>
        </div>

        <div className="flex justify-between font-semibold pt-2 border-t">
          <span>Total</span>
          <span>{formatPrice(discountedTotal + shippingCost)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
