import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

const TESTIMONIALS = [
  {
    name: 'GARIMA',
    image: 'https://res.cloudinary.com/ddnb10zkq/image/upload/v1773753838/86d849a0-d214-4775-96c5-d4cf36da74c9.png',
    text: 'I love shopping on Aoin. Fast delivery and great deals. The app is so easy to use.',
    source: 'Aoin',
  },
  {
    name: 'RAHUL',
    image: 'https://res.cloudinary.com/ddnb10zkq/image/upload/v1773755602/Screenshot_2026-03-17_at_7.23.12_PM_sohzrv.png',
    text: 'Found some amazing products through Aoin Reel. Quick checkout and secure payment.',
    source: 'Aoin Reel',
  },
  {
    name: 'PRIYA',
    image: 'https://res.cloudinary.com/ddnb10zkq/image/upload/v1773755511/c634144d-96cb-4243-93d0-6b7cb5c81d89.png',
    text: 'Best shopping experience. I recommend Aoin to all my friends and family.',
    source: 'Aoin',
  },
  {
    name: 'ANITA',
    image: 'https://res.cloudinary.com/ddnb10zkq/image/upload/v1773755228/Screenshot_2026-03-17_at_7.16.42_PM_i4fiqv.png',
    text: 'Saw a product on Aoin Reel and bought it the same day. Super convenient.',
    source: 'Aoin Reel',
  },
  {
    name: 'VIKRAM',
    image: 'https://res.cloudinary.com/ddnb10zkq/image/upload/v1773755385/Screenshot_2026-03-17_at_7.19.38_PM_c3ny5l.png',
    text: 'Trustworthy platform with genuine products. Will keep buying from Aoin.',
    source: 'Aoin',
  },
  {
    name: 'ARJUN',
    image: 'https://res.cloudinary.com/ddnb10zkq/image/upload/v1773755065/Screenshot_2026-03-17_at_7.14.15_PM_mz3jfs.png',
    text: 'Aoin Reel made discovery so fun. Great prices and smooth delivery every time.',
    source: 'Aoin Reel',
  },
];

const STARS = 5;

// Mobile: equal padding left/right (16px); card width so 1 full + 25% of next fits in (100vw - 32px)
const MOBILE_PAD_PX = 16;
const MOBILE_GAP_PX = 12;

const DESKTOP_CARD_WIDTH = 320;
const DESKTOP_GAP = 16;

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileStepPx, setMobileStepPx] = useState(0);
  const [mobileCardWidthPx, setMobileCardWidthPx] = useState(0);

  // Mobile: equal padding 16px each side; card width so 1 full + 25% next fits in content area
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const contentWidth = vw - 2 * MOBILE_PAD_PX;
      const cardWidthPx = contentWidth / 1.25;
      setMobileCardWidthPx(cardWidthPx);
      setMobileStepPx(cardWidthPx + MOBILE_GAP_PX);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const {
    containerRef: desktopScrollRef,
    isDragging,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useHorizontalScroll({
    snapToItems: true,
    itemWidth: DESKTOP_CARD_WIDTH,
    gap: DESKTOP_GAP,
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-slide every 4 seconds on mobile, infinite loop to the left
  useEffect(() => {
    if (!isMobile) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(id);
  }, [isMobile]);

  return (
    <section className="w-full bg-black overflow-hidden">
      {/* Same container as ShopFromReel so heading and cards align */}
      <div className="container mx-auto px-4 xl:px-14 py-10 nav:py-14 ">
        {/* Header */}
        <div className="mb-8 nav:mb-10 flex gap-4 flex-col">
          <p className="font-sm text-gray-100 uppercase">TESTIMONIALS</p>
          
          <h2 className="text-3xl sm:text-4xl nav:text-5xl font-semibold text-white leading-tight">
            People who have already 
            <br />
            <strong className="font-bold">trusted our vision</strong>
          </h2>
        </div>

        {/* Mobile: equal padding left/right, 1 full card + 25% of next */}
        <div className="relative w-full overflow-hidden md:hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              gap: MOBILE_GAP_PX,
              transform: `translateX(-${currentIndex * (mobileStepPx || 0)}px)`,
            }}
          >
            {TESTIMONIALS.map((t) => (
              <article
                key={t.name + t.source}
                className="flex-none flex flex-col bg-white overflow-hidden border-0 rounded-none shrink-0 min-h-[400px]"
                style={{ width: mobileCardWidthPx ? `${mobileCardWidthPx}px` : '76vw' }}
              >
                {/* Image: 65% of card height — aspect box so image doesn't over-zoom */}
                <div className="relative w-full flex-[0_0_65%] min-h-0 overflow-hidden bg-gray-100">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </div>
                {/* Content: 35% — fixed share so text isn't cut */}
                <div className="bg-white text-black p-4 flex flex-col gap-2 flex-[0_0_35%] min-h-0 rounded-none overflow-hidden">
                  <div className="flex items-center justify-between gap-2 shrink-0">
                    <span className="font-bold text-sm uppercase tracking-wide truncate">
                      {t.name}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0" aria-hidden>
                      {Array.from({ length: STARS }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-amber-400 text-amber-400"
                          strokeWidth={0}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-900 leading-snug line-clamp-3 break-words">
                    {t.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-white' : 'bg-gray-500'
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: same structure as ShopFromReel — wrapper then scroll div so cards align with reels */}
        <div className="hidden md:block relative -mx-4 px-4 xl:-mx-14 xl:px-14">
          <div
            ref={desktopScrollRef}
            className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {TESTIMONIALS.map((t) => (
              <article
                key={t.name + t.source}
                className="flex-none flex flex-col bg-white overflow-hidden border-0 rounded-none w-[300px] md:w-[320px] shrink-0 snap-start min-h-[520px]"
              >
                {/* Image: 65% height */}
                <div className="relative w-full overflow-hidden flex-[0_0_65%] min-h-0">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                {/* Content: 35% - white, no border radius */}
                <div className="bg-white text-black p-4 nav:p-5 flex flex-col gap-2 flex-[0_0_35%] min-h-0 rounded-none">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm nav:text-base uppercase tracking-wide">
                      {t.name}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0" aria-hidden>
                      {Array.from({ length: STARS }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 nav:w-5 nav:h-5 fill-amber-400 text-amber-400"
                          strokeWidth={0}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm nav:text-base text-gray-900 leading-snug line-clamp-3">
                    {t.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
