import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useShopCartOperations } from '../../context/ShopCartContext';
import { toast } from 'react-hot-toast';
import { MapPin, Edit2, Trash2, ChevronDown, CreditCard, Plus, X } from 'lucide-react';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { addressService, type Address as AddressModel } from '../../services/address';

// Local interfaces to match what the API actually returns
interface ShopCartItem {
  cart_item_id: number;
  shop_product_id: number;
  quantity: number;
  selected_attributes: { [key: number]: string | string[] };
  product: {
    name: string;
    price: number;
    original_price: number;
    special_price?: number;
    image_url: string;
    stock: number;
    is_deleted: boolean;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Country phone codes
const COUNTRY_CODES = [
  { code: "US", name: "United States", phoneCode: "+1" },
  { code: "GB", name: "United Kingdom", phoneCode: "+44" },
  { code: "CA", name: "Canada", phoneCode: "+1" },
  { code: "AU", name: "Australia", phoneCode: "+61" },
  { code: "IN", name: "India", phoneCode: "+91" },
  { code: "AE", name: "UAE", phoneCode: "+971" },
  { code: "SA", name: "Saudi Arabia", phoneCode: "+966" },
];

type Address = AddressModel;

interface PaymentCard {
  card_id: number;
  user_id: number;
  card_type: "credit" | "debit";
  last_four_digits: string;
  card_holder_name: string;
  card_brand: string;
  status: "active" | "expired" | "suspended" | "deleted";
  is_default: boolean;
  billing_address: Address | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ShopOrderProps {
  shopId: number;
  shopName: string;
}

const ShopOrder: React.FC<ShopOrderProps> = ({ shopId, shopName }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getShopCartItems, clearShopCart } = useShopCartOperations();
  
  const [cartItems, setCartItems] = useState<ShopCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Address management states
  const [addresses, setAddresses] = useState<AddressModel[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  
  // Payment method states
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  
  // Address form states
  const [showCountryCodes, setShowCountryCodes] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES.find(c => c.code === "IN") || COUNTRY_CODES[0]);
  const [addressFormData, setAddressFormData] = useState({
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
  
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }
    
    if (user?.role !== 'customer') {
      toast.error('Only customers can place orders');
      navigate('/');
      return;
    }

    loadCartItems();
    loadAddresses();
    loadPaymentCards();
  }, [isAuthenticated, user, shopId]);

  const loadCartItems = async () => {
    try {
      setIsLoading(true);
      const items = await getShopCartItems(shopId);
      setCartItems(items);
    } catch (error) {
      console.error('Failed to load cart items:', error);
      toast.error('Failed to load cart items');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAddresses = async () => {
    if (!user?.id) return;
    try {
      const list = await addressService.list();
      setAddresses(list);
      const def = list.find((addr) => addr.is_default_shipping);
      if (def) setSelectedAddressId(def.address_id);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const loadPaymentCards = async () => {
    if (!user?.id) return;
    
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const baseUrl = API_BASE_URL.replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/api/payment-cards`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          setSavedCards(data.data);
          // Auto-select default card
          const defaultCard = data.data.find((card: PaymentCard) => card.is_default);
          if (defaultCard) {
            setSelectedCardId(defaultCard.card_id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load payment cards:', error);
    }
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddressId(address.address_id);
  };

  const handleAddNewAddress = () => {
    setEditingAddressId(null);
    setAddressFormData({
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
      is_default_shipping: addresses.length === 0,
      is_default_billing: false,
    });
    setSelectedCountry(COUNTRY_CODES.find(c => c.code === "IN") || COUNTRY_CODES[0]);
    setShowAddressForm(true);
  };

  const handleEditAddress = (addressId: number) => {
    const address = addresses.find(addr => addr.address_id === addressId);
    if (address) {
      setEditingAddressId(addressId);
      setAddressFormData({
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
      const country = COUNTRY_CODES.find(c => c.code === address.country_code);
      if (country) setSelectedCountry(country);
      setShowAddressForm(true);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      await addressService.remove(addressId);
      toast.success("Address deleted successfully");
      await loadAddresses();
      if (selectedAddressId === addressId) setSelectedAddressId(null);
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  const handleAddressFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addressFormData.contact_name || !addressFormData.address_line1 || !addressFormData.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSavingAddress(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Please login to continue");
        return;
      }

      let saved: AddressModel;
      if (editingAddressId) {
        saved = await addressService.update(editingAddressId, addressFormData);
      } else {
        saved = await addressService.create(addressFormData);
      }
      toast.success(`Address ${editingAddressId ? 'updated' : 'added'} successfully`);
      await loadAddresses();
      if (!editingAddressId && saved?.address_id) setSelectedAddressId(saved.address_id);
      setShowAddressForm(false);
      setEditingAddressId(null);
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(`Failed to ${editingAddressId ? 'update' : 'add'} address`);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCountrySelect = (country: typeof COUNTRY_CODES[0]) => {
    setSelectedCountry(country);
    setShowCountryCodes(false);
    setAddressFormData(prev => ({
      ...prev,
      country_code: country.code,
    }));
  };

  const handleAddressInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setAddressFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    // Validate address selection
    if (!selectedAddressId) {
      toast.error('Please select or add a shipping address');
      return;
    }

    // Validate payment method
    if ((paymentMethod === "credit_card" || paymentMethod === "debit_card") && !selectedCardId) {
      toast.error('Please select a payment card');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setIsPlacingOrder(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Please login to continue");
        return;
      }

      const baseUrl = API_BASE_URL.replace(/\/+$/, "");

      // Calculate totals from cart (sent to backend as reference; backend will also validate)
      const subtotal = cartItems.reduce((sum: number, item: ShopCartItem) => {
        const unit = item.product.original_price || item.product.price;
        return sum + unit * item.quantity;
      }, 0);
      const discount = 0;
      const shipping = 0;
      const tax = 0;
      const total = subtotal - discount + shipping + tax;

      const orderData = {
        // Items (for transparency / potential backend use)
        items: cartItems.map((item: ShopCartItem) => {
          const unit = item.product.original_price || item.product.price;
          const line = unit * item.quantity;
          return {
            product_id: item.shop_product_id,
            product_name_at_purchase: item.product.name,
            sku_at_purchase: "",
            quantity: item.quantity,
            unit_price_inclusive_gst: unit.toFixed(2),
            line_item_total_inclusive_gst: line.toFixed(2),
            final_price_for_item: line.toFixed(2),
            selected_attributes: item.selected_attributes || {},
          };
        }),
        // Amounts
        subtotal_amount: subtotal.toFixed(2),
        discount_amount: discount.toFixed(2),
        tax_amount: tax.toFixed(2),
        shipping_amount: shipping.toFixed(2),
        total_amount: total.toFixed(2),
        currency: "INR",
        // Checkout selections
        shipping_address_id: selectedAddressId,
        billing_address_id: selectedAddressId,
        payment_method: paymentMethod,
        shipping_method_name: "Standard Shipping",
        customer_notes: "",
        internal_notes: "",
        ...(selectedCardId && (paymentMethod === "credit_card" || paymentMethod === "debit_card") && {
          payment_card_id: selectedCardId,
        }),
      };

      const response = await fetch(`${baseUrl}/api/shops/${shopId}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const responseData = await response.json();
      
      if (response.ok && responseData?.data) {
        // Clear the cart after successful order
        await clearShopCart(shopId);
        
        let shiprocketSuccess = false;
        let shiprocketData = null;
        
        // Create ShipRocket order for shipping
        try {
          shiprocketData = await createShipRocketOrder(responseData.data.order_id, selectedAddressId);
          shiprocketSuccess = true;
          console.log('ShipRocket integration completed successfully');
        } catch (shiprocketError) {
          console.error('ShipRocket order creation failed:', shiprocketError);
          // Don't fail the entire order if ShipRocket fails
          console.warn('ShipRocket order creation failed, but shop order was successful');
        }
        
        // Show appropriate success message
        if (shiprocketSuccess) {
          toast.success('Order placed successfully! ShipRocket shipping has been arranged.');
        } else {
          toast.success('Order placed successfully! Shipping will be arranged separately.');
        }
        
        navigate(`/shop${shopId}/order-confirmation`, { 
          state: { 
            orderId: responseData.data.order_id,
            total: calculateTotal(),
            shopName,
            shiprocketSuccess,
            shiprocketData
          }
        });
      } else {
        throw new Error(responseData?.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const createShipRocketOrder = async (shopOrderId: string, deliveryAddressId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token");
      }

      const baseUrl = API_BASE_URL.replace(/\/+$/, "");
      
      // Get or ensure shop pickup location is ready in ShipRocket
      let pickupLocationReady = false;
      try {
        const pickupLocationResponse = await fetch(`${baseUrl}/api/shiprocket/shop/${shopId}/pickup-location`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (pickupLocationResponse.ok) {
          const pickupData = await pickupLocationResponse.json();
          console.log('Shop pickup location ready:', pickupData.data);
          pickupLocationReady = true;
        } else {
          console.warn('Failed to get shop pickup location, but continuing with order creation');
        }
      } catch (pickupError) {
        console.warn('Pickup location setup failed, but continuing with order creation:', pickupError);
      }
      
      // Create ShipRocket order for the shop
      const shiprocketData = {
        shop_order_id: shopOrderId,
        shop_id: shopId,
        delivery_address_id: deliveryAddressId,
        // courier_id: null // Optional: let ShipRocket choose the best courier
      };

      const response = await fetch(`${baseUrl}/api/shiprocket/create-shop-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shiprocketData),
      });

      const responseData = await response.json();
      
      if (response.ok && responseData?.data) {
        console.log('ShipRocket order created successfully:', responseData.data);
        
        // Log additional details if available
        if (responseData.data.shiprocket_order_id) {
          console.log('ShipRocket Order ID:', responseData.data.shiprocket_order_id);
        }
        if (responseData.data.awb_code) {
          console.log('AWB Code:', responseData.data.awb_code);
        }
        if (responseData.data.tracking_number) {
          console.log('Tracking Number:', responseData.data.tracking_number);
        }
        if (responseData.data.courier_name) {
          console.log('Courier Name:', responseData.data.courier_name);
        }
        
        // Add pickup location status to response
        responseData.data.pickup_location_ready = pickupLocationReady;
        
        return responseData.data;
      } else {
        const errorMessage = responseData?.message || responseData?.error || 'Failed to create ShipRocket order';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('ShipRocket order creation error:', error);
      throw error;
    }
  };

  const renderAddresses = () => {
    if (addresses.length === 0) {
      return (
        <div className="mb-6">
          <div className="text-center p-8 border border-gray-200 rounded-lg">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved addresses</h3>
            <p className="text-gray-600 mb-4">Add your first address to continue with checkout</p>
            <button
              onClick={handleAddNewAddress}
              className="bg-primary-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Add Address
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Delivery Address</h3>
          <button
            onClick={handleAddNewAddress}
            className="text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add New Address
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {addresses.map((address) => (
            <div
              key={address.address_id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedAddressId === address.address_id
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-primary-300"
              }`}
              onClick={() => handleAddressSelect(address)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{address.contact_name}</p>
                    <p className="text-sm text-gray-600">
                      {address.contact_phone}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.address_line1}
                      {address.address_line2 && `, ${address.address_line2}`}
                      {address.landmark && `, ${address.landmark}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.city}, {address.state_province} {address.postal_code}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {address.is_default_shipping && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Default Shipping
                        </span>
                      )}
                      {address.is_default_billing && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Default Billing
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
                    className="p-1 text-gray-500 hover:text-primary-500"
                    title="Edit address"
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
                    title="Delete address"
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

  const renderAddressForm = () => {
    return (
      <div className="mb-6 border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {editingAddressId ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button
            onClick={() => setShowAddressForm(false)}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleAddressFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="contact_name"
                value={addressFormData.contact_name}
                onChange={handleAddressInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number *
              </label>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryCodes(!showCountryCodes)}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
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
                  value={addressFormData.contact_phone}
                  onChange={handleAddressInputChange}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Address Line 1 *
            </label>
            <input
              type="text"
              name="address_line1"
              value={addressFormData.address_line1}
              onChange={handleAddressInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              name="address_line2"
              value={addressFormData.address_line2}
              onChange={handleAddressInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <input
                type="text"
                name="city"
                value={addressFormData.city}
                onChange={handleAddressInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                State/Province *
              </label>
              <input
                type="text"
                name="state_province"
                value={addressFormData.state_province}
                onChange={handleAddressInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                name="postal_code"
                value={addressFormData.postal_code}
                onChange={handleAddressInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_default_shipping"
                checked={addressFormData.is_default_shipping}
                onChange={handleAddressInputChange}
                className="mr-2 accent-primary-500"
              />
              <span className="text-sm">Set as default shipping address</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_default_billing"
                checked={addressFormData.is_default_billing}
                onChange={handleAddressInputChange}
                className="mr-2 accent-primary-500"
              />
              <span className="text-sm">Set as default billing address</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={savingAddress}
              className="bg-primary-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:bg-primary-300"
            >
              {savingAddress ? 'Saving...' : (editingAddressId ? 'Update Address' : 'Save Address')}
            </button>
            <button
              type="button"
              onClick={() => setShowAddressForm(false)}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderPaymentMethods = () => {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
        <div className="space-y-3">
          <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
            <input
              type="radio"
              name="payment_method"
              value="cash_on_delivery"
              checked={paymentMethod === "cash_on_delivery"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3 accent-primary-500"
            />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">₹</span>
              </div>
              <div>
                <p className="font-medium">Cash on Delivery</p>
                <p className="text-sm text-gray-600">Pay when you receive the order</p>
              </div>
            </div>
          </label>
          
          <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
            <input
              type="radio"
              name="payment_method"
              value="credit_card"
              checked={paymentMethod === "credit_card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3 accent-primary-500"
            />
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium">Credit Card</p>
                <p className="text-sm text-gray-600">Pay securely with your credit card</p>
              </div>
            </div>
          </label>
          
          <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
            <input
              type="radio"
              name="payment_method"
              value="debit_card"
              checked={paymentMethod === "debit_card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3 accent-primary-500"
            />
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium">Debit Card</p>
                <p className="text-sm text-gray-600">Pay with your debit card</p>
              </div>
            </div>
          </label>
        </div>
        
        {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
          <div className="mt-4">
            {savedCards.length > 0 ? (
              <div>
                <h4 className="font-medium mb-3">Select a saved card</h4>
                <div className="space-y-2">
                  {savedCards.map((card) => (
                    <label
                      key={card.card_id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCardId === card.card_id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-primary-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="selected_card"
                        value={card.card_id}
                        checked={selectedCardId === card.card_id}
                        onChange={() => setSelectedCardId(card.card_id)}
                        className="mr-3 accent-primary-500"
                      />
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-gray-600" />
                        <div>
                          <p className="font-medium">
                            {card.card_brand} •••• {card.last_four_digits}
                          </p>
                          <p className="text-sm text-gray-600">
                            {card.card_holder_name} ({card.card_type})
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCardForm(!showCardForm)}
                  className="mt-3 text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add New Card
                </button>
              </div>
            ) : (
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">No saved cards found</p>
                <button
                  type="button"
                  onClick={() => setShowCardForm(true)}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  Add Payment Card
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Add some items to your cart before placing an order</p>
        <button
          onClick={() => navigate(`/shop${shopId}`)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-primary-500">
            <h1 className="text-2xl font-bold text-white">Checkout - {shopName}</h1>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Address & Payment */}
              <div className="space-y-6">
                {/* Address Management */}
                {renderAddresses()}
                
                {/* Address Form */}
                {showAddressForm && renderAddressForm()}
                
                {/* Payment Methods */}
                {renderPaymentMethods()}
              </div>

              {/* Right Column - Order Summary */}
              <div>
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                <div className="border border-gray-200 rounded-lg p-4">
                  {cartItems.map((item) => (
                    <div key={item.cart_item_id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded-md mr-3"
                        />
                        <div>
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping:</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span>₹0.00</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-100">
                      <span>Total:</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="mt-4 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Shipping Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Free standard shipping</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Estimated delivery: 3-7 business days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>ShipRocket powered delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Pickup from ShipRocket primary location</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span>Professional courier service</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || !selectedAddressId || ((paymentMethod === "credit_card" || paymentMethod === "debit_card") && !selectedCardId)}
                  className="w-full mt-6 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent mr-2" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
                
                {!selectedAddressId && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    Please select or add a delivery address
                  </p>
                )}
                
                {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && !selectedCardId && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    Please select or add a payment card
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Address Deletion */}
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
      />
    </div>
  );
};

export default ShopOrder;
