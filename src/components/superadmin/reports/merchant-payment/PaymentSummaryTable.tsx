import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaEye } from 'react-icons/fa';

interface PaymentSummary {
  id: string;
  merchantName: string;
  storeId: string;
  totalOrders: number;
  ordersDelivered: number;
  eligibleForPayment: number;
  amountTransferred: number;
  pendingAmount: number;
  lastPaymentDate: string;
  status: string;
  orders: Order[];
}

interface Order {
  orderId: string;
  productName: string;
  deliveryDate: string;
  orderAmount: number;
  commission: number;
  netAmount: number;
  paymentStatus: 'pending' | 'transferred';
}

interface PaymentSummaryTableProps {
  data: PaymentSummary[];
  onViewOrder: (orderId: string) => void;
}

const PaymentSummaryTable: React.FC<PaymentSummaryTableProps> = ({ data, onViewOrder }) => {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleRow = (merchantId: string) => {
    setExpandedRows(prev =>
      prev.includes(merchantId)
        ? prev.filter(id => id !== merchantId)
        : [...prev, merchantId]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-primary-100 text-primary-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Mobile card view for merchant data
  const MerchantCard = ({ merchant }: { merchant: PaymentSummary }) => (
    <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900">{merchant.merchantName}</h3>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusStyle(merchant.status)}`}>
              {merchant.status}
            </span>
          </div>
          <p className="text-sm text-primary-500">ID: {merchant.storeId}</p>
        </div>
        <button
          onClick={() => toggleRow(merchant.id)}
          className="text-primary-500 hover:text-primary-700 transition-colors p-2"
        >
          {expandedRows.includes(merchant.id) ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="font-medium">{merchant.totalOrders}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Delivered</p>
          <p className="font-medium">{merchant.ordersDelivered}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Amount Transferred</p>
          <p className="font-medium text-green-600">₹{merchant.amountTransferred.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Pending Amount</p>
          <p className="font-medium text-red-600">₹{merchant.pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      {expandedRows.includes(merchant.id) && (
        <div className="mt-4 border-t border-primary-100 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Order Details</h4>
          <div className="space-y-4">
            {merchant.orders.map((order) => (
              <div key={order.orderId} className="bg-primary-50/30 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">{order.orderId}</span>
                  <button
                    onClick={() => onViewOrder(order.orderId)}
                    className="text-primary-500 hover:text-primary-700"
                  >
                    <FaEye />
                  </button>
                </div>
                <p className="text-sm mb-2">{order.productName}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium">₹{order.orderAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Net Amount</p>
                    <p className="font-medium">₹{order.netAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Delivery Date</p>
                    <p className="font-medium">{order.deliveryDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      order.paymentStatus === 'transferred' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-primary-100 text-primary-800'
                    }`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Mobile View */}
      <div className="block lg:hidden">
        {data.map((merchant) => (
          <MerchantCard key={merchant.id} merchant={merchant} />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden border border-primary-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primary-200">
            <thead className="bg-primary-50 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider"></th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Merchant</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Total Orders</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Orders Delivered</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Eligible for Payment</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Amount Transferred</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Pending Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Last Payment</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-100">
              {data.map((merchant) => (
                <React.Fragment key={merchant.id}>
                  <tr className="hover:bg-primary-50/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleRow(merchant.id)}
                        className="text-primary-500 hover:text-primary-700 transition-colors"
                      >
                        {expandedRows.includes(merchant.id) ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{merchant.merchantName}</div>
                      <div className="text-sm text-primary-500">ID: {merchant.storeId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(merchant.status)}`}>
                        {merchant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{merchant.totalOrders}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{merchant.ordersDelivered}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{merchant.eligibleForPayment}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">₹{merchant.amountTransferred.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-red-600">₹{merchant.pendingAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{merchant.lastPaymentDate}</td>
                  </tr>
                  {expandedRows.includes(merchant.id) && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 bg-primary-50/30">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-primary-200">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Delivery Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Order Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Commission</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Net Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-primary-100">
                              {merchant.orders.map((order) => (
                                <tr key={order.orderId} className="hover:bg-primary-50/50 transition-colors duration-150">
                                  <td className="px-6 py-4 text-sm text-gray-900">{order.orderId}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900">{order.productName}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{order.deliveryDate}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900">₹{order.orderAmount.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900">₹{order.commission.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900">₹{order.netAmount.toLocaleString()}</td>
                                  <td className="px-6 py-4">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      order.paymentStatus === 'transferred' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-primary-100 text-primary-800'
                                    }`}>
                                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <button
                                      onClick={() => onViewOrder(order.orderId)}
                                      className="text-primary-500 hover:text-primary-700 transition-colors"
                                    >
                                      <FaEye />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummaryTable; 