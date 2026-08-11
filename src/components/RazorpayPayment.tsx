import React, { useEffect } from 'react';
import { RAZORPAY_KEY_ID, RAZORPAY_CURRENCY, PAYMENT_LOGO_URL } from '../config';

// Extend Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentProps {
  amount: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
  description?: string;
  businessName?: string;
  businessLogo?: string;
  currency?: string;
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  amount,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onError,
  onClose,
  description = "Test Transaction",
  businessName = "Aoin Store",
  businessLogo = PAYMENT_LOGO_URL,
  currency,
}) => {
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const openRazorpay = async () => {
      const res = await loadRazorpayScript();
      if (!res) {
        onError('Razorpay SDK failed to load');
        return;
      }

      const resolvedCurrency = currency || RAZORPAY_CURRENCY;
      const options = {
        key: RAZORPAY_KEY_ID,
        // Omit amount here to rely on order's amount for accuracy across currencies
        currency: resolvedCurrency,
        name: businessName,
        description: description,
        image: businessLogo,
        order_id: orderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        notes: {
          order_id: orderId,
          business_name: businessName,
        },
        theme: {
          color: '#1800AC', // Orange color matching your theme
        },
        handler: function (response: any) {
          // console.log('Razorpay payment success:', response);
          const returnedOrderId = response.razorpay_order_id || orderId;
          if (!response.razorpay_payment_id || !returnedOrderId || !response.razorpay_signature) {
            onError('Incomplete payment response from Razorpay');
            return;
          }
          onSuccess(response.razorpay_payment_id, returnedOrderId, response.razorpay_signature);
        },
        modal: {
          ondismiss: function () {
            console.log('Razorpay modal closed');
            onClose();
          },
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error('Error opening Razorpay:', error);
        onError('Failed to open payment gateway');
      }
    };

    // Auto-open Razorpay when component mounts
    openRazorpay();
  }, [amount, orderId, customerName, customerEmail, customerPhone, onSuccess, onError, onClose, description, businessName, businessLogo, currency]);

  return null; // This component doesn't render anything
};

export default RazorpayPayment;
