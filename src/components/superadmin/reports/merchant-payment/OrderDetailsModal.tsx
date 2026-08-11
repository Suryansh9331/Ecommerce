import React, { useEffect, useState } from 'react';

interface OrderDetailsModalProps {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
}

interface OrderItem {
  order_item_id: number;
  product_name_at_purchase: string;
  quantity: number;
  unit_price_inclusive_gst: string;
  final_price_for_item: string;
  product_image?: string;
  item_status: string;
}

interface Order {
  order_id: string;
  order_status: string;
  order_date: string;
  total_amount: string;
  currency: string;
  items: OrderItem[];
  shipping_address_details?: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  status_history?: {
    status: string;
    changed_at: string;
    notes: string;
  }[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, open, onClose }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !open) return;
      setLoading(true);
      setError(null);
      setOrder(null);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/api/superadmin/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        const data = await response.json();
        if (data.status === 'success') {
          setOrder(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch order details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, open]);

  if (!open || !orderId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 min-w-[320px] w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-lg font-bold mb-4">Order Details</h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : order ? (
          <>
            <div className="mb-4">
              <p><strong>Order ID:</strong> {order.order_id}</p>
              <p><strong>Status:</strong> {order.order_status}</p>
              <p><strong>Order Date:</strong> {order.order_date}</p>
              <p><strong>Total Amount:</strong> ₹{order.total_amount} {order.currency}</p>
            </div>
            {order.shipping_address_details && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Shipping Address</h3>
                <p>{order.shipping_address_details.address_line1}</p>
                {order.shipping_address_details.address_line2 && <p>{order.shipping_address_details.address_line2}</p>}
                <p>{order.shipping_address_details.city}, {order.shipping_address_details.state} {order.shipping_address_details.postal_code}</p>
                <p>{order.shipping_address_details.country}</p>
              </div>
            )}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-[600px] w-full text-sm border">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 border">Product</th>
                      <th className="px-2 py-1 border">Qty</th>
                      <th className="px-2 py-1 border">Unit Price</th>
                      <th className="px-2 py-1 border">Total</th>
                      <th className="px-2 py-1 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map(item => (
                      <tr key={item.order_item_id}>
                        <td className="px-4 py-1 border flex items-center gap-10 min-w-[120px]">
                          {item.product_image && (
                            <img src={item.product_image} alt="Product" className="w-16 h-16 object-cover rounded" />
                          )}
                          <span className="max-w-[160px] block">{item.product_name_at_purchase}</span>
                        </td>
                        <td className="px-2 py-1 border text-center">{item.quantity}</td>
                        <td className="px-2 py-1 border">₹{item.unit_price_inclusive_gst}</td>
                        <td className="px-2 py-1 border">₹{item.final_price_for_item}</td>
                        <td className="px-2 py-1 border">{item.item_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {order.status_history && order.status_history.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Status History</h3>
                <ul className="text-xs">
                  {order.status_history.map((hist, idx) => (
                    <li key={idx} className="mb-1">
                      <span className="font-semibold">{hist.status}</span> at {new Date(hist.changed_at).toLocaleString()} {hist.notes && `- ${hist.notes}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : null}
        <button
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded w-full sm:w-auto"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default OrderDetailsModal; 