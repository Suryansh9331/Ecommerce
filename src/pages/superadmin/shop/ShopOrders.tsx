import React, { useState, useEffect, useMemo } from 'react';
import { FunnelIcon, EyeIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

// Shops mapping for display names
const SHOPS = [
  { shop_id: 1, name: 'Shop 1' },
  { shop_id: 2, name: 'Shop 2' },
  { shop_id: 3, name: 'Shop 3' },
  { shop_id: 4, name: 'Shop 4' },
];

// Backend expects OrderStatusEnum values (lowercase)
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'All', label: 'All Status' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled_by_customer', label: 'Cancelled by customer' },
  { value: 'cancelled_by_merchant', label: 'Cancelled by merchant' },
  { value: 'cancelled_by_admin', label: 'Cancelled by admin' },
  { value: 'refunded', label: 'Refunded' },
];
const PAYMENT_OPTIONS = [
  'All',
  'PENDING',
  'SUCCESSFUL',
  'FAILED',
  'REFUNDED',
];

const StatusBadge = ({ status }: { status: string }) => {
  let bgColor = '';
  let textColor = '';
  const s = (status || '').toString().toUpperCase();
  switch (s) {
    case 'DELIVERED': bgColor = 'bg-emerald-100'; textColor = 'text-emerald-800'; break;
    case 'SHIPPED': bgColor = 'bg-sky-100'; textColor = 'text-sky-800'; break;
    case 'PROCESSING': bgColor = 'bg-amber-100'; textColor = 'text-amber-800'; break;
    case 'PENDING_PAYMENT': bgColor = 'bg-primary-100'; textColor = 'text-primary-800'; break;
    case 'CANCELLED':
    case 'CANCELLED_BY_CUSTOMER':
    case 'CANCELLED_BY_MERCHANT':
    case 'CANCELLED_BY_ADMIN': bgColor = 'bg-rose-100'; textColor = 'text-rose-800'; break;
    case 'SUCCESSFUL': bgColor = 'bg-emerald-100'; textColor = 'text-emerald-800'; break;
    case 'FAILED': bgColor = 'bg-rose-100'; textColor = 'text-rose-800'; break;
    case 'REFUNDED': bgColor = 'bg-purple-100'; textColor = 'text-purple-800'; break;
    case 'PENDING': bgColor = 'bg-primary-100'; textColor = 'text-primary-800'; break;
    default: bgColor = 'bg-gray-100'; textColor = 'text-gray-800';
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {s.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
    </span>
  );
};

const MobileOrderCard = ({ order, onView }: { order: any, onView: (orderId: string) => void }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900 truncate">{order.order_id}</h3>
        <p className="text-xs text-gray-500">{new Date(order.order_date).toLocaleDateString()}</p>
      </div>
      <div className="flex space-x-2">
        <button onClick={() => onView(order.order_id)} className="text-primary-600 hover:text-primary-900">
          <EyeIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">Shop:</span>
        <span className="text-gray-900 truncate max-w-32">{order.shop_name || 'N/A'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Customer:</span>
        <span className="text-gray-900 truncate max-w-32">{order.shipping_address_details?.address_line1 || 'N/A'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Items:</span>
        <span className="text-gray-900">{order.items.length}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Total:</span>
        <span className="text-gray-900 font-medium">{order.currency} {parseFloat(order.total_amount).toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500">Status:</span>
        <StatusBadge status={order.order_status} />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500">Payment:</span>
        <StatusBadge status={order.payment_status} />
      </div>
    </div>
  </div>
);

const ShopOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const shopNameById = useMemo(() => new Map(SHOPS.map(s => [s.shop_id, s.name])), []);

  const fetchOrders = async () => {
    if (!API_BASE_URL) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', String(perPage));
      if (selectedShop !== 'All') params.set('shop_id', String(selectedShop));
      if (selectedStatus !== 'All') params.set('status', selectedStatus); // expects lowercase enum value

      const res = await fetch(`${API_BASE_URL}/api/admin/shop-orders?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Failed to load orders');
      }

      const received = (data?.data?.orders || []).map((o: any) => ({
        ...o,
        // Normalize fields for UI
        order_status: o.order_status,
        payment_status: o.payment_status,
        currency: o.currency || 'INR',
        shop_name: shopNameById.get(o.shop_id) || `Shop ${o.shop_id}`,
        items: Array.isArray(o.items) ? o.items : [],
      }));
      setOrders(received);
      const pg = data?.data?.pagination || {};
      setTotalPages(pg.pages || 1);
      setTotal(pg.total || received.length);
    } catch (err: any) {
      toast.error(err.message || 'Unable to fetch shop orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop, selectedStatus, page]);

  // Filtering logic
  const filteredOrders = orders.filter(order => {
    const matchesShop = selectedShop === 'All' || String(order.shop_id) === String(selectedShop);
    const matchesStatus = selectedStatus === 'All' || (order.order_status || '').toString().toLowerCase() === selectedStatus.toLowerCase();
    const matchesPayment = selectedPayment === 'All' || (order.payment_status || '').toString().toUpperCase() === selectedPayment.toUpperCase();
    const matchesSearch = !searchTerm || order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) || (order.shipping_address_details?.address_line1 || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesShop && matchesStatus && matchesPayment && matchesSearch;
  });

  const tableZoomStyle = { fontSize: `${zoom}em` };
  const cellPadding = `${Math.max(0.5, 1 * zoom)}rem`;

  const handleView = (orderId: string) => {
    const order = orders.find(o => o.order_id === orderId);
    navigate(`/superadmin/order-management/${orderId}`, { state: { order } });
  };

  if (loading) return (<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Shop Orders</h1>
      </div>
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="relative">
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search orders..." className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm" />
          </div>
          <select value={selectedShop} onChange={e => { setSelectedShop(e.target.value); setPage(1); }} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm">
            <option value="All">All Shops</option>
            {SHOPS.map(shop => <option key={shop.shop_id} value={shop.shop_id}>{shop.name}</option>)}
          </select>
          <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setPage(1); }} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm">
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={selectedPayment} onChange={e => setSelectedPayment(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm">
            <option value="All">All Payment Status</option>
            {PAYMENT_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"><FunnelIcon className="h-4 w-4 mr-2" /><span className="hidden sm:inline">More Filters</span><span className="sm:hidden">Filters</span></button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
        <div className="block lg:hidden"><div className="p-4">{filteredOrders.length === 0 ? (<div className="text-center py-8"><p className="text-gray-500">No orders found</p></div>) : (<div className="space-y-4">{filteredOrders.map(order => (<MobileOrderCard key={order.order_id} order={order} onView={handleView} />))}</div>)}</div></div>
        <div className="hidden lg:block"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200" style={tableZoomStyle}><thead className="bg-gray-50"><tr>{['Order ID', 'Date', 'Shop', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Actions'].map(header => (<th key={header} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ padding: cellPadding }}><div className="flex items-center space-x-1"><span>{header}</span></div></th>))}</tr></thead><tbody className="bg-white divide-y divide-gray-200">{filteredOrders.map(order => (<tr key={order.order_id} className="hover:bg-primary-50"><td className="text-sm font-medium text-gray-900" style={{ padding: cellPadding }}>{order.order_id}</td><td className="text-sm text-gray-500" style={{ padding: cellPadding }}>{new Date(order.order_date).toLocaleDateString()}</td><td className="text-sm text-gray-900" style={{ padding: cellPadding }}>{order.shop_name || shopNameById.get(order.shop_id) || 'N/A'}</td><td className="whitespace-normal text-sm text-gray-900 max-w-xs" style={{ padding: cellPadding }}><div>{order.shipping_address_details?.address_line1 || 'N/A'}</div><div className="text-gray-500">{order.shipping_address_details?.city || 'N/A'}</div></td><td className="text-sm text-gray-500" style={{ padding: cellPadding }}>{order.items.length}</td><td className="text-sm text-gray-900" style={{ padding: cellPadding }}>{order.currency} {parseFloat(order.total_amount).toFixed(2)}</td><td style={{ padding: cellPadding }}><StatusBadge status={order.order_status} /></td><td style={{ padding: cellPadding }}><StatusBadge status={order.payment_status} /></td><td className="text-sm text-gray-500" style={{ padding: cellPadding }}><div className="flex space-x-2"><button onClick={() => handleView(order.order_id)} className="text-primary-600 hover:text-primary-900"><EyeIcon className="h-5 w-5" /></button></div></td></tr>))}</tbody></table></div></div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
          <div className="text-sm text-gray-600">Total: {total}</div>
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 rounded border text-sm disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >Prev</button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <button
              className="px-3 py-1 rounded border text-sm disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >Next</button>
          </div>
        </div>
        <div className="hidden lg:block fixed z-50 bottom-20 right-4 flex flex-col space-y-3"><button className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-primary-100 transition" onClick={() => setZoom(z => Math.min(2, z + 0.1))} title="Zoom In" type="button"><MagnifyingGlassPlusIcon className="w-7 h-7 text-primary-600" /></button><button className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-primary-100 transition" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} title="Zoom Out" type="button"><MagnifyingGlassMinusIcon className="w-7 h-7 text-primary-600" /></button></div>
      </div>
    </div>
  );
};

export default ShopOrders; 