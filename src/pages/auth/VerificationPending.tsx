import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ClockIcon, CheckBadgeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const VerificationPending: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  
  const [emailForVerification, setEmailForVerification] = useState<string | null>(() => {
    return sessionStorage.getItem('pendingVerificationEmail');
  });

  const [isResending, setIsResending] = useState(false);

 
  useEffect(() => {
    // Look for either key from the navigation state object.
    const emailFromState = location.state?.business_email || location.state?.email;

    // If we found an email from the navigation...
    if (emailFromState) {
      // ...update our component's state with it.
      setEmailForVerification(emailFromState);
      // ...and save it to sessionStorage to make it survive future refreshes.
      sessionStorage.setItem('pendingVerificationEmail', emailFromState);
    }
  }, [location.state]); // Dependency array ensures this runs when navigation happens.

  const handleResend = async () => {
    if (!emailForVerification) {
      toast.error('Could not find your email. Please try signing up again.');
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The backend endpoint strictly requires the key to be `email`.
        body: JSON.stringify({ email: emailForVerification }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to resend email.');
      }

      toast.success(data.message || 'Verification email resent! Please check your inbox.');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col justify-center sm:px-6 lg:px-8 py-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ClockIcon className="h-24 w-24 text-primary-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verification Pending
        </h2>
        {emailForVerification ? (
          <p className="mt-2 text-center text-md text-gray-600 max-w-md mx-auto">
            Thanks for registering! We've sent a verification link to{' '}
            <span className="font-medium text-gray-800">{emailForVerification}</span>.
          </p>
        ) : (
          <p className="mt-2 text-center text-md text-gray-600 max-w-md mx-auto">
            Please check your email to complete the verification process.
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckBadgeIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">Verification Status</h3>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>
                      Your account verification is pending. Please check your email to complete the verification process.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-center text-gray-600 mb-4">
                Didn't receive the email?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || !emailForVerification}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Resending...' : 'Resend Verification Email'}
              </button>
            </div>

            <div className="flex items-center justify-between space-x-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Return Home
              </button>
              
              <Link
                to="/business/login"
                className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go to Login
              </Link>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;