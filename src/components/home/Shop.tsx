import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';


// Import your SVG files
const Prime = 'https://res.cloudinary.com/do3vxz4gw/image/upload/v1752058892/public_assets_banner/public_assets_Banner_Shutter.svg';
const Exclusive = 'https://res.cloudinary.com/do3vxz4gw/image/upload/v1752058892/public_assets_banner/public_assets_Banner_Shutter.svg';
const Vault = 'https://res.cloudinary.com/do3vxz4gw/image/upload/v1752058892/public_assets_banner/public_assets_Banner_Shutter.svg';
const LuxeHub = 'https://res.cloudinary.com/do3vxz4gw/image/upload/v1752058892/public_assets_banner/public_assets_Banner_Shutter.svg';

// Import inner banner SVG files
const PrimeInner = 'https://res.cloudinary.com/do3vxz4gw/image/upload/v1752058616/public_assets_banner/public_assets_Banner_Shop1_banner.svg';
const ExclusiveInner = 'https://res.cloudinary.com/do3vxz4gw/image/upload/v1752058616/public_assets_banner/public_assets_Banner_Shop2_banner.svg';
const VaultInner = 'https://res.cloudinary.com/do3vxz4gw/image/upload/v1752058616/public_assets_banner/public_assets_Banner_Shop3_banner.svg';
const LuxeHubInner = 'https://res.cloudinary.com/do3vxz4gw/image/upload/v1752058616/public_assets_banner/public_assets_Banner_Shop4_banner.svg';

interface ShopBanner {
  id: number;
  title: string;
  timeLeft: string;
  navigationPath: string;
  bannerImage: string;
  innerBannerImage: string;
}

const Shop = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [localTime, setLocalTime] = useState<Date>(new Date());
  const [istTime, setIstTime] = useState<Date>(new Date());
  const [gmtTime, setGmtTime] = useState<Date>(new Date());
  const [userTimeZone, setUserTimeZone] = useState<string>('');
  const [hoveredBanner, setHoveredBanner] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const bannerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const scrollRaf = useRef<number | null>(null);

  const GEOIP_URL: string | undefined = (import.meta as { env: Record<string, string | undefined> }).env?.VITE_GEOIP_URL;

  const computeTimes = (tz: string | null) => {
    const now = new Date();
    const safeTz = tz && tz.trim().length > 0 ? tz : undefined;
    const computedLocal = safeTz ? new Date(now.toLocaleString('en-US', { timeZone: safeTz })) : now;
    const computedIst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const computedGmt = new Date(now.toLocaleString('en-US', { timeZone: 'Etc/UTC' }));
    setLocalTime(computedLocal);
    setIstTime(computedIst);
    setGmtTime(computedGmt);
    setCurrentTime(computedLocal);
    const hour = computedLocal.getHours();
    setIsShopOpen(hour >= 9 && hour < 22);
  };

  // Calculate time remaining until closing (22:00)
  const calculateTimeLeft = () => {
    const now = new Date();
    const closingTime = new Date(now);
    closingTime.setHours(22, 0, 0, 0);
    
    const diff = closingTime.getTime() - now.getTime();
    
    if (diff <= 0) return "Closed";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}hr ${minutes}min`;
  };

  const shopBanners: ShopBanner[] = [
    {
      id: 1,
      title: "AOIN PRIME",
      timeLeft: calculateTimeLeft(),
      navigationPath: "/shop1",
      bannerImage: Prime,
      innerBannerImage: PrimeInner
    },
    {
      id: 2,
      title: "AOIN EXCLUSIVE",
      timeLeft: calculateTimeLeft(),
      navigationPath: "/shop2",
      bannerImage: Exclusive,
      innerBannerImage: ExclusiveInner
    },
    {
      id: 3,
      title: "AOIN VAULT",
      timeLeft: calculateTimeLeft(),
      navigationPath: "/shop3",
      bannerImage: Vault,
      innerBannerImage: VaultInner
    },
    {
      id: 4,
      title: "LUXE HUB",
      timeLeft: calculateTimeLeft(),
      navigationPath: "/shop4", // changed from "/shop/luxehub"
      bannerImage: LuxeHub,
      innerBannerImage: LuxeHubInner
    }
  ];

  // Initial timezone detection via ENV-configured GEOIP endpoint, fallback to browser
  useEffect(() => {
    let isMounted = true;
    const detectTimezone = async () => {
      try {
        if (GEOIP_URL) {
          const resp = await fetch(GEOIP_URL, { headers: { Accept: 'application/json' } });
          if (resp.ok) {
            const data: { timezone?: string } = await resp.json();
            const tz = (data && typeof data.timezone === 'string') ? data.timezone : undefined;
            if (isMounted) {
              setUserTimeZone(tz ?? '');
              computeTimes(tz ?? null);
            }
            return;
          }
        }
      } catch (_e) {
        // ignore and fallback
      }
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimeZone(browserTz || '');
      computeTimes(browserTz || null);
    };
    detectTimezone();
    return () => { isMounted = false; };
  }, []);

  // Update local/IST/GMT times and shop status every minute
  useEffect(() => {
    const updateStatus = () => {
      computeTimes(userTimeZone || null);
    };
    const interval = setInterval(updateStatus, 60000);
    return () => clearInterval(interval);
  }, [userTimeZone]);

  // Animation trigger on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Detect mobile (Tailwind sm breakpoint < 640px)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const updateIsMobile = () => setIsMobile(mq.matches);
    updateIsMobile();
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', updateIsMobile);
      return () => mq.removeEventListener('change', updateIsMobile);
    } else {
      // @ts-ignore - for older browsers
      mq.addListener(updateIsMobile);
      return () => {
        // @ts-ignore - for older browsers
        mq.removeListener(updateIsMobile);
      };
    }
  }, []);

  const handleBannerClick = (bannerId: number, navigationPath: string) => {
    if (!isShopOpen) return;
    if (isMobile) {
      // First tap opens, second tap navigates
      if (hoveredBanner === bannerId) {
        navigate(navigationPath);
      } else {
        setHoveredBanner(bannerId);
        setHasOpenedOnce(true);
      }
    } else {
      navigate(navigationPath);
    }
  };

  const handleMouseEnter = (bannerId: number) => {
    if (isShopOpen) {
      setHoveredBanner(bannerId);
    }
  };

  const handleMouseLeave = () => {
    if (isShopOpen && !isMobile) {
      setHoveredBanner(null);
    }
  };

  const handleTouchStart = (bannerId: number) => {
    if (isShopOpen) {
      setHoveredBanner(bannerId);
      setHasOpenedOnce(true);
    }
  };

  const handleTouchEnd = () => {
    // On mobile, keep shutter open; on desktop-like touch, allow gentle auto-close
    if (isShopOpen && !isMobile) {
      setTimeout(() => {
        setHoveredBanner(null);
      }, 500);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Allow scrolling on mobile; do nothing
    if (!isMobile) {
      e.preventDefault();
    }
  };

  // Mobile scroll sync: keep the nearest banner to viewport center opened once user opened any
  useEffect(() => {
    if (!isMobile || !isShopOpen) return;
    const onScroll = () => {
      if (scrollRaf.current !== null) return;
      scrollRaf.current = window.requestAnimationFrame(() => {
        scrollRaf.current = null;
        if (!hasOpenedOnce) return;
        const viewportCenterY = window.innerHeight / 2;
        let closestBannerId: number | null = null;
        let smallestDistance = Number.POSITIVE_INFINITY;
        for (const key of Object.keys(bannerRefs.current)) {
          const id = Number(key);
          const el = bannerRefs.current[id];
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const centerY = rect.top + rect.height / 2;
          const distance = Math.abs(centerY - viewportCenterY);
          if (distance < smallestDistance) {
            smallestDistance = distance;
            closestBannerId = id;
          }
        }
        if (closestBannerId !== null && closestBannerId !== hoveredBanner) {
          setHoveredBanner(closestBannerId);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollRaf.current !== null) {
        cancelAnimationFrame(scrollRaf.current);
        scrollRaf.current = null;
      }
    };
  }, [isMobile, isShopOpen, hasOpenedOnce, hoveredBanner]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // removed unused getNextOpenTime helper to satisfy noUnused rules

  return (
    <div className="w-full min-h-screen mb-16 sm:mb-20 md:mb-24 lg:mb-32">
      {/* Innovation Window Section with Enhanced Professional Design */}
      <div className="relative py-6 px-4 sm:py-8 md:py-12 lg:py-12 sm:px-6 lg:px-8 overflow-hidden" 
           style={{ 
             background: 'linear-gradient(135deg, #F2631F 0%, #FF6B35 25%, #F2631F 50%, #FF6B35 75%, #F2631F 100%)',
             backgroundSize: '400% 400%'
           }}>
        
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300/20 rounded-full animate-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-16 h-16 border-2 border-yellow-300/30 rotate-45 animate-float-slow"></div>
          <div className="absolute top-20 right-20 w-12 h-12 bg-yellow-300/20 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 border border-yellow-300/40 rounded-full animate-float-slow-delayed"></div>
          <div className="absolute bottom-10 right-10 w-8 h-8 bg-yellow-300/30 rotate-45 animate-float"></div>
        </div>

        {/* Enhanced Decorative Frame */}
        <div className="absolute inset-0 z-0">
          {/* Main Frame Border with Glow Effect */}
          <div className="absolute inset-4 border-[3px] border-yellow-300/40 rounded-xl shadow-[0_0_30px_rgba(251,191,36,0.3)]">
            {/* Animated Corner Ornaments */}
            <div className="absolute -left-4 -top-4 w-16 h-16 animate-corner-pulse">
              <div className="absolute inset-0 rotate-45 border-t-4 border-l-4 border-yellow-300/60 shadow-[0_0_20px_rgba(251,191,36,0.4)]"></div>
              <div className="absolute inset-2 rotate-45 border-t-2 border-l-2 border-white/30"></div>
              <div className="absolute inset-0 w-2 h-2 bg-yellow-300/50 rounded-full animate-ping"></div>
            </div>
            <div className="absolute -right-4 -top-4 w-16 h-16 animate-corner-pulse delay-100">
              <div className="absolute inset-0 rotate-45 border-t-4 border-r-4 border-yellow-300/60 shadow-[0_0_20px_rgba(251,191,36,0.4)]"></div>
              <div className="absolute inset-2 rotate-45 border-t-2 border-r-2 border-white/30"></div>
              <div className="absolute inset-0 w-2 h-2 bg-yellow-300/50 rounded-full animate-ping delay-300"></div>
            </div>
            <div className="absolute -left-4 -bottom-4 w-16 h-16 animate-corner-pulse delay-200">
              <div className="absolute inset-0 rotate-45 border-b-4 border-l-4 border-yellow-300/60 shadow-[0_0_20px_rgba(251,191,36,0.4)]"></div>
              <div className="absolute inset-2 rotate-45 border-b-2 border-l-2 border-white/30"></div>
              <div className="absolute inset-0 w-2 h-2 bg-yellow-300/50 rounded-full animate-ping delay-600"></div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-16 h-16 animate-corner-pulse delay-300">
              <div className="absolute inset-0 rotate-45 border-b-4 border-r-4 border-yellow-300/60 shadow-[0_0_20px_rgba(251,191,36,0.4)]"></div>
              <div className="absolute inset-2 rotate-45 border-b-2 border-r-2 border-white/30"></div>
              <div className="absolute inset-0 w-2 h-2 bg-yellow-300/50 rounded-full animate-ping delay-900"></div>
            </div>

            {/* Animated Decorative Lines */}
            <div className="absolute top-0 left-16 right-16 h-px bg-gradient-to-r from-transparent via-yellow-300/50 to-transparent animate-shimmer"></div>
            <div className="absolute bottom-0 left-16 right-16 h-px bg-gradient-to-r from-transparent via-yellow-300/50 to-transparent animate-shimmer delay-500"></div>
            <div className="absolute left-0 top-16 bottom-16 w-px bg-gradient-to-b from-transparent via-yellow-300/50 to-transparent animate-shimmer delay-1000"></div>
            <div className="absolute right-0 top-16 bottom-16 w-px bg-gradient-to-b from-transparent via-yellow-300/50 to-transparent animate-shimmer delay-1500"></div>

            {/* Inner Frame with Multiple Layers */}
            <div className="absolute inset-6 border border-white/20 rounded-lg"></div>
            <div className="absolute inset-8 border border-yellow-300/20 rounded-lg"></div>
          </div>

          {/* Enhanced Corner Lights */}
          <div className="absolute -left-2 -top-2 w-12 h-12">
            <div className="absolute inset-0 bg-yellow-300/30 rounded-full blur-md animate-glow"></div>
            <div className="absolute inset-2 bg-yellow-300/20 rounded-full blur-sm animate-pulse"></div>
          </div>
          <div className="absolute -right-2 -top-2 w-12 h-12">
            <div className="absolute inset-0 bg-yellow-300/30 rounded-full blur-md animate-glow delay-200"></div>
            <div className="absolute inset-2 bg-yellow-300/20 rounded-full blur-sm animate-pulse delay-200"></div>
          </div>
          <div className="absolute -left-2 -bottom-2 w-12 h-12">
            <div className="absolute inset-0 bg-yellow-300/30 rounded-full blur-md animate-glow delay-400"></div>
            <div className="absolute inset-2 bg-yellow-300/20 rounded-full blur-sm animate-pulse delay-400"></div>
          </div>
          <div className="absolute -right-2 -bottom-2 w-12 h-12">
            <div className="absolute inset-0 bg-yellow-300/30 rounded-full blur-md animate-glow delay-600"></div>
            <div className="absolute inset-2 bg-yellow-300/20 rounded-full blur-sm animate-pulse delay-600"></div>
          </div>
        </div>

        {/* Main Content with Enhanced Background */}
        <div className="relative overflow-hidden rounded-xl shadow-2xl min-h-[100px] sm:min-h-[100px] md:min-h-[100px] lg:min-h-[100px] backdrop-blur-sm"
             style={{
               background: `
                 radial-gradient(circle at 20% 80%, rgba(251,191,36,0.1) 0%, transparent 50%),
                 radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                 linear-gradient(135deg, rgba(242,99,31,0.95) 0%, rgba(255,107,53,0.95) 100%)
               `
             }}>
          
          {/* Innovation Window Section with Enhanced Animations */}
          <div className="max-w-4xl mx-auto text-center relative py-8 sm:py-12 md:py-16 lg:py-20">
            
            {/* Enhanced 3D Floating Title Container */}
            <div className={`transform-gpu transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="flex items-center justify-center space-x-3 mb-4 animate-float">
                
                {/* Enhanced Mystic Shopping Icon Left */}
                <div className="relative group transform hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-yellow-300/20 rounded-full blur-lg animate-pulse"></div>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-yellow-300 animate-mystic-spin relative z-10">
                    <path
                      d="M20 7h-4V6c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v1H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 6h4v1h-4V6z"
                      fill="currentColor"
                    />
                  </svg>
                  <div className="absolute -inset-2 bg-gradient-to-r from-yellow-300/0 via-yellow-300/20 to-yellow-300/0 rounded-full blur-md animate-shimmer"></div>
                </div>
                
                {/* Enhanced Title with Multiple Effects */}
                <div className="relative group perspective">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 via-transparent to-yellow-300/20 rounded-lg blur-sm animate-shimmer"></div>
                  <span className="text-white font-bold tracking-wider text-xl sm:text-2xl md:text-3xl lg:text-4xl font-[Work Sans] block transform transition-all duration-500 hover:transform-gpu hover:rotate-y-12 relative z-10">
                    <span className="relative inline-block animate-text-shimmer bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text">
                      {t('home.sections.innovationWindowTitle')}
                    </span>
                    <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-300 to-transparent animate-shimmer"></div>
                  </span>
                </div>
                
                {/* Enhanced Mystic Shopping Icon Right */}
                <div className="relative group transform hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-yellow-300/20 rounded-full blur-lg animate-pulse"></div>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-yellow-300 animate-mystic-spin-reverse relative z-10">
                    <path
                      d="M20 7h-4V6c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v1H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 6h4v1h-4V6z"
                      fill="currentColor"
                    />
                  </svg>
                  <div className="absolute -inset-2 bg-gradient-to-r from-yellow-300/0 via-yellow-300/20 to-yellow-300/0 rounded-full blur-md animate-shimmer delay-500"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Animated Time Badge */}
            <div className={`flex justify-center mb-6 transform-gpu transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/20 rounded-full blur-lg animate-pulse"></div>
                <span className="relative bg-white/20 border-2 border-white/40 text-white font-semibold px-8 sm:px-10 py-3 sm:py-4 rounded-full text-sm sm:text-base shadow-2xl backdrop-blur-sm font-[Work Sans] block transform hover:scale-105 transition-all duration-300">
                  <span className="relative z-10 animate-text-fade">{t('home.sections.innovationWindowHours')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/0 via-white/30 to-yellow-300/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </span>
              </div>
            </div>
            
            {/* Enhanced Animated Description */}
            <div className={`relative transform-gpu transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <p className="text-white text-sm sm:text-base md:text-lg font-medium mb-6 sm:mb-8 font-[Work Sans] relative transform hover:scale-105 transition-all duration-500">
                <span className="relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-yellow-300 after:to-transparent after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-700">
                  {t('home.sections.innovationWindowDescription')}
                </span>
              </p>
            </div>

            {/* Enhanced Current Time and Status Section */}
            <div className={`flex items-center justify-center mt-4 transform-gpu transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur-lg animate-pulse"></div>
                <div className="flex flex-col sm:flex-row items-center bg-white/95 rounded-2xl shadow-2xl px-6 sm:px-8 py-4 sm:py-5 space-y-3 sm:space-y-0 sm:space-x-8 border-2 border-white/30 backdrop-blur-lg relative z-10 transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative">
                      <span className="w-4 h-4 rounded-full bg-orange-500 inline-block animate-pulse"></span>
                      <div className="absolute inset-0 w-4 h-4 rounded-full bg-orange-500/30 animate-ping"></div>
                    </div>
                    <span className="text-gray-700 font-semibold text-sm sm:text-base">{t('home.sections.currentTime')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-semibold text-xs sm:text-sm bg-white/70 px-2 py-1 rounded-full">
                        {t('home.sections.localTime')}: {formatTime(localTime)}
                      </span>
                      <span className="text-gray-900 font-semibold text-xs sm:text-sm bg-white/70 px-2 py-1 rounded-full">
                        {t('home.sections.istTime')}: {formatTime(istTime)}
                      </span>
                      <span className="text-gray-900 font-semibold text-xs sm:text-sm bg-white/70 px-2 py-1 rounded-full">
                        {t('home.sections.gmtTime')}: {formatTime(gmtTime)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative">
                      <span className={`w-4 h-4 rounded-full ${isShopOpen ? 'bg-green-500' : 'bg-red-500'} inline-block animate-pulse`}></span>
                      <div className={`absolute inset-0 w-4 h-4 rounded-full ${isShopOpen ? 'bg-green-500/30' : 'bg-red-500/30'} animate-ping`}></div>
                    </div>
                    <span className="text-gray-700 font-semibold text-sm sm:text-base">{t('home.sections.status')}</span>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg transform hover:scale-110 transition-all duration-300 ${
                      isShopOpen 
                        ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 animate-status-open' 
                        : 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 animate-status-closed'
                    }`}>
                      {isShopOpen ? t('home.sections.open') : t('home.sections.closed')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Animation Styles */}
        <style>{`
          @keyframes particle {
            0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100px) translateX(50px) rotate(360deg); opacity: 0; }
          }

          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }

          @keyframes float-delayed {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-15px) scale(1.1); }
          }

          @keyframes float-slow-delayed {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-25px) rotate(-180deg); }
          }

          @keyframes shimmer {
            0% { opacity: 0.3; transform: scaleX(0); }
            50% { opacity: 1; transform: scaleX(1); }
            100% { opacity: 0.3; transform: scaleX(0); }
          }

          @keyframes mystic-spin {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.2); }
            100% { transform: rotate(360deg) scale(1); }
          }

          @keyframes mystic-spin-reverse {
            0% { transform: rotate(360deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.2); }
            100% { transform: rotate(0deg) scale(1); }
          }

          @keyframes text-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }

          @keyframes text-fade {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }

          @keyframes corner-pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }

          @keyframes glow {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.3); }
          }

          .animate-particle {
            animation: particle 4s infinite linear;
          }

          .animate-float-slow {
            animation: float-slow 8s infinite ease-in-out;
          }

          .animate-float-delayed {
            animation: float-delayed 6s infinite ease-in-out;
            animation-delay: 2s;
          }

          .animate-float-slow-delayed {
            animation: float-slow-delayed 10s infinite ease-in-out;
            animation-delay: 4s;
          }

          .animate-shimmer {
            animation: shimmer 3s infinite ease-in-out;
          }

          .animate-mystic-spin {
            animation: mystic-spin 8s infinite linear;
          }

          .animate-mystic-spin-reverse {
            animation: mystic-spin-reverse 8s infinite linear;
          }

          .animate-text-shimmer {
            animation: text-shimmer 4s infinite linear;
            background-size: 200% auto;
          }

          .animate-text-fade {
            animation: text-fade 3s infinite ease-in-out;
          }

          .animate-corner-pulse {
            animation: corner-pulse 4s infinite ease-in-out;
          }

          .animate-glow {
            animation: glow 5s infinite ease-in-out;
          }

          .perspective {
            perspective: 1000px;
          }

          .rotate-y-12 {
            transform: rotateY(12deg);
          }

          @keyframes status-open {
            0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(34,197,94,0.3); }
            50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(34,197,94,0.5); }
          }

          @keyframes status-closed {
            0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(239,68,68,0.3); }
            50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(239,68,68,0.5); }
          }

          .animate-status-open {
            animation: status-open 2s ease-in-out infinite;
          }

          .animate-status-closed {
            animation: status-closed 2s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes lightning {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }
          
          @keyframes lightning-delayed {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }

          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          
          .animate-lightning {
            animation: lightning 2s ease-in-out infinite;
          }
          
          .animate-lightning-delayed {
            animation: lightning 2s ease-in-out infinite;
            animation-delay: 1s;
          }
          
          .perspective-1000 {
            perspective: 1000px;
          }
        `}</style>
      </div>

      {/* Banners Section with Shutter */}
      <div className="bg-gray-100 py-4 sm:py-6 md:py-8 mt-10 sm:mt-16 md:mt-20 lg:mt-16 mb-10 sm:mb-16 md:mb-20 lg:mb-24 px-4 sm:px-6 md:px-8 lg:px-12 mx-auto">
        <div className="relative">
          {/* Shop Banners */}
          <div className={`space-y-4 sm:space-y-6 md:space-y-8 transition-all duration-1000 ${!isShopOpen ? 'opacity-30' : 'opacity-100'}`}>
            {shopBanners.map((shop, index) => (
              <div key={shop.id} className="w-full">
                {/* Banner */}
                <div 
                  className={`cursor-pointer transform transition-all duration-300 hover:shadow-2xl group select-none touch-manipulation ${isShopOpen ? 'hover:scale-[1.01]' : 'cursor-not-allowed'}`}
                  onClick={() => handleBannerClick(shop.id, shop.navigationPath)}
                  onMouseEnter={() => handleMouseEnter(shop.id)}
                  onMouseLeave={handleMouseLeave}
                  onMouseOut={handleMouseLeave}
                  onTouchStart={() => handleTouchStart(shop.id)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  role="button"
                  tabIndex={isShopOpen ? 0 : -1}
                  onKeyDown={(e) => {
                    if (isShopOpen && (e.key === 'Enter' || e.key === ' ')) {
                      handleBannerClick(shop.id, shop.navigationPath);
                    }
                  }}
                  aria-label={`Navigate to ${shop.title}`}
                  style={{
                    width: '100vw',
                    marginLeft: 'calc(-50vw + 50%)',
                    position: 'relative'
                  }}
                  ref={(el: HTMLDivElement | null) => { bannerRefs.current[shop.id] = el; }}
                >
                  <div 
                    className="relative flex items-center justify-center w-full group-hover:after:opacity-100 after:opacity-0 after:absolute after:inset-0 after:bg-gradient-to-r after:from-black/5 after:via-transparent after:to-black/5 after:transition-opacity after:duration-300 h-[150px] sm:h-[321px]"
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      margin: '0 auto',
                      background: `
                        linear-gradient(90deg, 
                          rgba(15,15,15,1) 0%, 
                          rgba(25,25,25,1) 25%, 
                          rgba(20,20,20,1) 50%, 
                          rgba(25,25,25,1) 75%, 
                          rgba(15,15,15,1) 100%
                        ),
                        repeating-linear-gradient(
                          0deg,
                          transparent,
                          transparent 1px,
                          rgba(255,255,255,0.02) 1px,
                          rgba(255,255,255,0.02) 2px
                        )
                      `,
                      boxShadow: 'inset 0 0 30px rgba(0,0,0,0.7)'
                    }}
                  >
                    {/* Time Left Badge */}
                    {isShopOpen && (
                      <div className="absolute top-1 left-2 sm:top-4 sm:left-6 text-white text-[10px] xs:text-xs sm:text-sm font-medium z-20 bg-black/50 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-sm transform group-hover:translate-y-1 transition-transform duration-300">
                        {t('home.sections.timeLeft')} {calculateTimeLeft()}
                      </div>
                    )}

                    {/* SVG Banner Images with Hover Effect */}
                    <div className="mt-10 sm:mt-16 md:mt-20 lg:mt-24 mb-10 sm:mb-16 md:mb-20 lg:mb-24 px-4 sm:px-6 md:px-8 lg:px-12 mx-auto relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
                      {/* Default Banner Image */}
                      <img 
                        src={shop.bannerImage} 
                        alt={shop.title}
                        className={`absolute w-full h-full object-contain md:object-cover object-center transition-all duration-1500 ease-in-out transform-gpu ${
                          hoveredBanner === shop.id ? 'opacity-0' : 'opacity-100'
                        }`}
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectPosition: 'center',
                          willChange: 'transform, opacity'
                        }}
                      />
                      
                      {/* Inner Banner Image (shown on hover) */}
                      <img 
                        src={shop.innerBannerImage} 
                        alt={`${shop.title} Inner`}
                        className={`absolute w-full h-full object-contain md:object-cover object-center transition-all duration-1500 ease-in-out transform-gpu ${
                          hoveredBanner === shop.id ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectPosition: 'center',
                          willChange: 'transform, opacity'
                        }}
                      />

                      {/* Single Frame Shutter Effect */}
                      <div 
                        className={`absolute inset-0 w-full bg-[#1a1a1a] transition-transform duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] transform-gpu origin-bottom ${
                          hoveredBanner === shop.id ? 'translate-y-[-100%]' : 'translate-y-0'
                        }`}
                        style={{
                          background: `
                            linear-gradient(0deg, 
                              rgba(26,26,26,0.95) 0%,
                              rgba(38,38,38,0.95) 50%,
                              rgba(26,26,26,0.95) 100%
                            )
                          `,
                          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.7)',
                          borderBottom: '2px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        {/* Shutter Lines Pattern */}
                        <div className="absolute inset-0 opacity-40">
                          <div 
                            className="w-full h-full"
                            style={{
                              background: `
                                repeating-linear-gradient(
                                  0deg,
                                  transparent,
                                  transparent 8px,
                                  rgba(255,255,255,0.05) 8px,
                                  rgba(255,255,255,0.05) 16px
                                ),
                                repeating-linear-gradient(
                                  90deg,
                                  transparent,
                                  transparent 40px,
                                  rgba(255,255,255,0.02) 40px,
                                  rgba(255,255,255,0.02) 80px
                                )
                              `
                            }}
                          ></div>
                        </div>
                        
                        {/* Metallic Edge Effect */}
                        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-b from-white/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/40"></div>
                      </div>

                      {/* Responsive Container Sizes */}
                      <div className="hidden xs:block sm:hidden w-[350px] h-[150px]"></div>
                      <div className="hidden sm:block md:hidden w-[480px] h-[200px]"></div>
                      <div className="hidden md:block lg:hidden w-[720px] h-[250px]"></div>
                      <div className="hidden lg:block xl:hidden w-[960px] h-[300px]"></div>
                      <div className="hidden xl:block w-[1200px] h-[321px]"></div>
                    </div>

                    {/* Texture overlay with responsive padding */}
                    <div 
                      className={`absolute inset-0 opacity-10 z-15 transition-all duration-1000 p-2 sm:p-3 md:p-4 lg:p-5 ${
                        hoveredBanner === shop.id ? 'opacity-0' : 'opacity-10'
                      }`}
                      style={{
                        background: `
                          repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 2px,
                            rgba(255,255,255,0.05) 2px,
                            rgba(255,255,255,0.05) 4px
                          )
                        `
                      }}
                    ></div>

                    {/* Hover effect overlay */}
                    {isShopOpen && (
                      <div className={`absolute inset-0 bg-black transition-opacity duration-1000 z-20 ${
                        hoveredBanner === shop.id ? 'opacity-20' : 'opacity-0'
                      }`}></div>
                    )}
                  </div>
                </div>

                {/* Gray spacer between banners (except after last banner) */}
                {index < shopBanners.length - 1 && (
                  <div className="w-full h-12 sm:h-16 md:h-20 lg:h-24 bg-gray-100"></div>
                )}
              </div>
            ))}
          </div>

          {/* Shutter Overlay */}
          {/* {!isShopOpen && (
            <div 
              className="absolute inset-0 z-30 flex items-center justify-center"
              style={{
                background: `url('https://res.cloudinary.com/do3vxz4gw/image/upload/v1751689863/public_assets_shop/public_assets_shop_shutter.svg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)'
              }}
            >
              {/* Closed Sign 
              <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg border-4 border-gray-800 shadow-2xl transform rotate-2">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                    SORRY! WE'RE
                  </h3>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
                    CLOSED
                  </h2>
                  <div className="border-t-2 border-gray-400 pt-4">
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600">
                      Shop opens daily from
                    </p>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">
                      9:00 AM - 10:00 PM
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      Come back during opening hours!
                    </p>
                  </div>
                </div>
              </div> */}
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default Shop;