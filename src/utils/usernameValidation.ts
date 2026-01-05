/**
 * Username validation utilities
 */

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Validate username format client-side
 * @param username - Username to validate
 * @returns Object with isValid and error message
 */
export const validateUsernameFormat = (username: string): { isValid: boolean; error?: string } => {
  if (!username) {
    return { isValid: true }; // Empty is valid (optional field)
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 30) {
    return { isValid: false, error: 'Username must be at most 30 characters' };
  }
  
  if (!USERNAME_REGEX.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { isValid: true };
};

/**
 * Check username availability via API
 * @param username - Username to check
 * @returns Promise with availability status
 */
export const checkUsernameAvailability = async (username: string): Promise<{ available: boolean; error?: string }> => {
  if (!username) {
    return { available: true }; // Empty is considered available (will auto-generate)
  }
  
  // Validate format first
  const formatCheck = validateUsernameFormat(username);
  if (!formatCheck.isValid) {
    return { available: false, error: formatCheck.error };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/merchants/username/check?username=${encodeURIComponent(username)}`);
    const data = await response.json();
    
    if (!response.ok) {
      return { available: false, error: data.error || 'Failed to check username availability' };
    }
    
    return { available: data.available, error: data.error };
  } catch (error) {
    console.error('Error checking username availability:', error);
    return { available: false, error: 'Network error. Please try again.' };
  }
};

/**
 * Debounce utility for API calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Generate username suggestion from business name or first name
 * @param businessName - Business name
 * @param firstName - First name
 * @returns Suggested username
 */
export const generateUsernameSuggestion = (businessName?: string, firstName?: string): string => {
  const base = businessName || firstName || '';
  if (!base) return '';
  
  // Remove special characters, keep alphanumeric and spaces
  let cleaned = base.replace(/[^a-zA-Z0-9\s]/g, '');
  // Replace spaces with underscores
  cleaned = cleaned.replace(/\s+/g, '_');
  // Convert to lowercase
  cleaned = cleaned.toLowerCase();
  // Remove multiple underscores
  cleaned = cleaned.replace(/_+/g, '_');
  // Remove leading/trailing underscores
  cleaned = cleaned.trim().replace(/^_+|_+$/g, '');
  
  // Truncate if too long (leave room for random digits)
  if (cleaned.length > 26) {
    cleaned = cleaned.substring(0, 26);
  }
  
  return cleaned;
};

