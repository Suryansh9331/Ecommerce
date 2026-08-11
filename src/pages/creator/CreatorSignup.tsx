import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Check, LayoutGrid, Sparkles, Calendar, Clock } from 'lucide-react';
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
      const signupRes = await creatorSignupRequest({
        first_name: f,
        last_name: l,
        email: em,
        phone: phoneE164,
      });
      if (signupRes.dev_otp) {
        setOtp(signupRes.dev_otp);
        toast.success(`[DEV] OTP auto-filled: ${signupRes.dev_otp}`);
      } else {
        toast.success('OTP sent to your phone.');
      }
      setStep(2);
      setPhone(phoneE164);
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; error?: string; code?: string; detail?: { field?: string } };
      const msg = apiErr?.error || 'Something went wrong.';
      const code = apiErr?.code;
      if (code === 'ALREADY_REGISTERED' || apiErr?.status === 409) {
        setStep1Error('Already registered. Try logging in.');
      } else if (code === 'VALIDATION_ERROR' && apiErr?.detail?.field) {
        setStep1Error(msg);
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
      setOtp('');
      toast.success('OTP sent again. Enter the new code.');
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; error?: string; code?: string; detail?: { retry_after_seconds?: number } };
      const msg = apiErr?.error || 'Failed to resend OTP.';
      if (apiErr?.code === 'SESSION_EXPIRED' || (apiErr?.status === 400 && msg.toLowerCase().includes('session expired'))) {
        setStep2Error('Session expired. Please enter your details again.');
        setStep(1);
      } else if (apiErr?.status === 429) {
        const sec = apiErr?.detail?.retry_after_seconds;
        setResendCooldown(typeof sec === 'number' && sec > 0 ? sec : RESEND_COOLDOWN_SEC);
        setStep2Error(msg);
      } else {
        setStep2Error(msg);
      }
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
      toast.success(data.message || 'Account created. Complete your profile by selecting 5 categories.');
      setStep(3);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; error?: string; code?: string };
      const msg = apiErr?.error || 'Verification failed.';
      const code = apiErr?.code;
      if (code === 'OTP_INVALID' || msg.toLowerCase().includes('invalid or expired')) {
        setStep2Error('Invalid or expired code. Try again or resend.');
      } else if (code === 'OTP_ALREADY_USED' || msg.toLowerCase().includes('already used')) {
        setStep2Error('This code was already used. Request a new OTP.');
      } else if (code === 'SESSION_EXPIRED' || (msg.toLowerCase().includes('session expired'))) {
        setStep2Error('Session expired. Please enter your details again.');
        setStep(1);
      } else if (code === 'ALREADY_REGISTERED' || apiErr?.status === 409) {
        setStep2Error('Already registered. Try logging in.');
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
      toast.success('Onboarding completed. Your creator account is ready.');
      navigate('/creator/dashboard', { replace: true });
    } catch (err: unknown) {
      const apiErr = err as { status?: number; error?: string; code?: string };
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
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            1
          </span>
          <span className="h-0.5 w-8 bg-gray-300" />
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            2
          </span>
          <span className="h-0.5 w-8 bg-gray-300" />
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-primary-600 hover:underline disabled:opacity-50 disabled:no-underline"
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
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
            >
              {isSubmitting2 ? 'Verifying…' : 'Verify & continue'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-6">
            {categoriesLoading ? (
              <div className="py-12 space-y-4">
                <div className="flex justify-center">
                  <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-center text-gray-500 text-sm">Loading your categories…</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-gray-100 animate-pulse"
                      style={{ animationDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-primary-600 text-sm font-medium mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Almost there</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    What do you create?
                  </h2>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Pick 5 categories so brands can find you for the right campaigns.
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <LayoutGrid className="w-4 h-4 text-primary-600" />
                      Categories
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        selectedCategoryIds.length >= 5 ? 'text-primary-600' : 'text-gray-500'
                      }`}
                    >
                      {selectedCategoryIds.length}/5
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-600 transition-all duration-300 ease-out"
                      style={{ width: `${(selectedCategoryIds.length / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.category_id);
                    return (
                      <button
                        key={cat.category_id}
                        type="button"
                        onClick={() => toggleCategory(cat.category_id)}
                        className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 text-left transition-all duration-200 ease-out min-h-[72px] ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                          </span>
                        )}
                        {cat.icon_url ? (
                          <img
                            src={cat.icon_url}
                            alt=""
                            className="w-8 h-8 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <LayoutGrid className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span
                          className={`text-xs font-medium leading-tight line-clamp-2 ${
                            isSelected ? 'text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    Availability
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAvailability('available')}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all duration-200 ${
                        availability === 'available'
                          ? 'border-primary-600 bg-primary-50 text-gray-900'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Check
                        className={`w-4 h-4 ${availability === 'available' ? 'text-primary-600' : 'text-gray-300'}`}
                        strokeWidth={2}
                      />
                      <span className="text-sm font-medium">Available</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvailability('busy')}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all duration-200 ${
                        availability === 'busy'
                          ? 'border-primary-600 bg-primary-50 text-gray-900'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Clock
                        className={`w-4 h-4 ${availability === 'busy' ? 'text-primary-600' : 'text-gray-300'}`}
                        strokeWidth={2}
                      />
                      <span className="text-sm font-medium">Busy</span>
                    </button>
                  </div>
                </div>

                {step3Error && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm"
                    role="alert"
                  >
                    {step3Error}
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <p className="text-center text-xs text-gray-400">
                    You can update categories later from your profile.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting3 || selectedCategoryIds.length < 5}
                    className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 transition-colors"
                  >
                    {isSubmitting3 ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Completing…
                      </span>
                    ) : (
                      'Complete my profile'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/creator/login" className="text-primary-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CreatorSignup;
