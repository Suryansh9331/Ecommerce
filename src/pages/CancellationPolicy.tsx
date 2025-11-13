import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingBag, CalendarClock, FileDigit, HelpCircle, Mail } from 'lucide-react';

const CancellationPolicy: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>('orderCancellation');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const PolicySection = ({ 
    id, 
    title, 
    icon, 
    children 
  }: { 
    id: string; 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode 
  }) => {
    const isOpen = openSection === id;
    
    return (
      <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden transition-all duration-300 hover:shadow-md">
        <button 
          onClick={() => toggleSection(id)}
          className={`w-full flex items-center justify-between p-5 text-left transition-colors duration-300 ${isOpen ? 'bg-[#FFF9E5] border-b border-gray-200' : 'bg-white'}`}
        >
          <div className="flex items-center space-x-3">
            <div className={`${isOpen ? 'text-[#FF4D00]' : 'text-gray-500'}`}>
              {icon}
            </div>
            <h2 className={`text-xl font-medium ${isOpen ? 'text-[#FF4D00]' : 'text-gray-900'}`}>{title}</h2>
          </div>
          <div className="text-gray-500">
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>
        
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-5 bg-white">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-16 xl:px-32 2xl:px-6 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-[36px] font-medium text-[#FF4D00] mb-3">Cancellation Policy</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            At Aoin, we understand that circumstances can change. We strive to make cancellations as easy and transparent as possible while ensuring fair treatment for all customers.
          </p>
        </div>
        
        <PolicySection 
          id="orderCancellation" 
          title="Order Cancellation" 
          icon={<ShoppingBag size={24} />}
        >
          <p className="text-gray-700 mb-4">
            We understand that sometimes you need to cancel your order. Here are our cancellation policies:
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">✓</div>
              <p className="text-gray-700"><strong>Within 1 hour of order placement:</strong> Full refund with no cancellation fee.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">✓</div>
              <p className="text-gray-700"><strong>1-24 hours after order placement:</strong> Full refund minus a $2.99 processing fee.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">!</div>
              <p className="text-gray-700"><strong>After 24 hours:</strong> Orders that have been processed for shipping cannot be cancelled, but may be returned according to our <span className="text-[#FF4D00] underline cursor-pointer">Return Policy</span>.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">✗</div>
              <p className="text-gray-700"><strong>Custom or personalized items:</strong> Cannot be cancelled once production has begin.</p>
            </div>
          </div>
          <div className="bg-[#FFF9E5] p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Processing Time for Cancellations:</h3>
            <p className="text-gray-700 text-sm">Cancellation requests are typically processed within 2-4 business hours. Refunds will be issued to your original payment method within 5-10 business days.</p>
          </div>
        </PolicySection>

        <PolicySection 
          id="subscriptionCancellation" 
          title="Subscription Cancellation" 
          icon={<CalendarClock size={24} />}
        >
          <p className="text-gray-700 mb-4">
            For Aoin subscription services and recurring orders:
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">✓</div>
              <p className="text-gray-700">You may cancel your subscription at any time through your account settings or by contacting customer service.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">i</div>
              <p className="text-gray-700">Cancellations will take effect at the end of your current billing cycle.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">!</div>
              <p className="text-gray-700">No partial refunds are provided for unused portions of the current billing period.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">i</div>
              <p className="text-gray-700">Annual subscriptions cancelled within 14 days of purchase may be eligible for a prorated refund.</p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Subscription Benefits:</h3>
            <p className="text-gray-700 text-sm">Active subscribers receive exclusive discounts, early access to sales, and free shipping on all orders.</p>
          </div>
        </PolicySection>

        <PolicySection 
          id="digitalProducts" 
          title="Digital Products & Services" 
          icon={<FileDigit size={24} />}
        >
          <p className="text-gray-700 mb-4">
            For digital products, downloadable content, and online services:
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">!</div>
              <p className="text-gray-700">Due to the nature of digital products, all sales are final once the product has been downloaded or accessed.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">✓</div>
              <p className="text-gray-700">If you have not downloaded or accessed the digital product, you may request a cancellation within 24 hours of purchase.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">✓</div>
              <p className="text-gray-700">Digital gift cards can be cancelled within 1 hour of purchase if not yet redeemed.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">✗</div>
              <p className="text-gray-700">Online courses and memberships cannot be cancelled once access has been granted.</p>
            </div>
          </div>
        </PolicySection>

        <PolicySection 
          id="requestCancellation" 
          title="How to Request a Cancellation" 
          icon={<Mail size={24} />}
        >
          <p className="text-gray-700 mb-4">
            To cancel an order or subscription, you can use any of the following methods:
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mt-0.5 mr-3 flex-shrink-0">1</div>
              <p className="text-gray-700"><strong>Online:</strong> Log into your Aoin account and navigate to "Order History" or "Subscriptions" to cancel directly.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mt-0.5 mr-3 flex-shrink-0">2</div>
              <p className="text-gray-700"><strong>Email:</strong> Send a cancellation request to <span className="text-[#FF4D00]">infoaoinstore@gmail.com</span> with your order number.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mt-0.5 mr-3 flex-shrink-0">3</div>
              <p className="text-gray-700"><strong>Phone:</strong> Call our customer support team at <span className="text-[#FF4D00]">989 336 1162</span> during business hours.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mt-0.5 mr-3 flex-shrink-0">4</div>
              <p className="text-gray-700"><strong>Live Chat:</strong> Use our live chat feature on the website for immediate assistance.</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-[#FFF9E5] rounded-lg">
            <div className="flex">
              <div className="text-[#FF4D00] flex-shrink-0 mr-3">
                <HelpCircle size={24} />
              </div>
              <div>
                <p className="text-gray-900 font-medium">Need help with cancellation?</p>
                <p className="text-gray-700 text-sm mt-1">Our support team is available Monday-Friday, 9 AM - 6 PM EST to assist you with the cancellation process.</p>
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-gray-700"><strong>Email:</strong> infoaoinstore@gmail.com</p>
                  <p className="text-sm text-gray-700"><strong>Phone:</strong> 989 336 1162</p>
                  <p className="text-sm text-gray-700"><strong>Response Time:</strong> Within 2-4 hours during business hours</p>
                </div>
              </div>
            </div>
          </div>
        </PolicySection>

        <PolicySection 
          id="exceptions" 
          title="Exceptions and Special Circumstances" 
          icon={<HelpCircle size={24} />}
        >
          <p className="text-gray-700 mb-4">
            We understand that exceptional circumstances may arise. Please contact our customer support team if:
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">•</div>
              <p className="text-gray-700">You need to cancel due to a medical emergency or family crisis.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">•</div>
              <p className="text-gray-700">The product received is significantly different from what was advertised or is defective.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">•</div>
              <p className="text-gray-700">There was an error in processing your order or billing.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">•</div>
              <p className="text-gray-700">You experienced technical issues preventing you from cancelling within the standard timeframe.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">•</div>
              <p className="text-gray-700">You are a victim of fraud or unauthorized charges.</p>
            </div>
          </div>
          <p className="text-gray-700">
            We review these situations on a case-by-case basis and strive to find a fair resolution that works for both parties. Please provide documentation when possible to help us process your request efficiently.
          </p>
        </PolicySection>

        <PolicySection 
          id="refundTimeline" 
          title="Refund Timeline and Process" 
          icon={<CalendarClock size={24} />}
        >
          <p className="text-gray-700 mb-4">
            Once your cancellation is approved, here's what you can expect:
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">1</div>
              <p className="text-gray-700"><strong>Immediate:</strong> Order status updated to "Cancelled" in your account.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">2</div>
              <p className="text-gray-700"><strong>1-2 business days:</strong> Refund processing initiated with your payment provider.</p>
            </div>
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#FF4D00] mt-0.5 mr-3 flex-shrink-0">3</div>
              <p className="text-gray-700"><strong>5-10 business days:</strong> Refund appears in your account (timing depends on your bank/card issuer).</p>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Important Notes:</h3>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Processing fees are non-refundable for cancellations after 1 hour</li>
              <li>• Shipping costs are non-refundable unless the order was cancelled before processing</li>
              <li>• Gift cards and promotional credits may have different refund policies</li>
              <li>• International orders may take longer due to currency conversion and banking processes</li>
            </ul>
          </div>
        </PolicySection>

        <div className="mt-8 p-5 border-t border-gray-200 text-sm text-gray-600">
          <p className="mb-1">Last Updated: December 15, 2024</p>
          <p>This cancellation policy is subject to change. Please check back regularly for updates. For questions about this policy, contact us at infoaoinstore@gmail.com or call 989 336 1162.</p>
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy;