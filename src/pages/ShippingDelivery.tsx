import React from 'react';

const ShippingDelivery = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32 2xl:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-[36px] font-medium text-primary-600 mb-2">AOINSTORE</h1>
          <h2 className="text-xl sm:text-2xl md:text-[28px] font-medium text-gray-900 mb-3 sm:mb-4">SHIPPING AND DELIVERY POLICY</h2>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">1. INTRODUCTION</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              This Shipping and Delivery Policy outlines how Aoinstore processes, ships, and delivers customer orders. The policy is created in accordance with the Consumer Protection Act 2019, Consumer Protection E-Commerce Rules 2020, and applicable logistics compliance norms in India.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">2. DELIVERY COVERAGE</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore currently offers delivery across India. Delivery availability may vary depending on the customer's PIN code, logistics partner coverage, product category, and seller dispatch capability.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">3. SHIPPING METHODS</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore uses multiple trusted logistics partners to deliver orders safely. The shipping method assigned depends on:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Customer location.</li>
              <li>Product type and size.</li>
              <li>Seller warehouse location.</li>
              <li>Logistics service availability.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">4. ORDER PROCESSING TIME</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Order processing time depends on seller handling capacity. In most cases, sellers take 1 to 3 business days to pack and hand over the product to the courier partner. Weekends and public holidays may extend processing timelines.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">5. ESTIMATED DELIVERY TIME</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Estimated delivery time is displayed on the product page and checkout page. Delivery usually takes:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>2 to 5 days for major cities.</li>
              <li>3 to 7 days for other serviceable regions.</li>
              <li>Remote or rural locations may require additional time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">6. ORDER TRACKING</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Once shipped, customers receive a tracking ID via SMS, email, or app notification. The order can be tracked through:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Aoinstore app tracking section.</li>
              <li>Logistics partner tracking website.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">7. SHIPPING CHARGES</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Shipping charges, if applicable, are displayed during checkout. Charges depend on product weight, delivery location, and seller shipping policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">8. DELIVERY ATTEMPTS</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              The courier partner will attempt delivery up to two times. If unsuccessful due to customer unavailability, incorrect address, or unreachable contact number, the order may be returned to the seller.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">9. DELAYED DELIVERY</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore is not responsible for delays caused by:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Natural calamities or weather conditions.</li>
              <li>Logistic strikes or operational issues.</li>
              <li>Government restrictions or unforeseen incidents.</li>
              <li>High-demand or festive seasons.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">10. DAMAGED OR TAMPERED PACKAGES</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">If the customer receives a tampered, damaged, or opened package, they must:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Refuse delivery at the doorstep.</li>
              <li>Capture photos or videos of the package.</li>
              <li>Report the issue through the Aoinstore app within 24 hours.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">11. FAILED DELIVERY AND RTO POLICY</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">An order is marked RTO (Return to Origin) if:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>The customer is unreachable during repeated attempts.</li>
              <li>Address is incomplete or incorrect.</li>
              <li>Entry is restricted in certain premises.</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              RTO handling charges may apply in cases of customer-side failure.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">12. INTERNATIONAL SHIPPING</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore currently does not support international shipping unless specifically mentioned on the product page.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">13. LEGAL COMPLIANCE</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              This policy adheres to the Consumer Protection Act 2019, E-Commerce Rules 2020, and logistics regulations applicable in India. As per IT Act 2000 Section 79, Aoinstore is an intermediary and is not liable for delays or failures caused by third-party courier partners.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-primary-600 mb-3 sm:mb-4">14. FINAL DECISION AUTHORITY</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore reserves the right to modify delivery terms, logistics partners, and operational procedures at any time. All decisions taken by Aoinstore regarding shipping and delivery are final and binding.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ShippingDelivery;
