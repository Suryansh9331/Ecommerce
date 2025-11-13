// import React, { useState } from 'react';
// import { ChevronDown, ChevronUp, Truck, Clock, Globe, AlertCircle } from 'lucide-react';

// const ShippingDelivery = () => {
//   const [openSection, setOpenSection] = useState<string | null>('shipping');

//   const toggleSection = (section: string) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   return (
//     <div className="bg-white min-h-screen">
//       <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-16 xl:px-32 2xl:px-6 py-16">
//         <h1 className="text-[36px] font-medium text-[#FF4D00] mb-6">Shipping & Delivery Policy</h1>

//         <p className="text-gray-600 mb-8">
//           AOIN Store ships orders across India and internationally to multiple countries/regions, with realistic processing and transit timelines that vary by service level, destination, and operational conditions.
//         </p>

//         {/* Shipping Options Section */}
//         <div className="mb-6 border border-gray-200 rounded-lg">
//           <button
//             className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
//             onClick={() => toggleSection('shipping')}
//           >
//             <div className="flex items-center">
//               <Truck className="mr-3 text-[#FF4D00]" size={20} />
//               <h2 className="text-xl font-medium text-gray-900">Shipping Options</h2>
//             </div>
//             {openSection === 'shipping' ?
//               <ChevronUp className="text-[#FF4D00]" size={20} /> :
//               <ChevronDown className="text-[#FF4D00]" size={20} />
//             }
//           </button>

//           {openSection === 'shipping' && (
//             <div className="p-4 bg-white rounded-b-lg">
//               <div className="space-y-4">
//                 <div className="border-b border-gray-200 pb-4">
//                   <ul className="list-disc pl-5 text-gray-600 space-y-1">
//                     <li>
//                       <strong>Dynamic Courier Selection:</strong> Couriers are allocated based on destination serviceability, speed, and reliability.
//                       Service levels may include Standard and Express where available.
//                     </li>
//                     <li>
//                       A tracking link/ID is generated once the parcel is handed over to the courier.
//                       Status milestones (picked up, in transit, out for delivery, delivered) update as the carrier scans progress.
//                     </li>
//                     <li>
//                       Customers can view the tracking ID and live shipment status anytime by logging into the “My Account” section and opening the relevant Order Details page.
//                     </li>
//                     <li>
//                       <strong>Multi-Parcel Orders:</strong> Multi-item orders may ship in separate parcels; each parcel will have its own tracking ID.
//                     </li>
//                   </ul>
//                 </div>
//               </div>

//             </div>
//           )}
//         </div>

//         {/* Delivery Timeframes Section */}
//         <div className="mb-6 border border-gray-200 rounded-lg">
//           <button
//             className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
//             onClick={() => toggleSection('timeframes')}
//           >
//             <div className="flex items-center">
//               <Clock className="mr-3 text-[#FF4D00]" size={20} />
//               <h2 className="text-xl font-medium text-gray-900">Delivery Timeframes</h2>
//             </div>
//             {openSection === 'timeframes' ?
//               <ChevronUp className="text-[#FF4D00]" size={20} /> :
//               <ChevronDown className="text-[#FF4D00]" size={20} />
//             }
//           </button>

//           {openSection === 'timeframes' && (
//             <div className="p-4 bg-white rounded-b-lg">
//               <p className="text-gray-600 mb-4">
//               </p>

//               <div className="space-y-4">
//                 <div className="border-b border-gray-200 pb-4">
//                   <h3 className="font-medium text-gray-900 mb-2">Processing Time</h3>
//                   <ul className="list-disc pl-5 text-gray-600 space-y-1">
//                     <li>
//                       <strong>Standard Processing:</strong> 24–48 business hours after successful payment and verification for in-stock items (excluding Sundays and public holidays). Peak sale periods or made-to-order/custom items may require extra handling time.
//                     </li>
//                     <li>
//                       <strong>Cut-off Handling:</strong> Orders placed after the daily cut-off or on holidays are queued for the next working day dispatch.
//                     </li>
//                   </ul>
//                 </div>


//                 {/* <div className="border-b border-gray-200 pb-4">
//                   <h3 className="font-medium text-gray-900 mb-2">Tracking Information</h3>
//                   <p className="text-gray-600">You'll receive a tracking number via email once your order ships</p>
//                   <p className="text-gray-600">You can also check order status in your account dashboard</p>
//                   <p className="text-gray-600">Real-time tracking updates available through our website</p>
//                 </div>

//                 <div className="pb-2">
//                   <h3 className="font-medium text-gray-900 mb-2">Delivery Notifications</h3>
//                   <p className="text-gray-600">Email notifications sent when your order ships and when it's out for delivery</p>
//                   <p className="text-gray-600">SMS notifications available for express and next-day deliveries</p>
//                 </div> */}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* International Shipping Section */}
//         <div className="mb-6 border border-gray-200 rounded-lg">
//           <button
//             className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
//             onClick={() => toggleSection('international')}
//           >
//             <div className="flex items-center">
//               <Globe className="mr-3 text-[#FF4D00]" size={20} />
//               <h2 className="text-xl font-medium text-gray-900">International Shipping</h2>
//             </div>
//             {openSection === 'international' ?
//               <ChevronUp className="text-[#FF4D00]" size={20} /> :
//               <ChevronDown className="text-[#FF4D00]" size={20} />
//             }
//           </button>

//           {openSection === 'international' && (
//             <div className="p-4 bg-white rounded-b-lg">
//               <p className="text-gray-600 mb-4">
//                 We ship to most international destinations. Please be aware that international shipping may involve
//                 additional customs fees, taxes, or duties that are your responsibility. These fees are not included in your order total.
//               </p>

//               <div className="space-y-4">
//                 <div className="border-b border-gray-200 pb-4">
//                   <h3 className="font-medium text-gray-900 mb-2">International Standard</h3>
//                   <p className="text-gray-600">7-14 business days - $14.99 to $29.99 (based on destination)</p>
//                   <p className="text-gray-600">Free on orders over $150</p>
//                 </div>

//                 <div className="border-b border-gray-200 pb-4">
//                   <h3 className="font-medium text-gray-900 mb-2">International Express</h3>
//                   <p className="text-gray-600">3-7 business days - $24.99 to $49.99 (based on destination)</p>
//                   <p className="text-gray-600">Free on orders over $200</p>
//                 </div>

//                 <div className="pb-2">
//                   <h3 className="font-medium text-gray-900 mb-2">Countries We Don't Ship To</h3>
//                   <p className="text-gray-600">Due to shipping restrictions, we currently don't ship to certain countries including:</p>
//                   <ul className="list-disc pl-5 text-gray-600 mt-2 space-y-1">
//                     <li>Cuba, Iran, North Korea, Syria</li>
//                     <li>Some remote islands and territories</li>
//                     <li>Countries with strict import restrictions</li>
//                   </ul>
//                   <p className="text-gray-600 mt-2">Please contact our customer service for the current list of restricted destinations.</p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Shipping Policies Section */}
//         <div className="mb-6 border border-gray-200 rounded-lg">
//           <button
//             className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
//             onClick={() => toggleSection('policies')}
//           >
//             <div className="flex items-center">
//               <AlertCircle className="mr-3 text-[#FF4D00]" size={20} />
//               <h2 className="text-xl font-medium text-gray-900">Shipping Policies</h2>
//             </div>
//             {openSection === 'policies' ?
//               <ChevronUp className="text-[#FF4D00]" size={20} /> :
//               <ChevronDown className="text-[#FF4D00]" size={20} />
//             }
//           </button>

//           {openSection === 'policies' && (
//             <div className="p-4 bg-white rounded-b-lg">
//               <div className="space-y-4">
//                 <div className="border-b border-gray-200 pb-4">
//                   <h3 className="font-medium text-gray-900 mb-2">Order Changes</h3>
//                   <p className="text-gray-600">Changes to orders can only be made within 1 hour of placing your order</p>
//                   <p className="text-gray-600">Contact customer service immediately to request changes</p>
//                   <p className="text-gray-600">Once an order is processed for shipping, changes cannot be made</p>
//                 </div>

//                 <div className="border-b border-gray-200 pb-4">
//                   <h3 className="font-medium text-gray-900 mb-2">Undeliverable Packages</h3>
//                   <p className="text-gray-600">Please ensure your shipping address is correct and complete</p>
//                   <p className="text-gray-600">If a package is returned as undeliverable, we'll contact you about reshipping</p>
//                   <p className="text-gray-600">Additional shipping fees may apply for reshipping</p>
//                 </div>

//                 <div className="border-b border-gray-200 pb-4">
//                   <h3 className="font-medium text-gray-900 mb-2">Lost or Damaged Packages</h3>
//                   <p className="text-gray-600">Please report any lost or damaged items within 7 days of the expected delivery date</p>
//                   <p className="text-gray-600">We'll work with you to resolve the issue promptly</p>
//                   <p className="text-gray-600">Take photos of damaged items for faster processing</p>
//                 </div>

//                 <div className="border-b border-gray-200 pb-4">
//                   <h3 className="font-medium text-gray-900 mb-2">Address Verification</h3>
//                   <p className="text-gray-600">We use address verification systems to ensure accurate delivery</p>
//                   <p className="text-gray-600">If there's a discrepancy, our customer service team may contact you</p>
//                   <p className="text-gray-600">Please provide a complete and accurate shipping address</p>
//                 </div>

//                 <div className="pb-2">
//                   <h3 className="font-medium text-gray-900 mb-2">Signature Requirements</h3>
//                   <p className="text-gray-600">Orders over $200 require signature upon delivery</p>
//                   <p className="text-gray-600">Express and next-day deliveries may require signature</p>
//                   <p className="text-gray-600">You can authorize package release in your account settings</p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Shipping Carriers Section */}
//         <div className="mb-6 border border-gray-200 rounded-lg">
//           <button
//             className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
//             onClick={() => toggleSection('carriers')}
//           >
//             <div className="flex items-center">
//               <Truck className="mr-3 text-[#FF4D00]" size={20} />
//               <h2 className="text-xl font-medium text-gray-900">Shipping Carriers</h2>
//             </div>
//             {openSection === 'carriers' ?
//               <ChevronUp className="text-[#FF4D00]" size={20} /> :
//               <ChevronDown className="text-[#FF4D00]" size={20} />
//             }
//           </button>

//           {openSection === 'carriers' && (
//             <div className="p-4 bg-white rounded-b-lg">
//               <p className="text-gray-600 mb-4">
//                 We partner with reliable shipping carriers to ensure your orders arrive safely and on time.
//               </p>

//               <div className="space-y-4">
//                 <div className="border-b border-gray-200 pb-4">
//                   <h3 className="font-medium text-gray-900 mb-2">Domestic Shipping</h3>
//                   <ul className="text-gray-600 space-y-1">
//                     <li>• USPS (United States Postal Service)</li>
//                     <li>• FedEx Ground and Express</li>
//                     <li>• UPS Ground and 2nd Day Air</li>
//                     <li>• DHL Express (for select locations)</li>
//                   </ul>
//                 </div>

//                 <div className="border-b border-gray-200 pb-4">
//                   <h3 className="font-medium text-gray-900 mb-2">International Shipping</h3>
//                   <ul className="text-gray-600 space-y-1">
//                     <li>• FedEx International</li>
//                     <li>• UPS Worldwide</li>
//                     <li>• DHL Express International</li>
//                     <li>• USPS International (for select countries)</li>
//                   </ul>
//                 </div>

//                 <div className="pb-2">
//                   <h3 className="font-medium text-gray-900 mb-2">Carrier Selection</h3>
//                   <p className="text-gray-600">We automatically select the best carrier based on your location and shipping method</p>
//                   <p className="text-gray-600">You can specify a preferred carrier in your account settings</p>
//                   <p className="text-gray-600">Some carriers may not be available for all destinations</p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="mt-8 p-4 bg-[#FFF9E5] border border-[#FF4D00]/20 rounded-lg">
//           <h2 className="text-lg font-medium text-gray-900 mb-2">Need More Help?</h2>
//           <p className="text-gray-700 mb-3">
//             If you have any questions about shipping or delivery, please contact our customer service team:
//           </p>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div>
//               <p className="text-gray-700"><span className="font-medium">Email:</span> <span className="text-[#FF4D00]">infoaoinstore@gmail.com</span></p>
//               <p className="text-gray-700"><span className="font-medium">Phone:</span> <span className="text-[#FF4D00]">989 336 1162</span></p>
//               <p className="text-gray-700"><span className="font-medium">Hours:</span> Monday-Friday, 9 AM - 6 PM EST</p>
//             </div>
//             <div>
//               <p className="text-gray-700"><span className="font-medium">Live Chat:</span> Available on our website</p>
//               <p className="text-gray-700"><span className="font-medium">Response Time:</span> Within 2-4 hours during business hours</p>
//               <p className="text-gray-700"><span className="font-medium">Emergency:</span> For urgent shipping issues, call our hotline</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ShippingDelivery;


import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Truck,
  Clock,
  Globe,
  AlertCircle,
  Info
} from 'lucide-react';

const ShippingDelivery = () => {
  const [openSection, setOpenSection] = useState<string | null>('intro');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-16 xl:px-32 2xl:px-6 py-16">
        <h1 className="text-[36px] font-medium text-[#FF4D00] mb-6">
          Shipment & Delivery Policy
        </h1>

        {/* Intro Section */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('intro')}
          >
            <div className="flex items-center">
              <Info className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Who we are</h2>
            </div>
            {openSection === 'intro' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'intro' && (
            <div className="p-4 bg-white rounded-b-lg space-y-3 text-gray-600">
              <p>
                AOIN Store ships orders across India and internationally to multiple countries/regions, with realistic processing and transit timelines that vary by service level, destination, and operational conditions.
              </p>
              <p><span className="font-medium">Brand:</span> AOIN Store</p>
              <p><span className="font-medium">Customer Support Email:</span> infoaoinstore@gmail.com</p>
              <p><span className="font-medium">Phone/WhatsApp:</span> +91 989 336 1162 (during business hours)</p>
            </div>
          )}
        </div>

        {/* Order Processing */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('processing')}
          >
            <div className="flex items-center">
              <Clock className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Order processing time</h2>
            </div>
            {openSection === 'processing' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'processing' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p> <strong>Standard Processing:</strong> Orders are typically prepared for dispatch within 24–48 business hours once payment and verification are completed for in-stock items. Sundays and public holidays are excluded. Custom or made-to-order products may need additional time.</p>
              <p> <strong> Cut-off Handling:</strong> Orders placed after the daily cut-off or on non-working days will be processed on the next business day.</p>
            </div>
          )}
        </div>

        {/* Shipping Options & Tracking */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('shipping')}
          >
            <div className="flex items-center">
              <Truck className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Shipping options and tracking</h2>
            </div>
            {openSection === 'shipping' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'shipping' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p> <strong>Courier Allocation:</strong> Shipments are routed through the most suitable courier based on destination coverage, reliability and speed. Standard and Express options are offered wherever available.</p>
              <p><strong>Tracking:</strong> A tracking ID/link is issued once the parcel is handed to the courier. Progress updates (picked up, in transit, out for delivery, delivered) appear as the carrier scans your package.</p>
              <p><strong>Customer Portal:</strong> Tracking information can be viewed any time under the “My Account” section on the relevant order details page.</p>
              <p> <strong>Multi-Parcel Orders:</strong> Items from the same order may dispatch separately; each package will carry its own tracking number.</p>
            </div>
          )}
        </div>

        {/* Domestic Delivery */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('domestic')}
          >
            <div className="flex items-center">
              <Clock className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Domestic delivery timelines (India)</h2>
            </div>
            {openSection === 'domestic' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'domestic' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p><strong>Standard:</strong> Usually 3–7 business days from dispatch for most Tier-1/2 cities; remote or ODA pin codes can take longer.</p>
              <p><strong>Express (if offered at checkout):</strong> Typically 1–3 business days from dispatch on eligible lanes; availability varies by route and capacity.</p>
              <p><strong>Note:</strong> Weather events, local disruptions or high seasonal load may extend delivery times.</p>
            </div>
          )}
        </div>

        {/* International Delivery */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('international')}
          >
            <div className="flex items-center">
              <Globe className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">International delivery timelines</h2>
            </div>
            {openSection === 'international' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'international' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p><strong>Coverage:</strong> We ship internationally to multiple countries/regions subject to serviceability and regulatory compliance.</p>
              <p><strong>Express/Expedited:</strong> About 4–8 business days from dispatch to major hubs, depending on customs clearance.</p>
              <p><strong>Economy/Standard:</strong> About 7–14 business days from dispatch, lane-dependent; customs and local regulations may add time.</p>
              <p><strong>Note:</strong> Customs checks, destination holidays and documentation requirements can extend delivery windows. Timelines are indicative, not guaranteed.</p>
            </div>
          )}
        </div>

        {/* Shipping costs and duties */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('costs')}
          >
            <div className="flex items-center">
              <Truck className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Shipping costs and duties</h2>
            </div>
            {openSection === 'costs' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'costs' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p><strong>Within India: </strong> Shipping charges (if applicable) are shown at checkout based on weight, size and destination. Free-shipping offers apply per campaign terms.</p>
              <p><strong>International:</strong>  Unless stated otherwise, duties/taxes/import fees are payable by the receiver (Delivered Duty Unpaid). Non-payment may result in delays, return-to-sender or disposal per local rules.</p>
            </div>
          )}
        </div>

        {/* Address accuracy */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('address')}
          >
            <div className="flex items-center">
              <AlertCircle className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Address accuracy and delivery attempts</h2>
            </div>
            {openSection === 'address' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'address' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p><strong>Accurate Addressing:</strong> Provide complete address details with landmark and active phone number. Incomplete or incorrect addresses may delay delivery or cause return-to-origin (RTO).</p>
              <p><strong>Delivery Attempts:  </strong> Couriers generally make multiple attempts and may contact via call/SMS. Missed attempts can lead to hold at the local facility or RTO.</p>
            </div>
          )}
        </div>

        {/* Marketplace orders */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('marketplace')}
          >
            <div className="flex items-center">
              <Info className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Marketplace orders and seller handling</h2>
            </div>
            {openSection === 'marketplace' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'marketplace' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p><strong>Multiple Sellers:</strong> Some items may ship directly from different sellers or fulfillment centers, resulting in separate parcels and varied dispatch times.</p>
              <p><strong>Seller SLAs:</strong> Sellers are expected to dispatch within 24–48 business hours; exceptions may apply for custom, bulky or regulated items.</p>
            </div>
          )}
        </div>

        {/* Shipment delays */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('delays')}
          >
            <div className="flex items-center">
              <Clock className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Shipment delays and exceptions</h2>
            </div>
            {openSection === 'delays' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'delays' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p><strong>Possible Causes:</strong> Severe weather, strikes, inspections, peak load or route disruptions may impact timelines.</p>
              <p><strong>Updates:</strong> In significant delays, our support team will liaise with the carrier and keep you informed until resolved.</p>
            </div>
          )}
        </div>

        {/* Undeliverable parcels */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('undeliverable')}
          >
            <div className="flex items-center">
              <AlertCircle className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Undeliverable parcels and RTO</h2>
            </div>
            {openSection === 'undeliverable' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'undeliverable' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p>If a parcel cannot be delivered due to wrong address, unreachable contact, restricted access or refusal to accept, it may return to origin. Once received and quality-checked, we can arrange re-shipment (charges may apply) or process a refund per our Return/Refund Policy.</p>
            </div>
          )}
        </div>

        {/* Shipment loss */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('loss')}
          >
            <div className="flex items-center">
              <AlertCircle className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Shipment loss or damage</h2>
            </div>
            {openSection === 'loss' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'loss' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p><strong>Reporting: </strong>For damage or missing items, contact support within the claim window with photos/video (both unopened and opened package) and order/tracking details.</p>
              <p><strong>Resolution:</strong> After carrier/seller investigation, eligible orders may be reshipped or refunded depending on stock availability and claim outcome.</p>
            </div>
          )}
        </div>

        {/* Special categories */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('special')}
          >
            <div className="flex items-center">
              <Info className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Special categories and restrictions</h2>
            </div>
            {openSection === 'special' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'special' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p><strong>Oversize/Heavy Items:</strong> Large or heavy items may require special handling, affecting charges and delivery timelines.</p>
              <p><strong>Restricted Goods:</strong> Certain products may face additional checks or be non-serviceable to some pin codes/countries due to local laws.</p>
            </div>
          )}
        </div>

        {/* Cut-off times */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            onClick={() => toggleSection('cutoff')}
          >
            <div className="flex items-center">
              <Clock className="mr-3 text-[#FF4D00]" size={20} />
              <h2 className="text-xl font-medium text-gray-900">Cut-off times, weekends and holidays</h2>
            </div>
            {openSection === 'cutoff' ? (
              <ChevronUp className="text-[#FF4D00]" size={20} />
            ) : (
              <ChevronDown className="text-[#FF4D00]" size={20} />
            )}
          </button>
          {openSection === 'cutoff' && (
            <div className="p-4 bg-white rounded-b-lg text-gray-600 space-y-2">
              <p><strong>Business Days:</strong> All timelines are in business days excluding Sundays and public holidays.</p>
              <p><strong>After Cut-off:</strong> Orders placed after the daily cut-off are processed the next working day. Tracking starts after the first carrier scan.</p>
            </div>
          )}
        </div>

        {/* Customer Support */}
        <div className="mt-8 p-4 bg-[#FFF9E5] border border-[#FF4D00]/20 rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Customer support</h2>
          <p className="text-gray-700 mb-3">
            Tracking Help: Use the tracking link/ID to follow your shipment. For questions, contact support with your Order ID and registered email/phone.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-700">
                <span className="font-medium">Email:</span>{' '}
                <a
                  href="mailto:infoaoinstore@gmail.com"
                  className="text-[#FF4D00] hover:underline"
                >
                  infoaoinstore@gmail.com
                </a>
              </p>

              <p className="text-gray-700">
                <span className="font-medium">Phone/WhatsApp:</span>{' '}
                <a
                  href="https://wa.me/919893361162"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF4D00] hover:underline"
                >
                  +91 989 336 1162
                </a>
              </p>

              <p className="text-gray-700">
                <span className="font-medium">Hours:</span> Business hours
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingDelivery;
