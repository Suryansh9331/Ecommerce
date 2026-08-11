import React from 'react';
import { FaUsers, FaMoneyBillWave, FaClock, FaChartLine } from 'react-icons/fa';

interface AnalyticsCardProps {
  totalMerchants: number;
  totalTransferred: number;
  pendingPayouts: number;
  averagePayoutTime: number;
  merchantsWithPendingPayments: number;
  totalCommissionEarned: number;
  paymentTrends: {
    thisMonth: number;
    lastMonth: number;
  };
}

const AnalyticsCards: React.FC<AnalyticsCardProps> = ({
  totalMerchants,
  totalTransferred,
  pendingPayouts,
  averagePayoutTime,
  merchantsWithPendingPayments,
  totalCommissionEarned,
  paymentTrends
}) => {
  const paymentGrowth = ((paymentTrends.thisMonth - paymentTrends.lastMonth) / paymentTrends.lastMonth) * 100;

  const cards = [
    {
      title: 'Total Merchants',
      value: totalMerchants,
      subValue: `${merchantsWithPendingPayments} with pending payments`,
      icon: <FaUsers className="text-primary-500" />,
      bgColor: 'bg-gradient-to-br from-primary-50 to-primary-100',
      textColor: 'text-primary-700'
    },
    {
      title: 'Total Transferred',
      value: `₹${totalTransferred.toLocaleString()}`,
      subValue: `${paymentGrowth >= 0 ? '+' : ''}${paymentGrowth.toFixed(1)}% vs last month`,
      icon: <FaMoneyBillWave className="text-green-500" />,
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      textColor: 'text-green-700',
      trend: paymentGrowth >= 0 ? 'up' : 'down'
    },
    {
      title: 'Pending Payouts',
      value: `₹${pendingPayouts.toLocaleString()}`,
      subValue: `${averagePayoutTime} days avg. processing time`,
      icon: <FaClock className="text-red-500" />,
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      textColor: 'text-red-700'
    },
    {
      title: 'Commission Earned',
      value: `₹${totalCommissionEarned.toLocaleString()}`,
      subValue: 'Total platform commission',
      icon: <FaChartLine className="text-purple-500" />,
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">{card.icon}</div>
            {card.trend && (
              <div className={`text-sm font-medium ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {card.trend === 'up' ? '↑' : '↓'}
              </div>
            )}
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">{card.title}</p>
            <p className={`${card.textColor} text-2xl font-bold truncate mb-2`}>{card.value}</p>
            <p className="text-gray-500 text-xs">{card.subValue}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsCards;