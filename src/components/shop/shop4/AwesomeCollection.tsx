import { Link } from 'react-router-dom';

const AwesomeCollection = () => {
  return (
    <div className="w-full h-full  bg-black">
      {/* Header and Title Section */}
      <div className="flex flex-col items-center px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 md:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 w-full max-w-7xl">
          <span className="text-white font-['ABeeZee'] text-[16px] xs:text-[18px] sm:text-[22px] md:text-[26px] lg:text-[32px] xl:text-[36px] 2xl:text-[40px] font-normal leading-[1.2] sm:leading-[1.3] md:leading-[1.4] lg:leading-[1.5] tracking-[1px] sm:tracking-[2px] md:tracking-[3px] lg:tracking-[4px] xl:tracking-[5px] 2xl:tracking-[6px] uppercase text-center sm:text-left break-words">YOUR STYLE</span>
          <div className="w-[120px] xs:w-[140px] sm:w-[180px] md:w-[220px] lg:w-[280px] xl:w-[320px] 2xl:w-[400px] h-[24px] xs:h-[28px] sm:h-[36px] md:h-[44px] lg:h-[52px] xl:h-[58px] 2xl:h-[67px] rounded-[60px] xs:rounded-[80px] sm:rounded-[100px] md:rounded-[120px] lg:rounded-[150px] xl:rounded-[180px] 2xl:rounded-[210px] overflow-hidden flex-shrink-0">
            <img 
              src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1754144737/public_assets_shop4/public_assets_shop4_Awesome1.svg" 
              alt="Beaded JEWELLERY" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white font-['ABeeZee'] text-[16px] xs:text-[18px] sm:text-[22px] md:text-[26px] lg:text-[32px] xl:text-[36px] 2xl:text-[40px] font-normal leading-[1.2] sm:leading-[1.3] md:leading-[1.4] lg:leading-[1.5] tracking-[1px] sm:tracking-[2px] md:tracking-[3px] lg:tracking-[4px] xl:tracking-[5px] 2xl:tracking-[6px] uppercase text-center sm:text-left break-words">YOUR RULES</span>
        </div>
        <div className="text-center mt-3 sm:mt-4 md:mt-5 lg:mt-6 xl:mt-8 w-full max-w-4xl px-2 sm:px-3 md:px-4">
          <h2 className="text-white text-center font-['ABeeZee'] text-[14px] xs:text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] xl:text-[32px] 2xl:text-[36px] font-normal leading-[1.3] sm:leading-[1.4] md:leading-[1.5] tracking-[1px] sm:tracking-[2px] md:tracking-[3px] lg:tracking-[4px] xl:tracking-[5px] 2xl:tracking-[6px] uppercase break-words">AOIN POOJA BLESSINGS TO ALL</h2>
        </div>
      </div>

             {/* Collection Cards */}
       <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12 py-3 sm:py-4 md:py-6 lg:py-8 xl:py-12 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 lg:justify-center lg:items-center">
        {/* Card 1: 1200+ Awesome Collection - No horizontal scroll */}
        <div className="relative w-full sm:w-[280px] md:w-[350px] lg:w-[500px] xl:w-[559px] h-[200px] sm:h-[280px] md:h-[350px] lg:h-[450px] xl:h-[577px] rounded-lg overflow-hidden flex-shrink-0">
          <img 
            src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1754144737/public_assets_shop4/public_assets_shop4_Awesome2.svg" 
            alt="Puja collection" 
            className="w-full h-full object-cover"
          />
          {/* Text overlay positioned exactly like the image */}
          <div className="absolute top-2 sm:top-4 md:top-8 lg:top-16 xl:top-28 left-2 sm:left-4 md:left-8 lg:left-12 xl:left-[80px] text-white">
            <div className="text-[24px] sm:text-[32px] md:text-[40px] lg:text-[45px] xl:text-[50px] font-poppins font-medium leading-[1.1] sm:leading-[1.2] md:leading-[1.3] lg:leading-[1.4] xl:leading-[44px] text-black mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6">1200+</div>
            <div className="text-[20px] sm:text-[28px] md:text-[36px] lg:text-[42px] xl:text-[50px] font-['ABeeZee'] font-normal leading-[1.1] sm:leading-[1.2] md:leading-[1.3] lg:leading-[1.4] xl:leading-[60px] tracking-[2px] sm:tracking-[4px] md:tracking-[5px] lg:tracking-[6px] xl:tracking-[7.5px] uppercase bg-gradient-to-b from-red-800 to-red-900 bg-clip-text text-transparent">AWESOME</div>
            <div className="text-[20px] sm:text-[28px] md:text-[36px] lg:text-[42px] xl:text-[50px] font-['ABeeZee'] font-normal leading-[1.1] sm:leading-[1.2] md:leading-[1.3] lg:leading-[1.4] xl:leading-[60px] tracking-[2px] sm:tracking-[4px] md:tracking-[5px] lg:tracking-[6px] xl:tracking-[7.5px] uppercase text-black">COLLECTION</div>
          </div>
          {/* Button positioned over the incense sticks area */}
          <div className="absolute bottom-4 sm:bottom-8 md:bottom-12 lg:bottom-16 xl:bottom-[200px] left-2 sm:left-4 md:left-8 lg:left-12 xl:left-[80px] transform">
            <Link to="/shop4-Allproductpage" className="flex w-[100px] sm:w-[120px] md:w-[140px] lg:w-[150px] xl:w-[156px] h-[32px] sm:h-[38px] md:h-[44px] lg:h-[48px] xl:h-[50px] justify-center items-center gap-[6px] sm:gap-[8px] md:gap-[10px] flex-shrink-0 rounded-[20px] sm:rounded-[25px] md:rounded-[28px] lg:rounded-[30px] bg-[#BB9D7B] text-black font-poppins text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] font-semibold tracking-[1px] sm:tracking-[2px] md:tracking-[2.5px] lg:tracking-[3px] uppercase hover:bg-[#A88A6A] transition-colors duration-200">
              VIEW ALL
            </Link>
          </div>
        </div>

                 {/* Container for Cards 2, 3, 4 - With horizontal scroll */}
         <div className="flex gap-3 sm:gap-4 md:gap-6 lg:gap-8 overflow-x-auto max-w-full lg:max-w-[600px] xl:max-w-[800px] 2xl:max-w-[1000px] pb-2 sm:pb-3 md:pb-4">
                       {/* Card 2: Luxury Collection's */}
            <Link to="/shop4-Allproductpage" className="relative w-[200px] sm:w-[220px] md:w-[250px] lg:w-[300px] xl:w-[433px] h-[150px] sm:h-[180px] md:h-[220px] lg:h-[450px] xl:h-[577px] rounded-lg overflow-hidden group cursor-pointer flex-shrink-0 block">
             <img 
               src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1754144737/public_assets_shop4/public_assets_shop4_Awesome3.svg" 
               alt="Luxury collection" 
               className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
             />
             
             {/* Hover overlay */}
             <div className="absolute inset-0 flex items-end justify-center">
               <div className="w-full h-[60px] sm:h-[80px] md:h-[100px] lg:h-[205px] xl:h-[205px] flex-shrink-0 rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[15px] border-2 border-[#BB9D7B] bg-[rgba(33,33,33,0.90)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-2 sm:p-3 md:p-4">
                 <div className="text-white text-center mb-2 sm:mb-3 md:mb-4">
                   <div className="text-[14px] sm:text-[18px] md:text-[22px] lg:text-[26px] xl:text-[32px] font-futura font-bold leading-tight mb-1 sm:mb-2">
                     Luxury Collection's
                   </div>
                 </div>
                 <div className="bg-[#BB9D7B] text-white font-poppins text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] font-semibold tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] uppercase px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-[15px] sm:rounded-[18px] md:rounded-[20px] lg:rounded-[25px] hover:bg-[#A88A6A] transition-colors duration-200">
                   SHOP NOW
                 </div>
               </div>
             </div>
             
             <div className="absolute bottom-2 sm:bottom-4 md:bottom-6 lg:bottom-8 xl:bottom-10 left-1/2 transform -translate-x-1/2 text-white group-hover:opacity-0 transition-opacity duration-300">
               <div className="text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] xl:text-[30px] font-futura font-bold text-white leading-normal whitespace-nowrap">Luxury Collection's</div>
             </div>
           </Link>

                                           {/* Card 3: Smart Collection's */}
            <Link to="/shop4-Allproductpage" className="relative w-[200px] sm:w-[220px] md:w-[250px] lg:w-[300px] xl:w-[433px] h-[150px] sm:h-[180px] md:h-[220px] lg:h-[450px] xl:h-[577px] rounded-lg overflow-hidden group cursor-pointer flex-shrink-0 block">
             <img 
               src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1754144737/public_assets_shop4/public_assets_shop4_Awesome4.svg" 
               alt="Smart collection" 
               className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
             />
             
             {/* Hover overlay */}
             <div className="absolute inset-0 flex items-end justify-center">
               <div className="w-full h-[60px] sm:h-[80px] md:h-[100px] lg:h-[205px] xl:h-[205px] flex-shrink-0 rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[15px] border-2 border-[#BB9D7B] bg-[rgba(33,33,33,0.90)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-2 sm:p-3 md:p-4">
                 <div className="text-white text-center mb-2 sm:mb-3 md:mb-4">
                   <div className="text-[14px] sm:text-[18px] md:text-[22px] lg:text-[26px] xl:text-[32px] font-futura font-bold leading-tight mb-1 sm:mb-2">
                     Smart Collection's
                   </div>
                 </div>
                 <div className="bg-[#BB9D7B] text-white font-poppins text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] font-semibold tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] uppercase px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-[15px] sm:rounded-[18px] md:rounded-[20px] lg:rounded-[25px] hover:bg-[#A88A6A] transition-colors duration-200">
                   SHOP NOW
                 </div>
               </div>
             </div>
            
             <div className="absolute bottom-2 sm:bottom-4 md:bottom-6 lg:bottom-8 xl:bottom-10 left-1/2 transform -translate-x-1/2 text-white group-hover:opacity-0 transition-opacity duration-300">
               <div className="text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] xl:text-[30px] font-futura font-bold text-white leading-normal whitespace-nowrap">Smart Collection's</div>
             </div>
           </Link>

                                           {/* Card 4: Hybrid Collection's */}
            <Link to="/shop4-Allproductpage" className="relative w-[200px] sm:w-[220px] md:w-[250px] lg:w-[300px] xl:w-[433px] h-[150px] sm:h-[180px] md:h-[220px] lg:h-[450px] xl:h-[577px] rounded-lg overflow-hidden group cursor-pointer flex-shrink-0 block">
             <img 
               src="https://res.cloudinary.com/do3vxz4gw/image/upload/v1754144737/public_assets_shop4/public_assets_shop4_Awesome5.svg" 
               alt="Hybrid collection" 
               className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-100"
             />
             
             {/* Hover overlay */}
             <div className="absolute inset-0 flex items-end justify-center">
               <div className="w-full h-[60px] sm:h-[80px] md:h-[100px] lg:h-[205px] xl:h-[205px] flex-shrink-0 rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[15px] border-2 border-[#BB9D7B] bg-[rgba(33,33,33,0.90)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-2 sm:p-3 md:p-4">
                 <div className="text-white text-center mb-2 sm:mb-3 md:mb-4">
                   <div className="text-[14px] sm:text-[18px] md:text-[22px] lg:text-[26px] xl:text-[32px] font-futura font-bold leading-tight mb-1 sm:mb-2">
                     Hybrid Collection's
                   </div>
                 </div>
                 <div className="bg-[#BB9D7B] text-white font-poppins text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px] font-semibold tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] uppercase px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-[15px] sm:rounded-[18px] md:rounded-[20px] lg:rounded-[25px] hover:bg-[#A88A6A] transition-colors duration-200">
                   SHOP NOW
                 </div>
               </div>
             </div>
            
           <div className="absolute bottom-2 sm:bottom-4 md:bottom-6 lg:bottom-8 xl:bottom-10 left-1/2 transform -translate-x-1/2 text-white group-hover:opacity-0 transition-opacity duration-300">
              <div className="text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] xl:text-[30px] font-futura font-bold text-white leading-normal whitespace-nowrap">Hybrid Collection's</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AwesomeCollection;