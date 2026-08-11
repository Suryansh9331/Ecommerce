import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Package, 
  X,
  ArrowLeft,
  Store,
  FolderOpen,
  Filter,
  ExternalLink,
  Layers,
  Menu
} from 'lucide-react';
import { shopManagementService, Shop, ShopCategory, ShopBrand, ShopProduct } from '../../../services/shopManagementService';
import { useToastHelpers } from '../../../context/ToastContext';
import MultiStepProductForm from './components/MultiStepProductForm';
import EditProducts from './components/EditProducts';
import VariantDisplayModal from '../../../components/superadmin/shop-management/VariantDisplayModal';

const ShopProducts: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | null>(null);
  const [brands, setBrands] = useState<ShopBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<ShopBrand | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<ShopProduct | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    is_published: '',
    is_on_special_offer: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    has_next: false,
    has_prev: false,
    pages: 1,
    per_page: 10,
    total: 0
  });
  const { showSuccess, showError } = useToastHelpers();

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      fetchCategories();
    }
  }, [selectedShop]);

  useEffect(() => {
    if (selectedShop && selectedCategory) {
      fetchBrands();
    }
  }, [selectedShop, selectedCategory]);

  useEffect(() => {
    if (selectedShop && selectedCategory) {
      fetchProducts();
    }
    // eslint-disable-next-line
  }, [selectedShop, selectedCategory, selectedBrand, currentPage]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const data = await shopManagementService.getShops();
      setShops(data);
    } catch (error) {
      showError('Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!selectedShop) return;
    try {
      const data = await shopManagementService.getCategoriesByShop(selectedShop.shop_id);
      setCategories(data);
    } catch (error) {
      showError('Failed to fetch categories');
    }
  };

  const fetchBrands = async () => {
    if (!selectedShop || !selectedCategory) return;
    try {
      const data = await shopManagementService.getBrandsByShopCategory(selectedShop.shop_id, selectedCategory.category_id);
      setBrands(data);
    } catch (error) {
      showError('Failed to fetch brands');
    }
  };

  const fetchProducts = async () => {
    if (!selectedShop || !selectedCategory) return;
    try {
      setLoading(true);
      const filterParams = {
        shop_id: selectedShop.shop_id,
        category_id: selectedCategory.category_id,
        ...(selectedBrand && { brand_id: selectedBrand.brand_id }),
        ...(filters.min_price && { min_price: parseFloat(filters.min_price) }),
        ...(filters.max_price && { max_price: parseFloat(filters.max_price) }),
        ...(filters.is_published && { is_published: filters.is_published === 'true' }),
        ...(filters.is_on_special_offer && { is_on_special_offer: filters.is_on_special_offer === 'true' }),
        ...(searchTerm && { search: searchTerm }),
        page: currentPage
      };
      const response = await shopManagementService.getShopProducts(filterParams);
      // If API returns {products, pagination}
      if (response.products && response.pagination) {
        setProducts(response.products || []);
        setPagination(response.pagination);
      } else if (response.data && response.pagination) {
        setProducts(response.data || []);
        setPagination(response.pagination);
      } else if (response.data) {
        setProducts(response.data || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      showError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleProductFormComplete = () => {
    setShowModal(false);
    setEditingProduct(null);
    fetchProducts(); // Refresh the products list
  };

  const handleNextPage = () => {
    if (pagination.has_next) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.has_prev) {
      setCurrentPage((prev) => (prev > 1 ? prev - 1 : 1));
    }
  };

  const handleEdit = (product: ShopProduct) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleVariants = (product: ShopProduct) => {
    setSelectedProductForVariants(product);
    setShowVariantsModal(true);
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await shopManagementService.deleteProduct(productId);
      showSuccess('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      showError(error.message || 'Failed to delete product');
    }
  };

  const toggleProductStatus = async (productId: number, field: 'active_flag' | 'is_published' | 'is_on_special_offer', currentValue: boolean) => {
    try {
      await shopManagementService.updateProduct(productId, {
        [field]: !currentValue
      });
      
      const statusMessages = {
        active_flag: !currentValue ? 'Product activated' : 'Product deactivated',
        is_published: !currentValue ? 'Product published' : 'Product unpublished',
        is_on_special_offer: !currentValue ? 'Special offer enabled' : 'Special offer disabled'
      };
      
      showSuccess(statusMessages[field]);
      fetchProducts();
    } catch (error: any) {
      showError(error.message || `Failed to update product ${field}`);
    }
  };

  const resetFilters = () => {
    setFilters({
      min_price: '',
      max_price: '',
      is_published: '',
      is_on_special_offer: ''
    });
    setSelectedBrand(null);
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filter products based on search term (now handled by backend, so just use products)
  const filteredProducts = products;

  // Shop Selection View
  if (!selectedShop) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shop Products</h1>
          <p className="text-sm sm:text-base text-gray-600">Select a shop to manage its products</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {shops.map((shop) => (
            <button
              key={shop.shop_id}
              onClick={() => setSelectedShop(shop)}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Store className="text-primary-500" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{shop.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    shop.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {shop.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Category Selection View
  if (!selectedCategory) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setSelectedShop(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Shops</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{selectedShop.name} - Categories</h1>
              <p className="text-sm sm:text-base text-gray-600">Select a category to manage its products</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => (
            <button
              key={category.category_id}
              onClick={() => setSelectedCategory(category)}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="text-blue-500" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{category.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Products Management View
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back to Categories</span>
            <span className="sm:hidden">Back</span>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
              {selectedShop.name} {'>'} {selectedCategory.name} - Products
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Manage products for this category</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowModal(true);
            }}
            className="bg-primary-500 hover:bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <select
                value={selectedBrand?.brand_id || ''}
                onChange={(e) => {
                  const brand = brands.find(b => b.brand_id === parseInt(e.target.value));
                  setSelectedBrand(brand || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand.brand_id} value={brand.brand_id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
              <input
                type="number"
                step="0.01"
                value={filters.min_price}
                onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                step="0.01"
                value={filters.max_price}
                onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="999.99"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.is_published}
                onChange={(e) => setFilters({ ...filters, is_published: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="">All Status</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
            <button
              onClick={resetFilters}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Clear Filters
            </button>
            <button
              onClick={fetchProducts}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <div key={product.product_id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
               
                <div className="aspect-w-1 aspect-h-1 w-full h-40 sm:h-48 bg-gray-200">
                  {product.primary_image && !product.primary_image.startsWith('blob:') ? (
                    <img
                      src={product.primary_image}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class=\"w-full h-full flex items-center justify-center\">
                              <svg class=\"text-gray-400\" width=\"48\" height=\"48\" fill=\"currentColor\" viewBox=\"0 0 24 24\">
                                <path d=\"M20 6h-2.18l-1.41-1.41A2 2 0 0 0 15 4H9a2 2 0 0 0-1.41.59L6.18 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z\"/>
                              </svg>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Package className="text-gray-400 mb-2" size={32} />
                      {product.primary_image?.startsWith('blob:') && (
                        <span className="text-xs text-red-500 text-center px-2">
                          Image needs re-upload
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="p-3 sm:p-4">
                  
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate flex-1 mr-2">{product.product_name}</h3>
                    <div className="flex space-x-1 flex-shrink-0">
                      <button
                        onClick={() => window.open(`/product/${product.product_id}`, '_blank')}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Product"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Product"
                      >
                        <Edit2 size={14} />
                      </button>
                      {/* Only show Manage Variants button for parent products (not variant products) */}
                      {!product.parent_product_id && (
                        <button
                          onClick={() => handleVariants(product)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Manage Variants"
                        >
                          <Layers size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(product.product_id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                
                  {(product.variant_count || 0) > 0 && (
                    <div className="mb-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {product.variant_count} variant{(product.variant_count || 0) > 1 ? 's' : ''}
                      </span>
                      {product.price_range && product.price_range.min !== product.price_range.max && (
                        <span className="text-xs text-gray-600 ml-2">
                          ₹{product.price_range.min} - ₹{product.price_range.max}
                        </span>
                      )}
                    </div>
                  )}
                  {product.parent_product_id && (
                    <div className="mb-2">
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        Variant Product
                      </span>
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{product.product_description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-sm sm:text-lg font-bold text-gray-900">₹{product.selling_price}</span>
                      {product.is_on_special_offer && product.special_price && (
                        <span className="text-xs sm:text-sm text-red-500 line-through ml-2">₹{product.special_price}</span>
                      )}
                    </div>
                    {product.brand_name && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full truncate max-w-20">{product.brand_name}</span>
                    )}
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="space-y-2">
                      {/* Active Status Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Active</span>
                        <button
                          onClick={() => toggleProductStatus(product.product_id, 'active_flag', product.active_flag)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            product.active_flag ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              product.active_flag ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {/* Published Status Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Published</span>
                        <button
                          onClick={() => toggleProductStatus(product.product_id, 'is_published', product.is_published)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            product.is_published ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              product.is_published ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {/* Special Offer Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Special Offer</span>
                        <button
                          onClick={() => toggleProductStatus(product.product_id, 'is_on_special_offer', product.is_on_special_offer)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            product.is_on_special_offer ? 'bg-red-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              product.is_on_special_offer ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center mt-6 sm:mt-8 gap-4">
              <button
                onClick={handlePrevPage}
                disabled={!pagination.has_prev}
                className={`px-3 sm:px-4 py-2 rounded-lg border text-sm ${pagination.has_prev ? 'bg-white hover:bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                Previous
              </button>
              <span className="text-sm sm:text-base text-gray-700 font-medium">
                Page {pagination.current_page} of {pagination.pages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={!pagination.has_next}
                className={`px-3 sm:px-4 py-2 rounded-lg border text-sm ${pagination.has_next ? 'bg-white hover:bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-8 sm:py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating a new product'}
          </p>
        </div>
      )}

      {/* Product Modal */}
      {showModal && selectedShop && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-auto max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {editingProduct ? (
              <EditProducts
                selectedShop={selectedShop}
                selectedCategory={selectedCategory}
                editingProduct={editingProduct}
                onComplete={handleProductFormComplete}
                onCancel={() => setShowModal(false)}
              />
            ) : (
              <MultiStepProductForm
                selectedShop={selectedShop}
                selectedCategory={selectedCategory}
                onComplete={handleProductFormComplete}
                onCancel={() => setShowModal(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Variant Management Modal */}
      {showVariantsModal && selectedProductForVariants && (
        <VariantDisplayModal
          product={selectedProductForVariants}
          onClose={() => {
            setShowVariantsModal(false);
            setSelectedProductForVariants(null);
          }}
          onRefresh={fetchProducts}
        />
      )}
    </div>
  );
};

export default ShopProducts;
