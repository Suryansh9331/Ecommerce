import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';

import OrderSummary from "../components/OrderSummary";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import {
  MapPin,
  Edit2,
  Trash2,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import { DirectPurchaseItem } from "../types";
import ConfirmationModal from "../components/common/ConfirmationModal";
import { addressService, type Address as AddressModel } from "../services/address";
import RazorpayPayment from "../components/RazorpayPayment";
import { createCheckoutQuote } from "../utils/checkoutQuote";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Checkout currency is no longer decided here at all — the server reads it off the
// quote. This page once derived it from the selected country in the PHONE DIALLING
// CODE dropdown below, while the amount stayed an unconverted INR number, so choosing
// "+1" created a Razorpay order for the rupee figure denominated in USD: roughly an
// 85x overcharge. Presentment currency will come from the currency layer, never from
// a phone code and never from this file.

// Country phone codes
const COUNTRY_CODES = [
  { code: "US", name: "United States", phoneCode: "+1" },
  { code: "GB", name: "United Kingdom", phoneCode: "+44" },
  { code: "CA", name: "Canada", phoneCode: "+1" },
  { code: "AU", name: "Australia", phoneCode: "+61" },
  { code: "DE", name: "Germany", phoneCode: "+49" },
  { code: "FR", name: "France", phoneCode: "+33" },
  { code: "IT", name: "Italy", phoneCode: "+39" },
  { code: "ES", name: "Spain", phoneCode: "+34" },
  { code: "JP", name: "Japan", phoneCode: "+81" },
  { code: "CN", name: "China", phoneCode: "+86" },
  { code: "RU", name: "Russia", phoneCode: "+7" },
  { code: "BR", name: "Brazil", phoneCode: "+55" },
  { code: "ZA", name: "South Africa", phoneCode: "+27" },
  { code: "MX", name: "Mexico", phoneCode: "+52" },
  { code: "SG", name: "Singapore", phoneCode: "+65" },
  { code: "AE", name: "UAE", phoneCode: "+971" },
  { code: "SA", name: "Saudi Arabia", phoneCode: "+966" },
  { code: "NZ", name: "New Zealand", phoneCode: "+64" },
  { code: "SE", name: "Sweden", phoneCode: "+46" },
  { code: "IN", name: "India", phoneCode: "+91" },
];

type Address = AddressModel;

// Payment card UI removed
// interface PaymentCard {
//   card_id: number;
//   user_id: number;
//   card_type: "credit" | "debit";
//   last_four_digits: string;
//   card_holder_name: string;
//   card_brand: string;
//   status: "active" | "expired" | "suspended" | "deleted";
//   is_default: boolean;
//   billing_address: Address | null;
//   last_used_at: string | null;
//   created_at: string;
//   updated_at: string;
// }

//

const PaymentPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, accessToken } = useAuth();
  const { cart, totalPrice, clearCart } = useCart();
  const [addresses, setAddresses] = useState<AddressModel[]>([]);
  const [loading, setLoading] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string>("");
  // The server-issued quote this checkout is paying against. When set, the order
  // is created by verify-payment on the server, not by this page.
  const [checkoutQuoteId, setCheckoutQuoteId] = useState<string>("");
  const [showCountryCodes, setShowCountryCodes] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES.find(c => c.code === "IN") || COUNTRY_CODES[0]);
  const [postalCodeError, setPostalCodeError] = useState<string>("");
  const [formData, setFormData] = useState({
    contact_name: "",
    contact_phone: "",
    address_line1: "",
    address_line2: "",
    landmark: "",
    city: "",
    state_province: "",
    postal_code: "",
    country_code: "IN",
    address_type: "shipping" as "shipping" | "billing",
    is_default_shipping: true,
    is_default_billing: false,
  });


  // deprecated: card details handled via saved cards
  const [processingPayment, setProcessingPayment] = useState(false);
  // const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  // const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  // const [showCardForm, setShowCardForm] = useState(false);
  // const [savingCard, setSavingCard] = useState(false);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [availableCouriers, setAvailableCouriers] = useState<any[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [shippingRequestId, setShippingRequestId] = useState<string>(""); // To prevent duplicate requests
  // const [cardFormData, setCardFormData] = useState({
  //   card_number: "",
  //   cvv: "",
  //   expiry_month: "",
  //   expiry_year: "",
  //   card_holder_name: "",
  //   card_type: "credit" as "credit" | "debit",
  //   billing_address_id: null as number | null,
  //   is_default: false,
  // });
  // Add state for delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [noCourierService, setNoCourierService] = useState(false);

  // --- Read state passed from Cart.tsx or direct purchase ---
  const stateData = location.state || {};
  const [discount, setDiscount] = useState(stateData.discount || 0);
  const [appliedPromo, setAppliedPromo] = useState(
    stateData.appliedPromo || null
  );
  const [itemDiscounts, setItemDiscounts] = useState(
    stateData.itemDiscounts || {}
  );
  const directPurchase = stateData.directPurchase || null;

  // Determine if this is a direct purchase or cart checkout
  const isDirectPurchase = directPurchase !== null;
  const directPurchaseItem = directPurchase as DirectPurchaseItem | null;

  // Promo code state for direct purchases
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const validatePostalCode = (
    postalCode: string,
    countryCode: string
  ): boolean => {
    // Basic validation patterns for common countries
    const patterns: { [key: string]: RegExp } = {
      IN: /^\d{6}$/, // India: 6 digits
      US: /^\d{5}(-\d{4})?$/, // US: 5 digits or 5+4 digits
      GB: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/, // UK: Various formats
      CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/, // Canada: A1A 1A1
      AU: /^\d{4}$/, // Australia: 4 digits
    };

    const pattern = patterns[countryCode];
    if (!pattern) return true; // If no pattern exists for country, accept any format

    return pattern.test(postalCode);
  };

  const handleCountrySelect = (country: (typeof COUNTRY_CODES)[0]) => {
    setSelectedCountry(country);
    setShowCountryCodes(false);
    setFormData((prev) => ({
      ...prev,
      country_code: country.code,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear postal code error when user starts typing again
    if (name === "postal_code") {
      setPostalCodeError("");
    }
  };





  const handlePostalCodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && !validatePostalCode(value, formData.country_code)) {
      setPostalCodeError(
        `Invalid postal code format for ${selectedCountry.name}`
      );
    } else {
      setPostalCodeError("");
    }
  };

  // Card input handlers removed
  // const handleCardInputChange = () => {};
 
  // Create Razorpay order
  /**
   * Create the gateway order from a server-issued quote.
   *
   * No amount is sent. The server reads the total off the quote it priced itself,
   * which is what makes the charge impossible to tamper with from here. It also
   * uses the quote id as the gateway receipt, so verify-payment can find its way
   * back to a row that already exists.
   */
  const createRazorpayOrder = async (quoteId: string): Promise<string | null> => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Please login to continue");
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/razorpay/create-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ quote_id: quoteId }),
      });

      const text = await response.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (!response.ok) {
        const message = data?.message || data?.error || text || 'Unknown error';
        throw new Error(`Failed to create Razorpay order: ${response.status} ${message}`);
      }
      // Accept multiple backend response shapes
      if (data && typeof data === 'object') {
        // Common success_response shape: { status: 'success', data: { id: 'order_...' } }
        if (data.status === 'success' && data.data && data.data.id) {
          return data.data.id;
        }
        // Alternate shape: { success: true, data: { id: 'order_...' } }
        if (data.success === true && data.data && data.data.id) {
          return data.data.id;
        }
        // Direct pass-through from provider: { id: 'order_...', ... }
        if (data.id) {
          return data.id;
        }
      }
      const detail = typeof data === 'object' ? JSON.stringify(data) : String(data);
      throw new Error(data?.message || `Failed to create Razorpay order: ${detail}`);
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg);
      return null;
    }
  };

  const processCardPayment = async (
    orderId: string,
    _cardId: number
  ): Promise<boolean> => {
    try {
      setProcessingPayment(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Please login to continue");
        return false;
      }

      // Here you would integrate with your payment gateway
      // For now, we'll simulate a successful payment
      const paymentSuccess = true;

      if (paymentSuccess) {
        // Update payment status
        const response = await fetch(
          `${API_BASE_URL}/api/orders/${orderId}/payment`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              payment_status: "successful",
              transaction_id: `TXN-${Date.now()}`,
              gateway_name: "Test Gateway",
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Payment failed: ${response.status} ${JSON.stringify(errorData)}`
          );
        }

        const data = await response.json();
        if (data.status === "success") {
          toast.success("Payment processed successfully");
          return true;
        } else {
          throw new Error(data.message || "Payment failed");
        }
      }
      return false;
    } catch (error) {
      console.error("Error processing payment:", error);
      // Debug: Log the full error object
      console.error("Full error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast.error(error instanceof Error ? error.message : "Payment failed");
      return false;
    } finally {
      setProcessingPayment(false);
    }
  };

  // Add function to create merchant transactions
  const createMerchantTransactions = async (
    orderId: string
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error(
          "No access token found for merchant transaction creation"
        );
        return false;
      }

      // console.log("Creating merchant transactions for order:", orderId);

      const response = await fetch(
        `${API_BASE_URL}/api/merchant-transactions/from-order`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            order_id: orderId,
          }),
        }
      );

      // console.log("Merchant transaction API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to create merchant transactions:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        // Don't throw error here as order is already created successfully
        return false;
      }

      const data = await response.json();
      // console.log("Merchant transaction API response data:", data);

      if (data.status === "success") {
        // console.log("Merchant transactions created successfully:", {
        //   orderId,
        //   transactionCount: data.transactions?.length || 0,
        //   transactions: data.transactions,
        // });
        return true;
      } else {
        console.error("Failed to create merchant transactions:", {
          orderId,
          message: data.message,
          data,
        });
        return false;
      }
    } catch (error) {
      console.error("Error creating merchant transactions:", {
        orderId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw error here as order is already created successfully
      return false;
    }
  };

  // Simplified: Do not call Shiprocket; keep shipping included (fixed 0)
  const calculateShippingCost = async () => {
    setShippingLoading(false);
    setAvailableCouriers([]);
    setSelectedCourier(null);
    setNoCourierService(false);
    setShippingCost(0);
  };

  // Add manual refresh function for shipping calculation
  const refreshShippingCost = () => {
    setShippingLoading(false);
    setAvailableCouriers([]);
    setSelectedCourier(null);
    setNoCourierService(false);
    setShippingCost(0);
  };

  // Promo code application for direct purchases
  const handleApplyPromo = async (promoCode: string) => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promotion code.");
      return;
    }

    if (!isDirectPurchase || !directPurchaseItem) {
      toast.error("Promo codes can only be applied to purchases");
      return;
    }

    setPromoLoading(true);
    setDiscount(0);
    setAppliedPromo(null);

    try {
      const cartItemsPayload = [
        {
          product_id: directPurchaseItem.product.id,
          quantity: directPurchaseItem.quantity,
          price: directPurchaseItem.product.price,
        },
      ];

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

  useEffect(() => {
    fetchAddresses();
    fetchSavedCards();
  }, []);

  // Calculate shipping when address or payment method changes
  useEffect(() => {
    const hasItems = isDirectPurchase
      ? directPurchaseItem !== null
      : cart.length > 0;
    if (selectedAddressId && hasItems) {
      calculateShippingCost();
    }
  }, [
    selectedAddressId,
    paymentMethod,
    cart,
    isDirectPurchase,
    directPurchaseItem,
  ]);

  const fetchAddresses = async () => {
    try {
      const list = await addressService.list();
      setAddresses(list);

      // If there are addresses, select the default shipping address
  const defaultAddress = list.find(
        (addr: Address) => addr.is_default_shipping
      );
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.address_id);
        setFormData({
          contact_name: defaultAddress.contact_name,
          contact_phone: defaultAddress.contact_phone,
          address_line1: defaultAddress.address_line1,
          address_line2: defaultAddress.address_line2 || "",
          landmark: defaultAddress.landmark || "",
          city: defaultAddress.city,
          state_province: defaultAddress.state_province,
          postal_code: defaultAddress.postal_code,
          country_code: defaultAddress.country_code,
          address_type: defaultAddress.address_type,
          is_default_shipping: defaultAddress.is_default_shipping,
          is_default_billing: defaultAddress.is_default_billing,
        });
      }
  } catch (error) {
      console.error("Error in fetchAddresses:", error);
      toast.error("Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddressId(address.address_id);
    setFormData({
      contact_name: address.contact_name,
      contact_phone: address.contact_phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      landmark: address.landmark || "",
      city: address.city,
      state_province: address.state_province,
      postal_code: address.postal_code,
      country_code: address.country_code,
      address_type: address.address_type,
      is_default_shipping: address.is_default_shipping,
      is_default_billing: address.is_default_billing,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let saved: AddressModel;
      if (selectedAddressId) {
        saved = await addressService.update(selectedAddressId, formData);
      } else {
        saved = await addressService.create(formData);
      }
      toast.success(
        `Address ${selectedAddressId ? "updated" : "saved"} successfully`
      );

      // Update addresses list with the new/updated address
      setAddresses((prev) => {
        const existingIndex = prev.findIndex(
          (addr) => addr.address_id === saved.address_id
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = saved as any;
          return updated;
        }
        return [...prev, saved as any];
      });

      // Set the newly saved/updated address as selected
      setSelectedAddressId(saved.address_id);

      // Only clear form if it's a new address
      if (!selectedAddressId) {
        setFormData({
          contact_name: "",
          contact_phone: "",
          address_line1: "",
          address_line2: "",
          landmark: "",
          city: "",
          state_province: "",
          postal_code: "",
          country_code: "IN",
          address_type: "shipping",
          is_default_shipping: true,
          is_default_billing: false,
        });
        setSelectedCountry(COUNTRY_CODES.find(c => c.code === "IN") || COUNTRY_CODES[0]);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error(`Failed to ${selectedAddressId ? "update" : "save"} address`);
    }
  };



  // Razorpay payment handlers
  const handleRazorpaySuccess = async (paymentId: string, razorpayOrderId: string, signature: string) => {
    try {
      setProcessingPayment(true);
      
      // Verify payment with backend
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/api/razorpay/verify-payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          razorpay_payment_id: paymentId,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: signature,
        }),
      });

      const respText = await response.text();
      let dataObj: { status?: string; message?: string } = {};
      try { dataObj = JSON.parse(respText); } catch { dataObj = {}; }

      if (!response.ok) {
        const rawMsg = (dataObj as any).message ?? respText ?? 'Payment verification failed';
        const msg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
        throw new Error(msg);
      }

      const data = dataObj as any;
      const payload = (data && (data.data ?? (typeof data.message === 'object' ? data.message : undefined))) || data;
      const isVerified = (
        (payload && payload.verified === true) ||
        (data && data.verified === true) ||
        (data && data.data && data.data.verified === true)
      );
      const isSuccess = data.status === 'success' || data.success === true || isVerified === true;
      if (isSuccess) {
        const resolvedPaymentId = payload?.payment_id || paymentId;
        toast.success("Payment successful!");

        // Quote-first path: the server already checked the captured amount against
        // the quote, consumed the quote, and created the order inside verify-payment.
        // Creating another one here would double-order and double-decrement stock.
        if (payload?.order_id && (payload?.quote_id || checkoutQuoteId)) {
          await finalizeOrder(payload.order_id);
        } else if (checkoutQuoteId) {
          // We know this payment was made against a quote, so the order is the
          // server's to create — but it did not tell us which one. Falling through
          // to the legacy branch here would risk a second order for one payment,
          // so stop and let support reconcile instead.
          console.error(
            `Paid against quote ${checkoutQuoteId} but verify-payment returned no order id`
          );
          toast.error(
            "Your payment succeeded but we could not confirm the order. " +
            "Please contact support before paying again."
          );
        } else {
          // Legacy path: no quote behind this payment, so the order still has to be
          // created from here. Delete this branch once every caller sends a quote_id.
          console.warn(
            "verify-payment returned no quote_id; falling back to client-created order"
          );
          await processOrderAfterPayment(resolvedPaymentId, razorpayOrderId);
        }
      } else {
        const rawMsg = data.message ?? 'Payment verification failed';
        const msg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
        throw new Error(msg);
      }
    } catch (error) {
      console.error("Error verifying Razorpay payment:", error);
      toast.error(error instanceof Error ? error.message : "Payment verification failed");
    } finally {
      setProcessingPayment(false);
      setShowRazorpay(false);
    }
  };

  const handleRazorpayError = (error: string) => {
    console.error("Razorpay payment error:", error);
    toast.error(`Payment failed: ${error}`);
    setShowRazorpay(false);
    setProcessingPayment(false);
  };

  const handleRazorpayClose = () => {
    console.log("Razorpay payment closed");
    setShowRazorpay(false);
    setProcessingPayment(false);
  };

  const processOrderAfterPayment = async (razorpayPaymentId?: string, razorpayOrderId?: string) => {
    // This function will be called after successful payment
    // It will contain the order creation logic
    const itemsSource =
      isDirectPurchase && directPurchaseItem
        ? [
          {
            product_id: directPurchaseItem.product.id,
            merchant_id: 1,
            quantity: directPurchaseItem.quantity,
            selected_attributes: directPurchaseItem.selected_attributes,
            product: directPurchaseItem.product,
          },
        ]
        : cart;

    const subtotal = itemsSource.reduce((total, item) => {
      const effectiveUnitPrice = item.product.price;
      return total + effectiveUnitPrice * item.quantity;
    }, 0);
    const finalTotal = subtotal - discount + shippingCost;

    const totalItemDiscounts = Object.values(itemDiscounts || {}).reduce(
      (sum: number, discount: any) =>
        sum + (typeof discount === "number" ? discount : 0),
      0
    );
    const remainingDiscount = discount - totalItemDiscounts;

    const orderData: any = {
      items: itemsSource.map((item) => {
        const basePrice = item.product.price;
        const itemTotal = basePrice * item.quantity;
        let itemDiscountAmount =
          itemDiscounts && itemDiscounts[item.product.id || item.product_id]
            ? Number(itemDiscounts[item.product.id || item.product_id])
            : 0;

        if (remainingDiscount > 0 && subtotal > 0) {
          const itemProportion = itemTotal / subtotal;
          const distributedDiscount = remainingDiscount * itemProportion;
          itemDiscountAmount += distributedDiscount;
        }

        itemDiscountAmount = Math.min(itemDiscountAmount, itemTotal);
        itemDiscountAmount = Math.round(itemDiscountAmount * 100) / 100;

        const perUnitDiscount = itemDiscountAmount / item.quantity;
        const roundedPerUnitDiscount = Math.round(perUnitDiscount * 100) / 100;
        const finalUnitPrice = basePrice - roundedPerUnitDiscount;

        return {
          product_id: item.product.id || item.product_id,
          merchant_id: item.merchant_id || 1,
          product_name_at_purchase: item.product.name,
          sku_at_purchase: item.product.sku || "",
          quantity: item.quantity,
          unit_price_inclusive_gst: finalUnitPrice.toString(),
          line_item_total_inclusive_gst: (
            finalUnitPrice * item.quantity
          ).toString(),
          final_price_for_item: (finalUnitPrice * item.quantity).toString(),
          item_discount_inclusive: roundedPerUnitDiscount.toString(),
          selected_attributes: item.selected_attributes || {},
        };
      }),
      subtotal_amount: subtotal.toString(),
      discount_amount: "0.00",
      tax_amount: "0.00",
      shipping_amount: shippingCost.toString(),
      total_amount: finalTotal.toString(),
      currency: "INR",
      payment_method: "other",
      shipping_address_id: selectedAddressId,
      billing_address_id: selectedAddressId,
      shipping_method_name: "Standard Shipping",
      customer_notes: "",
      internal_notes:
        appliedPromo && appliedPromo.code
          ? `Promo code used: ${appliedPromo.code}`
          : "",
    };

    // Attach Razorpay references for reconciliation in backend
    if (razorpayPaymentId) orderData.razorpay_payment_id = razorpayPaymentId;
    if (razorpayOrderId) orderData.razorpay_order_id = razorpayOrderId;

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to create order.");
      }

      if (responseData.status === "success") {
        await finalizeOrder(responseData.data.order_id);
      } else {
        throw new Error(responseData.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Error in processOrderAfterPayment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to place order"
      );
    }
  };

  /**
   * Everything that happens once an order exists and is paid: merchant
   * settlement rows, logistics, cart cleanup, confirmation screen.
   *
   * Shared by both paths — the quote-first flow where verify-payment created the
   * order server-side, and the legacy flow where this page created it. None of
   * these steps may fail the order: the money has already moved.
   */
  const finalizeOrder = async (orderId: string) => {
    const merchantTransactionsSuccess = await createMerchantTransactions(orderId);
    if (!merchantTransactionsSuccess) {
      console.warn("Failed to create merchant transactions, but order was successful");
    }

    try {
      const shiprocketResp = await fetch(
        `${API_BASE_URL}/api/shiprocket/create-orders-for-all-merchants`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: orderId,
            delivery_address_id: selectedAddressId,
            courier_id: selectedCourier?.courier_company_id,
          }),
        }
      );

      const srData = await shiprocketResp.json();
      if (
        shiprocketResp.ok &&
        srData.status === "success" &&
        srData.data &&
        Array.isArray(srData.data.successful_merchants) &&
        srData.data.successful_merchants.length > 0
      ) {
        const successCount = srData.data.successful_merchants.length;
        const totalCount = srData.data.total_merchants;
        if (successCount === totalCount) {
          toast.success(
            `Logistics service created successfully for all ${totalCount} merchant(s)`
          );
        } else {
          toast.success(
            `Logistics service created for ${successCount}/${totalCount} merchants. Some failed.`
          );
        }
      }
    } catch (srErr) {
      console.error("logistics service call error:", srErr);
      toast.error(
        "Order placed successfully, but logistics service creation failed. Please contact support."
      );
    }

    if (!isDirectPurchase) {
      await clearCart();
    }
    toast.success("Order placed successfully");
    navigate("/order-confirmation", { state: { orderId }, replace: true });
  };

  const handleOrder = async () => {
    if (!accessToken) {
      toast.error("Please login to continue");
      return;
    }
    if (!selectedAddressId) {
      toast.error("Please select a shipping address");
      return;
    }
    // Card methods removed; no need to require a selected card

    // Handle Razorpay payment
    if (paymentMethod === "razorpay") {
      setProcessingPayment(true);

      // Which products, how many — intent only. The prices on these objects are
      // for display; the server re-reads every one of them from the database.
      const itemsSource =
        isDirectPurchase && directPurchaseItem
          ? [
            {
              product_id: directPurchaseItem.product.id,
              merchant_id: 1,
              quantity: directPurchaseItem.quantity,
              selected_attributes: directPurchaseItem.selected_attributes,
              product: directPurchaseItem.product,
            },
          ]
          : cart;

      try {
        const quote = await createCheckoutQuote(
          {
            items: itemsSource.map((item: any) => ({
              product_id: item.product?.id ?? item.product_id,
              quantity: item.quantity,
              selected_attributes: item.selected_attributes || {},
            })),
            // The code, not the discount. The server resolves what it is worth.
            promo_code: appliedPromo?.code,
            shipping_address_id: selectedAddressId,
            billing_address_id: selectedAddressId,
            shipping_method_name: "Standard Shipping",
          },
          accessToken
        );

        // If the server priced the basket differently from what the customer is
        // looking at, stop. Charging the quote silently would take a different
        // amount than the screen shows.
        const displayedSubtotal = itemsSource.reduce(
          (sum: number, item: any) => sum + item.product.price * item.quantity,
          0
        );
        const shown = (displayedSubtotal - discount + shippingCost).toFixed(2);
        if (quote.total_amount !== shown) {
          console.warn(
            `Quote total ${quote.total_amount} differs from displayed ${shown}; ` +
            `prices may have changed.`
          );
          toast.error(
            "Prices in your basket have changed. Please review the total and try again."
          );
          setProcessingPayment(false);
          return;
        }

        setCheckoutQuoteId(quote.quote_id);
        const gatewayOrderId = await createRazorpayOrder(quote.quote_id);
        if (gatewayOrderId) {
          setRazorpayOrderId(gatewayOrderId);
          setShowRazorpay(true);
        } else {
          setProcessingPayment(false);
        }
      } catch (err) {
        console.error("Checkout quote failed:", err);
        toast.error(
          err instanceof Error ? err.message : "Could not price your basket."
        );
        setProcessingPayment(false);
      }
      return;
    }

    setProcessingPayment(true);

    // Determine items source: cart or direct purchase
    const itemsSource =
      isDirectPurchase && directPurchaseItem
        ? [
          {
            product_id: directPurchaseItem.product.id,
            merchant_id: 1, // Default merchant ID for direct purchase
            quantity: directPurchaseItem.quantity,
            selected_attributes: directPurchaseItem.selected_attributes,
            product: directPurchaseItem.product,
          },
        ]
        : cart;

    // Calculate subtotal using original prices
    const subtotal = itemsSource.reduce((total, item) => {
      const effectiveUnitPrice = item.product.price;
      return total + effectiveUnitPrice * item.quantity;
    }, 0);
    const finalTotal = subtotal - discount + shippingCost;

    // Calculate distributed discount per item if there's a total discount but no itemDiscounts
    const totalItemDiscounts = Object.values(itemDiscounts || {}).reduce(
      (sum: number, discount: any) =>
        sum + (typeof discount === "number" ? discount : 0),
      0
    );
    const remainingDiscount = discount - totalItemDiscounts;

    const orderData = {
      items: itemsSource.map((item) => {
        // Use the effective discounted price provided by backend (price)
        const basePrice = item.product.price;
        const itemTotal = basePrice * item.quantity;
        let itemDiscountAmount =
          itemDiscounts && itemDiscounts[item.product.id || item.product_id]
            ? Number(itemDiscounts[item.product.id || item.product_id])
            : 0;

        // If there's remaining discount to distribute (sitewide discount not in itemDiscounts)
        if (remainingDiscount > 0 && subtotal > 0) {
          const itemProportion = itemTotal / subtotal;
          const distributedDiscount = remainingDiscount * itemProportion;
          itemDiscountAmount += distributedDiscount;
        }

        // Ensure discount doesn't exceed item total
        itemDiscountAmount = Math.min(itemDiscountAmount, itemTotal);

        // Round to 2 decimal places
        itemDiscountAmount = Math.round(itemDiscountAmount * 100) / 100;

        // Calculate per-unit discount for this item
        const perUnitDiscount = itemDiscountAmount / item.quantity;
        const roundedPerUnitDiscount = Math.round(perUnitDiscount * 100) / 100;

        // Calculate final unit price after discount
        const finalUnitPrice = basePrice - roundedPerUnitDiscount;

        return {
          product_id: item.product.id || item.product_id,
          merchant_id: item.merchant_id || 1,
          product_name_at_purchase: item.product.name,
          sku_at_purchase: item.product.sku || "",
          quantity: item.quantity,
          unit_price_inclusive_gst: finalUnitPrice.toString(),
          line_item_total_inclusive_gst: (
            finalUnitPrice * item.quantity
          ).toString(),
          final_price_for_item: (finalUnitPrice * item.quantity).toString(),
          item_discount_inclusive: roundedPerUnitDiscount.toString(),
          selected_attributes: item.selected_attributes || {},
        };
      }),
      subtotal_amount: subtotal.toString(),
      discount_amount: "0.00", // Set to 0 since discounts are now item-specific
      tax_amount: "0.00",
      shipping_amount: shippingCost.toString(),
      total_amount: finalTotal.toString(),
      currency: "INR",
      payment_method: paymentMethod,
      shipping_address_id: selectedAddressId,
      billing_address_id: selectedAddressId,
      shipping_method_name: "Standard Shipping",
      customer_notes: "",
      internal_notes:
        appliedPromo && appliedPromo.code
          ? `Promo code used: ${appliedPromo.code}`
          : "",
      // Card methods removed: do not send payment_card_id
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to create order.");
      }

      if (responseData.status === "success") {
        const orderId = responseData.data.order_id;

        // Card payment methods removed; no additional processing needed

        // Create merchant transactions for all merchants involved in the order
        const merchantTransactionsSuccess = await createMerchantTransactions(
          orderId
        );
        if (!merchantTransactionsSuccess) {
          console.warn(
            "Failed to create merchant transactions, but order was successful"
          );
        }

        // ------------- ShipRocket shipment creation -------------
        try {
          const shiprocketResp = await fetch(
            `${API_BASE_URL}/api/shiprocket/create-orders-for-all-merchants`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                order_id: orderId,
                delivery_address_id: selectedAddressId,
                courier_id: selectedCourier?.courier_company_id, // Include selected courier
              }),
            }
          );

          const srData = await shiprocketResp.json();

          // Only show error if ShipRocket API truly failed (no successful merchants)
          if (
            shiprocketResp.ok &&
            srData.status === "success" &&
            srData.data &&
            Array.isArray(srData.data.successful_merchants) &&
            srData.data.successful_merchants.length > 0
          ) {
            const response = srData.data;

            // Show success message to user
            if (response.successful_merchants.length > 0) {
              const successCount = response.successful_merchants.length;
              const totalCount = response.total_merchants;

              if (successCount === totalCount) {
                toast.success(
                  `Shipments created successfully for all ${totalCount} merchant(s)`
                );
              } else {
                toast.success(
                  `Shipments created for ${successCount}/${totalCount} merchants. Some failed.`
                );
              }
            }

            // Log failed merchants for debugging
            if (response.failed_merchants.length > 0) {
              console.warn(
                "Failed to create shipments for merchants:",
                response.failed_merchants
              );
              response.failed_merchants.forEach((merchantId: number) => {
                const error = response.merchant_responses[merchantId]?.error;
                console.error(
                  `Merchant ${merchantId} shipment creation failed:`,
                  error
                );
              });
            }
          } else {
            // Only show error if there are no successful merchants
            // toast.error(
            //   "Order placed successfully, but shipment creation failed for all merchants. Please contact support."
            // );
          }
        } catch (srErr) {
          console.error("ShipRocket call error:", {
            error: srErr instanceof Error ? srErr.message : String(srErr),
            stack: srErr instanceof Error ? srErr.stack : undefined,
          });

          // Don't fail the order if ShipRocket fails, but log the issue
          toast.error(
            "Order placed successfully, but shipment creation failed. Please contact support."
          );
        }

        // Clear the cart after successful order (only for cart checkout, not direct purchase)
        if (!isDirectPurchase) {
          await clearCart();
        }
        toast.success("Order placed successfully");
        // Redirect to order confirmation page
        navigate("/order-confirmation", { state: { orderId }, replace: true });
      } else {
        throw new Error(responseData.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Error in handleOrder:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to place order"
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      await addressService.remove(addressId);

      // Remove the deleted address from the list
      setAddresses((prev) =>
        prev.filter((addr) => addr.address_id !== addressId)
      );
      toast.success("Address deleted successfully");

      // If the deleted address was selected, clear the form
      if (selectedAddressId === addressId) {
        setSelectedAddressId(null);
        setFormData({
          contact_name: "",
          contact_phone: "",
          address_line1: "",
          address_line2: "",
          landmark: "",
          city: "",
          state_province: "",
          postal_code: "",
          country_code: "IN",
          address_type: "shipping",
          is_default_shipping: true,
          is_default_billing: false,
        });
      }
    } catch (error) {
      console.error("Error in handleDeleteAddress:", error);
      toast.error("Failed to delete address");
    }
  };

  const handleEditAddress = async (addressId: number) => {
    try {
      const address = await addressService.get(addressId);

      // Update form with address data
      setFormData({
        contact_name: address.contact_name,
        contact_phone: address.contact_phone,
        address_line1: address.address_line1,
        address_line2: address.address_line2 || "",
        landmark: address.landmark || "",
        city: address.city,
        state_province: address.state_province,
        postal_code: address.postal_code,
        country_code: address.country_code,
        address_type: address.address_type,
        is_default_shipping: address.is_default_shipping,
        is_default_billing: address.is_default_billing,
      });

      // Set the country code
      const country = COUNTRY_CODES.find(
        (c) => c.code === address.country_code
      );
      if (country) {
        setSelectedCountry(country);
      }

  setSelectedAddressId(addressId);
      toast.success("Address loaded for editing");
    } catch (error) {
      console.error("Error in handleEditAddress:", error);
      toast.error("Failed to load address for editing");
    }
  };

  // Add function to fetch saved cards
  const fetchSavedCards = async () => { /* no-op: cards removed */ };

  // Add function to save new card (removed)
  /* const handleSaveCard = async () => {
    try {
      // cards removed
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Please login to continue");
        return;
      }

      if (!selectedAddressId) {
        toast.error("Please select a billing address");
        return;
      }

      // Format the expiry year to be a full 4-digit year
  // const currentYear = new Date().getFullYear();
      // const shortYear = 0;
      // const fullYear = shortYear;

      // Format the card data according to the API requirements
      const cardData = {} as any;

      // Debug: Log the request data (masked for security)
      // console.log("Sending card data:", {
      //   ...cardData,
      //   card_number: "****" + cardData.card_number.slice(-4), // Only log last 4 digits for security
      //   cvv: "***", // Mask CVV
      // });

      const baseUrl = API_BASE_URL.replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/api/payment-cards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(cardData),
      });

      // Debug: Log the response status and headers
      // console.log("Response status:", response.status);
      // console.log(
      //   "Response headers:",
      //   Object.fromEntries(response.headers.entries())
      // );

      const responseData = await response.json();
      // Debug: Log the full response data
      // console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(
          `Failed to save card: ${response.status} ${JSON.stringify(
            responseData
          )}`
        );
      }

      if (responseData.status === "success") {
        toast.success("Card saved successfully");
      } else {
        throw new Error(responseData.message || "Failed to save card");
      }
    } catch (error) {
      console.error("Error saving card:", error);
      // Debug: Log the full error object
      console.error("Full error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast.error(
        error instanceof Error ? error.message : "Failed to save card"
      );
    } finally {
      // setSavingCard(false);
    }
  }; */

  // Add function to delete card
  /* const handleDeleteCard = async (cardId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Please login to continue");
        return;
      }

      const baseUrl = API_BASE_URL.replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/api/payment-cards/${cardId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete card");
      }

      // update local state removed
      if (selectedCardId === cardId) {
        setSelectedCardId(null);
      }
      toast.success("Card deleted successfully");
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("Failed to delete card");
    }
  }; */

  // Add function to set default card
  /* const handleSetDefaultCard = async (cardId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Please login to continue");
        return;
      }

      const baseUrl = API_BASE_URL.replace(/\/+$/, "");
      const response = await fetch(
        `${baseUrl}/api/payment-cards/${cardId}/default`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to set default card");
      }

      // update local state removed
      toast.success("Default card updated successfully");
    } catch (error) {
      console.error("Error setting default card:", error);
      toast.error("Failed to set default card");
    }
  }; */

  // Add renderSavedCards function
  /*
  const renderSavedCards = () => {
    if (savedCards.length === 0) {
      return (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Saved Cards</h3>
          <div className="text-sm text-gray-500">No saved cards found</div>
          <button
            onClick={() => setShowCardForm(true)}
            className="mt-2 flex items-center gap-2 text-orange-500 hover:text-orange-600"
          >
            <Plus className="w-4 h-4" />
            Add New Card
          </button>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Saved Cards</h3>
          <button
            onClick={() => setShowCardForm(true)}
            className="flex items-center gap-2 text-orange-500 hover:text-orange-600"
          >
            <Plus className="w-4 h-4" />
            Add New Card
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {savedCards.map((card) => (
            <div
              key={card.card_id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedCardId === card.card_id
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-orange-300"
                }`}
              onClick={() => setSelectedCardId(card.card_id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{card.card_holder_name}</p>
                    <p className="text-sm text-gray-600">
                      {card.card_brand} •••• {card.last_four_digits}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {card.card_type}
                      </span>
                      {card.is_default && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!card.is_default && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefaultCard(card.card_id);
                      }}
                      className="p-1 text-gray-500 hover:text-orange-500"
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          "Are you sure you want to delete this card?"
                        )
                      ) {
                        handleDeleteCard(card.card_id);
                      }
                    }}
                    className="p-1 text-gray-500 hover:text-red-500"
                    title="Delete card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add renderCardForm function
  const renderCardForm = () => {
    return (
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Add New Card</h3>
          <button
            onClick={() => setShowCardForm(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Card Number
            </label>
            <input
              type="text"
              name="card_number"
              value={cardFormData.card_number}
              onChange={handleCardInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Expiry Date
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="expiry_month"
                  value={cardFormData.expiry_month}
                  onChange={handleCardInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="MM"
                  maxLength={2}
                  required
                />
                <input
                  type="text"
                  name="expiry_year"
                  value={cardFormData.expiry_year}
                  onChange={handleCardInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="YY"
                  maxLength={2}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CVV</label>
              <input
                type="text"
                name="cvv"
                value={cardFormData.cvv}
                onChange={handleCardInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Card Holder Name
            </label>
            <input
              type="text"
              name="card_holder_name"
              value={cardFormData.card_holder_name}
              onChange={handleCardInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Card Type</label>
            <select
              name="card_type"
              value={cardFormData.card_type}
              onChange={handleCardInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="credit">Credit Card</option>
              <option value="debit">Debit Card</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_default"
              checked={cardFormData.is_default}
              onChange={(e) =>
                setCardFormData((prev) => ({
                  ...prev,
                  is_default: e.target.checked,
                }))
              }
              className="mr-2 accent-orange-500"
            />
            <label className="text-sm font-medium">
              Set as default payment method
            </label>
          </div>
          <button
            onClick={handleSaveCard}
            disabled={savingCard}
            className={`w-full py-2 rounded font-medium transition-colors ${savingCard
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
          >
            {savingCard ? "Saving..." : "Save Card"}
          </button>
        </div>
      </div>
    );
  };
  */

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="font-worksans max-w-7xl  mx-auto  px-4 py-8 flex flex-col lg:flex-row gap-6">
      {/* Payment Information */}
      <div className="flex-1 bg-white rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">{t('payment.title')}</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            &larr; {t('payment.continueShopping')}
          </button>
        </div>

        {/* Saved Addresses */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">{t('payment.savedAddresses')}</h3>
            <button
              onClick={() => {
                setSelectedAddressId(null);
                setFormData({
                  contact_name: "",
                  contact_phone: "",
                  address_line1: "",
                  address_line2: "",
                  landmark: "",
                  city: "",
                  state_province: "",
                  postal_code: "",
                  country_code: "IN",
                  address_type: "shipping",
                  is_default_shipping: true,
                  is_default_billing: false,
                });
                setSelectedCountry(COUNTRY_CODES.find(c => c.code === "IN") || COUNTRY_CODES[0]);
              }}
              className="flex items-center gap-2 text-orange-500 hover:text-orange-600 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Address
            </button>
          </div>
          
          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {addresses.map((address) => (
                <div
                  key={address.address_id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === address.address_id
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-orange-300"
                    }`}
                  onClick={() => handleAddressSelect(address)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{address.contact_name}</p>
                        <p className="text-sm text-gray-600">
                          {address.contact_phone}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {address.address_line1}
                          {address.address_line2 &&
                            `, ${address.address_line2}`}
                          {address.landmark && `, ${address.landmark}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state_province}{" "}
                          {address.postal_code}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {address.is_default_shipping && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {t('payment.defaultShipping')}
                            </span>
                          )}
                          {address.is_default_billing && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {t('payment.defaultBilling')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAddress(address.address_id);
                        }}
                        className="p-1 text-gray-500 hover:text-orange-500"
                        title={t('payment.editAddress')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddressToDelete(address);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1 text-gray-500 hover:text-red-500"
                        title={t('payment.deleteAddress')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 mb-3">No saved addresses found</div>
          )}
        </div>

        {/* Saved Cards (hidden since card methods are removed) */}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('payment.fullName')}
              </label>
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Type full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('payment.phoneNumber')}
              </label>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryCodes(!showCountryCodes)}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {selectedCountry.phoneCode}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showCountryCodes && (
                    <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {COUNTRY_CODES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => handleCountrySelect(country)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100"
                        >
                          {country.name} ({country.phoneCode})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Phone number"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('payment.city')}</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('payment.stateProvince')}
              </label>
              <input
                type="text"
                name="state_province"
                value={formData.state_province}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('payment.postalCode')}
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                onBlur={handlePostalCodeBlur}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 ${postalCodeError
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                  }`}
                placeholder={`${t('payment.enterPostalCode')} ${selectedCountry.name}`}
                required
              />
              {postalCodeError && (
                <p className="mt-1 text-sm text-red-500">{t('payment.invalidPostalCode')} {selectedCountry.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('payment.country')}</label>
              <select
                name="country_code"
                value={formData.country_code}
                onChange={(e) => {
                  const country = COUNTRY_CODES.find(
                    (c) => c.code === e.target.value
                  );
                  if (country) {
                    setSelectedCountry(country);
                    setFormData((prev) => ({
                      ...prev,
                      country_code: country.code,
                    }));
                  }
                }}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">{t('payment.address')}</label>
              <input
                type="text"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ex: ABC Building, 1890 NY"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                {t('payment.landmark')}
              </label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ex: Near City Park"
              />
            </div>
          </div>



          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">{t('payment.note')}</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              placeholder={t('payment.noteAboutOrder')}
              rows={3}
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded font-medium hover:bg-orange-600 transition-colors"
          >
            {t('payment.saveAddress')}
          </button>
        </form>
      </div>

      {/* Order Summary */}
      <div className="w-full lg:w-[400px] bg-white rounded-lg p-1 h-fit">
        <h2 className="text-lg font-semibold mb-6">{t('payment.yourOrder')}</h2>
        {/* Show warning if no courier service is available */}
        {noCourierService && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            Sorry, no courier service is available for the selected address. Please check your postal code or try a different address.
          </div>
        )}
        <OrderSummary
          className="sticky top-8 mr-20"
          discount={discount}
          promoCode={appliedPromo?.code}
          itemDiscounts={itemDiscounts}
          shippingCost={shippingCost}
          shippingLoading={shippingLoading}
          availableCouriers={availableCouriers}
          selectedCourier={selectedCourier}
          onRefreshShipping={refreshShippingCost}
          directPurchaseItem={directPurchaseItem}
          onApplyPromo={handleApplyPromo}
          onRemovePromo={removePromo}
          promoLoading={promoLoading}
        />
        <div className="mb-6 ">
          <div className="font-medium mb-3">{t('payment.paymentMethod')}</div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center  cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="cash_on_delivery"
                checked={paymentMethod === "cash_on_delivery"}
                onChange={() => setPaymentMethod("cash_on_delivery")}
                className="accent-orange-500 bg-transparent shadow-none align-middle"
              />
              <span className="text-black font-worksans ml-1 font-normal text-[14px]">{t('payment.cashOnDelivery')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="razorpay"
                checked={paymentMethod === "razorpay"}
                onChange={() => setPaymentMethod("razorpay")}
                className="accent-orange-500 bg-transparent shadow-none align-middle"
              />
              <span className="text-black font-worksans ml-1 font-normal text-[14px]">Pay Now</span>
            </label>
          </div>
        </div>
        <button
          onClick={handleOrder}
          disabled={!selectedAddressId || processingPayment}
          className={`w-full py-3 rounded font-medium transition-colors ${selectedAddressId && !processingPayment
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
        >
          {processingPayment
            ? t('payment.processing')
            : t('payment.placeOrder')}
        </button>
      </div>

      {/* Confirmation Modal for address deletion */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Address"
        message={`Are you sure you want to delete the address for '${addressToDelete?.contact_name || "this address"}'? This action cannot be undone.`}
        onConfirm={async () => {
          if (addressToDelete) {
            await handleDeleteAddress(addressToDelete.address_id);
          }
          setDeleteModalOpen(false);
          setAddressToDelete(null);
        }}
        onCancel={() => {
          setDeleteModalOpen(false);
          setAddressToDelete(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
        // isDestructive
      />

      {/* Razorpay Payment Component */}
      {showRazorpay && razorpayOrderId && (
        <RazorpayPayment
          amount={(() => {
            const itemsSource =
              isDirectPurchase && directPurchaseItem
                ? [
                  {
                    product_id: directPurchaseItem.product.id,
                    merchant_id: 1,
                    quantity: directPurchaseItem.quantity,
                    selected_attributes: directPurchaseItem.selected_attributes,
                    product: directPurchaseItem.product,
                  },
                ]
                : cart;

            const subtotal = itemsSource.reduce((total, item) => {
              const price = item.product.original_price || item.product.price;
              return total + price * item.quantity;
            }, 0);
            return subtotal - discount + shippingCost;
          })()}
          orderId={razorpayOrderId}
          customerName={user?.name || formData.contact_name || ""}
          customerEmail={user?.email || ""}
          customerPhone={formData.contact_phone || ""}
          onSuccess={handleRazorpaySuccess}
          onError={handleRazorpayError}
          onClose={handleRazorpayClose}
          description="Aoin Store Purchase"
          businessName="Aoin Store"
          businessLogo="https://aoinstore.com/logo.png"
        />
      )}
    </div>
  );
};

export default PaymentPage;
