import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Twitter, Facebook, Linkedin, Instagram } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterMessage(null);
    if (!newsletterEmail) {
      setNewsletterMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }
    setNewsletterLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setNewsletterMessage({ type: 'success', text: 'You have been subscribed to our newsletter.' });
        setNewsletterEmail('');
      } else {
        setNewsletterMessage({ type: 'error', text: data.message || 'Could not subscribe.' });
      }
    } catch (err) {
      setNewsletterMessage({ type: 'error', text: 'Could not connect to the server.' });
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <footer className="bg-[#FFE7DB] text-black w-full ">
      <div className="container mx-auto px-6 xs:px-2 sm:px-2 md:px-2 lg:px-12 xl:px-16 2xl:pl-16 py-8 sm:py-12  lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 xl:gap-8">

          {/* Column 1 - Logo & Contact */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6 lg:mb-8">
              <img src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687784/public_assets_images/public_assets_images_logo.svg" alt="Aoin" className="h-8 sm:h-10" />
            </Link>

            <div className="space-y-3 lg:space-y-4 text-[13px] sm:text-[14px] font-light text-[#161616]">
              <div className="flex items-start space-x-3">
                <MapPin size={16} className="text-black mt-1  flex-shrink-0" />
                <span className="leading-tight font-worksans font-normal">
                Aoin Enterprise.
                <br />
                102 B FIRST FLOOR, PROPERTY NO 07 PU-4 SHEME NO 54 VIJAY NAGAR
                <br />
                Indore – 452010
                <br />
                Madhya Pradesh, India
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-[#161616] flex-shrink-0" />
                <a href="tel: 9893361162" className="text-[#F2631F] ">+91 9893361162</a>
              </div>
                              <div className="flex items-center space-x-3">
                  <Mail size={16} className="text-[#161616] flex-shrink-0" />
                  <a href="mailto:infoaoinstore@gmail.com" className="text-[#F2631F] hover:underline transition-colors">infoaoinstore@gmail.com</a>
                </div>
            </div>
          </div>

          {/* Column 2 - Shop */}
          <div className="lg:col-span-1">
            <h4 className="text-[16px] sm:text-[18px] font-medium text-[#161616] mb-3 lg:mb-4">{t('footer.shop')}</h4>
            <ul className="space-y-2 lg:space-y-3 text-[13px] sm:text-[14px] text-[#161616] font-normal">
              <li><Link to="/new-product" className="hover:text-[#F2631F] font-worksans transition-colors">{t('footer.newProduct')}</Link></li>
              <li><Link to="/live-shop" className="hover:text-[#F2631F] font-worksans transition-colors">{t('footer.liveShop')}</Link></li>
              <li><Link to="/promo-products" className="hover:text-[#F2631F] font-worksans transition-colors">{t('footer.promotion')}</Link></li>
            </ul>
          </div>

          {/* Column 3 - Policies */}
          <div className="lg:col-span-1 lg:-ml-8 xl:-ml-20">
            <h4 className="text-[16px] sm:text-[18px] font-medium font-worksans text-[#161616] mb-3 lg:mb-4">{t('footer.policies')}</h4>
            <ul className="space-y-2 lg:space-y-3 font-worksans text-[13px] sm:text-[14px] text-[#161616] font-norma">
              <li>
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#F2631F] transition-colors"
                >
          {t('footer.privacyPolicy')}
                </a>
              </li>
        <li><Link to="/cancellation-policy" className="hover:text-[#F2631F] transition-colors">{t('footer.cancellationPolicy')}</Link></li>
        <li><Link to="/payment-policy" className="hover:text-[#F2631F] transition-colors">Payment Policy</Link></li>
        <li><Link to="/replacement-policy" className="hover:text-[#F2631F] transition-colors">Replacement Policy</Link></li>
        <li><Link to="/return-refund" className="hover:text-[#F2631F] transition-colors">{t('footer.returnRefund')}</Link></li>
        <li><Link to="/shipping-delivery" className="hover:text-[#F2631F] transition-colors">{t('footer.shippingDelivery')}</Link></li>
        <li><Link to="/merchant-nda" className="hover:text-[#F2631F] transition-colors">Merchant NDA</Link></li>
            </ul>
          </div>

          {/* Column 4 - Customer Support */}
          <div className="lg:col-span-1 lg:-ml-8 xl:-ml-28">
            <h4 className="text-[16px] sm:text-[18px] font-medium font-worksans text-[#161616] mb-3 lg:mb-4">{t('footer.customerSupport')}</h4>
            
            <ul className="space-y-2 lg:space-y-3 text-[13px] font-worksans font-normal sm:text-[14px] text-[#161616]">
            {/* <li><Link to="/RaiseTicket" className="hover:text-[#F2631F] transition-colors">User Support</Link></li> */}
              <li>
                <div>{t('footer.callUs')}</div>
                <a href="tel: 9893361162" className="text-[#F2631F]  transition-colors"> +91 9893361162
                </a>
              </li>
              <li><Link to="/faq" className="hover:text-[#F2631F] transition-colors">{t('footer.faq')}</Link></li>
              <li><Link to="/contact" className="hover:text-[#F2631F] transition-colors">{t('footer.contactUs')}</Link></li>
              <li><Link to="terms" className="hover:text-[#F2631F] transition-colors">{t('footer.termsConditions')}</Link></li>
              <li><Link to="/shipping" className="hover:text-[#F2631F] transition-colors">{t('footer.shippingMethods')}</Link></li>
                              <li className="mt-2">
                  <div>{t('footer.mailUs')}</div>
                  <a href="mailto:infoaoinstore@gmail.com" className="text-[#F2631F] hover:underline transition-colors">infoaoinstore@gmail.com</a>
                </li>
            </ul>
          </div>

          {/* Column 5 - Follow Us & Newsletter */}
          <div className="lg:col-span-1 lg:-ml-8 xl:-ml-32">
            <h4 className="text-[16px] sm:text-[18px] font-medium font-worksans text-[#161616] mb-3 lg:mb-4">{t('footer.followUs')}</h4>
            <div className="flex space-x-4 lg:space-x-5 mb-4 lg:mb-6">
              <a href="https://x.com/AOIN111111" target="_blank" rel="noopener noreferrer" className="text-[#F2631F] transition-colors"><Twitter size={18} className="sm:w-5 sm:h-5" /></a>
              <a href="https://www.facebook.com/profile.php?id=61578809217780" target="_blank" rel="noopener noreferrer" className="text-[#F2631F] transition-colors"><Facebook size={18} className="sm:w-5 sm:h-5" /></a>
              <a href="https://www.instagram.com/aoinstore/" target="_blank" rel="noopener noreferrer" className="text-[#F2631F] transition-colors"><Instagram size={18} className="sm:w-5 sm:h-5" /></a>
              <a href="https://www.linkedin.com/company/aoinstore" target="_blank" rel="noopener noreferrer" className="text-[#F2631F] transition-colors"><Linkedin size={18} className="sm:w-5 sm:h-5" /></a>
            </div>
            {/* Email Subscription */}
            <form className="flex items-center bg-white rounded-xl overflow-visible shadow-sm max-w-full  lg:max-w-[330px]" onSubmit={handleNewsletterSubmit}>
              <div className="flex items-center px-2 font-worksans text-black">
                <Mail size={14} className="sm:w-4 sm:h-4" />
              </div>
              <div className='w-[900px] xs:w-full'> 
                <input
                  type="email"
                  placeholder={t('footer.enterEmail')}
                  className="flex-1 text-xs sm:text-sm text-gray-700 placeholder-black font-worksans bg-white border-none outline-none py-2 px-2 text-left"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  disabled={newsletterLoading}
                />
              </div>
              <button
                type="submit"
                className="bg-[#F2631F] hover:bg-[#d44f12] font-worksans overflow-visible text-white px-4 py-2 sm:-ml-10 -ml-16 xl:-ml-6 lg:-ml-6 text-xs  font-medium transition-colors"
                disabled={newsletterLoading}
              >
                {newsletterLoading ? t('footer.submitting') : t('footer.submit')}
              </button>
            </form>
            {newsletterMessage && (
              <div className={`mt-2 text-xs sm:text-sm font-worksans ${newsletterMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{newsletterMessage.text}</div>
            )}
            <p className="mt-3 lg:mt-4 text-[14px] sm:text-[16px] lg:text-[18px] text-[#161616] font-normal font-worksans leading-snug">
              {t('footer.newsletterDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom White Bar */}
      <div className="bg-white py-3 lg:py-4  xl:pl-28 sm:pl-16">
        <div className="container mx-auto ">
          <p className="text-center sm:text-left text-[11px] sm:text-[13px] text-gray-400">

            © {new Date().getFullYear()}, {t('footer.allRightsReserved')}

         
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
