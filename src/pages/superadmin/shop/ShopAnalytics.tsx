import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Download } from 'lucide-react';
import ExportModal from '../../../components/business/reports/ExportModal';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

const CHART_COLORS = {
  primary: '#1800AC',
  secondary: '#2DD4BF',
  tertiary: '#A855F7',
  quaternary: '#3B82F6',
  fifth: '#FFD600',
  sixth: '#00E676',
  seventh: '#651FFF',
  eighth: '#1800AC',
};
const PIE_COLORS = [
  '#34D399', // green
  '#6EE7B7', // light green
  '#FFD600', // yellow
  '#7C3AED', // purple
  '#00E676', // bright green
  '#1800AC', // orange
  '#A855F7', // violet
  '#3B82F6', // blue
];

// Real data will be fetched from backend; remove static demo.

const SHOP_LIST = [
  { id: '1', name: 'Shop 1' },
  { id: '2', name: 'Shop 2' },
  { id: '3', name: 'Shop 3' },
  { id: '4', name: 'Shop 4' },
];

// Dynamic year/month filters up to the current month of the current year
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const ShopAnalytics: React.FC = () => {
  const { accessToken } = useAuth();
  const [selectedShop, setSelectedShop] = useState<string>("");
  // Defaults to current year and month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-based
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_NAMES[currentMonthIdx]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{ revenue: number; total_sold: number; top_product: string | null; top_category: string | null; average_order_value: number; } | null>(null);
  const [trend, setTrend] = useState<Array<{ month: string; revenue: number }>>([]);
  const [productSales, setProductSales] = useState<Array<{ name: string; sold: number }>>([]);
  const [categoryDist, setCategoryDist] = useState<Array<{ name: string; value: number }>>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

  const monthNameToNumber = (name: string): number => {
    const idx = MONTH_NAMES.findIndex(m => m === name);
    return idx >= 0 ? idx + 1 : 1;
  };

  // Build dynamic options
  const yearOptions = useMemo(() => {
    // Allow selection from year 2000 up to current year (desc)
    const startYear = 2000;
    const years: number[] = [];
    for (let y = currentYear; y >= startYear; y--) years.push(y);
    return years;
  }, [currentYear]);

  const monthOptions = useMemo(() => {
    // If current year selected, limit months up to current month (inclusive)
    if (selectedYear === currentYear) return MONTH_NAMES.slice(0, currentMonthIdx + 1);
    return MONTH_NAMES;
  }, [selectedYear, currentYear, currentMonthIdx]);

  const authHeaders = useMemo(() => (
    {
      'Accept': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    }
  ), [accessToken]);

  useEffect(() => {
    if (!selectedShop) {
      setSummary(null);
      setTrend([]);
      setCategoryDist([]);
      setProductSales([]);
      return;
    }
    const controller = new AbortController();
    const shop_id = Number(selectedShop);
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/api/superadmin/shop-analytics/summary?shop_id=${shop_id}&months=6`, { headers: authHeaders, credentials: 'include', signal: controller.signal }).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/superadmin/shop-analytics/revenue-trend?shop_id=${shop_id}&months=6`, { headers: authHeaders, credentials: 'include', signal: controller.signal }).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/superadmin/shop-analytics/category-distribution?shop_id=${shop_id}&months=6`, { headers: authHeaders, credentials: 'include', signal: controller.signal }).then(r => r.json()),
    ]).then(([summaryRes, trendRes, catRes]) => {
      if (summaryRes.status !== 'success') throw new Error('Failed to load summary');
      if (trendRes.status !== 'success') throw new Error('Failed to load trend');
      if (catRes.status !== 'success') throw new Error('Failed to load categories');
      setSummary(summaryRes.data);
      const trendData = (trendRes.data?.trend || []).map((d: any) => ({ month: d.month, revenue: d.revenue }));
      setTrend(trendData);
      const cats = (catRes.data?.categories || []).map((c: any) => ({ name: c.name, value: c.value }));
      setCategoryDist(cats);
    }).catch((e) => {
      console.error(e);
      toast.error(e?.message || 'Failed to load analytics');
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedShop, API_BASE_URL, authHeaders]);

  useEffect(() => {
    if (!selectedShop) return;
    const controller = new AbortController();
    const shop_id = Number(selectedShop);
    const year = selectedYear;
    const month = monthNameToNumber(selectedMonth);
    fetch(`${API_BASE_URL}/api/superadmin/shop-analytics/product-sales?shop_id=${shop_id}&year=${year}&month=${month}&limit=10`, { headers: authHeaders, credentials: 'include', signal: controller.signal })
      .then(r => r.json())
      .then(res => {
        if (res.status !== 'success') throw new Error('Failed to load product sales');
        setProductSales(res.data || []);
      })
      .catch(e => {
        console.error(e);
        toast.error(e?.message || 'Failed to load product sales');
      });
    return () => controller.abort();
  }, [selectedShop, selectedYear, selectedMonth, API_BASE_URL, authHeaders]);

  // Calculate total for categoryDist for percentage
  const totalCategories = categoryDist.reduce((sum: number, c: { name: string; value: number }) => sum + c.value, 0);

  // For demo: filter productSales by selected year/month (static, so just show all or a subset)
  const filteredProductSales = productSales;

  const handleExportReport = async (format: string) => {
    if (!selectedShop) {
      toast.error('Please select a shop first');
      return;
    }

    try {
      setIsExporting(true);
      
      const month = monthNameToNumber(selectedMonth);
      const response = await fetch(`${API_BASE_URL}/api/superadmin/shop-analytics/export?shop_id=${Number(selectedShop)}&year=${selectedYear}&month=${month}&format=${format}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export report');
      }

      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
  let filename = `shop_${selectedShop}_analytics_${selectedYear}_${selectedMonth}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

  toast.success(`Shop ${selectedShop} analytics exported as ${format.toUpperCase()}`);
      setIsExportModalOpen(false);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 sm:p-6 rounded-xl shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Shop Analytics</h1>
          <span className="text-base sm:text-lg font-medium">Overview & Insights</span>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          disabled={!selectedShop}
          className="flex items-center gap-2 bg-white text-primary-800 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          Export Report
        </button>
      </div>

      {/* Shop Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <label className="text-gray-700 font-semibold text-sm sm:text-base">Select Shop:</label>
        <select
          className="p-2 rounded border border-gray-300 focus:ring-2 focus:ring-gray-400 w-full sm:w-auto min-w-[200px]"
          value={selectedShop}
          onChange={e => setSelectedShop(e.target.value)}
        >
          <option value="">-- Choose Shop --</option>
          {SHOP_LIST.map(shop => (
            <option key={shop.id} value={shop.id}>{shop.name}</option>
          ))}
        </select>
      </div>

      {/* Key Metrics Card */}
      {selectedShop && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm flex flex-col items-center">
            <span className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 text-center">{summary.top_product || '-'}</span>
            <span className="text-gray-700 text-sm sm:text-base text-center">Top Selling Product</span>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm flex flex-col items-center">
            <span className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">₹{(summary.revenue || 0).toLocaleString()}</span>
            <span className="text-gray-700 text-sm sm:text-base text-center">Total Revenue</span>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm flex flex-col items-center">
            <span className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 text-center">{summary.top_category || '-'}</span>
            <span className="text-gray-700 text-sm sm:text-base text-center">Top Selling Category</span>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm flex flex-col items-center">
            <span className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">{summary.total_sold || 0}</span>
            <span className="text-gray-700 text-sm sm:text-base text-center">Total Products Sold</span>
          </div>
        </div>
      )}

      {/* Analytics Content */}
      {selectedShop && summary ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8">
            {/* Revenue Trend Line Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow flex flex-col items-center min-h-[300px] sm:min-h-[350px]">
              <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 self-start">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={200} className="sm:h-[220px]">
                <LineChart data={trend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke={CHART_COLORS.primary} strokeWidth={3} activeDot={{ r: 8 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Product Sales Bar Chart with filters */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow flex flex-col items-center min-h-[300px] sm:min-h-[350px] w-full">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-2 w-full justify-between items-start sm:items-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Products Sold</h3>
                <div className="flex gap-2 items-center w-full sm:w-auto">
                  <select
                    className="p-1 rounded border border-gray-300 focus:ring-2 focus:ring-gray-400 text-sm flex-1 sm:flex-none"
                    value={selectedYear}
                    onChange={e => {
                      const newYear = Number(e.target.value);
                      setSelectedYear(newYear);
                      // If switching to current year and selected month is beyond now, clamp to current month
                      if (newYear === currentYear) {
                        const selIdx = MONTH_NAMES.findIndex(m => m === selectedMonth);
                        if (selIdx > currentMonthIdx || selIdx === -1) setSelectedMonth(MONTH_NAMES[currentMonthIdx]);
                      } else {
                        // For past years, ensure selectedMonth is valid option
                        if (!MONTH_NAMES.includes(selectedMonth as any)) setSelectedMonth('Jan');
                      }
                    }}
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <select
                    className="p-1 rounded border border-gray-300 focus:ring-2 focus:ring-gray-400 text-sm flex-1 sm:flex-none"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                  >
                    {monthOptions.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200} className="sm:h-[220px]">
                <BarChart data={filteredProductSales} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={false} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sold" fill={CHART_COLORS.secondary} name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Categories Pie Chart with Legend */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow flex flex-col lg:flex-row items-center mt-6 sm:mt-8 gap-6">
            <div className="flex-1 flex flex-col items-center w-full">
              <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 self-start">Product Categories</h3>
              <ResponsiveContainer width="100%" height={240} className="max-w-[320px]">
                <PieChart>
                  <Pie
                    data={categoryDist}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryDist.map((_: { name: string; value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => `${v} products`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend with scroll */}
            <div className="flex-1 flex flex-col items-start justify-center w-full lg:pl-8 max-h-[260px] overflow-y-auto">
              {categoryDist.map((cat: { name: string; value: number }, idx: number) => {
                const percent = totalCategories ? ((cat.value / totalCategories) * 100) : 0;
                return (
                  <div key={cat.name} className="flex items-center mb-3 sm:mb-4 bg-gray-50 rounded-lg px-3 sm:px-4 py-2 w-full">
                    <span className="inline-block w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                    <div className="flex flex-col sm:flex-row sm:items-center w-full min-w-0">
                      <span className="font-semibold text-gray-900 mr-2 text-sm sm:text-base truncate">{cat.name}</span>
                      <span className="text-gray-500 mr-2 text-xs sm:text-sm">{cat.value} products</span>
                      <span className="font-bold text-gray-800 ml-auto text-sm sm:text-base">{percent.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-8">{loading ? 'Loading analytics…' : 'Please select a shop to view analytics.'}</div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportReport}
        isExporting={isExporting}
      />
    </div>
  );
};

export default ShopAnalytics; 