import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Configuration ---
// Read the backend URL from environment variables.
// IMPORTANT: Ensure your .env file has VITE_API_BASE_URL=http://127.0.0.1:5110 (or your correct port)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5110';

// --- Type Definitions ---
interface ApiEntity {
  id: number;
  name: string;
}

interface Product extends ApiEntity {
  sku?: string;
}

interface PromotionTarget {
  type: 'product' | 'category' | 'brand';
  id: number;
  name: string;
}

interface Promotion {
  promotion_id: number;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string; // ISO format
  end_date: string; // ISO format
  active_flag: boolean;
  target: PromotionTarget | null;
}

// --- Helper Function to get Auth Token ---
const getAuthToken = (): string | null => {
  // This is the correct way to retrieve the token for every request.
  return localStorage.getItem('access_token');
};

// --- Component ---
const Promotions: React.FC = () => {
  // --- State Management ---
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<ApiEntity[]>([]);
  const [brands, setBrands] = useState<ApiEntity[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCodeManuallySet, setIsCodeManuallySet] = useState(false);

  // Form State
  const [targetType, setTargetType] = useState<'product' | 'category' | 'brand' | 'sitewide'>('sitewide');
  const [targetId, setTargetId] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [promotionCode, setPromotionCode] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTargetType, setFilterTargetType] = useState('');
  
  // --- Game Promos Table ---
  const [gamePromos, setGamePromos] = useState<any[]>([]);
  const [gamePromoLoading, setGamePromoLoading] = useState(false);
  const [gamePromoSearch, setGamePromoSearch] = useState('');
  const [gamePromoDiscount, setGamePromoDiscount] = useState('');
  const [gamePromoType, setGamePromoType] = useState('');

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error("Authentication error: Not logged in.");
      setLoading(false);
      return;
    }

    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };

      const [promoRes, catRes, brandRes, prodRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/superadmin/promotions`, { headers }),
        fetch(`${API_BASE_URL}/api/superadmin/categories`, { headers }),
        fetch(`${API_BASE_URL}/api/superadmin/brands`, { headers }),
        fetch(`${API_BASE_URL}/api/superadmin/products`, { headers }),
      ]);

      const checkResponse = async (res: Response, type: string) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(`${type} Fetch Failed: ${errorData.message}`);
        }
        return res.json();
      };
      
      const promosData = await checkResponse(promoRes, 'Promotions');
      const catsData = await checkResponse(catRes, 'Categories');
      const brandsData = await checkResponse(brandRes, 'Brands');
      const prodsData = await checkResponse(prodRes, 'Products');
      
      setPromotions(promosData);
      setCategories(catsData.map((c: any) => ({ id: c.category_id, name: c.name })));
      setBrands(brandsData.map((b: any) => ({ id: b.brand_id, name: b.name })));
      setProducts(prodsData.map((p: any) => ({ id: p.product_id, name: p.product_name, sku: p.sku })));

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Real-time Promotion Code Generation ---
  const generatePromotionCode = useCallback((targetName: string, discount: string): string => {
      if (!targetName || !discount) return '';
      const cleanTargetName = targetName.toUpperCase().replace(/[\s&]+/g, '').substring(0, 12);
      const cleanDiscount = Math.round(parseFloat(discount));
      return `${cleanTargetName}${cleanDiscount}OFF`;
  }, []);
  
  useEffect(() => {
    if (editingPromotion || isCodeManuallySet) return;

    let targetName = '';
    if (targetType !== 'sitewide' && targetId) {
        const list = targetType === 'category' ? categories : targetType === 'brand' ? brands : products;
        targetName = list.find(item => item.id === Number(targetId))?.name || '';
    } else {
        targetName = 'SITEWIDE';
    }

    const newCode = generatePromotionCode(targetName, discountValue);
    setPromotionCode(newCode);

  }, [targetType, targetId, discountValue, categories, brands, products, editingPromotion, isCodeManuallySet, generatePromotionCode]);

  useEffect(() => {
    const fetchGamePromos = async () => {
      setGamePromoLoading(true);
      try {
        const token = getAuthToken();
        if (!token) return;
        const params = [];
        if (gamePromoDiscount) params.push(`discount=${gamePromoDiscount}`);
        if (gamePromoType) params.push(`game_type=${gamePromoType}`);
        const url = `${API_BASE_URL}/api/games/current-promos${params.length ? '?' + params.join('&') : ''}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setGamePromos(data.promotions || []);
      } catch (e) {
        setGamePromos([]);
      } finally {
        setGamePromoLoading(false);
      }
    };
    fetchGamePromos();
    // eslint-disable-next-line
  }, [gamePromoDiscount, gamePromoType]);

  // --- Utility Functions ---
  const resetForm = () => {
    setEditingPromotion(null);
    setTargetType('sitewide');
    setTargetId('');
    setDiscountType('percentage');
    setDiscountValue('');
    setPromotionCode('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setIsCodeManuallySet(false); // Allow auto-generation for new forms
  };

  // --- Event Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = getAuthToken();
    if (!authToken) return toast.error("Authentication error. Please log in again.");

    if (!discountValue || !startDate || !endDate) {
      return toast.error('Discount, start date, and end date are required.');
    }
    if (targetType !== 'sitewide' && !targetId) {
      return toast.error(`Please select a specific ${targetType}.`);
    }

    const payload: any = {
      description,
      discount_type: discountType,
      discount_value: Number(discountValue),
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      active_flag: editingPromotion ? editingPromotion.active_flag : true,
    };
    if (promotionCode) payload.code = promotionCode;
    if (targetType !== 'sitewide' && targetId) {
      payload[`${targetType}_id`] = Number(targetId);
    }

    setLoading(true);
    try {
      const url = editingPromotion 
        ? `${API_BASE_URL}/api/superadmin/promotions/${editingPromotion.promotion_id}`
        : `${API_BASE_URL}/api/superadmin/promotions`;
      const method = editingPromotion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `Failed to ${editingPromotion ? 'update' : 'create'} promotion`);
      }

      toast.success(`Promotion ${editingPromotion ? 'updated' : 'created'} successfully`);
      resetForm();
      fetchData(); // Refresh list

    } catch (error) {
      console.error("Submit Error:", error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setTargetType(promotion.target?.type || 'sitewide');
    setTargetId(promotion.target?.id.toString() || '');
    setDiscountType(promotion.discount_type);
    setDiscountValue(promotion.discount_value.toString());
    setPromotionCode(promotion.code);
    setDescription(promotion.description || '');
    setStartDate(promotion.start_date.split('T')[0]);
    setEndDate(promotion.end_date.split('T')[0]);
    setIsCodeManuallySet(true); // When editing, assume manual control of the code
    
    // Auto-scroll to form
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    const authToken = getAuthToken();
    if (!authToken) return toast.error("Authentication error. Please log in again.");

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/promotions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: 'Failed to delete promotion'}));
        throw new Error(errorData.message);
      }
      toast.success('Promotion deleted successfully');
      setPromotions(promotions.filter(p => p.promotion_id !== id));
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error(error instanceof Error ? error.message : 'Could not delete promotion');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (promotion: Promotion) => {
    const authToken = getAuthToken();
    if (!authToken) return toast.error("Authentication error. Please log in again.");

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/promotions/${promotion.promotion_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ active_flag: !promotion.active_flag }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: 'Failed to update status'}));
        throw new Error(errorData.message);
      }
      toast.success(`Promotion ${!promotion.active_flag ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      console.error("Toggle Error:", error);
      toast.error(error instanceof Error ? error.message : 'Could not update status');
    } finally {
      setLoading(false);
    }
  };

  // --- Derived State ---
  const targetOptions = {
    product: products,
    category: categories,
    brand: brands,
    sitewide: [],
  }[targetType];

  const filteredPromotions = promotions.filter(promotion => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      promotion.code.toLowerCase().includes(searchTermLower) ||
      (promotion.target?.name.toLowerCase().includes(searchTermLower)) ||
      (promotion.description?.toLowerCase().includes(searchTermLower));
    
    const matchesTargetType = !filterTargetType || (promotion.target?.type === filterTargetType) || (filterTargetType === 'sitewide' && !promotion.target);
    
    return matchesSearch && matchesTargetType;
  });

  const filteredGamePromos = gamePromos.filter(promo => {
    const search = gamePromoSearch.toLowerCase();
    return (
      promo.code.toLowerCase().includes(search) ||
      (promo.description && promo.description.toLowerCase().includes(search))
    );
  });

  return (
    <div className="p-6 max-w-full mx-auto bg-gray-50 min-h-screen">
      {/* --- Game Promos Table Section --- */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl shadow-lg p-6 mb-4">
          <h2 className="text-2xl font-extrabold mb-4 text-primary-700 tracking-tight flex items-center gap-2">
            🎮 Current Game Promo Codes
          </h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              value={gamePromoSearch}
              onChange={e => setGamePromoSearch(e.target.value)}
              placeholder="Search by code or description..."
              className="p-2 border border-gray-300 rounded-md min-w-[200px]"
            />
            <select value={gamePromoDiscount} onChange={e => setGamePromoDiscount(e.target.value)} className="p-2 border border-gray-300 rounded-md">
              <option value="">All Discounts</option>
              {[5, 10, 15, 20].map(d => <option key={d} value={d}>{d}%</option>)}
            </select>
            <select value={gamePromoType} onChange={e => setGamePromoType(e.target.value)} className="p-2 border border-gray-300 rounded-md">
              <option value="">All Game Types</option>
              <option value="spin-wheel">Spin Wheel</option>
              <option value="match-card">Memory Match</option>
            </select>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-700 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-700 uppercase">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-700 uppercase">Validity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-700 uppercase">Description</th>
                </tr>
              </thead>
              <tbody>
                {gamePromoLoading ? (
                  <tr><td colSpan={6} className="text-center py-8"><Loader2 className="mx-auto animate-spin text-primary-500" /></td></tr>
                ) : filteredGamePromos.length > 0 ? filteredGamePromos.map(promo => (
                  <tr key={promo.promotion_id} className="hover:bg-primary-50">
                    <td className="px-4 py-3 font-mono text-primary-700 font-bold">{promo.code}</td>
                    <td className="px-4 py-3">
                      {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `₹${promo.discount_value}`}
                    </td>
                    <td className="px-4 py-3 capitalize">{promo.code.includes('SPIN') ? 'Spin Wheel' : promo.code.includes('MATCH') ? 'Memory Match' : '-'}</td>
                    <td className="px-4 py-3 text-xs">{new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${promo.active_flag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{promo.active_flag ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{promo.description}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">No game promos found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="border-b-2 border-primary-200 my-8"></div>
      </div>
      {/* --- End Game Promos Table Section --- */}
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Promotions Management</h1>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Type</label>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value as any);
                setTargetId('');
                setIsCodeManuallySet(false);
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="sitewide">Sitewide</option>
              <option value="category">Category</option>
              <option value="brand">Brand</option>
              <option value="product">Product</option>
            </select>
          </div>
          
          {/* Target ID */}
          <div className={targetType === 'sitewide' ? 'opacity-50' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
            </label>
            <select
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setIsCodeManuallySet(false);
              }}
              disabled={targetType === 'sitewide'}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
            >
              <option value="">Select a {targetType}...</option>
              {targetOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} {(option as Product).sku ? `(${(option as Product).sku})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
            <select
              value={discountType}
              onChange={(e) => {
                setDiscountType(e.target.value as any);
                setDiscountValue(''); // Clear value on type change to prevent errors
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>

          {/* Discount Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value</label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => {
                setDiscountValue(e.target.value);
                setIsCodeManuallySet(false);
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={discountType === 'percentage' ? 'e.g., 15 for 15%' : 'e.g., 500 for ₹500'}
              required
            />
          </div>
          
          {/* Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-md"/>
          </div>

          {/* Description */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md" placeholder="e.g., Summer Sale on Electronics"/>
          </div>
          
          {/* Promotion Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Promotion Code</label>
            <input
              type="text"
              value={promotionCode}
              onChange={(e) => {
                setPromotionCode(e.target.value.toUpperCase());
                setIsCodeManuallySet(true); // User is typing, so lock auto-generation
              }}
              className="w-full p-3 border border-gray-300 rounded-md font-mono"
              placeholder="Auto-generated or enter custom"
            />
          </div>

        </div>
        
        <div className="mt-6 flex gap-4">
          <button type="submit" disabled={loading} className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
          </button>
          
          {editingPromotion && (
            <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 transition-colors">
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md" placeholder="Search by code, description, or target..."/>
          <select value={filterTargetType} onChange={(e) => setFilterTargetType(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md">
            <option value="">Filter by Target Type</option>
            <option value="game">Game</option>
            <option value="sitewide">Sitewide</option>
            <option value="category">Category</option>
            <option value="brand">Brand</option>
            <option value="product">Product</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Code', 'Target', 'Discount', 'Dates', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && !promotions.length ? (
                 <tr><td colSpan={6} className="px-6 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-500" /></td></tr>
              ) : filteredPromotions.length > 0 ? filteredPromotions.map((p) => (
                  <tr key={p.promotion_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><span className="font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded">{p.code}</span></td>
                    <td className="px-6 py-4">
                      <span className="capitalize font-semibold">{p.target?.type || 'Sitewide'}</span>
                      {p.target && <span className="block text-xs text-gray-500">{p.target.name}</span>}
                    </td>
                    <td className="px-6 py-4">{p.discount_type === 'percentage' ? `${p.discount_value}%` : `₹${p.discount_value}`}</td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${p.active_flag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.active_flag ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-3">
                        <button onClick={() => handleEdit(p)} title="Edit"><Edit size={18} className="text-blue-600 hover:text-blue-900" /></button>
                        <button onClick={() => handleDelete(p.promotion_id)} title="Delete"><Trash2 size={18} className="text-red-600 hover:text-red-900" /></button>
                        <button onClick={() => handleToggleActive(p)} title={p.active_flag ? 'Deactivate' : 'Activate'}>
                          {p.active_flag ? <ToggleRight size={18} className="text-green-600 hover:text-green-800" /> : <ToggleLeft size={18} className="text-gray-400 hover:text-gray-600" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No promotions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Promotions;