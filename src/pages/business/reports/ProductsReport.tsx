import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../../hooks/useAmazonTranslate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Stat {
  label: string;
  value: string;
  change: string;
}

interface DailySalesData {
  date: string;
  quantity: number;
  wishlisted: number;
}

interface TopProduct {
  name: string;
  sold: number;
  revenue: string;
}

interface MostViewedProduct {
  name: string;
  views: number;
  conversion: string;
}

const ProductsReport = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [dailySales, setDailySales] = useState<DailySalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [mostViewed, setMostViewed] = useState<MostViewedProduct[]>([]);
  const { accessToken } = useAuth();
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();
  const [tProdNames, setTProdNames] = useState<Record<string, string>>({});


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };


  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dashboard summary
      const summaryRes = await fetch(`${API_BASE_URL}/api/merchant-dashboard/reports/product/dashboard-summary`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!summaryRes.ok) throw new Error('Failed to fetch dashboard summary');
      const summaryData = await summaryRes.json();
      if (summaryData.status === 'success') {
        setStats(summaryData.data);
      }

      // Daily sales
      const dailyRes = await fetch(`${API_BASE_URL}/api/merchant-dashboard/reports/product/daily-sales`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!dailyRes.ok) throw new Error('Failed to fetch daily sales');
      const dailyData = await dailyRes.json();
      if (dailyData.status === 'success') {
        setDailySales(dailyData.data);
        if (dailyData.data.length > 0) {
          setDateRange({ start: dailyData.data[0].date, end: dailyData.data[dailyData.data.length - 1].date });
        }
      }

      // Top selling products
      const topRes = await fetch(`${API_BASE_URL}/api/merchant-dashboard/reports/product/top-selling-products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!topRes.ok) throw new Error('Failed to fetch top selling products');
      const topData = await topRes.json();
      if (topData.status === 'success') {
        setTopProducts(topData.data);
      }

      // Most viewed products
      const viewedRes = await fetch(`${API_BASE_URL}/api/merchant-dashboard/reports/product/most-viewed-products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!viewedRes.ok) throw new Error('Failed to fetch most viewed products');
      const viewedData = await viewedRes.json();
      if (viewedData.status === 'success') {
        setMostViewed(viewedData.data);
      }
    } catch (error) {
      setError('Failed to load product report data. Please try again later.');
      toast.error('Failed to load product report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Translate product names for display in lists
  useEffect(() => {
    const run = async () => {
      const lang = i18n.language || 'en';
      const items: { id: string; text: string }[] = [];
      topProducts.forEach((p, idx) => p.name && items.push({ id: `tp:${idx}`, text: p.name }));
      mostViewed.forEach((p, idx) => p.name && items.push({ id: `mv:${idx}`, text: p.name }));
      if (!items.length) {
        setTProdNames({});
        return;
      }
      try {
        const res = await translateBatch(items, lang, 'text/plain');
        const map: Record<string, string> = {};
        items.forEach(({ id, text }) => { if (res[id]) map[text] = res[id]; });
        setTProdNames(map);
      } catch {
        // fail open
      }
    };
    run();
  }, [topProducts, mostViewed, i18n.language, translateBatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">
          <ArrowPathIcon className="h-12 w-12" />
        </div>
        <p className="text-xl font-semibold text-gray-800">Error</p>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-primary-50">
      {/* Header with date range */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-600 drop-shadow-sm tracking-tight">Products Report</h1>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 border border-primary-600 rounded-lg text-sm text-white font-semibold shadow-md hover:bg-primary-700 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>{dateRange.start}</span>
            <span>to</span>
            <span>{dateRange.end}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-semibold text-black mt-1">{stat.value}</p>
            <p className={`text-sm mt-2 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {stat.change} vs last period
            </p>
          </div>
        ))}
      </div>

      {/* Products Sold Over Time Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-medium text-black mb-4">Products Sold Over Time</h2>
        <div className="overflow-x-auto">
          <div className="h-80 min-w-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="quantity"
                  stroke="#1800AC"
                  fill="#1800AC"
                  name="Quantity Sold"
                />
                <Line
                  type="monotone"
                  dataKey="wishlisted"
                  stroke="#40a9a0"
                  fill="#40a9a0"
                  name="Wishlisted"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-black mb-4">Top Selling Products</h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{tProdNames[product.name] || product.name}</span>
                <div className="text-right">
                  <span className="font-medium text-black">{product.sold} sold</span>
                  <span className="text-gray-500 ml-2">({formatCurrency(Number(product.revenue.replace(/[^0-9.-]+/g, '')))})</span>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <div className="text-gray-400">No data</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-black mb-4">Most Viewed Products</h2>
          <div className="space-y-4">
            {mostViewed.map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{tProdNames[product.name] || product.name}</span>
                <div className="text-right">
                  <span className="font-medium text-black">{product.views} views</span>
                  <span className="text-gray-500 ml-2">({product.conversion})</span>
                </div>
              </div>
            ))}
            {mostViewed.length === 0 && <div className="text-gray-400">No data</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsReport; 