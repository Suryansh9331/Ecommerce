import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Clock, TrendingUp, Users, BarChart2, RefreshCw, Loader2, Info, Download, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ExportModal from '../../components/business/reports/ExportModal';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define the types for our traffic data
interface AnalyticsData {
  hour_display: string;
  total_visits: number;
  unique_visitors: number;
  bounced_visits: number;
  conversions: number;
  bounce_rate: number;
  conversion_rate: number;
}

interface HourlyAnalytics extends AnalyticsData {
  hour: number;
}

interface DailyAnalytics extends AnalyticsData {
  date: string;
}

interface MonthlyAnalytics extends AnalyticsData {
  month: string;
}

interface ConversionRateData {
  overall: {
    total_visitors: number;
    total_purchases: number;
    conversion_rate: number;
  };
  monthly_breakdown: Array<{
    month: string;
    visitors: number;
    purchases: number;
    conversion_rate: number;
  }>;
  summary: {
    average_monthly_conversion: number;
    best_month: {
      month: string;
      conversion_rate: number;
    } | null;
    worst_month: {
      month: string;
      conversion_rate: number;
    } | null;
  };
}

interface AnalyticsResponse {
  status: string;
  data: {
    hourly_breakdown?: HourlyAnalytics[];
    daily_breakdown?: DailyAnalytics[];
    monthly_breakdown?: MonthlyAnalytics[];
    summary: {
      total_visits: number;
      total_unique_visitors: number;
      total_bounced_visits: number;
      total_conversions: number;
      overall_bounce_rate: number;
      overall_conversion_rate: number;
      peak_hours?: {
        most_visits: {
          hour: string;
          visits: number;
        };
        best_conversion: {
          hour: string;
          rate: number;
        };
      };
      peak_days?: {
        most_visits: {
          day: string;
          visits: number;
        };
        best_conversion: {
          day: string;
          rate: number;
        };
      };
      peak_months?: {
        most_visits: {
          month: string;
          visits: number;
        };
        best_conversion: {
          month: string;
          rate: number;
        };
      };
    };
  };
  message?: string;
}

const CHART_COLORS = {
  primary: '#1800AC',
  secondary: '#2DD4BF',
  tertiary: '#A855F7',
  quaternary: '#3B82F6',
  background: '#F2F0FF'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(2)}
            {entry.name.includes('Rate') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-lg bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  </div>
);

type TimeFilter = 'hourly' | 'daily' | 'monthly';

const TrafficAnalytics: React.FC = () => {
  const [hourlyData, setHourlyData] = useState<HourlyAnalytics[]>([]);
  const [dailyData, setDailyData] = useState<DailyAnalytics[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsResponse['data']['summary'] | null>(null);
  const [hourlySummary, setHourlySummary] = useState<AnalyticsResponse['data']['summary'] | null>(null);
  const [dailySummary, setDailySummary] = useState<AnalyticsResponse['data']['summary'] | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<AnalyticsResponse['data']['summary'] | null>(null);
  const [conversionData, setConversionData] = useState<ConversionRateData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('hourly');
  const [customDateRange, setCustomDateRange] = useState<{start: string, end: string} | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { accessToken, user } = useAuth();
  const [refreshCount, setRefreshCount] = useState<number>(0);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const buildParams = (baseParams: string = '') => {
        const params = new URLSearchParams(baseParams);
        if (customDateRange) {
          params.set('start_date', customDateRange.start);
          params.set('end_date', customDateRange.end);
        }
        return params.toString();
      };

      const [hourlyResponse, dailyResponse, monthlyResponse, conversionResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/superadmin/analytics/hourly?${buildParams('months=12')}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }),
        fetch(`${API_BASE_URL}/api/superadmin/analytics/daily?${buildParams('days=30')}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }),
        fetch(`${API_BASE_URL}/api/superadmin/analytics/monthly?${buildParams('months=12')}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }),
        fetch(`${API_BASE_URL}/api/superadmin/analytics/conversion-rate`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      ]);

      if (!hourlyResponse.ok || !dailyResponse.ok || !monthlyResponse.ok || !conversionResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [hourlyData, dailyData, monthlyData, conversionData] = await Promise.all([
        hourlyResponse.json(),
        dailyResponse.json(),
        monthlyResponse.json(),
        conversionResponse.json()
      ]);

      if (hourlyData.status === 'success' && dailyData.status === 'success' && 
          monthlyData.status === 'success' && conversionData.status === 'success') {
        
        // Format hourly data
        const formattedHourlyData = (hourlyData.data.hourly_breakdown || []).map((item: HourlyAnalytics) => ({
          ...item,
          hour_display: formatTimeDisplay(item.hour_display)
        }));
        
        // Format daily data (already formatted correctly from backend)
        const formattedDailyData = dailyData.data.daily_breakdown || [];
        
        // Format monthly data
        const formattedMonthlyData = (monthlyData.data.monthly_breakdown || []).map((item: MonthlyAnalytics) => ({
          ...item,
          hour_display: formatMonthDisplay(item.hour_display)
        }));
        

        setHourlyData(formattedHourlyData);
        setDailyData(formattedDailyData);
        setMonthlyData(formattedMonthlyData);
        
        // Store all summaries
        setHourlySummary(hourlyData.data.summary);
        setDailySummary(dailyData.data.summary);
        setMonthlySummary(monthlyData.data.summary);
        
        // Set the appropriate summary based on current time filter
        updateSummaryForTimeFilter();
        
        // Format conversion data monthly breakdown
        const formattedConversionData = {
          ...conversionData.data,
          monthly_breakdown: (conversionData.data.monthly_breakdown || []).map((month: any) => ({
            ...month,
            month: formatMonthDisplay(month.month)
          }))
        };
        setConversionData(formattedConversionData);
      } else {
        throw new Error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data. Please try again later.');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !['admin', 'superadmin'].includes(user.role.toLowerCase())) {
      toast.error('Access denied. Admin role required.');
      return;
    }
    fetchAnalyticsData();
  }, [user, refreshCount, customDateRange]);

  // Update summary when time filter changes
  useEffect(() => {
    updateSummaryForTimeFilter();
  }, [timeFilter, hourlySummary, dailySummary, monthlySummary]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDatePicker) {
        const target = event.target as Element;
        if (!target.closest('.date-picker-container')) {
          setShowDatePicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  const updateSummaryForTimeFilter = () => {
    switch (timeFilter) {
      case 'hourly':
        setSummary(hourlySummary);
        break;
      case 'daily':
        setSummary(dailySummary);
        break;
      case 'monthly':
        setSummary(monthlySummary);
        break;
      default:
        setSummary(hourlySummary);
    }
  };

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setCustomDateRange({ start: startDate, end: endDate });
    setShowDatePicker(false);
  };

  const clearDateRange = () => {
    setCustomDateRange(null);
  };

  const getDateRangeDisplay = () => {
    if (customDateRange) {
      const start = new Date(customDateRange.start).toLocaleDateString();
      const end = new Date(customDateRange.end).toLocaleDateString();
      return `${start} - ${end}`;
    }
    return null;
  };

  // Format time display for IST
  const formatTimeDisplay = (timeString: string) => {
    if (!timeString) return timeString;
    
    // If it's already in IST format, return as is
    if (timeString.includes('IST')) return timeString;
    
    // If it's in HH:MM format, add IST
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return `${timeString} IST`;
    }
    
    // If it's in HH:00 format, add IST
    if (timeString.match(/^\d{2}:00$/)) {
      return `${timeString} IST`;
    }
    
    return timeString;
  };

  // Format month display
  const formatMonthDisplay = (monthString: string) => {
    if (!monthString) return monthString;
    
    // If it's already formatted as "Month Year", return as is
    if (monthString.includes(' ') && !monthString.includes('-')) {
      return monthString;
    }
    
    // If it's in YYYY-MM format, convert to "Month YYYY"
    const monthMatch = monthString.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
      const year = monthMatch[1];
      const month = parseInt(monthMatch[2], 10);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[month - 1]} ${year}`;
    }
    
    return monthString;
  };

  // Date Range Picker Component
  const DateRangePicker = () => {
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');

    useEffect(() => {
      if (customDateRange) {
        setTempStartDate(customDateRange.start);
        setTempEndDate(customDateRange.end);
      }
    }, [customDateRange]);

    const handleApply = () => {
      if (tempStartDate && tempEndDate) {
        if (new Date(tempStartDate) <= new Date(tempEndDate)) {
          handleDateRangeChange(tempStartDate, tempEndDate);
        } else {
          toast.error('Start date must be before end date');
        }
      } else {
        toast.error('Please select both start and end dates');
      }
    };

    return (
      <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => setShowDatePicker(false)}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Get data based on selected time filter
  const getFilteredData = () => {
    switch (timeFilter) {
      case 'hourly':
        return hourlyData || [];
      case 'daily':
        return dailyData || [];
      case 'monthly':
        return monthlyData || [];
      default:
        return hourlyData || [];
    }
  };

  const getChartTitle = () => {
    switch (timeFilter) {
      case 'hourly':
        return 'Hourly Traffic Overview';
      case 'daily':
        return 'Daily Traffic Overview';
      case 'monthly':
        return 'Monthly Traffic Overview';
      default:
        return 'Traffic Overview';
    }
  };

  const getXAxisLabel = () => {
    switch (timeFilter) {
      case 'hourly':
        return 'hour_display';
      case 'daily':
        return 'hour_display';
      case 'monthly':
        return 'hour_display';
      default:
        return 'hour_display';
    }
  };

  const handleExportReport = async (format: string) => {
    try {
      setIsExporting(true);
      
      const endpoint = timeFilter === 'daily' ? '/api/superadmin/analytics/daily/export' :
                      timeFilter === 'monthly' ? '/api/superadmin/analytics/monthly/export' :
                      '/api/superadmin/analytics/export-traffic-report';
      
      const params = timeFilter === 'daily' ? `?days=30&format=${format}` :
                    timeFilter === 'monthly' ? `?months=12&format=${format}` :
                    `?format=${format}`;

      console.log(API_BASE_URL, endpoint, params);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}${params}`, {
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
      let filename = `traffic_analytics_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      
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

      toast.success(`Traffic analytics report exported successfully as ${format.toUpperCase()}`);
      setIsExportModalOpen(false);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderCustomTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <text
        x={x}
        y={y + 10}
        textAnchor="end"
        fontSize={12}
        transform={`rotate(-45, ${x}, ${y})`}
        fill="#666"
      >
        {payload.value}
      </text>
    );
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">
          <TrendingUp size={48} />
        </div>
        <p className="text-xl font-semibold text-gray-800">Error</p>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={fetchAnalyticsData}
          className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary-500 p-3 rounded-lg shadow-lg">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Traffic Analytics</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          {/* Date Range Picker */}
          <div className="relative date-picker-container">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {customDateRange ? getDateRangeDisplay() : 'Select Date Range'}
            </button>
            {customDateRange && (
              <button
                onClick={clearDateRange}
                className="ml-2 text-red-500 hover:text-red-700 text-sm"
              >
                Clear
              </button>
            )}
            {showDatePicker && <DateRangePicker />}
          </div>
          
          <button
            onClick={handleRefresh}
            className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <MetricCard
          title="Total Visits"
          value={summary?.total_visits.toLocaleString()}
          subtitle={`${summary?.total_unique_visitors.toLocaleString()} unique visitors`}
          icon={Users}
          color="orange"
        />
        <MetricCard
          title="Bounce Rate"
          value={`${summary?.overall_bounce_rate.toFixed(2)}%`}
          subtitle={`${summary?.total_bounced_visits.toLocaleString()} bounced visits`}
          icon={BarChart2}
          color="red"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${conversionData?.overall.conversion_rate.toFixed(2)}%`}
          subtitle={`${conversionData?.overall.total_purchases.toLocaleString()} purchases from ${conversionData?.overall.total_visitors.toLocaleString()} visitors`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Peak Hours and Best Month */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{
            timeFilter === 'hourly' ? 'Peak Traffic Hour' :
            timeFilter === 'daily' ? 'Peak Traffic Day' :
            'Peak Traffic Month'
          }</h3>
          <div className="bg-primary-100 p-2 rounded-full">
            <Clock className="w-5 h-5 text-primary-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-2">{
          timeFilter === 'hourly' ? (summary?.peak_hours?.most_visits?.hour ? formatTimeDisplay(summary.peak_hours.most_visits.hour) : 'N/A') :
          timeFilter === 'daily' ? (summary?.peak_days?.most_visits?.day || 'N/A') :
          (summary?.peak_months?.most_visits?.month ? formatMonthDisplay(summary.peak_months.most_visits.month) : 'N/A')
        }</p>
        <p className="text-sm text-gray-600">{
          timeFilter === 'hourly' ? (summary?.peak_hours?.most_visits?.visits ? `${summary.peak_hours.most_visits.visits.toLocaleString()} visits` : 'No data') :
          timeFilter === 'daily' ? (summary?.peak_days?.most_visits?.visits ? `${summary.peak_days.most_visits.visits.toLocaleString()} visits` : 'No data') :
          (summary?.peak_months?.most_visits?.visits ? `${summary.peak_months.most_visits.visits.toLocaleString()} visits` : 'No data')
        }</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Best Conversion Month</h3>
            <div className="bg-green-100 p-2 rounded-full">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{
            conversionData?.summary.best_month?.month ? formatMonthDisplay(conversionData.summary.best_month.month) : 'N/A'
          }</p>
          <p className="text-sm text-gray-600">{
            conversionData?.summary.best_month?.conversion_rate ? 
            `${conversionData.summary.best_month.conversion_rate.toFixed(2)}% conversion rate` : 
            'No data'
          }</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Average Monthly Conversion</h3>
            <div className="bg-blue-100 p-2 rounded-full">
              <BarChart2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{conversionData?.summary.average_monthly_conversion.toFixed(2)}%</p>
          <p className="text-sm text-gray-600">Average conversion rate across all months</p>
        </div>
      </div>

      {/* Traffic Overview Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{getChartTitle()}</h3>
          <div className="flex items-center gap-4">
            {/* Time Filter Buttons */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleTimeFilterChange('hourly')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeFilter === 'hourly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Hourly
                </button>
                <button
                  onClick={() => handleTimeFilterChange('daily')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeFilter === 'daily'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => handleTimeFilterChange('monthly')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeFilter === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Info className="w-4 h-4" />
              <span>Hover over the chart for detailed metrics</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[600px] md:min-w-full">
            <ResponsiveContainer width="100%" height={400}>
          <LineChart data={getFilteredData()} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey={getXAxisLabel()}
              tick={renderCustomTick}
              interval={timeFilter === 'hourly' ? 0 : 'preserveStartEnd'}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={50} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total_visits"
              stroke={CHART_COLORS.primary}
              name="Total Visits"
              strokeWidth={2}
              dot={{ stroke: CHART_COLORS.primary, strokeWidth: 2, r: 4, fill: 'white' }}
              activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2, fill: CHART_COLORS.primary }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="unique_visitors"
              stroke={CHART_COLORS.secondary}
              name="Unique Visitors"
              strokeWidth={2}
              dot={{ stroke: CHART_COLORS.secondary, strokeWidth: 2, r: 4, fill: 'white' }}
              activeDot={{ r: 6, stroke: CHART_COLORS.secondary, strokeWidth: 2, fill: CHART_COLORS.secondary }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bounce_rate"
              stroke={CHART_COLORS.tertiary}
              name="Bounce Rate (%)"
              strokeWidth={2}
              dot={{ stroke: CHART_COLORS.tertiary, strokeWidth: 2, r: 4, fill: 'white' }}
              activeDot={{ r: 6, stroke: CHART_COLORS.tertiary, strokeWidth: 2, fill: CHART_COLORS.tertiary }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="conversion_rate"
              stroke={CHART_COLORS.quaternary}
              name="Conversion Rate (%)"
              strokeWidth={2}
              dot={{ stroke: CHART_COLORS.quaternary, strokeWidth: 2, r: 4, fill: 'white' }}
              activeDot={{ r: 6, stroke: CHART_COLORS.quaternary, strokeWidth: 2, fill: CHART_COLORS.quaternary }}
            />
          </LineChart>
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

export default TrafficAnalytics;