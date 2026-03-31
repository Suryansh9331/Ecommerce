import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { phoneSendOtp, phoneVerifyLogin } from '../../services/creatorAuthService';

const RESEND_COOLDOWN_SEC = 60;

const CreatorLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthState } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const normalizePhone = (p: string) => p.trim().replace(/[\s\-\(\)]/g, '');
  const digitsOnly = (p: string) => p.replace(/\D/g, '');
  const toE164 = (p: string): string => {
    const raw = normalizePhone(p);
    const digits = digitsOnly(raw);
    if (digits.length < 10 || digits.length > 15) return raw.startsWith('+') ? raw : '';
    if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
    if (digits.length === 11 && digits.startsWith('91')) return `+${digits}`;
    if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
    return raw.startsWith('+') ? raw : `+${digits}`;
  };
  const isValidPhone = (p: string) => {
    const d = digitsOnly(normalizePhone(p));
    return d.length >= 10 && d.length <= 15;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ph = normalizePhone(phone);
    if (!isValidPhone(ph)) {
      setError('Enter a valid 10–15 digit phone number (e.g. 9876543210 or +919876543210).');
      return;
    }
    const phoneE164 = toE164(ph);
    setIsSubmitting(true);
    try {
      const otpRes = await phoneSendOtp(phoneE164);
      setPhone(phoneE164);
      setStep('otp');
      setResendCooldown(RESEND_COOLDOWN_SEC);
      if (otpRes.dev_otp) {
        setOtp(otpRes.dev_otp);
        toast.success(`[DEV] OTP auto-filled: ${otpRes.dev_otp}`);
      } else {
        toast.success('OTP sent to your phone.');
      }
    } catch (err: unknown) {
      const apiErr = err as { error?: string; code?: string };
      const msg = apiErr?.error || 'Failed to send OTP.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await phoneSendOtp(phone);
      setOtp('');
      toast.success('OTP sent again. Enter the new code.');
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; error?: string; detail?: { retry_after_seconds?: number } };
      const msg = apiErr?.error || 'Failed to resend OTP.';
      if (apiErr?.status === 429) {
        const sec = apiErr?.detail?.retry_after_seconds;
        setResendCooldown(typeof sec === 'number' && sec > 0 ? sec : RESEND_COOLDOWN_SEC);
      }
      setError(msg);
      toast.error(msg);
    }
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await phoneVerifyLogin(phone, code);
      const role = (data.user?.role || '').toLowerCase();
      if (role !== 'creator') {
        setError('This phone number is not registered as a creator. Sign up as a creator first.');
        toast.error('Not a creator account.');
        setIsSubmitting(false);
        return;
      }
      await setAuthState({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: {
          id: String(data.user.id),
          email: data.user.email || '',
          name: [data.user.first_name, data.user.last_name].filter(Boolean).join(' ').trim() || 'Creator',
          role: 'creator',
          isEmailVerified: data.user.is_phone_verified ?? false,
          businessName: '',
        },
      });
      toast.success('Welcome back!');
      navigate('/creator/dashboard', { replace: true });
    } catch (err: unknown) {
      const apiErr = err as { error?: string; code?: string };
      const msg = apiErr?.error || 'Verification failed.';
      if (apiErr?.code === 'OTP_INVALID') {
        setError('Invalid or expired code. Try again or resend.');
      } else {
        setError(msg);
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAFAFA] py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8 md:p-10">
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-2">
          Creator Log in
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          {step === 'phone' ? 'Enter your phone number to receive an OTP.' : `We sent a code to ${phone}.`}
        </p>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:border-transparent"
                placeholder="9876543210 or +919876543210"
              />
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FF4D00] text-white py-2.5 rounded-lg font-medium hover:bg-[#e64500] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:ring-offset-2"
            >
              {isSubmitting ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:border-transparent"
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-[#F2631F] hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); setOtp(''); }}
                className="text-gray-500 hover:underline"
              >
                Change number
              </button>
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting || otp.replace(/\D/g, '').length !== 6}
              className="w-full bg-[#FF4D00] text-white py-2.5 rounded-lg font-medium hover:bg-[#e64500] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:ring-offset-2"
            >
              {isSubmitting ? 'Verifying…' : 'Log in'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          New creator?{' '}
          <Link to="/creator/signup" className="text-[#F2631F] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CreatorLogin;
