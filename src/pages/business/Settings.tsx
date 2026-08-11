import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Check, X } from 'lucide-react';

interface ProfileData {
  first_name: string;
  last_name: string;
  business_name: string;
  business_email: string;
  business_phone: string;
}

interface AccountData {
  email: string;
  phone: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
}

interface BankAccountData {
  account_name: string;
  account_number: string;
  bank_name: string;
  branch_name: string;
  ifsc_code: string;
}

interface UserInfo {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_active: boolean;
  has_password?: boolean;
}

interface DeletionStatusResponse {
  status: 'none' | 'pending' | 'closed';
  account_deletion_effective_at: string | null;
  grace_hours: number;
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 

const Settings: React.FC = () => {
  const { accessToken, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('account'); // 'account' or 'profile'
  
  // Profile form state
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    business_name: '',
    business_email: '',
    business_phone: ''
  });

  // Account form state
  const [accountData, setAccountData] = useState<AccountData>({
    email: '',
    phone: '',
    is_email_verified: false,
    is_phone_verified: false
  });

  // Bank Account form state
  const [bankAccountData, setBankAccountData] = useState<BankAccountData>({
    account_name: '',
    account_number: '',
    bank_name: '',
    branch_name: '',
    ifsc_code: ''
  });

  // User info state
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [deletionStatus, setDeletionStatus] = useState<DeletionStatusResponse | null>(null);
  const [deletionModalOpen, setDeletionModalOpen] = useState(false);
  const [deletionPassword, setDeletionPassword] = useState('');
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [countdownLabel, setCountdownLabel] = useState<string | null>(null);

  const fetchDeletionStatus = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/merchant-dashboard/account/deletion-status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDeletionStatus(data as DeletionStatusResponse);
      }
    } catch {
      /* ignore */
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDeletionStatus();
  }, [fetchDeletionStatus]);

  useEffect(() => {
    if (deletionStatus?.status !== 'pending' || !deletionStatus.account_deletion_effective_at) {
      setCountdownLabel(null);
      return;
    }
    const tick = () => {
      const end = new Date(deletionStatus.account_deletion_effective_at!).getTime();
      const diff = end - Date.now();
      if (diff <= 0) {
        setCountdownLabel('Finalizing soon…');
        fetchDeletionStatus();
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdownLabel(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    const poll = window.setInterval(fetchDeletionStatus, 60000);
    return () => {
      window.clearInterval(id);
      window.clearInterval(poll);
    };
  }, [deletionStatus?.status, deletionStatus?.account_deletion_effective_at, fetchDeletionStatus]);

  // Fetch profile and account data
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      
      try {
        // Fetch user info
        const userInfoResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/user-info`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (userInfoResponse.ok) {
          const userInfoData = await userInfoResponse.json();
          setUserInfo(userInfoData);
          
          // Set profile data from user info
          setProfileData(prev => ({
            ...prev,
            first_name: userInfoData.first_name || '',
            last_name: userInfoData.last_name || '',
            business_email: userInfoData.email || '',
            business_phone: userInfoData.phone || ''
          }));

          // Set account data from user info
          setAccountData({
            email: userInfoData.email || '',
            phone: userInfoData.phone || '',
            is_email_verified: userInfoData.is_email_verified || false,
            is_phone_verified: userInfoData.is_phone_verified || false
          });
        }

        // Fetch account settings (includes bank details)
        const accountResponse = await fetch(`${API_BASE_URL}/api/merchant-dashboard/account`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          
          // Set bank account data
          if (accountData.bank_details) {
            setBankAccountData({
              account_name: accountData.bank_details.account_name || '',
              account_number: accountData.bank_details.account_number || '',
              bank_name: accountData.bank_details.bank_name || '',
              branch_name: accountData.bank_details.branch_name || '',
              ifsc_code: accountData.bank_details.ifsc_code || ''
            });
          }

          // Update profile data with business name from bank details
          if (accountData.bank_details?.account_name) {
            setProfileData(prev => ({
              ...prev,
              business_name: accountData.bank_details.account_name
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle account form changes
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle bank account form changes
  const handleBankAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankAccountData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save profile changes
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Update profile data in user info
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/user-info`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.business_email,
          phone: profileData.business_phone
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Save account and bank details
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    try {
      // Update profile with account and bank details
      const updateData = {
        business_name: bankAccountData.account_name,
        business_email: accountData.email,
        business_phone: accountData.phone,
        bank_account_number: bankAccountData.account_number,
        bank_ifsc_code: bankAccountData.ifsc_code,
        bank_name: bankAccountData.bank_name,
        bank_branch: bankAccountData.branch_name
      };

      const response = await fetch(`${API_BASE_URL}/api/merchants/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update account');
      }
      
      toast.success('Account settings updated successfully');
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update account');
    } finally {
      setIsSaving(false);
    }
  };

  // Change password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.debug('Password change initiated');
    
    // Validate passwords
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      console.debug('Validation failed: Empty password fields');
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.new_password.length < 8) {
      console.debug('Validation failed: New password too short');
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      console.debug('Validation failed: Passwords do not match');
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.current_password === passwordData.new_password) {
      console.debug('Validation failed: New password same as current');
      toast.error('New password must be different from current password');
      return;
    }

    console.debug('Password validation passed, proceeding with change request');
    setIsChangingPassword(true);
    const toastId = toast.loading('Changing password...');

    try {
      console.debug('Sending password change request');
      const response = await fetch(`${API_BASE_URL}/api/users/profile/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          old_password: passwordData.current_password,
          new_password: passwordData.new_password,
          confirm_password: passwordData.confirm_password
        })
      });

      console.debug('Password change response status:', response.status);
      const data = await response.json();
      console.debug('Password change response data:', data);

      if (!response.ok) {
        if (response.status === 401) {
          console.debug('Password change failed: Incorrect current password');
          throw new Error('Current password is incorrect');
        } else if (response.status === 404) {
          console.debug('Password change failed: User not found');
          throw new Error('User not found');
        } else {
          console.debug('Password change failed:', data.message || data.error);
          throw new Error(data.message || data.error || 'Failed to change password');
        }
      }

      // Clear password fields after successful change
      console.debug('Password change successful, clearing form');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      toast.success('Password changed successfully!', { id: toastId });
    } catch (error) {
      console.error('Error in password change:', error);
      console.debug('Full error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      });
      toast.error(error instanceof Error ? error.message : 'Failed to change password', { id: toastId });
    } finally {
      console.debug('Password change process completed');
      setIsChangingPassword(false);
    }
  };

  const handleConfirmDeletionRequest = async () => {
    if (!accessToken) return;
    if (userInfo?.has_password && !deletionPassword.trim()) {
      toast.error('Please enter your password to confirm.');
      return;
    }
    setDeletionBusy(true);
    const toastId = toast.loading('Scheduling account deletion…');
    try {
      const res = await fetch(`${API_BASE_URL}/api/merchant-dashboard/account/deletion-request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          userInfo?.has_password ? { password: deletionPassword } : {}
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      toast.success(data.message || 'Deletion scheduled', { id: toastId });
      setDeletionModalOpen(false);
      setDeletionPassword('');
      await fetchDeletionStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to schedule deletion', { id: toastId });
    } finally {
      setDeletionBusy(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!accessToken) return;
    setDeletionBusy(true);
    const toastId = toast.loading('Cancelling…');
    try {
      const res = await fetch(`${API_BASE_URL}/api/merchant-dashboard/account/deletion-cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cancel failed');
      }
      toast.success(data.message || 'Deletion cancelled', { id: toastId });
      await fetchDeletionStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel', { id: toastId });
    } finally {
      setDeletionBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account settings, business profile, and banking information.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('account')}
                className={`${
                  activeTab === 'account'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Account Settings
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`${
                  activeTab === 'profile'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Business Profile
              </button>
            </nav>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 gap-8">
          {activeTab === 'account' && (
            <>
              {/* Account Details Section */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Details</h2>
                  <form onSubmit={handleAccountSubmit} className="space-y-6">
                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={accountData.email}
                        onChange={handleAccountChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                      />
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={accountData.phone}
                        onChange={handleAccountChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Account Details'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Bank Account Details Section */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Bank Account Details</h2>
                  <form onSubmit={handleAccountSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                        <input
                          type="text"
                          name="account_name"
                          value={bankAccountData.account_name}
                          onChange={handleBankAccountChange}
                          className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                        <input
                          type="text"
                          name="account_number"
                          value={bankAccountData.account_number}
                          onChange={handleBankAccountChange}
                          className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                        <input
                          type="text"
                          name="ifsc_code"
                          value={bankAccountData.ifsc_code}
                          onChange={handleBankAccountChange}
                          className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input
                          type="text"
                          name="bank_name"
                          value={bankAccountData.bank_name}
                          onChange={handleBankAccountChange}
                          className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                      <input
                        type="text"
                        name="branch_name"
                        value={bankAccountData.branch_name}
                        onChange={handleBankAccountChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Bank Details'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Password Change Section */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          name="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 pr-10 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 pr-10 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordChange}
                          className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 pr-10 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50"
                      >
                        {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-red-100">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-red-700 mb-2">Close merchant account</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    You can request to close your seller account. You will have {deletionStatus?.grace_hours ?? 24}{' '}
                    hours to cancel. After that, your login will be disabled, your products and reels will no longer
                    appear on AOIN, and your storefront will be hidden. Some records may be retained where the law
                    requires (for example tax and orders). See our{' '}
                    <a href="/privacy-policy" className="text-primary-600 underline" target="_blank" rel="noopener noreferrer">
                      privacy policy
                    </a>
                    .
                  </p>
                  {deletionStatus?.status === 'closed' && (
                    <p className="text-sm text-gray-800 mb-4">This account has been closed.</p>
                  )}
                  {deletionStatus?.status === 'pending' && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-4 mb-4">
                      <p className="text-sm text-amber-900 font-medium">Deletion scheduled</p>
                      <p className="text-sm text-amber-800 mt-1">{deletionStatus.message}</p>
                      {countdownLabel && (
                        <p className="text-sm text-amber-900 mt-2 font-mono">Time remaining: {countdownLabel}</p>
                      )}
                      <button
                        type="button"
                        disabled={deletionBusy}
                        onClick={handleCancelDeletionRequest}
                        className="mt-3 inline-flex justify-center py-2 px-4 border border-amber-700 text-sm font-medium rounded-md text-amber-900 bg-white hover:bg-amber-100 disabled:opacity-50"
                      >
                        Cancel deletion
                      </button>
                    </div>
                  )}
                  {deletionStatus?.status !== 'closed' && deletionStatus?.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => setDeletionModalOpen(true)}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete merchant account
                    </button>
                  )}
                  {deletionStatus?.status === 'closed' && (
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              </div>

              {deletionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Confirm account deletion</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      This starts the {deletionStatus?.grace_hours ?? 24}-hour cancellation window. After it ends,
                      your merchant account will be closed and your catalog hidden from buyers.
                    </p>
                    {userInfo?.has_password && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          value={deletionPassword}
                          onChange={(e) => setDeletionPassword(e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                          autoComplete="current-password"
                        />
                      </div>
                    )}
                    <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeletionModalOpen(false);
                          setDeletionPassword('');
                        }}
                        className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        disabled={deletionBusy}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDeletionRequest}
                        disabled={deletionBusy}
                        className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletionBusy ? 'Please wait…' : 'Confirm delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Profile Settings Section */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Profile</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        value={profileData.first_name}
                        onChange={handleProfileChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        value={profileData.last_name}
                        onChange={handleProfileChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      name="business_name"
                      value={profileData.business_name}
                      onChange={handleProfileChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-600 focus:border-primary-600"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 