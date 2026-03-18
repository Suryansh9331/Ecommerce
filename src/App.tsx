import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import MessengerPopup from './components/MessengerPopup';
import AdminLayout from './components/business/AdminLayout';
import CreatorLayout from './pages/creator/CreatorLayout';
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { WishlistProvider } from './context/WishlistContext';
import { ShopWishlistProvider } from './context/ShopWishlistContext';
import { ShopCartProvider } from './context/ShopCartContext';

import { useVisitTracking } from './hooks/useVisitTracking';
import { useTranslation } from 'react-i18next';

// Lazy-loaded pages — shop landing & product pages
const Shop1LandingPage = lazy(() => import('./pages/Shop1LandingPage'));
const Shop1About = lazy(() => import('./pages/shop1/About'));
const Shop1Services = lazy(() => import('./pages/shop1/Services'));
const Shop1Productpage = lazy(() => import('./pages/Shop1Productpage'));
const Shop1AllProductpage = lazy(() => import('./pages/Shop1AllProductpage'));
const Shop2LandingPage = lazy(() => import('./pages/Shop2LandingPage'));
const Shop2Productpage = lazy(() => import('./pages/Shop2Productpage'));
const Shop2AllProductpage = lazy(() => import('./pages/Shop2AllProductpage'));
const Shop3LandingPage = lazy(() => import('./pages/Shop3LandingPage'));
const Shop3ProductPage = lazy(() => import('./pages/Shop3ProductPage'));
const Shop3AllProductpage = lazy(() => import('./pages/Shop3AllProductpage'));
const Shop4LandingPage = lazy(() => import('./pages/Shop4LandingPage'));
const Shop4Productpage = lazy(() => import('./pages/Shop4Productpage'));
const Shop4AllProductpage = lazy(() => import('./pages/Shop4AllProductpage'));

const Shop1Wishlist = lazy(() => import('./pages/Shop/Shop1Wishlist'));
const Shop2Wishlist = lazy(() => import('./pages/Shop/Shop2Wishlist'));
const Shop3Wishlist = lazy(() => import('./pages/Shop/Shop3Wishlist'));
const Shop4Wishlist = lazy(() => import('./pages/Shop/Shop4Wishlist'));

const Shop1Cart = lazy(() => import('./pages/Shop/ShopCartWrapper').then((m) => ({ default: m.Shop1Cart })));
const Shop2Cart = lazy(() => import('./pages/Shop/ShopCartWrapper').then((m) => ({ default: m.Shop2Cart })));
const Shop3Cart = lazy(() => import('./pages/Shop/ShopCartWrapper').then((m) => ({ default: m.Shop3Cart })));
const Shop4Cart = lazy(() => import('./pages/Shop/ShopCartWrapper').then((m) => ({ default: m.Shop4Cart })));

const Shop1Order = lazy(() => import('./pages/Shop/ShopOrderWrapper').then((m) => ({ default: m.Shop1Order })));
const Shop2Order = lazy(() => import('./pages/Shop/ShopOrderWrapper').then((m) => ({ default: m.Shop2Order })));
const Shop3Order = lazy(() => import('./pages/Shop/ShopOrderWrapper').then((m) => ({ default: m.Shop3Order })));
const Shop4Order = lazy(() => import('./pages/Shop/ShopOrderWrapper').then((m) => ({ default: m.Shop4Order })));

const Shop1OrderConfirmation = lazy(() => import('./pages/Shop/ShopOrderConfirmationWrapper').then((m) => ({ default: m.Shop1OrderConfirmation })));
const Shop2OrderConfirmation = lazy(() => import('./pages/Shop/ShopOrderConfirmationWrapper').then((m) => ({ default: m.Shop2OrderConfirmation })));
const Shop3OrderConfirmation = lazy(() => import('./pages/Shop/ShopOrderConfirmationWrapper').then((m) => ({ default: m.Shop3OrderConfirmation })));
const Shop4OrderConfirmation = lazy(() => import('./pages/Shop/ShopOrderConfirmationWrapper').then((m) => ({ default: m.Shop4OrderConfirmation })));

const Shop1OrderDetail = lazy(() => import('./pages/Shop/ShopOrderDetailWrapper').then((m) => ({ default: m.Shop1OrderDetail })));
const Shop2OrderDetail = lazy(() => import('./pages/Shop/ShopOrderDetailWrapper').then((m) => ({ default: m.Shop2OrderDetail })));
const Shop3OrderDetail = lazy(() => import('./pages/Shop/ShopOrderDetailWrapper').then((m) => ({ default: m.Shop3OrderDetail })));
const Shop4OrderDetail = lazy(() => import('./pages/Shop/ShopOrderDetailWrapper').then((m) => ({ default: m.Shop4OrderDetail })));

// Shop2 footer
const Shop2ShippingDelivery = lazy(() => import('./pages/shop2/ShippingDelivery'));
const ReturnsRefunds = lazy(() => import('./pages/shop2/ReturnsRefunds'));
const GiftWrapping = lazy(() => import('./pages/shop2/GiftWrapping'));
const FollowYourOrder = lazy(() => import('./pages/shop2/FollowYourOrder'));
const Stores = lazy(() => import('./pages/shop2/Stores'));
const AboutUs = lazy(() => import('./pages/shop2/AboutUs'));
const FAQShop2 = lazy(() => import('./pages/shop2/FAQ'));
const SizeCharts = lazy(() => import('./pages/shop2/SizeCharts'));
const GiftCards = lazy(() => import('./pages/shop2/GiftCards'));
const TermsPrivacy = lazy(() => import('./pages/shop2/TermsPrivacy'));
const GeneralInquiries = lazy(() => import('./pages/shop2/GeneralInquiries'));

// Shop3 footer
const ManCollection = lazy(() => import('./pages/shop3/ManCollection'));
const WomanCollection = lazy(() => import('./pages/shop3/WomanCollection'));
const KidsCollection = lazy(() => import('./pages/shop3/KidsCollection'));
const RefundShop3 = lazy(() => import('./pages/shop3/Refund'));
const SizeChart = lazy(() => import('./pages/shop3/SizeChart'));
const Blog = lazy(() => import('./pages/shop3/Blog'));
const AboutShop3 = lazy(() => import('./pages/shop3/About'));

// Shop4 footer
const Shop4ShippingDelivery = lazy(() => import('./pages/shop4/ShippingDelivery'));
const Shop4ReturnsRefunds = lazy(() => import('./pages/shop4/ReturnsRefunds'));
const Shop4GiftWrapping = lazy(() => import('./pages/shop4/GiftWrapping'));
const Shop4FollowYourOrder = lazy(() => import('./pages/shop4/FollowYourOrder'));
const Shop4Stores = lazy(() => import('./pages/shop4/Stores'));
const Shop4AboutUs = lazy(() => import('./pages/shop4/AboutUs'));
const Shop4FAQ = lazy(() => import('./pages/shop4/FAQ'));
const Shop4SizeCharts = lazy(() => import('./pages/shop4/SizeCharts'));
const Shop4GiftCards = lazy(() => import('./pages/shop4/GiftCards'));
const Shop4GeneralInquiries = lazy(() => import('./pages/shop4/GeneralInquiries'));

// Auth & public
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ShopProducts = lazy(() => import('./pages/ShopProducts'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const SignIn = lazy(() => import('./pages/auth/SignIn'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));
const Register = lazy(() => import('./pages/auth/Register'));
const ShippingMethods = lazy(() => import('./pages/ShippingMethods'));
const VerificationPending = lazy(() => import('./pages/auth/VerificationPending'));
const TrendyDealsPage = lazy(() => import('./pages/TrendyDealsPage'));
const PasswordReset = lazy(() => import('./pages/auth/PasswordReset'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const RequestPasswordReset = lazy(() => import('./pages/auth/RequestPasswordReset'));
const BusinessLogin = lazy(() => import('./pages/auth/BusinessLogin'));
const RegisterBusiness = lazy(() => import('./pages/auth/RegisterBusiness'));
const SuperAdminLogin = lazy(() => import('./pages/superadmin/SuperAdminLogin'));

const WishList = lazy(() => import('./pages/WishList'));
const Games = lazy(() => import('./pages/Games'));
const BecomeMerchant = lazy(() => import('./pages/BecomeMerchant'));
const Order = lazy(() => import('./pages/Order'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const NewProduct = lazy(() => import('./pages/NewProduct'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));

const FeaturedProductsPage = lazy(() => import('./pages/FeaturedProductsPage'));
const PromoProductsPage = lazy(() => import('./pages/PromoProductsPage'));
const HoliGiveawayPage = lazy(() => import('./pages/HoliGiveawayPage'));

const Contact = lazy(() => import('./pages/Contact'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));
const Returns = lazy(() => import('./pages/Returns'));
const Privacy = lazy(() => import('./pages/Privacy'));
const CookiesPage = lazy(() => import('./pages/Cookies'));
const Terms = lazy(() => import('./pages/Terms'));
const FAQ = lazy(() => import('./pages/FAQ'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const CancellationPolicy = lazy(() => import('./pages/CancellationPolicy'));
const ReturnRefund = lazy(() => import('./pages/ReturnRefund'));
const ShippingDelivery = lazy(() => import('./pages/ShippingDelivery'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const PaymentPolicy = lazy(() => import('./pages/PaymentPolicy'));
const ReplacementPolicy = lazy(() => import('./pages/ReplacementPolicy'));
const MerchantNDA = lazy(() => import('./pages/MerchantNDA'));
const Refund = lazy(() => import('./pages/Refund'));
const Exchange = lazy(() => import('./pages/Exchange'));
const Review = lazy(() => import('./pages/Review'));
const RaiseTicket = lazy(() => import('./pages/RaiseTicket'));
const Brands = lazy(() => import('./components/home/brands'));

const LiveShop = lazy(() => import('./pages/LiveShop'));
const FashionPage = lazy(() => import('./components/sections/Fashionpage'));
const AoinLivePage = lazy(() => import('./components/sections/AoinLivePage'));
const ComingSoonPage = lazy(() => import('./components/sections/ComingSoonPage'));
const FashionFactoryPage = lazy(() => import('./components/sections/FashionFactoryPage'));
const SundayFundayPage = lazy(() => import('./components/sections/SundayFundayPage'));
const LiveShopProductDetailPage = lazy(() => import('./pages/LiveShopProductDetailPage'));
const LiveStreamView = lazy(() => import('./pages/LiveStreamView'));

// Business dashboard (lazy)
const BusinessDashboard = lazy(() => import('./pages/business/Dashboard'));
const BusinessProducts = lazy(() => import('./pages/business/catalog/Products'));
const BusinessOrders = lazy(() => import('./pages/business/Orders'));
const BusinessOrderDetail = lazy(() => import('./pages/business/OrderDetail'));
const BusinessCustomers = lazy(() => import('./pages/business/Customers'));
const Verification = lazy(() => import('./pages/business/Verification'));
const ProductPlacements = lazy(() => import('./pages/business/ProductPlacements'));
const DimensionPresets = lazy(() => import('./pages/business/DimensionPresets'));
const Subscription = lazy(() => import('./pages/business/Subscription'));
const Inventory = lazy(() => import('./pages/business/Inventory'));
const VerificationStatus = lazy(() => import('./pages/business/VerificationStatus'));
const Reviews = lazy(() => import('./pages/business/Reviews'));
const Sales = lazy(() => import('./pages/business/reports/Sales'));
const CustomersReport = lazy(() => import('./pages/business/reports/CustomersReport'));
const ProductsReport = lazy(() => import('./pages/business/reports/ProductsReport'));
const Support = lazy(() => import('./pages/business/Support'));
const Settingss = lazy(() => import('./pages/business/Settings'));
const Profilee = lazy(() => import('./pages/business/Profile'));
const Aoinlive = lazy(() => import('./pages/business/Aoinlive'));

const CatalogProducts = lazy(() => import('./pages/business/catalog/Products'));
const AddProducts = lazy(() => import('./pages/business/catalog/product/steps/AddProducts'));
const EditProduct = lazy(() => import('./pages/business/catalog/product/components/EditProduct'));

// Superadmin
const Dashboard = lazy(() => import('./pages/superadmin/Dashboard'));
const UserActivity = lazy(() => import('./pages/superadmin/UserActivity'));
const UserManagement = lazy(() => import('./pages/superadmin/Usermanagement'));
const ContentModeration = lazy(() => import('./pages/superadmin/ContentModeration'));
const ProductMonitoring = lazy(() => import('./pages/superadmin/ProductMonitoring'));
const Settings = lazy(() => import('./pages/superadmin/Settings'));
const RefundAndReturnManagement = lazy(() => import('./pages/superadmin/RefundAndReturnManagement'));
const Promotions = lazy(() => import('./pages/superadmin/Promotions'));
const TrafficAnalytics = lazy(() => import('./pages/superadmin/TrafficAnalytics'));
const SalesReportPage = lazy(() => import('./pages/superadmin/SalesReport'));
const FraudDetection = lazy(() => import('./pages/superadmin/FraudDetection'));
const MarketplaceHealth = lazy(() => import('./pages/superadmin/MarketplaceHealth'));
const PlatformPerformance = lazy(() => import('./pages/superadmin/PlatformPerformance'));
const MerchantManagement = lazy(() => import('./pages/superadmin/MerchantManagement'));
const GSTRuleManagement = lazy(() => import('./pages/superadmin/GSTRuleManagement'));
const Categories = lazy(() => import('./pages/superadmin/Categories'));
const Attribute = lazy(() => import('./pages/superadmin/Attribute'));
const BrandCreation = lazy(() => import('./pages/superadmin/BrandCreation'));
const HomepageSettings = lazy(() => import('./pages/superadmin/HomepageSettings'));
const UserSupport = lazy(() => import('./pages/superadmin/UserSupport'));
const MerchantSupport = lazy(() => import('./pages/superadmin/MerchantSupport'));
const MerchantDetails = lazy(() => import('./pages/superadmin/MerchantDetails'));
const Profile = lazy(() => import('./pages/superadmin/Profile'));
const Shops = lazy(() => import('./pages/superadmin/shop-management/Shops'));
const ShopCategories = lazy(() => import('./pages/superadmin/shop-management/ShopCategories'));
const ShopBrands = lazy(() => import('./pages/superadmin/shop-management/ShopBrands'));
const ShopAttributes = lazy(() => import('./pages/superadmin/shop-management/ShopAttributes'));
const AdminShopProducts = lazy(() => import('./pages/superadmin/shop-management/ShopProducts'));
const ShopGSTManagement = lazy(() => import('./components/superadmin/shop/ShopGSTManagement'));
const YouTubeManagement = lazy(() => import('./pages/superadmin/YouTubeManagement'));
const MerchantPaymentReport = lazy(() => import('./pages/superadmin/reports/MerchantPaymentReport'));
const NewsletterSubscribers = lazy(() => import('./pages/superadmin/NewsletterSubscribers'));
const ShopAnalytics = lazy(() => import('./pages/superadmin/shop/ShopAnalytics'));
const ShopInventoryManagement = lazy(() => import('./pages/superadmin/shop/ShopInventoryManagement'));
const ShopOrders = lazy(() => import('./pages/superadmin/shop/ShopOrders'));
const OrderManagementPage = lazy(() => import('./pages/superadmin/shop/OrderManagementPage'));
const ShopReviews = lazy(() => import('./pages/superadmin/shop/ShopReviews'));
const MerchantSubscription = lazy(() => import('./pages/MerchantSubscription'));

// Creator
const CreatorSignup = lazy(() => import('./pages/creator/CreatorSignup'));
const CreatorLogin = lazy(() => import('./pages/creator/CreatorLogin'));
const CreatorDashboard = lazy(() => import('./pages/creator/CreatorDashboard'));
const CreatorCategories = lazy(() => import('./pages/creator/CreatorCategories'));
const CreatorPortfolio = lazy(() => import('./pages/creator/CreatorPortfolio'));
const CreatorDeals = lazy(() => import('./pages/creator/CreatorDeals'));
const CreatorUploadReel = lazy(() => import('./pages/creator/CreatorUploadReel'));
const CreatorEarnings = lazy(() => import('./pages/creator/CreatorEarnings'));
const CreatorSettings = lazy(() => import('./pages/creator/CreatorSettings'));

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
  useVisitTracking();
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
                  <Suspense fallback={<LoadingFallback />}>
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
                      <Route path="dashboard" element={<BusinessDashboard />} />
                      <Route path="subscription" element={<Subscription />} />
                      <Route path="products" element={<BusinessProducts />} />
                      <Route path="inventory" element={<Inventory />} />
                      <Route path="verification" element={<Verification />} />
                      <Route path="verification-pending" element={<VerificationStatus />} />
                      <Route path="orders" element={<BusinessOrders />} />
                      <Route path="orders/:orderId" element={<BusinessOrderDetail />} />
                      <Route path="customers" element={<BusinessCustomers />} />
                      <Route path="reviews" element={<Reviews />} />
                      <Route path="reports/sales" element={<Sales />} />
                      <Route path="reports/customers" element={<CustomersReport />} />
                      <Route path="reports/products" element={<ProductsReport />} />
                      <Route path="settings" element={<Settingss />} />
                      <Route path="support" element={<Support />} />
                      <Route path="profile" element={<Profilee />} />

                      {/* Catalog Routes */}
                      <Route path="catalog">
                        <Route path="products" element={<CatalogProducts />} />
                        <Route path="aoinlive" element={<Aoinlive />} />
                        <Route path="product/new" element={<AddProducts />} />
                        <Route path="product/:id/view" element={<AddProducts mode="view" />} />
                        <Route path="product/:id/edit" element={<EditProduct />} />
                      </Route>

                      <Route path="product-placements" element={<ProductPlacements />} />
                      <Route path="dimension-presets" element={<DimensionPresets />} />
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

                    {/* Creator Dashboard — no Navbar, own layout */}
                    <Route path="/creator" element={<CreatorLayout />}>
                      <Route index element={<Navigate to="/creator/dashboard" replace />} />
                      <Route path="dashboard" element={<CreatorDashboard />} />
                      <Route path="categories" element={<CreatorCategories />} />
                      <Route path="portfolio" element={<CreatorPortfolio />} />
                      <Route path="deals" element={<CreatorDeals />} />
                      <Route path="upload-reel" element={<CreatorUploadReel />} />
                      <Route path="earnings" element={<CreatorEarnings />} />
                      <Route path="settings" element={<CreatorSettings />} />
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
                              <Route path="/creator/signup" element={<CreatorSignup />} />
                              <Route path="/creator/login" element={<CreatorLogin />} />

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
                  </Suspense>
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