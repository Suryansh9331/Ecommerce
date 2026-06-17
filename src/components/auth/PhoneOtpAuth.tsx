import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface PhoneOtpAuthProps {
  /** 'login' uses verify-login (existing users); 'signup' uses verify-signup (new users + name). */
  mode: 'login' | 'signup';
  /**
   * Called with the auth response { access_token, refresh_token, user } after a
   * successful verify. The parent wires this to AuthContext (login/register) so
   * token storage + redirect behave exactly like the email/Google flows.
   */
  onSuccess: (data: { access_token: string; refresh_token: string; user?: any }) => Promise<void> | void;
}

/**
 * Self-contained phone + OTP auth widget. Talks only to the existing backend
 * endpoints (/phone/send-otp, /phone/verify-signup, /phone/verify-login). It does
 * not touch global auth state directly — the parent's onSuccess does that, keeping
 * this component reusable for both SignIn and SignUp without breaking those flows.
 */
const PhoneOtpAuth: React.FC<PhoneOtpAuthProps> = ({ mode, onSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendOtp = async () => {
    setError('');
    const trimmed = phone.trim();
    if (!trimmed) {
      setError('Please enter your phone number.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/phone/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      setStep('otp');
      setResendIn(30);
      toast.success('OTP sent to your phone.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    if (mode === 'signup' && (!firstName.trim() || !lastName.trim())) {
      setError('Please enter your first and last name.');
      return;
    }
    setIsSubmitting(true);
    try {
      const endpoint =
        mode === 'signup'
          ? `${API_BASE_URL}/api/auth/phone/verify-signup`
          : `${API_BASE_URL}/api/auth/phone/verify-login`;
      const body =
        mode === 'signup'
          ? { phone: phone.trim(), otp: otp.trim(), first_name: firstName.trim(), last_name: lastName.trim() }
          : { phone: phone.trim(), otp: otp.trim() };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      if (!data.access_token || !data.refresh_token) {
        throw new Error('Verification did not return a session. Please try again.');
      }
      await onSuccess(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:border-transparent';

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {step === 'phone' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="phone-otp-number" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number*
            </label>
            <input
              id="phone-otp-number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+91 98765 43210"
            />
            <p className="mt-1 text-xs text-gray-400">Include your country code, e.g. +91.</p>
          </div>
          <button
            type="button"
            onClick={sendOtp}
            disabled={isSubmitting}
            className="w-full bg-[#F2631F] hover:bg-orange-600 text-white py-2 px-6 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <form onSubmit={verifyOtp} className="space-y-4">
          {mode === 'signup' && (
            <div className="flex flex-col space-y-4">
              <div>
                <label htmlFor="phone-otp-first" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name*
                </label>
                <input
                  id="phone-otp-first"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  placeholder="Type your first name"
                />
              </div>
              <div>
                <label htmlFor="phone-otp-last" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name*
                </label>
                <input
                  id="phone-otp-last"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  placeholder="Type your last name"
                />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="phone-otp-code" className="block text-sm font-medium text-gray-700 mb-1">
              Enter 6-digit OTP*
            </label>
            <input
              id="phone-otp-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className={`${inputClass} tracking-[0.5em] text-center`}
              placeholder="------"
            />
            <p className="mt-1 text-xs text-gray-400">Sent to {phone}.</p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#F2631F] hover:bg-orange-600 text-white py-2 px-6 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verifying...' : mode === 'signup' ? 'Verify & Create Account' : 'Verify & Sign In'}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError('');
              }}
              className="text-gray-500 hover:underline"
            >
              Change number
            </button>
            <button
              type="button"
              onClick={sendOtp}
              disabled={isSubmitting || resendIn > 0}
              className="text-[#F2631F] hover:text-orange-600 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneOtpAuth;
