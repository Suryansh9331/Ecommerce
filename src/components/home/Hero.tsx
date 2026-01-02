import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TopSellingCarousel from './TopSellingCarousel';
import RightCarousel from './RightCarousel'
import Bottom1 from './Bottom1Carousel'
import Bottom2 from './Bottom2Carousel'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ICarouselItem {
  id: number;
  image_url: string;
  shareable_link: string;
  display_order: number;
}

// --- SVG Placeholders ---
// Paste your SVG code inside the backticks for each constant.



const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [carouselItems, setCarouselItems] = useState<ICarouselItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => { fetchCarouselItems(); }, []);
  useEffect(() => {
    if (carouselItems.length < 2) return;
    const interval = setInterval(
      () => setCurrentSlide(prev => (prev + 1) % carouselItems.length),
      3000
    );
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  const fetchCarouselItems = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/homepage/carousels`
      );
      if (!response.ok) throw new Error('Failed to fetch carousel items');
      const data = await response.json();
      setCarouselItems(data);
    } catch (error) {
      console.error('Error fetching carousel items:', error);
    }
  };

  const nextSlide = () => setCurrentSlide(prev => (prev === carouselItems.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide(prev => (prev === 0 ? carouselItems.length - 1 : prev - 1));
  const goToSlide = (idx: number) => setCurrentSlide(idx);

  if (!carouselItems.length) {
    return (
      <section className="w-full max-w-[1680px] mx-auto px-2 lg:px-4 pt-4">
        <div className="flex items-center justify-center h-[564px] bg-gray-200 rounded-lg animate-pulse">
          <span className="text-gray-500"></span>
        </div>
      </section>
    );
  }

  const current = carouselItems[currentSlide];

  return (
    <section className="w-full max-w-[1680px] mx-auto px-1 sm:px-2 lg:px-4 pt-2 sm:pt-4">
      {/* Mobile/Tablet Layout - Below mid screen (1080px) */}
      <div className="block mid:hidden">
        <div className="relative w-full">
          <div className="bg-gradient-to-r from-purple-500 to-orange-400 rounded-lg overflow-hidden relative h-[367px]">
            <div className="absolute inset-0 flex flex-col justify-center items-center">
              <div className="w-full h-full relative">
              <img
                  src={current.image_url}
                  alt="Carousel"
                  className="w-full h-full object-cover rounded-lg"
                  style={{ objectPosition: 'center' }}
                />
                <button
                  onClick={() => navigate('/all-products')}
                  className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#F2631F] text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[#E25818] transition-colors shadow-md"
                >
                  Order Now
                </button>
              </div>
            </div>
            {/* Pagination dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
              {carouselItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`h-1.5 sm:h-2 w-6 sm:w-8 rounded-full transition-all ${
                    currentSlide === idx ? 'bg-[#F2631F]' : 'bg-[#F2631F]/50'
                  }`}
                />
              ))}
            </div>
            {/* Arrows */}
            <div className="absolute top-1/2 transform -translate-y-1/2 w-full px-4 flex justify-between">
              <button onClick={prevSlide} className="p-1 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextSlide} className="p-1 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Above mid screen (1080px) */}
      <div
        className="hidden mid:grid gap-6"
        style={{
          gridTemplateAreas: `
            'left main right'
            'left bottom1 bottom2'
          `,
          gridTemplateColumns: '270px 1fr 368px',
          gridTemplateRows: '367px 172px'
        }}
      >
        {/* Left Panel (Side carousel) */}
        <div style={{ gridArea: 'left' }} className="w-full">
          <TopSellingCarousel />
        </div>

        {/* Main Carousel (Dynamic) */}
        <div
          className="relative"
          style={{ gridArea: 'main' }}
        >
          <div className="bg-gradient-to-r from-purple-500 to-orange-400 rounded-lg overflow-hidden relative h-[367px]">
            <div className="absolute inset-0 flex flex-col justify-center items-center">
              <div className="w-full h-full relative">
                <img
                  src={current.image_url}
                  alt="Carousel"
                  className="w-full h-full object-cover rounded-lg"
                  style={{ objectPosition: 'center' }}
                />
                <button
                  onClick={() => navigate('/all-products')}
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-[#F2631F] text-white px-4 sm:px-6 py-2 rounded font-medium hover:bg-[#E25818] transition-colors text-sm sm:text-base shadow-lg"
                >
                  Order Now
                </button>
              </div>
            </div>
            {/* Pagination dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
              {carouselItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`h-1.5 sm:h-2 w-6 sm:w-8 rounded-full transition-all ${
                    currentSlide === idx ? 'bg-[#F2631F]' : 'bg-[#F2631F]/50'
                  }`}
                />
              ))}
            </div>
            {/* Arrows */}
            <div className="absolute top-1/2 transform -translate-y-1/2 w-full px-4 flex justify-between">
              <button onClick={prevSlide} className="p-1 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextSlide} className="p-1 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-6 h-[564px]" style={{ gridArea: 'right' }}>
          <RightCarousel />
          </div>
          
        

        {/* Bottom Banners Grid */}
        <div style={{ gridArea: 'bottom1' }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Bottom1/>
         <Bottom2/>
        </div>
        
      </div>
    </section>
  );
};

export default Hero;
