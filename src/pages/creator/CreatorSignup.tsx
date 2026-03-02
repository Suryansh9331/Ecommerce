import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  creatorSignupRequest,
  creatorResendOtp,
  creatorVerifyOtp,
  creatorCompleteOnboarding,
  fetchCategoriesForCreator,
  type CategoryOption,
} from '../../services/creatorAuthService';

const RESEND_COOLDOWN_SEC = 60;

type Step = 1 | 2 | 3;

const CreatorSignup: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthState } = useAuth();

  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [step1Error, setStep1Error] = useState('');
  const [isSubmitting1, setIsSubmitting1] = useState(false);

  // Step 2
  const [otp, setOtp] = useState('');
  const [step2Error, setStep2Error] = useState('');
  const [isSubmitting2, setIsSubmitting2] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 3
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [availability, setAvailability] = useState<'available' | 'busy'>('available');
  const [step3Error, setStep3Error] = useState('');
  const [isSubmitting3, setIsSubmitting3] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Tokens from step 2 for step 3
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const normalizePhone = (p: string) => p.trim().replace(/[\s\-\(\)]/g, '');
  const digitsOnly = (p: string) => p.replace(/\D/g, '');
  /** Normalize to E.164 for API: e.g. 9876543210 → +919876543210, 919876543210 → +919876543210 */
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
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error('');
    const f = firstName.trim();
    const l = lastName.trim();
    const em = email.trim();
    const ph = normalizePhone(phone);

    if (!f || !l) {
      setStep1Error('First name and last name are required.');
      return;
    }
    if (!isValidEmail(em)) {
      setStep1Error('Valid email is required.');
      return;
    }
    if (!isValidPhone(ph)) {
      setStep1Error('Enter a valid 10–15 digit phone number (e.g. 9876543210 or +919876543210).');
      return;
    }
    const phoneE164 = toE164(ph);

    setIsSubmitting1(true);
    try {
      await creatorSignupRequest({
        first_name: f,
        last_name: l,
        email: em,
        phone: phoneE164,
      });
      toast.success('OTP sent to your phone.');
      setStep(2);
      setPhone(phoneE164);
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; error?: string };
      const msg = apiErr?.error || 'Something went wrong.';
      if (apiErr?.status === 409) {
        if (msg.toLowerCase().includes('phone')) {
          setStep1Error('This number is already registered. Try logging in.');
        } else {
          setStep1Error('This email is already registered.');
        }
      } else {
        setStep1Error(msg);
      }
      toast.error(msg);
    } finally {
      setIsSubmitting1(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    if (!phone) return;
    setStep2Error('');
    try {
      await creatorResendOtp({ phone });
      toast.success('OTP sent again.');
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; error?: string };
      const msg = apiErr?.error || 'Failed to resend OTP.';
      setStep2Error(msg);
      toast.error(msg);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Error('');
    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) {
      setStep2Error('Please enter a 6-digit OTP.');
      return;
    }

    setIsSubmitting2(true);
    try {
      const data = await creatorVerifyOtp({ phone, otp: code });
      setAccessToken(data.access_token);
      await setAuthState({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: {
          id: String(data.user.id),
          email: data.user.email,
          name: `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim() || 'User',
          role: 'creator',
          isEmailVerified: data.user.is_phone_verified ?? false,
          businessName: '',
        },
      });
      toast.success('Account created. Select your categories.');
      setStep(3);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; error?: string };
      const msg = apiErr?.error || 'Verification failed.';
      if (msg.toLowerCase().includes('invalid or expired')) {
        setStep2Error('Wrong or expired code. Try again or resend OTP.');
      } else if (msg.toLowerCase().includes('session expired')) {
        setStep2Error('Session expired. Please enter your details again.');
        setStep(1);
      } else {
        setStep2Error(msg);
      }
      toast.error(msg);
    } finally {
      setIsSubmitting2(false);
    }
  };

  useEffect(() => {
    if (step !== 3 || !accessToken) return;
    setCategoriesLoading(true);
    fetchCategoriesForCreator()
      .then(setCategories)
      .catch(() => {
        toast.error('Failed to load categories.');
        setStep3Error('Failed to load categories.');
      })
      .finally(() => setCategoriesLoading(false));
  }, [step, accessToken]);

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep3Error('');
    if (selectedCategoryIds.length < 5) {
      setStep3Error('Please select at least 5 categories.');
      toast.error('Select at least 5 categories.');
      return;
    }
    if (!accessToken) {
      setStep3Error('Session expired. Please sign up again.');
      setStep(1);
      setAccessToken(null);
      return;
    }

    setIsSubmitting3(true);
    try {
      await creatorCompleteOnboarding(
        {
          category_ids: selectedCategoryIds,
          availability,
          language_preferences: 'en',
        },
        accessToken
      );
      toast.success('You’re all set! Welcome to the creator program.');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const apiErr = err as { status?: number; error?: string };
      const msg = apiErr?.error || 'Failed to complete onboarding.';
      setStep3Error(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting3(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAFAFA] py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8 md:p-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-[#FF4D00] text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            1
          </span>
          <span className="h-0.5 w-8 bg-gray-300" />
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-[#FF4D00] text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            2
          </span>
          <span className="h-0.5 w-8 bg-gray-300" />
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? 'bg-[#FF4D00] text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            3
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-2">
          Creator Sign Up
        </h1>
        <p className="text-center text-gray-600 text-sm mb-6">
          {step === 1 && 'Enter your details to get started'}
          {step === 2 && `We sent a code to ${phone || 'your phone'}`}
          {step === 3 && 'Select 5 categories you create content for'}
        </p>

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:border-transparent"
                placeholder="Jane"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:border-transparent"
                placeholder="Creator"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:border-transparent"
                placeholder="jane@example.com"
                required
              />
            </div>
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
            {step1Error && (
              <p className="text-sm text-red-600" role="alert">
                {step1Error}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting1}
              className="w-full bg-[#FF4D00] text-white py-2.5 rounded-lg font-medium hover:bg-[#e64500] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:ring-offset-2"
            >
              {isSubmitting1 ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
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
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-[#F2631F] hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
            {step2Error && (
              <p className="text-sm text-red-600" role="alert">
                {step2Error}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting2 || otp.replace(/\D/g, '').length !== 6}
              className="w-full bg-[#FF4D00] text-white py-2.5 rounded-lg font-medium hover:bg-[#e64500] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:ring-offset-2"
            >
              {isSubmitting2 ? 'Verifying…' : 'Verify & continue'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4">
            {categoriesLoading ? (
              <p className="text-center text-gray-500">Loading categories…</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Select exactly 5 categories ({selectedCategoryIds.length}/5 selected).
                </p>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {categories.map((cat) => (
                    <label
                      key={cat.category_id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                        selectedCategoryIds.includes(cat.category_id)
                          ? 'bg-orange-50 border border-orange-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.category_id)}
                        onChange={() => toggleCategory(cat.category_id)}
                        className="rounded border-gray-300 text-[#FF4D00] focus:ring-[#F2631F]"
                      />
                      <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as 'available' | 'busy')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                  </select>
                </div>
                {step3Error && (
                  <p className="text-sm text-red-600" role="alert">
                    {step3Error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting3 || selectedCategoryIds.length < 5}
                  className="w-full bg-[#FF4D00] text-white py-2.5 rounded-lg font-medium hover:bg-[#e64500] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#F2631F] focus:ring-offset-2"
                >
                  {isSubmitting3 ? 'Completing…' : 'Complete sign up'}
                </button>
              </>
            )}
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/sign-in" className="text-[#F2631F] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CreatorSignup;
