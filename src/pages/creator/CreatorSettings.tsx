import React from 'react';
import { Settings, User, Bell, Shield } from 'lucide-react';

const CreatorSettings: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Profile, availability, and notifications.</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Profile</p>
            <p className="text-sm text-gray-500">Update your name, email, and phone.</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Availability</p>
            <p className="text-sm text-gray-500">Set yourself as Available or Busy for new deals.</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Notifications</p>
            <p className="text-sm text-gray-500">Email and push preferences for deals and approvals.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorSettings;
