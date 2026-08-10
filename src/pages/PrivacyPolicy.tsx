import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32 2xl:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-[36px] font-medium text-[#FF4D00] mb-2">AOINSTORE</h1>
          <h2 className="text-xl sm:text-2xl md:text-[28px] font-medium text-gray-900 mb-3 sm:mb-4">PRIVACY POLICY</h2>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">1. INTRODUCTION</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore respects user privacy and is committed to protecting personal data. This policy explains the categories of data we collect, the purpose of collection, storage, sharing rules, user rights, and legal compliance aligned with the Digital Personal Data Protection Act (DPDP Act) 2023, Information Technology Act 2000, and Consumer Protection (E-Commerce) Rules 2020.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">2. DATA WE COLLECT</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore collects the following categories of data for legal and operational purposes:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li><strong>Personal Identification Data:</strong> Name, email, mobile number, DOB, gender, profile image.</li>
              <li><strong>Compliance Data:</strong> PAN, Aadhaar, GSTIN, business documents, bank details.</li>
              <li><strong>Address & Location Data:</strong> Shipping address, billing address, geo-location (if permitted).</li>
              <li><strong>Payment Data:</strong> Transaction IDs, wallet data, UPI ID (masked). Card details are never stored.</li>
              <li><strong>System Data:</strong> IP address, device type, OS, browser, logs, cookies, crash reports.</li>
              <li><strong>Activity Data:</strong> Orders, searches, cart updates, cancellations, interaction logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">3. LEGAL PURPOSES OF DATA COLLECTION</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Data is collected for service delivery, identity verification, fraud prevention, personalization, and compliance under GST laws, IT Act 2000, DPDP Act 2023, and Consumer Protection Rules.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">4. HOW WE USE DATA</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore uses collected data to create accounts, fulfill orders, prevent fraud, process payments, improve platform experience, enforce guidelines, provide customer support, conduct audits, and enable internal analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">5. DATA SHARING</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore does not sell personal data. Limited data may be shared with:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-gray-700 mb-4 space-y-1 text-sm sm:text-base">
              <li>Sellers/Merchants (for fulfilling orders).</li>
              <li>Delivery partners.</li>
              <li>RBI-regulated payment gateways.</li>
              <li>Government authorities when legally required.</li>
              <li>Third-party service providers (hosting, analytics, SMS/Email).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">6. DATA STORAGE & RETENTION</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Data is stored securely within India or approved jurisdictions. It is retained as long as the user account is active, for up to 7 years for taxation requirements, or until legal disputes are resolved. If a seller closes their merchant account through the dashboard, the account and storefront are removed from the platform after a short cancellation window; certain order, tax, and compliance records may be retained as required by law while personal data is handled in line with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">7. SECURITY PRACTICES</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore follows industry-standard security practices including encryption, token-based authentication, secure servers, PCI-DSS compliant payments, OTP verification, and periodic audits under IT Act 2000 Security Rules.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">8. USER RIGHTS UNDER DPDP ACT</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Users may request data access, correction, deletion, consent withdrawal, and lodge complaints with the Data Protection Board of India via Aoinstore’s Grievance Officer. Merchants may also close their account from merchant account settings (including a short period to cancel the request); some information may be kept where the law requires it after closure.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">9. CHILDREN’S PRIVACY</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore does not knowingly collect or process data from minors under 18 years.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">10. COOKIES</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Cookies support login sessions, cart, analytics, fraud checks, and user preferences. Disabling cookies may reduce platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">11. INTERNATIONAL DATA TRANSFERS</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Data may be transferred only to jurisdictions approved under DPDP Act with equal data protection safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">12. GRIEVANCE REDRESSAL</h2>
            <p className="text-gray-700 mb-2 text-sm sm:text-base">Aoinstore appoints a Grievance Officer as mandated under Consumer Protection (E-Commerce) Rules.</p>
            <div className="text-gray-700 mb-4 text-sm sm:text-base">
              <p>Email: <span className="text-[#FF4D00]">infoaoinstore@gmail.com</span></p>
              <p>Response Time: 48 hours</p>
              <p>Resolution Timeline: Within 30 days</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">13. POLICY CHANGES</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Aoinstore may revise or update this privacy policy from time to time. Continued usage implies acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-medium text-[#FF4D00] mb-3 sm:mb-4">14. LEGAL LIABILITY</h2>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              By using Aoinstore, users consent to data processing and acknowledge that Aoinstore is not liable for third-party misuse, incorrect user data, delays by couriers, seller misconduct, or cyberattacks despite reasonable security measures. Legal protections under IT Act 2000 (Section 43A & 79), Indian Contract Act 1872, and DPDP Act apply.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
