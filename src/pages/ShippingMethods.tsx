import React from 'react';
import { Truck, Clock, Globe, Shield, CreditCard, Package, MapPin } from 'lucide-react';

const ShippingMethods: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 md:px-16 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-[36px] font-medium text-primary-600 text-center mb-4">Shipping Methods</h1>
          <p className="text-gray-600 text-center mb-12">
            We partner with ShipRocket to provide reliable and efficient shipping services across India
          </p>

          {/* Shipping Options */}
          <div className="grid gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-6">
                <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center">
                  <Truck className="mr-3 text-primary-600" />
                  Available Shipping Methods
                </h2>

                <div className="space-y-6">
                  {/* Standard Delivery */}
                  <div className="border-b border-gray-100 pb-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium text-gray-900">Standard Delivery</h3>
                      <span className="bg-accent-50 text-primary-600 px-3 py-1 rounded-full text-sm">
                        ₹49 - ₹99
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">4-5 business days</p>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Available for most locations across India</li>
                      <li>• Free shipping on orders above ₹499</li>
                      <li>• Real-time tracking available</li>
                    </ul>
                  </div>

                  {/* Express Delivery */}
                  <div className="border-b border-gray-100 pb-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium text-gray-900">Express Delivery</h3>
                      <span className="bg-accent-50 text-primary-600 px-3 py-1 rounded-full text-sm">
                        ₹99 - ₹199
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">2-3 business days</p>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Available for major cities</li>
                      <li>• Priority handling and dispatch</li>
                      <li>• Enhanced tracking features</li>
                    </ul>
                  </div>

                  {/* Next Day Delivery */}
                  <div className="pb-2">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium text-gray-900">Next Day Delivery</h3>
                      <span className="bg-accent-50 text-primary-600 px-3 py-1 rounded-full text-sm">
                        ₹199 - ₹299
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">Next business day</p>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Available for select metro cities</li>
                      <li>• Order before 2 PM for next-day delivery</li>
                      <li>• Premium tracking and support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-6">
                <h2 className="text-xl font-medium text-gray-900 mb-6">Shipping Features</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <Globe className="text-primary-600 mt-1 mr-3" size={20} />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Pan India Coverage</h3>
                      <p className="text-sm text-gray-600">Delivery services available across 29,000+ pin codes in India</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="text-primary-600 mt-1 mr-3" size={20} />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Real-time Tracking</h3>
                      <p className="text-sm text-gray-600">Track your shipment status with live updates</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Shield className="text-primary-600 mt-1 mr-3" size={20} />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Safe & Secure</h3>
                      <p className="text-sm text-gray-600">Insured shipping with proper packaging guidelines</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CreditCard className="text-primary-600 mt-1 mr-3" size={20} />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">COD Available</h3>
                      <p className="text-sm text-gray-600">Cash on delivery option for eligible orders</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-accent-50 rounded-lg p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Important Information</h2>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start">
                  <Package className="text-primary-600 mt-1 mr-3" size={20} />
                  <p>Delivery times may vary during peak seasons, sales, and holidays. We'll notify you of any delays.</p>
                </div>
                <div className="flex items-start">
                  <MapPin className="text-primary-600 mt-1 mr-3" size={20} />
                  <p>Some remote locations might have longer delivery times and different shipping charges.</p>
                </div>
                <div className="flex items-start">
                  <Clock className="text-primary-600 mt-1 mr-3" size={20} />
                  <p>Order processing takes 24-48 hours before dispatch. This is additional to the delivery time.</p>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Need Help?</h2>
              <p className="text-gray-600 mb-4">
                Our support team is available to assist you with any shipping-related queries
              </p>
              <div className="space-x-4">
                <a 
                  href="mailto:infoaoinstore@gmail.com" 
                  className="inline-flex items-center text-primary-600 hover:text-primary-600/90"
                >
                  <span className="underline">Email Support</span>
                </a>
                <span className="text-gray-300">|</span>
                <a 
                  href="tel:1800-123-4567" 
                  className="inline-flex items-center text-primary-600 hover:text-primary-600/90"
                >
                  <span className="underline">1800-123-4567</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingMethods; 