import React from 'react';

const ReturnRefund = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32 2xl:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-[36px] font-medium text-primary-600 mb-2">AOINSTORE</h1>
          <h2 className="text-xl sm:text-2xl md:text-[28px] font-medium text-gray-900 mb-3 sm:mb-4">RETURN AND REFUND POLICY</h2>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">1. INTRODUCTION</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              This Return and Refund Policy explains the conditions, procedures, and limitations for returning products and claiming refunds on Aoinstore. This policy is created in accordance with the Consumer Protection Act 2019, Consumer Protection E-Commerce Rules 2020, and other applicable Indian laws. By placing an order on Aoinstore, the user agrees to all terms listed in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">2. GENERAL RETURN ELIGIBILITY</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore follows a structured return framework to ensure fairness for buyers, sellers, and the platform. A product is eligible for return only if the following conditions are met:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>The product is defective, damaged, expired, or not as described.</li>
              <li>The product received is incorrect or missing parts.</li>
              <li>The customer raises a return request within the eligible return window.</li>
              <li>The product is unused, in original packaging, with all original accessories, manuals, and tags.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">3. NON RETURNABLE PRODUCTS</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Certain product categories are not eligible for return due to hygiene, safety, or regulatory reasons. These categories include but are not limited to:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Innerwear and personal hygiene products.</li>
              <li>Cosmetics, perfumes, and skincare once opened.</li>
              <li>Food, groceries, beverages, and perishable items.</li>
              <li>Digital products or services.</li>
              <li>Items marked as Non Returnable on the product page.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">4. RETURN WINDOW</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              The standard return window on Aoinstore ranges from 2 to 7 days depending on the product category. The exact return period will be mentioned on the respective product page.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">5. RETURN PROCESS</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">To initiate a return, the customer must follow these steps:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Log into the Aoinstore account.</li>
              <li>Visit Orders section and click Request Return.</li>
              <li>Select the return reason and upload necessary images or videos of the issue.</li>
              <li>Ensure the product is packed securely for pickup.</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore reserves the right to approve or reject a return request after verification.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">6. PICKUP AND QUALITY CHECK</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore or its logistics partner will arrange a pickup from the customer address. A quality check will be conducted at the seller warehouse or Aoinstore returns center. Return approval is subject to:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Product being in original condition.</li>
              <li>Verification that the claimed defect or issue is valid.</li>
              <li>Product not being altered, used, washed, or damaged by the customer.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">7. REFUND POLICY</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Refund approval is based on successful quality check of the returned item. Refund method:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Prepaid orders: Refunded to original payment mode.</li>
              <li>COD orders: Refunded to the customer's bank account or Aoinstore Wallet.</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Refund processing time is 3 to 7 working days after QC approval. Refund timelines depend on the payment gateway and bank processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">8. SELLER RESPONSIBILITY</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Sellers on Aoinstore must ensure accurate listings, proper packaging, and genuine products. If a return is approved due to seller fault such as defects or wrong items, the seller bears the reverse shipping cost and refund liability.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">9. REJECTION OF RETURNS</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore reserves the right to reject returns under the following circumstances:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Product is used, damaged, or missing accessories.</li>
              <li>Serial number or IMEI is tampered.</li>
              <li>Wrong item sent by customer.</li>
              <li>Return request is raised outside the eligible return window.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">10. FRAUD PREVENTION</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore implements strict fraud detection for returns. Any misuse, such as frequent returns, switching items, fake claims, or intentional damage, may result in:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Return denial.</li>
              <li>Account suspension.</li>
              <li>Legal action under IPC fraud sections and IT Act 2000.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">11. LEGAL COMPLIANCE</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              This policy is compliant with the Consumer Protection Act 2019 and E-Commerce Rules 2020. As an intermediary under IT Act 2000 Section 79, Aoinstore is protected from liability for third-party actions provided due diligence is followed.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">12. FINAL DECISION AUTHORITY</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore's decision regarding returns and refunds shall be final and binding. The platform reserves the right to modify or update this policy without prior notice.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ReturnRefund;