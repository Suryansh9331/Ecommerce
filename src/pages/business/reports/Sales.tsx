import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import ExportModal from '../../../components/business/reports/ExportModal';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../../hooks/useAmazonTranslate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface MonthlySalesData {
  month: string;
  revenue: number;
  units: number;
}

interface DetailedSalesData {
  month: string;
  product: string;
  category: string;
  price: number;
  quantity: number;
  revenue: number;
}

interface ProductPerformance {
  name: string;
  revenue: number;
}

interface CategoryData {
  name: string;
  value: string;
}

interface MerchantPerformance {
  total_sales: {
    value: number;
  };
  total_orders: {
    value: number;
  };
  average_order_value: {
    value: number;
  };
}

const Sales = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlySalesData[]>([]);
  const [detailedSalesData, setDetailedSalesData] = useState<DetailedSalesData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [merchantPerformance, setMerchantPerformance] = useState<MerchantPerformance | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { accessToken } = useAuth();
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();

  // Display-only translation maps
  const [tProductNames, setTProductNames] = useState<Record<string, string>>({});
  const [tCategoryNames, setTCategoryNames] = useState<Record<string, string>>({});
  const [tMonthLabels, setTMonthLabels] = useState<Record<string, string>>({});

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

      // Fetch merchant performance data
      const merchantPerformanceResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/analytics/merchant-performance`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!merchantPerformanceResponse.ok) {
        throw new Error('Failed to fetch merchant performance data');
      }

      const merchantPerformanceData = await merchantPerformanceResponse.json();
      if (merchantPerformanceData.status === 'success') {
        setMerchantPerformance(merchantPerformanceData.data);
      }

      // Fetch monthly sales data
      const monthlyResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/reports/sales/monthly-sales`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!monthlyResponse.ok) {
        throw new Error('Failed to fetch monthly sales data');
      }

      const monthlyData = await monthlyResponse.json();
      if (monthlyData.status === 'success') {
        setMonthlyData(monthlyData.data);
      }

      // Fetch detailed sales data
      const detailedResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/reports/sales/sales-data`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!detailedResponse.ok) {
        throw new Error('Failed to fetch detailed sales data');
      }

      const detailedData = await detailedResponse.json();
      if (detailedData.status === 'success') {
        setDetailedSalesData(detailedData.data);
      }

      // Fetch product performance data
      const productPerformanceResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/reports/sales/product-performance`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!productPerformanceResponse.ok) {
        throw new Error('Failed to fetch product performance data');
      }

      const productPerformanceData = await productPerformanceResponse.json();
      if (productPerformanceData.status === 'success') {
        setProductPerformance(productPerformanceData.data);
      }

      // Fetch revenue by category data
      const categoryResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/reports/sales/revenue-by-category`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!categoryResponse.ok) {
        throw new Error('Failed to fetch category data');
      }

      const categoryData = await categoryResponse.json();
      if (categoryData.status === 'success') {
        setCategoryData(categoryData.data);
      }

    } catch (error) {
      console.error('Error fetching sales data:', error);
      setError('Failed to load sales data. Please try again later.');
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: string) => {
    try {
      setIsExporting(true);
      
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/reports/sales/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `sales_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
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

      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
      setIsExportModalOpen(false);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Translate dynamic labels when data or language changes
  useEffect(() => {
    const runTranslations = async () => {
      const lang = i18n.language || 'en';
      // Products (from productPerformance and detailedSalesData)
      const productItemsMap = new Map<string, string>();
      productPerformance.forEach((p, idx) => {
        if (p.name) productItemsMap.set(`pp:${idx}`, p.name);
      });
      detailedSalesData.forEach((d, idx) => {
        if (d.product) productItemsMap.set(`dsprod:${idx}`, d.product);
      });
      const productItems = Array.from(productItemsMap.entries()).map(([id, text]) => ({ id, text }));

      // Categories
      const catItemsMap = new Map<string, string>();
      categoryData.forEach((c, idx) => {
        if (c.name) catItemsMap.set(`cat:${idx}`, c.name);
      });
      detailedSalesData.forEach((d, idx) => {
        if (d.category) catItemsMap.set(`dscat:${idx}`, d.category);
      });
      const catItems = Array.from(catItemsMap.entries()).map(([id, text]) => ({ id, text }));

      // Months
      const monthItems = monthlyData.map((m, idx) => ({ id: `mon:${idx}`, text: m.month }));

      try {
        if (productItems.length) {
          const res = await translateBatch(productItems, lang, 'text/plain');
          const pMap: Record<string, string> = {};
          // Map back to original text keys for simple lookup by text value
          productItems.forEach(({ id, text }) => {
            if (res[id]) pMap[text] = res[id];
          });
          setTProductNames(pMap);
        } else {
          setTProductNames({});
        }

        if (catItems.length) {
          const res = await translateBatch(catItems, lang, 'text/plain');
          const cMap: Record<string, string> = {};
          catItems.forEach(({ id, text }) => {
            if (res[id]) cMap[text] = res[id];
          });
          setTCategoryNames(cMap);
        } else {
          setTCategoryNames({});
        }

        if (monthItems.length) {
          const res = await translateBatch(monthItems, lang, 'text/plain');
          const mMap: Record<string, string> = {};
          monthItems.forEach(({ id, text }) => {
            if (res[id]) mMap[text] = res[id];
          });
          setTMonthLabels(mMap);
        } else {
          setTMonthLabels({});
        }
      } catch {
        // fail open
      }
    };
    runTranslations();
  }, [i18n.language, productPerformance, detailedSalesData, categoryData, monthlyData, translateBatch]);

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

  // Calculate summary statistics
  const totalRevenue = merchantPerformance?.total_sales.value || 0;
  const totalUnits = merchantPerformance?.total_orders.value || 0;
  const averageOrderValue = merchantPerformance?.average_order_value.value || 0;

  // Define a color palette for up to 3 categories
  const pieColors = ['#1800AC', '#00E5BE', '#8B5CF6'];

  // Map categoryData to ensure value is a number and assign a color
  const pieChartData = categoryData.map((cat, idx) => ({
    ...cat,
    value: Number(cat.value),
    fill: pieColors[idx % pieColors.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-2 rounded shadow text-sm max-w-[250px]">
          <p className="font-semibold break-words whitespace-normal">
            {item.name}
          </p>
          <p className="text-primary-600">revenue : {item.revenue.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Product Performance BarChart
  const ProductPerformanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-2 rounded shadow text-sm max-w-[250px]">
          <p
            className="font-semibold break-words whitespace-normal"
            style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
          >
            {item.name}
          </p>
          <p className="text-primary-600">
            Revenue: {item.revenue?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Pie Chart - shows category name and percentage on hover
  const PieChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border text-sm">
          <p className="font-semibold text-gray-800 mb-1">{item.name}</p>
          <p className="text-primary-600 font-medium">{Number(item.value).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-primary-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-semibold">Sales Performance Report</h1>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-opacity-90"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh Data
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-600">Total Revenue</p>
          <p className="text-3xl font-semibold text-primary-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-600">Total Orders</p>
          <p className="text-3xl font-semibold text-primary-600">{totalUnits.toLocaleString()} <span className="text-gray-500 text-base">orders</span></p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-600">Average Order Value</p>
          <p className="text-3xl font-semibold text-primary-600">{formatCurrency(averageOrderValue)}</p>
        </div>
      </div>

      {/* Revenue & Sales Trend Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-primary-600 mb-4">Revenue & Sales Trend</h2>
        <div className="h-80 overflow-x-auto">
  <div className="min-w-[600px] h-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        
        {/* Month formatter added here */}
        <XAxis 
          dataKey="month" 
          tickFormatter={(m) => tMonthLabels[m] || m} 
        />
        
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          stroke="#1800AC"
          name="Revenue"
          dot={{ fill: '#1800AC' }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="units"
          stroke="#00E5BE"
          name="Units Sold"
          dot={{ fill: '#00E5BE' }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>

  </div>

      {/* Detailed Sales Data */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-xl font-semibold text-primary-600 p-6">Detailed Sales Data</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left">MONTH</th>
                <th className="px-6 py-3 text-left">PRODUCT</th>
                <th className="px-6 py-3 text-left">CATEGORY</th>
                <th className="px-6 py-3 text-right">PRICE</th>
                <th className="px-6 py-3 text-right">QUANTITY</th>
                <th className="px-6 py-3 text-right">REVENUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
        {detailedSalesData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
          <td className="px-6 py-4 text-gray-600">{tMonthLabels[item.month] || item.month}</td>
          <td className="px-6 py-4 font-medium text-gray-900">{tProductNames[item.product] || item.product}</td>
          <td className="px-6 py-4 text-gray-600">{tCategoryNames[item.category] || item.category}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(item.price)}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{item.quantity}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Performance and Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary-600">Product Performance</h2>
            <select className="border rounded-lg px-3 py-2 text-gray-600">
              <option>Sort by Revenue</option>
            </select>
          </div>
          <div className="h-80 overflow-x-auto">
            <div className="min-w-[600px] h-full"></div>
             <ResponsiveContainer width="100%" height="100%">
      <BarChart data={productPerformance.map(p => ({ ...p, name: tProductNames[p.name] || p.name }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tickFormatter={name =>
            name.length > 18 ? name.slice(0, 15) + '...' : name
          }
        />
        <YAxis />
        <Tooltip content={<ProductPerformanceTooltip />} />
        <Bar dataKey="revenue" fill="#1800AC" />
      </BarChart>
    </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Revenue by Category</h2>
          <div className="h-80 [&_.recharts-pie-sector]:outline-none [&_.recharts-pie-sector]:focus:outline-none [&_.recharts-pie-sector]:focus-visible:outline-none [&_.recharts-pie-sector]:active:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData.map(d => ({ ...d, name: tCategoryNames[d.name] || d.name }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={0}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={entry.fill}
                      stroke="none"
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieChartTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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

export default Sales; 