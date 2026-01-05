import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { validateUsernameFormat, checkUsernameAvailability, debounce, generateUsernameSuggestion } from '../../utils/usernameValidation';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Country {
  code: string;
  name: string;
}

interface CountryConfig {
  country_code: string;
  country_name: string;
  required_documents: Array<{
    type: string;
    name: string;
    required: boolean;
  }>;
  field_validations: {
    [key: string]: {
      pattern: string;
      message: string;
    };
  };
  bank_fields: string[];
  tax_fields: string[];
}

const RegisterBusiness: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    // User details
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    confirm_password: '',
    username: '',  // Optional username field
    
    // Business details
    business_name: '',
    business_description: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    
    // Location details
    country_code: 'IN', // Default to India
    state_province: '',
    city: '',
    postal_code: ''
  });
  
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [supportedCountries, setSupportedCountries] = useState<Country[]>([]);
  const [countryConfig, setCountryConfig] = useState<CountryConfig | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ checking: boolean; available: boolean | null; message: string }>({
    checking: false,
    available: null,
    message: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/superadmin/dashboard');
      return;
    }
  }, [user, navigate]);

  // Fetch supported countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/merchants/supported-countries`);
        if (!response.ok) throw new Error('Failed to fetch countries');
        const data = await response.json();
        setSupportedCountries(data.countries);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);

  // Fetch country configuration when country changes
  useEffect(() => {
    const fetchCountryConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/merchants/country-config/${formData.country_code}`);
        if (!response.ok) throw new Error('Failed to fetch country configuration');
        const data = await response.json();
        setCountryConfig(data);
      } catch (error) {
        console.error('Error fetching country configuration:', error);
      }
    };

    fetchCountryConfig();
  }, [formData.country_code]);

  // Debounced username availability check
  const debouncedUsernameCheck = useCallback(
    debounce(async (username: string) => {
      if (!username) {
        setUsernameStatus({ checking: false, available: null, message: '' });
        return;
      }
      
      const formatCheck = validateUsernameFormat(username);
      if (!formatCheck.isValid) {
        setUsernameStatus({ checking: false, available: false, message: formatCheck.error || '' });
        return;
      }
      
      setUsernameStatus(prev => ({ ...prev, checking: true }));
      const result = await checkUsernameAvailability(username);
      setUsernameStatus({
        checking: false,
        available: result.available,
        message: result.error || (result.available ? 'Username is available' : 'Username is already taken')
      });
    }, 500),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear password error when user starts typing
    if (name === 'password' || name === 'confirm_password') {
      setPasswordError('');
    }
    
    // Handle username validation
    if (name === 'username') {
      setUsernameStatus({ checking: false, available: null, message: '' });
      debouncedUsernameCheck(value);
    }
    
    // Auto-suggest username when business_name or first_name changes
    if ((name === 'business_name' || name === 'first_name') && !formData.username) {
      const suggestion = generateUsernameSuggestion(
        name === 'business_name' ? value : formData.business_name,
        name === 'first_name' ? value : formData.first_name
      );
      if (suggestion) {
        // Don't auto-fill, just show as placeholder hint
      }
    }
  };

  const validatePassword = () => {
    if (formData.password !== formData.confirm_password) {
      setPasswordError("Passwords don't match");
      return false;
    }
    
    if (formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const validateCountrySpecificFields = () => {
    if (!countryConfig) return true;

    const errors: string[] = [];
    
    // Validate required tax fields
    countryConfig.tax_fields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        errors.push(`${field.replace('_', ' ').toUpperCase()} is required`);
      }
    });

    // Validate required bank fields
    countryConfig.bank_fields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        errors.push(`${field.replace('_', ' ').toUpperCase()} is required`);
      }
    });

    // Validate field patterns if available
    Object.entries(countryConfig.field_validations).forEach(([field, validation]) => {
      const value = formData[field as keyof typeof formData];
      if (value && !new RegExp(validation.pattern).test(value)) {
        errors.push(validation.message);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validatePassword()) {
      console.debug('Password validation failed:', passwordError);
      return;
    }
    
    if (!agreeToTerms) {
      console.debug('Terms agreement validation failed');
      setError('Please agree to the terms and conditions');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API - remove confirm_password as it's not needed in the backend
      const { confirm_password, ...apiData } = formData;
      
      // Ensure all required fields are present
      const requiredFields = [
        'first_name',
        'last_name',
        'business_name',
        'business_email',
        'password',
        'country_code',
        'state_province',
        'city',
        'postal_code'
      ];

      const missingFields = requiredFields.filter(field => !apiData[field as keyof typeof apiData]);
      if (missingFields.length > 0) {
        console.debug('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Format the data according to the backend schema
      const merchantData = {
        first_name: apiData.first_name,
        last_name: apiData.last_name,
        phone: apiData.phone || '',
        password: apiData.password,
        username: apiData.username || undefined,  // Include username if provided
        business_name: apiData.business_name,
        business_description: apiData.business_description || '',
        business_email: apiData.business_email,
        business_phone: apiData.business_phone || apiData.phone || '',
        business_address: apiData.business_address || '',
        country_code: apiData.country_code,
        state_province: apiData.state_province,
        city: apiData.city,
        postal_code: apiData.postal_code,
        role: 'merchant'
      };

      console.debug('Submitting merchant registration data:', {
        ...merchantData,
        password: '[REDACTED]' // Don't log the actual password
      });

      const response = await fetch(`${API_BASE_URL}/api/auth/register/merchant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(merchantData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.debug('Registration failed:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details
        });
        throw new Error(data.error || data.details || 'Failed to register');
      }
      
      console.debug('Registration successful:', {
        status: response.status,
        data: { ...data, password: '[REDACTED]' }
      });
      
      navigate('/verification-pending', { 
        state: { 
          business_email: formData.business_email,
          message: 'Please check your email to verify your account. You will be automatically logged in after verification.'
        } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Register Business Account</h1>
              <p className="text-gray-600">Create your merchant account to start selling on our platform</p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md whitespace-pre-line">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="First name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Phone number"
                  />
                </div>
                
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-gray-500 text-xs font-normal">(Optional - will be auto-generated if left empty)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                        usernameStatus.available === true
                          ? 'border-green-300 focus:ring-green-500'
                          : usernameStatus.available === false
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-primary-500'
                      }`}
                      placeholder={generateUsernameSuggestion(formData.business_name, formData.first_name) || 'Username (3-30 chars, alphanumeric + underscore)'}
                      maxLength={30}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {usernameStatus.checking ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      ) : usernameStatus.available === true ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : usernameStatus.available === false ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  {usernameStatus.message && (
                    <p className={`mt-1 text-sm ${
                      usernameStatus.available === true ? 'text-green-600' : 
                      usernameStatus.available === false ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {usernameStatus.message}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Business Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Business Information</h2>
                <div>
                  <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    id="business_name"
                    name="business_name"
                    type="text"
                    value={formData.business_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Business name"
                  />
                </div>
                
                <div>
                  <label htmlFor="business_description" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Description
                  </label>
                  <textarea
                    id="business_description"
                    name="business_description"
                    value={formData.business_description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe your business"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="business_email" className="block text-sm font-medium text-gray-700 mb-1">
                      Business Email
                    </label>
                    <input
                      id="business_email"
                      name="business_email"
                      type="email"
                      value={formData.business_email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="business@example.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="business_phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Business Phone
                    </label>
                    <input
                      id="business_phone"
                      name="business_phone"
                      type="tel"
                      value={formData.business_phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Business phone number"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="business_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address
                  </label>
                  <textarea
                    id="business_address"
                    name="business_address"
                    value={formData.business_address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Complete business address"
                  />
                </div>
              </div>
              
              {/* Location Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Business Location</h2>
                <div>
                  <label htmlFor="country_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    id="country_code"
                    name="country_code"
                    value={formData.country_code}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {supportedCountries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="state_province" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    id="state_province"
                    name="state_province"
                    type="text"
                    value={formData.state_province}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="State or Province"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      id="postal_code"
                      name="postal_code"
                      type="text"
                      value={formData.postal_code}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Postal Code"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Account Security</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                        placeholder="Create a password"
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
                  
                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm_password"
                        name="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        minLength={8}
                        className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10 ${
                          passwordError ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="h-4 w-4 text-[#F2631F] focus:ring-[#F2631F] border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#F2631F] hover:text-orange-400 transition-colors">
                    Terms and Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-[#F2631F] hover:text-orange-400 transition-colors">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !agreeToTerms}
                className="w-full bg-[#F2631F] text-white py-3 px-4 rounded-md font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : 'Register Business'}
              </button>
            </form>
          </div>
          
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              After registration, you'll need to complete your business verification by submitting required documents.
              Your account will be reviewed before you can start selling on our platform.
            </p>
          </div>
        </motion.div>
      </div>
      
      <div className="text-center mt-4 mb-8">
        <p className="text-gray-600 text-sm">
          Already have a business account? <Link to="/business/login" className="text-[#F2631F] hover:text-orange-400 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterBusiness;






// //new updated form with commented fields 
// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { useAuth } from '../../context/AuthContext';
// import { Eye, EyeOff } from 'lucide-react';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// // Country-related configs (CURRENTLY NOT USED – commented for now)

// // interface Country {
// //   code: string;
// //   name: string;
// // }

// // interface CountryConfig {
// //   country_code: string;
// //   country_name: string;
// //   required_documents: Array<{
// //     type: string;
// //     name: string;
// //     required: boolean;
// //   }>;
// //   field_validations: {
// //     [key: string]: {
// //       pattern: string;
// //       message: string;
// //     };
// //   };
// //   bank_fields: string[];
// //   tax_fields: string[];
// // }

// const RegisterBusiness: React.FC = () => {
//   const { user } = useAuth();
//   const [formData, setFormData] = useState({
//     // User details
//     first_name: '',
//     last_name: '',
//     phone: '',
//     password: '',
//     confirm_password: '',
    
//     // Business details
//     business_name: '',          // kept for backend, but hidden in UI
//     business_description: '',   // kept for backend, but hidden in UI
//     business_email: '',
//     business_phone: '',         // kept for backend, but hidden in UI
//     business_address: '',
    
//     // Location details (kept for backend, but hidden in UI)
//     country_code: '',       // earlier 'IN' – now empty so backend gets ""
//     state_province: '',
//     city: '',
//     postal_code: ''
//   });
  
//   const [passwordError, setPasswordError] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [agreeToTerms, setAgreeToTerms] = useState(false);
//   const [error, setError] = useState('');

//   // Country-related state (not needed right now – commented)
//   // const [supportedCountries, setSupportedCountries] = useState<Country[]>([]);
//   // const [countryConfig, setCountryConfig] = useState<CountryConfig | null>(null);

//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (user && user.role === 'admin') {
//       navigate('/superadmin/dashboard');
//       return;
//     }
//   }, [user, navigate]);

//   // Fetch supported countries (DISABLED for now)
//   // useEffect(() => {
//   //   const fetchCountries = async () => {
//   //     try {
//   //       const response = await fetch(`${API_BASE_URL}/api/merchants/supported-countries`);
//   //       if (!response.ok) throw new Error('Failed to fetch countries');
//   //       const data = await response.json();
//   //       setSupportedCountries(data.countries);
//   //     } catch (error) {
//   //       console.error('Error fetching countries:', error);
//   //     }
//   //   };

//   //   fetchCountries();
//   // }, []);

//   // Fetch country configuration when country changes (DISABLED for now)
//   // useEffect(() => {
//   //   const fetchCountryConfig = async () => {
//   //     try {
//   //       const response = await fetch(`${API_BASE_URL}/api/merchants/country-config/${formData.country_code}`);
//   //       if (!response.ok) throw new Error('Failed to fetch country configuration');
//   //       const data = await response.json();
//   //       setCountryConfig(data);
//   //     } catch (error) {
//   //       console.error('Error fetching country configuration:', error);
//   //     }
//   //   };

//   //   if (formData.country_code) {
//   //     fetchCountryConfig();
//   //   }
//   // }, [formData.country_code]);

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));

//     // Clear password error when user starts typing
//     if (name === 'password' || name === 'confirm_password') {
//       setPasswordError('');
//     }
//   };

//   const validatePassword = () => {
//     if (formData.password !== formData.confirm_password) {
//       setPasswordError("Passwords don't match");
//       return false;
//     }
    
//     if (formData.password.length < 8) {
//       setPasswordError("Password must be at least 8 characters");
//       return false;
//     }
    
//     setPasswordError('');
//     return true;
//   };

//   // Country specific validation disabled (no visible fields)
//   // const validateCountrySpecificFields = () => {
//   //   if (!countryConfig) return true;

//   //   const errors: string[] = [];
    
//   //   // Validate required tax fields
//   //   countryConfig.tax_fields.forEach(field => {
//   //     if (!formData[field as keyof typeof formData]) {
//   //       errors.push(`${field.replace('_', ' ').toUpperCase()} is required`);
//   //     }
//   //   });

//   //   // Validate required bank fields
//   //   countryConfig.bank_fields.forEach(field => {
//   //     if (!formData[field as keyof typeof formData]) {
//   //       errors.push(`${field.replace('_', ' ').toUpperCase()} is required`);
//   //     }
//   //   });

//   //   // Validate field patterns if available
//   //   Object.entries(countryConfig.field_validations).forEach(([field, validation]) => {
//   //     const value = formData[field as keyof typeof formData];
//   //     if (value && !new RegExp(validation.pattern).test(value)) {
//   //       errors.push(validation.message);
//   //     }
//   //   });

//   //   if (errors.length > 0) {
//   //     setError(errors.join('\n'));
//   //     return false;
//   //   }

//   //   return true;
//   // };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
    
//     if (!validatePassword()) {
//       console.debug('Password validation failed:', passwordError);
//       return;
//     }
    
//     if (!agreeToTerms) {
//       console.debug('Terms agreement validation failed');
//       setError('Please agree to the terms and conditions');
//       return;
//     }
    
//     setIsSubmitting(true);
    
//     try {
//       // Prepare data for API - remove confirm_password as it's not needed in the backend
//       const { confirm_password, ...apiData } = formData;
      
//       // Ensure all required fields are present
//       // NOTE: we only keep fields that user can actually fill in the UI
//       const requiredFields = [
//         'first_name',
//         'last_name',
//         'business_email',
//         'password'
//         // 'business_name',     // removed from required check (UI hidden)
//         // 'country_code',      // hidden, stays empty string
//         // 'state_province',    // hidden, stays empty string
//         // 'city',              // hidden, stays empty string
//         // 'postal_code'        // hidden, stays empty string
//       ];

//       const missingFields = requiredFields.filter(
//         field => !apiData[field as keyof typeof apiData]
//       );
//       if (missingFields.length > 0) {
//         console.debug('Missing required fields:', missingFields);
//         throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
//       }

//       // Format the data according to the backend schema
//       // We still send all fields to backend; for hidden ones we send empty string fallback
// const merchantData = {
//   first_name: apiData.first_name,
//   last_name: apiData.last_name,
//   phone: apiData.phone || '',
//   password: apiData.password,

//   // 🔥 Send safe backend-friendly hidden values
//   business_name: "Default Business",      // backend won't reject
//   business_description: "",               
//   business_email: apiData.business_email,
//   business_phone: apiData.phone || "0000000000",
//   business_address: apiData.business_address || "N/A",

//   country_code: "IN",                     // must be valid country
//   state_province: "Unknown",              // can't be empty
//   city: "Unknown",                        // can't be empty
//   postal_code: "000000",                  // must be valid format

//   role: "merchant"
// };


//       console.debug('Submitting merchant registration data:', {
//         ...merchantData,
//         password: '[REDACTED]' // Don't log the actual password
//       });

//       const response = await fetch(`${API_BASE_URL}/api/auth/register/merchant`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(merchantData),
//       });
      
//       const data = await response.json();
      
//       if (!response.ok) {
//         console.debug('Registration failed:', {
//           status: response.status,
//           statusText: response.statusText,
//           error: data.error,
//           details: data.details
//         });
//         throw new Error(data.error || data.details || 'Failed to register');
//       }
      
//       console.debug('Registration successful:', {
//         status: response.status,
//         data: { ...data, password: '[REDACTED]' }
//       });
      
//       navigate('/verification-pending', { 
//         state: { 
//           business_email: formData.business_email,
//           message: 'Please check your email to verify your account. You will be automatically logged in after verification.'
//         } 
//       });
//     } catch (err) {
//       console.error('Registration error:', err);
//       setError(err instanceof Error ? err.message : 'An error occurred during registration');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="bg-gray-50">
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <motion.div 
//           className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <div className="p-8">
//             <div className="text-center mb-8">
//               <h1 className="text-2xl font-bold text-gray-900 mb-2">Register Business Account</h1>
//               <p className="text-gray-600">Create your merchant account to start selling on our platform</p>
//             </div>
            
//             {error && (
//               <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md whitespace-pre-line">
//                 {error}
//               </div>
//             )}
            
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Personal Information */}
//               <div className="space-y-4">
//                 <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
//                       First Name
//                     </label>
//                     <input
//                       id="first_name"
//                       name="first_name"
//                       type="text"
//                       value={formData.first_name}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                       placeholder="First name"
//                     />
//                   </div>
                  
//                   <div>
//                     <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
//                       Last Name
//                     </label>
//                     <input
//                       id="last_name"
//                       name="last_name"
//                       type="text"
//                       value={formData.last_name}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                       placeholder="Last name"
//                     />
//                   </div>
//                 </div>
                
//                 <div>
//                   <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
//                     Phone
//                   </label>
//                   <input
//                     id="phone"
//                     name="phone"
//                     type="tel"
//                     value={formData.phone}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                     placeholder="Phone number"
//                   />
//                 </div>
//               </div>
              
//               {/* Business Information */}
//               <div className="space-y-4">
//                 <h2 className="text-lg font-medium text-gray-900">Business Information</h2>

//                 {/* Business Name (hidden from UI, kept in state for backend) */}
//                 {/*
//                 <div>
//                   <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">
//                     Business Name
//                   </label>
//                   <input
//                     id="business_name"
//                     name="business_name"
//                     type="text"
//                     value={formData.business_name}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                     placeholder="Business name"
//                   />
//                 </div>
//                 */}

//                 {/* Business Description (hidden from UI, kept in state for backend) */}
//                 {/*
//                 <div>
//                   <label htmlFor="business_description" className="block text-sm font-medium text-gray-700 mb-1">
//                     Business Description
//                   </label>
//                   <textarea
//                     id="business_description"
//                     name="business_description"
//                     value={formData.business_description}
//                     onChange={handleChange}
//                     rows={3}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                     placeholder="Describe your business"
//                   />
//                 </div>
//                 */}
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label htmlFor="business_email" className="block text-sm font-medium text-gray-700 mb-1">
//                       Business Email
//                     </label>
//                     <input
//                       id="business_email"
//                       name="business_email"
//                       type="email"
//                       value={formData.business_email}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                       placeholder="business@example.com"
//                     />
//                   </div>
                  
//                   {/* Business Phone (hidden from UI, kept in state for backend) */}
//                   {/*
//                   <div>
//                     <label htmlFor="business_phone" className="block text-sm font-medium text-gray-700 mb-1">
//                       Business Phone
//                     </label>
//                     <input
//                       id="business_phone"
//                       name="business_phone"
//                       type="tel"
//                       value={formData.business_phone}
//                       onChange={handleChange}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                       placeholder="Business phone number"
//                     />
//                   </div>
//                   */}
//                 </div>
                
//                 <div>
//                   <label htmlFor="business_address" className="block text-sm font-medium text-gray-700 mb-1">
//                     Business Address
//                   </label>
//                   <textarea
//                     id="business_address"
//                     name="business_address"
//                     value={formData.business_address}
//                     onChange={handleChange}
//                     rows={3}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                     placeholder="Complete business address"
//                   />
//                 </div>
//               </div>
              
//               {/* Business Location (FULLY HIDDEN FROM UI, but values exist in state & payload) */}
//               {/*
//               <div className="space-y-4">
//                 <h2 className="text-lg font-medium text-gray-900">Business Location</h2>
//                 <div>
//                   <label htmlFor="country_code" className="block text-sm font-medium text-gray-700 mb-1">
//                     Country
//                   </label>
//                   <select
//                     id="country_code"
//                     name="country_code"
//                     value={formData.country_code}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                   >
//                     {supportedCountries.map(country => (
//                       <option key={country.code} value={country.code}>
//                         {country.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label htmlFor="state_province" className="block text-sm font-medium text-gray-700 mb-1">
//                     State/Province
//                   </label>
//                   <input
//                     id="state_province"
//                     name="state_province"
//                     type="text"
//                     value={formData.state_province}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                     placeholder="State or Province"
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
//                       City
//                     </label>
//                     <input
//                       id="city"
//                       name="city"
//                       type="text"
//                       value={formData.city}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                       placeholder="City"
//                     />
//                   </div>
                  
//                   <div>
//                     <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
//                       Postal Code
//                     </label>
//                     <input
//                       id="postal_code"
//                       name="postal_code"
//                       type="text"
//                       value={formData.postal_code}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                       placeholder="Postal Code"
//                     />
//                   </div>
//                 </div>
//               </div>
//               */}

//               {/* Password */}
//               <div className="space-y-4">
//                 <h2 className="text-lg font-medium text-gray-900">Account Security</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//                       Password
//                     </label>
//                     <div className="relative">
//                       <input
//                         id="password"
//                         name="password"
//                         type={showPassword ? 'text' : 'password'}
//                         value={formData.password}
//                         onChange={handleChange}
//                         required
//                         minLength={8}
//                         className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
//                         placeholder="Create a password"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="absolute inset-y-0 right-0 px-3 flex items-center"
//                       >
//                         {showPassword ? (
//                           <EyeOff className="h-4 w-4 text-gray-400" />
//                         ) : (
//                           <Eye className="h-4 w-4 text-gray-400" />
//                         )}
//                       </button>
//                     </div>
//                   </div>
                  
//                   <div>
//                     <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
//                       Confirm Password
//                     </label>
//                     <div className="relative">
//                       <input
//                         id="confirm_password"
//                         name="confirm_password"
//                         type={showConfirmPassword ? 'text' : 'password'}
//                         value={formData.confirm_password}
//                         onChange={handleChange}
//                         required
//                         minLength={8}
//                         className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10 ${
//                           passwordError ? 'border-red-300' : 'border-gray-300'
//                         }`}
//                         placeholder="Confirm your password"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                         className="absolute inset-y-0 right-0 px-3 flex items-center"
//                       >
//                         {showConfirmPassword ? (
//                           <EyeOff className="h-4 w-4 text-gray-400" />
//                         ) : (
//                           <Eye className="h-4 w-4 text-gray-400" />
//                         )}
//                       </button>
//                     </div>
//                     {passwordError && (
//                       <p className="mt-1 text-sm text-red-600">{passwordError}</p>
//                     )}
//                   </div>
//                 </div>
//               </div>
              
//               <div className="flex items-center">
//                 <input
//                   id="terms"
//                   type="checkbox"
//                   required
//                   checked={agreeToTerms}
//                   onChange={(e) => setAgreeToTerms(e.target.checked)}
//                   className="h-4 w-4 text-[#F2631F] focus:ring-[#F2631F] border-gray-300 rounded"
//                 />
//                 <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
//                   I agree to the{' '}
//                   <Link to="/terms" className="text-[#F2631F] hover:text-orange-400 transition-colors">
//                     Terms and Conditions
//                   </Link>
//                   {' '}and{' '}
//                   <Link to="/privacy" className="text-[#F2631F] hover:text-orange-400 transition-colors">
//                     Privacy Policy
//                   </Link>
//                 </label>
//               </div>
              
//               <button
//                 type="submit"
//                 disabled={isSubmitting || !agreeToTerms}
//                 className="w-full bg-[#F2631F] text-white py-3 px-4 rounded-md font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
//               >
//                 {isSubmitting ? (
//                   <span className="flex items-center justify-center">
//                     <svg
//                       className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                       ></path>
//                     </svg>
//                     Registering...
//                   </span>
//                 ) : (
//                   'Register Business'
//                 )}
//               </button>
//             </form>
//           </div>
          
//           <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
//             <p className="text-sm text-gray-600">
//               After registration, you'll need to complete your business verification by submitting required documents.
//               Your account will be reviewed before you can start selling on our platform.
//             </p>
//           </div>
//         </motion.div>
//       </div>
      
//       <div className="text-center mt-4 mb-8">
//         <p className="text-gray-600 text-sm">
//           Already have a business account?{' '}
//           <Link
//             to="/business/login"
//             className="text-[#F2631F] hover:text-orange-400 font-medium"
//           >
//             Login
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default RegisterBusiness;
