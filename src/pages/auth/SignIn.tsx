import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import PhoneOtpAuth from '../../components/auth/PhoneOtpAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SignIn: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // pull in login + resend helpers
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
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.status === 200) {
        // Successful login
        const userObj = {
          id: data.user?.id || 'unknown',
          email: data.user?.email || email,
          name: `${data.user?.first_name || ''} ${data.user?.last_name || ''}`.trim() || 'User',
          role: (data.user?.role === 'MERCHANT'
            ? 'merchant'
            : data.user?.role === 'ADMIN'
            ? 'admin'
            : 'customer') as 'merchant' | 'customer' | 'admin',
          isEmailVerified: data.user?.is_email_verified ?? false,
          businessName: '',
        };

        // Prevent merchant login
        if (data.user?.role === 'MERCHANT') {
          setError('Merchants must sign in through the merchant dashboard.');
          toast.error('Merchants must sign in through the merchant dashboard.');
          setIsSubmitting(false);
          return;
        }

        const success = await setAuthState({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: userObj
        });
        if (success) {
          toast.success('Successfully signed in!');
          navigate('/');
        }
      } else {
        // Handle unverified-email case
        if (data.error_code === 'EMAIL_NOT_VERIFIED') {
          setError('Your email is not verified.');
          setShowResend(true);
          toast.error('Your email is not verified.');
        } else {
          throw new Error(data.error || 'Failed to sign in');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign in';
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
        setError('Verification email resent! Check your inbox.');
        toast.success('Verification email resent! Check your inbox.');
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

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const id_token = credentialResponse.credential;
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Google sign-in failed');

      // Prevent merchant login
      if (data.user?.role === 'MERCHANT') {
        setError('Merchants must sign in through the merchant dashboard.');
        toast.error('Merchants must sign in through the merchant dashboard.');
        return;
      }

      const userObj = {
        id: data.user?.id || 'unknown',
        email: data.user?.email || '',
        name: `${data.user?.first_name || ''} ${data.user?.last_name || ''}`.trim() || 'User',
        role: (data.user?.role === 'MERCHANT'
          ? 'merchant'
          : data.user?.role === 'ADMIN'
          ? 'admin'
          : 'customer') as 'merchant' | 'customer' | 'admin',
        isEmailVerified: data.user?.is_email_verified ?? false,
        businessName: '',
      };

      const success = await setAuthState({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: userObj
      });
      if (success) {
        toast.success('Successfully signed in with Google!');
        navigate('/');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign-in error';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleGoogleError = () => {
    const errorMessage = 'Google sign-in was unsuccessful. Please try again.';
    setError(errorMessage);
    toast.error(errorMessage);
  };

  // Shared handler for phone-OTP login success — mirrors the email/Google path
  // (same merchant guard, same setAuthState, same redirect).
  const handlePhoneSuccess = async (data: { access_token: string; refresh_token: string; user?: any }) => {
    if (data.user?.role === 'MERCHANT') {
      setError('Merchants must sign in through the merchant dashboard.');
      toast.error('Merchants must sign in through the merchant dashboard.');
      return;
    }
    const userObj = {
      id: data.user?.id || 'unknown',
      email: data.user?.email || '',
      name: `${data.user?.first_name || ''} ${data.user?.last_name || ''}`.trim() || 'User',
      role: (data.user?.role === 'MERCHANT'
        ? 'merchant'
        : data.user?.role === 'ADMIN'
        ? 'admin'
        : 'customer') as 'merchant' | 'customer' | 'admin',
      isEmailVerified: data.user?.is_email_verified ?? false,
      businessName: '',
    };
    const success = await setAuthState({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: userObj,
    });
    if (success) {
      toast.success('Successfully signed in!');
      navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center bg-[#FAFAFA] px-2 py-8">
      <div className="w-full max-w-5xl flex flex-col md:flex-row md:space-x-8 space-y-8 md:space-y-0">
        {/* Registered Customers */}
        <div className="flex-1 bg-white rounded-xl shadow-sm p-8 md:p-10">
          <h2 className="text-xl font-semibold mb-2">Registered Customers</h2>
          <p className="text-gray-600 mb-6 text-sm">
            If you have an account, sign in with your email address.
          </p>

          {/* Method toggle: Email (password) vs Phone (OTP) */}
          <div className="mb-6 flex rounded-md border border-gray-200 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => { setAuthMethod('email'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                authMethod === 'email' ? 'bg-white text-[#F2631F] shadow-sm' : 'text-gray-500'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('phone'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                authMethod === 'phone' ? 'bg-white text-[#F2631F] shadow-sm' : 'text-gray-500'
              }`}
            >
              Phone
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {authMethod === 'phone' && (
            <PhoneOtpAuth mode="login" onSuccess={handlePhoneSuccess} />
          )}

          {authMethod === 'email' && showResend && !isSubmitting && (
            <div
              className="mb-4 text-sm text-[#F2631F] cursor-pointer hover:underline"
              onClick={handleResend}
            >
              Didn't get a verification email? Resend link.
            </div>
          )}

          {authMethod === 'email' && !showResend && !isSubmitting && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password*
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:border-transparent pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#F2631F] hover:bg-orange-600 text-white py-2 px-6 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
                <Link
                  to="/request-password-reset"
                  className="text-sm text-[#F2631F] hover:text-orange-600 font-medium"
                >
                  Forgot Password
                </Link>
              </div>
            </form>
          )}
  
          <div className="my-6 flex items-center gap-4">
            <div className="flex-grow h-px bg-gray-200" />
            <span className="text-sm text-gray-400">OR</span>
            <div className="flex-grow h-px bg-gray-200" />
          </div>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            shape="rectangular"
            logo_alignment="center"
          />
        </div>

        {/* New Customers card */}
        <div className="flex-1 bg-white rounded-xl shadow-sm p-8 md:p-10">
          <h2 className="text-xl font-semibold mb-2">New Customers</h2>
          <p className="text-gray-600 mb-6 text-sm max-w-xs">
            Creating an account has many benefits: check out faster, keep more than one address,
            track orders and more.
          </p>
          <Link
            to="/signup"
            className="bg-[#F2631F] hover:bg-orange-600 text-white py-2 px-6 rounded-md font-medium transition-colors"
          >
            Create An Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;