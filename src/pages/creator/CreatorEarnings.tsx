import React from 'react';
import { Wallet } from 'lucide-react';

const CreatorEarnings: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] flex items-center justify-center">
          <Wallet className="w-5 h-5 text-[#FF4D00]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500">Track earnings and payouts from your reels.</p>
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm p-8 text-center">
        <p className="text-gray-500">Earnings and payout history will appear here once you complete campaigns.</p>
      </div>
    </div>
  );
};

export default CreatorEarnings;
