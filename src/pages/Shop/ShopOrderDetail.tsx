import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type ShopOrderDetailProps = {
  shopId: number;
};

const ShopOrderDetail: React.FC<ShopOrderDetailProps> = ({ shopId }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Please login to continue');
        }
        const res = await fetch(`${API_BASE_URL}/api/shops/${shopId}/orders/${orderId}`.replace(/\/+$/, ''), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to load order');
        }
        const payload = data?.data || data; // tolerate different shapes
        setOrder(payload);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load order';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [shopId, orderId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return String(dateStr);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-3">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/orders', { state: { shopView: true, selectedShopId: shopId } })}
            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const currency = order.currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : currency;
  const items: any[] = order.items || [];
  const shipping = order.shipping_address_details || {};
  const billing = order.billing_address_details || {};
  const history: any[] = order.status_history || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">Shop {shopId} • Order #{order.order_id}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/orders', { state: { shopView: true, selectedShopId: shopId } })}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back to Orders
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-base font-semibold mt-1">{String(order.order_status || '').replace('_', ' ') || '—'}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Order Date</p>
            <p className="text-base font-semibold mt-1">{formatDate(order.order_date)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-base font-semibold mt-1">{currencySymbol} {order.total_amount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Items</h2>
              <div className="divide-y">
                {items.map((it, idx) => (
                  <div key={idx} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{it.product_name_at_purchase || it.product_name || 'Item'}</p>
                      <p className="text-sm text-gray-600">Qty: {it.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{currencySymbol} {it.line_item_total_inclusive_gst || it.final_price_for_item}</p>
                      <p className="text-xs text-gray-500">Unit: {currencySymbol} {it.unit_price_inclusive_gst}</p>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-gray-500 py-2">No items</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Status History</h2>
              <div className="space-y-3">
                {history.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-gray-400"></div>
                    <div>
                      <p className="font-medium text-sm">{String(h.status || '').replace('_', ' ')}</p>
                      <p className="text-xs text-gray-600">{formatDate(h.changed_at)} • {h.notes}</p>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-sm text-gray-500">No status updates</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p className="text-sm text-gray-700">
                {shipping.address_line1}{shipping.address_line2 ? `, ${shipping.address_line2}` : ''}
              </p>
              <p className="text-sm text-gray-700">{shipping.city}{shipping.state ? `, ${shipping.state}` : ''} {shipping.postal_code}</p>
              <p className="text-sm text-gray-700">{shipping.country}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Billing Address</h3>
              <p className="text-sm text-gray-700">
                {billing.address_line1 || shipping.address_line1}{(billing.address_line2 || shipping.address_line2) ? `, ${billing.address_line2 || shipping.address_line2}` : ''}
              </p>
              <p className="text-sm text-gray-700">{billing.city || shipping.city}{(billing.state || shipping.state) ? `, ${billing.state || shipping.state}` : ''} {billing.postal_code || shipping.postal_code}</p>
              <p className="text-sm text-gray-700">{billing.country || shipping.country}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopOrderDetail;
