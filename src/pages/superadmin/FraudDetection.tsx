import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertOctagon, 
  FileLock2 
} from 'lucide-react';

// Types
interface Transaction {
  id: string;
  userId: string;
  amount: number;
  timestamp: string;
  paymentMethod: string;
  status: string;
  ipAddress: string;
  deviceInfo: string;
  location: string;
}

interface FraudAlert {
  id: string;
  transactionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  timestamp: string;
  reviewed: boolean;
  resolution?: 'approved' | 'blocked' | 'pending';
}

// Sample data for demonstration purposes
const sampleTransactions: Transaction[] = [
  {
    id: 'trx-001',
    userId: 'user-123',
    amount: 1299.99,
    timestamp: '2025-05-04T10:32:15',
    paymentMethod: 'credit_card',
    status: 'completed',
    ipAddress: '192.168.1.1',
    deviceInfo: 'Chrome/Windows',
    location: 'New York, USA'
  },
  {
    id: 'trx-002',
    userId: 'user-456',
    amount: 4999.99,
    timestamp: '2025-05-04T10:35:22',
    paymentMethod: 'credit_card',
    status: 'pending',
    ipAddress: '103.42.91.123',
    deviceInfo: 'Safari/iOS',
    location: 'Kyiv, Ukraine'
  },
  {
    id: 'trx-003',
    userId: 'user-123',
    amount: 799.99,
    timestamp: '2025-05-04T10:40:18',
    paymentMethod: 'paypal',
    status: 'completed',
    ipAddress: '45.89.241.76',
    deviceInfo: 'Firefox/Linux',
    location: 'Lagos, Nigeria'
  },
  {
    id: 'trx-004',
    userId: 'user-789',
    amount: 5899.99,
    timestamp: '2025-05-04T10:42:55',
    paymentMethod: 'credit_card',
    status: 'completed',
    ipAddress: '192.168.1.5',
    deviceInfo: 'Chrome/MacOS',
    location: 'Miami, USA'
  }
];

const sampleFraudAlerts: FraudAlert[] = [
  {
    id: 'alert-001',
    transactionId: 'trx-002',
    severity: 'high',
    reason: 'Unusual location - transaction initiated from a high-risk region',
    timestamp: '2025-05-04T10:35:25',
    reviewed: false
  },
  {
    id: 'alert-002',
    transactionId: 'trx-003',
    severity: 'medium',
    reason: 'Multiple transactions from different locations within short period',
    timestamp: '2025-05-04T10:40:20',
    reviewed: false
  },
  {
    id: 'alert-003',
    transactionId: 'trx-004',
    severity: 'low',
    reason: 'Large transaction amount compared to user history',
    timestamp: '2025-05-04T10:43:00',
    reviewed: true,
    resolution: 'approved'
  }
];

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

// Risk score calculation function
const calculateRiskScore = (transaction: Transaction): number => {
  let score = 0;
  
  // Check for high-risk countries
  const highRiskLocations = ['Nigeria', 'Ukraine', 'Russia', 'Belarus'];
  if (highRiskLocations.some(location => transaction.location.includes(location))) {
    score += 30;
  }
  
  // Check for high transaction amount
  if (transaction.amount > 1000) {
    score += 10;
  }
  if (transaction.amount > 5000) {
    score += 20;
  }
  
  // Check for unusual payment methods
  if (transaction.paymentMethod !== 'credit_card' && transaction.paymentMethod !== 'paypal') {
    score += 15;
  }
  
  return Math.min(score, 100); // Cap at 100
};

// Main component
export default function FraudDetection() {
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>(sampleFraudAlerts);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'transactions'>('alerts');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  
  // Function to detect fraud (would connect to backend API in a real application)
  const detectFraudInTransactions = () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Logic to detect fraud - in a real app this would be part of a backend service
      const newAlerts: FraudAlert[] = [];
      
      transactions.forEach(transaction => {
        const riskScore = calculateRiskScore(transaction);
        
        // Check if transaction is already flagged
        const existingAlert = fraudAlerts.find(alert => alert.transactionId === transaction.id);
        
        if (riskScore > 50 && !existingAlert) {
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
          
          if (riskScore > 80) severity = 'critical';
          else if (riskScore > 70) severity = 'high';
          else if (riskScore > 60) severity = 'medium';
          
          newAlerts.push({
            id: `alert-${Math.random().toString(36).substr(2, 9)}`,
            transactionId: transaction.id,
            severity,
            reason: `Risk score: ${riskScore}. Suspicious activity detected.`,
            timestamp: new Date().toISOString(),
            reviewed: false
          });
        }
      });
      
      setFraudAlerts(prev => [...prev, ...newAlerts]);
      setIsLoading(false);
    }, 1500);
  };
  
  // Function to handle alert resolution
  const resolveAlert = (alertId: string, resolution: 'approved' | 'blocked') => {
    setFraudAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, reviewed: true, resolution } 
          : alert
      )
    );
    
    // If blocking, also update transaction status (in a real app, this would be an API call)
    if (resolution === 'blocked') {
      const alertToResolve = fraudAlerts.find(alert => alert.id === alertId);
      if (alertToResolve) {
        setTransactions(prev => 
          prev.map(transaction => 
            transaction.id === alertToResolve.transactionId 
              ? { ...transaction, status: 'blocked' } 
              : transaction
          )
        );
      }
    }
    
    setSelectedAlert(null);
  };
  
  // Initial fraud detection on component mount
  useEffect(() => {
    detectFraudInTransactions();
  }, []);
  
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fraud Detection Console</h1>
            <p className="text-gray-600">Monitor and manage suspicious activities</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={detectFraudInTransactions}
              disabled={isLoading}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded shadow"
            >
              <Shield className="mr-2 h-5 w-5" />
              {isLoading ? 'Scanning...' : 'Scan for Fraud'}
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FileLock2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Transactions</p>
              <p className="text-xl font-semibold">{transactions.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow flex items-center">
            <div className="bg-amber-100 p-3 rounded-full mr-4">
              <AlertOctagon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Pending Alerts</p>
              <p className="text-xl font-semibold">
                {fraudAlerts.filter(alert => !alert.reviewed).length}
              </p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Approved</p>
              <p className="text-xl font-semibold">
                {fraudAlerts.filter(alert => alert.resolution === 'approved').length}
              </p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow flex items-center">
            <div className="bg-red-100 p-3 rounded-full mr-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Blocked</p>
              <p className="text-xl font-semibold">
                {fraudAlerts.filter(alert => alert.resolution === 'blocked').length}
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 ${activeTab === 'alerts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('alerts')}
          >
            Fraud Alerts
          </button>
          <button
            className={`py-3 px-6 ${activeTab === 'transactions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
        </div>
        
        {/* Content */}
        <div className="bg-white rounded shadow">
          {activeTab === 'alerts' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fraudAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No fraud alerts detected
                      </td>
                    </tr>
                  ) : (
                    fraudAlerts.map((alert) => {
                      // Find the associated transaction
                      const transaction = transactions.find(t => t.id === alert.transactionId);
                      
                      return (
                        <tr key={alert.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 
                                alert.severity === 'high' ? 'bg-primary-100 text-primary-800' :
                                alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'}`
                            }>
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {alert.transactionId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                            {alert.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(alert.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {alert.reviewed ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${alert.resolution === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`
                              }>
                                {alert.resolution === 'approved' ? 
                                  <CheckCircle className="mr-1 h-3 w-3" /> : 
                                  <XCircle className="mr-1 h-3 w-3" />
                                }
                              {alert.resolution ? (alert.resolution.charAt(0).toUpperCase() + alert.resolution.slice(1)) : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Pending Review
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {!alert.reviewed && (
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => setSelectedAlert(alert)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Eye className="h-5 w-5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === 'transactions' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => {
                    const riskScore = calculateRiskScore(transaction);
                    
                    return (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.userId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              transaction.status === 'blocked' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'}`
                          }>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2.5">
                              <div className={`h-2.5 rounded-full ${
                                riskScore > 70 ? 'bg-red-600' : 
                                riskScore > 40 ? 'bg-yellow-400' : 
                                'bg-green-500'}`} 
                                style={{ width: `${riskScore}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">{riskScore}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Alert Review Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Review Fraud Alert</h3>
              <button 
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Alert details */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className={`mr-2 h-5 w-5 ${
                    selectedAlert.severity === 'critical' ? 'text-red-600' : 
                    selectedAlert.severity === 'high' ? 'text-primary-600' :
                    selectedAlert.severity === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <h4 className="text-lg font-medium text-gray-900">
                    {selectedAlert.severity.charAt(0).toUpperCase() + selectedAlert.severity.slice(1)} Severity Alert
                  </h4>
                </div>
                
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 text-sm">
                  <div>
                    <dt className="text-gray-500">Alert ID</dt>
                    <dd className="mt-1 text-gray-900 font-medium">{selectedAlert.id}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Transaction ID</dt>
                    <dd className="mt-1 text-gray-900 font-medium">{selectedAlert.transactionId}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Timestamp</dt>
                    <dd className="mt-1 text-gray-900">{formatDate(selectedAlert.timestamp)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Pending Review
                      </span>
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-gray-500">Reason</dt>
                    <dd className="mt-1 text-gray-900">{selectedAlert.reason}</dd>
                  </div>
                </dl>
              </div>
              
              {/* Transaction details */}
              {(() => {
                const transaction = transactions.find(t => t.id === selectedAlert.transactionId);
                if (!transaction) return null;
                
                return (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h4>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 text-sm">
                      <div>
                        <dt className="text-gray-500">User ID</dt>
                        <dd className="mt-1 text-gray-900">{transaction.userId}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Amount</dt>
                        <dd className="mt-1 text-gray-900 font-medium">{formatCurrency(transaction.amount)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Payment Method</dt>
                        <dd className="mt-1 text-gray-900">{transaction.paymentMethod}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Location</dt>
                        <dd className="mt-1 text-gray-900">{transaction.location}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">IP Address</dt>
                        <dd className="mt-1 text-gray-900">{transaction.ipAddress}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Device Info</dt>
                        <dd className="mt-1 text-gray-900">{transaction.deviceInfo}</dd>
                      </div>
                    </dl>
                  </div>
                );
              })()}
              
              {/* Action buttons */}
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => resolveAlert(selectedAlert.id, 'approved')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Transaction
                </button>
                <button
                  onClick={() => resolveAlert(selectedAlert.id, 'blocked')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Block Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}