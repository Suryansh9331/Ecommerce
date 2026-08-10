import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/globals.css';
import Header from '../components/shop/shop1/Header';
import Hero from '../components/shop/shop1/Productpage/Hero';
// import FashionCardsSection from '../components/shop/shop1/Productpage/FashionCardsSection';
// import RatingsReviews from '../components/shop/shop1/Productpage/Rating';
import SimilarProducts from '../components/shop/shop1/Productpage/SimilarProducts';
import InstagramPromo from '../components/shop/shop1/Productpage/InstagramPromo';
import shop1ApiService, { Product } from '../services/shop1ApiService';
import { Star } from 'lucide-react';

import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/ToastContainer';
function Shop1ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Shop Reviews (real data) ---
  interface ShopReviewImage { image_id: number; image_url: string }
  interface ShopReview {
    review_id: number;
    shop_product_id: number;
    user_id: number;
    shop_order_id: string;
    rating: number;
    title: string;
    body: string;
    created_at: string;
    images?: ShopReviewImage[];
    user?: { first_name?: string; last_name?: string } | null;
  }
  const [shopReviews, setShopReviews] = useState<ShopReview[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPages, setReviewsPages] = useState(1);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '', orderId: '' });
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  // Images state for review
  type SelectedImage = { file: File; preview: string };
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const MAX_IMAGES = 5;
  const MAX_BYTES = 5 * 1024 * 1024; // 5MB

  const readFileAsDataURL = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageError(null);

    // Enforce max count
    const availableSlots = Math.max(0, MAX_IMAGES - selectedImages.length);
    const toAdd = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      setImageError(`You can upload up to ${MAX_IMAGES} images`);
    }

    // Validate size and build previews
    const validFiles: File[] = [];
    for (const f of toAdd) {
      if (f.size > MAX_BYTES) {
        setImageError('Each image must be smaller than 5 MB');
        continue;
      }
      validFiles.push(f);
    }

    const newSelections: SelectedImage[] = [];
    for (const vf of validFiles) {
      const preview = await readFileAsDataURL(vf);
      newSelections.push({ file: vf, preview });
    }
    setSelectedImages(prev => [...prev, ...newSelections]);
    // reset input
    e.currentTarget.value = '';
  };

  const removeImageAt = (idx: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== idx));
  };

  const { toasts, error: showError } = useToast();

  const fetchShopReviews = async (p: number = 1) => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      const res = await shop1ApiService.getShopProductReviews(Number(id), p, 5);
      if (res.status === 'success') {
        setShopReviews(res.data.reviews as ShopReview[]);
        setReviewsPage(res.data.current_page);
        setReviewsPages(res.data.pages);
        setAvgRating(typeof res.data.average_rating === 'number' ? res.data.average_rating : (res.data.reviews.length ? (res.data.reviews.reduce((a: number, r: any) => a + (r.rating||0), 0) / res.data.reviews.length) : 0));
        setReviewCount(typeof res.data.review_count === 'number' ? res.data.review_count : res.data.total);
      }
    } catch (e) {
      console.error('Failed to load reviews', e);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // Use the proper API call for individual product
        const response = await shop1ApiService.getProductById(parseInt(id));
        
        if (response && response.success) {
          setProduct(response.product);
          setRelatedProducts(response.related_products || []);
        } else {
          setProduct(null);
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchShopReviews(1);
  }, [id]);

  // Eligibility will be checked when clicking Write Review

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
  const jwt = localStorage.getItem('access_token') || '';
  // Use previews (already base64 data URLs)
  const imagesBase64 = selectedImages.map(si => si.preview);

      const payload = {
        shop_order_id: newReview.orderId.trim(),
        shop_product_id: Number(id),
        rating: newReview.rating,
        title: newReview.title.trim() || 'Review',
        body: newReview.comment.trim(),
        images: imagesBase64,
      };
      await shop1ApiService.createShopReview(payload, jwt);
      setShowWriteReview(false);
      setNewReview({ rating: 5, title: '', comment: '', orderId: '' });
      setSelectedImages([]);
      fetchShopReviews(1);
    } catch (err: any) {
showError(err.message || 'Failed to submit review');    }
  };

  // On clicking Write Review: find delivered order containing this product
  const handleOpenReview = async () => {
    setEligibilityChecked(false);
    setEligibilityError(null);
    try {
  const jwt = localStorage.getItem('access_token') || '';
      if (!jwt) {
        setEligibilityError('Please sign in to review.');
        setEligibilityChecked(true);
        return;
      }
      if (!id) return;
      // Build candidate product IDs (parent + variants) to match against order items
      const candidateIds = new Set<number>([Number(id)]);
      if (product && Array.isArray((product as any).variants)) {
        (product as any).variants.forEach((v: any) => {
          if (typeof v?.product_id === 'number') candidateIds.add(Number(v.product_id));
          if (typeof v?.variant_product_id === 'number') candidateIds.add(Number(v.variant_product_id));
        });
      }
      let page = 1;
      let hasNext = true;
      let latestMatch: any = null;
      while (hasNext && page <= 5) {
        const res = await shop1ApiService.getMyShopOrders(page, 50, jwt);
        if (res.success) {
          (res.data.orders || []).forEach((o: any) => {
            const isDelivered = String(o.order_status).toLowerCase() === 'delivered';
            const hasProduct = Array.isArray(o.items) && o.items.some((it: any) => candidateIds.has(Number(it.product_id)));
            if (isDelivered && hasProduct) {
              if (!latestMatch || new Date(o.order_date) > new Date(latestMatch.order_date)) {
                latestMatch = o;
              }
            }
          });
          hasNext = Boolean(res.data?.pagination?.has_next);
          page += 1;
        } else {
          hasNext = false;
        }
      }
      if (latestMatch) {
        setNewReview(prev => ({ ...prev, orderId: latestMatch.order_id }));
        setShowWriteReview(true);
      } else {
        setEligibilityError("Not allowed: either this product wasn't ordered, or the order isn't delivered yet.");
      }
    } catch (e: any) {
      setEligibilityError(e?.message || 'Failed to check eligibility');
    } finally {
      setEligibilityChecked(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white scroll-smooth overflow-x-hidden">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white scroll-smooth overflow-x-hidden">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Product not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white scroll-smooth overflow-x-hidden">
      <Header />
      
  <Hero productData={product} avgRating={avgRating} reviewCount={reviewCount} />
      {/* <FashionCardsSection /> */}
      {/* Reviews Section (real data with delivered-order gating) */}
      <div className="max-w-5xl w-full mx-auto mt-10 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold">Reviews</h2>
            <p className="underline text-sm text-gray-600">Showing {shopReviews.length} review{shopReviews.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            <button onClick={handleOpenReview} className="px-5 py-2.5 bg-black text-white rounded-full font-semibold text-sm w-full sm:w-auto">Write Review</button>
            {eligibilityChecked && eligibilityError && (
              <p className="text-red-500 text-xs">{eligibilityError}</p>
            )}
          </div>
        </div>

    {showWriteReview && (
          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Write your review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-3">
      {/* orderId is set after eligibility check */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Rating</label>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button type="button" key={star} onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}>
                      <Star className={`w-4 h-4 ${star <= newReview.rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Title</label>
                <input value={newReview.title} onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))} className="w-full p-2 border rounded" placeholder="Great product!" required />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Your review</label>
                <textarea value={newReview.comment} onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))} className="w-full p-2 border rounded min-h-[100px]" placeholder="Share your thoughts…" required />
              </div>
              {/* Images uploader */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Add photos (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                />
                <p className="text-xs text-gray-500 mt-1">Up to 5 images, each less than 5 MB.</p>
                {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
                {selectedImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {selectedImages.map((si, idx) => (
                      <div key={idx} className="relative group">
                        <img src={si.preview} alt={`preview-${idx}`} className="h-16 w-16 object-cover rounded border" />
                        <button
                          type="button"
                          onClick={() => removeImageAt(idx)}
                          className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 text-xs font-bold hidden group-hover:flex items-center justify-center"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={!eligibilityChecked || !newReview.orderId} className={`px-4 py-2 rounded text-white ${(!eligibilityChecked || !newReview.orderId) ? 'bg-gray-400 cursor-not-allowed' : 'bg-black'}`}>Submit</button>
                <button type="button" onClick={() => { setShowWriteReview(false); setSelectedImages([]); }} className="px-4 py-2 rounded border">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {reviewsLoading ? (
          <div className="text-gray-500">Loading reviews…</div>
        ) : shopReviews.length > 0 ? (
          <div>
            {shopReviews.map((review) => (
              <div key={review.review_id} className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div>
                      <h3 className="font-semibold text-base">{review.user?.first_name || 'User'}</h3>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 whitespace-nowrap">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-gray-800">{review.title ? `${review.title} — ` : ''}{review.body}</p>
                {Array.isArray(review.images) && review.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {review.images.slice(0, 5).map((img, idx) => (
                      <button
                        key={img.image_id ?? idx}
                        type="button"
                        className="group relative"
                        onClick={() => {
                          try {
                            const urls = (review.images || []).map((ri: any) => ri.image_url).filter(Boolean);
                            (window as any).__shop1_setViewer({ urls, index: idx });
                          } catch {}
                        }}
                        aria-label="View image"
                      >
                        <img src={img.image_url} alt={`review image ${idx + 1}`} className="h-16 w-16 object-cover rounded border" />
                      </button>
                    ))}
                  </div>
                )}
                <hr className="mt-3" />
              </div>
            ))}
            {reviewsPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button disabled={reviewsPage===1} onClick={() => fetchShopReviews(reviewsPage-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                <span className="text-gray-500">Page {reviewsPage} of {reviewsPages}</span>
                <button disabled={reviewsPage===reviewsPages} onClick={() => fetchShopReviews(reviewsPage+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">No reviews yet.</div>
        )}
      </div>

      <SimilarProducts relatedProducts={relatedProducts} />
      <InstagramPromo />
      {/* Simple image viewer overlay for review images */}
      <ReviewImageViewerShop1 />
      <ToastContainer toasts={toasts} />
    </div>  
  );
}

export default Shop1ProductPage;

// Lightweight viewer for review images (Shop1)
function ReviewImageViewerShop1() {
  const [state, setState] = useState<{ urls: string[]; index: number } | null>(null);
  useEffect(() => {
    (window as any).__shop1_setViewer = (payload: any) => setState(payload);
    return () => { delete (window as any).__shop1_setViewer; };
  }, []);
  if (!state) return null;
  const { urls, index } = state;
  const close = () => setState(null);
  const prev = () => setState({ urls, index: (index - 1 + urls.length) % urls.length });
  const next = () => setState({ urls, index: (index + 1) % urls.length });
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={close}>
      <div className="relative max-w-3xl w-[90%]" onClick={(e) => e.stopPropagation()}>
        <button className="absolute -top-10 right-0 text-white text-2xl" onClick={close} aria-label="Close">×</button>
        <div className="relative flex items-center justify-center bg-black rounded">
          <button className="absolute left-0 p-3 text-white" onClick={prev} aria-label="Previous">‹</button>
          <img src={urls[index]} alt="review" className="max-h-[80vh] w-auto object-contain" />
          <button className="absolute right-0 p-3 text-white" onClick={next} aria-label="Next">›</button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {urls.map((u, i) => (
            <img key={i} src={u} alt={`thumb-${i}`} className={`h-12 w-12 object-cover rounded border ${i===index?'border-black':'border-gray-300'}`} onClick={() => setState({ urls, index: i })} />
          ))}
        </div>
      </div>
    </div>
  );
}