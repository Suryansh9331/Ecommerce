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

  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.aoinapp';
  const APP_STORE_URL = 'https://apps.apple.com/app/aoin/id674500938762';

  return (
    <footer className="bg-[#FFE7DB] text-black w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-14 py-8 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 xl:gap-8">

          {/* Column 1 - Logo & Contact (phone and email once) */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4 lg:mb-6">
              <img src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687784/public_assets_images/public_assets_images_logo.svg" alt="Aoin" className="h-8 sm:h-10" />
            </Link>
            <div className="space-y-3 text-[13px] sm:text-[14px] font-light text-[#161616]">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-black mt-0.5 flex-shrink-0" />
                <span className="leading-tight font-worksans font-normal">
                  Aoin Enterprise.
                  <br />
                  102 B FIRST FLOOR, PROPERTY NO 07 PU-4 SCHEME NO 54 VIJAY NAGAR
                  <br />
                  Indore – 452010, Madhya Pradesh, India
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-[#161616] flex-shrink-0" />
                <a href="tel:9893361162" className="text-[#F2631F] hover:underline">+91 9893361162</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-[#161616] flex-shrink-0" />
                <a href="mailto:infoaoinstore@gmail.com" className="text-[#F2631F] hover:underline transition-colors">infoaoinstore@gmail.com</a>
              </div>
            </div>
          </div>

          {/* Column 2 - Shop */}
          <div className="lg:col-span-1">
            <h4 className="text-[15px] sm:text-[17px] font-semibold text-[#161616] mb-3 lg:mb-4 font-worksans">{t('footer.shop')}</h4>
            <ul className="space-y-2 text-[13px] sm:text-[14px] text-[#161616] font-normal font-worksans">
              <li><Link to="/new-product" className="hover:text-[#F2631F] transition-colors">{t('footer.newProduct')}</Link></li>
              <li><Link to="/live-shop" className="hover:text-[#F2631F] transition-colors">{t('footer.liveShop')}</Link></li>
              <li><Link to="/promo-products" className="hover:text-[#F2631F] transition-colors">{t('footer.promotion')}</Link></li>
            </ul>
          </div>

          {/* Column 3 - Policies */}
          <div className="lg:col-span-1">
            <h4 className="text-[15px] sm:text-[17px] font-semibold font-worksans text-[#161616] mb-3 lg:mb-4">{t('footer.policies')}</h4>
            <ul className="space-y-2 font-worksans text-[13px] sm:text-[14px] text-[#161616] font-normal">
              <li><a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-[#F2631F] transition-colors">{t('footer.privacyPolicy')}</a></li>
              <li><Link to="/cancellation-policy" className="hover:text-[#F2631F] transition-colors">{t('footer.cancellationPolicy')}</Link></li>
              <li><Link to="/payment-policy" className="hover:text-[#F2631F] transition-colors">Payment Policy</Link></li>
              <li><Link to="/replacement-policy" className="hover:text-[#F2631F] transition-colors">Replacement Policy</Link></li>
              <li><Link to="/return-refund" className="hover:text-[#F2631F] transition-colors">{t('footer.returnRefund')}</Link></li>
              <li><Link to="/shipping-delivery" className="hover:text-[#F2631F] transition-colors">{t('footer.shippingDelivery')}</Link></li>
              <li><Link to="/merchant-nda" className="hover:text-[#F2631F] transition-colors">Merchant NDA</Link></li>
            </ul>
          </div>

          {/* Column 4 - Customer Support (no duplicate phone/email) */}
          <div className="lg:col-span-1">
            <h4 className="text-[15px] sm:text-[17px] font-semibold font-worksans text-[#161616] mb-3 lg:mb-4">{t('footer.customerSupport')}</h4>
            <ul className="space-y-2 font-worksans text-[13px] sm:text-[14px] text-[#161616] font-normal">
              <li><Link to="/faq" className="hover:text-[#F2631F] transition-colors">{t('footer.faq')}</Link></li>
              <li><Link to="/contact" className="hover:text-[#F2631F] transition-colors">{t('footer.contactUs')}</Link></li>
              <li><Link to="/terms" className="hover:text-[#F2631F] transition-colors">{t('footer.termsConditions')}</Link></li>
              <li><Link to="/shipping" className="hover:text-[#F2631F] transition-colors">{t('footer.shippingMethods')}</Link></li>
            </ul>
          </div>

          {/* Column 5 - Follow Us, Newsletter & Download App */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h4 className="text-[15px] sm:text-[17px] font-semibold font-worksans text-[#161616] mb-3 lg:mb-4">{t('footer.followUs')}</h4>
              <div className="flex gap-4 mb-4">
                <a href="https://x.com/AOIN111111" target="_blank" rel="noopener noreferrer" className="text-[#F2631F] transition-colors"><Twitter size={18} className="sm:w-5 sm:h-5" /></a>
                <a href="https://www.facebook.com/profile.php?id=61578809217780" target="_blank" rel="noopener noreferrer" className="text-[#F2631F] transition-colors"><Facebook size={18} className="sm:w-5 sm:h-5" /></a>
                <a href="https://www.instagram.com/aoinstore/" target="_blank" rel="noopener noreferrer" className="text-[#F2631F] transition-colors"><Instagram size={18} className="sm:w-5 sm:h-5" /></a>
                <a href="https://www.linkedin.com/company/aoinstore" target="_blank" rel="noopener noreferrer" className="text-[#F2631F] transition-colors"><Linkedin size={18} className="sm:w-5 sm:h-5" /></a>
              </div>
            </div>
            <form className="flex flex-wrap items-stretch bg-white rounded-xl shadow-sm max-w-full overflow-hidden" onSubmit={handleNewsletterSubmit}>
              <div className="flex items-center pl-3 text-black">
                <Mail size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              </div>
              <input
                type="email"
                placeholder={t('footer.enterEmail')}
                className="flex-1 min-w-0 text-xs sm:text-sm text-gray-700 placeholder-gray-500 font-worksans bg-white border-none outline-none py-2.5 px-2"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                disabled={newsletterLoading}
              />
              <button
                type="submit"
                className="bg-[#F2631F] hover:bg-[#d44f12] font-worksans text-white px-4 py-2.5 text-xs font-medium transition-colors shrink-0"
                disabled={newsletterLoading}
              >
                {newsletterLoading ? t('footer.submitting') : t('footer.submit')}
              </button>
            </form>
            {newsletterMessage && (
              <div className={`mt-2 text-xs sm:text-sm font-worksans ${newsletterMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{newsletterMessage.text}</div>
            )}
            <p className="text-[13px] sm:text-[14px] text-[#161616] font-normal font-worksans leading-snug">
              {t('footer.newsletterDescription')}
            </p>

            {/* Download App: QR code + Store badges */}
            <div>
              <h4 className="text-[15px] sm:text-[17px] font-semibold font-worksans text-[#161616] mb-3">Download App</h4>
              <div className="flex flex-wrap items-center gap-4">
                <img
                  src="https://res.cloudinary.com/ddnb10zkq/image/upload/v1773763690/qrcode-url_uooxvg.png"
                  alt="QR code for Aoin app"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-white p-1 shadow-sm flex-shrink-0"
                />
                <div className="flex flex-col gap-2">
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-[#F2631F] rounded-lg px-3 py-2 hover:bg-[#e55a1a] transition-colors border-0"
                  >
                    <img
                      src="https://res.cloudinary.com/ddnb10zkq/image/upload/v1773762535/498c9aeb-855c-4c36-ba40-e49f461b0754.png"
                      alt="Get it on Google Play"
                      className="h-7 sm:h-8 w-auto object-contain"
                    />
                  </a>
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-[#F2631F] rounded-lg px-3 py-2 hover:bg-[#e55a1a] transition-colors border-0"
                  >
                    <img
                      src="https://res.cloudinary.com/ddnb10zkq/image/upload/v1773762539/d4c6468e-6692-4099-b6a1-29ebb8940c85.png"
                      alt="Download on the App Store"
                      className="h-7 sm:h-8 w-auto object-contain"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-white py-3 lg:py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-14">
          <p className="text-center sm:text-left text-[11px] sm:text-[13px] text-gray-500 font-worksans">
            © {new Date().getFullYear()}, {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
