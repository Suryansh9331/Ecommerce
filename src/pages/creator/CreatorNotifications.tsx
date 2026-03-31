import React from 'react';

const CreatorNotifications: React.FC = () => {
  return (
    <div className="space-y-2">
      <h1 className="text-[24px] font-extrabold text-gray-900 leading-tight">Notifications</h1>
      <p className="text-[13px] text-gray-400 font-medium">
        Your updates for offers, reel review status, payouts, and deadlines.
      </p>

      <div className="mt-6 rounded-2xl bg-white border border-gray-100/80 p-6">
        <p className="text-sm text-gray-500 font-medium">Coming soon.</p>
        <p className="text-[12px] text-gray-400 mt-1">
          We’ll add unread filtering, mark-as-read, and deep links to deals/reels here.
        </p>
      </div>
    </div>
  );
};

export default CreatorNotifications;

