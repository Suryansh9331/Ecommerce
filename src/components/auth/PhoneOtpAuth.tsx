import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fixed country for now (backend normalizes to E.164). Indian mobile numbers are
// 10 digits and start with 6-9.
const COUNTRY_DIAL_CODE = '+91';
const LOCAL_NUMBER_LENGTH = 10;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

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

/** Group the 10 local digits as "98765 43210" for display. */
const formatLocalNumber = (digits: string): string => {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
};

/**
 * Self-contained phone + OTP auth widget. Talks only to the existing backend
 * endpoints (/phone/send-otp, /phone/verify-signup, /phone/verify-login). It does
 * not touch global auth state directly — the parent's onSuccess does that, keeping
 * this component reusable for both SignIn and SignUp without breaking those flows.
 *
 * The phone state stores ONLY the 10 local digits; the +91 prefix is rendered in
 * the UI and prepended when calling the API (E.164: +91XXXXXXXXXX).
 */
const PhoneOtpAuth: React.FC<PhoneOtpAuthProps> = ({ mode, onSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [localNumber, setLocalNumber] = useState(''); // 10 digits, no country code
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const e164Phone = `${COUNTRY_DIAL_CODE}${localNumber}`;
  const isValidPhone = INDIAN_MOBILE_REGEX.test(localNumber);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Strip everything except digits and cap at the local number length.
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, LOCAL_NUMBER_LENGTH);
    setLocalNumber(digitsOnly);
    if (error) setError('');
  };

  // Block non-numeric key presses for clearer UX (paste is still sanitized above).
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  const sendOtp = async () => {
    setError('');
    if (!isValidPhone) {
      const msg = 'Enter a valid 10-digit mobile number.';
      setError(msg);
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/phone/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164Phone }),
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
    if (otp.length !== 6) {
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
          ? { phone: e164Phone, otp, first_name: firstName.trim(), last_name: lastName.trim() }
          : { phone: e164Phone, otp };
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
    'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent';

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
            <div className="flex">
              {/* Fixed country-code prefix */}
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-sm select-none">
                {COUNTRY_DIAL_CODE}
              </span>
              <input
                id="phone-otp-number"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={formatLocalNumber(localNumber)}
                onChange={handlePhoneChange}
                onKeyDown={handlePhoneKeyDown}
                maxLength={LOCAL_NUMBER_LENGTH + 1} // +1 for the space separator
                className="w-full px-4 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="98765 43210"
                aria-invalid={localNumber.length > 0 && !isValidPhone}
              />
            </div>
            {localNumber.length > 0 && !isValidPhone ? (
              <p className="mt-1 text-xs text-red-500">Enter a valid 10-digit mobile number.</p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">We'll send a one-time code to this number.</p>
            )}
          </div>
          <button
            type="button"
            onClick={sendOtp}
            disabled={isSubmitting || !isValidPhone}
            className="w-full bg-primary-600 hover:bg-primary-600 text-white py-2 px-6 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`${inputClass} tracking-[0.5em] text-center`}
              placeholder="------"
            />
            <p className="mt-1 text-xs text-gray-400">
              Sent to {COUNTRY_DIAL_CODE} {formatLocalNumber(localNumber)}.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full bg-primary-600 hover:bg-primary-600 text-white py-2 px-6 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              className="text-primary-600 hover:text-primary-600 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
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
