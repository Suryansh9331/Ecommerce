import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import AnalyticsCards from '../../../components/superadmin/reports/merchant-payment/AnalyticsCards';
import MerchantSearch from '../../../components/superadmin/reports/merchant-payment/MerchantSearch';
import PaymentSummaryTable from '../../../components/superadmin/reports/merchant-payment/PaymentSummaryTable';
import BulkPaymentModal from '../../../components/superadmin/reports/merchant-payment/BulkPaymentModal';
import OrderDetailsModal from '../../../components/superadmin/reports/merchant-payment/OrderDetailsModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface FilterOptions {
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface MerchantTransaction {
  id: number;
  order_id: string;
  merchant_id: number;
  order_amount: number;
  platform_fee_percent: number;
  platform_fee_amount: number;
  gst_on_fee_amount: number;
  payment_gateway_fee: number;
  final_payable_amount: number;
  payment_status: 'pending' | 'paid';
  settlement_date: string;
  created_at: string;
  updated_at: string;
  merchant?: {
    id: number;
    business_name: string;
    store_id: string;
    category: string;
  };
  order?: {
    order_id: string;
    order_date: string;
    total_amount: number;
  };
}

interface TransactionSummary {
  total_transactions: number;
  pending_transactions: number;
  paid_transactions: number;
  total_order_amount: number;
  total_platform_fees: number;
  total_payment_gateway_fees: number;
  total_gst: number;
  total_payable_to_merchants: number;
  pending_amount: number;
  paid_amount: number;
}

interface TransactionStatistics {
  total_transactions: number;
  total_order_amount: number;
  total_platform_fees: number;
  total_payment_gateway_fees: number;
  total_gst: number;
  total_payable: number;
  pending_amount: number;
  paid_amount: number;
  fee_distribution: {
    '5%': { count: number; amount: number };
    '4%': { count: number; amount: number };
    '3%': { count: number; amount: number };
    '2%': { count: number; amount: number };
  };
  status_distribution: {
    pending: number;
    paid: number;
  };
}

interface AnalyticsData {
  totalMerchants: number;
  totalTransferred: number;
  pendingPayouts: number;
  averagePayoutTime: number;
  payoutSuccessRate: number;
  merchantsWithPendingPayments: number;
  totalCommissionEarned: number;
  paymentTrends: {
    thisMonth: number;
    lastMonth: number;
  };
}

const MerchantPaymentReport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<MerchantTransaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalMerchants: 0,
    totalTransferred: 0,
    pendingPayouts: 0,
    averagePayoutTime: 0,
    payoutSuccessRate: 0,
    merchantsWithPendingPayments: 0,
    totalCommissionEarned: 0,
    paymentTrends: {
      thisMonth: 0,
      lastMonth: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [statistics, setStatistics] = useState<TransactionStatistics | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dateFrom) queryParams.append('from', filters.dateFrom);
      if (filters.dateTo) queryParams.append('to', filters.dateTo);

      const response = await fetch(`${API_BASE_URL}/api/superadmin/merchant-transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.dateFrom, filters.dateTo]);

  // Fetch transaction summary
  const fetchTransactionSummary = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.dateFrom) queryParams.append('from_date', filters.dateFrom);
      if (filters.dateTo) queryParams.append('to_date', filters.dateTo);

      const response = await fetch(`${API_BASE_URL}/api/superadmin/merchant-transactions/summary?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction summary');
      }

      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
    }
  }, [filters.dateFrom, filters.dateTo]);

  // Fetch transaction statistics
  const fetchTransactionStatistics = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.dateFrom) queryParams.append('from_date', filters.dateFrom);
      if (filters.dateTo) queryParams.append('to_date', filters.dateTo);

      const response = await fetch(`${API_BASE_URL}/api/superadmin/merchant-transactions/statistics?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction statistics');
      }

      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching transaction statistics:', error);
    }
  }, [filters.dateFrom, filters.dateTo]);

  // Calculate analytics from summary and statistics using useMemo
  const calculatedAnalytics = useMemo(() => {
    // Compute unique merchant counts from the transactions list to avoid miscounting by transaction volume
    const uniqueMerchants = new Set<number>(transactions.map(t => t.merchant_id));
    const pendingMerchantIds = new Set<number>(
      transactions.filter(t => t.payment_status === 'pending').map(t => t.merchant_id)
    );

    if (!summary || !statistics) {
      return {
        totalMerchants: uniqueMerchants.size,
        totalTransferred: 0,
        pendingPayouts: 0,
        averagePayoutTime: 3,
        payoutSuccessRate: 0,
        merchantsWithPendingPayments: pendingMerchantIds.size,
        totalCommissionEarned: 0,
        paymentTrends: {
          thisMonth: 0,
          lastMonth: 0
        }
      };
    }

    return {
      // Use unique merchant counts instead of transaction counts
      totalMerchants: uniqueMerchants.size,
      totalTransferred: summary.paid_amount,
      pendingPayouts: summary.pending_amount,
      averagePayoutTime: 3, // Placeholder
      payoutSuccessRate: statistics.total_transactions > 0
        ? Math.round((statistics.paid_amount / (statistics.paid_amount + statistics.pending_amount)) * 100)
        : 0,
      merchantsWithPendingPayments: pendingMerchantIds.size,
      totalCommissionEarned: summary.total_platform_fees + summary.total_payment_gateway_fees + summary.total_gst,
      paymentTrends: {
        thisMonth: summary.total_payable_to_merchants,
        lastMonth: summary.total_payable_to_merchants * 0.9
      }
    };
  }, [summary, statistics, transactions]);

  // Update analytics when calculatedAnalytics changes
  useEffect(() => {
    setAnalytics(calculatedAnalytics);
  }, [calculatedAnalytics]);

  // Initial data fetch - only run once
  useEffect(() => {
    fetchTransactions();
    fetchTransactionSummary();
    fetchTransactionStatistics();
  }, []); // Empty dependency array - only run on mount

  // Apply filters and search
  useEffect(() => {
    let filtered = transactions;

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.order_id.toLowerCase().includes(searchLower) ||
        String(transaction.merchant_id).toLowerCase().includes(searchLower) ||
        (transaction.merchant?.business_name?.toLowerCase().includes(searchLower)) ||
        (transaction.merchant?.store_id?.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(transaction => transaction.payment_status === filters.status);
    }

    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(transaction => {
        const settlementDate = new Date(transaction.settlement_date);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (fromDate && toDate) {
          return settlementDate >= fromDate && settlementDate <= toDate;
        } else if (fromDate) {
          return settlementDate >= fromDate;
        } else if (toDate) {
          return settlementDate <= toDate;
        }
        return true;
      });
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, filters, transactions]);

  // Refresh data when filters change - but only for date filters
  useEffect(() => {
    if (filters.dateFrom || filters.dateTo) {
      fetchTransactionSummary();
      fetchTransactionStatistics();
    }
  }, [filters.dateFrom, filters.dateTo, fetchTransactionSummary, fetchTransactionStatistics]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  const handleViewOrder = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setIsOrderModalOpen(true);
  }, []);

  // Support partial payouts per merchant by selecting transactions up to the specified amount
  const handleBulkPayment = useCallback(async (selections: { merchantId: string; amount: number }[]) => {
    try {
      setLoading(true);

      // 1) Initiate payouts through backend (Razorpay payouts stub)
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Missing auth token');

      const payoutsPayload = selections.map(s => ({
        merchant_id: Number(s.merchantId),
        amount: Math.round((s.amount || 0) * 100), // paise
        notes: { source: 'superadmin_bulk_payout' }
      })).filter(p => p.amount > 0);

      if (payoutsPayload.length === 0) {
        toast.error('Please enter valid payout amounts');
        setLoading(false);
        return;
      }

      const payoutResp = await fetch(`${API_BASE_URL}/api/razorpay/payouts/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ payouts: payoutsPayload })
      });

      if (!payoutResp.ok) {
        throw new Error('Failed to initiate payouts');
      }

      // 2) Build a list of transaction IDs to mark as paid based on amounts
      const transactionIdsToPay: number[] = [];

      // For each merchant selection, pick that merchant's pending transactions oldest first
      selections.forEach(({ merchantId, amount }) => {
        const mId = Number(merchantId);
        const pendingTxns = transactions
          .filter(t => t.merchant_id === mId && t.payment_status === 'pending')
          .sort((a, b) => new Date(a.settlement_date).getTime() - new Date(b.settlement_date).getTime());

        let remaining = amount;
        for (const t of pendingTxns) {
          if (remaining <= 0) break;
          const txnAmount = t.final_payable_amount;
          if (remaining >= txnAmount) {
            transactionIdsToPay.push(t.id);
            remaining -= txnAmount;
          } else {
            // Cannot partially pay a single transaction with current schema, stop before this one
            break;
          }
        }
      });

      if (transactionIdsToPay.length === 0) {
        toast.error('No transactions selected based on entered amounts');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/superadmin/merchant-transactions/bulk-mark-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_ids: transactionIdsToPay
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process bulk payments');
      }

      const result = await response.json();
      toast.success(`Successfully marked ${result.updated_count} transactions as paid`);
      
      // Refresh data
      await fetchTransactions();
      await fetchTransactionSummary();
      await fetchTransactionStatistics();
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error processing bulk payments:', error);
      toast.error('Failed to process bulk payments');
    } finally {
      setLoading(false);
    }
  }, [transactions, fetchTransactions, fetchTransactionSummary, fetchTransactionStatistics]);

  // Transform transactions to merchant format for the table
  const transformTransactionsToMerchants = useCallback(() => {
    const merchantMap = new Map<number, any>();

    filteredTransactions.forEach(transaction => {
      const merchantId = transaction.merchant_id;
      
      if (!merchantMap.has(merchantId)) {
        merchantMap.set(merchantId, {
          id: merchantId.toString(),
          merchantName: transaction.merchant?.business_name || `Merchant ${merchantId}`,
          storeId: transaction.merchant?.store_id || `STORE${merchantId}`,
          category: transaction.merchant?.category || 'general',
          totalOrders: 0,
          ordersDelivered: 0,
          eligibleForPayment: 0,
          amountTransferred: 0,
          pendingAmount: 0,
          lastPaymentDate: transaction.settlement_date,
          status: transaction.payment_status,
          orders: []
        });
      }

      const merchant = merchantMap.get(merchantId);
      merchant.totalOrders++;
      
      if (transaction.payment_status === 'paid') {
        merchant.amountTransferred += transaction.final_payable_amount;
        merchant.ordersDelivered++;
      } else {
        merchant.pendingAmount += transaction.final_payable_amount;
        merchant.eligibleForPayment++;
      }

      merchant.orders.push({
        orderId: transaction.order_id,
        productName: `Order ${transaction.order_id}`,
        deliveryDate: transaction.settlement_date,
        orderAmount: transaction.order_amount,
        commission: transaction.platform_fee_amount + transaction.payment_gateway_fee + transaction.gst_on_fee_amount,
        netAmount: transaction.final_payable_amount,
        paymentStatus: transaction.payment_status
      });
    });

    return Array.from(merchantMap.values());
  }, [filteredTransactions]);

  const eligiblePayments = useMemo(() => ({
    totalAmount: filteredTransactions
      .filter(t => t.payment_status === 'pending')
      .reduce((sum, t) => sum + t.final_payable_amount, 0),
    merchantCount: new Set(
      filteredTransactions
        .filter(t => t.payment_status === 'pending')
        .map(t => t.merchant_id)
    ).size
  }), [filteredTransactions]);

  if (loading && transactions.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading merchant payment data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-600 mb-2 sm:mb-3">
          Merchant Payment Report
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Track and manage merchant payments, view delivery status, and process eligible payments.
        </p>
      </div>

      <AnalyticsCards
        totalMerchants={analytics.totalMerchants}
        totalTransferred={analytics.totalTransferred}
        pendingPayouts={analytics.pendingPayouts}
        averagePayoutTime={analytics.averagePayoutTime}
        merchantsWithPendingPayments={analytics.merchantsWithPendingPayments}
        totalCommissionEarned={analytics.totalCommissionEarned}
        paymentTrends={analytics.paymentTrends}
      />

      <div className="flex flex-col gap-4 sm:gap-6 mb-6">
        <div className="w-full">
          <MerchantSearch
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={eligiblePayments.merchantCount === 0}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaMoneyBillWave className="text-xl" />
            <span>Transfer Eligible Payments</span>
          </button>
        </div>
      </div>

      <PaymentSummaryTable
        data={transformTransactionsToMerchants()}
        onViewOrder={handleViewOrder}
      />

      <BulkPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleBulkPayment}
        merchants={transformTransactionsToMerchants()}
      />
      <OrderDetailsModal
        orderId={selectedOrderId}
        open={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />
    </div>
  );
};

export default MerchantPaymentReport; 