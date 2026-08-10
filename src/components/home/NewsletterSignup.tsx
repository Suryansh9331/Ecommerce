import React, { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../ui/ToastContainer';
const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
const { toasts, success } = useToast();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission - would connect to backend in real implementation
    // console.log('Email submitted:', email);
    
    // Reset the form
    setEmail('');
    
    // Provide feedback to user (in a real app this would be a proper toast or alert)
    success('Thank you for subscribing to our newsletter!');
  };

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <div className="bg-[#1a2332] rounded-lg overflow-hidden shadow-lg">
          <div className="flex flex-row items-center p-6">
            <div className="w-1/4 lg:w-1/5">
              <img 
                src="/newsletter-icon.png" 
                alt="Newsletter"
                className="w-full h-auto object-contain"
              />
            </div>
            
            <div className="w-3/4 lg:w-4/5 pl-6 text-white">
              <h3 className="text-xl md:text-2xl font-bold mb-2">Stay Updated with Our Latest Offers</h3>
              <p className="text-gray-300 mb-4 text-sm">Subscribe to our newsletter and get exclusive deals, new product announcements, and shopping tips delivered to your inbox.</p>
              
              <form onSubmit={handleSubmit} className="mt-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-grow px-4 py-3 rounded-md border-0 text-gray-800 outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Subscribe
                  </button>
                </div>
                <p className="text-gray-400 text-xs mt-3">
                  By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </section>
  );
};

export default NewsletterSignup;