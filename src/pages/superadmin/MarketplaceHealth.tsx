import { useState, useEffect, JSXElementConstructor, ReactElement, ReactNode } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingBag, Star, AlertCircle } from 'lucide-react';

const MarketplaceHealth = () => {
  // State for the marketplace metrics
  const [metrics, setMetrics] = useState({
    userEngagement: {
      score: 0,
      trend: 0,
      details: {}
    },
    merchantSatisfaction: {
      score: 0,
      trend: 0,
      details: {}
    },
    salesGrowth: {
      score: 0,
      trend: 0,
      details: {}
    },
    overallHealth: 0
  });
  
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);

  // Simulated data - in a real app, this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const data = generateMarketplaceData(timeRange);
      setMetrics(data);
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);

  // Function to generate mock data
  const generateMarketplaceData = (period: string) => {
    // Generate different data based on the selected time period
    let userScore, merchantScore, salesScore;
    let userTrend, merchantTrend, salesTrend;
    
    if (period === 'week') {
      userScore = 78;
      merchantScore = 82;
      salesScore = 75;
      userTrend = 2;
      merchantTrend = -1;
      salesTrend = 5;
    } else if (period === 'month') {
      userScore = 82;
      merchantScore = 79;
      salesScore = 83;
      userTrend = 4;
      merchantTrend = 2;
      salesTrend = 7;
    } else { // quarter
      userScore = 85;
      merchantScore = 76;
      salesScore = 88;
      userTrend = 6;
      merchantTrend = -3;
      salesTrend = 9;
    }

    // Create historical data for charts
    const historicalData = generateHistoricalData(period);
    
    // Create engagement breakdown
    const engagementBreakdown = [
      { name: 'Active Users', value: userScore * 0.4 },
      { name: 'New Sign-ups', value: userScore * 0.3 },
      { name: 'Returning Users', value: userScore * 0.2 },
      { name: 'Social Shares', value: userScore * 0.1 }
    ];
    
    // Create satisfaction breakdown
    const satisfactionBreakdown = [
      { name: 'Support Rating', value: merchantScore * 0.3 },
      { name: 'Platform Ease', value: merchantScore * 0.3 },
      { name: 'Fee Satisfaction', value: merchantScore * 0.2 },
      { name: 'Growth Opp.', value: merchantScore * 0.2 }
    ];
    
    return {
      userEngagement: {
        score: userScore,
        trend: userTrend,
        details: {
          historicalData: historicalData.userEngagement,
          breakdown: engagementBreakdown
        }
      },
      merchantSatisfaction: {
        score: merchantScore,
        trend: merchantTrend,
        details: {
          historicalData: historicalData.merchantSatisfaction,
          breakdown: satisfactionBreakdown
        }
      },
      salesGrowth: {
        score: salesScore,
        trend: salesTrend,
        details: {
          historicalData: historicalData.salesGrowth
        }
      },
      overallHealth: Math.round((userScore + merchantScore + salesScore) / 3)
    };
  };

  // Generate historical data for charts
  const generateHistoricalData = (period: string) => {
    let dataPoints = 0;
    let labelFormat = '';
    
    if (period === 'week') {
      dataPoints = 7;
      labelFormat = 'Day';
    } else if (period === 'month') {
      dataPoints = 4;
      labelFormat = 'Week';
    } else { // quarter
      dataPoints = 3;
      labelFormat = 'Month';
    }
    
    const userEngagement = [];
    const merchantSatisfaction = [];
    const salesGrowth = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const label = `${labelFormat} ${i + 1}`;
      
      userEngagement.push({
        name: label,
        value: 65 + Math.floor(Math.random() * 30)
      });
      
      merchantSatisfaction.push({
        name: label,
        value: 70 + Math.floor(Math.random() * 25)
      });
      
      salesGrowth.push({
        name: label,
        value: 60 + Math.floor(Math.random() * 35)
      });
    }
    
    return {
      userEngagement,
      merchantSatisfaction,
      salesGrowth
    };
  };

  // Helper function to determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Helper function to render trend indicator
  const renderTrendIndicator = (trend: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined) => {
    if (trend > 0) {
      return (
        <div className="flex items-center text-green-500">
          <TrendingUp size={16} />
          <span className="ml-1">+{trend}%</span>
        </div>
      );
    } else if (trend < 0) {
      return (
        <div className="flex items-center text-red-500">
          <TrendingDown size={16} />
          <span className="ml-1">{trend}%</span>
        </div>
      );
    }
    return <span className="text-gray-500">0%</span>;
  };

  // Colors for the pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FDB022', '#F79009'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading marketplace metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Marketplace Health Dashboard</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1 rounded ${timeRange === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Week
          </button>
          <button 
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 rounded ${timeRange === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Month
          </button>
          <button 
            onClick={() => setTimeRange('quarter')}
            className={`px-3 py-1 rounded ${timeRange === 'quarter' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Quarter
          </button>
        </div>
      </div>
      
      {/* Overall Health Score */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Overall Marketplace Health</h2>
            <p className="text-sm text-gray-500">Composite score based on all metrics</p>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(metrics.overallHealth)}`}>
              {metrics.overallHealth}
            </div>
            <div className="text-sm text-gray-500">out of 100</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* User Engagement */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Users size={20} className="text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-700">User Engagement</h2>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className={`text-3xl font-bold ${getScoreColor(metrics.userEngagement.score)}`}>
              {metrics.userEngagement.score}
            </div>
            {renderTrendIndicator(metrics.userEngagement.trend)}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.userEngagement.details.historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0088FE" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Engagement Breakdown</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.userEngagement.details.breakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics.userEngagement.details.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Merchant Satisfaction */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Star size={20} className="text-yellow-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-700">Merchant Satisfaction</h2>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className={`text-3xl font-bold ${getScoreColor(metrics.merchantSatisfaction.score)}`}>
              {metrics.merchantSatisfaction.score}
            </div>
            {renderTrendIndicator(metrics.merchantSatisfaction.trend)}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.merchantSatisfaction.details.historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#FDB022" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Satisfaction Factors</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.merchantSatisfaction.details.breakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics.merchantSatisfaction.details.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Sales Growth */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <ShoppingBag size={20} className="text-green-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-700">Sales Growth</h2>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className={`text-3xl font-bold ${getScoreColor(metrics.salesGrowth.score)}`}>
              {metrics.salesGrowth.score}
            </div>
            {renderTrendIndicator(metrics.salesGrowth.trend)}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.salesGrowth.details.historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Key Insights</h3>
            <ul className="text-sm text-gray-600">
              <li className="flex items-center mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {metrics.salesGrowth.trend > 0 ? 'Positive growth trend' : 'Growth trend needs attention'}
              </li>
              <li className="flex items-center mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                {metrics.salesGrowth.score > 80 ? 'Strong performance' : 'Room for improvement'}
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                {metrics.salesGrowth.score > metrics.overallHealth ? 'Outperforming other metrics' : 'Lagging behind other metrics'}
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <AlertCircle size={20} className="text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-700">Recommendations</h2>
        </div>
        <ul className="text-sm text-gray-600">
          {metrics.userEngagement.score < 80 && (
            <li className="flex items-center mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Consider implementing loyalty programs to increase user engagement
            </li>
          )}
          {metrics.merchantSatisfaction.trend < 0 && (
            <li className="flex items-center mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              Address declining merchant satisfaction through improved support channels
            </li>
          )}
          {metrics.salesGrowth.score < 80 && (
            <li className="flex items-center mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Explore promotional campaigns to boost sales growth
            </li>
          )}
          <li className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            Continue monitoring metrics {timeRange === 'week' ? 'weekly' : timeRange === 'month' ? 'monthly' : 'quarterly'} to track progress
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MarketplaceHealth;