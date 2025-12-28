import React from 'react';

const PaymentPolicy = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32 2xl:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-[36px] font-medium text-[#FF4D00] mb-2">AOINSTORE</h1>
          <h2 className="text-xl sm:text-2xl md:text-[28px] font-medium text-gray-900 mb-3 sm:mb-4">PAYMENT POLICY</h2>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">1. INTRODUCTION</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              This Payment Policy explains how payments are processed on Aoinstore, including accepted payment methods, refund processing, security measures, and seller settlement rules. The policy complies with the Reserve Bank of India (RBI) guidelines, IT Act 2000, and Consumer Protection E-Commerce Rules 2020.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">2. ACCEPTED PAYMENT METHODS</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore supports the following payment methods for customer convenience:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>UPI.</li>
              <li>Debit and Credit Cards.</li>
              <li>Net Banking.</li>
              <li>Digital Wallets (where applicable).</li>
              <li>Cash on Delivery (COD) for selected PIN codes.</li>
              <li>Other RBI-approved payment modes as updated on the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">3. PAYMENT GATEWAY SECURITY</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              All online transactions are processed through RBI-regulated and PCI-DSS compliant payment gateways. Aoinstore does not store card numbers, CVV, or sensitive payment details. Tokenized payment methods are used wherever applicable to ensure maximum protection.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">4. PAYMENT CONFIRMATION</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">After successful payment, customers receive:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>An order confirmation notification.</li>
              <li>A digital invoice via email or inside the app.</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              If payment fails, the order will not be processed.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">5. CASH ON DELIVERY (COD)</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">COD availability is subject to:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Delivery PIN code eligibility.</li>
              <li>Product category restrictions.</li>
              <li>Customer order history and fraud checks.</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore reserves the right to disable COD for users who frequently cancel or refuse deliveries.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">6. REFUND PROCESSING</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">In case of returns, cancellations, or failed deliveries, refunds are processed as follows:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Prepaid transactions: Refunded to original payment source.</li>
              <li>COD orders: Refunded to the customer's bank account or Aoinstore Wallet.</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Refund completion timeline is 3 to 7 working days depending on bank and payment gateway processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">7. PAYMENT DISPUTES AND CHARGEBACKS</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Customers must raise disputes through Aoinstore support. In cases where customers initiate chargebacks directly through their bank or card issuer, Aoinstore reserves the right to provide evidence supporting the transaction.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">8. FRAUD PREVENTION</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore uses automated fraud detection to protect customers and sellers. Any suspicious payment activity may lead to:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Order cancellation.</li>
              <li>Account suspension.</li>
              <li>Reporting to authorities under IT Act 2000 and applicable cyber laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">9. SELLER PAYOUTS AND SETTLEMENTS</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Sellers on Aoinstore receive payments after deduction of:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Platform commission fees.</li>
              <li>Shipping charges (if applicable).</li>
              <li>Penalties (if applicable).</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Settlement cycle ranges from 3 to 7 working days after successful order delivery and no return claims from customers.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">10. INVOICE AND TAXATION</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Invoices generated on Aoinstore comply with GST norms. Sellers are responsible for GST filing, HSN code accuracy, and tax compliance for their products. Aoinstore is not responsible for seller-side tax inaccuracies.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">11. LEGAL COMPLIANCE</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              This policy adheres to RBI digital payment guidelines, IT Act 2000, GST Act, and Consumer Protection E-Commerce Rules 2020. As per Section 79 of the IT Act, Aoinstore is an intermediary and cannot be held liable for disputes arising out of seller pricing or incorrect financial filings.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">12. FINAL DECISION AUTHORITY</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore reserves full authority to modify payment rules, disable payment methods, and take decisions in cases of fraudulent activity. All decisions of Aoinstore regarding payments are final and binding.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PaymentPolicy;
