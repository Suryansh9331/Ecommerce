import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BusinessLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // pull in both the login helper and the resend helper
  const { setAuthState, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setShowResend(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_email: email,
          password: password
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        // Successful login → hydrate context & redirect
        const success = await setAuthState({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: {
            id: data.user.id || 'unknown',
            email: data.user.email,
            name: data.user.first_name + ' ' + data.user.last_name,
            role: 'merchant',
            isEmailVerified: data.user.is_email_verified ?? true,
            verificationStatus: data.merchant?.verification_status || null,
            businessName: data.merchant?.business_name || ''
          }
        });

        if (success) {
          toast.success('Successfully logged in! Redirecting to Merchants dashboard...');
          navigate('/business/dashboard');
        } else {
          throw new Error('Failed to initialize session');
        }

      } else {
        // Handle errors
        if (data.error_code === 'EMAIL_NOT_VERIFIED') {
          const errorMessage = 'Your business email is not verified.';
          setError(errorMessage);
          toast.error(errorMessage);
          setShowResend(true);
        } else {
          throw new Error(data.error || 'Invalid email or password');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const ok = await resendVerificationEmail(email);
      if (ok) {
        const successMessage = 'Verification email resent! Check your inbox.';
        setError(successMessage);
        toast.success(successMessage);
      } else {
        throw new Error('Unable to resend verification link');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error sending verification link';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setShowResend(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-10">
      <motion.div 
        className="max-w-md w-full bg-white rounded-2xl shadow-md overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Business Account Login</h1>
            <p className="text-sm text-gray-600">Access your merchant dashboard</p>
          </div>
  
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
  
          {showResend && !isSubmitting && (
            <div
              className="mb-4 text-sm text-primary-600 cursor-pointer hover:underline text-center"
              onClick={handleResend}
            >
              Didn't get a verification email? Resend link.
            </div>
          )}
  
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Business Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="Enter your business email"
              />
            </div>
  
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
                <Link to="/request-password-reset" className="text-sm text-primary-600 hover:text-primary-400">
                  Forgot your password?
                </Link>
              </div>
            </div>
  
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-600 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
  
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-2.5 px-4 rounded-md font-medium hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in to Business Account'
              )}
            </button>
          </form>
        </div>
  
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center">
            <span>Don't have a business account?</span>
            <Link to="/register-business" className="font-medium text-primary-600 hover:text-primary-400 sm:ml-1">
              Register
            </Link>
          </div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-center">
            <span>Need a personal account?</span>
            <Link to="/sign-in" className="font-medium text-primary-600 hover:text-primary-400 sm:ml-1">
              Sign in as customer
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
  
};

export default BusinessLogin;
