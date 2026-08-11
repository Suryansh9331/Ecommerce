import React from 'react';

const CancellationPolicy = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32 2xl:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-[36px] font-medium text-primary-600 mb-2">AOINSTORE</h1>
          <h2 className="text-xl sm:text-2xl md:text-[28px] font-medium text-gray-900 mb-3 sm:mb-4">CANCELLATION POLICY</h2>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">1. INTRODUCTION</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              This Cancellation Policy explains how customers may cancel orders placed through Aoinstore, including timelines, eligibility, refund rules, and seller responsibilities. The policy aligns with the Consumer Protection Act 2019 and Consumer Protection E-Commerce Rules 2020.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">2. ORDER CANCELLATION BY CUSTOMER</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">A customer may cancel an order under the following conditions:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>The order is not yet packed or shipped by the seller.</li>
              <li>The product page specifically allows cancellation.</li>
              <li>The order is still in the Pending or Processing stage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">3. NON CANCELLABLE ORDERS</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Certain orders cannot be cancelled once placed. Such cases include:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>The order is already packed or shipped.</li>
              <li>Items categorized as Non Cancellable (mentioned on product page).</li>
              <li>Perishable goods, groceries, or made-to-order items.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">4. HOW TO CANCEL AN ORDER</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">To cancel an order, customers must follow these steps:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Log in to Aoinstore account.</li>
              <li>Go to Orders section and select Cancel Order.</li>
              <li>Provide a valid reason if prompted.</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              If cancellation is approved, the customer receives a confirmation notification instantly.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">5. REFUND ON CANCELLATION</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Refunds for cancelled orders are processed as follows:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Prepaid orders: Refunded to original payment method.</li>
              <li>COD orders: No refund required unless a return is involved.</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Refund processing time is 2 to 5 working days depending on the payment gateway and bank.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">6. SELLER CANCELLATION</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">A seller may cancel an order under rare conditions such as:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Product out of stock.</li>
              <li>Incorrect pricing or listing error.</li>
              <li>Delivery not serviceable at customer location.</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Customers are notified immediately and a full refund is initiated for prepaid orders.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">7. AUTOMATIC CANCELLATION</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore may cancel orders automatically in scenarios including:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Payment failure or incomplete payment confirmation.</li>
              <li>Fraudulent activity suspicion.</li>
              <li>Invalid or unreachable contact details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">8. CANCELLATION AFTER SHIPPING</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Once the order is shipped, cancellation is not allowed. The customer may request a return after delivery, depending on the product's return eligibility.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">9. DELIVERY REFUSAL</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Customers may refuse delivery at the doorstep only if:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>The package is visibly damaged or tampered.</li>
              <li>The wrong item is delivered.</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Unjustified refusals may result in shipping charges being deducted from future refunds.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">10. FRAUD PREVENTION</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Repeated cancellations, misuse of COD, or suspicious behavior may lead to:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Order cancellation restrictions.</li>
              <li>COD blockage for the user.</li>
              <li>Account suspension.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">11. LEGAL COMPLIANCE</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              This policy is compliant with the Consumer Protection Act 2019 and E-Commerce Rules 2020. As per IT Act 2000 Section 79, Aoinstore is an intermediary and is not liable for seller-side cancellation delays or errors.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">12. FINAL DECISION AUTHORITY</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore reserves the right to modify cancellation rules and approve or deny cancellation requests. The decision of Aoinstore shall be final and binding.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy;