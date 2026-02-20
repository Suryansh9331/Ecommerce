import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigationType, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/common/Navbar';
import Shop1Header from './components/shop/shop1/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ShopProducts from './pages/ShopProducts';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ShippingMethods from './pages/ShippingMethods';
import Shop1LandingPage from './pages/Shop1LandingPage';
import Shop1About from './pages/shop1/About';
import Shop1Services from './pages/shop1/Services';
import Shop2LandingPage from './pages/Shop2LandingPage';
import Shop3LandingPage from './pages/Shop3LandingPage';
import Shop4LandingPage from './pages/Shop4LandingPage';
import VerificationPending from './pages/auth/VerificationPending';
import TrendyDealsPage from './pages/TrendyDealsPage';
import Shop1Wishlist from './pages/Shop/Shop1Wishlist';
import Shop2Wishlist from './pages/Shop/Shop2Wishlist';
import Shop3Wishlist from './pages/Shop/Shop3Wishlist';
import Shop4Wishlist from './pages/Shop/Shop4Wishlist';
import { Shop1Cart, Shop2Cart, Shop3Cart, Shop4Cart } from './pages/Shop/ShopCartWrapper';
import { Shop1Order, Shop2Order, Shop3Order, Shop4Order } from './pages/Shop/ShopOrderWrapper';
import { Shop1OrderConfirmation, Shop2OrderConfirmation, Shop3OrderConfirmation, Shop4OrderConfirmation } from './pages/Shop/ShopOrderConfirmationWrapper';
import { Shop1OrderDetail, Shop2OrderDetail, Shop3OrderDetail, Shop4OrderDetail } from './pages/Shop/ShopOrderDetailWrapper';
import PasswordReset from './pages/auth/PasswordReset';
import VerifyEmail from './pages/auth/VerifyEmail';
import RequestPasswordReset from './pages/auth/RequestPasswordReset';

import Register from './pages/auth/Register';
import WishList from './pages/WishList';
import Games from './pages/Games';

// import Wholesale from './pages/Wholesale';

import BecomeMerchant from './pages/BecomeMerchant';
import Order from './pages/Order';
import TrackOrder from './pages/TrackOrder';
import NewProduct from './pages/NewProduct';
import BusinessLogin from './pages/auth/BusinessLogin';
import RegisterBusiness from './pages/auth/RegisterBusiness';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AdminLayout from './components/business/AdminLayout';

import Dashboard from "./pages/superadmin/Dashboard";
import UserActivity from './pages/superadmin/UserActivity';
import UserManagement from './pages/superadmin/Usermanagement';
import ContentModeration from './pages/superadmin/ContentModeration';
import ProductMonitoring from './pages/superadmin/ProductMonitoring';
import Settings from './pages/superadmin/Settings';
import RefundAndReturnManagement from './pages/superadmin/RefundAndReturnManagement';
import Promotions from './pages/superadmin/Promotions';

import TrafficAnalytics from './pages/superadmin/TrafficAnalytics';
import SalesReportPage from './pages/superadmin/SalesReport';
import FraudDetection from './pages/superadmin/FraudDetection';
import MarketplaceHealth from './pages/superadmin/MarketplaceHealth';
import PlatformPerformance from './pages/superadmin/PlatformPerformance';
import MerchantManagement from './pages/superadmin/MerchantManagement';
import Notification from './pages/superadmin/Notifications';
import GSTRuleManagement from './pages/superadmin/GSTRuleManagement';
import Categories from './pages/superadmin/Categories';
import Attribute from './pages/superadmin/Attribute';
import BrandCreation from './pages/superadmin/BrandCreation';
import HomepageSettings from './pages/superadmin/HomepageSettings';
import Shop1Productpage from './pages/Shop1Productpage';
import Shop2Productpage from './pages/Shop2Productpage';
import Shop3ProductPage from './pages/Shop3ProductPage';
import Shop4Productpage from './pages/Shop4Productpage';
import Shop1AllProductpage from './pages/Shop1AllProductpage';
import Shop2AllProductpage from './pages/Shop2AllProductpage';
import Shop3AllProductpage from './pages/Shop3AllProductpage';
import Shop4AllProductpage from './pages/Shop4AllProductpage';
import FAQ from './pages/FAQ';
  // Shop4 Footer Pages
  import Shop4ShippingDelivery from './pages/shop4/ShippingDelivery';
  import Shop4ReturnsRefunds from './pages/shop4/ReturnsRefunds';
  import Shop4GiftWrapping from './pages/shop4/GiftWrapping';
  import Shop4FollowYourOrder from './pages/shop4/FollowYourOrder';
  import Shop4Stores from './pages/shop4/Stores';
  import Shop4AboutUs from './pages/shop4/AboutUs';
  import Shop4FAQ from './pages/shop4/FAQ';
  import Shop4SizeCharts from './pages/shop4/SizeCharts';
  import Shop4GiftCards from './pages/shop4/GiftCards';
  import Shop4GeneralInquiries from './pages/shop4/GeneralInquiries';
  // Shop3 Footer Pages
  import ManCollection from './pages/shop3/ManCollection';
  import WomanCollection from './pages/shop3/WomanCollection';
  import KidsCollection from './pages/shop3/KidsCollection';
  import RefundShop3 from './pages/shop3/Refund';
  import SizeChart from './pages/shop3/SizeChart';
  import Blog from './pages/shop3/Blog';
  import AboutShop3 from './pages/shop3/About';

// Shop2 Footer Pages
import Shop2ShippingDelivery from './pages/shop2/ShippingDelivery';
import ReturnsRefunds from './pages/shop2/ReturnsRefunds';
import GiftWrapping from './pages/shop2/GiftWrapping';
import FollowYourOrder from './pages/shop2/FollowYourOrder';
import Stores from './pages/shop2/Stores';
import AboutUs from './pages/shop2/AboutUs';
import FAQShop2 from './pages/shop2/FAQ';
import SizeCharts from './pages/shop2/SizeCharts';
import GiftCards from './pages/shop2/GiftCards';
import TermsPrivacy from './pages/shop2/TermsPrivacy';
import GeneralInquiries from './pages/shop2/GeneralInquiries';

import Contact from './pages/Contact';
import ShippingPolicy from './pages/ShippingPolicy';
import Returns from './pages/Returns';
import Privacy from './pages/Privacy';
import CookiesPage from './pages/Cookies';
import Terms from './pages/Terms';
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout';
import MerchantDetails from './pages/superadmin/MerchantDetails';
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin';
import Profile from './pages/superadmin/Profile';
import Shops from './pages/superadmin/shop-management/Shops';
import ShopCategories from './pages/superadmin/shop-management/ShopCategories';
import ShopBrands from './pages/superadmin/shop-management/ShopBrands';
import ShopAttributes from './pages/superadmin/shop-management/ShopAttributes';
import AdminShopProducts from './pages/superadmin/shop-management/ShopProducts';
import ShopGSTManagement from './components/superadmin/shop/ShopGSTManagement';
import YouTubeManagement from './pages/superadmin/YouTubeManagement';
import Brands from './components/home/brands';
import Inventory from './pages/business/Inventory';
import VerificationStatus from './pages/business/VerificationStatus';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CancellationPolicy from './pages/CancellationPolicy';
import ReturnRefund from './pages/ReturnRefund';
import ShippingDelivery from './pages/ShippingDelivery';
import UserProfile from './pages/UserProfile';
import PaymentPolicy from './pages/PaymentPolicy';
import ReplacementPolicy from './pages/ReplacementPolicy';
import MerchantNDA from './pages/MerchantNDA';
import PaymentPage from './pages/PaymentPage';
import MessengerPopup from './components/MessengerPopup';
import Refund from './pages/Refund';
import Exchange from './pages/Exchange';
import Review from './pages/Review';
import LiveShop from './pages/LiveShop';
import FashionPage from './components/sections/Fashionpage';
import AoinLivePage from './components/sections/AoinLivePage';
import ComingSoonPage from './components/sections/ComingSoonPage';
import FashionFactoryPage from './components/sections/FashionFactoryPage';
import SundayFundayPage from './components/sections/SundayFundayPage';
import LiveShopProductDetailPage from './pages/LiveShopProductDetailPage';
import Reviews from './pages/business/Reviews';
import Sales from './pages/business/reports/Sales';
import CustomersReport from './pages/business/reports/CustomersReport';
import ProductsReport from './pages/business/reports/ProductsReport';
import Support from './pages/business/Support';
import Settingss from './pages/business/Settings';
import Profilee from './pages/business/Profile';
import { WishlistProvider } from './context/WishlistContext';
import { ShopWishlistProvider } from './context/ShopWishlistContext';
import { ShopCartProvider } from './context/ShopCartContext';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import Subscription from './pages/business/Subscription';

import FeaturedProductsPage from './pages/FeaturedProductsPage';
import PromoProductsPage from './pages/PromoProductsPage';
import HoliGiveawayPage from './pages/HoliGiveawayPage';

import UserSupport from './pages/superadmin/UserSupport';
import MerchantSupport from './pages/superadmin/MerchantSupport';
import RaiseTicket from './pages/RaiseTicket';

import { useVisitTracking } from './hooks/useVisitTracking';
import SearchResultsPage from './pages/SearchResultsPage';
import MerchantPaymentReport from './pages/superadmin/reports/MerchantPaymentReport';
import MerchantSubscription from './pages/MerchantSubscription';
import NewsletterSubscribers from './pages/superadmin/NewsletterSubscribers';

import Aoinlive from './pages/business/Aoinlive';
import LiveStreamView from './pages/LiveStreamView';
import ShopAnalytics from './pages/superadmin/shop/ShopAnalytics';
import ShopInventoryManagement from './pages/superadmin/shop/ShopInventoryManagement';
import ShopOrders from './pages/superadmin/shop/ShopOrders';
import OrderManagementPage from './pages/superadmin/shop/OrderManagementPage';
import ShopReviews from './pages/superadmin/shop/ShopReviews';
import { useTranslation } from 'react-i18next';

// Lazy-loaded business dashboard pages
const BusinessDashboard = lazy(() => import('./pages/business/Dashboard'));
const BusinessProducts = lazy(() => import('./pages/business/catalog/Products'));
const BusinessOrders = lazy(() => import('./pages/business/Orders'));
const BusinessOrderDetail = lazy(() => import('./pages/business/OrderDetail'));
const BusinessCustomers = lazy(() => import('./pages/business/Customers'));
const Verification = lazy(() => import('./pages/business/Verification'));
const ProductPlacements = lazy(() => import('./pages/business/ProductPlacements'));
const DimensionPresets = lazy(() => import('./pages/business/DimensionPresets'));

// Lazy-loaded catalog pages
const CatalogProducts = lazy(() => import('./pages/business/catalog/Products'));
const AddProducts = lazy(() => import('./pages/business/catalog/product/steps/AddProducts'));
const EditProduct = lazy(() => import('./pages/business/catalog/product/components/EditProduct'));

const LoadingFallback = () => (
  <div className="w-full h-full min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

// Custom hook for scroll management
const useScrollToTop = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Force scroll reset on every navigation
    const resetScroll = () => {
      // Reset scroll position using multiple methods for maximum compatibility
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      // Force layout recalculation
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 0);
    };

    // Reset scroll immediately
    resetScroll();

    // Reset scroll again after a short delay to ensure it works
    const timeoutId = setTimeout(resetScroll, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, navigationType]);
};

// ScrollToTop component to handle scroll behavior
const ScrollToTop = () => {
  useScrollToTop();
  return null;
};

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Create a wrapper component for visit tracking
const VisitTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { markAsConverted } = useVisitTracking();

  // Add this to your login/signup success handler
  const handleAuthSuccess = (userId: string) => {
    markAsConverted(userId);
    // ... rest of your auth success handling
  };

  return <>{children}</>;
};

// Main App component
const App: React.FC = () => {
  // #region agent log
  const _appRenderT = performance.now();
  fetch('http://127.0.0.1:7247/ingest/59cab846-9e60-4704-8103-2f60eefca997',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f7305f'},body:JSON.stringify({sessionId:'f7305f',location:'App.tsx:render',message:'app_render_start',data:{t:_appRenderT},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.dir = 'ltr';
  }, [i18n.language]);
  // #region agent log
  useEffect(() => {
    const t = performance.now();
    fetch('http://127.0.0.1:7247/ingest/59cab846-9e60-4704-8103-2f60eefca997',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f7305f'},body:JSON.stringify({sessionId:'f7305f',location:'App.tsx:useEffect',message:'app_mounted',data:{t,deltaFromRender:Math.round(t-_appRenderT)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  }, []);
  // #endregion
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ShopWishlistProvider>
              <ShopCartProvider>
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <Router>
              <VisitTracker>
                <ScrollToTop />
                <div className="flex flex-col min-h-screen overflow-x-hidden w-full">
                   <Routes>
                      <Route path="/shop1" element={<Shop1LandingPage />} />
                      <Route path="/shop1/about" element={<Shop1About />} />
                      <Route path="/shop1/services" element={<Shop1Services />} />
                      <Route path="/shop1/product/:id" element={<Shop1Productpage />} />
                      <Route path="/shop1/wishlist" element={<Shop1Wishlist />} />
                    <Route path="/shop2" element={<Shop2LandingPage />} />
                    <Route path="/shop2/product/:productId" element={<Shop2Productpage />} />
                    <Route path="/shop2/wishlist" element={<Shop2Wishlist />} />
                    
                    {/* Shop2 Footer Pages */}
                    <Route path="/shop2/shipping-delivery" element={<Shop2ShippingDelivery />} />
                    <Route path="/shop2/returns-refunds" element={<ReturnsRefunds />} />
                    <Route path="/shop2/gift-wrapping" element={<GiftWrapping />} />
                    <Route path="/shop2/follow-your-order" element={<FollowYourOrder />} />
                    <Route path="/shop2/stores" element={<Stores />} />
                    <Route path="/shop2/about-us" element={<AboutUs />} />
                    <Route path="/shop2/faq" element={<FAQShop2 />} />
                    <Route path="/shop2/size-charts" element={<SizeCharts />} />
                    <Route path="/shop2/gift-cards" element={<GiftCards />} />
                    <Route path="/shop2/terms-privacy" element={<TermsPrivacy />} />
                    <Route path="/shop2/general-inquiries" element={<GeneralInquiries />} />
                    <Route path="/shop3" element={<Shop3LandingPage />} />
                    <Route path="/shop3/wishlist" element={<Shop3Wishlist />} />
                    {/* Shop3 Footer Pages */}
                    <Route path="/shop3/man" element={<ManCollection />} />
                    <Route path="/shop3/woman" element={<WomanCollection />} />
                    <Route path="/shop3/kids" element={<KidsCollection />} />
                    <Route path="/shop3/refund" element={<RefundShop3 />} />
                    <Route path="/shop3/size-chart" element={<SizeChart />} />
                    <Route path="/shop3/blog" element={<Blog />} />
                    <Route path="/shop3/about" element={<AboutShop3 />} />
                    <Route path="/shop1-productpage" element={<Shop1Productpage />} />
                    <Route path="/shop2-productpage" element={<Shop2Productpage />} />
                    <Route path="/shop3-productpage" element={<Shop3ProductPage />} />
                    <Route path="/shop1-allproductpage" element={<Shop1AllProductpage />} />
                    <Route path="/shop2-allproductpage" element={<Shop2AllProductpage />} />
                    <Route path="/shop3-allproductpage" element={<Shop3AllProductpage />} />
                    <Route path="/shop4" element={<Shop4LandingPage />} />
                    <Route path="/shop4-productpage" element={<Shop4Productpage />} />
                    <Route path="/shop4-allproductpage" element={<Shop4AllProductpage />} />
                    <Route path="/shop4/wishlist" element={<Shop4Wishlist />} />
                    {/* Shop4 Footer Pages */}
                    <Route path="/shop4/shipping-delivery" element={<Shop4ShippingDelivery />} />
                    <Route path="/shop4/returns-refunds" element={<Shop4ReturnsRefunds />} />
                    <Route path="/shop4/gift-wrapping" element={<Shop4GiftWrapping />} />
                    <Route path="/shop4/follow-your-order" element={<Shop4FollowYourOrder />} />
                    <Route path="/shop4/stores" element={<Shop4Stores />} />
                    <Route path="/shop4/about-us" element={<Shop4AboutUs />} />
                    <Route path="/shop4/faq" element={<Shop4FAQ />} />
                    <Route path="/shop4/size-charts" element={<Shop4SizeCharts />} />
                    <Route path="/shop4/gift-cards" element={<Shop4GiftCards />} />
                    <Route path="/shop4/general-inquiries" element={<Shop4GeneralInquiries />} />
                    
                    {/* Shop Cart Routes */}
                    <Route path="/shop1/cart" element={<Shop1Cart />} />
                    <Route path="/shop2/cart" element={<Shop2Cart />} />
                    <Route path="/shop3/cart" element={<Shop3Cart />} />
                    <Route path="/shop4/cart" element={<Shop4Cart />} />
                    
                    {/* Shop Order Routes */}
                    <Route path="/shop1/order" element={<Shop1Order />} />
                    <Route path="/shop2/order" element={<Shop2Order />} />
                    <Route path="/shop3/order" element={<Shop3Order />} />
                    <Route path="/shop4/order" element={<Shop4Order />} />
                    <Route path="/shop1/order-confirmation" element={<Shop1OrderConfirmation />} />
                    <Route path="/shop2/order-confirmation" element={<Shop2OrderConfirmation />} />
                    <Route path="/shop3/order-confirmation" element={<Shop3OrderConfirmation />} />
                    <Route path="/shop4/order-confirmation" element={<Shop4OrderConfirmation />} />
                    
                    <Route
                      path="/business/login"
                      element={<BusinessLogin />}
                    />
                    <Route
                      path="/register-business"
                      element={<RegisterBusiness />}
                    />
                    <Route
                      path="/request-password-reset"
                      element={<RequestPasswordReset />}
                    />
                    <Route path="/superadmin/login" element={<SuperAdminLogin />} />
                    {/* Business Dashboard Routes */}
                    <Route path="/business" element={<AdminLayout />}>
                      <Route
                        index
                        element={<Navigate to="/business/dashboard" replace />}
                      />
                      <Route
                        path="dashboard"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <BusinessDashboard />
                          </Suspense>
                        }
                      />
                      <Route
                        path="subscription"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <Subscription />
                          </Suspense>
                        }
                      />
                      <Route
                        path="products"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <BusinessProducts />
                          </Suspense>
                        }
                      />
                      <Route
                        path="inventory"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <Inventory />
                          </Suspense>
                        }
                      />
                      <Route
                        path="verification"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <Verification />
                          </Suspense>
                        }
                      />
                      <Route
                        path="verification-pending"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <VerificationStatus />
                          </Suspense>
                        }
                      />
                      <Route
                        path="orders"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <BusinessOrders />
                          </Suspense>
                        }
                      />
                      <Route
                        path="orders/:orderId"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <BusinessOrderDetail />
                          </Suspense>
                        }
                      />
                      <Route
                        path="customers"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <BusinessCustomers />
                          </Suspense>
                        }
                      />
                      <Route
                        path="reviews"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <Reviews />
                          </Suspense>
                        }
                      />

                      <Route
                        path="reports/sales"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <Sales />
                          </Suspense>
                        }
                      />

                      <Route
                        path="reports/customers"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <CustomersReport />
                          </Suspense>
                        }
                      />

                      <Route
                        path="reports/products"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <ProductsReport />
                          </Suspense>
                        }
                      />

                      <Route
                        path="settings"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <Settingss />
                          </Suspense>
                        }
                      />

                      <Route
                        path="support"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <Support />
                          </Suspense>
                        }
                      />

                      <Route
                        path="profile"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <Profilee />
                          </Suspense>
                        }
                      />

                      {/* Catalog Routes */}
                      <Route path="catalog">
                        <Route
                          path="products"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <CatalogProducts />
                            </Suspense>
                          }
                        />
                        <Route
                          path="aoinlive"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Aoinlive />
                            </Suspense>
                          }
                        />
                        <Route
                          path="product/new"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <AddProducts />
                            </Suspense>
                          }
                        />
                        <Route
                          path="product/:id/view"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <AddProducts mode="view" />
                            </Suspense>
                          }
                        />
                        <Route
                          path="product/:id/edit"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <EditProduct />
                            </Suspense>
                          }
                        />
                      </Route>

                      <Route
                        path="product-placements"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <ProductPlacements />
                          </Suspense>
                        }
                      />
                      <Route
                        path="dimension-presets"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <DimensionPresets />
                          </Suspense>
                        }
                      />
                    </Route>

                    {/* Superadmin Routes - Protected by role check in the component */}
                    <Route path="/superadmin" element={<SuperAdminLayout />}>
                      <Route
                        index
                        element={<Navigate to="/superadmin/dashboard" replace />}
                      />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route
                        path="user-report"
                        element={<UserActivity />}
                      />
                      <Route path="users" element={<UserManagement />} />

                      <Route path="content-moderation" element={<ContentModeration />} />
                      <Route path="products" element={<ProductMonitoring />} />
                      <Route path="site-report" element={<TrafficAnalytics />} />

                    <Route path="sales-report" element={<SalesReportPage />} />
                    <Route path="fraud-detection" element={<FraudDetection />} />
                    <Route
                      path="marketplace-health"
                      element={<MarketplaceHealth />}
                    />
                    <Route
                      path="merchant-payment-report"
                      element={<MerchantPaymentReport />}
                    />
                    <Route
                      path="performance"
                      element={<PlatformPerformance />}
                    />
                    <Route
                      path="merchants"
                      element={<MerchantManagement />}
                    />
                    <Route
                      path="merchant-management/:id"
                      element={<MerchantDetails />}
                    />
                    <Route path="categories" element={<Categories />} />
                    <Route path="brands" element={<BrandCreation />} />
                    <Route path="attribute" element={<Attribute />} />
                    <Route path="homepages" element={<HomepageSettings />} />
                    <Route path="user-support" element={<UserSupport />} />
                    <Route path="merchant-support" element={<MerchantSupport />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="refund-and-return" element={<RefundAndReturnManagement />} />
                    <Route path="promotions" element={<Promotions />} />
                    <Route path="gst-management" element={<GSTRuleManagement />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="order-management" element={<ShopOrders />} />
                    <Route path="order-management/:orderId" element={<OrderManagementPage />} />
                    <Route path="shop/reviews/:shopId" element={<ShopReviews />} />

                    <Route path="shop-analytics" element={<ShopAnalytics />} />
                    <Route path="newsletter-subscribers" element={<NewsletterSubscribers />} />


                    {/* Shop Management Routes */}
                    <Route path="shops" element={<Shops />} />
                    <Route path="shop-categories" element={<ShopCategories />} />
                    <Route path="shop-brands" element={<ShopBrands />} />
                    <Route path="shop-attributes" element={<ShopAttributes />} />
                    <Route path="shop-products" element={<AdminShopProducts />} />
                    <Route path="shop-inventory" element={<ShopInventoryManagement />} />
                    <Route path="shop/gst-management" element={<ShopGSTManagement />} />
                    <Route path="merchant-subscriptions" element={<MerchantSubscription />} />
                    <Route path="youtube-integration" element={<YouTubeManagement />} />
                    
                  </Route>

                    {/* Public Routes with header/footer */}
                    <Route
                      path="/*"
                      element={
                        <>
                          <Navbar />
                          <main className="flex-grow content-container">
                            <Routes>
                              <Route path="/" element={<Home />} />
                              <Route path="/all-products" element={<Products />} />
                              <Route path="/featured-products" element={<FeaturedProductsPage />} />
                              <Route path="/promo-products" element={<PromoProductsPage />} />
                              <Route path="/trendy-deals" element={<TrendyDealsPage />} />
                              <Route path="/holi-giveaway" element={<HoliGiveawayPage />} />
                              <Route path="/shop/:shopId" element={<ShopProducts />} />
                              <Route path="/products/:categoryId" element={<Products />} />
                              <Route path="/product/:productId" element={<ProductDetail />} />
                              <Route path="/new-product" element={<NewProduct />} />
                              <Route path="/cart" element={<Cart />} />
                              <Route path="/payment" element={<PaymentPage />} />
                              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                              {/* Shop order details (public) */}
                              <Route path="/shop1/order/:orderId" element={<Shop1OrderDetail />} />
                              <Route path="/shop2/order/:orderId" element={<Shop2OrderDetail />} />
                              <Route path="/shop3/order/:orderId" element={<Shop3OrderDetail />} />
                              <Route path="/shop4/order/:orderId" element={<Shop4OrderDetail />} />
                              <Route path="/search" element={<SearchResultsPage />} />
                              <Route path="/search/:query" element={<Products />} />

                              {/* These routes will have Navbar and Footer */}
                              <Route path="/signup" element={<SignUp />} />
                              <Route
                                path="/verification-pending"
                                element={<VerificationPending />}
                              />
                              <Route path="settings" element={<Settingss />} />
                              <Route
                                path="/verify-email/:token"
                                element={<VerifyEmail />}
                              />


                              <Route
                                path="/password/reset"
                                element={<PasswordReset />}
                              />


                              <Route path="/wishlist" element={<WishList />} />
                              <Route path="/games" element={<Games />} />

                              {/* <Route path="/wholesale" element={<Wholesale />} /> */}

                              <Route path="/sign-in" element={<SignIn />} />
                              <Route path="/register" element={<Register />} />

                              <Route
                                path="/become-merchant"
                                element={<BecomeMerchant />}
                              />
                              <Route path="/orders" element={<Order />} />
                              <Route path="/track-order" element={<TrackOrder />} />
                              <Route path="/track/:orderId" element={<TrackOrder />} />
                              <Route path="/refund/:orderId" element={<Refund />} />
                              <Route path="/exchange/:orderId" element={<Exchange />} />
                              <Route path="/review/:orderId" element={<Review />} />
                              <Route
                                path="/categories/:categoryId"
                                element={<Products />}
                              />
                              <Route
                                path="/categories/:categoryId/:brandId"
                                element={<Products />}
                              />
                              <Route path="/faq" element={<FAQ />} />
              
                              <Route path="/contact" element={<Contact />} />
                              <Route
                                path="/shipping"
                                element={<ShippingPolicy />}
                              />
                              <Route path="/returns" element={<Returns />} />
                              <Route path="/privacy" element={<Privacy />} />
                              <Route path="/cookies" element={<CookiesPage />} />
                              <Route path="/terms" element={<Terms />} />
                              <Route
                                path="/privacy-policy"
                                element={<PrivacyPolicy />}
                              />
                              <Route
                                path="/cancellation-policy"
                                element={<CancellationPolicy />}
                              />
                              <Route
                                path="/return-refund"
                                element={<ReturnRefund />}
                              />
                              <Route
                                path="/shipping-delivery"
                                element={<ShippingDelivery />}
                              />
                              <Route
                                path="/payment-policy"
                                element={<PaymentPolicy />}
                              />
                              <Route
                                path="/privacy-policy"
                                element={<PrivacyPolicy />}
                              />
                              <Route
                                path="/replacement-policy"
                                element={<ReplacementPolicy />}
                              />
                              <Route
                                path="/merchant-nda"
                                element={<MerchantNDA />}
                              />
                              <Route path="/RaiseTicket" element={<RaiseTicket />} />
                              <Route path="/brands/:brandId" element={<Brands />} />
                              <Route path="/profile" element={<UserProfile />} />
                              <Route path="/live-shop" element={<LiveShop />} />
                              <Route path="/live-shop/fashion" element={<FashionPage />} />
                              <Route path="/live-shop/aoin-live" element={<AoinLivePage />} />
                              <Route path="/live-shop/coming-soon" element={<ComingSoonPage />} />
                              <Route path="/live-shop/fashion-factory" element={<FashionFactoryPage />} />
                              <Route path="/live-shop/sunday-funday" element={<SundayFundayPage />} />
                              <Route path="/live-shop/product/:productId" element={<LiveShopProductDetailPage />} />
                              <Route path="/shipping-methods" element={<ShippingMethods />} />
                              <Route path="/live-shop/:streamId" element={<LiveStreamView />} />
                            </Routes>
                          </main>
                          <Footer />
                        </>
                      }
                    />
                    {/* Add this route outside of /business and /superadmin, so it's public */}

                  </Routes>
                </div>
                {/* Add MessengerPopup here, outside of routes so it appears on all pages */}
                <MessengerPopup />
              </VisitTracker>
            </Router>

            <Toaster
              position="bottom-center"
              toastOptions={{
                style: {
                  background: "#FFEDD5",        // Tailwind orange-100 (soft warm background)
                  color: "#EA580C",             // Tailwind orange-600 (professional tone)
                  padding: "12px 20px",
                  borderRadius: "0.5rem",       // rounded-lg for softer edges
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // soft neutral shadow
                  fontWeight: "500",            // medium weight for readability
                  fontSize: "0.875rem",         // text-sm
                  minWidth: "260px",
                  textAlign: "center",
                  border: "1px solid #FDBA74",  // subtle border using orange-300
                },
                success: {
                  duration: 3000,
                },
                error: {
                  duration: 4000,
                },
              }}
            />
          </GoogleOAuthProvider>
              </ShopCartProvider>
            </ShopWishlistProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
    </ToastProvider>
  );
};

export default App;