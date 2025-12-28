import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Facebook, Instagram, Twitter, Mail, LogOut, User, ChevronDown, Menu, X, Gift } from 'lucide-react';
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
  // const [selectedCategory, setSelectedCategory] = useState('Category'); // Removed as unused
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lowerMobileMenuOpen, setLowerMobileMenuOpen] = useState(false);
  const [isMobileCategoryDropdownOpen, setIsMobileCategoryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { totalItems } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const [searchType, setSearchType] = useState<'all' | 'products' | 'categories'>('all');
  const location = useLocation();
  const [isLogoutPopupOpen, setIsLogoutPopupOpen] = useState(false);
  const [showPromoBar, setShowPromoBar] = useState(true);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const lowerMobileMenuRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  // Refs for toggle buttons to exclude them from outside click detection
  const desktopCategoryButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const lowerMobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCategoryButtonRef = useRef<HTMLButtonElement>(null);

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

  useClickOutside(mobileMenuRef, (event: MouseEvent | TouchEvent) => {
    if (mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(event.target as Node)) {
      setMobileMenuOpen(false);
    }
  });

  useClickOutside(lowerMobileMenuRef, (event: MouseEvent | TouchEvent) => {
    if (lowerMobileMenuButtonRef.current && !lowerMobileMenuButtonRef.current.contains(event.target as Node)) {
      setLowerMobileMenuOpen(false);
    }
  });

  useClickOutside(languageDropdownRef, () => {
    setIsLanguageDropdownOpen(false);
  });

  useEffect(() => {
    setIsCategoryDropdownOpen(false);
    setMobileMenuOpen(false);
    setLowerMobileMenuOpen(false);
    setIsMobileCategoryDropdownOpen(false);
    setShowSearchResults(false);
  }, [location.pathname]);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setLowerMobileMenuOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsMobileCategoryDropdownOpen(false);
    setShowSearchResults(false);
  };

  const toggleLowerMobileMenu = () => {
    setLowerMobileMenuOpen(!lowerMobileMenuOpen);
    setIsMobileCategoryDropdownOpen(false);
  };

  const toggleMobileCategoryDropdown = () => {
    setIsMobileCategoryDropdownOpen(!isMobileCategoryDropdownOpen);
  };

  const handleLogoutClick = () => {
    setIsLogoutPopupOpen(true);
    setMobileMenuOpen(false);
    setLowerMobileMenuOpen(false);
  };

  const handleLogoutConfirm = () => {
    logout();
    setIsLogoutPopupOpen(false);
    setMobileMenuOpen(false);
    setLowerMobileMenuOpen(false);
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

  const searchBarContent = (
    <div ref={desktopSearchRef} className="relative">
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="w-full xl:w-[680px] h-14  flex justify-between items-center rounded-lg  overflow-hidden">
          <input
            type="text"
            placeholder={t('nav.searchPlaceholder')}
            className="w-full h-8 md:w-52 nav:w-64 mid:w-80 xl:w-96 border-0 py-3 px-4 text-gray-900 focus:ring-0 focus:outline-none font-['Work_Sans'] font-normal text-sm leading-6 tracking-[0%] outline-none"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
          />
          <div className="relative w-[200px] flex items-center  bg-[#FBF4CE]">
            <select
              className="w-full h-full appearance-none bg-transparent py-3 pl-4 pr-[120px] text-gray-900 focus:ring-0 focus:outline-none font-['Work_Sans'] font-normal text-[14px] leading-6 tracking-[0%]"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'all' | 'products' | 'categories')}
            >
              <option value="all">All</option>
              <option value="products">Products</option>
              <option value="categories">Categories</option>
            </select>
          </div>
          <button
                    className="w-24 h-11 ml-8 hover:bg-[#F2631F] hover:border-[#F2631F] hover:text-white xl:mr-12 text-[#692C2C] py-1.5 px-6 nav:px-3 mid:px-6 rounded-lg border border-[#692C2C] whitespace-nowrap font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] transition-colors"
                    
                  >
                    {t('nav.search')}
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
          // Navigation is handled inside SearchResults
        }}
      />
    </div>
  );

  const mobileSearchBar = (
    <div ref={mobileSearchRef} className="relative mb-4">
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="flex items-center rounded-md overflow-hidden bg-white shadow-sm border border-gray-200 w-full">
          <input
            type="text"
            placeholder={t('nav.searchPlaceholder')}
            className="flex-1 min-w-0 border-0 py-2.5 px-3 text-gray-900 focus:ring-0 focus:outline-none font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] bg-transparent"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
          />
          <button
            type="submit"
            className="h-full px-4 py-2 bg-[#F2631F] text-white font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] rounded-none focus:outline-none"
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          >
            {t('nav.search')}
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
            // Navigation is handled inside SearchResults
          }}
        />
      
    </div>
  );

  const desktopSearchBar = (
    <div className="hidden md:block relative">
      {searchBarContent}
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

      {/* Top navigation - black bar */}
      <div className="bg-[#FFE7DB] text-white  pb-2 md:pb-3 lg:pb-4">
        <div className="container mx-auto px-4 sm:px-6 md:px-4 lg:px-4 xl:px-4 2xl:px-6 3xl:px-8 max-w-full md:max-w-[98%] mid:max-w-[92%] xl:max-w-[1200px] 2xl:max-w-[1440px] 3xl:max-w-[1680px] 4xl:max-w-[1920px]">
          <div className="flex flex-col sm:pl-1 md:pl-0">
            {/* Social Media Icons - Top left for mobile only */}
           
            <div className="flex flex-start py-2 sm:py-3">
              {/* Social Media Icons - Left top - Hidden on mobile */}
              <div className="hidden sm:flex items-center space-x-4">
                <a href="https://www.facebook.com/profile.php?id=61578809217780" target="_blank" rel="noopener noreferrer" className="text-[#F2631F] hover:text-orange-400">
                  <Facebook size={16} />
                </a>
                <a href="https://www.instagram.com/aoinstore/" target="_blank" rel="noopener noreferrer" className="text-[#F2631F] hover:text-orange-400">
                  <Instagram size={16} />
                </a>
                <a href="https://x.com/AOIN111111" target="_blank" rel="noopener noreferrer" className="text-[#F2631F] hover:text-orange-400">
                  <Twitter size={16} />
                </a>
                <a href="mailto:infoaoinstore@gmail.com" className="text-[#F2631F] hover:text-orange-400">
                  <Mail size={16} />
                </a>
              </div>
            </div>

            <div className="flex flex-row items-center justify-between w-full pt-2 sm:pt-3">
              {/* Logo - Left below icons */}
              <div className="mt-0 flex-shrink-0 mr-2 md:mr-6 mid:mr-8">
                <Link to="/" className="inline-block">
                  <img src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687784/public_assets_images/public_assets_images_logo.svg" alt="Aoin Logo" width="100" height="35" className="w-[90px] h-[30px] sm:w-[100px] sm:h-[35px] mid:w-[120px] mid:h-[42px]" />
                </Link>
              </div>

              {/* Mobile menu toggle - use custom breakpoint at 968px */}
              <button
                className="block nav:hidden text-black p-2 sm:ml-auto"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
                ref={mobileMenuButtonRef}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Search and Actions - use custom breakpoint at 968px */}
              <div className="hidden nav:flex items-center justify-end flex-1">
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 nav:gap-3 mid:gap-4">
                  <div className="w-full md:w-auto">
                    {desktopSearchBar}
                  </div>

                  

                  {/* Icons */}
                  <div className="flex items-center gap-2 nav:gap-3 mid:gap-4 xl:gap-8 xl:mr-6 mid:mr-4">
                    {/* Language Switcher */}
          <div className="relative" ref={languageDropdownRef}>
                      <button
                        onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-800"
                        aria-label="Language Selector"
                      >
                        <span className="text-lg">
                          {languageOptions.find(lang => lang.code === (i18n.language?.split('-')[0] || 'en'))?.flag || '🇺🇸'}
                        </span>
            <span className="text-sm font-medium text-gray-900">
                          {languageOptions.find(lang => lang.code === (i18n.language?.split('-')[0] || 'en'))?.code.toUpperCase() || 'EN'}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isLanguageDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          {languageOptions.map((option) => (
                            <button
                              key={option.code}
                              onClick={() => {
                                i18n.changeLanguage(option.code);
                                setIsLanguageDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                                (i18n.language?.split('-')[0] || 'en') === option.code 
                                  ? 'bg-orange-50 text-orange-600 font-medium' 
                                  : 'text-gray-700'
                              }`}
                            >
                              <span className="text-lg">{option.flag}</span>
                              <span>{option.label}</span>
                              {(i18n.language?.split('-')[0] || 'en') === option.code && (
                                <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full"></div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link to="/wishlist" className="text-[#692C2C] hover:text-[#F2631F] font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%]">
                      <Heart className="w-5 h-5" />
                    </Link>

                    <Link to="/cart" className="text-[#692C2C] hover:text-[#F2631F] relative inline-flex items-center font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%]">
                      <ShoppingCart className="w-5 h-5" />
                      {totalItems > 0 && (
                        <span className="absolute -top-2 -right-1 md:-right-2 bg-[#F2631F] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {totalItems}
                        </span>
                      )}
                    </Link>

                    <Link to="/profile" className="text-[#692C2C] hover:text-[#F2631F] font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%]">
                      <User className="w-5 h-5" />
                    </Link>

                    {/* Add Become a Merchant button for desktop */}
                    <Link
                      to="/business/login"
                      className="hidden nav:flex w-40 h-10 justify-center items-center bg-[#F2631F] text-white rounded-md px-3 py-2 hover:bg-orange-600 transition-colors whitespace-nowrap font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%]"
                    >
                      Become a Merchant
                    </Link>
                  </div>

                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown - use custom breakpoint at 968px */}
      {mobileMenuOpen && (
        <div className="nav:hidden bg-[#FFE7DB] text-[#692C2C] border-t border-gray-200 py-3 px-4" ref={mobileMenuRef}>
          {mobileSearchBar}

          {/* Mobile action links */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium">Language:</span>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((option) => (
                  <button
                    key={option.code}
                    onClick={() => i18n.changeLanguage(option.code)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                      (i18n.language?.split('-')[0] || 'en') === option.code 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm">{option.flag}</span>
                    <span>{option.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Link to="/wishlist" className="flex flex-col items-center py-1.5 text-xs hover:text-[#F2631F]" onClick={() => { setMobileMenuOpen(false); setLowerMobileMenuOpen(false); }}>
              <Heart className="w-4 h-4 mb-1" />
              <span>{t('nav.wishlist')}</span>
            </Link>
            <Link to="/cart" className="flex flex-col items-center py-1.5 text-xs hover:text-[#F2631F] relative" onClick={() => { setMobileMenuOpen(false); setLowerMobileMenuOpen(false); }}>
              <div className="relative">
                <ShoppingCart className="w-4 h-4 mb-1" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-1 bg-[#F2631F] text-white text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <span>{t('nav.cart')}</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center py-1.5 text-xs hover:text-[#F2631F]" onClick={() => { setMobileMenuOpen(false); setLowerMobileMenuOpen(false); }}>
              <User className="w-4 h-4 mb-1" />
              <span>{t('nav.account')}</span>
            </Link>
          </div>

          <Link
            to="/business/login"
            className="w-1/2 block text-center justify-center bg-[#F2631F] text-white rounded-md px-1 py-3 hover:bg-orange-600 mb-3 text-sm mx-auto"
            onClick={() => { setMobileMenuOpen(false); setLowerMobileMenuOpen(false); }}
          >
            {t('nav.becomeMerchant')}
          </Link>

          {/* Social icons in mobile menu */}
          
        </div>
      )}

      {/* Main navigation - white bar */}
      <div className="bg-white border-b shadow-sm py-1.5 ">
        <div className="container mx-auto px-4 sm:px-6 md:px-4 lg:px-4 xl:px-4 2xl:px-6 3xl:px-8 max-w-full md:max-w-[98%] mid:max-w-[92%] xl:max-w-[1200px] 2xl:max-w-[1440px] 3xl:max-w-[1680px] 4xl:max-w-[1920px]">
          {/* Mobile lower navigation toggle - use custom breakpoint at 968px */}
          <div className="nav:hidden flex items-center justify-between">
            <button
              className="flex items-center py-1.5 text-black"
              onClick={toggleLowerMobileMenu}
              aria-label="Toggle lower navigation"
              ref={lowerMobileMenuButtonRef}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{t('nav.menu')}</span>
            </button>

            <div className="flex items-center space-x-2">
              <Link to="/track-order" className="hidden nav:flex items-center py-1.5 text-xs hover:text-[#F2631F]" onClick={() => { setMobileMenuOpen(false); setLowerMobileMenuOpen(false); }}>
                <img src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687786/public_assets_images/public_assets_images_track-order.svg" alt="Track Order" className="w-4 h-4 mr-1" />
                <span>{t('nav.trackOrder')}</span>
              </Link>
              {isAuthenticated ? (
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center py-1.5 text-xs text-red-600 hover:text-red-700"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                </button>

              ) : (
                <Link to="/sign-in" className="flex items-center py-1.5 text-xs hover:text-[#F2631F]" onClick={() => { setMobileMenuOpen(false); setLowerMobileMenuOpen(false); }}>
                  <User className="w-4 h-4 mr-1" />
                  <span>{t('nav.signInRegister')}</span>
                </Link>
              )}
              <Link
                to="/live-shop"
                style={aoinLiveButtonStyle}
                className="flex items-center text-white rounded-md px-3 py-1.5 hover:opacity-90 transition-opacity font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] ml-2"
              >
                {t('nav.aoinLive')}
              </Link>
            </div>
          </div>

          {/* Mobile lower navigation dropdown - use custom breakpoint at 968px */}
          {lowerMobileMenuOpen && (
            <div className="nav:hidden border-t border-gray-200 pt-2 pb-1 bg-white" ref={lowerMobileMenuRef}>
              <Link to="/track-order" className="flex items-center py-1.5 px-2 text-sm hover:text-[#F2631F] mb-2" onClick={() => { setMobileMenuOpen(false); setLowerMobileMenuOpen(false); }}>
                <img src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687786/public_assets_images/public_assets_images_track-order.svg" alt="Track Order" className="w-4 h-4 mr-2" />
                <span>{t('nav.trackOrder')}</span>
              </Link>

              <div className="mb-2">
                <button
                  className="flex items-center justify-between py-1.5 px-2 text-sm w-full text-left hover:bg-gray-50 rounded"
                  onClick={toggleMobileCategoryDropdown}
                  ref={mobileCategoryButtonRef}
                >
                  <span className="flex items-center font-medium">
                    {t('nav.category')}
                  </span>
                  <ChevronDown className={`ml-auto w-4 h-4 transition-transform duration-200 ${isMobileCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileCategoryDropdownOpen && (
                  <CategoryDropdown
                    isOpen={isMobileCategoryDropdownOpen}
                    closeDropdown={() => setIsMobileCategoryDropdownOpen(false)}
                    isMobile={true}
                  />
                )}
              </div>

              <nav className="space-y-1.5">
                <Link to="/" className="block py-1.5 px-2 text-sm hover:bg-gray-50 rounded" onClick={() => { setMobileMenuOpen(false); setLowerMobileMenuOpen(false); }}>
                  {t('nav.home')}
                </Link>
                <Link to="/all-products" className="block py-1.5 px-2 text-sm hover:bg-gray-50 rounded" onClick={() => { setMobileMenuOpen(false); setLowerMobileMenuOpen(false); }}>
                  {t('nav.allProducts')}
                </Link>
                <Link to="/new-product" className="block py-1.5 px-2 text-sm hover:bg-gray-50 rounded" onClick={() => { setMobileMenuOpen(false); setLowerMobileMenuOpen(false); }}>
                  {t('nav.newProduct')}
                </Link>
                <Link to="/promo-products" className="flex items-center justify-between py-1.5 px-2 text-sm hover:bg-gray-50 rounded" onClick={() => { setMobileMenuOpen(false); setLowerMobileMenuOpen(false); }}>
                  <span>{t('nav.promotion')}</span>
                  <span className="bg-[#F2631F] text-white text-xs px-2 py-0.5 rounded-full ml-1">HOT</span>
                </Link>
              </nav>
            </div>
          )}

          {/* Desktop navigation */}
          <div className="hidden nav:flex items-center justify-between">
            {/* Categories Dropdown Button */}
            <div onClick={toggleCategoryDropdown} className="relative flex items-center group">
              <span className="mr-1 w-6 h-6 py-[5px] px-[3px] flex items-center">
                <img src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687779/public_assets_images/public_assets_images_category.svg" alt="Category" className="w-full h-full" />
              </span>
              <button
                className="flex items-center py-1.5 px-3 md:px-4 text-black group-hover:text-gray-700 font-['Work_Sans'] font-medium text-[14px] nav:text-[12px] nav2:text-[14px] leading-6 tracking-[0%]"
                onClick={toggleCategoryDropdown}
                aria-expanded={isCategoryDropdownOpen}
                ref={desktopCategoryButtonRef}
              >
                <span className="inline">{t('nav.category')}</span>
                <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Main Nav Links */}
            <nav className="flex items-center gap-4 nav:gap-1 nav2:gap-4 2xl:gap-12"> 
              <Link to="/" className="py-1.5 px-2 md:px-3 nav2:px-4 font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] hover:text-[#F2631F] nav:text-[12.5px] nav2:text-[14px]">
                {t('nav.home')}
              </Link>
              <Link to="/all-products" className="py-1.5 px-2 md:px-3 nav2:px-4 font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] hover:text-[#F2631F] nav:text-[12.5px] nav2:text-[14px]">
                {t('nav.allProducts')}
              </Link>
              <Link to="/new-product" className="py-1.5 px-2 md:px-3 nav2:px-4 font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] hover:text-[#F2631F] nav:text-[12.5px] nav2:text-[14px]">
                {t('nav.newProduct')}
              </Link>
              <Link to="/promo-products" className="py-F1.5 px-2 md:px-3 nav2:px-4 font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] hover:text-[#F2631F] flex items-center nav:text-[12.5px] nav2:text-[14px]">
                {t('nav.promotion')} <span className="bg-[#F2631F] text-white text-xs px-2 py-0.5 rounded-full ml-1">HOT</span>
              </Link>
            </nav>

            {/* Right side links */}
            <div className="flex items-center md:space-x-2 nav:space-x-3 mid:space-x-6">
              <Link to="/orders" className="flex items-center py-1.5 font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] hover:text-[#F2631F] nav:text-[11px] nav2:text-[14px]">
                <img src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1751687786/public_assets_images/public_assets_images_track-order.svg" alt="Track Order" className="w-5 h-5 mr-1" />
                <span>{t('nav.trackOrder')}</span>
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center md:space-x-2 nav:space-x-3 mid:space-x-4">
                  <span className="font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] text-gray-600">
                    {user?.name ? user.name.split(' ')[0] + '...' : 'User'}
                  </span>
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center py-1.5 font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    <span>Logout</span>
                  </button>
                  <Link
                    to="/live-shop"
                    style={aoinLiveButtonStyle}
                    className="flex items-center text-white rounded-md px-3 py-1.5 hover:opacity-90 transition-opacity font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] ml-2 nav:text-[13px] nav2:text-[14px]"
                  >
                    Aoin Live
                  </Link>
                </div>
              ) : (
                <div className="flex items-center md:space-x-2 nav:space-x-3 mid:space-x-4">
                  <Link to="/sign-in" className="flex items-center py-1.5 font-['Work_Sans'] font-medium nav:text-[12px] nav2:text-[14px] text-[14px] leading-6 tracking-[0%] hover:text-[#F2631F]">
                    <User className="w-4 h-4 mr-1" />
                    <span>{t('nav.signInRegister')}</span>
                  </Link>
                  <Link
                    to="/live-shop"
                    style={aoinLiveButtonStyle}
                    className="flex items-center text-white rounded-md px-3 py-1.5 hover:opacity-90 transition-opacity font-['Work_Sans'] font-medium text-[14px] leading-6 tracking-[0%] ml-2"
                  >
                    {t('nav.aoinLive')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Bar */}
      {showPromoBar && (
        <div className="relative z-10 animate-slideDown w-full">
          <div className="backdrop-blur bg-gradient-to-r from-white/80 via-orange-50 to-orange-100/80 border border-orange-200/60 rounded-b-md mx-auto px-2 py-0.5 flex items-center justify-center gap-1 max-w-full mt-0 mb-0 min-h-0">
            <span className="flex items-center gap-1 text-orange-600 font-bold text-xs md:text-sm">
              <Gift className="w-4 h-4 animate-bounce-slow text-yellow-400 mr-0.5" />
              <span className="font-worksans text-sm hidden sm:inline">Play & Win</span>
              <span className="font-worksans text-sm inline sm:hidden">20% OFF!</span>
            </span>
            <span className="text-gray-800 font-medium text-xs md:text-sm mx-1">
              🎮 <span className="text-orange-600 font-bold">20% OFF</span>
            </span>
            <Link
              to="/games"
              className="ml-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-1 rounded-full font-semibold text-xs font-worksans hover:scale-105 transition-transform border border-orange-300"
            >
              PLAY
            </Link>
            <button
              onClick={() => setShowPromoBar(false)}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-black hover:text-gray-800 bg-white/60 rounded-full p-0.5 transition-colors border border-orange-100"
              aria-label="Close promo bar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <style>{`
            @keyframes slideDown {
              0% { transform: translateY(-100%); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            .animate-slideDown { animation: slideDown 0.7s cubic-bezier(.4,0,.2,1) both; }
            .animate-bounce-slow { animation: bounce 2.2s infinite; }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-3px); }
            }
          `}</style>
        </div>
      )}

      {/* Category dropdown - for desktop */}
      {isCategoryDropdownOpen && !mobileMenuOpen && !lowerMobileMenuOpen && (
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