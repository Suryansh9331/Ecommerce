import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { AlertCircle, CheckCircle, Clock, Activity, Server, RefreshCw, X, Download } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import ExportModal from '../../components/business/reports/ExportModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define types for API responses
interface SystemStatusResponse {
  status: string;
  data: {
    uptime: number;
    status: string;
    last_updated: string;
    system_metrics: {
      cpu_usage_percent: number;
      memory_usage_mb: number;
      uptime_formatted: string;
      uptime_seconds: number;
    };
  };
  message?: string;
}

interface ResponseTimeResponse {
  status: string;
  data: {
    response_times: {
      timestamp: string;
      average_time: number;
    }[];
    summary: {
      average: number;
      min: number;
      max: number;
    };
  };
  message?: string;
}

interface ErrorDistributionResponse {
  status: string;
  data: {
    error_distribution: {
      error_type: string;
      count: number;
    }[];
    total_errors: number;
  };
  message?: string;
}

interface ServiceStatusResponse {
  status: string;
  data: {
    overall_health: number;
    service_health: {
      service_name: string;
      avg_response_time: number;
      error_rate: number;
      health_score: number;
      memory_usage: number;
      cpu_usage: number;
    }[];
    system_metrics: {
      cpu_usage_percent: number;
      disk_usage_percent: number;
      memory_usage_percent: number;
      memory_usage_mb: number;
    };
    metrics?: {
      uptime: number;
      response_time: {
        average: number;
        maximum: number;
      };
      requests: {
        total: number;
        error_rate: number;
        error_count: number;
        success_rate: number;
      };
      resources: {
        cpu_usage: number;
        memory_usage: number;
      };
    };
    hourly_trends?: any[];
    recent_errors?: any[];
  };
  message?: string;
}

interface SystemHealthResponse {
  status: string;
  data: {
    health_status: string;
    services_operational: number;
    services_degraded: number;
    services_critical: number;
    last_updated: string;
  };
  message?: string;
}

interface ServiceMetrics {
  name: string;
  status: string;
  responseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  errorRate: number;
  requestCount: number;
  lastUpdated: string;
}

interface ServiceAnalytics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  peakResponseTime: number;
  errorCount: number;
  uptime: number;
}

// Define types for state variables
interface ResponseTimeData {
  name: string;
  responseTime: number;
}

interface ErrorData {
  name: string;
  value: number;
}

export default function PlatformPerformance() {
  const { accessToken, isAuthenticated } = useAuth();
  
  // Primary color theme
  const primaryColor = '#1800AC';
  const primaryLightColor = '#3B1EEB';
  const primaryDarkerColor = '#14008F';
  const primaryLightestBg = '#F2F0FF';

  // State for various performance metrics
  const [uptimeStatus, setUptimeStatus] = useState('operational');
  const [uptimePercentage, setUptimePercentage] = useState(99.98);
  const [loadingData, setLoadingData] = useState(true);
  const [responseTimeData, setResponseTimeData] = useState<ResponseTimeData[]>([]);
  const [errorData, setErrorData] = useState<ErrorData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [servicesStatus, setServicesStatus] = useState<{
    name: string;
    status: string;
    responseTime: number;
  }[]>([]);
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetrics[]>([]);
  const [serviceAnalytics, setServiceAnalytics] = useState<ServiceAnalytics>({
    totalRequests: 0,
    successRate: 0,
    averageResponseTime: 0,
    peakResponseTime: 0,
    errorCount: 0,
    uptime: 0
  });
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isInvestigateModalOpen, setIsInvestigateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [investigatingService, setInvestigatingService] = useState<{
    name: string;
    details: {
      metrics: {
        response_time: {
          average: number;
          minimum: number;
          maximum: number;
        };
        requests: {
          total: number;
          error_count: number;
          error_rate: number;
          success_rate: number;
        };
        resources: {
          cpu_usage: number;
          memory_usage: number;
        };
        uptime: number;
        performance_score: number;
      };
    };
  } | null>(null);

  // Fetch data from API endpoints
  const fetchData = async () => {
    if (!isAuthenticated || !accessToken) {
      console.error('Not authenticated');
      return;
    }

    setLoadingData(true);
    try {
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // Fetch system status
      // console.log('Fetching system status...');
      const statusResponse = await fetch(`${API_BASE_URL}/api/superadmin/monitoring/system/status`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      const statusData: SystemStatusResponse = await statusResponse.json();
      // console.log('System status response:', statusData);
      if (statusData.status === 'success') {
        setUptimeStatus(statusData.data.status);
        setUptimePercentage(statusData.data.uptime);
      }

      // Fetch response times
      // console.log('Fetching response times...');
      const responseTimeResponse = await fetch(
        `${API_BASE_URL}/api/superadmin/monitoring/system/response-times?hours=${selectedTimeframe === '24h' ? 24 : selectedTimeframe === '7d' ? 168 : 720}`,
        { 
          method: 'GET',
          headers,
          credentials: 'include'
        }
      );
      const responseTimeData: ResponseTimeResponse = await responseTimeResponse.json();
      // console.log('Response times data:', responseTimeData);
      if (responseTimeData.status === 'success' && responseTimeData.data.response_times) {
        setResponseTimeData(responseTimeData.data.response_times.map(item => ({
          name: item.timestamp,
          responseTime: item.average_time
        })));
      }

      // Fetch error distribution
      // console.log('Fetching error distribution...');
      const errorResponse = await fetch(
        `${API_BASE_URL}/api/superadmin/monitoring/system/errors?hours=${selectedTimeframe === '24h' ? 24 : selectedTimeframe === '7d' ? 168 : 720}`,
        { 
          method: 'GET',
          headers,
          credentials: 'include'
        }
      );
      const errorData: ErrorDistributionResponse = await errorResponse.json();
      // console.log('Error distribution data:', errorData);
      if (errorData.status === 'success' && errorData.data.error_distribution) {
        setErrorData(errorData.data.error_distribution.map(error => ({
          name: error.error_type,
          value: error.count
        })));
      }

      // Fetch service status
      // console.log('Fetching service status...');
      const serviceResponse = await fetch(`${API_BASE_URL}/api/superadmin/monitoring/system/health`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      const serviceData: ServiceStatusResponse = await serviceResponse.json();
      // console.log('Service status data:', serviceData);
      if (serviceData.status === 'success' && serviceData.data.service_health) {
        setServicesStatus(serviceData.data.service_health.map(service => ({
          name: service.service_name,
          status: service.health_score >= 90 ? 'operational' : 
                  service.health_score >= 70 ? 'degraded' : 'critical',
          responseTime: service.avg_response_time
        })));

        // Update service metrics
        setServiceMetrics(serviceData.data.service_health.map(service => ({
          name: service.service_name,
          status: service.health_score >= 90 ? 'operational' : 
                  service.health_score >= 70 ? 'degraded' : 'critical',
          responseTime: service.avg_response_time,
          cpuUsage: service.cpu_usage,
          memoryUsage: service.memory_usage,
          errorRate: service.error_rate,
          requestCount: 0, // This will be updated when fetching individual service metrics
          lastUpdated: new Date().toISOString()
        })));

        // Update service analytics
        const totalServices = serviceData.data.service_health.length;
        const operationalServices = serviceData.data.service_health.filter(
          s => s.health_score >= 90
        ).length;
        
        setServiceAnalytics({
          totalRequests: serviceData.data.service_health.reduce(
            (sum, service) => sum + (service.avg_response_time > 0 ? 1 : 0), 
            0
          ),
          successRate: 100 - (serviceData.data.service_health.reduce(
            (sum, service) => sum + service.error_rate, 
            0
          ) / totalServices),
          averageResponseTime: serviceData.data.service_health.reduce(
            (sum, service) => sum + service.avg_response_time, 
            0
          ) / totalServices,
          peakResponseTime: Math.max(
            ...serviceData.data.service_health.map(service => service.avg_response_time)
          ),
          errorCount: serviceData.data.service_health.reduce(
            (sum, service) => sum + service.error_rate, 
            0
          ),
          uptime: (operationalServices / totalServices) * 100
        });
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Add new function to fetch detailed service metrics
  const fetchServiceMetrics = async (serviceName: string) => {
    if (!isAuthenticated || !accessToken) return;

    try {
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // console.log(`Fetching metrics for service: ${serviceName}`);
      const response = await fetch(
        `${API_BASE_URL}/api/superadmin/monitoring/service/${serviceName}/metrics?hours=${selectedTimeframe === '24h' ? 24 : selectedTimeframe === '7d' ? 168 : 720}`,
        {
          method: 'GET',
          headers,
          credentials: 'include'
        }
      );
      const data: ServiceStatusResponse = await response.json();
      // console.log(`Service metrics response for ${serviceName}:`, {
      //   status: data.status,
      //   metrics: data.data.metrics,
      //   hourly_trends: data.data.hourly_trends,
      //   recent_errors: data.data.recent_errors
      // });

      if (data.status === 'success' && data.data.metrics) {
        // console.log(`Processing metrics for ${serviceName}:`, {
        //   uptime: data.data.metrics.uptime,
        //   response_time: data.data.metrics.response_time,
        //   requests: data.data.metrics.requests,
        //   resources: data.data.metrics.resources
        // });

        setServiceMetrics(prev => {
          const updated = [...prev];
          const index = updated.findIndex(s => s.name === serviceName);
          if (index >= 0) {
            const newMetrics = {
              name: serviceName,
              status: data.data.metrics!.uptime > 99 ? 'operational' : data.data.metrics!.uptime > 95 ? 'degraded' : 'critical',
              responseTime: data.data.metrics!.response_time.average,
              cpuUsage: data.data.metrics!.resources.cpu_usage,
              memoryUsage: data.data.metrics!.resources.memory_usage,
              errorRate: data.data.metrics!.requests.error_rate,
              requestCount: data.data.metrics!.requests.total,
              lastUpdated: new Date().toISOString()
            };
            // console.log(`Updated metrics for ${serviceName}:`, newMetrics);
            updated[index] = newMetrics;
          }
          return updated;
        });

        // Update service analytics
        const newAnalytics = {
          totalRequests: data.data.metrics.requests.total,
          successRate: data.data.metrics.requests.success_rate,
          averageResponseTime: data.data.metrics.response_time.average,
          peakResponseTime: data.data.metrics.response_time.maximum,
          errorCount: data.data.metrics.requests.error_count,
          uptime: data.data.metrics.uptime
        };
        // console.log(`Updated analytics for ${serviceName}:`, newAnalytics);
        setServiceAnalytics(newAnalytics);
      } else {
        console.error(`Error in service metrics response for ${serviceName}:`, data.message);
      }
    } catch (error) {
      console.error(`Error fetching metrics for ${serviceName}:`, error);
    }
  };

  // Add new function to calculate service analytics
  const calculateServiceAnalytics = (services: ServiceMetrics[]) => {
    const totalRequests = services.reduce((sum, service) => sum + service.requestCount, 0);
    const totalErrors = services.reduce((sum, service) => sum + service.errorRate * service.requestCount, 0);
    const successRate = totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests) * 100 : 0;
    const avgResponseTime = services.reduce((sum, service) => sum + service.responseTime, 0) / services.length;
    const peakResponseTime = Math.max(...services.map(service => service.responseTime));

    setServiceAnalytics({
      totalRequests,
      successRate,
      averageResponseTime: avgResponseTime,
      peakResponseTime,
      errorCount: totalErrors,
      uptime: services.reduce((sum, service) => sum + (service.status === 'up' ? 1 : 0), 0) / services.length * 100
    });
  };

  // Update useEffect to include new analytics
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchData();
      if (selectedService) {
        fetchServiceMetrics(selectedService);
      }
      
      const interval = setInterval(() => {
        fetchData();
        if (selectedService) {
          fetchServiceMetrics(selectedService);
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedTimeframe, accessToken, isAuthenticated, selectedService]);

  // Generate status for service health
  const getSystemHealth = (): string => {
    const criticalServices = servicesStatus.filter(s => s.status === 'critical').length;
    const degradedServices = servicesStatus.filter(s => s.status === 'degraded').length;
    
    if (criticalServices > 0) return 'critical';
    if (degradedServices > 0) return 'degraded';
    return 'operational';
  };

  const systemHealth = getSystemHealth();

  // Helper functions for styling
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'degraded': return 'text-amber-500';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case 'operational': return 'bg-green-50';
      case 'degraded': return 'bg-amber-50';
      case 'critical': return 'bg-red-50';
      default: return 'bg-gray-100';
    }
  };

  const getStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  // Color for bar chart
  const getBarColor = (entry: ErrorData): string => {
    const colors: Record<string, string> = {
      '4xx Errors': '#3B1EEB',
      '5xx Errors': '#1800AC',
      'Timeout Errors': '#FEC84B',
      'Network Errors': '#FEDF89',
    };
    return colors[entry.name] || '#6b7280';
  };

  // Handle refresh
  const handleRefresh = () => {
    if (isAuthenticated && accessToken) {
      fetchData();
    }
  };

  const handleExportReport = async (format: string) => {
    try {
      setIsExporting(true);
      
      const response = await fetch(`${API_BASE_URL}/api/superadmin/monitoring/export-platform-performance?format=${format}`, {
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
      let filename = `platform_performance_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      
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

      toast.success(`Platform performance report exported successfully as ${format.toUpperCase()}`);
      setIsExportModalOpen(false);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Update chart colors
  const CHART_COLORS = {
    primary: '#1800AC',
    secondary: '#2DD4BF',
    tertiary: '#A855F7',
    quaternary: '#3B82F6',
    background: '#F2F0FF'
  };

  // Add new section for detailed service analytics
  const renderServiceAnalytics = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="p-4 rounded-lg shadow-sm border bg-white">
        <h3 className="text-lg font-medium mb-2">Overall Performance</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Success Rate</span>
            <span className="font-medium">{serviceAnalytics.successRate.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Avg Response Time</span>
            <span className="font-medium">{serviceAnalytics.averageResponseTime.toFixed(2)}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Peak Response Time</span>
            <span className="font-medium">{serviceAnalytics.peakResponseTime.toFixed(2)}ms</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg shadow-sm border bg-white">
        <h3 className="text-lg font-medium mb-2">Request Statistics</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Requests</span>
            <span className="font-medium">{serviceAnalytics.totalRequests}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Error Count</span>
            <span className="font-medium">{serviceAnalytics.errorCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Uptime</span>
            <span className="font-medium">{serviceAnalytics.uptime.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg shadow-sm border bg-white">
        <h3 className="text-lg font-medium mb-2">System Resources</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">CPU Usage</span>
            <span className="font-medium">{serviceMetrics.find(s => s.name === selectedService)?.cpuUsage.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Memory Usage</span>
            <span className="font-medium">{serviceMetrics.find(s => s.name === selectedService)?.memoryUsage.toFixed(2)} MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Updated</span>
            <span className="font-medium">{new Date(serviceMetrics.find(s => s.name === selectedService)?.lastUpdated || '').toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Update the Services Status Table to include more details
  const renderServicesTable = () => (
    <div className="p-4 rounded-lg shadow bg-white border">
      <h2 className="text-lg font-medium mb-4 text-black">Individual Services Status</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead style={{ backgroundColor: primaryLightestBg }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Response Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">CPU Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Memory Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Error Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {servicesStatus.map((service, index) => {
              const metrics = serviceMetrics.find(s => s.name === service.name);
              // console.log(`Rendering service row for ${service.name}:`, {
              //   service,
              //   metrics,
              //   selected: selectedService === service.name
              // });
              
              return (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 cursor-pointer ${selectedService === service.name ? 'bg-gray-50' : ''}`}
                  onClick={() => {
                    // console.log(`Selected service: ${service.name}`);
                    setSelectedService(service.name);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Server className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                      <div className="font-medium text-black">{service.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      service.status === 'operational' ? 'bg-green-100 text-green-800' :
                      service.status === 'degraded' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      (metrics?.responseTime ?? Infinity) < 100 ? 'text-green-600' :
                      (metrics?.responseTime ?? Infinity) < 200 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {metrics?.responseTime?.toFixed(2) || 'N/A'}ms
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {metrics?.cpuUsage?.toFixed(2) || 'N/A'}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {metrics?.memoryUsage?.toFixed(2) || 'N/A'} MB
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {metrics?.errorRate?.toFixed(2) || 'N/A'}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      className="text-sm font-medium hover:underline"
                      style={{ color: '#1800AC' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchServiceDetails(service.name);
                      }}
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const fetchServiceDetails = async (serviceName: string) => {
    if (!isAuthenticated || !accessToken) {
      console.error('Not authenticated');
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(
        `${API_BASE_URL}/api/superadmin/monitoring/system/service/${serviceName}?hours=${selectedTimeframe === '24h' ? 24 : selectedTimeframe === '7d' ? 168 : 720}`,
        {
          method: 'GET',
          headers,
          credentials: 'include'
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        setInvestigatingService({
          name: serviceName,
          details: data.data
        });
        setIsInvestigateModalOpen(true);
      } else {
        toast.error('Failed to fetch service details');
      }
    } catch (error) {
      console.error(`Error fetching service details for ${serviceName}:`, error);
      toast.error('Failed to fetch service details');
    }
  };

  // Add new component for the investigation modal
  const InvestigateModal = () => {
    if (!investigatingService) return null;

    const {
      name,
      details: {
        metrics: {
          response_time,
          requests,
          resources,
          uptime,
          performance_score
        }
      }
    } = investigatingService;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Service Investigation: {name}</h2>
            <button
              onClick={() => setIsInvestigateModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Performance Score */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-white">
              <h3 className="text-lg font-semibold mb-2">Performance Score</h3>
              <div className="text-3xl font-bold">{performance_score.toFixed(2)}/100</div>
            </div>

            {/* Response Time Metrics */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4">Response Time Metrics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Average</p>
                  <p className="text-lg font-semibold">{response_time.average.toFixed(2)}ms</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Minimum</p>
                  <p className="text-lg font-semibold">{response_time.minimum.toFixed(2)}ms</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Maximum</p>
                  <p className="text-lg font-semibold">{response_time.maximum.toFixed(2)}ms</p>
                </div>
              </div>
            </div>

            {/* Request Statistics */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4">Request Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-lg font-semibold">{requests.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Error Count</p>
                  <p className="text-lg font-semibold">{requests.error_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-lg font-semibold">{requests.success_rate.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Error Rate</p>
                  <p className="text-lg font-semibold">{requests.error_rate.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4">Resource Usage</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">CPU Usage</p>
                  <p className="text-lg font-semibold">{resources.cpu_usage.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Memory Usage</p>
                  <p className="text-lg font-semibold">{resources.memory_usage.toFixed(2)} MB</p>
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4">Service Uptime</h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${uptime}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 font-semibold">{uptime.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-6 bg-white p-6 rounded-xl">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Platform Performance Dashboard</h1>
          <p className="text-sm text-gray-500">Monitor real-time metrics and service health</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={handleRefresh} 
            className="flex items-center gap-2 bg-primary-600/20 text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-600/30 transition-all duration-300 group"
            disabled={loadingData}
          >
            <RefreshCw className={`w-5 h-5 ${loadingData ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            Refresh Data
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-all duration-300"
          >
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg shadow-sm border ${getStatusBgColor(systemHealth)} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(systemHealth)}
            <div>
              <h3 className="font-medium text-gray-700">System Status</h3>
              <p className={`font-bold ${getStatusColor(systemHealth)}`}>
                {systemHealth === 'operational' ? 'All Systems Operational' : 
                 systemHealth === 'degraded' ? 'Degraded Performance' : 'Critical Issues Detected'}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm border bg-${primaryLightestBg} flex items-center justify-between`} style={{ backgroundColor: primaryLightestBg }}>
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5" style={{ color: '#1800AC' }} />
            <div>
              <h3 className="font-medium text-gray-700">Uptime</h3>
              <p className="font-bold" style={{ color: '#1800AC' }}>{uptimePercentage}% last 30 days</p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm border bg-${primaryLightestBg} flex items-center justify-between`} style={{ backgroundColor: primaryLightestBg }}>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" style={{ color: '#1800AC' }} />
            <div>
              <h3 className="font-medium text-gray-700">Avg Response Time</h3>
              <p className="font-bold" style={{ color: '#1800AC' }}>
                {responseTimeData.length > 0 
                  ? `${Math.round(responseTimeData.reduce((sum, item) => sum + (item.responseTime || 0), 0) / responseTimeData.length)}ms` 
                  : 'Calculating...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="flex space-x-2 p-1 bg-white rounded-md shadow-sm border inline-flex">
        <button 
          onClick={() => setSelectedTimeframe('24h')} 
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            selectedTimeframe === '24h' 
              ? 'text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          style={{ backgroundColor: selectedTimeframe === '24h' ? '#1800AC' : '' }}
        >
          24 Hours
        </button>
        <button 
          onClick={() => setSelectedTimeframe('7d')} 
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            selectedTimeframe === '7d' 
              ? 'text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          style={{ backgroundColor: selectedTimeframe === '7d' ? '#1800AC' : '' }}
        >
          7 Days
        </button>
        <button 
          onClick={() => setSelectedTimeframe('30d')} 
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            selectedTimeframe === '30d' 
              ? 'text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          style={{ backgroundColor: selectedTimeframe === '30d' ? '#1800AC' : '' }}
        >
          30 Days
        </button>
      </div>

      {/* Add service analytics section */}
      {selectedService && renderServiceAnalytics()}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Chart */}
        <div className="p-4 rounded-lg shadow bg-white border">
          <h2 className="text-lg font-medium mb-4 text-black">Response Time Trend</h2>
          {loadingData ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#1800AC' }}></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
                <YAxis tick={{ fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: `1px solid #3B1EEB`,
                    borderRadius: '4px'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke={CHART_COLORS.primary}
                  name="Response Time (ms)" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS.primary }}
                  activeDot={{ r: 6, fill: CHART_COLORS.primary }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Error Distribution Chart */}
        <div className="p-4 rounded-lg shadow bg-white border">
          <h2 className="text-lg font-medium mb-4 text-black">Error Distribution</h2>
          {loadingData ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#1800AC' }}></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={errorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
                <YAxis tick={{ fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: `1px solid #3B1EEB`,
                    borderRadius: '4px'
                  }} 
                />
                <Legend />
                <Bar dataKey="value" name="Count">
                  {errorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Updated services table */}
      {renderServicesTable()}

      {/* Incidents Log */}
      <div className="p-4 rounded-lg shadow bg-white border">
        <h2 className="text-lg font-medium mb-4 text-black">Recent Incidents</h2>
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
              <h3 className="font-medium text-black">Storage Service Degraded Performance</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Started 2 hours ago - Ongoing</p>
            <p className="text-sm mt-2 text-gray-700">Our storage service is experiencing higher than normal latency. Our team is investigating the issue.</p>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="font-medium text-black">API Gateway Intermittent 5xx Errors</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Started 1 day ago - Resolved 18 hours ago</p>
            <p className="text-sm mt-2 text-gray-700">Our API Gateway was returning intermittent 5xx errors. We identified a configuration issue and deployed a fix.</p>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="font-medium text-black">Database Increased Latency</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Started 3 days ago - Resolved 2 days ago</p>
            <p className="text-sm mt-2 text-gray-700">Our database was experiencing increased latency due to high traffic. We've scaled up the database instances to handle the load.</p>
          </div>
        </div>
      </div>
      {isInvestigateModalOpen && <InvestigateModal />}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportReport}
        isExporting={isExporting}
      />
    </div>
  );
}
