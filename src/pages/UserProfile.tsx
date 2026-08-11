import React, { useState, useEffect, useRef } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Upload,
  Trash2,
  X,
  Lock,
  Edit3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext"; 
import LogoutConfirmationPopup from "../components/LogoutConfirmationPopup";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../components/common/ConfirmationModal";
import { addressService, type Address as AddressModel } from "../services/address";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  ""
);

// --- Interfaces ---
type Address = AddressModel & {
  user_id?: number;
  user_email?: string;
  full_address_str?: string;
  created_at?: string;
  updated_at?: string;
};

interface PaymentMethod {
  // For displaying fetched cards
  card_id: number;
  user_id: number;
  card_type: "credit" | "debit";
  last_four_digits: string;
  card_holder_name: string;
  card_brand: string;
  status: string;
  is_default: boolean;
  billing_address_id?: number | null;
  expiry_month: string; 
  expiry_year: string; 
}

interface UserInfo {
  fullName: string;
  email: string;
  secondaryEmail: string;
  phone: string;
  country: string;
  state: string;
  zipCode: string;
  authProvider: "local" | "google";
  profile_img: string | null;
}

interface AvatarOption {
  label: string;
  render: () => JSX.Element;
}

// --- Avatar Options ---
const AVATAR_OPTIONS: AvatarOption[] = [
  {
    label: "Colorful Blob",
    render: () => (
      <svg width="64" height="64" viewBox="0 0 64 64" className="animate-pulse">
        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDB022" />
            <stop offset="100%" stopColor="#DC6803" />
          </radialGradient>
        </defs>
        <ellipse cx="32" cy="32" rx="28" ry="28" fill="url(#grad1)" />
      </svg>
    ),
  },
  {
    label: "Animated Face",
    render: () => (
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="#6EE7B7" />
        <circle cx="24" cy="28" r="4" fill="#fff" className="animate-bounce" />
        <circle cx="40" cy="28" r="4" fill="#fff" className="animate-bounce" />
        <ellipse
          cx="32"
          cy="40"
          rx="10"
          ry="4"
          fill="#fff"
          className="animate-pulse"
        />
      </svg>
    ),
  },
  {
    label: "Star",
    render: () => (
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        className="animate-spin-slow"
      >
        <polygon
          points="32,8 39,26 58,26 42,38 48,56 32,45 16,56 22,38 6,26 25,26"
          fill="#FDB022"
        />
      </svg>
    ),
  },
  {
    label: "Minimal",
    render: () => (
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="#a5b4fc" />
        <rect x="20" y="40" width="24" height="8" rx="4" fill="#fff" />
      </svg>
    ),
  },
];

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- State Declarations ---
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: "",
    email: "",
    secondaryEmail: "",
    phone: "",
    country: "",
    state: "",
    zipCode: "",
    authProvider: "local",
    profile_img: null,
  });
  const [editedUserInfo, setEditedUserInfo] = useState<UserInfo>({
    ...userInfo,
  });

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarIndex] = useState(0);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state_province: "",
    country_code: "",
    postal_code: "",
    landmark: "",
    contact_phone: "",
  });
  const [showAddressAdded] = useState(false);
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [newPaymentCardDetails, setNewPaymentCardDetails] = useState({
    card_number: "",
    cvv: "",
    expiry_month: "",
    expiry_year: "",
    card_holder_name: "",
    card_type: "credit" as "credit" | "debit",
    is_default: false,
    billing_address_id: null as number | null,
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // --- Data Fetching and Side Effects ---
  const fetchUserProfile = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please sign in.");
      navigate("/sign-in");
      return;
    }
    setLoadingProfile(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }
      const data = await response.json();
      const profile = data.profile;
      const authProviderValue =
        profile.auth_provider === "google" ? "google" : "local";
      const fetchedUserInfo: UserInfo = {
        fullName: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        phone: profile.phone || "",
        profile_img: profile.profile_img,
        secondaryEmail: "",
        country: "",
        state: "",
        zipCode: "",
        authProvider: authProviderValue,
      };
      setUserInfo(fetchedUserInfo);
      setEditedUserInfo(fetchedUserInfo);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not load profile."
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchUserAddresses = async () => {
    if (!user?.id) return;
    setLoadingAddresses(true);
    setAddressesError(null);
    try {
      const fetchedAddresses = await addressService.list();
      setAddresses(fetchedAddresses);
      if (fetchedAddresses.length > 0) {
        const defaultShipping = fetchedAddresses.find(
          (addr: Address) => addr.is_default_shipping
        );
        const defaultBilling = fetchedAddresses.find(
          (addr: Address) => addr.is_default_billing
        );
        const addressToUse =
          defaultShipping || defaultBilling || fetchedAddresses[0];
        setUserInfo((prev) => ({
          ...prev,
          country: addressToUse.country_code,
          state: addressToUse.state_province,
          zipCode: addressToUse.postal_code,
        }));
        setEditedUserInfo((prev) => ({
          ...prev,
          country: addressToUse.country_code,
          state: addressToUse.state_province,
          zipCode: addressToUse.postal_code,
        }));
      } else {
        setUserInfo((prev) => ({
          ...prev,
          country: "",
          state: "",
          zipCode: "",
        }));
        setEditedUserInfo((prev) => ({
          ...prev,
          country: "",
          state: "",
          zipCode: "",
        }));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Could not load addresses.";
      toast.error(errorMessage);
      setAddressesError(errorMessage);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user?.id) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setLoadingPayments(true);
    setPaymentsError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment-cards`, {
        
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch payment methods."
        );
      }
      const data = await response.json();
      setPaymentMethods(data.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Could not load payment methods.";
      toast.error(errorMessage);
      setPaymentsError(errorMessage);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !user) {
      if (!loadingProfile) toast.error("Please sign in to access your profile"); 
      navigate("/sign-in");
      return;
    }
    fetchUserProfile();
    if (user?.id) {
      
      fetchUserAddresses();
      fetchPaymentMethods();
    }
  }, [user?.id, navigate]); // Make sure user?.id is a dependency

  // --- Image Handlers ---
  const handleImageUpload = async (file: File) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Authentication expired.");
      return;
    }
    const formData = new FormData();
    formData.append("profile_image", file);
    setIsUploading(true);
    const toastId = toast.loading("Uploading image...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      const newImageUrl = result.profile_img_url;
      setUserInfo((prev) => ({ ...prev, profile_img: newImageUrl }));
  // if you maintain user in context, it will update from backend on next fetch
      toast.success("Profile image updated!", { id: toastId });
      setIsImageModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred", {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };
  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };
  const handleRemoveImage = async () => {
    toast.success("Image removal: Set profile_img to null on backend.", {
      icon: "ℹ️",
    });
  };

  // --- Profile Info Handlers ---
  const handleEditClick = () => {
    setEditedUserInfo(userInfo);
    setIsEditing(true);
  };
  const handleSaveChanges = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Session expired.");
      return;
    }
    if (!editedUserInfo.fullName.trim()) {
      toast.error("Full name cannot be empty.");
      return;
    }
    const nameParts = editedUserInfo.fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;
    const payload = {
      first_name: firstName,
      last_name: lastName,
      phone: editedUserInfo.phone.trim() || null,
    };
    setIsSavingProfile(true);
    const toastId = toast.loading("Saving profile...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to save profile.");
      setUserInfo((prev) => ({
        ...prev,
        fullName: editedUserInfo.fullName,
        phone: editedUserInfo.phone,
        country: editedUserInfo.country,
        state: editedUserInfo.state,
        zipCode: editedUserInfo.zipCode,
      }));
  // User context will reflect changes on next profile fetch
      setIsEditing(false);
      toast.success("Profile updated successfully!", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving.", {
        id: toastId,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };
  const handleInputChange = (field: keyof UserInfo, value: string) => {
    setEditedUserInfo((prev) => ({ ...prev, [field]: value }));
  };
  const handleCancelEdit = () => {
    setEditedUserInfo(userInfo);
    setIsEditing(false);
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    toast.success("Logged out successfully.");
    navigate("/sign-in");
  };

  // --- Address Handlers ---
  const handleAddAddress = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please login to continue");
      return;
    }
    if (
      !newAddress.address_line1 ||
      !newAddress.city ||
      !newAddress.state_province ||
      !newAddress.postal_code ||
      !newAddress.country_code ||
      !newAddress.contact_phone
    ) {
      toast.error("Please fill in all required address fields.");
      return;
    }
    const payload = {
      contact_name: userInfo.fullName,
      contact_phone: newAddress.contact_phone,
      address_line1: newAddress.address_line1,
      address_line2: newAddress.address_line2 || undefined,
      landmark: newAddress.landmark || undefined,
      city: newAddress.city,
      state_province: newAddress.state_province,
      postal_code: newAddress.postal_code,
      country_code: newAddress.country_code,
      address_type: "shipping" as const,
    };
    const toastId = toast.loading("Adding address...");
    try {
  await addressService.create(payload);
      toast.success("Address added successfully", { id: toastId });
      setShowAddressModal(false);
      setNewAddress({
        address_line1: "",
        address_line2: "",
        city: "",
        state_province: "",
        country_code: "",
        postal_code: "",
        landmark: "",
        contact_phone: "",
      });
      fetchUserAddresses();
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add address",
        { id: toastId }
      );
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress({
      ...address,
      address_line2: address.address_line2 || "",
      landmark: address.landmark || "",
    });
    setShowEditAddressModal(true);
  };

  const handleSaveEditedAddress = async () => {
    if (!editingAddress) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please login to continue");
      return;
    }
    const { address_id, ...rest } = editingAddress;
    const payload = { ...rest } as Partial<AddressModel>;

    const toastId = toast.loading("Updating address...");
    try {
  await addressService.update(editingAddress.address_id, payload);
      toast.success("Address updated successfully", { id: toastId });
      setShowEditAddressModal(false);
      setEditingAddress(null);
      fetchUserAddresses();
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update address",
        { id: toastId }
      );
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please login to continue");
      return;
    }
    const toastId = toast.loading("Deleting address...");
    try {
      await addressService.remove(addressId);
      toast.success("Address deleted successfully", { id: toastId });
      fetchUserAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete address",
        { id: toastId }
      );
    }
  };

  const handleSetDefaultAddress = async (
    addressId: number,
    addressType: "shipping" | "billing"
  ) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please login to continue");
      return;
    }
    const toastId = toast.loading("Setting default address...");
    try {
      await addressService.setDefault(addressId, addressType);
      toast.success(`Default ${addressType} address updated successfully`, {
        id: toastId,
      });
      fetchUserAddresses();
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to set default address",
        { id: toastId }
      );
    }
  };

  // --- Payment Method Handlers ---
  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please login to continue.");
      return;
    }

    const payload = {
      ...newPaymentCardDetails,
      user_id: user?.id,
    };
    if (
      !payload.card_number ||
      !payload.cvv ||
      !payload.expiry_month ||
      !payload.expiry_year ||
      !payload.card_holder_name
    ) {
      toast.error("All card fields are required.");
      return;
    }
    const url = editingPaymentMethod
      ? `${API_BASE_URL}/api/payment-cards/${editingPaymentMethod.card_id}`
      : `${API_BASE_URL}/api/payment-cards`;
    const method = editingPaymentMethod ? "PUT" : "POST";

    const toastId = toast.loading(
      editingPaymentMethod
        ? "Updating payment method..."
        : "Adding payment method..."
    );
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to save payment method");
      }
      toast.success(result.message || "Payment method saved successfully!", {
        id: toastId,
      });
      setShowPaymentModal(false);
      setEditingPaymentMethod(null);
      setNewPaymentCardDetails({
        card_number: "",
        cvv: "",
        expiry_month: "",
        expiry_year: "",
        card_holder_name: "",
        card_type: "credit",
        is_default: false,
        billing_address_id: null,
      });
      fetchPaymentMethods();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save payment method",
        { id: toastId }
      );
    }
  };

  const handleDeletePaymentMethod = async (card_id: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please login to continue.");
      return;
    }
    const toastId = toast.loading("Deleting payment method...");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payment-cards/${card_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to delete payment method");
      }
      toast.success("Payment method deleted successfully", { id: toastId });
      fetchPaymentMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete payment method",
        { id: toastId }
      );
    }
  };

  const handleSetDefaultPaymentMethod = async (card_id: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please login to continue.");
      return;
    }
    const toastId = toast.loading("Setting default payment method...");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payment-cards/${card_id}/default`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(
          result.message || "Failed to set default payment method"
        );
      }
      toast.success("Default payment method updated", { id: toastId });
      fetchPaymentMethods();
    } catch (error) {
      console.error("Error setting default payment method:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to set default payment method",
        { id: toastId }
      );
    }
  };

  // --- Password Change Handler ---
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Session expired.");
      return;
    }
    setIsChangingPassword(true);
    const toastId = toast.loading("Changing password...");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/profile/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            old_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to change password.");
      toast.success("Password changed successfully!", { id: toastId });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error changing password.",
        { id: toastId }
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // --- JSX ---
  return (
    <div className="py-10 lg:pr-2 xl:pr-32 2xl:pr-[350px]">
      {/* Image Preview Modal (Responsive) */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fade-in p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-lg p-4 sm:p-6 w-full max-w-md sm:max-w-lg shadow-2xl transform scale-100 transition-transform duration-300 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Profile Photo
              </h3>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>
            <div className="mb-6 flex-grow flex justify-center items-center overflow-hidden">
              {userInfo.profile_img ? (
                <img
                  src={userInfo.profile_img}
                  alt="Profile Preview"
                  className="max-h-[60vh] max-w-full w-auto rounded-lg object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto">
              <button
                onClick={handleTriggerFileInput}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Upload size={20} />
                )}
                <span>{isUploading ? "Uploading..." : "Change Photo"}</span>
              </button>
              <button
                onClick={handleRemoveImage}
                disabled={!userInfo.profile_img || isUploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={20} />
                <span>Remove Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Added Toast */}
      {showAddressAdded && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg bg-green-500 text-white font-semibold animate-slide-in">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Address added successfully!
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 md:gap-0">
        <aside className="w-full md:w-1/4 md:pr-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <button
                onClick={() => setIsImageModalOpen(true)}
                className="w-24 h-24 rounded-full flex items-center justify-center bg-gray-100 border-4 border-primary-200 shadow-md text-gray-400 text-5xl hover:bg-gray-200 cursor-pointer"
                title={
                  userInfo.profile_img
                    ? "View or Update Photo"
                    : "Set Profile Photo"
                }
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                ) : userInfo.profile_img ? (
                  <img
                    src={userInfo.profile_img}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  AVATAR_OPTIONS[avatarIndex].render()
                )}
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              id="profile-image-upload"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <h2 className="mt-4 text-xl font-semibold text-gray-800">
              {userInfo.fullName || "User"}
            </h2>
          
            <button
              onClick={handleTriggerFileInput}
              disabled={isUploading}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-sm text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Upload size={16} />
              <span>
                {userInfo.profile_img ? "Update Image" : "Upload Photo"}
              </span>
            </button>

            <button
              onClick={handleLogoutClick}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 max-w-5xl">
          {/* User Info Section */}
          <div className="mb-8 px-6 md:px-0 md:ml-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    !isEditing
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "border-gray-300"
                  }`}
                  value={
                    isEditing ? editedUserInfo.fullName : userInfo.fullName
                  }
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  readOnly={!isEditing}
                  aria-readonly={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm sm:text-sm"
                  value={userInfo.email}
                  readOnly
                  aria-readonly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    !isEditing
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "border-gray-300"
                  }`}
                  value={isEditing ? editedUserInfo.phone : userInfo.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  readOnly={!isEditing}
                  aria-readonly={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country/Region
                </label>
                <input
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm sm:text-sm"
                  value={
                    
                    userInfo.country || "N/A"
                  }
                  
                  readOnly
                  aria-readonly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                   className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm sm:text-sm"
                  value={
                    userInfo.state || "N/A"
                  }
                 
                  readOnly
                  aria-readonly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Zip Code
                </label>
                <input
                   className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm sm:text-sm"
                  value={
                     userInfo.zipCode || "N/A"
                  }
                 
                  readOnly
                  aria-readonly
                />
              </div>
            </div>
          </div>
          {isEditing ? (
            <div className="flex gap-2 mb-8 px-6 md:px-0 md:ml-6">
              <button
                onClick={handleSaveChanges}
                disabled={isSavingProfile}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors disabled:opacity-70"
              >
                {isSavingProfile ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Edit3 size={18} />
                )}
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSavingProfile}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors disabled:opacity-70"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleEditClick}
              className="bg-primary-500 text-white px-6 py-2 rounded-md font-medium mb-8 ml-6 hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <Edit3 size={18} />
              Edit Profile
            </button>
          )}

          {/* Saved Addresses Section */}
          <div className="mb-8 px-6 md:px-0 md:ml-6">
            <h2 className="text-lg font-semibold mb-2">Saved Addresses</h2>
            {loadingAddresses ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
              </div>
            ) : addressesError ? (
              <div className="text-red-500 text-center py-4">
                <p>{addressesError}</p>
                <button
                  onClick={fetchUserAddresses}
                  className="mt-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
                >
                  Try Again
                </button>
              </div>
            ) : addresses.length === 0 ? (
              <p className="text-gray-500">No saved addresses yet.</p>
            ) : (
              <div className="space-y-2 mb-2">
                {addresses.map((address) => (
                  <div
                    key={address.address_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 bg-gray-50 px-4 py-2 rounded-md border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize text-primary-600">
                          {address.address_type}
                        </span>
                        {address.is_default_shipping &&
                          address.address_type === "shipping" && (
                            <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                              Default Shipping
                            </span>
                          )}
                        {address.is_default_billing &&
                          address.address_type === "billing" && (
                            <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                              Default Billing
                            </span>
                          )}
                      </div>
                      <p className="text-sm">{`${address.address_line1}${
                        address.address_line2
                          ? ", " + address.address_line2
                          : ""
                      }, ${address.city}, ${address.state_province} ${
                        address.postal_code
                      }, ${address.country_code}`}</p>
                      <div className="flex gap-2 mt-1">
                        {!address.is_default_shipping &&
                          address.address_type === "shipping" && (
                            <button
                              onClick={() =>
                                handleSetDefaultAddress(
                                  address.address_id,
                                  "shipping"
                                )
                              }
                              className="text-xs text-primary-500 hover:text-primary-600"
                            >
                              Set as default shipping
                            </button>
                          )}
                        {!address.is_default_billing &&
                          address.address_type === "billing" && (
                            <button
                              onClick={() =>
                                handleSetDefaultAddress(
                                  address.address_id,
                                  "billing"
                                )
                              }
                              className="text-xs text-primary-500 hover:text-primary-600"
                            >
                              Set as default billing
                            </button>
                          )}
                      </div>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="bg-gray-200 px-3 py-1 rounded-md text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setAddressToDelete(address);
                          setDeleteModalOpen(true);
                        }}
                        className="bg-primary-500 text-white px-3 py-1 rounded-md text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAddressModal(true)}
              className="bg-primary-500 text-white px-4 py-2 rounded-md font-medium flex items-center mt-2"
            >
              <span className="mr-1">+</span> Add New Address
            </button>
            {showAddressModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-gray-900">
                      Add New Address
                    </h3>
                    <button
                      onClick={() => setShowAddressModal(false)}
                      className="text-gray-400 hover:text-gray-700 transition"
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddAddress();
                    }}
                    className="px-6 py-6 space-y-6 overflow-y-auto"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 1 *
                        </label>
                        <textarea
                          required
                          rows={2}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newAddress.address_line1}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              address_line1: e.target.value,
                            }))
                          }
                          placeholder="Street address, P.O. box, company name, c/o"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 2 (Optional)
                        </label>
                        <input
                          type="text"
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newAddress.address_line2 || ""}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              address_line2: e.target.value,
                            }))
                          }
                          placeholder="Apartment, suite, unit, building, floor, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newAddress.contact_phone}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              contact_phone: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province *
                        </label>
                        <input
                          type="text"
                          required
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newAddress.state_province}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              state_province: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country *
                        </label>
                        <select
                          required
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newAddress.country_code}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              country_code: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select Country</option>
                          <option value="IN">India</option>
                          <option value="US">United States</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          required
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newAddress.postal_code}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              postal_code: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newAddress.landmark}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              landmark: e.target.value,
                            }))
                          }
                          placeholder="Nearby landmark or location"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-end gap-2 mt-4 sticky bottom-0 bg-white py-4 px-6 border-t rounded-b-2xl">
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition w-full md:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition w-full md:w-auto"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          <div className="mb-8 px-6 md:px-0 md:ml-6">
            <h2 className="text-lg font-semibold mb-2">Payment Methods</h2>
            {loadingPayments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
              </div>
            ) : paymentsError ? (
              <div className="text-red-500 text-center py-4">
                <p>{paymentsError}</p>
                <button
                  onClick={fetchPaymentMethods}
                  className="mt-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
                >
                  Try Again
                </button>
              </div>
            ) : paymentMethods.length === 0 ? (
              <p className="text-gray-500">No saved payment methods yet.</p>
            ) : (
              <div className="space-y-2 mb-2">
                {paymentMethods.map((method) => (
                  <div
                    key={method.card_id}
                    className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-md border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">
                          {/* Display Brand if available, otherwise fallback to capitalized card_type */}
                          {method.card_brand
                            ? method.card_brand
                            : method.card_type.charAt(0).toUpperCase() +
                              method.card_type.slice(1)}{" "}
                          ending in {method.last_four_digits}
                        </span>
                        {method.is_default && (
                          <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      {/* Display Card Holder Name */}
                      <div className="text-sm text-gray-600 mt-1">
                        {method.card_holder_name}
                      </div>
                      {/* Display Expiry Date (ensure these are sent by your backend in PaymentCard.serialize()) */}
                      <div className="text-sm text-gray-500 mt-1">
                        Expires {method.expiry_month}/{method.expiry_year}
                      </div>
                    </div>
                    <div className="space-x-2 flex items-center">
                      {" "}
                      {/* Added flex items-center for better alignment */}
                      {!method.is_default && (
                        <button
                          onClick={() =>
                            handleSetDefaultPaymentMethod(method.card_id)
                          }
                          className="text-xs text-primary-500 hover:text-primary-600"
                        >
                          Set as default
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingPaymentMethod(method);
                          // When editing, pre-fill the form. Card number & CVV won't be pre-filled for security.
                          setNewPaymentCardDetails({
                            card_holder_name: method.card_holder_name,
                            card_type: method.card_type,
                            expiry_month: method.expiry_month || "", // Use fetched expiry if available
                            expiry_year: method.expiry_year || "", // Use fetched expiry if available
                            is_default: method.is_default,
                            billing_address_id:
                              method.billing_address_id || null,
                            card_number: "", // Card number not pre-filled for edit
                            cvv: "", // CVV not pre-filled for edit
                          });
                          setShowPaymentModal(true);
                        }}
                        className="bg-gray-200 px-3 py-1 rounded-md text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleDeletePaymentMethod(method.card_id)
                        }
                        className="bg-primary-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-primary-600" // Changed to red for delete
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                setEditingPaymentMethod(null);
                setNewPaymentCardDetails({
                  card_number: "",
                  cvv: "",
                  expiry_month: "",
                  expiry_year: "",
                  card_holder_name: "",
                  card_type: "credit",
                  is_default: false,
                  billing_address_id: null,
                });
                setShowPaymentModal(true);
              }}
              className="bg-primary-500 text-white px-4 py-2 rounded-md font-medium flex items-center mt-2"
            >
              <span className="mr-1">+</span> Add New Card
            </button>
            {showPaymentModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-gray-900">
                      {editingPaymentMethod
                        ? "Edit Payment Method"
                        : "Add New Payment Method"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        setEditingPaymentMethod(null);
                        setNewPaymentCardDetails({
                          card_number: "",
                          cvv: "",
                          expiry_month: "",
                          expiry_year: "",
                          card_holder_name: "",
                          card_type: "credit",
                          is_default: false,
                          billing_address_id: null,
                        });
                      }}
                      className="text-gray-400 hover:text-gray-700 transition"
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <form
                    onSubmit={handleSavePaymentMethod}
                    className="px-6 py-6 space-y-6 overflow-y-auto"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Card Type
                        </label>
                        <select
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newPaymentCardDetails.card_type}
                          onChange={(e) =>
                            setNewPaymentCardDetails((prev) => ({
                              ...prev,
                              card_type: e.target.value as "credit" | "debit",
                            }))
                          }
                          required
                        >
                          <option value="credit">Credit Card</option>
                          <option value="debit">Debit Card</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newPaymentCardDetails.card_number}
                          onChange={(e) =>
                            setNewPaymentCardDetails((prev) => ({
                              ...prev,
                              card_number: e.target.value.replace(/\D/g, ""),
                            }))
                          }
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          required
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newPaymentCardDetails.card_holder_name}
                          onChange={(e) =>
                            setNewPaymentCardDetails((prev) => ({
                              ...prev,
                              card_holder_name: e.target.value,
                            }))
                          }
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Month (MM)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={2}
                            pattern="^(0[1-9]|1[0-2])$"
                            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                            value={newPaymentCardDetails.expiry_month}
                            onChange={(e) =>
                              setNewPaymentCardDetails((prev) => ({
                                ...prev,
                                expiry_month: e.target.value.replace(/\D/g, ""),
                              }))
                            }
                            placeholder="MM"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Year (YYYY)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            pattern="^\d{4}$"
                            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                            value={newPaymentCardDetails.expiry_year}
                            onChange={(e) =>
                              setNewPaymentCardDetails((prev) => ({
                                ...prev,
                                expiry_year: e.target.value.replace(/\D/g, ""),
                              }))
                            }
                            placeholder="YYYY"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          pattern="^\d{3,4}$"
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                          value={newPaymentCardDetails.cvv}
                          onChange={(e) =>
                            setNewPaymentCardDetails((prev) => ({
                              ...prev,
                              cvv: e.target.value.replace(/\D/g, ""),
                            }))
                          }
                          placeholder="123"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="default-payment"
                          className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                          checked={newPaymentCardDetails.is_default}
                          onChange={(e) =>
                            setNewPaymentCardDetails((prev) => ({
                              ...prev,
                              is_default: e.target.checked,
                            }))
                          }
                        />
                        <label
                          htmlFor="default-payment"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Set as default payment method
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-end gap-2 mt-4 sticky bottom-0 bg-white py-4 px-6 border-t rounded-b-2xl">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPaymentModal(false);
                          setEditingPaymentMethod(null);
                          setNewPaymentCardDetails({
                            card_number: "",
                            cvv: "",
                            expiry_month: "",
                            expiry_year: "",
                            card_holder_name: "",
                            card_type: "credit",
                            is_default: false,
                            billing_address_id: null,
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition w-full md:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition w-full md:w-auto"
                      >
                        {editingPaymentMethod
                          ? "Update Payment Method"
                          : "Add Payment Method"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          <div className="mb-8 px-6 md:px-0 md:ml-6">
            <h2 className="text-lg font-semibold mb-2">
              Notification Settings
            </h2>
            <div className="grid grid-cols-2 gap-4 items-center mb-2 max-w-md">
              <div className="space-y-8">
                <div className="flex items-center">
                  <span className="text-base">Email Notification</span>
                </div>
                <div className="flex items-center">
                  <span className="text-base">PUSH Notification</span>
                </div>
              </div>
              <div className="space-y-8 flex flex-col items-end">
                <button
                  type="button"
                  aria-pressed={emailNotif}
                  onClick={() => setEmailNotif((v) => !v)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                    emailNotif ? "bg-black" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      emailNotif ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  aria-pressed={pushNotif}
                  onClick={() => setPushNotif((v) => !v)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                    pushNotif ? "bg-black" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      pushNotif ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {userInfo.authProvider === "local" ? (
            <div className="bg-white border rounded-md p-6 mt-8">
              <h2 className="text-lg font-semibold mb-4">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowCurrentPassword((v) => !v)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="8+ characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword((v) => !v)}
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors disabled:opacity-70"
                >
                  {isChangingPassword ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Lock size={18} />
                  )}
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border rounded-md p-6 mt-8 text-center">
              <img
                src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687781/public_assets_images/public_assets_images_google_logo.svg"
                alt="Google Logo"
                className="w-10 h-10 mx-auto mb-3"
              />
              <h2 className="text-lg font-semibold mb-2">
                Password Management
              </h2>
              <p className="text-sm text-gray-600">
                You are logged in with Google. To change your password, please
                manage it through your Google account settings.
              </p>
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition-colors"
              >
                Go to Google Account
              </a>
            </div>
          )}
        </div>
      </div>



      {showEditAddressModal && editingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900">Edit Address</h3>
              <button
                onClick={() => {
                  setShowEditAddressModal(false);
                  setEditingAddress(null);
                }}
                className="text-gray-400 hover:text-gray-700 transition"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEditedAddress();
              }}
              className="pt-6 space-y-6 overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <textarea
                    required
                    rows={2}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    value={editingAddress.address_line1}
                    onChange={(e) => {
                      setEditingAddress((prev) =>
                        prev ? { ...prev, address_line1: e.target.value } : null
                      );
                    }}
                    placeholder="Street address, P.O. box, company name, c/o"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    value={editingAddress.address_line2 || ""}
                    onChange={(e) =>
                      setEditingAddress((prev) =>
                        prev ? { ...prev, address_line2: e.target.value } : null
                      )
                    }
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    value={editingAddress.contact_phone}
                    onChange={(e) =>
                      setEditingAddress((prev) =>
                        prev ? { ...prev, contact_phone: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    value={editingAddress.city}
                    onChange={(e) =>
                      setEditingAddress((prev) =>
                        prev ? { ...prev, city: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province *
                  </label>
                  <input
                    type="text"
                    required
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    value={editingAddress.state_province}
                    onChange={(e) =>
                      setEditingAddress((prev) =>
                        prev
                          ? { ...prev, state_province: e.target.value }
                          : null
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    required
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    value={editingAddress.country_code}
                    onChange={(e) =>
                      setEditingAddress((prev) =>
                        prev ? { ...prev, country_code: e.target.value } : null
                      )
                    }
                  >
                    <option value="">Select Country</option>
                    <option value="IN">India</option>
                    <option value="US">United States</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    value={editingAddress.postal_code}
                    onChange={(e) =>
                      setEditingAddress((prev) =>
                        prev ? { ...prev, postal_code: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    value={editingAddress.landmark || ""}
                    onChange={(e) =>
                      setEditingAddress((prev) =>
                        prev ? { ...prev, landmark: e.target.value } : null
                      )
                    }
                    placeholder="Nearby landmark or location"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Type
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-primary-500"
                        checked={editingAddress.address_type === "shipping"}
                        onChange={() =>
                          setEditingAddress((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  address_type: "shipping",
                                  is_default_billing: false,
                                }
                              : null
                          )
                        }
                      />
                      <span className="ml-2">Shipping</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-primary-500"
                        checked={editingAddress.address_type === "billing"}
                        onChange={() =>
                          setEditingAddress((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  address_type: "billing",
                                  is_default_shipping: false,
                                }
                              : null
                          )
                        }
                      />
                      <span className="ml-2">Billing</span>
                    </label>
                  </div>
                </div>
                {editingAddress.address_type === "shipping" && (
                  <div className="md:col-span-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox text-primary-500"
                        checked={editingAddress.is_default_shipping}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAddresses((prev) =>
                              prev.map((addr) => ({
                                ...addr,
                                is_default_shipping: false,
                              }))
                            );
                          }
                          setEditingAddress((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  is_default_shipping: e.target.checked,
                                }
                              : null
                          );
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Set as default shipping address
                      </span>
                    </label>
                  </div>
                )}
                {editingAddress.address_type === "billing" && (
                  <div className="md:col-span-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox text-primary-500"
                        checked={editingAddress.is_default_billing}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAddresses((prev) =>
                              prev.map((addr) => ({
                                ...addr,
                                is_default_billing: false,
                              }))
                            );
                          }
                          setEditingAddress((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  is_default_billing: e.target.checked,
                                }
                              : null
                          );
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Set as default billing address
                      </span>
                    </label>
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row justify-end gap-2 mt-4 sticky bottom-0 bg-white py-4 px-6 border-t rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditAddressModal(false);
                    setEditingAddress(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition w-full md:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition w-full md:w-auto"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Address"
        message={`Are you sure you want to delete the address for '${addressToDelete?.contact_name || "this address"}'? This action cannot be undone.\n\nThis address will be permanently removed from your saved addresses.`}
        onConfirm={async () => {
          if (addressToDelete) {
            await handleDeleteAddress(addressToDelete.address_id);
          }
          setDeleteModalOpen(false);
          setAddressToDelete(null);
        }}
        onCancel={() => {
          setDeleteModalOpen(false);
          setAddressToDelete(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
        icon={
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 mb-2">
            <Trash2 className="w-8 h-8 text-primary-500" />
          </span>
        }
      />

      <LogoutConfirmationPopup
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
};

export default UserProfile;
