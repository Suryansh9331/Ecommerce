import { useState, useEffect } from 'react';
import { User, Menu, X, Search, ShoppingCart, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShopWishlist } from '../../../../context/ShopWishlistContext';
import { useShopCartOperations } from '../../../../context/ShopCartContext';

const SHOP_ID = 2;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { getShopWishlistCount } = useShopWishlist();
  const { getShopCartCount } = useShopCartOperations();
  
  const wishlistCount = getShopWishlistCount(SHOP_ID);

  const loadCartCount = async () => {
    try {
      const count = await getShopCartCount(SHOP_ID);
      setCartCount(count);
    } catch (error) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    loadCartCount();
    // Refresh cart count periodically
    const interval = setInterval(loadCartCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className=" relative w-full max-w-[1280px] mx-auto bg-white top-0 z-50 ">
      <div className="w-[1280px] max-w-full mx-auto px-8">
        <div className="flex items-center justify-between h-24 relative">
          {/* Left Navigation */}
          <nav className="hidden md:flex items-center w-[43%] space-x-10">
            <Link to="/shop2-allproductpage" className="text-[16px] font-medium font-gilroy text-gray-900 hover:text-gray-600 transition-colors tracking-[0.1em]">
              Products
            </Link>
         
            <a href="#" className="text-[16px] font-medium font-gilroy text-gray-900 hover:text-gray-600 transition-colors tracking-[0.1em]">
              Contact us
            </a>
          </nav>

          {/* Logo - absolutely centered */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-[24px] sm:text-[28px] md:text-[32px] leading-[100%] font-bebas font-normal text-center tracking-normal text-[#222222]">
              AOIN
            </h1>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-8">
            <button className="text-gray-900 hover:text-gray-600 transition-colors">
              <Search className="w-6 h-6" />
            </button>
            <Link to="/shop2/wishlist" className="text-gray-900 hover:text-gray-600 transition-colors relative">
              <Heart className="w-6 h-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>
            <Link to="/shop2/cart" className="text-gray-900 hover:text-gray-600 transition-colors relative">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <button className="text-gray-900 hover:text-gray-600 transition-colors">
              <User className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-gray-100">
            <nav className="flex flex-col space-y-6">
              <Link to="/shop2/products" className="text-sm font-medium text-gray-900 tracking-[0.1em]">PRODUCTS</Link>
              <a href="#" className="text-sm font-medium text-gray-900 tracking-[0.1em]">CONTACT US</a>
            </nav>
            <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-gray-100">
              <Search className="w-5 h-5 text-gray-900" />
              <Link to="/shop2/wishlist" className="relative">
                <Heart className="w-5 h-5 text-gray-900" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
              <Link to="/shop2/cart" className="relative">
                <ShoppingCart className="w-5 h-5 text-gray-900" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              <User className="w-5 h-5 text-gray-900" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
