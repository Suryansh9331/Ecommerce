import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon, PrinterIcon, LockClosedIcon, UserIcon, CreditCardIcon } from '@heroicons/react/24/outline';

// Dummy order data with details
const DUMMY_ORDERS = [
  {
    order_id: 'ORD-20250715054041-76C63D',
    order_date: '2025-07-15T05:40:41Z',
    shop_id: 1,
    shop_name: 'Luxe Hub',
    shipping_address_details: {
      address_line1: '102 B mahalaxmi nagar indore MP',
      city: 'Gwalior',
      postal_code: '474001',
    },
    items: [
      {
        name: 'Lenovo Smartchoice Yoga Slim 7 Intel Core Ultra 5 125H Built-in AI 14"(35.5cm) WUXGA-OLED 400Nits Laptop',
        sku: 'LEN-SMA-YOG-SLI-7-IN',
        price: 59999.99,
        quantity: 1,
      },
    ],
    subtotal: 50847.45,
    tax: 9152.54,
    shipping: 0.0,
    total_amount: '59999.99',
    currency: 'INR',
    order_status: 'PENDING_PAYMENT',
    payment_status: 'PENDING',
    payment_method: 'cash_on_delivery',
    status_history: [
      {
        status: 'PENDING_PAYMENT',
        date: '2025-07-15T05:40:41Z',
        note: 'Order created.'
      }
    ]
  },
  // ... other orders ...
];

const statusBadge = (status: string) => {
  let color = '';
  const s = (status || '').toString().toUpperCase();
  switch (s) {
    case 'DELIVERED': color = 'bg-emerald-100 text-emerald-800'; break;
    case 'SHIPPED': color = 'bg-sky-100 text-sky-800'; break;
    case 'PROCESSING': color = 'bg-amber-100 text-amber-800'; break;
    case 'PENDING_PAYMENT': color = 'bg-primary-100 text-primary-800'; break;
    case 'CANCELLED':
    case 'CANCELLED_BY_CUSTOMER':
    case 'CANCELLED_BY_MERCHANT':
    case 'CANCELLED_BY_ADMIN': color = 'bg-rose-100 text-rose-800'; break;
    case 'SUCCESSFUL': color = 'bg-emerald-100 text-emerald-800'; break;
    case 'FAILED': color = 'bg-rose-100 text-rose-800'; break;
    case 'REFUNDED': color = 'bg-purple-100 text-purple-800'; break;
    case 'PENDING': color = 'bg-primary-100 text-primary-800'; break;
    default: color = 'bg-gray-100 text-gray-800';
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} capitalize`}>
      {s.replace('_', ' ').toLowerCase()}
    </span>
  );
};

// Helpers: currency symbol, formatting and amount in words (Indian system)
const currencySymbol = (code?: string) => {
  const c = (code || '').toUpperCase();
  if (c === 'INR' || c === 'RS' || c === '₹') return '₹';
  if (c === 'USD' || c === '$') return '$';
  if (c === 'EUR' || c === '€') return '€';
  if (c === 'GBP' || c === '£') return '£';
  return c || '';
};

const formatMoney = (amount: number, code?: string) => {
  const sym = currencySymbol(code);
  // Use Indian locale if INR else default
  const locale = (code || '').toUpperCase() === 'INR' ? 'en-IN' : undefined;
  return `${sym} ${Number(amount || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Convert number to words in Indian numbering system for INR
const numberToWordsINR = (num: number) => {
  // Handle only up to crores for brevity
  const a = [ '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen' ];
  const b = [ '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety' ];
  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    return '';
  };
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const rest = Math.floor(num % 100);
  let str = '';
  if (crore) str += inWords(crore) + ' crore ';
  if (lakh) str += inWords(lakh) + ' lakh ';
  if (thousand) str += inWords(thousand) + ' thousand ';
  if (hundred) str += a[hundred] + ' hundred ';
  if (rest) str += inWords(rest) + ' ';
  return str.trim() || 'zero';
};

const amountInWordsINR = (amount: number) => {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let parts = '';
  if (rupees) parts += `${numberToWordsINR(rupees)} rupees`;
  if (paise) parts += `${parts ? ' and ' : ''}${numberToWordsINR(paise)} paise`;
  return (parts || 'zero rupees') + ' only';
};

const OrderManagementPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateOrder = (location.state as any)?.order;
  const order: any = stateOrder || DUMMY_ORDERS.find(o => o.order_id === orderId);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-primary-600 hover:underline"><ArrowLeftIcon className="h-5 w-5 mr-1" />Back</button>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
        <p className="text-gray-500">No order found for ID: {orderId}</p>
      </div>
    );
  }

  return (
  <>
  <div className="bg-gray-50 min-h-screen py-10 px-4 hide-on-print">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-primary-600 hover:underline"><ArrowLeftIcon className="h-5 w-5 mr-1" />Back to Orders</button>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Order <span className="font-mono">#{order.order_id}</span></h1>
          <button onClick={() => window.print()} className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded flex items-center"><PrinterIcon className="h-5 w-5 mr-2" />Print Invoice</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main Info */}
          <div className="space-y-4 lg:col-span-2">
            {/* Order Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="font-semibold text-gray-800 mb-2">Order Status</div>
              <div className="flex flex-wrap gap-3 items-center mb-1">
                {statusBadge((order.order_status || '').toString())}
                {statusBadge((order.payment_status || '').toString())}
              </div>
              <div className="text-xs text-gray-500">Placed on {order.order_date ? new Date(order.order_date).toLocaleDateString() : '-'}</div>
            </div>
            {/* Order Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-2">
                <LockClosedIcon className="h-5 w-5 text-primary-500" />
        Order Items ({(order.items || []).length})
              </div>
              <div className="divide-y divide-gray-100">
        {(order.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
          <div className="font-medium text-gray-900">{item.name || item.product_name_at_purchase}</div>
          <div className="text-xs text-gray-500">SKU: {item.sku || item.sku_at_purchase}</div>
                    </div>
                    <div className="flex flex-col sm:items-end">
          <div className="text-gray-900 font-semibold">{order.currency} {(item.price ?? parseFloat(item.unit_price_inclusive_gst || 0)).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          <div className="text-xs text-gray-500">( {item.quantity} × {order.currency} {(item.price ?? parseFloat(item.unit_price_inclusive_gst || 0)).toLocaleString(undefined, {minimumFractionDigits:2})} )</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Status History */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="font-semibold text-gray-800 mb-2">Status History</div>
              <div className="space-y-2">
                {(order.status_history || []).map((h: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="mt-1 w-2 h-2 rounded-full bg-primary-500 inline-block"></span>
                    <div>
                      <div className="font-medium text-gray-700 text-sm">{h.status.replace('_', ' ').toLowerCase()}</div>
                      <div className="text-xs text-gray-500">{new Date(h.date).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{h.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Right: Summary & Info */}
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="font-semibold text-gray-800 mb-2">Order Summary</div>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{order.currency} {parseFloat(order.subtotal_amount ?? order.subtotal ?? 0).toLocaleString(undefined, {minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{order.currency} {parseFloat(order.tax_amount ?? order.tax ?? 0).toLocaleString(undefined, {minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{order.currency} {parseFloat(order.shipping_amount ?? order.shipping ?? 0).toLocaleString(undefined, {minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between font-semibold border-t pt-2 mt-2"><span>Total</span><span>{order.currency} {parseFloat(order.total_amount ?? 0).toLocaleString(undefined, {minimumFractionDigits:2})}</span></div>
              </div>
            </div>
            {/* Customer Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-2"><UserIcon className="h-5 w-5 text-primary-500" /> Customer Information</div>
              <div className="text-sm">
                <div className="font-medium">Shipping Address</div>
                <div>{order.shipping_address_details?.address_line1 || '-'}</div>
                <div>{order.shipping_address_details?.city || ''} {order.shipping_address_details?.postal_code ? ', ' + order.shipping_address_details.postal_code : ''}</div>
              </div>
            </div>
            {/* Payment Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-2"><CreditCardIcon className="h-5 w-5 text-primary-500" /> Payment Information</div>
              <div className="text-sm">
                <div className="font-medium">Payment Method</div>
                <div>{(order.payment_method || '').toString().replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Printable Invoice Section (moved outside hide-on-print wrapper) */}
    </div>
    {order && (() => {
        const items = (order.items || []) as any[];
        // Compute tax and taxable values per item and aggregate by GST rate
        type TaxRow = { rate: number; taxable: number; tax: number };
        const taxMap = new Map<number, TaxRow>();
        let totalTaxable = 0;
        let totalGST = 0;
        items.forEach((it) => {
          const qty = Number(it.quantity || 0);
          const basePerUnit = Number(it.final_base_price_for_gst_calc_unit || 0);
          const taxable = basePerUnit * qty;
          const gstAmt = Number(it.total_gst_for_line_item || it.gst_amount_per_unit || 0) || Number(it.gst_amount_per_unit || 0) * qty;
          const rate = Number(it.gst_rate_applied_at_purchase || 0);
          totalTaxable += taxable;
          totalGST += gstAmt;
          if (!taxMap.has(rate)) taxMap.set(rate, { rate, taxable: 0, tax: 0 });
          const row = taxMap.get(rate)!;
          row.taxable += taxable;
          row.tax += gstAmt;
        });
        const taxSummary = Array.from(taxMap.values()).sort((a, b) => a.rate - b.rate);

        const curr = order.currency || 'INR';
        const totalAmt = Number(order.total_amount ?? 0) || 0;

        return (
          <div className="print-invoice watermark-bg" style={{ position: 'relative', zIndex: 1, padding: '1rem' }}>
            {/* Ensure colors, watermark, and layout persist on print; hide rest of page */}
            <style>{`
              @page { margin: 14mm 12mm; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .print-invoice { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .watermark-bg { background-color: inherit !important; background-image: inherit !important; }
                .hide-on-print { display: none !important; }
                .show-on-print { display: block !important; }
                .invoice-table { page-break-inside: auto; width: 100%; border-collapse: collapse; }
                .invoice-table tr { page-break-inside: avoid; page-break-after: auto; }
                .invoice-table thead { display: table-header-group; }
                .invoice-table tfoot { display: table-footer-group; }
                .invoice-header { page-break-inside: avoid; }
              }
            `}</style>

            {/* Header */}
            <div className="invoice-header flex items-start justify-between mb-3">
              <div>
                <div className="text-xl font-bold">{order.shop_name || 'Shop'}</div>
                <div className="text-xs text-gray-600">Order Date: {order.order_date ? new Date(order.order_date).toLocaleDateString('en-IN') : '-'}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold tracking-wide">ORDER INVOICE</div>
                <div className="text-sm"><span className="font-medium">Order ID:</span> <span className="font-mono">{order.order_id}</span></div>
                <div className="text-sm"><span className="font-medium">Invoice Date:</span> {new Date().toLocaleDateString('en-IN')}</div>
              </div>
            </div>
            <hr className="my-3" />

            {/* Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-3 text-sm">
              <div>
                <div className="font-semibold mb-1">Billed To:</div>
                <div>{order.billing_address_details?.address_line1 || order.shipping_address_details?.address_line1 || '-'}</div>
                <div>
                  {(order.billing_address_details?.city || order.shipping_address_details?.city || '')}
                  {order.billing_address_details?.postal_code || order.shipping_address_details?.postal_code ? `, ${order.billing_address_details?.postal_code || order.shipping_address_details?.postal_code}` : ''}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">Shipped To:</div>
                <div>{order.shipping_address_details?.address_line1 || '-'}</div>
                <div>
                  {order.shipping_address_details?.city || ''}
                  {order.shipping_address_details?.postal_code ? `, ${order.shipping_address_details.postal_code}` : ''}
                </div>
              </div>
            </div>

            {/* Info Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm border border-gray-300 rounded">
              <div className="px-3 py-2"><span className="font-medium uppercase text-gray-700">Order Date:</span> {order.order_date ? new Date(order.order_date).toLocaleDateString('en-IN') : '-'}</div>
              <div className="px-3 py-2"><span className="font-medium uppercase text-gray-700">Payment Method:</span> {(order.payment_method || '').toString().replaceAll('_', ' ') || '-'}</div>
              <div className="px-3 py-2"><span className="font-medium uppercase text-gray-700">Shipping Method:</span> {order.shipping_method_name || '-'}</div>
            </div>

            {/* Items Table - Strong borders, shaded header, aligned cells */}
            <table className="w-full text-sm mb-4 border-collapse invoice-table" style={{ border: '2px solid #111827' }}>
              <thead style={{ backgroundColor: '#f3f4f6' }}>
                <tr>
                  <th className="text-left px-2 py-2" style={{ borderRight: '1px solid #111827', borderBottom: '1px solid #111827', width: '4%' }}>#</th>
                  <th className="text-left px-2 py-2" style={{ borderRight: '1px solid #111827', borderBottom: '1px solid #111827', width: '56%' }}>Item Description</th>
                  <th className="text-center px-2 py-2" style={{ borderRight: '1px solid #111827', borderBottom: '1px solid #111827', width: '8%' }}>Qty</th>
                  <th className="text-right px-2 py-2" style={{ borderRight: '1px solid #111827', borderBottom: '1px solid #111827', width: '16%' }}>Unit Price</th>
                  <th className="text-right px-2 py-2" style={{ borderBottom: '1px solid #111827', width: '16%' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => {
                  const qty = Number(item.quantity || 0);
                  const unit = typeof item.price === 'number' ? item.price : Number(item.unit_price_inclusive_gst || 0);
                  const lineTotal = (typeof item.line_item_total_inclusive_gst === 'string' || typeof item.line_item_total_inclusive_gst === 'number')
                    ? Number(item.line_item_total_inclusive_gst as any)
                    : unit * qty;
                  return (
                    <tr key={idx}>
                      <td className="px-2 py-2 align-top" style={{ borderRight: '1px solid #111827', borderBottom: '1px solid #111827' }}>{idx + 1}</td>
                      <td className="px-2 py-2 align-top" style={{ borderRight: '1px solid #111827', borderBottom: '1px solid #111827' }}>
                        <div className="font-semibold leading-snug break-words">{item.name || item.product_name_at_purchase}</div>
                        {(item.sku || item.sku_at_purchase) && (
                          <div className="text-xs text-gray-600">SKU: {item.sku || item.sku_at_purchase}</div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center align-top" style={{ borderRight: '1px solid #111827', borderBottom: '1px solid #111827' }}>{qty}</td>
                      <td className="px-2 py-2 text-right align-top whitespace-nowrap" style={{ borderRight: '1px solid #111827', borderBottom: '1px solid #111827' }}>
                        {formatMoney(unit, curr)}
                      </td>
                      <td className="px-2 py-2 text-right align-top whitespace-nowrap" style={{ borderBottom: '1px solid #111827' }}>
                        {formatMoney(lineTotal, curr)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Tax Summary */}
            {taxSummary.length > 0 && (
              <div className="mb-4">
                <div className="font-medium mb-2">Tax Summary</div>
                <table className="w-full text-sm border-collapse invoice-table" style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                  <thead>
                    <tr>
                      <th className="text-left py-2 border-b">GST Rate</th>
                      <th className="text-right py-2 border-b">Taxable Value</th>
                      <th className="text-right py-2 border-b">GST Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxSummary.map((r) => (
                      <tr key={r.rate}>
                        <td className="py-2 border-b">{r.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}%</td>
                        <td className="py-2 border-b text-right">{order.currency} {r.taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 border-b text-right">{order.currency} {r.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 border-t font-medium">Total</td>
                      <td className="py-2 border-t text-right font-medium">{order.currency} {totalTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 border-t text-right font-medium">{order.currency} {totalGST.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="w-full flex justify-end">
              <table className="text-sm" style={{ minWidth: '320px' }}>
                <tbody>
                  <tr>
                    <td className="pr-4 py-1 text-right">Subtotal:</td>
                    <td className="py-1 text-right font-medium">{formatMoney(parseFloat(order.subtotal_amount ?? order.subtotal ?? totalTaxable), curr)}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1 text-right">Tax (included):</td>
                    <td className="py-1 text-right font-medium">{formatMoney(totalGST, curr)}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1 text-right">Shipping:</td>
                    <td className="py-1 text-right font-medium">{formatMoney(parseFloat(order.shipping_amount ?? order.shipping ?? 0), curr)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2}><hr className="my-2" /></td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1 text-right font-semibold">Grand Total:</td>
                    <td className="py-1 text-right font-extrabold">{formatMoney(totalAmt, curr)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount in Words (INR) */}
            {String(curr).toUpperCase() === 'INR' && (
              <div className="mt-2 text-sm"><span className="font-medium">Amount in Words:</span> {amountInWordsINR(totalAmt)}</div>
            )}

            <hr className="my-4" />
            {/* Footer note */}
            <div className="text-xs text-gray-600 text-center">
              <div>Thank you for your business!</div>
              <div>This is a computer-generated invoice and does not require a signature.</div>
            </div>
          </div>
        );
      })()}
    </>
  );
};

export default OrderManagementPage; 