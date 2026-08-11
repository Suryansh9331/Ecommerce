import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  LineChart as LineChartIcon,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mock fallback data
const fallbackUserMetrics = {
  totalUsers: 150,
  activeUsers: 120,
  newUsers: 25,
  userRetention: 85,
  userGrowth: 12.5,
  averageSessionTime: "15m 30s",
  conversionRate: 3.2,
};

const fallbackUserActivity = [
  { date: "Apr 26", activeUsers: 120, newUsers: 8 },
  { date: "Apr 27", activeUsers: 125, newUsers: 10 },
  { date: "Apr 28", activeUsers: 118, newUsers: 7 },
  { date: "Apr 29", activeUsers: 130, newUsers: 12 },
  { date: "Apr 30", activeUsers: 135, newUsers: 15 },
  { date: "May 1", activeUsers: 140, newUsers: 18 },
  { date: "May 2", activeUsers: 145, newUsers: 20 },
];

const fallbackUserSegments = [
  { segment: "New Users", count: 25, growth: 15 },
  { segment: "Returning Users", count: 95, growth: 8 },
  { segment: "Inactive Users", count: 30, growth: -5 },
];

const fallbackUserDistribution = [
  { type: "Verified Users", count: 120, color: "#1800AC" },
  { type: "Unverified Users", count: 30, color: "#3B1EEB" },
  { type: "Premium Users", count: 45, color: "#14008F" },
  { type: "Basic Users", count: 105, color: "#F2F0FF" },
];

const COLORS = ['#1800AC', '#3B1EEB', '#1800AC', '#3B1EEB'];

const UserActivity = () => {
  const [userMetrics, setUserMetrics] = useState(fallbackUserMetrics);
  const [userActivity, setUserActivity] = useState(fallbackUserActivity);
  const [userSegments, setUserSegments] = useState(fallbackUserSegments);
  const [userDistribution, setUserDistribution] = useState(fallbackUserDistribution);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("line");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [metricsRes, activityRes, segmentsRes, distributionRes] = await Promise.all([
          fetch("/api/user-metrics"),
          fetch("/api/user-activity"),
          fetch("/api/user-segments"),
          fetch("/api/user-distribution"),
        ]);

        const [metricsData, activityData, segmentsData, distributionData] = await Promise.all([
          metricsRes.json(),
          activityRes.json(),
          segmentsRes.json(),
          distributionRes.json(),
        ]);

        setUserMetrics(metricsData || fallbackUserMetrics);
        setUserActivity(activityData || fallbackUserActivity);
        setUserSegments(segmentsData || fallbackUserSegments);
        setUserDistribution(distributionData || fallbackUserDistribution);
      } catch (err) {
        console.error("Failed to fetch from backend. Using fallback data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 p-3 rounded-lg shadow-lg">
              <Users className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-black">User Analytics</h1>
          </div>

          <button
            onClick={refreshData}
            className="flex items-center gap-2 bg-primary-500/20 text-primary-500 px-4 py-2 rounded-lg font-medium hover:bg-primary-500/30 transition-all duration-300 group"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow animate-pulse">
            <div className="text-gray-600 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Loading user analytics...
            </div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                {
                  title: "Total Users",
                  value: userMetrics.totalUsers,
                  icon: Users,
                  color: "orange",
                },
                {
                  title: "Active Users",
                  value: userMetrics.activeUsers,
                  icon: UserPlus,
                  color: "green",
                },
                {
                  title: "New Users",
                  value: userMetrics.newUsers,
                  icon: TrendingUp,
                  color: "blue",
                },
                {
                  title: "User Retention",
                  value: `${userMetrics.userRetention}%`,
                  icon: TrendingUp,
                  color: "purple",
                },
              ].map((metric, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                      <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{metric.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
              <div className="border-b border-gray-200">
                <div className="flex items-center">
                  <button
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all ${activeTab === "line" ? "border-b-2 border-primary-500 text-primary-500" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("line")}
                  >
                    <LineChartIcon className="w-4 h-4" />
                    Activity Trend
                  </button>
                  <button
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all ${activeTab === "bar" ? "border-b-2 border-primary-500 text-primary-500" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("bar")}
                  >
                    <BarChart3 className="w-4 h-4" />
                    User Segments
                  </button>
                  <button
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all ${activeTab === "pie" ? "border-b-2 border-primary-500 text-primary-500" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("pie")}
                  >
                    <PieChartIcon className="w-4 h-4" />
                    User Distribution
                  </button>
                </div>
              </div>

              <div className="p-4">
                {activeTab === "line" && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">User Activity Trend (Last 7 Days)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="activeUsers"
                          stroke="#1800AC"
                          strokeWidth={3}
                          dot={{ stroke: '#1800AC', strokeWidth: 2, r: 4, fill: 'white' }}
                          activeDot={{ r: 6, stroke: '#1800AC', strokeWidth: 2, fill: '#1800AC' }}
                          name="Active Users"
                        />
                        <Line
                          type="monotone"
                          dataKey="newUsers"
                          stroke="#4ECDC4"
                          strokeWidth={3}
                          dot={{ stroke: '#4ECDC4', strokeWidth: 2, r: 4, fill: 'white' }}
                          activeDot={{ r: 6, stroke: '#4ECDC4', strokeWidth: 2, fill: '#4ECDC4' }}
                          name="New Users"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeTab === "bar" && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">User Segments</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={userSegments} margin={{ left: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="segment" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#1800AC"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeTab === "pie" && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">User Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={userDistribution}
                          dataKey="count"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {userDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">User Growth Metrics</h3>
                <div className="space-y-4">
                  {[
                    { label: "User Growth Rate", value: `${userMetrics.userGrowth}%`, trend: userMetrics.userGrowth >= 0 ? "up" : "down" },
                    { label: "Average Session Time", value: userMetrics.averageSessionTime },
                    { label: "Conversion Rate", value: `${userMetrics.conversionRate}%` },
                  ].map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">{metric.label}</span>
                      <div className="flex items-center gap-2">
                        {metric.trend && (
                          metric.trend === "up" ? 
                            <TrendingUp className="w-4 h-4 text-green-500" /> : 
                            <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-semibold text-gray-900">{metric.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">User Engagement</h3>
                <div className="space-y-4">
                  {userSegments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">{segment.segment}</span>
                      <div className="flex items-center gap-2">
                        {segment.growth >= 0 ? 
                          <TrendingUp className="w-4 h-4 text-green-500" /> : 
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        }
                        <span className="font-semibold text-gray-900">{segment.count}</span>
                        <span className={`text-sm ${segment.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {segment.growth >= 0 ? '+' : ''}{segment.growth}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserActivity;

