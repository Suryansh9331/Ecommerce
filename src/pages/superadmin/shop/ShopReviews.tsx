import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';

// Types
interface Shop { shop_id: number; name: string; slug?: string; logo_url?: string }
interface Product { product_id: number; product_name: string }

const ShopReviewOverview: React.FC = () => {
  // Navigation state
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Filter state
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | 'all'>('all');

  // Live data state
  const [shops, setShops] = useState<Shop[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsPage, setProductsPage] = useState(1);
  const [productsPages, setProductsPages] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [reviewCounts, setReviewCounts] = useState<Record<number, number>>({});

  // Reviews state (top-level to keep hooks order stable)
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [reviewPage, setReviewPage] = React.useState(1);
  const [reviewPages, setReviewPages] = React.useState(1);
  const [reviewLoading, setReviewLoading] = React.useState(false);

  const API_BASE = (window as any).API_BASE_URL || 'https://api.aoin11.com';

  // Load shops
  React.useEffect(() => {
    const loadShops = async () => {
      try {
        setLoadingShops(true);
        const res = await fetch(`${API_BASE}/api/shop/shops`);
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          setShops(data.data || []);
        }
      } catch (e) {
        console.error('Failed to load shops', e);
      } finally {
        setLoadingShops(false);
      }
    };
    loadShops();
  }, []);

  // Load products for selected shop
  React.useEffect(() => {
    if (!selectedShop) return;
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch(`${API_BASE}/api/shop/products?shop_id=${selectedShop.shop_id}&page=${productsPage}&per_page=20`);
        const data = await res.json();
        if (res.ok && data && data.products) {
          setProducts(data.products);
          setProductsPages(data.pagination?.pages || 1);
        } else {
          setProducts([]);
          setProductsPages(1);
        }
      } catch (e) {
        console.error('Failed to load shop products', e);
        setProducts([]);
        setProductsPages(1);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, [selectedShop?.shop_id, productsPage]);

  // Lazy load review counts for listed products
  React.useEffect(() => {
    if (!selectedShop || products.length === 0) return;
    const controller = new AbortController();
    const fetchCounts = async () => {
      const entries = await Promise.all(products.map(async (p) => {
        try {
          const r = await fetch(`${API_BASE}/api/shop-reviews/product/${p.product_id}?page=1&per_page=1`, { signal: controller.signal });
          const json = await r.json();
          if (r.ok && json.status === 'success') {
            return [p.product_id, json.data.total] as const;
          }
        } catch {}
        return [p.product_id, 0] as const;
      }));
      const map: Record<number, number> = {};
      entries.forEach(([id, count]) => { map[id] = count; });
      setReviewCounts(prev => ({ ...prev, ...map }));
    };
    fetchCounts();
    return () => controller.abort();
  }, [selectedShop?.shop_id, products]);

  // Load reviews for selected product
  React.useEffect(() => {
    if (!selectedProduct) return;
    const fetchReviews = async () => {
      try {
        setReviewLoading(true);
        const res = await fetch(`${API_BASE}/api/shop-reviews/product/${selectedProduct.product_id}?page=${reviewPage}&per_page=10`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            setReviews(data.data.reviews);
            setReviewPages(data.data.pages);
          }
        }
      } catch (e) {
        console.error('Failed to load shop product reviews', e);
      } finally {
        setReviewLoading(false);
      }
    };
    fetchReviews();
  }, [selectedProduct?.product_id, reviewPage]);

  // Small pager component
  const Pager: React.FC<{ page: number; pages: number; onChange: (p: number) => void; className?: string }> = ({ page, pages, onChange, className }) => (
    pages > 1 ? (
      <div className={"flex items-center gap-2 " + (className || '')}>
        <button disabled={page===1} onClick={()=>onChange(page-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <span className="text-sm text-gray-600">Page {page} of {pages}</span>
        <button disabled={page===pages} onClick={()=>onChange(page+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
    ) : null
  );

  // --- Shop List View ---
  if (!selectedShop) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-gray-50 min-h-screen p-4 sm:p-8">
        <div className="max-w-full mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary-100 p-2 rounded-full">
              <SparklesIcon className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Shop Reviews Overview</h1>
          </div>
          {loadingShops && <div className="text-gray-500">Loading shops…</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {shops.map((shop: Shop) => (
              <div
                key={shop.shop_id}
                className="bg-white rounded-2xl p-6 shadow-lg border border-primary-100 cursor-pointer hover:scale-[1.03] hover:shadow-2xl transition-all group relative"
                onClick={() => {
                  setSelectedShop(shop);
                  setProducts([]);
                  setProductsPage(1);
                  setProductsPages(1);
                  setReviewCounts({});
                }}
              >
                <div className="text-lg font-bold mb-2 text-gray-800 group-hover:text-primary-600 transition">{shop.name}</div>
                <div className="text-xs text-gray-500">Shop #{shop.shop_id}</div>
              </div>
            ))}
          </div>
          {(!loadingShops && shops.length === 0) && (
            <div className="flex flex-col items-center mt-16">
              <SparklesIcon className="h-12 w-12 text-gray-300 mb-2" />
              <div className="text-gray-400 text-lg">No shops found.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Product Table View ---
  if (selectedShop && !selectedProduct) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-gray-50 min-h-screen p-4 sm:p-8">
        <div className="max-w-full mx-auto">
          <button
            className="mb-6 flex items-center gap-1 text-primary-600 hover:underline hover:text-primary-700 text-sm font-medium"
            onClick={() => setSelectedShop(null)}
          >
            <span className="text-lg">←</span> Back to Shops
          </button>
          <div className="flex items-center gap-3 mb-6">
            <SparklesIcon className="h-7 w-7 text-primary-400" />
            <h2 className="text-2xl font-bold text-gray-900">Products in {selectedShop.name}</h2>
          </div>
          <div className="overflow-x-auto bg-white shadow-xl rounded-2xl border border-primary-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Product Id</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Reviews</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loadingProducts && (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400 font-medium">Loading…</td></tr>
                )}
                {!loadingProducts && products.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400 font-medium">No products found.</td></tr>
                )}
                {!loadingProducts && products.map(product => {
                  const count = reviewCounts[product.product_id] ?? 0;
                  return (
                    <tr key={product.product_id} className="hover:bg-primary-50/40 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-gray-700">{product.product_id}</td>
                      <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-900">{product.product_name}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="bg-primary-50 text-primary-600 text-xs font-semibold px-2 py-0.5 rounded-full">{count} review{count !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          className="text-primary-600 hover:underline hover:text-primary-700 font-semibold text-sm px-3 py-1 rounded transition"
                          onClick={() => {
                            setSelectedProduct(product);
                            setReviewRatingFilter('all');
                          }}
                        >
                          View Reviews
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pager page={productsPage} pages={productsPages} onChange={setProductsPage} className="p-4" />
          </div>
        </div>
      </div>
    );
  }

  // --- Review Table View ---
  if (selectedShop && selectedProduct) {
    const filteredReviews = reviewRatingFilter === 'all'
      ? reviews
      : reviews.filter((r: any) => r.rating === reviewRatingFilter);
    return (
      <div className="bg-gradient-to-br from-primary-50 to-gray-50 min-h-screen p-4 sm:p-8">
        <div className="max-w-full mx-auto">
          <button
            className="mb-6 flex items-center gap-1 text-primary-600 hover:underline hover:text-primary-700 text-sm font-medium"
            onClick={() => setSelectedProduct(null)}
          >
            <span className="text-lg">←</span> Back to Products
          </button>
          <div className="flex items-center gap-3 mb-6">
            <SparklesIcon className="h-7 w-7 text-primary-400" />
            <h2 className="text-2xl font-bold text-gray-900">Reviews for {selectedProduct.product_name} <span className="text-base font-normal text-gray-500">(in {selectedShop.name})</span></h2>
          </div>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <label className="font-medium text-gray-700">Filter by Rating:</label>
            <select
              className="border border-primary-200 rounded px-2 py-1 focus:ring-2 focus:ring-primary-300"
              value={reviewRatingFilter}
              onChange={e => setReviewRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">All</option>
              {[5,4,3,2,1].map(r => (
                <option key={r} value={r}>{r} Stars</option>
              ))}
            </select>
            <button
              className="ml-auto px-3 py-1.5 text-sm border rounded bg-white hover:bg-primary-50 text-primary-700"
              onClick={() => {
                // CSV export of currently loaded filtered reviews
                const rows = filteredReviews.map((rev: any) => ({
                  review_id: rev.review_id ?? rev.id,
                  user: rev?.user ? `${rev.user.first_name ?? ''} ${rev.user.last_name ?? ''}`.trim() || rev.user.email || (rev.user.id ? `User #${rev.user.id}` : '') : (rev.user_id ? `User #${rev.user_id}` : ''),
                  rating: rev.rating,
                  title: rev.title || '',
                  body: (rev.body || '').replace(/\n/g, ' '),
                  created_at: rev.created_at || '',
                  images: (rev.images?.length || 0)
                }));
                const header = Object.keys(rows[0] || {review_id:'',user:'',rating:'',title:'',body:'',created_at:'',images:''});
                const csv = [header.join(','), ...rows.map(r => header.map(k => `"${String((r as any)[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `product_${selectedProduct?.product_id}_reviews.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto bg-white shadow-xl rounded-2xl border border-primary-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Reviewer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Title / Review</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Images</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {reviewLoading && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400">Loading…</td>
                  </tr>
                )}
                {filteredReviews.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400 font-medium">
                      <div className="flex flex-col items-center">
                        <SparklesIcon className="h-10 w-10 text-gray-200 mb-2" />
                        No reviews found.
                      </div>
                    </td>
                  </tr>
                )}
                {filteredReviews.map((review: any) => {
                  const nameFromUser = review?.user
                    ? ((review.user.first_name || review.user.last_name)
                        ? `${review.user.first_name ?? ''} ${review.user.last_name ?? ''}`.trim()
                        : (review.user.email || (review.user.id ? `User #${review.user.id}` : 'Unknown')))
                    : (review.user_id ? `User #${review.user_id}` : 'Unknown');
                  const created = review?.created_at ? new Date(review.created_at) : null;
                  return (
                    <tr key={review.review_id ?? review.id} className="hover:bg-primary-50/40 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-900">{nameFromUser}</td>
                      <td className="px-4 py-4 whitespace-nowrap flex items-center gap-2">
                        <span className="text-lg text-primary-500 font-bold">{review.rating}</span>
                        <div className="flex items-center">
                          {[1,2,3,4,5].map(i => (
                            <StarIcon key={i} className={`h-4 w-4 ${i <= review.rating ? 'text-primary-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {review.title && <div className="font-semibold text-gray-900 mb-0.5">{review.title}</div>}
                        <div className="text-gray-700">{review.body || '-'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {(review.images || []).slice(0,3).map((img: any) => (
                            <img key={img.image_id} src={img.image_url} alt="review" className="h-10 w-10 object-cover rounded" />
                          ))}
                          {review.images?.length > 3 && (
                            <span className="text-xs text-gray-500">+{review.images.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-500">{created ? created.toLocaleDateString() : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 pb-4">
              <Pager page={reviewPage} pages={reviewPages} onChange={setReviewPage} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ShopReviewOverview; 