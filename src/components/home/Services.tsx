import React from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, Wallet, Headphones, Award } from 'lucide-react';

const Services: React.FC = () => {
  const { t } = useTranslation('common');

  const services = [
    {
      icon: <Truck className="w-10 h-10 md:w-12 md:h-12 text-white md:text-primary-600" />,
      title: t('services.freeShipping.title'),
      description: t('services.freeShipping.description')
    },
    {
      icon: <Wallet className="w-10 h-10 md:w-12 md:h-12 text-white md:text-primary-600" />,
      title: t('services.cashBack.title'),
      description: t('services.cashBack.description')
    },
    {
      icon: <Headphones className="w-10 h-10 md:w-12 md:h-12 text-white md:text-primary-600" />,
      title: t('services.support.title'),
      description: t('services.support.description')
    },
    {
      icon: <Award className="w-10 h-10 md:w-12 md:h-12 text-white md:text-primary-600" />,
      title: t('services.highQuality.title', { defaultValue: 'High Quality' }),
      description: t('services.highQuality.description', { defaultValue: 'Curated products you can trust' })
    }
  ];
  return (
    <div>
      <section className="pb-8 md:pb-8 bg-primary-600 md:bg-transparent py-6 md:py-0">
        <div className="container mx-auto px-4 xl:px-14">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-0 md:gap-4">
            {services.map((service, index) => {
              // Mobile: borders form a plus (vertical line between columns, horizontal between rows)
              const isLeftCol = index % 2 === 0;
              const isTopRow = index < 2;
              const mobileBorderR = isLeftCol ? 'border-r border-white/40' : '';
              const mobileBorderB = isTopRow ? 'border-b border-white/40' : '';
              const mdBorderReset = 'md:border-r-0 md:border-b-0';
              return (
              <div 
                key={index}
                className={`flex flex-col items-center text-center px-2 py-4 md:px-0 md:py-6 ${mobileBorderR} ${mobileBorderB} ${mdBorderReset} border-0 md:border md:border-gray-200 rounded-none md:rounded-lg bg-transparent md:bg-white hover:shadow-md transition-shadow`}
              >
                <div className="mb-2 md:mb-4">
                  {service.icon}
                </div>
                <h3 className="text-[14px] md:text-[18px] font-worksans font-semibold mb-0 md:mb-2 text-white md:text-black">
                  {service.title}
                </h3>
                <p className="hidden md:block text-gray-700 text-[14px] font-worksans">
                  {service.description}
                </p>
              </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* <div className="container mx-auto px-4 xl:px-14 my-20">
        <video
          autoPlay
          loop
          muted
          playsInline
            webkit-playsinline="true"
          className="rounded-lg shadow-lg w-full h-auto"
          style={{ height: '422px', objectFit: 'cover' }}
        >
          <source src="https://res.cloudinary.com/do3vxz4gw/video/upload/v1751691073/public_assets_videos/lp1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div> */}
    </div>
  );
};

export default Services;
