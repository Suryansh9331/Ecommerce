

import { Search, ShoppingCart, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroOne = () => {
  return (
    <div className="min-h-[calc(100vh-340px)] sm:min-h-[calc(100vh-120px)] md:min-h-[calc(100vh-100px)] lg:min-h-screen mx-auto bg-black relative overflow-hidden">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0"></div>
      
      {/* Navigation Bar */}
     

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center py-0 sm:py-6 md:py-8 lg:py-12 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 min-h-[calc(100vh-340px)] sm:min-h-[calc(100vh-220px)] md:min-h-[calc(100vh-200px)] lg:min-h-[calc(100vh-120px)] animate-fade-in-up">
        {/* Main Heading */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-[80px] leading-[1.1] sm:leading-[1.05] md:leading-[1] tracking-[0.1em] sm:tracking-[0.12em] md:tracking-[0.15em] font-normal uppercase text-white text-center mb-2 sm:mb-3 md:mb-4 font-abeezee">
          TIMELESS RITUALS.
        </h1>

        {/* Sub Heading Line 1 */}
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-[80px] font-light tracking-[0.05em] sm:tracking-[0.08em] md:tracking-[0.1em] lg:tracking-[0.12em] xl:tracking-[0.15em] uppercase leading-tight mb-2 sm:mb-3 md:mb-4">
          <span className="text-[#BB9D7B] italic font-abeezee font-normal uppercase" style={{ fontStyle: 'italic', fontWeight: 400 }}>CONTEMPORARY</span>{' '}
          <span className="text-[#BB9D7B] italic font-abeezee font-normal uppercase" style={{ fontStyle: 'italic', fontWeight: 400 }}>DESIGN</span>
          <span className="text-white font-abeezee" style={{ fontWeight: 100 }}>.ONLY</span>
        </h2>
        
        {/* Sub Heading Line 2 */}
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-[80px] font-light tracking-[0.05em] sm:tracking-[0.08em] md:tracking-[0.1em] lg:tracking-[0.12em] xl:tracking-[0.15em] font-abeezee uppercase leading-[1.1] sm:leading-[1.05] md:leading-[1] mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <span className="text-white font-abeezee font-normal uppercase">AT</span>{' '}
          <span className="text-[#F26340] font-abeezee font-normal uppercase">
            AOIN
          </span>
          <span className="text-white font-abeezee" style={{ fontWeight: 100 }}>.</span>
        </h2>
        
        <div className="w-full max-w-[1920px] mx-auto p-2 sm:p-3 md:p-4 lg:p-6 rounded-[8px] sm:rounded-[12px] md:rounded-[16px] lg:rounded-[20px] xl:rounded-[24px] relative">
          {/* Mobile to Large - Single Image Full Width */}
          <div className="block lg:hidden w-full relative">
            <img 
              src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1754144750/public_assets_shop4/public_assets_shop4_Hero2.svg" 
              alt="Festive Table with Sweets and Flowers" 
              className="w-full h-auto aspect-[650/446] object-cover rounded-[6px] sm:rounded-[8px] md:rounded-[12px]" 
            />
            <Link 
              to="/shop4-Allproductpage"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#BB9D7B] text-white font-futurapt transition-all duration-300 hover:scale-105 shadow-lg text-[12px] font-medium tracking-[2px] uppercase w-[120px] sm:w-[120px] md:w-[140px] h-[40px] sm:h-[40px] md:h-[45px] flex-shrink-0 rounded-[20px] sm:rounded-[25px] md:rounded-[30px] text-center flex items-center justify-center"
            >
              SHOP NOW
            </Link>
          </div>

          {/* Large and above - Grid Layout */}
          <div className="hidden lg:grid grid-cols-3 xl:grid-cols-9 gap-6 lg:gap-8 relative z-10">
            {/* Column 1 - Single image */}
            <div className="col-span-1 xl:col-span-3 flex justify-center">
              <img 
                src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1754144750/public_assets_shop4/public_assets_shop4_Hero1.svg" 
                alt="Festive Diyas and Sweets" 
                className="w-full max-w-[400px] xl:max-w-[500px] 2xl:max-w-[560px] h-auto aspect-[560/807] object-cover rounded-[16px]" 
              />
            </div>

            {/* Column 2 - Single image (wider) */}
            <div className="col-span-1 xl:col-span-3 flex items-end justify-center">
              <img 
                src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1754144750/public_assets_shop4/public_assets_shop4_Hero2.svg" 
                alt="Festive Table with Sweets and Flowers" 
                className="w-full max-w-[400px] xl:max-w-[550px] 2xl:max-w-[650px] h-auto aspect-[650/446] object-cover rounded-[16px]" 
              />
            </div>

            {/* Column 3 - Two images stacked vertically */}
            <div className="col-span-1 xl:col-span-3 grid grid-rows-2 gap-6 justify-items-center">
              <img 
                src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1754144750/public_assets_shop4/public_assets_shop4_Hero3.svg" 
                alt="Statue with Tea Lights" 
                className="w-full max-w-[400px] xl:max-w-[500px] 2xl:max-w-[550px] h-auto aspect-[550/386] object-cover rounded-[16px]" 
              />
              <div className="relative">
                <img 
                  src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1754144750/public_assets_shop4/public_assets_shop4_Hero4.svg" 
                  alt="Evil Eye Charms and JEWELLERY" 
                  className="w-full max-w-[400px] xl:max-w-[500px] 2xl:max-w-[550px] h-auto aspect-[550/386] object-cover rounded-[16px]" 
                />
                <Link 
                  to="/shop4-Allproductpage"
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#BB9D7B] text-white font-futurapt transition-all duration-300 hover:scale-105 shadow-lg text-[12px] font-medium tracking-[2px] lg:tracking-[2.5px] xl:tracking-[3px] uppercase w-[100px] lg:w-[120px] xl:w-[140px] 2xl:w-[156px] h-[36px] lg:h-[40px] xl:h-[45px] 2xl:h-[50px] flex-shrink-0 rounded-[20px] lg:rounded-[25px] xl:rounded-[30px] text-center flex items-center justify-center"
                >
                  SHOP NOW
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroOne;
    