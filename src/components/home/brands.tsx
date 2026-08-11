import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Brand {
  brand_id: number;
  name: string;
  slug: string;
  icon_url: string;
}

const Brands = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left
  const [position, setPosition] = useState(0);
  const [isTouching, setIsTouching] = useState(false);

  // Add click event listener to resume animation
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Resume only if we're not clicking/touching the carousel itself
      if (scrollRef.current && !scrollRef.current.contains(target) && !isTouching) {
        setIsPaused(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchend', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
    };
  }, [isTouching]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  // Touch event handlers
  const handleTouchStart = () => {
    setIsPaused(true);
    setIsTouching(true);
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
    // Don't resume immediately to allow for click/tap events to process
  };

  // Pendulum animation effect
  useEffect(() => {
    if (!scrollRef.current || isPaused || brands.length === 0) return;
    
    const scrollContainer = scrollRef.current;
    let frameId: number;
    let lastTimestamp: number | null = null;
    const speed = 0.3; // px per ms, adjust for desired speed
    const maxScroll = scrollContainer.scrollWidth / 2; // Maximum scroll distance

    const step = (timestamp: number) => {
      if (lastTimestamp !== null) {
        const delta = timestamp - lastTimestamp;
        const movement = speed * delta * direction;
        
        // Update position
        const newPosition = position + movement;
        
        // Check boundaries and reverse direction if needed
        if (newPosition >= maxScroll) {
          setDirection(-1);
          setPosition(maxScroll);
          scrollContainer.scrollLeft = maxScroll;
        } else if (newPosition <= 0) {
          setDirection(1);
          setPosition(0);
          scrollContainer.scrollLeft = 0;
        } else {
          setPosition(newPosition);
          scrollContainer.scrollLeft = newPosition;
        }
      }
      lastTimestamp = timestamp;
      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isPaused, brands, direction, position]);

  // Mouse event handlers
  const pauseMarquee = () => {
    setIsPaused(true);
    setIsTouching(false);
  };

  const resumeMarquee = () => {
    if (!isTouching) {
      setIsPaused(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/brands/icons`);
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-0">
        <div className="container mx-auto px-4 xl:px-14">
          <div className="flex justify-between items-center mb-6">
            <h6 className="text-xl font-medium font-worksans">{t('home.sections.brandsTitle')}</h6>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-4 pt-2 pl-2">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-36 h-40 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-0">
        <div className="container mx-auto px-4 xl:px-14">
          <div className="text-center text-red-500">
            <p>{t('common.error')}: {error}</p>
            <button
              onClick={fetchBrands}
              className="mt-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              {t('common.retry', 'Try Again')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4">
      <div className="container mx-auto px-4 xl:px-14">
        {/* Header with scroll buttons */}
        <div className="flex justify-between items-center mb-6">
      <h6 className="text-xl font-medium font-worksans">{t('home.sections.brandsTitle')}</h6>
          <div className="flex items-center">
            <Link to="/all-products" className="text-primary-500 text-sm font-medium mr-3 sm:mr-10">
        {t('home.seeAll')}
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <button
                onClick={scrollLeft}
                className="focus:outline-none"
                aria-label="Scroll Left"
              >
                <ChevronLeft size={20} className="text-gray-500 hover:text-black duration-300" />
              </button>
              <button
                onClick={scrollRight}
                className="focus:outline-none"
                aria-label="Scroll Right"
              >
                <ChevronRight size={20} className="text-gray-500 hover:text-black duration-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable brand icons with pendulum animation */}
        <div className="relative overflow-x-hidden pb-4 pt-2 pl-2">
          <div
            ref={scrollRef}
            className="flex space-x-4 overflow-x-hidden"
            onMouseEnter={pauseMarquee}
            onMouseLeave={resumeMarquee}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ 
              scrollBehavior: 'auto',
              transition: isPaused ? 'none' : 'scroll-left 0.1s ease-out'
            }}
          >
            {[...brands, ...brands, ...brands].map((brand, idx) => (
              <div
                key={brand.brand_id + '-' + idx}
                onClick={() => navigate(`/all-products?brand=${brand.brand_id}`)}
                className="flex-shrink-0 w-36 h-40 bg-transparent rounded-lg flex flex-col items-center justify-center text-center p-4 transition duration-200 hover:scale-105 cursor-pointer"
              >
                <div className="w-20 h-20 flex items-center justify-center">
                  {brand.icon_url ? (
                    <img
                      src={brand.icon_url}
                      alt={brand.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-3xl">🏷️</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Brands;
