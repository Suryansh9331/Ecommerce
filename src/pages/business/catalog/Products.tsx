import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../../hooks/useAmazonTranslate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- INTERFACES ---
interface Category {
  category_id: number;
  name: string;
  is_active?: boolean;
}

interface Brand {
  brand_id: number;
  name: string;
}

// NOTE: The `Product` interface now has a recursive definition for `variants`
// and includes the optional `category` and `brand` objects.
interface Product {
  product_id: number;
  product_name: string;
  sku: string;
  category_id: number;
  brand_id: number;
  cost_price: number;
  selling_price: number;
  special_price: number | null;
  special_start: string | null;
  special_end: string | null;
  active_flag: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  approved_by: number | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by_role: 'merchant' | 'admin' | null;
  deletion_reason: string | null;
  removed_by_admin: boolean;
  parent_product_id: number | null;
  stock_qty: number;
  low_stock_threshold: number;
  category?: Category;
  brand?: Brand;
  media?: Array<{
    media_id: number;
    url: string;
    type: 'IMAGE' | 'VIDEO';
  }>;
  variants?: Array<Product>;
}

// --- SUB-COMPONENTS (No changes from your original code) ---
const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => {
  const bgColor = active ? 'bg-green-100' : 'bg-gray-100';
  const textColor = active ? 'text-green-800' : 'text-gray-800';
  const status = active ? 'Active' : 'Inactive';
  return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>{status}</span>);
};
const ApprovalStatusBadge: React.FC<{ status: 'pending' | 'approved' | 'rejected', reason?: string | null }> = ({ status, reason }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };
  const getStatusText = () => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Pending';
    }
  };
  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()}`}>{getStatusText()}</span>
      {status === 'rejected' && reason && (<span className="text-xs text-red-600">{reason}</span>)}
    </div>
  );
};
/**
 * Shown when the AOIN team removed a listing.
 *
 * The reason is displayed verbatim and prominently: a merchant whose product
 * disappeared without explanation raises a support ticket, which is the outcome
 * the takedown flow exists to avoid. The call to action says what to do next,
 * because the removed listing itself cannot be restored — the SKU is released
 * so a corrected product can reuse it.
 */
const RemovedByAdminBadge: React.FC<{ reason?: string | null }> = ({ reason }) => (
  <div className="flex flex-col gap-1">
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      Removed by admin
    </span>
    {reason && <span className="text-xs text-red-700">Reason: {reason}</span>}
    <span className="text-xs text-gray-500">
      Fix the issue and create a new listing.
    </span>
  </div>
);

const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);


// --- MAIN COMPONENT ---
const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'ascending' | 'descending'; }>({ key: null, direction: 'ascending' });
  const [showDeleteModal, setShowDeleteModal] = useState<{ visible: boolean; productId: number | null; productName: string; isBulk: boolean; } | null>(null);
  const [, setIsDeleting] = useState(false);
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();

  // Display-only translated maps
  const [tNames, setTNames] = useState<Record<number, string>>({});
  const [tCategoryNames, setTCategoryNames] = useState<Record<number, string>>({});
  const [tBrandNames, setTBrandNames] = useState<Record<number, string>>({});

  // --- DATA FETCHING & PROCESSING ---
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const [productsResponse, categoriesResponse, brandsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/merchant-dashboard/products`, { headers }),
        fetch(`${API_BASE_URL}/api/merchant-dashboard/categories`, { headers }),
        fetch(`${API_BASE_URL}/api/merchant-dashboard/brands`, { headers }),
      ]);
      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
      if (!brandsResponse.ok) throw new Error('Failed to fetch brands');
      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();
      const brandsData = await brandsResponse.json();
      setProducts(productsData);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setError(error.message || 'Failed to load data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (!response.ok) throw new Error('Failed to refresh products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error refreshing products:", error);
      toast.error("Could not refresh product list.");
    }
  };

  const processedProducts = useMemo(() => {
    if (!products.length) return [];

    // Create lookup maps only if categories/brands are available
    const categoryMap = categories.length > 0 ? new Map(categories.map(cat => [cat.category_id, cat])) : null;
    const brandMap = brands.length > 0 ? new Map(brands.map(brand => [brand.brand_id, brand])) : null;

    const enrichedProducts = products.map(product => ({
      ...product,
      category: categoryMap?.get(product.category_id),
      brand: brandMap?.get(product.brand_id),
    }));

    const parentProducts = enrichedProducts.filter(p => !p.parent_product_id);
    const variantProducts = enrichedProducts.filter(p => p.parent_product_id);

    return parentProducts.map(parent => ({
      ...parent,
      variants: variantProducts.filter(variant => variant.parent_product_id === parent.product_id),
    }));
  }, [products, categories, brands]);

  // Translate dynamic text for current processed (parent) products, categories, brands
  useEffect(() => {
    const lang = (i18n.language || 'en').split('-')[0];
    if (!processedProducts.length || lang === 'en') {
      setTNames({}); setTCategoryNames({}); setTBrandNames({});
      return;
    }
    const run = async () => {
      try {
        const nameItems: { id: string; text: string }[] = [];
        const catItems: { id: string; text: string }[] = [];
        const brandItems: { id: string; text: string }[] = [];
        processedProducts.forEach(p => {
          if (p.product_name) nameItems.push({ id: `p:${p.product_id}`, text: p.product_name });
          if (p.category?.name) catItems.push({ id: `c:${p.category.category_id}`, text: p.category.name });
          if (p.brand?.name) brandItems.push({ id: `b:${p.brand.brand_id}`, text: p.brand.name });
          (p.variants || []).forEach(v => {
            if (v.product_name) nameItems.push({ id: `p:${v.product_id}`, text: v.product_name });
          });
        });
        const [nMap, cMap, bMap] = await Promise.all([
          translateBatch(nameItems, lang, 'text/plain'),
          translateBatch(catItems, lang, 'text/plain'),
          translateBatch(brandItems, lang, 'text/plain'),
        ]);
        const names: Record<number, string> = {};
        Object.keys(nMap).forEach(k => { if (k.startsWith('p:')) names[Number(k.split(':')[1])] = nMap[k]; });
        const cats: Record<number, string> = {};
        Object.keys(cMap).forEach(k => { if (k.startsWith('c:')) cats[Number(k.split(':')[1])] = cMap[k]; });
        const brandsMap: Record<number, string> = {};
        Object.keys(bMap).forEach(k => { if (k.startsWith('b:')) brandsMap[Number(k.split(':')[1])] = bMap[k]; });
        setTNames(names); setTCategoryNames(cats); setTBrandNames(brandsMap);
      } catch {
        // fail open
      }
    };
    run();
  }, [processedProducts, i18n.language, translateBatch]);

  const filteredProducts = useMemo(() => processedProducts.filter((product) => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || product.category?.name === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || (selectedStatus === 'Active' && product.active_flag) || (selectedStatus === 'Inactive' && !product.active_flag);
    const matchesMinPrice = minPrice === '' || product.selling_price >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || product.selling_price <= parseFloat(maxPrice);
    return matchesSearch && matchesCategory && matchesStatus && matchesMinPrice && matchesMaxPrice;
  }), [processedProducts, searchTerm, selectedCategory, selectedStatus, minPrice, maxPrice]);

  const sortedProducts = useMemo(() => {
    const sortableProducts = [...filteredProducts];
    if (sortConfig.key !== null) {
      sortableProducts.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Product] as any;
        const bValue = b[sortConfig.key as keyof Product] as any;
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableProducts;
  }, [filteredProducts, sortConfig]);

  // --- HANDLERS & HELPERS (No changes from your original code) ---
  const handleDeleteClick = (productId: number, productName: string) => {
    console.log('Delete clicked', productId, productName);
    setShowDeleteModal({ visible: true, productId, productName, isBulk: false });
  };
  const handleBulkDeleteClick = () => setShowDeleteModal({ visible: true, productId: null, productName: `${selectedItems.length} products`, isBulk: true });
  const handleConfirmDelete = async () => {
    if (!showDeleteModal) return;
    setIsDeleting(true);
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' };
      if (showDeleteModal.isBulk) {
        await Promise.all(selectedItems.map(productId => fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${productId}`, { method: 'DELETE', headers })));
        toast.success(`Successfully deleted ${selectedItems.length} products`);
        setSelectedItems([]);
      } else if (showDeleteModal.productId) {
        const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${showDeleteModal.productId}`, { method: 'DELETE', headers });
        if (!response.ok) throw new Error('Failed to delete product');
        toast.success(`Successfully deleted ${showDeleteModal.productName}`);
      }
      await refreshProducts();
    } catch (error) {
      console.error('Error deleting product(s):', error);
      toast.error(showDeleteModal.isBulk ? 'Failed to delete some products' : 'Failed to delete product');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(null);
    }
  };
  const cancelDelete = () => setShowDeleteModal(null);
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };
  const getSortIndicator = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />;
  };
  const toggleSelectAll = () => {
    if (selectedItems.length === sortedProducts.length) setSelectedItems([]);
    else setSelectedItems(sortedProducts.map(product => product.product_id));
  };
  const toggleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    else setSelectedItems([...selectedItems, id]);
  };
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedStatus('All');
    setMinPrice('');
    setMaxPrice('');
  };

  // --- RENDER LOGIC ---
  if (isLoading) return (<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>);
  if (error) return (<div className="p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-700">{error}</p><button onClick={fetchAllData} className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium">Try again</button></div>);

  return (
    <div className="space-y-6">
      {/* Page Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <div className="flex flex-wrap items-start justify-start gap-4">
          <Link to="/business/catalog/product/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"><PlusIcon className="h-4 w-4 mr-2" />Add Product</Link>
        </div>
      </div>

      {/* Search, Filter, and Sort */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-grow"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Search products by name or SKU..." /></div>
            <div className="flex flex-col gap-4 sm:flex-row space-x-2">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="block pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                <option value="All Categories">All Categories</option>
                {categories.map(cat => (<option key={cat.category_id} value={cat.name}>{cat.name}</option>))}
              </select>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="block pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                <option value="All">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
              </select>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-primary-50 focus:outline-none"><FunnelIcon className="h-4 w-4 mr-2" />{showFilters ? 'Hide Filters' : 'Show Filters'}</button>
          </div>
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label htmlFor="price-min" className="block text-sm font-medium text-gray-700 mb-1">Price Range</label><div className="flex space-x-2"><input type="number" id="price-min" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" /><input type="number" id="price-max" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" /></div></div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end"><button onClick={clearFilters} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-primary-50 focus:outline-none mr-2">Reset</button><button onClick={() => setShowFilters(false)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none">Apply Filters</button></div>
            </div>
          )}
        </div>
        {selectedItems.length > 0 && (<div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex items-center"><span className="text-sm text-gray-700 mr-4">{selectedItems.length} product(s) selected</span><div className="flex space-x-2"><button onClick={handleBulkDeleteClick} className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none"><TrashIcon className="h-4 w-4 mr-1" />Delete Selected</button></div></div>)}

        {/* Product List Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs" style={{ fontSize: '0.99rem' }}>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider w-8">
                  <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" checked={selectedItems.length === sortedProducts.length && sortedProducts.length > 0} onChange={toggleSelectAll} />
                </th>
                <th scope="col" className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center cursor-pointer" onClick={() => requestSort('product_name')}>Name / SKU{getSortIndicator('product_name')}</div>
                </th>
                <th scope="col" className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center cursor-pointer" onClick={() => requestSort('selling_price')}>Price{getSortIndicator('selling_price')}</div>
                </th>
                <th scope="col" className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Category / Brand</th>
                <th scope="col" className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center cursor-pointer" onClick={() => requestSort('active_flag')}>Status{getSortIndicator('active_flag')}</div>
                </th>
                <th scope="col" className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center cursor-pointer" onClick={() => requestSort('approval_status')}>Approval{getSortIndicator('approval_status')}</div>
                </th>
                <th scope="col" className="px-2 py-1 text-center  font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProducts.map((product) => (
                <React.Fragment key={product.product_id}>
                  {/* Parent Product Row */}
                  <tr className="hover:bg-primary-50 transition-colors">
                    <td className="px-2 py-1 whitespace-nowrap w-8">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" checked={selectedItems.includes(product.product_id)} onChange={() => toggleSelectItem(product.product_id)} />
                    </td>
                    <td className="px-2 py-1 whitespace-normal max-w-xs">
  <div className="flex items-center">
    <div className="ml-2">
      <div
        className="font-medium text-gray-900 line-clamp-2 max-w-xs"
        title={tNames[product.product_id] || product.product_name}
      >
        {tNames[product.product_id] || product.product_name}
      </div>
      <div className="text-gray-500 break-words">SKU - {product.sku}</div>
    </div>
  </div>
</td>

                    <td className="px-2 py-1 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {formatINR(product.selling_price)}
                        {product.special_price && (
                          <span className="ml-2 text-red-600">
                            Special: {formatINR(product.special_price)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1 whitespace-normal max-w-xs"><div className="text-gray-900 break-words flex items-center gap-2 flex-wrap">{(product.category && tCategoryNames[product.category.category_id]) || product.category?.name || 'No Category'}{product.category && product.category.is_active === false && (<span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded shrink-0">Category disabled</span>)}</div><div className="text-gray-500 break-words">{(product.brand && tBrandNames[product.brand.brand_id]) || product.brand?.name || 'No Brand'}</div></td>
                    <td className="px-2 py-1 whitespace-nowrap"><StatusBadge active={product.active_flag} /></td>
                    <td className="px-1 py-1 whitespace-nowrap text-center align-middle">
                      <div className="flex justify-center items-center h-full">
                        {product.removed_by_admin
                            ? <RemovedByAdminBadge reason={product.deletion_reason} />
                            : <ApprovalStatusBadge status={product.approval_status} reason={product.rejection_reason} />}
                      </div>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap font-medium pl-4 sm:pl-10 min-w-[80px]">
                      <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2 mr-2">
                        <Link to={`/business/catalog/product/${product.product_id}/edit`} className="text-primary-600 hover:text-primary-700"><PencilIcon className="h-4 w-4" /></Link>
                        <button onClick={() => handleDeleteClick(product.product_id, product.product_name)} className="text-primary-600 hover:text-primary-900"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Variants Rows */}
                  {product.variants?.map((variant) => (
                    <tr key={variant.product_id} className="bg-gray-50 hover:bg-primary-50 transition-colors">
                      <td className="px-2 py-1 whitespace-nowrap w-8"><input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" checked={selectedItems.includes(variant.product_id)} onChange={() => toggleSelectItem(variant.product_id)} /></td>
                      <td className="px-2 py-1 whitespace-normal max-w-xs">
                        <div className="flex items-center pl-6">
                          <div className="ml-2"><div className="text-gray-900 break-words">{(variant as any).attributes?.map((attr: any, index: number) => (<span key={index} className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 mr-1">{attr.name}: {attr.value}</span>))}</div><div className="text-gray-500 break-words">SKU - {variant.sku}</div></div></div></td>
                      <td className="px-2 py-1 whitespace-nowrap"><div className="font-medium text-gray-900">{formatINR(variant.selling_price)}</div></td><td className="px-2 py-1 whitespace-nowrap"><div className="text-gray-500">Stock: {variant.stock_qty}</div></td>
                      <td className="px-2 py-1 whitespace-nowrap"><StatusBadge active={product.active_flag} /></td>
                      <td className="px-1 py-1 whitespace-nowrap text-center align-middle">
                        <div className="flex justify-center items-center h-full">
                          {product.removed_by_admin
                            ? <RemovedByAdminBadge reason={product.deletion_reason} />
                            : <ApprovalStatusBadge status={product.approval_status} reason={product.rejection_reason} />}
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap font-medium pl-4 sm:pl-10 min-w-[80px]">
                        <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2 mr-2">
                          <Link to={`/business/catalog/product/${variant.product_id}/edit`} className="text-primary-600 hover:text-primary-700"><PencilIcon className="h-4 w-4" /></Link>
                          <button onClick={() => handleDeleteClick(variant.product_id, variant.product_name)} className="text-primary-600 hover:text-primary-900"><TrashIcon className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showDeleteModal?.visible && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
    <div className="bg-white p-6 rounded-xl shadow">
      <p>
        Are you sure you want to delete <b>{showDeleteModal.productName}</b>?
      </p>

      {/* Add spacing between text and buttons */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleConfirmDelete}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl mr-2"
        >
          Delete
        </button>
        <button
          onClick={cancelDelete}
          className="bg-gray-300 px-4 py-2 rounded-xl"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Products;