import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, Filter, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ExportModal from '../../components/business/reports/ExportModal';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Update the COLORS constant
const CHART_COLORS = {
  primary: '#1800AC',
  secondary: '#2DD4BF',
  tertiary: '#A855F7',
  quaternary: '#3B82F6',
  background: '#F2F0FF'
};

interface TrendData {
  month: string;
  revenue: number;
  orders: number;
  average_order_value: number;
}

interface TrendResponse {
  status: string;
  data: {
    trend: TrendData[];
    summary: {
      total_revenue: number;
      total_orders: number;
      average_order_value: number;
      currency: string;
    };
  };
  message?: string;
}

interface MerchantPerformance {
      name: string;
      revenue: number;
  orders: number;
  rating: number;
  product_count: number;
  review_count: number;
  revenue_per_product: number;
  orders_per_product: number;
  reviews_per_product: number;
}

interface MerchantResponse {
  status: string;
  data: {
    merchants: MerchantPerformance[];
    summary: {
      total_merchants: number;
      total_revenue: number;
      total_orders: number;
      average_rating: number;
      total_products: number;
      total_reviews: number;
    };
  };
  message?: string;
}

interface CategoryDistribution {
  name: string;
  value: number;
  count: number;
}

interface CategoryResponse {
  status: string;
  data: {
    categories: CategoryDistribution[];
    total_products: number;
  };
  message?: string;
}

export default function SalesReport() {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [merchantData, setMerchantData] = useState<MerchantPerformance[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
    currency: string;
  } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { accessToken, user } = useAuth();

  // Remove the manual calculations since we'll use the summary data
  const totalRevenue = summaryData?.total_revenue || 0;
  const totalSales = summaryData?.total_orders || 0;
  const averageOrderValue = summaryData?.average_order_value || 0;

  const fetchData = async () => {
    if (!user || !['admin', 'superadmin'].includes(user.role.toLowerCase())) {
      toast.error('Access denied. Admin role required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Fetch revenue and orders trend
      const trendResponse = await fetch(`${API_BASE_URL}/api/superadmin/analytics/revenue-orders-trend`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const trendData = await trendResponse.json() as TrendResponse;
      if (trendData.status === 'success') {
        setTrendData(trendData.data.trend);
        setSummaryData(trendData.data.summary);
      }

      // Fetch merchant performance details
      const merchantResponse = await fetch(`${API_BASE_URL}/api/superadmin/analytics/merchant-performance-details`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const merchantData = await merchantResponse.json() as MerchantResponse;
      if (merchantData.status === 'success') {
        setMerchantData(merchantData.data.merchants);
      }

      // Fetch category distribution
      const categoryResponse = await fetch(`${API_BASE_URL}/api/superadmin/analytics/category-distribution`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const categoryData = await categoryResponse.json() as CategoryResponse;
      if (categoryData.status === 'success') {
        setCategoryData(categoryData.data.categories);
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error fetching data:', err);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, accessToken]);

  // Handle data refresh
  const refreshData = () => {
    fetchData();
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: summaryData?.currency || 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleExportReport = async (format: string) => {
    try {
      setIsExporting(true);
      
      const response = await fetch(`${API_BASE_URL}/api/analytics/superadmin/analytics/export-sales-report?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': '*/*'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export report');
      }

      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `sales_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      
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

      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
      setIsExportModalOpen(false);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-full mx-auto">
        {/* Header with updated styling */}
        <div className="bg-white rounded-lg shadow-lg mb-8 p-6" style={{background: 'linear-gradient(135deg, #1800AC 0%, #3B1EEB 100%)'}}>
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Sales Performance Report</h1>
            <div className="flex space-x-4">
              <button 
                onClick={refreshData}
                className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-white/80 transition-all duration-300 group border border-primary-600"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                Refresh Data
              </button>
              <button 
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-all duration-300 border border-primary-600"
              >
                <Download className="w-5 h-5" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards with enhanced styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4" style={{borderLeftColor: '#1800AC'}}>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Revenue</h3>
            <div className="flex items-end">
              <p className="text-2xl font-bold" style={{color: '#1800AC'}}>{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4" style={{borderLeftColor: '#1800AC'}}>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Sales</h3>
            <div className="flex items-end">
              <p className="text-2xl font-bold" style={{color: '#1800AC'}}>{totalSales.toLocaleString()}</p>
              <p className="text-sm text-gray-500 ml-2 mb-1">units</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4" style={{borderLeftColor: '#1800AC'}}>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Average Order Value</h3>
            <div className="flex items-end">
              <p className="text-2xl font-bold" style={{color: '#1800AC'}}>{formatCurrency(averageOrderValue)}</p>
            </div>
          </div>
        </div>

        {/* Revenue and Sales Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-lg font-medium mb-4" style={{color: '#1800AC'}}>Revenue & Sales Trend</h2>
          <div className="overflow-x-auto">
            <div className="h-72 min-w-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [
    name === 'revenue' ? formatCurrency(Number(value)) : value.toLocaleString(), 
                    name === 'revenue' ? 'Revenue' : 'Orders'
  ]} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.primary} strokeWidth={3} activeDot={{ r: 8, fill: CHART_COLORS.primary }} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke={CHART_COLORS.secondary} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-lg font-medium mb-4" style={{color: '#1800AC'}}>Revenue by Category</h2>
            <div className="h-80" style={{ 
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              outline: 'none'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                  data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      outline: 'none'
                    }}
                  >
                  {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={Object.values(CHART_COLORS)[index % 4]}
                        style={{ 
                          WebkitTapHighlightColor: 'transparent',
                          outline: 'none'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        const categoryIndex = categoryData.findIndex(item => item.name === data.name);
                        const color = Object.values(CHART_COLORS)[categoryIndex % 4];
                        const value = typeof data.value === 'number' ? data.value : 0;
                        const percentage = (value / categoryData.reduce((sum, item) => sum + item.value, 0) * 100).toFixed(1);
                        
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p style={{ color: color, fontWeight: 'bold' }}>
                              {data.name} ({percentage}%)
                            </p>
                            <p className="text-gray-600">
                              Revenue: {formatCurrency(value)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
          </div>
        </div>

        {/* Merchant Performance Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-medium mb-4" style={{color: '#1800AC'}}>Merchant Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead style={{backgroundColor: '#1800AC'}}>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Merchant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Orders
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Products
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Reviews
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {merchantData && merchantData.length > 0 ? (
                  merchantData.map((merchant, idx) => (
                    <tr key={merchant.name || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                        {merchant.name || 'Unknown Merchant'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(merchant.revenue || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(merchant.orders || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(merchant.product_count || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(merchant.review_count || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            (merchant.rating || 0) >= 4.5 ? 'bg-green-500' : 
                            (merchant.rating || 0) >= 4.0 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                          {(merchant.rating || 0).toFixed(1)}
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      {isLoading ? 'Loading merchant data...' : 'No merchant data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {isLoading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{borderColor: '#1800AC'}}></div>
              <span className="ml-2 text-gray-500">Loading data...</span>
            </div>
          )}
        </div>

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExportReport}
          isExporting={isExporting}
        />
      </div>
    </div>
  );
}