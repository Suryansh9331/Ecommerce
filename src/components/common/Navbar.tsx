import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, LogOut, User, ChevronDown, Menu, X, Gift, Search, Package, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import CategoryDropdown from '../home/CategoryDropdown';
import SearchResults from './SearchResults';
import useClickOutside from '../../hooks/useClickOutside';
import LogoutConfirmationPopup from '../LogoutConfirmationPopup';
import toast from 'react-hot-toast';
import '@fontsource/work-sans';
import { useTranslation } from 'react-i18next';


// Custom breakpoint for 968px
// const customBreakpoint = '@media (max-width: 968px)'; // Removed as unused

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  
  // Language options with flags
  const languageOptions = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
  ];
  
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [drawerSlideIn, setDrawerSlideIn] = useState(false);
  const [isMobileCategoryDropdownOpen, setIsMobileCategoryDropdownOpen] = useState(false);
  const drawerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { totalItems } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const [searchType, setSearchType] = useState<'all' | 'products' | 'categories'>('all');
  const location = useLocation();
  const [isLogoutPopupOpen, setIsLogoutPopupOpen] = useState(false);
  const [showPromoBar, setShowPromoBar] = useState(true);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isProductsNavOpen, setIsProductsNavOpen] = useState(false);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const productsNavRef = useRef<HTMLDivElement>(null);

  const desktopCategoryButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCategoryButtonRef = useRef<HTMLButtonElement>(null);
  const productsNavButtonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(desktopSearchRef, () => {
    setShowSearchResults(false);
  });

  useClickOutside(mobileSearchRef, () => {
    setShowSearchResults(false);
  });

  useClickOutside(categoryDropdownRef, (event: MouseEvent | TouchEvent) => {
    if (desktopCategoryButtonRef.current && !desktopCategoryButtonRef.current.contains(event.target as Node)) {
      setIsCategoryDropdownOpen(false);
    }
  });

  useClickOutside(mobileDrawerRef, (event: MouseEvent | TouchEvent) => {
    const target = event.target as Node;
    if (mobileDrawerOpen && mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(target) && (!mobileDrawerRef.current || !mobileDrawerRef.current.contains(target))) {
      setMobileDrawerOpen(false);
    }
  });

  useClickOutside(languageDropdownRef, () => {
    setIsLanguageDropdownOpen(false);
  });

  useClickOutside(productsNavRef, (e: MouseEvent | TouchEvent) => {
    if (productsNavButtonRef.current && !productsNavButtonRef.current.contains(e.target as Node)) {
      setIsProductsNavOpen(false);
    }
  });

  useEffect(() => {
    setIsCategoryDropdownOpen(false);
    setMobileDrawerOpen(false);
    setIsProductsNavOpen(false);
    setIsMobileCategoryDropdownOpen(false);
    setShowSearchResults(false);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (drawerTimeoutRef.current) clearTimeout(drawerTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (mobileDrawerOpen && typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
      setDrawerSlideIn(false);
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => setDrawerSlideIn(true));
      });
      return () => {
        cancelAnimationFrame(rafId);
        document.body.style.overflow = '';
      };
    } else {
      setDrawerSlideIn(false);
    }
  }, [mobileDrawerOpen]);

  // Toggle document direction for Arabic
  useEffect(() => {
    // const isRtl = i18n.language === 'zzz' || i18n.language?.startsWith('zz');
    if (typeof document !== 'undefined') {
      // document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.dir = 'ltr';
      
    }
  }, [i18n.language]);

  const toggleCategoryDropdown = () => {
    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
  };

  const toggleMobileDrawer = () => {
    setMobileDrawerOpen((prev) => !prev);
    if (mobileDrawerOpen) {
      setIsCategoryDropdownOpen(false);
      setIsMobileCategoryDropdownOpen(false);
      setShowSearchResults(false);
    }
  };

  const closeMobileDrawer = () => {
    if (drawerTimeoutRef.current) clearTimeout(drawerTimeoutRef.current);
    setIsDrawerClosing(true);
    drawerTimeoutRef.current = setTimeout(() => {
      setMobileDrawerOpen(false);
      setIsDrawerClosing(false);
      setIsMobileCategoryDropdownOpen(false);
      drawerTimeoutRef.current = null;
    }, 300);
  };

  const toggleMobileCategoryDropdown = () => {
    setIsMobileCategoryDropdownOpen(!isMobileCategoryDropdownOpen);
  };

  const handleLogoutClick = () => {
    setIsLogoutPopupOpen(true);
    setMobileDrawerOpen(false);
  };

  const handleLogoutConfirm = () => {
    logout();
    setIsLogoutPopupOpen(false);
    setMobileDrawerOpen(false);
    toast.success('Logged out successfully');
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchParams = new URLSearchParams({
        q: searchQuery.trim(),
        type: searchType
      });
      window.location.href = `/search?${searchParams.toString()}`;
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  // Desktop: single unified search bar — [ input (most width) | Category ▼ | 🔍 ] in one container
  const desktopSearchBar = (
    <div ref={desktopSearchRef} className="relative flex-1 max-w-2xl min-w-0 mx-6">
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="flex items-center h-10 w-full rounded-lg bg-gray-50/80  shadow-sm focus-within:bg-white transition-all duration-200">
          <input
            type="text"
            placeholder={t('nav.searchPlaceholder')}
            className="flex-1 min-w-0 h-full pl-4 pr-2 text-gray-900 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-gray-500"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
          />
          <div className="flex items-center h-full pl-2 pr-3 border-l border-gray-200/60">
            <select
              className="h-full min-w-[90px] bg-transparent text-gray-600 text-sm font-medium focus:ring-0 focus:outline-none border-0 cursor-pointer"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'all' | 'products' | 'categories')}
            >
              <option value="all">All</option>
              <option value="products">Products</option>
              <option value="categories">Categories</option>
            </select>
          </div>
          <button
            type="submit"
            className="flex-shrink-0 h-full w-10 min-w-[2.5rem] flex items-center justify-center bg-[#F2631F] text-white hover:bg-[#e55a1a] transition-colors"
            aria-label="Search"
          >
            <Search size={20} className="shrink-0 text-white" strokeWidth={2} />
          </button>
        </div>
      </form>
      <SearchResults
        isVisible={showSearchResults}
        setIsVisible={setShowSearchResults}
        searchQuery={searchQuery}
        searchType={searchType}
        onItemClick={() => {
          setShowSearchResults(false);
          setSearchQuery('');
        }}
      />
    </div>
  );

  // Add this CSS animation style at the top of the component
  const aoinLiveButtonStyle = {
    animation: 'colorChange 1.5s infinite',
    transition: 'background-color 0.5s ease-in-out',
  };

  return (
    <header className="w-full fixed top-0 left-0 right-0 z-50 mx-auto font-['Work_Sans']">
      <style>
        {`
          @keyframes colorChange {
            0% { background-color: #F2631F; }
            25% { background-color: #63BC86; }
            50% { background-color: #DB4173; }
            75% { background-color: #8B4CCE; }
            100% { background-color: #F2631F; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
        `}
      </style>

      {/* ========== MOBILE: Minimal header (56px) — hamburger | logo | cart ========== */}
      <div className="nav:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-100 shrink-0">
        <button
          type="button"
          onClick={toggleMobileDrawer}
          aria-label="Open menu"
          ref={mobileMenuButtonRef}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-gray-800 rounded-lg active:bg-gray-100"
        >
          {mobileDrawerOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/" className="flex-shrink-0">
          <img
            src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687784/public_assets_images/public_assets_images_logo.svg"
            alt="Aoin"
            width={100}
            height={32}
            className="h-8 w-auto max-w-[100px] object-contain"
          />
        </Link>
        <Link
          to="/cart"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center relative -mr-2 text-gray-800 rounded-lg active:bg-gray-100"
          aria-label="Cart"
        >
          <ShoppingCart size={22} />
          {totalItems > 0 && (
            <span className="absolute top-1.5 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-[#F2631F] text-white text-xs font-medium rounded-full px-1">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </Link>
      </div>

      {/* ========== MOBILE: Single search bar — input (left rounded) + icon button (right rounded) ========== */}
      <div className="nav:hidden px-4 py-3 bg-white border-b border-gray-100">
        <div ref={mobileSearchRef} className="relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-stretch h-11 border border-gray-200 bg-white shadow-sm rounded-2xl overflow-hidden">
              <input
                type="search"
                placeholder={t('nav.searchPlaceholder')}
                className="flex-1 min-w-0 h-full pl-4 pr-3 rounded-l-2xl text-gray-900 text-sm border-0 focus:ring-0 focus:outline-none placeholder:text-gray-500 bg-transparent"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                aria-label="Search"
              />
              <button
                type="submit"
                className="flex-shrink-0 h-full min-w-[44px] flex items-center justify-center rounded-r-2xl bg-[#F2631F] text-white hover:bg-[#e55a1a] active:bg-[#d95218] transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>
          <SearchResults
            isVisible={showSearchResults}
            setIsVisible={setShowSearchResults}
            searchQuery={searchQuery}
            searchType={searchType}
            onItemClick={() => {
              setShowSearchResults(false);
              setSearchQuery('');
            }}
          />
        </div>
      </div>

      {/* ========== MOBILE: Side drawer (with open/close animation) ========== */}
      {(mobileDrawerOpen || isDrawerClosing) && (
        <>
          <div
            className={`nav:hidden fixed inset-0 z-[60] transition-opacity duration-300 ease-out ${
              isDrawerClosing ? 'bg-black/0' : 'bg-black/30'
            }`}
            onClick={closeMobileDrawer}
            onKeyDown={(e) => e.key === 'Escape' && closeMobileDrawer()}
            aria-hidden
            role="presentation"
          />
          <div
            ref={mobileDrawerRef}
            className={`nav:hidden fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-white shadow-xl z-[61] flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
              isDrawerClosing ? '-translate-x-full' : drawerSlideIn ? 'translate-x-0' : '-translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100 shrink-0">
              <span className="font-semibold text-gray-900 text-base">Menu</span>
              <button
                type="button"
                onClick={closeMobileDrawer}
                aria-label="Close menu"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-4">
              {/* Account */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Account</p>
              <ul className="space-y-0.5 mb-6">
                {!isAuthenticated ? (
                  <li>
                    <Link to="/sign-in" onClick={closeMobileDrawer} className="flex items-center min-h-[44px] px-3 rounded-lg text-gray-800 hover:bg-gray-50 text-[15px] font-medium">
                      <User className="w-5 h-5 mr-3 text-gray-500" />
                      {t('nav.signInRegister')}
                    </Link>
                  </li>
                ) : (
                  <li>
                    <button type="button" onClick={handleLogoutClick} className="flex items-center w-full min-h-[44px] px-3 rounded-lg text-red-600 hover:bg-red-50 text-[15px] font-medium">
                      <LogOut className="w-5 h-5 mr-3" />
                      Log out
                    </button>
                  </li>
                )}
                <li>
                  <Link to="/wishlist" onClick={closeMobileDrawer} className="flex items-center min-h-[44px] px-3 rounded-lg text-gray-800 hover:bg-gray-50 text-[15px]">
                    <Heart className="w-5 h-5 mr-3 text-gray-500" />
                    {t('nav.wishlist')}
                  </Link>
                </li>
                <li>
                  <Link to="/cart" onClick={closeMobileDrawer} className="flex items-center min-h-[44px] px-3 rounded-lg text-gray-800 hover:bg-gray-50 text-[15px]">
                    <ShoppingCart className="w-5 h-5 mr-3 text-gray-500" />
                    {t('nav.cart')}
                    {totalItems > 0 && (
                      <span className="ml-2 bg-[#F2631F] text-white text-xs font-medium rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">{totalItems}</span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link to="/profile" onClick={closeMobileDrawer} className="flex items-center min-h-[44px] px-3 rounded-lg text-gray-800 hover:bg-gray-50 text-[15px]">
                    <User className="w-5 h-5 mr-3 text-gray-500" />
                    {t('nav.account')}
                  </Link>
                </li>
              </ul>

              {/* Shopping */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Shopping</p>
              <ul className="space-y-0.5 mb-6">
                <li>
                  <Link to="/track-order" onClick={closeMobileDrawer} className="flex items-center min-h-[44px] px-3 rounded-lg text-gray-800 hover:bg-gray-50 text-[15px]">
                    <img src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687786/public_assets_images/public_assets_images_track-order.svg" alt="" className="w-5 h-5 mr-3 opacity-70" />
                    {t('nav.trackOrder')}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsMobileCategoryDropdownOpen(!isMobileCategoryDropdownOpen)}
                    ref={mobileCategoryButtonRef}
                    className="flex items-center justify-between w-full min-h-[44px] px-3 rounded-lg text-gray-800 hover:bg-gray-50 text-[15px] text-left"
                  >
                    <span className="flex items-center">
                      <Package className="w-5 h-5 mr-3 text-gray-500" />
                      {t('nav.category')}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isMobileCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isMobileCategoryDropdownOpen && (
                    <div className="pl-8 pr-2 pb-2">
                      <CategoryDropdown isOpen={isMobileCategoryDropdownOpen} closeDropdown={() => setIsMobileCategoryDropdownOpen(false)} isMobile />
                    </div>
                  )}
                </li>
                <li>
                  <Link to="/all-products" onClick={closeMobileDrawer} className="flex items-center min-h-[44px] px-3 rounded-lg text-gray-800 hover:bg-gray-50 text-[15px]">
                    <Tag className="w-5 h-5 mr-3 text-gray-500" />
                    {t('nav.allProducts')}
                  </Link>
                </li>
                <li>
                  <Link to="/new-product" onClick={closeMobileDrawer} className="flex items-center min-h-[44px] px-3 rounded-lg text-gray-800 hover:bg-gray-50 text-[15px]">
                    <Tag className="w-5 h-5 mr-3 text-gray-500" />
                    {t('nav.newProduct')}
                  </Link>
                </li>
                <li>
                  <Link to="/promo-products" onClick={closeMobileDrawer} className="flex items-center min-h-[44px] px-3 rounded-lg text-gray-800 hover:bg-gray-50 text-[15px]">
                    <Tag className="w-5 h-5 mr-3 text-gray-500" />
                    {t('nav.promotion')}
                    <span className="ml-2 bg-[#F2631F] text-white text-xs font-medium rounded-full px-2 py-0.5">HOT</span>
                  </Link>
                </li>
              </ul>

              {/* Other */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Other</p>
              <ul className="space-y-0.5">
                <li>
                  <Link to="/business/login" onClick={closeMobileDrawer} className="flex items-center min-h-[44px] px-3 rounded-lg text-gray-800 hover:bg-gray-50 text-[15px] font-medium">
                    {t('nav.becomeMerchant')}
                  </Link>
                </li>
                <li>
                  <div className="flex items-center justify-between min-h-[44px] px-3" ref={languageDropdownRef}>
                    <span className="text-[15px] text-gray-700">Language</span>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                        className="flex items-center gap-1.5 min-h-[36px] px-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-800"
                        aria-expanded={isLanguageDropdownOpen}
                        aria-haspopup="listbox"
                      >
                        {languageOptions.find((l) => (i18n.language?.split('-')[0] || 'en') === l.code)?.code.toUpperCase() || 'EN'}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isLanguageDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                          {languageOptions.map((option) => (
                            <button
                              key={option.code}
                              type="button"
                              onClick={() => {
                                i18n.changeLanguage(option.code);
                                setIsLanguageDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-gray-50 ${(i18n.language?.split('-')[0] || 'en') === option.code ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700'}`}
                            >
                              <span>{option.flag}</span>
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
                <li>
                  <Link to="/live-shop" onClick={closeMobileDrawer} className="flex items-center min-h-[44px] px-3 rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-[15px] font-medium mt-2">
                    {t('nav.aoinLive')}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}

      {/* ========== DESKTOP: Single header row (72px) — Logo | Search | Icons + CTA ========== */}
      <div className="hidden nav:flex nav:items-center nav:h-[72px] nav:px-6 nav:bg-white nav:border-b nav:border-gray-100 nav:shadow-sm">
        <div className="container mx-auto w-full flex items-center justify-between gap-4">
          <Link to="/" className="flex-shrink-0">
            <img
              src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687784/public_assets_images/public_assets_images_logo.svg"
              alt="Aoin"
              width={120}
              height={40}
              className="h-9 w-auto object-contain"
            />
          </Link>

          {desktopSearchBar}

          <div className="flex-shrink-0 flex items-center gap-5">
            <Link to="/wishlist" className="p-2 text-gray-600 hover:text-[#F2631F] transition-colors rounded-lg" aria-label="Wishlist">
              <Heart className="w-5 h-5" />
            </Link>
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-[#F2631F] transition-colors rounded-lg" aria-label="Cart">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#F2631F] text-white text-xs font-medium rounded-full px-1">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
            <Link to="/profile" className="p-2 text-gray-600 hover:text-[#F2631F] transition-colors rounded-lg" aria-label="Account">
              <User className="w-5 h-5" />
            </Link>
            <div className="relative" ref={languageDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Language"
              >
                <span className="font-medium">{languageOptions.find((l) => (i18n.language?.split('-')[0] || 'en') === l.code)?.code.toUpperCase() || 'EN'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLanguageDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  {languageOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => { i18n.changeLanguage(option.code); setIsLanguageDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-gray-50 ${(i18n.language?.split('-')[0] || 'en') === option.code ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700'}`}
                    >
                      <span>{option.flag}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/business/login"
              className="flex-shrink-0 h-9 px-4 flex items-center justify-center bg-[#F2631F] text-white text-sm font-semibold rounded-lg hover:bg-[#e55a1a] transition-colors whitespace-nowrap"
            >
              Become a Merchant
            </Link>
          </div>
        </div>
      </div>

      {/* ========== DESKTOP: Navigation row — Left: Category | Home | Products | Promotions | Right: Track Order | Aoin Live ========== */}
      <div className="hidden nav:block nav:bg-white nav:border-b nav:border-gray-100">
        <div className="container mx-auto px-6">
          <nav className="flex items-center justify-between gap-6 py-3 text-sm font-medium">
            <div className="flex items-center gap-6">
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleCategoryDropdown}
                  aria-expanded={isCategoryDropdownOpen}
                  ref={desktopCategoryButtonRef}
                  className="flex items-center gap-1.5 text-gray-700 hover:text-[#F2631F] transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span>{t('nav.category')}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <Link to="/" className="text-gray-700 hover:text-[#F2631F] transition-colors">
                {t('nav.home')}
              </Link>
              <div className="relative" ref={productsNavRef}>
                <button
                  type="button"
                  onClick={() => setIsProductsNavOpen(!isProductsNavOpen)}
                  ref={productsNavButtonRef}
                  className="flex items-center gap-1.5 text-gray-700 hover:text-[#F2631F] transition-colors"
                >
                  <span>Products</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isProductsNavOpen ? 'rotate-180' : ''}`} />
                </button>
                {isProductsNavOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg border border-gray-100 shadow-md py-1 z-50">
                    <Link to="/all-products" onClick={() => setIsProductsNavOpen(false)} className="block px-4 py-2.5 text-gray-700 hover:bg-orange-50/50 hover:text-[#F2631F]">
                      {t('nav.allProducts')}
                    </Link>
                    <Link to="/new-product" onClick={() => setIsProductsNavOpen(false)} className="block px-4 py-2.5 text-gray-700 hover:bg-orange-50/50 hover:text-[#F2631F]">
                      {t('nav.newProduct')}
                    </Link>
                    <button type="button" onClick={() => { setIsProductsNavOpen(false); toggleCategoryDropdown(); }} className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-orange-50/50 hover:text-[#F2631F]">
                      {t('nav.category')}
                    </button>
                  </div>
                )}
              </div>
              <Link to="/promo-products" className="flex items-center gap-1.5 text-gray-700 hover:text-[#F2631F] transition-colors">
                {t('nav.promotion')}
                <span className="bg-[#F2631F] text-white text-xs font-medium rounded-full px-2 py-0.5">HOT</span>
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/track-order" className="flex items-center gap-1.5 text-gray-700 hover:text-[#F2631F] transition-colors">
                <img src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687786/public_assets_images/public_assets_images_track-order.svg" alt="" className="w-4 h-4 opacity-70" />
                {t('nav.trackOrder')}
              </Link>
              <Link to="/live-shop" style={aoinLiveButtonStyle} className="flex items-center gap-1.5 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity">
                {t('nav.aoinLive')}
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Announcement bar — thin (32–36px), soft background, subtle animation; Play with soft pulse */}
      {showPromoBar && (
        <div className="relative z-10 w-full">
          <div className="h-8 nav:h-9 flex items-center justify-center gap-2 px-4 bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border-b border-orange-100/80 text-center animate-slideDown">
            <span className="text-base nav:text-sm">🎮</span>
            <span className="text-gray-700 text-xs md:text-sm font-medium">
              Play & Get <span className="text-orange-600 font-semibold">20% OFF</span>
            </span>
            <Link
              to="/games"
              className="announcement-play-btn ml-1 h-6 nav:h-7 px-4 flex items-center justify-center rounded-full bg-[#F2631F] text-white text-xs md:text-sm font-semibold hover:bg-[#e55a1a] transition-colors shadow-sm"
            >
              Play
            </Link>
            <button
              onClick={() => setShowPromoBar(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-white/60 transition-colors"
              aria-label="Close announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <style>{`
            @keyframes slideDown {
              0% { transform: translateY(-100%); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            .animate-slideDown { animation: slideDown 0.5s cubic-bezier(.4,0,.2,1) both; }
            @keyframes softPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(242, 99, 31, 0.35); }
              50% { box-shadow: 0 0 0 6px rgba(242, 99, 31, 0); }
            }
            .announcement-play-btn { animation: softPulse 2s ease-in-out infinite; }
          `}</style>
        </div>
      )}

      {/* Category dropdown - for desktop */}
      {isCategoryDropdownOpen && !mobileDrawerOpen && (
        <div ref={categoryDropdownRef} className="z-40">
          <CategoryDropdown
            isOpen={isCategoryDropdownOpen}
            closeDropdown={() => setIsCategoryDropdownOpen(false)}
          />
        </div>
      )}

      {/* Logout Confirmation Popup */}
      <LogoutConfirmationPopup
        isOpen={isLogoutPopupOpen}
        onClose={() => setIsLogoutPopupOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </header>
  );
};

export default Navbar;