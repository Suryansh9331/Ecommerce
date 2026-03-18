import React, { useState, useEffect, useRef } from 'react';
import { Star, Play, Heart, Share2, Bookmark } from 'lucide-react';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

const REEL_VIDEOS = [
  'https://res.cloudinary.com/ddnb10zkq/video/upload/v1773750957/WhatsApp_Video_2026-03-17_at_18.02.36_vmxttu.mp4',
  'https://res.cloudinary.com/ddnb10zkq/video/upload/v1773750955/WhatsApp_Video_2026-03-17_at_18.02.49_m1opbc.mp4',
  'https://res.cloudinary.com/ddnb10zkq/video/upload/v1773750956/WhatsApp_Video_2026-03-17_at_18.02.48_givg5v.mp4',
  'https://res.cloudinary.com/ddnb10zkq/video/upload/v1773750956/WhatsApp_Video_2026-03-17_at_18.02.47_dqhemu.mp4',
  'https://res.cloudinary.com/ddnb10zkq/video/upload/v1773750955/WhatsApp_Video_2026-03-17_at_18.02.37_u9wffg.mp4',
  'https://res.cloudinary.com/ddnb10zkq/video/upload/v1773750954/WhatsApp_Video_2026-03-17_at_18.02.49_1_qhbx22.mp4',
];

// Dummy product overlay data per reel (name, price, originalPrice) — thumbnail is the video first frame
const REEL_PRODUCTS = [
  { name: 'Forever Yours Heart Box', price: 1199, originalPrice: 2199 },
  { name: 'Silk Saree Collection', price: 2499, originalPrice: 3999 },
  { name: 'Handcrafted Ceramic Set', price: 899, originalPrice: 1299 },
  { name: 'Designer Kurti', price: 699, originalPrice: 999 },
  { name: 'Brass Diya Set', price: 449, originalPrice: 699 },
  { name: 'Boho Earrings', price: 349, originalPrice: 599 },
];

// Random counts in range (seeded by index so they're stable)
function getReelCounts(index: number): { likes: number; shares: number; saves: number } {
  const s = index * 7 + 11;
  const likes = 150000 + (s % 51) * 1000;      // 150K–200K
  const shares = 30000 + ((s + 3) % 31) * 1000; // 30K–60K
  const saves = 50000 + ((s + 5) % 51) * 1000;  // 50K–100K
  return { likes, shares, saves };
}

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

interface ReelCardProps {
  videoUrl: string;
  product: (typeof REEL_PRODUCTS)[number];
  index: number;
}

const ReelCard: React.FC<ReelCardProps> = ({ videoUrl, product, index }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const counts = getReelCounts(index);
  const [displayLikes, setDisplayLikes] = useState(counts.likes);
  const [displaySaves, setDisplaySaves] = useState(counts.saves);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((prev) => {
      setDisplayLikes((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved((prev) => {
      setDisplaySaves((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shop From Reel',
          text: product.name,
          url: window.location.href,
        });
      } catch (err) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="relative flex-none snap-start w-[230px] sm:w-[240px] md:w-[260px] rounded-2xl overflow-hidden bg-black shadow-lg shrink-0">
      {/* Video - 9:16 aspect */}
      <div className="relative aspect-[9/16] w-full">
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          loop
          autoPlay
        />
        {/* Right-side action stack: Like, Share, Save — smaller on mobile */}
        <div className="absolute right-1.5 sm:right-2 bottom-20 sm:bottom-24 flex flex-col items-center gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={handleLike}
            className="flex flex-col items-center gap-0 text-white drop-shadow-md hover:scale-105 transition-transform"
            aria-label="Like"
          >
            <span className="bg-black/40 rounded-full p-1.5 sm:p-2 flex items-center justify-center">
              <Heart
                className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`}
              />
            </span>
            <span className="text-[9px] sm:text-xs font-medium">{formatCount(displayLikes)}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-col items-center gap-0 text-white drop-shadow-md hover:scale-105 transition-transform"
            aria-label="Share"
          >
            <span className="bg-black/40 rounded-full p-1.5 sm:p-2 flex items-center justify-center">
              <Share2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </span>
            <span className="text-[9px] sm:text-xs font-medium">{formatCount(counts.shares)}</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex flex-col items-center gap-0 text-white drop-shadow-md hover:scale-105 transition-transform"
            aria-label="Save"
          >
            <span className="bg-black/40 rounded-full p-1.5 sm:p-2 flex items-center justify-center">
              <Bookmark
                className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${saved ? 'fill-amber-400 text-amber-400' : ''}`}
              />
            </span>
            <span className="text-[9px] sm:text-xs font-medium">{formatCount(displaySaves)}</span>
          </button>
        </div>
        {/* Bottom product overlay — smaller on mobile; thumbnail = video first frame (unplayed) */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2.5">
          <div className="bg-white/95 backdrop-blur rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-3 shadow-lg">
            <video
              src={videoUrl}
              className="w-8 h-8 sm:w-12 sm:h-12 rounded-md sm:rounded-lg object-cover shrink-0 bg-gray-200"
              muted
              playsInline
              preload="metadata"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-sm font-semibold text-gray-900 truncate">
                {product.name}
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[10px] sm:text-sm font-bold text-gray-900">
                  Rs. {product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-[9px] sm:text-xs text-gray-500 line-through">
                    Rs. {product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CARD_WIDTH_PX = 260;
const GAP_PX = 16;

const ShopFromReel: React.FC = () => {
  const [cardWidth, setCardWidth] = useState(CARD_WIDTH_PX);

  useEffect(() => {
    const updateWidth = () => {
      const w = window.innerWidth;
      if (w < 640) setCardWidth(230);
      else if (w < 768) setCardWidth(240);
      else setCardWidth(CARD_WIDTH_PX);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const {
    containerRef,
    isDragging,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useHorizontalScroll({
    snapToItems: true,
    itemWidth: cardWidth,
    gap: GAP_PX,
  });

  return (
    <section className="pt-4 pb-8 nav:pt-6 nav:pb-10">
      <div className="container mx-auto px-4 xl:px-14">
        {/* Heading + Watch Reel button — one line */}
        <div className="flex flex-row items-center justify-between gap-3 mb-4 md:mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <Star className="w-5 h-5 text-gray-900 shrink-0" strokeWidth={2} />
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight uppercase font-worksans truncate">
              Shop From Reel
            </h2>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.aoinapp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-[#F2631F] to-[#e55a1a] text-white text-sm font-semibold hover:from-[#e55a1a] hover:to-[#d04f12] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shrink-0 border border-orange-400/30"
          >
            <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20">
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5" fill="currentColor" />
            </span>
            Watch Reel
          </a>
        </div>

        {/* Video carousel */}
        <div id="reel-carousel" className="relative -mx-4 px-4 xl:-mx-14 xl:px-14">
          <div
            ref={containerRef}
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
            {REEL_VIDEOS.map((url, i) => (
              <ReelCard
                key={url}
                videoUrl={url}
                product={REEL_PRODUCTS[i]}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopFromReel;
