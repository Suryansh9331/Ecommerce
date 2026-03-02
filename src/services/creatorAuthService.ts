const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export interface SignupRequestPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface SignupRequestResponse {
  message: string;
  expires_in: number;
}

export interface ResendOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: number;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    role: string;
    is_phone_verified?: boolean;
  };
}

export interface OnboardingPayload {
  category_ids: number[];
  availability: 'available' | 'busy';
  portfolio_links?: string[];
  language_preferences?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export async function creatorSignupRequest(
  payload: SignupRequestPayload
): Promise<SignupRequestResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/creator/signup-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data } as ApiError & { status: number };
  return data;
}

export async function creatorResendOtp(payload: ResendOtpPayload): Promise<SignupRequestResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/creator/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data } as ApiError & { status: number };
  return data;
}

export async function creatorVerifyOtp(
  payload: VerifyOtpPayload
): Promise<VerifyOtpResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/creator/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data } as ApiError & { status: number };
  return data;
}

export async function creatorCompleteOnboarding(
  payload: OnboardingPayload,
  accessToken: string
): Promise<{ message: string; creator_profile: unknown; categories: unknown[] }> {
  const res = await fetch(`${API_BASE_URL}/api/creator/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data } as ApiError & { status: number };
  return data;
}

export interface CategoryOption {
  category_id: number;
  name: string;
  slug: string;
  icon_url?: string | null;
}

export async function fetchCategoriesForCreator(): Promise<CategoryOption[]> {
  const res = await fetch(`${API_BASE_URL}/api/categories/with-icons`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}
