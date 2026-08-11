import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SuperAdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      toast.success('Welcome back! Redirecting to admin dashboard...');
      navigate('/superadmin');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Make the API request to validate credentials
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        // Log the user data to see what we're getting from the backend
        // console.log('Login response data:', data);
        // console.log('User role from backend:', data.user?.role);
        
        // The backend might be returning a different role format
        // Accept any role that includes 'admin' (case insensitive)
        const userRole = data.user?.role?.toLowerCase() || '';
        const isAdmin = userRole.includes('admin') || userRole === 'super_admin';
        
        if (!isAdmin) {
          console.error('Role check failed:', userRole);
          const errorMessage = 'Unauthorized: Only admin users can access this area';
          setError(errorMessage);
          toast.error(errorMessage);
          return;
        }

        // Login using the AuthContext
        const success = await login(data.access_token, data.refresh_token, data.user);
        
        if (success) {
          toast.success('Successfully logged in! Redirecting to Super admin dashboard...');
          // Redirect to superadmin dashboard
          navigate('/superadmin');
        } else {
          const errorMessage = 'Failed to update authentication context';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        const errorMessage = data.error || data.message || 'Invalid email or password';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA]">
      <motion.div 
        className="max-w-md w-full bg-white rounded-2xl shadow-md overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Super Admin Portal</h1>
            <p className="text-sm text-gray-600">Access the administrative dashboard</p>
          </div>
  
          {error && (
            <div className="mb-5 p-3 flex items-start text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
  
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                placeholder="admin@example.com"
                required
              />
            </div>
  
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
  
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 rounded-md text-white font-medium transition-colors ${
                isSubmitting
                  ? 'bg-primary-600/70 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2'
              }`}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
  
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>This portal is restricted to authorized administrative personnel only.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
  
};

export default SuperAdminLogin;
