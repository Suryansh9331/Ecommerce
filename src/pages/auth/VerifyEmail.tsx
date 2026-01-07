import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');               // for resend
  const [resendInProgress, setResendInProgress] = useState<boolean>(false);
  const { verifyEmail, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const isVerifying = useRef(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 VerifyEmail Component Rendered');
    console.log('Token from URL:', token);
    console.log('Current status:', status);
  }, [token, status]);

  useEffect(() => {
    const verifyEmailToken = async () => {
      console.log('🚀 Starting email verification...');
      console.log('Token:', token);
      console.log('isVerifying.current:', isVerifying.current);
      
      if (isVerifying.current) {
        console.log('⚠️ Already verifying, skipping...');
        return;
      }
      
      if (!token) {
        console.error('❌ No token provided');
        setStatus('error');
        setError('Invalid verification link. Token is missing.');
        return;
      }
      
      isVerifying.current = true;
      setStatus('verifying');
      setError('');

      try {
        console.log('📡 Calling verifyEmail API...');
        const success = await verifyEmail(token);
        console.log('✅ verifyEmail returned:', success);
        
        if (success) {
          console.log('✅ Verification successful!');
          setStatus('success');
          setTimeout(() => {
            console.log('🔄 Redirecting to home...');
            navigate('/');
          }, 2000);
        } else {
          console.error('❌ Verification returned false');
          throw new Error('Verification failed - please try again');
        }
      } catch (err) {
        console.error('❌ Email verification error:', err);
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setError(errorMessage);
        // If it's a network error or API error, provide helpful message
        if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
          setError('Network error. Please check your internet connection and try again.');
        }
      } finally {
        isVerifying.current = false;
        console.log('🏁 Verification process completed');
      }
    };

    verifyEmailToken();
  }, [token, verifyEmail, navigate]);

  const handleResend = async () => {
    if (!emailInput) {
      setError('Please enter your email address to resend.');
      return;
    }
    setResendInProgress(true);
    setError('');
    try {
      const ok = await resendVerificationEmail(emailInput);
      if (ok) {
        setError('Verification email resent! Check your inbox.');
      } else {
        throw new Error('Unable to resend verification link');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error sending verification link');
    } finally {
      setResendInProgress(false);
    }
  };

  // Ensure content is always displayed, even if there's an error
  useEffect(() => {
    console.log('VerifyEmail component mounted, token:', token, 'status:', status);
    if (!token) {
      setStatus('error');
      setError('Invalid verification link. Token is missing.');
    }
  }, [token, status]);

  // Ensure we always have a valid status
  const displayStatus = status || 'verifying';

  // Always render something, even if there's an issue
  if (!token && status === 'verifying') {
    console.warn('⚠️ No token found in URL params');
  }

  return (
    <div 
      className="bg-gray-50 w-full flex items-center justify-center px-4 py-8" 
      style={{ 
        minHeight: 'calc(100vh - 200px)',
        position: 'relative',
        zIndex: 1,
        paddingTop: '100px',
        paddingBottom: '100px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '0',
        marginBottom: '0'
      }}
    >
      <motion.div
        className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ 
          position: 'relative', 
          zIndex: 10, 
          width: '100%', 
          maxWidth: '500px',
          margin: '0 auto'
        }}
      >
        <div className="text-center" style={{ width: '100%' }}>
          {(displayStatus === 'verifying' || !displayStatus) && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying your email...</h2>
              <p className="text-gray-600 mb-4">Please wait while we verify your email address.</p>
              <div className="flex justify-center mb-4">
                <svg className="animate-spin h-8 w-8 text-[#F2631F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </>
          )}

          {displayStatus === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <svg className="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Your email address has been successfully verified. You can now access all features.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-[#F2631F] text-white py-2 px-6 rounded-md hover:bg-orange-600 transition-colors"
              >
                Go to Home Page
              </button>
            </>
          )}

          {displayStatus === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <svg className="h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
              <p className="text-red-600 mb-4">
                {error || 'The verification link is invalid or has expired. Please request a new verification email.'}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/sign-in')}
                  className="w-full bg-[#F2631F] text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
                >
                  Go to Sign In
                </button>
                
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Return to Sign Up
                </button>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-700 mb-2">Resend verification email:</p>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleResend}
                  disabled={resendInProgress}
                  className="w-full bg-[#F2631F] text-white py-2 rounded-md hover:bg-orange-600 transition-colors disabled:bg-gray-400"
                >
                  {resendInProgress ? 'Sending...' : 'Resend Link'}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
