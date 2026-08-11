import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Star, FileText, ChevronDown, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { formatMoney } from "../utils/money";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface OrderItem {
  order_item_id: number;
  product_name_at_purchase: string;
  quantity: number;
  unit_price_inclusive_gst: string;
  final_price_for_item: string;
  product_image: string;
  item_status: string;
}

interface TrackingData {
  order_id: string;
  shiprocket_response?: unknown;  // Direct ShipRocket response (new format)
  shipments?: {
    [key: string]: {
      shipment_id: number;
      merchant_id: number;
      carrier_name: string;
      tracking_number: string;
      shiprocket_order_id?: number;
      tracking_data?: unknown;
      error?: string;
    };
  };
}

interface Order {
  order_id: string;
  order_status: string;
  order_date: string;
  total_amount: string;
  currency: string;
  items: OrderItem[];
  shipping_address_details: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  status_history: {
    status: string;
    changed_at: string;
    notes: string;
  }[];
  tracking_info?: TrackingData;
}

interface ApiResponse {
  status: string;
  data: {
    orders: Order[];
    total: number;
    pages: number;
    current_page: number;
  };
  message?: string;
}

// Add currency symbol mapping
const CURRENCY_SYMBOLS: { [key: string]: string } = {
  'IN': '₹',
  'US': '$',
  'EUR': '€',
  'GBP': '£'
};

const Order: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [trackingLoading, setTrackingLoading] = useState<{ [key: string]: boolean }>({});
  const [invoiceLoading, setInvoiceLoading] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Shop Orders view state (isolated, does not affect merchant flow)
  const [shopView, setShopView] = useState<boolean>(false);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  const [shopLoading, setShopLoading] = useState<boolean>(false);
  const [shopError, setShopError] = useState<string | null>(null);
  const [shopCurrentPage, setShopCurrentPage] = useState<number>(1);
  const [shopTotalPages, setShopTotalPages] = useState<number>(1);
  const shopPerPage = 10;

  const getCurrencySymbol = (currencyCode: string): string => {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString()
      });

      if (selectedFilter !== 'all') {
        params.append('status', selectedFilter);
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/user?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      // console.log('Orders API Response:', data);
      
      if (data.status === 'success') {
        const ordersWithTracking = await Promise.all(
          data.data.orders.map(async (order) => {
            try {
              // Only attempt tracking when order likely has shipments
              const statusLc = String(order.order_status || '').toLowerCase();
              const shouldTrack = ['processing', 'shipped', 'in_transit', 'delivered'].includes(statusLc);
              if (!shouldTrack) {
                return order;
              }
              const trackingInfo = await fetchOrderTracking(order.order_id);
              return {
                ...order,
                tracking_info: trackingInfo
              };
            } catch (error) {
              console.error(`Failed to fetch tracking for order ${order.order_id}:`, error);
              return order;
            }
          })
        );
        
        setOrders(ordersWithTracking);
        setTotalPages(data.data.pages);
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's shop orders for a selected shop (separate from merchant orders)
  const fetchShopOrders = async (shopId: number) => {
    try {
      setShopLoading(true);
      setShopError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');

      const params = new URLSearchParams({
        page: shopCurrentPage.toString(),
        per_page: shopPerPage.toString(),
      });
      const baseUrl = API_BASE_URL.replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/api/shops/${shopId}/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to fetch shop orders');

      // Accept success_response shape or direct
      const payload = data?.data || data;
      const orders = payload?.orders || payload?.data || [];
      const pagination = payload?.pagination || {};
      setShopOrders(orders);
      setShopTotalPages(pagination.pages || 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch shop orders';
      setShopError(msg);
      toast.error(msg);
    } finally {
      setShopLoading(false);
    }
  };

  const fetchOrderTracking = async (orderId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // First try to get tracking using the database order ID
      const response = await fetch(`${API_BASE_URL}/api/shiprocket/tracking/db-order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order tracking: ${response.status}`);
      }

      const data = await response.json();
      // console.log('ShipRocket Order Tracking Response:', data);

      // Accept common success shape { message, data }
      const payload = data?.data ?? null;
      if (payload) {
        // If Shiprocket returns "no activities" or empty details, don't treat as error
        try {
          const sr = payload.shiprocket_response;
          if (Array.isArray(sr) && sr.length > 0) {
            const first = sr[0];
            const key = Object.keys(first || {})[0];
            const td = key ? first[key]?.tracking_data : undefined;
            const noActivitiesMsg = td?.error && String(td.error).toLowerCase().includes('no activities');
            if (noActivitiesMsg) return null;
          }
        } catch {}
        return payload;
      }
      // Fallback: if backend sent status-based success
      if (data.status === 'success') {
        return data.data;
      }
      throw new Error(data.message || 'Failed to fetch order tracking');
    } catch (err) {
      console.error('Error fetching order tracking:', err);
      // toast.error('Failed to load order tracking information');
      return null;
    }
  };


  const handleDownloadInvoice = async (orderId: string) => {
    setInvoiceLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please sign in to download your invoice.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/invoice`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Success path: a PDF blob. Trigger a browser download.
      const contentType = response.headers.get('Content-Type') || '';
      if (response.ok && contentType.includes('application/pdf')) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_${orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Invoice downloaded.');
        return;
      }

      // Error path: backend returns JSON. Map the known statuses to clear messages.
      let serverMessage = '';
      try {
        const data = await response.json();
        serverMessage = data?.message || data?.error || '';
      } catch {
        // non-JSON error body; fall through to status-based messages
      }

      if (response.status === 400) {
        toast.error(serverMessage || 'Invoice is available only after successful payment.');
      } else if (response.status === 401) {
        toast.error('Your session has expired. Please sign in again.');
      } else if (response.status === 403) {
        toast.error("You don't have access to this invoice.");
      } else if (response.status === 404) {
        toast.error('Order not found.');
      } else {
        toast.error(serverMessage || 'Failed to download invoice. Please try again.');
      }
    } catch (err) {
      console.error('Invoice download failed:', err);
      toast.error('Unable to download invoice. Please check your connection and try again.');
    } finally {
      setInvoiceLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const refreshOrderTracking = async (orderId: string) => {
    try {
      setTrackingLoading(prev => ({ ...prev, [orderId]: true }));
      const trackingInfo = await fetchOrderTracking(orderId);
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.order_id === orderId 
            ? { ...order, tracking_info: trackingInfo }
            : order
        )
      );
      
      toast.success('Tracking information updated');
      return trackingInfo;
    } catch (error) {
      console.error('Error refreshing tracking:', error);
      toast.error('Failed to refresh tracking information');
      return null;
    } finally {
      setTrackingLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }
    if (!shopView) {
      fetchOrders(); // merchant orders as-is
    }
  }, [isAuthenticated, navigate, currentPage, selectedFilter, shopView]);

  // When in shop view, fetch for selected shop
  useEffect(() => {
    if (!isAuthenticated) return;
    if (shopView && selectedShopId) {
      fetchShopOrders(selectedShopId);
    }
  }, [isAuthenticated, shopView, selectedShopId, shopCurrentPage]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500';
      case 'in_transit':
      case 'shipped':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleOrderClick = async (order: Order) => {
    const trackingInfo = await fetchOrderTracking(order.order_id);
    navigate(`/track/${order.order_id}`, { state: { order, trackingInfo } });
  };

  const handleAction = async (e: React.MouseEvent, type: string, order: Order) => {
    e.stopPropagation();
    
    switch (type) {
      case 'track':
        // Refresh tracking information before navigating
        const trackingInfo = await refreshOrderTracking(order.order_id);
        navigate(`/track/${order.order_id}`, { state: { trackingInfo } });
        break;
      case 'exchange':
        const exchangeTrackingInfo = await fetchOrderTracking(order.order_id);
        navigate(`/exchange/${order.order_id}`, { state: { order, trackingInfo: exchangeTrackingInfo } });
        break;
      case 'return':
        const returnTrackingInfo = await fetchOrderTracking(order.order_id);
        navigate(`/refund/${order.order_id}`, { state: { order, trackingInfo: returnTrackingInfo } });
        break;
      case 'review':
        const reviewTrackingInfo = await fetchOrderTracking(order.order_id);
        navigate(`/review/${order.order_id}`, { state: { order, trackingInfo: reviewTrackingInfo } });
        break;
    }
  };

  const filteredOrders = orders.filter(order => 
    order.items.some(item => 
      item.product_name_at_purchase.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    order.order_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderTrackingInfo = (trackingInfo: TrackingData, orderId: string) => {
    if (!trackingInfo) {
      return null;
    }

    const isLoading = trackingLoading[orderId];
    
    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-blue-800">Tracking Information</h4>
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
              <span>Updating...</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {trackingInfo.shiprocket_response ? (
            // Handle new ShipRocket direct response format
            <div className="text-sm">
              {Array.isArray(trackingInfo.shiprocket_response) && trackingInfo.shiprocket_response[0] && trackingInfo.shiprocket_response[0].tracking_data ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">ShipRocket Tracking</span>
                    <span className="text-blue-600 font-mono text-xs">#{trackingInfo.order_id}</span>
                  </div>
                  {trackingInfo.shiprocket_response[0].tracking_data?.error ? (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 text-xs font-medium">📦 Order Not Shipped Yet</p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Your order is being processed. Tracking will be updated once shipped.
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 mt-1">
                      {trackingInfo.shiprocket_response[0].tracking_data?.shipment_track?.[0] && (
                        <div className="space-y-1">
                          <p><strong>Status:</strong> {trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].current_status || 'Unknown'}</p>
                          {trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].edd && (
                            <p><strong>Est. Delivery:</strong> {new Date(trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].edd).toLocaleDateString()}</p>
                          )}
                          {trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].awb_code && (
                            <p><strong>Tracking #:</strong> {trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].awb_code}</p>
                          )}
                        </div>
                      )}
                      {trackingInfo.shiprocket_response[0].tracking_data?.shipment_track_activities?.length > 0 && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-green-800 text-xs">
                            📍 {trackingInfo.shiprocket_response[0].tracking_data.shipment_track_activities.length} tracking updates
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-xs">No tracking data available</p>
              )}
            </div>
          ) : trackingInfo.shipments ? (
            // Fallback to old shipments format
            Object.values(trackingInfo.shipments).map((shipment) => (
              <div key={shipment.shipment_id} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">
                    {shipment.carrier_name}
                  </span>
                  {shipment.tracking_number && (
                    <span className="text-blue-600 font-mono text-xs">
                      #{shipment.tracking_number}
                    </span>
                  )}
                </div>
                {shipment.error ? (
                  <p className="text-red-600 text-xs mt-1">{shipment.error}</p>
                ) : shipment.tracking_data ? (
                  <div className="text-xs text-gray-600 mt-1">
                    <p> Order ID: {shipment.shiprocket_order_id}</p>
                    {(() => {
                      const status = (shipment.tracking_data as Record<string, unknown>).status;
                      return status ? <p>Status: {String(status)}</p> : null;
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs mt-1">No tracking data available</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-xs">No tracking information available</p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error Loading Orders</p>
          <p>{error}</p>
          <button 
            onClick={() => fetchOrders()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Your Orders</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button 
            className="px-3 sm:px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors text-sm sm:text-base"
            onClick={() => navigate('/return-refund')}
          >
            Returns Policy
          </button>
          <button 
            className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-600/90 transition-colors text-sm sm:text-base"
            onClick={() => navigate('/track-order')}
          >
            Track Package
          </button>
        </div>
      </div>

      {/* Segment control: Marketplace vs Shop Orders */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            className={`px-4 py-2 text-sm font-medium ${!shopView ? 'bg-primary-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setShopView(false)}
          >
            Marketplace Orders
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${shopView ? 'bg-primary-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setShopView(true)}
          >
            Shop Orders
          </button>
        </div>
      </div>

      {/* Shop Orders View */}
      {shopView && (
        <div className="space-y-6">
          {/* Shop selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(id => (
              <button
                key={id}
                onClick={() => { setSelectedShopId(id); setShopCurrentPage(1); }}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${selectedShopId === id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-primary-300'}`}
              >
                Shop {id}
              </button>
            ))}
          </div>

          {/* Content for selected shop */}
          {!selectedShopId ? (
            <div className="text-center text-gray-500 py-12">Select a shop to view your orders</div>
          ) : shopLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : shopError ? (
            <div className="text-center text-red-600 py-12">{shopError}</div>
          ) : (
            <>
              {(!shopOrders || shopOrders.length === 0) ? (
                <div className="text-center text-gray-500 py-12">No orders found for this shop</div>
              ) : (
                <div className="space-y-4">
                  {shopOrders.map((o: any) => (
                    <div key={o.order_id} className="border rounded-lg p-4 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm text-gray-600">Order ID</p>
                          <p className="font-semibold">{o.order_id}</p>
                          <p className="text-xs text-gray-500">Placed on {new Date(o.order_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total</p>
                          {/* An order is shown in the currency it was recorded in,
                              never re-converted at today's rate — invariant I12.
                              A past order's value is a historical fact, and a refund
                              has to match what was actually charged. */}
                          <p className="font-semibold">
                            {formatMoney(o.total_amount, { currency: o.currency || 'INR' })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">{String(o.order_status || '').replace('_', ' ')}</span>
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">{(o.items?.length || 0)} items</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/shop${selectedShopId}/order/${o.order_id}`, { state: { from: '/orders', shopView: true, selectedShopId } })}
                          className="px-3 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 text-sm"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Shop pagination */}
              {shopTotalPages > 1 && (
                <div className="flex justify-center items-center gap-1 my-6 overflow-x-auto">
                  <button 
                    onClick={() => setShopCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={shopCurrentPage === 1}
                    className="w-8 h-8 flex items-center justify-center border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 flex-shrink-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {[...Array(shopTotalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setShopCurrentPage(i + 1)}
                      className={`w-8 h-8 flex items-center justify-center border rounded-lg flex-shrink-0 text-sm ${
                        shopCurrentPage === i + 1 ? 'bg-primary-500 text-white' : 'hover:border-primary-500'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    onClick={() => setShopCurrentPage(prev => Math.min(prev + 1, shopTotalPages))}
                    disabled={shopCurrentPage === shopTotalPages}
                    className="w-8 h-8 flex items-center justify-center border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 flex-shrink-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Merchant Orders View (original) */}
      {!shopView && (
      <>
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search orders by product name or order ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm sm:text-base"
          />
        </div>
        <div className="relative">
          <button 
            className="w-full sm:w-auto px-4 py-2 border rounded-lg flex items-center justify-center sm:justify-start gap-2 hover:border-primary-600 transition-colors text-sm sm:text-base"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter size={20} />
            Filter
            <ChevronDown size={16} />
          </button>
          {filterOpen && (
            <div className="absolute right-0 mt-2 w-full sm:w-48 bg-white border rounded-lg shadow-lg z-10">
              <div className="p-2">
                {['all', 'delivered', 'in_transit', 'processing', 'cancelled'].map((filter) => (
                  <button 
                    key={filter}
                    className={`w-full text-left px-3 py-2 rounded capitalize text-sm sm:text-base ${
                      selectedFilter === filter ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedFilter(filter);
                      setFilterOpen(false);
                    }}
                  >
                    {filter === 'all' ? 'All Orders' : filter.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

  {/* Orders List */}
      <div className="space-y-4 sm:space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            // console.log('Rendering order:', order);
            return (
              <div
                key={order.order_id}
                onClick={() => handleOrderClick(order)}
                className="border rounded-lg p-4 sm:p-6 space-y-4 cursor-pointer hover:border-primary-600 transition-colors bg-white shadow-sm"
              >
                {order.items.map((item) => (
                  <div key={item.order_item_id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex gap-4 sm:gap-6">
                      <img
                        src={item.product_image || '/placeholder-image.jpg'}
                        alt={item.product_name_at_purchase}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                // Guard against a loop: if the placeholder itself fails to load,
                // onError fires again and reassigns the same missing src forever.
                // That produced thousands of requests and a page that never
                // finished loading. One swap per element, then give up.
                if (img.dataset.fallbackApplied === "1") return;
                img.dataset.fallbackApplied = "1";
                img.src = "/placeholder-image.jpg";
              }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base sm:text-lg mb-1 truncate sm:whitespace-normal sm:truncate-none sm:max-w-[350px] md:max-w-[500px] lg:max-w-[600px]">{item.product_name_at_purchase}</h3>
                        <p className="text-gray-600 text-xs sm:text-sm mb-1">Order #{order.order_id}</p>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(order.order_status)}`}></span>
                          <span className="font-medium text-sm sm:text-base">{order.order_status.replace('_', ' ')}</span>
                        </div>
                        <p className="text-gray-600 text-xs sm:text-sm mt-1">
                          {order.status_history && order.status_history.length > 0 
                            ? order.status_history[0].notes 
                            : 'Order placed'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-base sm:text-lg">
                        {getCurrencySymbol(order.currency)} {item.final_price_for_item}
                      </p>
                      <p className="text-gray-600 text-xs sm:text-sm">Ordered on {formatDate(order.order_date)}</p>
                    </div>
                  </div>
                ))}

                {/* Tracking Information */}
                {order.tracking_info && renderTrackingInfo(order.tracking_info, order.order_id)}
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t gap-4">
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {order.order_status === 'delivered' && (
                      <>
                        <button
                          onClick={(e) => handleAction(e, 'return', order)}
                          className="px-3 sm:px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors flex items-center gap-2 text-sm"
                        >
                          <RotateCcw size={16} />
                          Return
                        </button>
                        <button
                          onClick={(e) => handleAction(e, 'review', order)}
                          className="px-3 sm:px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors flex items-center gap-2 text-sm"
                        >
                          <Star size={16} />
                          Review
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <button
                      onClick={(e) => handleAction(e, 'track', order)}
                      className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-600/90 transition-colors flex items-center gap-2 text-sm"
                    >
                      Track Order
                    </button>
                    {order.tracking_info && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshOrderTracking(order.order_id);
                        }}
                        disabled={trackingLoading[order.order_id]}
                        className="px-3 sm:px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw size={16} className={trackingLoading[order.order_id] ? 'animate-spin' : ''} />
                        {trackingLoading[order.order_id] ? 'Updating...' : 'Refresh Tracking'}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadInvoice(order.order_id);
                      }}
                      disabled={invoiceLoading[order.order_id]}
                      className="px-3 sm:px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText size={16} />
                      {invoiceLoading[order.order_id] ? 'Generating...' : 'Invoice'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

  {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 my-6 overflow-x-auto">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600 flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 flex items-center justify-center border rounded-lg flex-shrink-0 text-sm ${
                currentPage === i + 1
                  ? 'bg-primary-600 text-white'
                  : 'hover:border-primary-600'
              }`}
            >
              {i + 1}
            </button>
          ))}
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-600 flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
  </>
  )}
    </div>
  );
};

export default Order; 