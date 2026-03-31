import { useEffect } from 'react';
import Hero from '../components/home/Hero';
import HeavyDiscountProducts from '../components/home/HeavyDiscountProducts';
import ConditionalFeaturedProducts from '../components/home/ConditionalFeaturedProducts';
import Categories from '../components/home/Categories';
import ConditionalPromoProducts from '../components/home/ConditionalPromoProducts';
import TrendingDeals from '../components/home/TrendingDeals';
import Services from '../components/home/Services';
import NewSection from '../components/home/NewSection';
import HomepageProducts from '../components/home/HomepageProducts';
import NewProductCarousel from '../components/home/NewProductCarousel';
import ShopFromReel from '../components/home/ShopFromReel';
import Testimonials from '../components/home/Testimonials';

const Home = () => {
  // #region agent log
  useEffect(() => {
    const t = performance.now();
    fetch('http://127.0.0.1:7247/ingest/59cab846-9e60-4704-8103-2f60eefca997',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f7305f'},body:JSON.stringify({sessionId:'f7305f',location:'Home.tsx:useEffect',message:'home_mounted',data:{t},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
  }, []);
  // #endregion

  return (
    <div className="pb-10">
      <div className="nav:pt-4">
        <div className="flex flex-col gap-2 nav:gap-8">
          {/* Mobile: Categories first (order-1). Desktop: Hero first (nav:order-1), Categories second (nav:order-2). Rest of content after both (order-3). */}
          <div className="order-1 nav:order-2">
            <Categories />
          </div>
          <div className="order-2 nav:order-1">
            <Hero />
          </div>
          <div className="order-3 flex flex-col gap-8 nav:gap-16">
            <HeavyDiscountProducts />
            {/* <ConditionalFeaturedProducts /> */}
            {/* <ConditionalPromoProducts /> */}
            <NewProductCarousel />
         
            <TrendingDeals />
            <NewSection />
            <HomepageProducts />
            <ShopFromReel />
            <Testimonials />
            <Services />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;