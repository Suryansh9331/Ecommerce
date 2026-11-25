import React, { useState, useEffect } from 'react';
import {
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  CheckCircleIcon,
  TruckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../hooks/useAmazonTranslate';
import OrderStatusStepper from '../../components/business/OrderStatusStepper';
import {
  acceptOrder,
  markRts,
  bulkRts,
  tabForStatus,
  OrderTab,
} from '../../services/merchantOrderApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define interfaces for type safety
interface Address {
  address_id: number;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: string;
}

interface OrderItem {
  item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  merchant_id: number;
}

interface Order {
  order_id: string;
  order_date: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  shipping_address_id: number;
  shipping_address_details: Address;
  billing_address_id: number | null;
  billing_address_details: Address | null;
  items: OrderItem[];
  subtotal_amount: string;
  tax_amount: string;
  shipping_amount: string;
  discount_amount: string;
  total_amount: string;
  currency: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  payment_gateway_transaction_id: string | null;
  shipping_method_name: string;
  customer_notes: string;
  status_history: unknown[];
  // Phase 2 Sprint 2 lifecycle fields
  accepted_at?: string | null;
  rts_marked_at?: string | null;
  sla_breached?: boolean;
  eway_bill_number?: string | null;
}

interface PaginationInfo {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface ApiResponse {
  orders: Order[];
  pagination: PaginationInfo;
}

// Status options
const STATUS_OPTIONS = [
  'All',
  'PENDING_PAYMENT',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

// Payment status options
const PAYMENT_OPTIONS = [
  'All',
  'PENDING',
  'SUCCESSFUL',
  'FAILED',
  'REFUNDED',
];

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  
  switch (status) {
    case 'DELIVERED':
      bgColor = 'bg-emerald-100';
      textColor = 'text-emerald-800';
      break;
    case 'SHIPPED':
      bgColor = 'bg-sky-100';
      textColor = 'text-sky-800';
      break;
    case 'PROCESSING':
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-800';
      break;
    case 'PENDING_PAYMENT':
      bgColor = 'bg-primary-100';
      textColor = 'text-primary-800';
      break;
    case 'CANCELLED':
      bgColor = 'bg-rose-100';
      textColor = 'text-rose-800';
      break;
    case 'SUCCESSFUL':
      bgColor = 'bg-emerald-100';
      textColor = 'text-emerald-800';
      break;
    case 'FAILED':
      bgColor = 'bg-rose-100';
      textColor = 'text-rose-800';
      break;
    case 'REFUNDED':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      break;
    case 'PENDING':
      bgColor = 'bg-primary-100';
      textColor = 'text-primary-800';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
    </span>
  );
};

// Mobile Order Card Component
interface MobileOrderCardProps {
  order: Order;
  tAddr1?: string;
  onAccept?: (id: string) => void;
  onMarkRts?: (id: string) => void;
  busy?: 'accept' | 'rts' | null;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  showActions?: boolean;
  canSelect?: boolean;
}

const MobileOrderCard: React.FC<MobileOrderCardProps> = ({
  order,
  tAddr1,
  onAccept,
  onMarkRts,
  busy,
  selected,
  onToggleSelect,
  showActions,
  canSelect,
}) => {
  const status = order.order_status.toLowerCase();
  const canAccept = status === 'pending_payment' || status === 'awaiting_fulfillment';
  const canRts = status === 'processing' || status === 'awaiting_fulfillment';

  return (
    <div
      className={`bg-white border rounded-lg p-4 mb-4 shadow-sm ${
        order.sla_breached ? 'border-rose-300' : 'border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {canSelect && onToggleSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onToggleSelect(order.order_id)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600"
              aria-label={`Select ${order.order_id}`}
            />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">{order.order_id}</h3>
            <p className="text-xs text-gray-500">{new Date(order.order_date).toLocaleDateString()}</p>
            {order.sla_breached && (
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-rose-700">
                <ExclamationTriangleIcon className="h-3 w-3" />
                SLA breach
              </span>
            )}
          </div>
        </div>
        <Link to={`/business/orders/${order.order_id}`} className="text-primary-600 hover:text-primary-900">
          <EyeIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="mb-3">
        <OrderStatusStepper
          status={order.order_status}
          accepted_at={order.accepted_at}
          rts_marked_at={order.rts_marked_at}
          slaBreached={order.sla_breached}
          compact
        />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Customer:</span>
          <span className="text-gray-900 truncate max-w-32">
            {tAddr1 || order.shipping_address_details?.address_line1 || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Items:</span>
          <span className="text-gray-900">{order.items.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Total:</span>
          <span className="text-gray-900 font-medium">
            {order.currency} {parseFloat(order.total_amount).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Payment:</span>
          <StatusBadge status={order.payment_status} />
        </div>
      </div>

      {showActions && (canAccept || canRts) && (
        <div className="mt-3 flex gap-2">
          {canAccept && onAccept && (
            <button
              onClick={() => onAccept(order.order_id)}
              disabled={busy === 'accept'}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <CheckCircleIcon className="h-3.5 w-3.5" />
              {busy === 'accept' ? 'Accepting…' : 'Accept'}
            </button>
          )}
          {canRts && onMarkRts && (
            <button
              onClick={() => onMarkRts(order.order_id)}
              disabled={busy === 'rts'}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              <TruckIcon className="h-3.5 w-3.5" />
              {busy === 'rts' ? 'Marking…' : 'Mark RTS'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const TABS: { key: OrderTab; label: string }[] = [
  { key: 'to_ship', label: 'To Ship' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'returns', label: 'Returns' },
];

const Orders: React.FC = () => {
  useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<OrderTab>('to_ship');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<Record<string, 'accept' | 'rts' | null>>({});
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({
    start: '',
    end: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    per_page: 50,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'ascending' | 'descending';
  }>({
    key: 'order_date',
    direction: 'descending',
  });
  const [zoom, setZoom] = useState(1);
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();

  // Display-only translations for address fields
  const [tAddr1Map, setTAddr1Map] = useState<Record<string, string>>({});
  const [tCityMap, setTCityMap] = useState<Record<string, string>>({});

  // Dynamic style for table zoom
  const tableZoomStyle = {
    fontSize: `${zoom}em`,
  };
  const cellPadding = `${Math.max(0.5, 1 * zoom)}rem`;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: pagination.per_page.toString(),
      });

      // Add filters if they are not set to 'All'
      if (selectedStatus !== 'All') {
        params.append('status', selectedStatus);
      }

      if (selectedPayment !== 'All') {
        params.append('payment_status', selectedPayment);
      }

      if (dateRange.start) {
        params.append('start_date', dateRange.start);
      }

      if (dateRange.end) {
        params.append('end_date', dateRange.end);
      }

      const apiUrl = `${API_BASE_URL}/api/merchant-dashboard/orders?${params.toString()}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to fetch orders: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error in fetchOrders:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when filters or pagination changes
  useEffect(() => {
    fetchOrders();
  }, [pagination.page, selectedStatus, selectedPayment, dateRange]);

  // Translate address display fields (fail-open)
  useEffect(() => {
    const lang = (i18n.language || 'en').split('-')[0];
    if (!orders.length || lang === 'en') { setTAddr1Map({}); setTCityMap({}); return; }
    const run = async () => {
      try {
        const addrItems: { id: string; text: string }[] = [];
        const cityItems: { id: string; text: string }[] = [];
        orders.forEach(o => {
          const aid = `a:${o.order_id}`;
          const cid = `c:${o.order_id}`;
          const a1 = o.shipping_address_details?.address_line1;
          const city = o.shipping_address_details?.city;
          if (a1) addrItems.push({ id: aid, text: a1 });
          if (city) cityItems.push({ id: cid, text: city });
        });
        const [aMap, cMap] = await Promise.all([
          translateBatch(addrItems, lang, 'text/plain'),
          translateBatch(cityItems, lang, 'text/plain'),
        ]);
        const outA: Record<string, string> = {};
        const outC: Record<string, string> = {};
        Object.keys(aMap).forEach(k => { if (k.startsWith('a:')) outA[k.split(':')[1]] = aMap[k]; });
        Object.keys(cMap).forEach(k => { if (k.startsWith('c:')) outC[k.split(':')[1]] = cMap[k]; });
        setTAddr1Map(outA);
        setTCityMap(outC);
      } catch { /* fail-open */ }
    };
    run();
  }, [orders, i18n.language, translateBatch]);

  // Handle sort
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter orders based on search term only (since other filters are handled by API)
  const filteredOrders = React.useMemo(() => {
    if (!searchTerm) return orders;

    return orders.filter((order) => {
      return order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.shipping_address_details?.address_line1 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.shipping_address_details?.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [orders, searchTerm]);

  // Group by tab bucket (client-side) so the tab bar can show live counts
  // and the switch is instant.
  const tabCounts = React.useMemo(() => {
    const counts: Record<OrderTab, number> = {
      to_ship: 0, shipped: 0, delivered: 0, returns: 0,
    };
    for (const o of filteredOrders) {
      const t = tabForStatus(o.order_status);
      if (t) counts[t] += 1;
    }
    return counts;
  }, [filteredOrders]);

  const tabOrders = React.useMemo(
    () => filteredOrders.filter(o => tabForStatus(o.order_status) === activeTab),
    [filteredOrders, activeTab]
  );

  const toShipActionableIds = React.useMemo(
    () =>
      tabOrders
        .filter(o => {
          const s = o.order_status.toLowerCase();
          return s === 'processing' || s === 'awaiting_fulfillment';
        })
        .map(o => o.order_id),
    [tabOrders]
  );

  const handleAccept = async (orderId: string) => {
    setRowBusy(prev => ({ ...prev, [orderId]: 'accept' }));
    try {
      const r = await acceptOrder(orderId);
      if (r.already_accepted) {
        toast.success('Order was already accepted');
      } else {
        toast.success('Order accepted — SLA timer started');
      }
      await fetchOrders();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Accept failed');
    } finally {
      setRowBusy(prev => ({ ...prev, [orderId]: null }));
    }
  };

  const handleMarkRts = async (orderId: string) => {
    setRowBusy(prev => ({ ...prev, [orderId]: 'rts' }));
    try {
      const r = await markRts(orderId);
      if (r.label_url) {
        toast.success(`Ready to Ship — invoice ${r.invoice_number || 'pending'} · label ready`);
        window.open(r.label_url, '_blank', 'noopener,noreferrer');
      } else if (r.shiprocket && r.shiprocket.success === false) {
        toast.error(
          `RTS saved but Shiprocket errored (${r.shiprocket.error || 'unknown'}). Retry from order detail.`
        );
      } else {
        toast.success(`Ready to Ship — invoice ${r.invoice_number || 'pending'}`);
      }
      await fetchOrders();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Mark RTS failed');
    } finally {
      setRowBusy(prev => ({ ...prev, [orderId]: null }));
    }
  };

  const handleBulkRts = async () => {
    const ids = Array.from(selectedIds).filter(id => toShipActionableIds.includes(id));
    if (!ids.length) {
      toast.error('Nothing to mark — select Processing orders only');
      return;
    }
    setBulkBusy(true);
    try {
      const r = await bulkRts(ids);
      toast.success(`${r.succeeded} / ${r.requested} marked Ready to Ship${r.failed ? ` (${r.failed} failed)` : ''}`);
      setSelectedIds(new Set());
      await fetchOrders();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Bulk RTS failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const toggleSelect = (orderId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === toShipActionableIds.length && toShipActionableIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(toShipActionableIds));
    }
  };

  // Sort orders
  const sortedOrders = React.useMemo(() => {
    const sortableOrders = [...tabOrders];
    if (sortConfig.key !== null) {
      sortableOrders.sort((a, b) => {
        if (sortConfig.key?.includes('.')) {
          const [parentKey, childKey] = sortConfig.key.split('.');
          
          if (parentKey === 'shipping_address_details') {
            const aValue = a.shipping_address_details[childKey as keyof Address];
            const bValue = b.shipping_address_details[childKey as keyof Address];
            
            if (aValue < bValue) {
              return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
              return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
          }
          return 0;
        } else {
          const aValue = a[sortConfig.key as keyof Order];
          const bValue = b[sortConfig.key as keyof Order];
          
          if (!aValue && !bValue) return 0;
          if (!aValue) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (!bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
          
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableOrders;
  }, [tabOrders, sortConfig]);

  // Generate sort indicator
  const getSortIndicator = (key: string) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchOrders} className="bg-primary-500 text-white px-4 py-2 rounded-md">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Orders</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto" role="tablist" data-testid="order-tabs">
        <nav className="flex min-w-max gap-2 sm:gap-6">
          {TABS.map(t => {
            const count = tabCounts[t.key];
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                data-testid={`tab-${t.key}`}
                onClick={() => { setActiveTab(t.key); setSelectedIds(new Set()); }}
                className={`relative px-2 sm:px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
                <span
                  className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bulk action bar — only on To-Ship tab */}
      {activeTab === 'to_ship' && selectedIds.size > 0 && (
        <div
          data-testid="bulk-action-bar"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 sm:px-4 sm:py-3"
        >
          <span className="text-sm text-primary-900">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-sm text-primary-700 hover:text-primary-900"
            >
              Clear
            </button>
            <button
              onClick={handleBulkRts}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              <TruckIcon className="h-4 w-4" />
              {bulkBusy ? 'Marking…' : 'Mark Ready to Ship'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search orders..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="All">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="All">All Payment Status</option>
            {PAYMENT_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">More Filters</span>
            <span className="sm:hidden">Filters</span>
          </button>
        </div>
              
        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="date"
                  id="date-start"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                />
                <input
                  type="date"
                  id="date-end"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
        
      {/* Orders Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
        {/* Mobile View - Cards */}
        <div className="block lg:hidden">
          <div className="p-4">
            {sortedOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedOrders.map((order) => (
                  <MobileOrderCard
                    key={order.order_id}
                    order={order}
                    tAddr1={tAddr1Map[order.order_id]}
                    onAccept={handleAccept}
                    onMarkRts={handleMarkRts}
                    busy={rowBusy[order.order_id] || null}
                    selected={selectedIds.has(order.order_id)}
                    onToggleSelect={toggleSelect}
                    showActions={activeTab === 'to_ship'}
                    canSelect={activeTab === 'to_ship' && (
                      order.order_status.toLowerCase() === 'processing' ||
                      order.order_status.toLowerCase() === 'awaiting_fulfillment'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop View - Table */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y divide-gray-200"
              style={tableZoomStyle}
            >
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === 'to_ship' && (
                    <th className="text-left" style={{ padding: cellPadding }}>
                      <input
                        type="checkbox"
                        checked={
                          toShipActionableIds.length > 0 &&
                          selectedIds.size === toShipActionableIds.length
                        }
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600"
                        aria-label="Select all actionable orders"
                        data-testid="select-all-checkbox"
                      />
                    </th>
                  )}
                  {['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Actions'].map((header) => (
                    <th
                      key={header}
                      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary-600"
                      style={{ padding: cellPadding }}
                      onClick={() => requestSort(header.toLowerCase().replace(' ', '_'))}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{header}</span>
                        {getSortIndicator(header.toLowerCase().replace(' ', '_'))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOrders.map((order) => {
                  const s = order.order_status.toLowerCase();
                  const canAccept = s === 'pending_payment' || s === 'awaiting_fulfillment';
                  const canRts = s === 'processing' || s === 'awaiting_fulfillment';
                  const busy = rowBusy[order.order_id] || null;
                  const selectable = activeTab === 'to_ship' && canRts;

                  return (
                    <tr
                      key={order.order_id}
                      className={`hover:bg-primary-50 ${order.sla_breached ? 'bg-rose-50/40' : ''}`}
                      data-testid={`order-row-${order.order_id}`}
                    >
                      {activeTab === 'to_ship' && (
                        <td style={{ padding: cellPadding }}>
                          {selectable && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(order.order_id)}
                              onChange={() => toggleSelect(order.order_id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600"
                              aria-label={`Select ${order.order_id}`}
                            />
                          )}
                        </td>
                      )}
                      <td className="text-sm font-medium text-gray-900" style={{ padding: cellPadding }}>
                        <div className="flex items-center gap-2">
                          <span>{order.order_id}</span>
                          {order.sla_breached && (
                            <span
                              className="inline-flex items-center gap-1 text-xs text-rose-700"
                              title="SLA breached — accepted but not RTS'd within 48h"
                              data-testid="sla-breach-badge"
                            >
                              <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                              SLA
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <OrderStatusStepper
                            status={order.order_status}
                            accepted_at={order.accepted_at}
                            rts_marked_at={order.rts_marked_at}
                            slaBreached={order.sla_breached}
                            compact
                          />
                        </div>
                      </td>
                      <td className="text-sm text-gray-500" style={{ padding: cellPadding }}>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td className="whitespace-normal text-sm text-gray-900 max-w-xs" style={{ padding: cellPadding }}>
                        <div>{tAddr1Map[order.order_id] || order.shipping_address_details?.address_line1 || 'N/A'}</div>
                        <div className="text-gray-500">{tCityMap[order.order_id] || order.shipping_address_details?.city || 'N/A'}</div>
                      </td>
                      <td className="text-sm text-gray-500" style={{ padding: cellPadding }}>{order.items.length}</td>
                      <td className="text-sm text-gray-900" style={{ padding: cellPadding }}>{order.currency} {parseFloat(order.total_amount).toFixed(2)}</td>
                      <td style={{ padding: cellPadding }}><StatusBadge status={order.order_status} /></td>
                      <td style={{ padding: cellPadding }}><StatusBadge status={order.payment_status} /></td>
                      <td className="text-sm text-gray-500" style={{ padding: cellPadding }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          {activeTab === 'to_ship' && canAccept && (
                            <button
                              onClick={() => handleAccept(order.order_id)}
                              disabled={busy === 'accept'}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                              data-testid={`accept-${order.order_id}`}
                            >
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              {busy === 'accept' ? '…' : 'Accept'}
                            </button>
                          )}
                          {activeTab === 'to_ship' && canRts && (
                            <button
                              onClick={() => handleMarkRts(order.order_id)}
                              disabled={busy === 'rts'}
                              className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-2 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                              data-testid={`rts-${order.order_id}`}
                            >
                              <TruckIcon className="h-3.5 w-3.5" />
                              {busy === 'rts' ? '…' : 'Mark RTS'}
                            </button>
                          )}
                          <Link to={`/business/orders/${order.order_id}`} className="text-primary-600 hover:text-primary-900">
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Zoom Controls - Only show on desktop */}
        <div className="hidden lg:block fixed z-50 bottom-20 right-4 flex flex-col space-y-3">
          <button
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-primary-100 transition"
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            title="Zoom In"
            type="button"
          >
            <MagnifyingGlassPlusIcon className="w-7 h-7 text-primary-600" />
          </button>
          <button
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-primary-100 transition"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            title="Zoom Out"
            type="button"
          >
            <MagnifyingGlassMinusIcon className="w-7 h-7 text-primary-600" />
          </button>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="bg-white px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.has_prev}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.has_next}
                className="ml-3 relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.per_page) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.per_page, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.has_prev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.has_next}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders; 