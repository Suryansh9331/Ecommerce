import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  UserCircleIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import BioSection from '../../components/business/profile/BioSection';
import IntroVideoSection from '../../components/business/profile/IntroVideoSection';
import type { BioFields } from '../../services/merchantProfileApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CountryConfig {
  country_code: string;
  country_name: string;
  required_documents: Array<{
    type: string;
    name: string;
    required: boolean;
  }>;
  field_validations: Record<string, { pattern: string; message: string }>;
  bank_fields: string[] | Record<string, unknown>;
  tax_fields: string[] | Record<string, unknown>;
}

interface DocumentUpload {
  id: string;
  file: File | null;
  status: 'pending' | 'uploaded' | 'error';
  required: boolean;
  documentType: string;
  name: string;
  fileUrl?: string | null;
}

interface BusinessDetails {
  gstin?: string;
  panNumber?: string;
  taxId?: string;
  vatNumber?: string;
  salesTaxNumber?: string;
}

interface BankDetails {
  accountNumber: string;
  bankName: string;
  bankBranch?: string;
  ifscCode?: string;
  swiftCode?: string;
  routingNumber?: string;
  iban?: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [countryConfig, setCountryConfig] = useState<CountryConfig | null>(null);
  const [supportedCountries, setSupportedCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [documents, setDocuments] = useState<{ [key: string]: DocumentUpload }>({});
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    gstin: '',
    panNumber: '',
    taxId: '',
    vatNumber: '',
    salesTaxNumber: ''
  });
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountNumber: '',
    bankName: '',
    bankBranch: '',
    ifscCode: '',
    swiftCode: '',
    routingNumber: '',
    iban: ''
  });
  const [bio, setBio] = useState<BioFields>({ bio: null, bio_link: null, bio_link_label: null });
  const [profileLimits, setProfileLimits] = useState<{
    bio_max_chars?: number;
    bio_max_lines?: number;
    bio_link_label_max_chars?: number;
  }>({});
  
  // Mock data - replace with actual user data
  const [profileData, setProfileData] = useState({
    personalInfo: {
      name: '',
      email: '',
      phone: ''
    },
    businessInfo: {
      businessName: '',
      businessDescription: '',
      registrationNumber: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      website: ''
    },
    accountInfo: {
      accountNumber: '',
      bankName: '',
      branchName: '',
      ifscCode: '',
      accountType: ''
    }
  });

  const token = localStorage.getItem('access_token');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/merchants/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.message || 'Failed to fetch profile');
      }
      
      const data = await res.json();
      const p = data.profile || {};
      setBio({
        bio: p.bio ?? null,
        bio_link: p.bio_link ?? null,
        bio_link_label: p.bio_link_label ?? null
      });
      setProfileLimits(data.limits || {});
      setProfileData(() => ({
        personalInfo: {
          name: `${(user as unknown as { first_name?: string; last_name?: string })?.first_name || ''} ${(user as unknown as { first_name?: string; last_name?: string })?.last_name || ''}`.trim(),
          email: user?.email || '',
          phone: p.business_phone || ''
        },
        businessInfo: {
          businessName: p.business_name || '',
          businessDescription: p.business_description || '',
          registrationNumber: '',
          address: p.business_address || '',
          city: p.city || '',
          state: p.state_province || '',
          zipCode: p.postal_code || '',
          country: p.country_code || '',
          website: ''
        },
        accountInfo: {
          accountNumber: p.bank_account_number || '',
          bankName: p.bank_name || '',
          branchName: p.bank_branch || '',
          ifscCode: p.bank_ifsc_code || '',
          accountType: ''
        }
      }));

      // Initialize verification-related states
      setSelectedCountry(p.country_code || 'IN');
      setBusinessDetails({
        gstin: p.gstin || '',
        panNumber: p.pan_number || '',
        taxId: p.tax_id || '',
        vatNumber: p.vat_number || '',
        salesTaxNumber: p.sales_tax_number || ''
      });
      setBankDetails({
        accountNumber: p.bank_account_number || '',
        bankName: p.bank_name || '',
        bankBranch: p.bank_branch || '',
        ifscCode: p.bank_ifsc_code || '',
        swiftCode: p.bank_swift_code || '',
        routingNumber: p.bank_routing_number || '',
        iban: p.bank_iban || ''
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfile();
    else setLoading(false);
  }, []);

  // Supported countries
  useEffect(() => {
    const fetchSupportedCountries = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/merchants/supported-countries`);
        if (!response.ok) throw new Error('Failed to fetch supported countries');
        const data = await response.json();
        setSupportedCountries(data.countries);
      } catch (err) {
        // silent; profile can still work
      }
    };
    fetchSupportedCountries();
  }, []);

  // Country config and documents
  useEffect(() => {
    const fetchCountryConfig = async () => {
      if (!selectedCountry) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/merchants/country-config/${selectedCountry}`);
        if (!response.ok) throw new Error('Failed to fetch country configuration');
        const config: CountryConfig = await response.json();

        // Align requirements: only pan_card and aadhar required
        const transformedRequiredDocs = (config.required_documents || []).map(doc => ({
          ...doc,
          required: doc.type === 'pan_card' || doc.type === 'aadhar'
        }));
        const transformedConfig: CountryConfig = { ...config, required_documents: transformedRequiredDocs };
        setCountryConfig(transformedConfig);

        const newDocuments: { [key: string]: DocumentUpload } = {};
        transformedConfig.required_documents.forEach(doc => {
          newDocuments[doc.type] = {
            id: doc.type,
            file: null,
            status: 'pending',
            required: doc.required,
            documentType: doc.type,
            name: doc.name,
            fileUrl: null
          };
        });
        setDocuments(newDocuments);
      } catch (err) {
        // silent; section remains hidden if config missing
      }
    };
    fetchCountryConfig();
  }, [selectedCountry]);

  const toDisplayName = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const fetchExistingDocuments = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/merchant/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return; // silently ignore
      const data = await res.json();
      const list: Array<{ document_type: string; file_url: string } & Record<string, unknown>> = data.documents || [];
      if (!Array.isArray(list)) return;
      setDocuments(prev => {
        const merged = { ...prev } as { [key: string]: DocumentUpload };
        list.forEach((d) => {
          const key = d.document_type;
          const existing = merged[key];
          const name = existing?.name || toDisplayName(key);
          merged[key] = {
            id: key,
            file: existing?.file || null,
            status: 'uploaded',
            required: existing?.required ?? false,
            documentType: key,
            name,
            fileUrl: d.file_url as string
          };
        });
        return merged;
      });
    } catch (_) {
      // ignore
    }
  };

  useEffect(() => {
    // Once country config is ready, overlay any previously uploaded docs
    if (countryConfig) {
      fetchExistingDocuments();
    }
  }, [countryConfig]);

  const handleSave = async () => {
    try {
      setError(null);
      // business_phone is intentionally omitted — the backend treats it as a
      // restricted field and UpdateProfileSchema raises on unknown keys.
      const rawPayload: Record<string, string | undefined> = {
        business_name: profileData.businessInfo.businessName,
        business_description: profileData.businessInfo.businessDescription,
        business_address: profileData.businessInfo.address,
        country_code: selectedCountry || profileData.businessInfo.country,
        state_province: profileData.businessInfo.state,
        city: profileData.businessInfo.city,
        postal_code: profileData.businessInfo.zipCode,
        // Bank details
        bank_account_number: bankDetails.accountNumber || profileData.accountInfo.accountNumber,
        bank_name: bankDetails.bankName || profileData.accountInfo.bankName,
        bank_branch: bankDetails.bankBranch || profileData.accountInfo.branchName,
        bank_ifsc_code: bankDetails.ifscCode || profileData.accountInfo.ifscCode,
        bank_swift_code: bankDetails.swiftCode,
        bank_routing_number: bankDetails.routingNumber,
        bank_iban: bankDetails.iban,
        // Business details
        pan_number: businessDetails.panNumber,
        gstin: businessDetails.gstin,
        tax_id: businessDetails.taxId,
        vat_number: businessDetails.vatNumber,
        sales_tax_number: businessDetails.salesTaxNumber
      };
      // These carry minimum-length or format validators on the backend, so a
      // blank value 400s the whole request instead of clearing the field.
      // Everything else may legitimately be sent empty to clear it.
      const omitWhenBlank = new Set([
        'bank_account_number',
        'bank_ifsc_code',
        'bank_swift_code',
        'bank_iban',
        'bank_routing_number',
        'pan_number',
        'gstin',
        'tax_id',
        'vat_number',
        'sales_tax_number',
        'country_code'
      ]);
      const payload = Object.fromEntries(
        Object.entries(rawPayload).filter(([key, value]) => {
          if (typeof value !== 'string') return false;
          return value.trim() !== '' || !omitWhenBlank.has(key);
        })
      );
      const res = await fetch(`${API_BASE_URL}/api/merchants/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const details = errorData.details
          ? ` (${typeof errorData.details === 'string' ? errorData.details : Object.entries(errorData.details).map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`).join('; ')})`
          : '';
        throw new Error(`${errorData.error || 'Failed to update profile'}${details}`);
      }
      setIsEditing(false);
      await fetchProfile();
      toast.success('Profile updated successfully');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update profile';
      setError(message);
      toast.error(message);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
  };

  const handleBusinessDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBusinessDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (documentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token) {
      toast.error('Please log in to upload documents');
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, JPEG, or PNG files only.');
        e.target.value = '';
        return;
      }
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size too large. Maximum size is 10MB.');
        e.target.value = '';
        return;
      }
      const toastId = toast.loading(`Uploading ${file.name}...`);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', documents[documentId].documentType);
        formData.append('country_code', selectedCountry);
        const response = await fetch(`${API_BASE_URL}/api/merchant/documents/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upload document');
        }
        const data = await response.json();
        setDocuments(prev => ({
          ...prev,
          [documentId]: {
            ...prev[documentId],
            file,
            status: 'uploaded',
            fileUrl: data.document.file_url
          }
        }));
        toast.success(`${documents[documentId].name} uploaded successfully`, { id: toastId });
      } catch (err) {
        setDocuments(prev => ({
          ...prev,
          [documentId]: {
            ...prev[documentId],
            file,
            status: 'error',
            fileUrl: prev[documentId].fileUrl
          }
        }));
        toast.error(err instanceof Error ? err.message : 'Failed to upload document', { id: toastId });
      } finally {
        if (e.target) e.target.value = '';
      }
    }
  };

  const updateBusinessInfo = (field: keyof typeof profileData.businessInfo, value: string) => {
    setProfileData(prev => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        [field]: value
      }
    }));
  };

  const updatePersonalInfo = (field: keyof typeof profileData.personalInfo, value: string) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your personal, business, and account information
          </p>
        </div>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* Public profile: bio + intro video. These save independently of the
              Edit/Save flow below, so a merchant can update either on its own. */}
          <BioSection value={bio} limits={profileLimits} onSaved={setBio} />
          <IntroVideoSection />

          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <UserCircleIcon className="w-6 h-6 text-primary-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center px-4 py-2 border border-primary-500 text-sm font-medium rounded-md text-primary-500 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileData.personalInfo.name}
                    disabled={!isEditing}
                    onChange={(e) => updatePersonalInfo('name', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex rounded-md border border-gray-300 bg-gray-50">
                    <div className="px-3 py-2 text-gray-500">
                      <EnvelopeIcon className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={profileData.personalInfo.email}
                      disabled
                      className="block w-full rounded-r-md border-0 bg-gray-50 px-3 py-2"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="flex rounded-md border border-gray-300">
                    <div className="px-3 py-2 text-gray-500">
                      <PhoneIcon className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      value={profileData.personalInfo.phone}
                      disabled={!isEditing}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      className="block w-full rounded-r-md border-0 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 sm:p-8">
              <div className="flex items-center space-x-2 mb-6">
                <BuildingOfficeIcon className="w-6 h-6 text-primary-500" />
                <h2 className="text-xl font-semibold text-gray-900">Verification Details</h2>
              </div>

              {/* Country */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  disabled={!isEditing}
                  className="block w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  {supportedCountries.map(country => (
                    <option key={country.code} value={country.code}>{country.name}</option>
                  ))}
                </select>
              </div>

              {/* Business details conditional */}
              {selectedCountry === 'IN' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number<span className="text-red-500"> *</span></label>
                    <input
                      type="text"
                      name="panNumber"
                      value={businessDetails.panNumber || ''}
                      onChange={handleBusinessDetailsChange}
                      disabled={!isEditing}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="ABCDE1234F"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                    <input
                      type="text"
                      name="gstin"
                      value={businessDetails.gstin || ''}
                      onChange={handleBusinessDetailsChange}
                      disabled={!isEditing}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                    <input
                      type="text"
                      name="taxId"
                      value={businessDetails.taxId || ''}
                      onChange={handleBusinessDetailsChange}
                      disabled={!isEditing}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                    <input
                      type="text"
                      name="vatNumber"
                      value={businessDetails.vatNumber || ''}
                      onChange={handleBusinessDetailsChange}
                      disabled={!isEditing}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              )}

              {/* Bank details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number<span className="text-red-500"> *</span></label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={bankDetails.accountNumber || ''}
                    onChange={handleBankDetailsChange}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name<span className="text-red-500"> *</span></label>
                  <input
                    type="text"
                    name="bankName"
                    value={bankDetails.bankName || ''}
                    onChange={handleBankDetailsChange}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                {selectedCountry === 'IN' ? (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code<span className="text-red-500"> *</span></label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={bankDetails.ifscCode || ''}
                      onChange={handleBankDetailsChange}
                      disabled={!isEditing}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="SBIN0001234"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT/BIC</label>
                      <input
                        type="text"
                        name="swiftCode"
                        value={bankDetails.swiftCode || ''}
                        onChange={handleBankDetailsChange}
                        disabled={!isEditing}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                      <input
                        type="text"
                        name="routingNumber"
                        value={bankDetails.routingNumber || ''}
                        onChange={handleBankDetailsChange}
                        disabled={!isEditing}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                      <input
                        type="text"
                        name="iban"
                        value={bankDetails.iban || ''}
                        onChange={handleBankDetailsChange}
                        disabled={!isEditing}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Documents */}
              {countryConfig && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                  <div className="space-y-6">
                    {Object.values(documents).map((doc) => (
                      <div key={doc.id} className="bg-white p-4 rounded-lg border">
                        <label className="block mb-2 font-medium text-gray-700">
                          {doc.name}
                          {doc.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {doc.status === 'uploaded' && doc.fileUrl ? (
                          <div className="mt-1">
                            <div className="flex items-center p-2 bg-green-50 border border-green-200 rounded-md">
                              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                              <p className="text-sm text-green-700 font-medium truncate flex-grow">
                                Uploaded
                              </p>
                            </div>
                            <div className="flex items-center space-x-3 mt-2">
                              <button
                                type="button"
                                onClick={() => window.open(doc.fileUrl as string, '_blank', 'noopener,noreferrer')}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium py-1 px-2 rounded-md hover:bg-primary-50 transition-colors"
                                disabled={!isEditing}
                              >
                                View
                              </button>
                              <label className={`mt-2 text-sm font-medium py-1 px-2 rounded-md transition-colors ${!isEditing ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50 cursor-pointer'}`}>
                                Update
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => isEditing && handleFileChange(doc.id, e)}
                                  disabled={!isEditing}
                                />
                              </label>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center">
                              <label className={`
                                flex justify-center items-center px-4 py-2 border-2 rounded-md 
                                ${doc.status === 'error' ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-300 bg-white text-gray-600'}
                                ${!isEditing ? 'cursor-not-allowed opacity-70' : 'hover:bg-gray-50 cursor-pointer'}
                                w-full max-w-xs 
                              `}
                              >
                                {doc.status === 'error' ? (
                                  <span className="flex items-center">
                                    <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                                    Upload failed. Retry?
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                                    Upload File
                                  </span>
                                )}
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => isEditing && handleFileChange(doc.id, e)}
                                  disabled={!isEditing}
                                />
                              </label>
                            </div>
                            {doc.status === 'error' && (
                              <p className="mt-1 text-sm text-red-600">Please try uploading again.</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 sm:p-8">
              <div className="flex items-center space-x-2 mb-6">
                <BuildingOfficeIcon className="w-6 h-6 text-primary-500" />
                <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={profileData.businessInfo.businessName}
                    disabled={!isEditing}
                    onChange={(e) => updateBusinessInfo('businessName', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                  <input
                    type="text"
                    value={profileData.businessInfo.businessDescription}
                    disabled={!isEditing}
                    onChange={(e) => updateBusinessInfo('businessDescription', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={profileData.businessInfo.registrationNumber}
                    disabled={!isEditing}
                    onChange={(e) => updateBusinessInfo('registrationNumber', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <div className="flex rounded-md border border-gray-300">
                    <div className="px-3 py-2 text-gray-500">
                      <GlobeAltIcon className="w-5 h-5" />
                    </div>
                    <input
                      type="url"
                      value={profileData.businessInfo.website}
                      disabled={!isEditing}
                      onChange={(e) => updateBusinessInfo('website', e.target.value)}
                      className="block w-full rounded-r-md border-0 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                  <div className="flex rounded-md border border-gray-300">
                    <div className="px-3 py-2 text-gray-500">
                      <MapPinIcon className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={profileData.businessInfo.address}
                      disabled={!isEditing}
                      onChange={(e) => updateBusinessInfo('address', e.target.value)}
                      className="block w-full rounded-r-md border-0 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={profileData.businessInfo.city}
                    disabled={!isEditing}
                    onChange={(e) => updateBusinessInfo('city', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                  <input
                    type="text"
                    value={profileData.businessInfo.state}
                    disabled={!isEditing}
                    onChange={(e) => updateBusinessInfo('state', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                  <input
                    type="text"
                    value={profileData.businessInfo.zipCode}
                    disabled={!isEditing}
                    onChange={(e) => updateBusinessInfo('zipCode', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={profileData.businessInfo.country}
                    disabled={!isEditing}
                    onChange={(e) => updateBusinessInfo('country', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="w-full sm:w-auto inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 