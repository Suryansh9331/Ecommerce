import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, ShoppingCart, ChevronDown, ChevronUp, Star, ThumbsUp, ThumbsDown, Heart } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { useShopWishlistOperations } from '../../../../hooks/useShopWishlist';
import { useShopCartOperations } from '../../../../context/ShopCartContext';
import Shop4ProductCardWithWishlist from '../Shop4ProductCardWithWishlist';
import shop4ApiService, { 
  Product as ApiProduct, 
  ProductVariant, 
  VariantAttribute
} from '../../../../services/shop4ApiService';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../../../hooks/useAmazonTranslate';
import { useToast } from '../../../../hooks/useToast';
import { ToastContainer } from '../../../ui/ToastContainer';
// --- StarRating ---
interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 'md', showNumber = false }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };


  return (
    <div className="flex items-center gap-1">
       {showNumber && (
        <span className="text-white text-sm sm:text-lg font-semibold ml-2">{rating}</span>
      )}
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? 'text-[#CCE208] fill-yellow-400' : 'text-gray-600'
          }`}
        />
      ))}
    </div>
  );
};

// --- Product Interface for Shop4ProductCard ---
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  background?: string;
  discount?: number;
  selected?: boolean;
}

// --- ReviewCard ---
interface ShopReviewImage {
  image_id: number;
  image_url: string;
  sort_order: number;
  type: string;
  created_at?: string;
  updated_at?: string;
}

interface ShopReview {
  review_id: number;
  shop_product_id: number;
  user_id: number;
  shop_order_id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  images: ShopReviewImage[];
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface ReviewCardProps {
  review: ShopReview;
  tTitle?: string;
  tBody?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, tTitle, tBody }) => {
  const [helpfulCount, setHelpfulCount] = useState<number>(0);
  const [notHelpfulCount, setNotHelpfulCount] = useState<number>(0);
  const [voted, setVoted] = useState<'helpful' | 'not-helpful' | null>(null);

  const handleVote = (type: 'helpful' | 'not-helpful') => {
    if (voted) return; // Prevent multiple votes
    
    if (type === 'helpful') {
  setHelpfulCount((prev: number) => prev + 1);
    } else {
  setNotHelpfulCount((prev: number) => prev + 1);
    }
    setVoted(type);
  };

  return (
    <div className="border-b border-gray-700 pb-6 mb-6 last:border-b-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - Profile Information */}
        <div className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-[87px] sm:h-[87px] bg-[#323232] rounded-full flex items-center justify-center text-[#FFF] text-base sm:text-[20px] font-normal font-futura flex-shrink-0" >
              MS
            </div>
            
            {/* Reviewer Info */}
            <div className="flex flex-col">
              <h4 className="text-white font-medium text-sm sm:text-base">
                <span className="text-[#FFF] text-base sm:text[18px] font-[450] leading-normal font-futura ">{review.user?.first_name || 'User'}</span>
              </h4>
              <p className="text-[#FFF] text-sm sm:text-[16px] font-[450] leading-normal font-futura">Germany</p>
              <div className="flex mt-1">
                <div className="w-[79.806px] h-[11.897px] flex-shrink-0">
                  <StarRating rating={review.rating} size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Review Content and Interactivity */}
        <div className="lg:col-span-8 relative">
          {/* Vertical Separator Line - Hidden on mobile */}
          <div className="hidden lg:block absolute left-[-50px] top-0 bottom-0 w-px bg-gray-400"></div>
          
          <div className="lg:pl-4 mt-2">
            {/* Review Headline */}
            <h4 className="text-white font-semibold text-sm sm:text-base">{tTitle || review.title}</h4>
            <p className="text-[#FFF] text-sm sm:text-[14px] font-normal leading-normal font-poppins mb-4">{tBody || review.body}</p>
            {/* Review Images Thumbnails */}
            {Array.isArray(review.images) && review.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {review.images.slice(0,5).map((img, idx) => (
                  <button
                    key={img.image_id ?? idx}
                    type="button"
                    className="group relative"
                    onClick={() => {
                      try {
                        const urls = (review.images || []).map((ri: any) => ri.image_url).filter(Boolean);
                        (window as any).__shop4_setViewer({ urls, index: idx });
                      } catch {}
                    }}
                    aria-label="View image"
                  >
                    <img src={img.image_url} alt={`review image ${idx + 1}`} className="h-16 w-16 object-cover rounded border border-gray-700" />
                  </button>
                ))}
              </div>
            )}
            
            {/* Helpfulness Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-[#FFF] text-sm sm:text-[16px] font-[450] leading-normal font-futura">Was this helpful?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote('helpful')}
                  disabled={voted !== null}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                    voted === 'helpful' 
                      ? 'text-[#B19D7F] bg-[#B19D7F]/10' 
                      : voted
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-[#B19D7F] hover:bg-[#B19D7F]/10'
                  }`}
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span className="text-white">{helpfulCount}</span>
                </button>
                
                <button
                  onClick={() => handleVote('not-helpful')}
                  disabled={voted !== null}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                    voted === 'not-helpful' 
                      ? 'text-gray-400 bg-gray-400/10' 
                      : voted
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-400 hover:bg-gray-400/10'
                  }`}
                >
                  <ThumbsDown className="w-3 h-3" />
                  <span className="text-white">{notHelpfulCount}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Timestamp */}
        <div className="lg:col-span-1">
          <span className="text-white text-xs sm:text-sm">{new Date(review.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

// --- ReviewsSection ---
const reviewsData: ShopReview[] = [];

interface ReviewsSectionProps {
  productId: number;
  allowedProductIds?: number[];
  onSummaryChange?: (avg: number, count: number) => void;
}
const ReviewsSection: React.FC<ReviewsSectionProps> = ({ productId, allowedProductIds, onSummaryChange }) => {
  const [activeTab, setActiveTab] = useState('reviews');
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '', orderId: '' });
  const [reviews, setReviews] = useState<ShopReview[]>(reviewsData);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  // Review images state
  type SelectedImage = { file: File; preview: string };
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  // Ratings summary
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  // Display-only translations for review content
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();
  const [tReviews, setTReviews] = useState<Record<number, { title?: string; body?: string }>>({});
  const MAX_IMAGES = 5;
  const MAX_BYTES = 5 * 1024 * 1024;
  const readFileAsDataURL = (file: File) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file); });
  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageError(null);
    const available = Math.max(0, MAX_IMAGES - selectedImages.length);
    const toAdd = files.slice(0, available);
    if (files.length > available) setImageError(`You can upload up to ${MAX_IMAGES} images`);
    const valid: File[] = [];
    for (const f of toAdd) { if (f.size > MAX_BYTES) { setImageError('Each image must be smaller than 5 MB'); continue; } valid.push(f); }
    const newSel: SelectedImage[] = [];
    for (const f of valid) { const preview = await readFileAsDataURL(f); newSel.push({ file: f, preview }); }
    setSelectedImages(prev => [...prev, ...newSel]);
    e.currentTarget.value = '';
  };
  const removeImageAt = (idx: number) => setSelectedImages(prev => prev.filter((_, i) => i !== idx));
  // Derived fallbacks in case server doesn't provide summary
  const derivedAvg = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) : 0;
  const derivedCount = reviews.length;

  const fetchReviews = async (p: number = 1) => {
    try {
      setLoading(true);
      const res = await shop4ApiService.getShopProductReviews(productId, p, 5);
      if (res.status === 'success') {
        setReviews(res.data.reviews);
        setPages(res.data.pages);
        setPage(res.data.current_page);
        const avg = typeof res.data.average_rating === 'number' ? res.data.average_rating : derivedAvg;
        const cnt = typeof res.data.review_count === 'number' ? res.data.review_count : (res.data.total ?? derivedCount);
        setAvgRating(avg);
        setReviewCount(cnt);
        if (onSummaryChange) onSummaryChange(avg, cnt);
      }
    } catch (e) {
      console.error('Failed to load reviews', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [productId]);

  // Translate review titles/bodies when language or list changes
  useEffect(() => {
    const lang = i18n.language || 'en';
    if (!reviews.length || lang === 'en') {
      setTReviews({});
      return;
    }
    const run = async () => {
      try {
        const items: { id: string; text: string }[] = [];
        reviews.forEach(r => {
          if (r.title) items.push({ id: `t:${r.review_id}`, text: r.title });
          if (r.body) items.push({ id: `b:${r.review_id}`, text: r.body });
        });
        if (!items.length) { setTReviews({}); return; }
        const map = await translateBatch(items, lang, 'text/plain');
        const out: Record<number, { title?: string; body?: string }> = {};
        reviews.forEach(r => {
          const title = map[`t:${r.review_id}`];
          const body = map[`b:${r.review_id}`];
          if (title || body) out[r.review_id] = { title, body };
        });
        setTReviews(out);
      } catch {
        setTReviews(prev => prev);
      }
    };
    run();
  }, [reviews, i18n.language, translateBatch]);

  // On-click eligibility like other shops
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
      let page = 1;
      let hasNext = true;
      let foundOrderId = '';
      while (hasNext && page <= 5 && !foundOrderId) {
        const res = await shop4ApiService.getMyShopOrders(page, 50, jwt);
        if (res.success) {
          const ids = (allowedProductIds && allowedProductIds.length > 0) ? allowedProductIds : [Number(productId)];
          const match = (res.data.orders || []).find((o: any) =>
            String(o.order_status).toLowerCase() === 'delivered' &&
            Array.isArray(o.items) && o.items.some((it: any) => ids.includes(Number(it.product_id)))
          );
          if (match) {
            foundOrderId = match.order_id;
            break;
          }
          hasNext = Boolean(res.data?.pagination?.has_next);
          page += 1;
        } else {
          hasNext = false;
        }
      }
      if (foundOrderId) {
        setNewReview(prev => ({ ...prev, orderId: foundOrderId }));
        setShowWriteReview(true);
      } else {
        setEligibilityError("Not allowed: either this product wasn't ordered, or the order isn't delivered yet.");
      }
    } catch (e: any) {
      console.error('Failed to check eligibility', e);
      setEligibilityError(e?.message || 'Failed to check eligibility');
    } finally {
      setEligibilityChecked(true);
    }
  };
const { toasts, error: showError } = useToast();
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const jwt = localStorage.getItem('access_token') || '';
      const payload = {
        shop_order_id: newReview.orderId.trim(),
        shop_product_id: productId,
        rating: newReview.rating,
        title: newReview.title.trim() || 'Review',
        body: newReview.comment.trim(),
        images: selectedImages.map(si => si.preview),
      };
      await shop4ApiService.createShopReview(payload, jwt);
      setShowWriteReview(false);
      setNewReview({ rating: 5, title: '', comment: '', orderId: '' });
      setSelectedImages([]);
      fetchReviews(1);
    } catch (err: any) {
      console.error(err);
     showError(err.message || 'Failed to submit review');
    }
  };

  return (
    <div className="bg-black text-white min-h-screen px-4 sm:px-6 lg:px-16 py-8">
      <div className="max-w-[1640px] mx-auto">
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-0">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-2 sm:py-4 px-4 sm:px-6 border-b-[3px] sm:border-b-[5px] font-medium text-sm sm:text-base transition-colors duration-200 ${activeTab === 'reviews' ? 'border-white text-white ' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
            >
              <span className="text-white font-futura text-lg sm:text-xl lg:text-[30px] font-normal leading-normal">Reviews</span>
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-2 sm:py-4 px-4 sm:px-6 border-b-[3px] sm:border-b-[5px] font-medium text-sm sm:text-base transition-colors duration-200 ${activeTab === 'questions' ? 'border-white text-white ' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
            >
              <span className="text-white font-futura text-lg sm:text-xl lg:text-[30px] font-normal leading-normal">Questions (1)</span>
            </button>
          </nav>
        </div>

        <div className="min-h-[500px]">
          {activeTab === 'reviews' && (
            <div>
              <div className="text-center mb-8 sm:mb-12 py-6 sm:py-10">
                <div className="flex items-center justify-center mb-2 relative">
                  <span className="text-white font-normal leading-[52px] text-xl sm:text-[30px] capitalize mr-4 font-futura ">{avgRating.toFixed(1)}</span>
                  
                  <StarRating rating={avgRating} size="lg" />
                </div>
                <p className="text-white font-normal leading-[30px] text-sm sm:text-[16px] capitalize mb-4 sm:mb-6 font-futura">
                  Based On {reviewCount} Review{reviewCount !== 1 ? 's' : ''}, Rating Is Calculated
                </p>
                <button onClick={handleOpenReview} className="bg-[#B19D7F] hover:bg-[#A08F75] text-white leading-normal uppercase font-futura flex-shrink-0 w-full sm:w-[205px] h-[40px] sm:h-[50.15px] text-xs sm:text-[14px] font-[450] tracking-[2.1px]">WRITE A REVIEW</button>
                {eligibilityChecked && eligibilityError && (
                  <p className="text-red-400 text-xs mt-3">{eligibilityError}</p>
                )}
              </div>
              
              {showWriteReview && (
                <div className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-8">
                  <h3 className="text-white text-base sm:text-lg font-medium mb-4">Write Your Review</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Order</label>
                      <input value={newReview.orderId} readOnly className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-amber-500 focus:outline-none" placeholder="Verified after eligibility check" />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Rating</label>
                      <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                          <button
                              key={star}
                              type="button"
                              onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                              className="p-1"
                          >
                              <StarRating rating={star <= newReview.rating ? 5 : 0} size="lg" />
                          </button>
                          ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Title</label>
                      <input value={newReview.title} onChange={(e)=>setNewReview(prev=>({...prev, title: e.target.value}))} className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-amber-500 focus:outline-none" placeholder="Great product!" required />
                    </div>
                    <div>
                    <label className="block text-gray-300 text-sm mb-2">Your Review</label>
                    <textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                        className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-amber-500 focus:outline-none resize-vertical min-h-[120px]"
                        placeholder="Share your thoughts about this product..."
                        required
                    />
                    </div>
                    {/* Images uploader */}
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Add photos (optional)</label>
                      <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#BB9D7B] file:text-white hover:file:bg-[#a8896a]" />
                      <p className="text-xs text-gray-400 mt-1">Up to 5 images, each less than 5 MB.</p>
                      {imageError && <p className="text-xs text-red-400 mt-1">{imageError}</p>}
                      {selectedImages.length > 0 && (
                        <div className="mt-3 grid grid-cols-5 gap-2">
                          {selectedImages.map((si, idx) => (
                            <div key={idx} className="relative group">
                              <img src={si.preview} alt={`preview-${idx}`} className="h-16 w-16 object-cover rounded border border-gray-700" />
                              <button type="button" onClick={() => removeImageAt(idx)} className="absolute -top-2 -right-2 bg-black border border-gray-600 rounded-full w-6 h-6 text-xs font-bold hidden group-hover:flex items-center justify-center text-white" aria-label="Remove image">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="submit"
                        disabled={!eligibilityChecked || !newReview.orderId}
                        className={`px-4 sm:px-6 py-2 rounded font-medium transition-colors ${(!eligibilityChecked || !newReview.orderId) ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-amber-700 hover:bg-amber-600 text-white'}`}
                    >
                        Submit Review
                    </button>
          <button
            type="button"
            onClick={() => { setShowWriteReview(false); setSelectedImages([]); }}
            className="px-4 sm:px-6 py-2 rounded border border-gray-600 text-white hover:bg-gray-700"
          >
                        Cancel
                    </button>
                    </div>
                  </form>
                </div>
              )}

              {loading ? (
                <div className="text-center text-gray-400">Loading reviews...</div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <ReviewCard key={review.review_id} review={review} tTitle={tReviews[review.review_id]?.title} tBody={tReviews[review.review_id]?.body} />
                  ))}
                  {pages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-4">
                      <button disabled={page===1} onClick={()=>fetchReviews(page-1)} className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50">Prev</button>
                      <span className="text-gray-300">Page {page} of {pages}</span>
                      <button disabled={page===pages} onClick={()=>fetchReviews(page+1)} className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50">Next</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">No reviews yet.</div>
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="text-center py-8 sm:py-16">
              <h3 className="text-white text-lg sm:text-xl mb-4">Questions & Answers</h3>
              <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
                No questions have been asked about this product yet.
              </p>
              <button className="bg-[#C4A57B] hover:bg-[#B8965F] text-white px-6 sm:px-8 py-2 sm:py-3 rounded font-medium tracking-wide transition-colors duration-200 uppercase text-xs sm:text-sm">
                Ask a Question
              </button>
            </div>
          )}
        </div>
        {/* Mount viewer overlay for review images */}
        <ReviewImageViewerShop4 />
        <ToastContainer toasts={toasts} />
      </div>
    </div>
  );
};

// Lightweight viewer for review images (Shop4)
function ReviewImageViewerShop4() {
  const [state, setState] = React.useState<{ urls: string[]; index: number } | null>(null);
  React.useEffect(() => {
    (window as any).__shop4_setViewer = (payload: any) => setState(payload);
    return () => { delete (window as any).__shop4_setViewer; };
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
            <img key={i} src={u} alt={`thumb-${i}`} className={`h-12 w-12 object-cover rounded border ${i===index?'border-[#BB9D7B]':'border-gray-700'}`} onClick={() => setState({ urls, index: i })} />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main ProductDetail Component ---
const ProductDetail: React.FC = () => {
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toggleProductInWishlist, isProductInWishlist, isLoading: wishlistLoading } = useShopWishlistOperations(4);
  const { addToShopCart, canPerformShopCartOperations } = useShopCartOperations();
  
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['about']);
  
  // Variant handling state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<VariantAttribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);
  const [stockError, setStockError] = useState<string>('');
  const [selectedMainImage, setSelectedMainImage] = useState<string>('');
  const [showImagePopup, setShowImagePopup] = useState<boolean>(false);
  // Ratings summary for header
  const [avgRatingTop, setAvgRatingTop] = useState<number>(0);
  const [reviewCountTop, setReviewCountTop] = useState<number>(0);

  const productId = searchParams.get('id');

  // --- Display-only translations (Amazon Translate) ---
  const [tName, setTName] = useState<string | null>(null);
  const [tCategory, setTCategory] = useState<string | null>(null);
  const [tAbout, setTAbout] = useState<string | null>(null);
  const [tAttrNames, setTAttrNames] = useState<Record<string, string>>({});
  const [tAttrValues, setTAttrValues] = useState<Record<string, string>>({});
  const [tRelatedNames, setTRelatedNames] = useState<Record<number, string>>({});

  // Helper function to get color style similar to Shop1/Shop3
  const getColorStyle = (attributeName: string, value: string): string => {
    const colorMap: Record<string, string> = {
      'red': '#FF0000',
      'blue': '#0000FF', 
      'green': '#008000',
      'black': '#000000',
      'white': '#FFFFFF',
      'yellow': '#FFFF00',
      'purple': '#800080',
      'orange': '#FFA500',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'gray': '#808080',
      'grey': '#808080',
      'gold': '#FFD700',
      'silver': '#C0C0C0',
      'maroon': '#800000',
      'navy': '#000080',
      'olive': '#808000',
      'lime': '#00FF00',
      'aqua': '#00FFFF',
      'teal': '#008080',
      'fuchsia': '#FF00FF'
    };

    if (attributeName.toLowerCase().includes('color') || attributeName.toLowerCase().includes('colour')) {
      const color = value.toLowerCase().replace(/[^a-z]/g, '');
      return colorMap[color] || '#808080';
    }
    
    return '';
  };

  // Helper function to extract available attributes from product data (similar to Shop1/Shop3)
  const extractAvailableAttributes = (product: ApiProduct): VariantAttribute[] => {
    const attributeMap = new Map<string, VariantAttribute>();
    
    // Get parent product attributes first
    const parentAttrs = product.attributes || [];
    const variantAttrs = product.variant_attributes || [];
    
    // Build parent defaults map
    const parentDefaults: Record<string, string> = {};
    parentAttrs.forEach(attr => {
      const attrName = attr.attribute?.name;
      const attrValue = attr.value;
      if (attrName && attrValue) {
        parentDefaults[attrName] = attrValue;
      }
    });

    if (product.has_variants) {
      // For variant products: Add variant attributes with their available options
      variantAttrs.forEach(attr => {
        if (attr.name && attr.values && Array.isArray(attr.values)) {
          const allValues = new Set<string>();

          // Add parent value if it exists for this attribute
          if (parentDefaults[attr.name]) {
            allValues.add(parentDefaults[attr.name]);
          }

          // Add all variant values
          attr.values.forEach(value => allValues.add(value));

          attributeMap.set(attr.name, {
            name: attr.name,
            values: Array.from(allValues).sort()
          });
        }
      });

      // Only add parent attributes if they have multiple options through variants
      // This prevents showing single-value attributes that can't be changed
      parentAttrs.forEach(attr => {
        const attrName = attr.attribute?.name;
        const attrValue = attr.value;

        if (attrName && attrValue && !attributeMap.has(attrName)) {
          // Only add if there are variant options for this attribute
          const hasVariantOptions = variantAttrs.some(vAttr => 
            vAttr.name === attrName && vAttr.values && vAttr.values.length > 1
          );
          
          if (hasVariantOptions) {
            attributeMap.set(attrName, {
              name: attrName,
              values: [attrValue]
            });
          }
        }
      });
    } else {
      // For non-variant products: Show parent product attributes (read-only)
      console.log('Product does not have variants, showing parent product attributes');
      parentAttrs.forEach(attr => {
        const attrName = attr.attribute?.name;
        const attrValue = attr.value;

        if (attrName && attrValue) {
          attributeMap.set(attrName, {
            name: attrName,
            values: [attrValue] // Single value, non-selectable
          });
        }
      });
    }

    return Array.from(attributeMap.values());
  };

  // Handle attribute selection
  const handleAttributeSelect = (attributeName: string, value: string) => {
    console.log(`Selecting attribute: ${attributeName} = ${value}`);
    setSelectedAttributes(prev => {
      const newAttrs = {
        ...prev,
        [attributeName]: value
      };
      console.log('New selected attributes:', newAttrs);
      return newAttrs;
    });
  };

  // Find matching variant based on selected attributes
  useEffect(() => {
    if (variants.length === 0 || Object.keys(selectedAttributes).length === 0) {
      setCurrentVariant(null);
      setStockError('');
      return;
    }

    console.log('Finding variant with selected attributes:', selectedAttributes);
    console.log('Available variants:', variants);

    const findMatchingVariant = () => {
      // First check if selected attributes match parent product (like Shop1/Shop3)
      if (product) {
        const parentAttrs = product.attributes || [];
        const parentDefaults: Record<string, string> = {};
        parentAttrs.forEach(attr => {
          const attrName = attr.attribute?.name;
          const attrValue = attr.value;
          if (attrName && attrValue) {
            parentDefaults[attrName] = attrValue;
          }
        });

        // Check if selected attributes match parent product attributes
        const matchesParent = Object.entries(selectedAttributes).every(([attrName, attrValue]) => {
          return parentDefaults[attrName] === attrValue;
        });

        if (matchesParent && Object.keys(parentDefaults).length === Object.keys(selectedAttributes).length) {
          console.log('Selected attributes match parent product - showing parent');
          setCurrentVariant(null);
          setStockError('');
          return;
        }
      }

      // Try to find variant by matching attribute combination
      const matchingVariant = variants.find(variant => {
        console.log('Checking variant:', variant.variant_id, 'with attributes:', variant.attribute_combination);
        
        if (!variant.attribute_combination) {
          console.log('Variant has no attribute_combination');
          return false;
        }
        
        // Check if all selected attributes match the variant's attribute combination
        const matches = Object.entries(selectedAttributes).every(([attrName, attrValue]) => {
          const variantValue = variant.attribute_combination[attrName];
          const isMatch = variantValue === attrValue;
          console.log(`Attribute ${attrName}: selected="${attrValue}", variant="${variantValue}", match=${isMatch}`);
          return isMatch;
        });
        
        console.log(`Variant ${variant.variant_id} matches: ${matches}`);
        return matches;
      });

      if (matchingVariant) {
        console.log('Found matching variant:', matchingVariant);
        setCurrentVariant(matchingVariant);
        
        // Check stock status
        if (!matchingVariant.is_in_stock || matchingVariant.stock_qty <= 0) {
          setStockError('This variant is out of stock');
        } else if (matchingVariant.stock_qty <= 5) {
          setStockError(`Only ${matchingVariant.stock_qty} left in stock!`);
        } else {
          setStockError('');
        }
      } else {
        console.log('No matching variant found');
        setCurrentVariant(null);
        setStockError('This combination is not available. Please choose a different combination.');
      }
    };

    findMatchingVariant();
  }, [selectedAttributes, variants, product]);

  // Simple markdown parser for basic formatting with Shop4 styling
  const parseMarkdown = (text: string): JSX.Element[] => {
    if (!text) return [];

    const lines = text.split('\n').filter(line => line.trim() !== '');
    const elements: JSX.Element[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Headers (bold text with **)
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        const content = trimmed.slice(2, -2);
        elements.push(
          <h4 key={index} className="text-lg font-bold text-white mb-2">
            {content}
          </h4>
        );
      }
      // Headers (bold text within line like **Material**: content)
      else if (trimmed.includes('**') && trimmed.split('**').length >= 3) {
        const parts = trimmed.split('**');
        const beforeBold = parts[0];
        const boldText = parts[1];
        const afterBold = parts.slice(2).join('**');
        
        elements.push(
          <p key={index} className="text-gray-300 mb-2">
            {beforeBold}
            <span className="font-bold text-white">{boldText}</span>
            {afterBold}
          </p>
        );
      }
      // Italic text
      else if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
        const content = trimmed.slice(1, -1);
        elements.push(
          <p key={index} className="text-gray-300 italic mb-2">
            {content}
          </p>
        );
      }
      // Numbered lists (standard format like "1. content")
      else if (/^\d+\./.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s*/, '');
        elements.push(
          <div key={index} className="flex items-start mb-2">
            <span className="w-6 h-6 rounded-full bg-[#BB9D7B] text-white text-sm flex items-center justify-center mr-3 mt-0.5 font-semibold">
              {trimmed.match(/^\d+/)?.[0]}
            </span>
            <span className="text-gray-300">{content}</span>
          </div>
        );
      }
      // Numbered items (alternative format like just "1" on separate line)
      else if (/^\d+$/.test(trimmed)) {
        // Skip standalone numbers, they'll be handled with the next line
        return;
      }
      // Content that follows a standalone number
      else if (index > 0 && /^\d+$/.test(lines[index - 1]?.trim())) {
        const number = lines[index - 1].trim();
        elements.push(
          <div key={index} className="flex items-start mb-2">
            <span className="w-6 h-6 rounded-full bg-[#BB9D7B] text-white text-sm flex items-center justify-center mr-3 mt-0.5 font-semibold">
              {number}
            </span>
            <span className="text-gray-300">{trimmed}</span>
          </div>
        );
      }
      // Bullet points
      else if (trimmed.startsWith('- ')) {
        const content = trimmed.slice(2);
        elements.push(
          <div key={index} className="flex items-start mb-2">
            <span className="w-2 h-2 rounded-full bg-[#BB9D7B] mr-4 mt-2"></span>
            <span className="text-gray-300">{content}</span>
          </div>
        );
      }
      // Regular text (but skip if it's immediately after a standalone number)
      else if (trimmed && !(index > 0 && /^\d+$/.test(lines[index - 1]?.trim()))) {
        elements.push(
          <p key={index} className="text-gray-300 mb-2">
            {trimmed}
          </p>
        );
      }
    });

    return elements;
  };

  const availableAttrsMemo = useMemo(() => (product ? extractAvailableAttributes(product) : []), [product]);

  useEffect(() => {
    const lang = i18n.language || 'en';
    if (!product || lang === 'en') {
      setTName(null);
      setTCategory(null);
      setTAbout(null);
      setTAttrNames({});
      setTAttrValues({});
      setTRelatedNames({});
      return;
    }
    const plainItems: { id: string; text: string }[] = [];
    // Product basic
    if (product.product_name) plainItems.push({ id: 'name', text: product.product_name });
    if (product.category_name) plainItems.push({ id: 'category', text: product.category_name });
    const aboutSrc = product.full_description || product.product_description || product.short_description || '';
    if (aboutSrc) plainItems.push({ id: 'about', text: aboutSrc });
    // Attributes
    for (const attr of availableAttrsMemo) {
      if (attr.name) plainItems.push({ id: `attrName:${attr.name}`, text: attr.name });
      for (const v of attr.values || []) {
        if (v) plainItems.push({ id: `attrVal:${attr.name}|${v}`, text: v });
      }
    }
    // Related names
    for (const rp of relatedProducts) {
      if (rp?.id && rp?.name) plainItems.push({ id: `rel:${rp.id}`, text: rp.name });
    }
    const doTranslate = async () => {
      try {
        const plainMap = await translateBatch(plainItems, lang, 'text/plain');
        setTName(plainMap['name'] ?? null);
        setTCategory(plainMap['category'] ?? null);
        setTAbout(plainMap['about'] ?? null);
        const nMap: Record<string, string> = {};
        const vMap: Record<string, string> = {};
        const rMap: Record<number, string> = {};
        for (const k of Object.keys(plainMap)) {
          if (k.startsWith('attrName:')) nMap[k.split(':')[1]] = plainMap[k];
          if (k.startsWith('attrVal:')) vMap[k.substring('attrVal:'.length)] = plainMap[k];
          if (k.startsWith('rel:')) {
            const id = Number(k.split(':')[1]);
            if (!Number.isNaN(id)) rMap[id] = plainMap[k];
          }
        }
        setTAttrNames(nMap);
        setTAttrValues(vMap);
        setTRelatedNames(rMap);
      } catch {
        // fail open
      }
    };
    doTranslate();
  }, [product, relatedProducts, i18n.language, translateBatch, availableAttrsMemo]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      setLoading(true);
      try {
        const productIdNum = parseInt(productId);
        const response = await shop4ApiService.getProductById(productIdNum);
        
        if (response && response.success) {
          setProduct(response.product);
          
          // Check if product has variants and use the data from product response
          if (response.product.has_variants) {
            console.log('Product has variants, using data from product response...');
            
            // Extract variants from product response (similar to Shop1/Shop3)
            if (response.product.variants && Array.isArray(response.product.variants)) {
              // Map product variants to the format expected by ProductVariant interface
              const mappedVariants: ProductVariant[] = response.product.variants.map(variant => ({
                variant_id: variant.product_id,
                variant_sku: variant.sku || '',
                variant_name: variant.product_name,
                attribute_combination: {}, // Will be populated from variants API if needed
                effective_price: variant.price || variant.selling_price,
                stock_qty: variant.stock?.stock_qty || 0,
                is_in_stock: (variant.stock?.stock_qty || 0) > 0,
                media: variant.media || { images: [], videos: [], primary_image: '', total_media: 0 },
                primary_image: variant.primary_image || ''
              }));
              setVariants(mappedVariants);
            }
            
            // Extract available attributes from product response (same as Shop1/Shop3)
            const availableAttrs = extractAvailableAttributes(response.product);
            console.log('Extracted available attributes:', availableAttrs);
            setAvailableAttributes(availableAttrs);
            
            // Initialize default selected attributes from parent product (same as Shop1/Shop3)
            const defaultSelected: Record<string, string> = {};
            
            // Get parent product attributes first
            const parentAttrs = response.product.attributes || [];
            const parentDefaults: Record<string, string> = {};
            parentAttrs.forEach(attr => {
              const attrName = attr.attribute?.name;
              const attrValue = attr.value;
              if (attrName && attrValue) {
                parentDefaults[attrName] = attrValue;
              }
            });
            
            // Set default attributes based on parent product (like Shop1/Shop3 do with defaultValue)
            availableAttrs.forEach(attr => {
              if (parentDefaults[attr.name]) {
                // Use parent product value as default
                defaultSelected[attr.name] = parentDefaults[attr.name];
              } else if (attr.values.length > 0) {
                // Fallback to first available value
                defaultSelected[attr.name] = attr.values[0];
              }
            });
            
            console.log('Default selected attributes (from parent product):', defaultSelected);
            setSelectedAttributes(defaultSelected);
            
            // Initially, current variant is null (showing parent product)
            setCurrentVariant(null);
            setStockError('');
            
            // Also fetch detailed variant data for attribute combinations
            if (availableAttrs.length > 0) {
              try {
                const variantsResponse = await shop4ApiService.getProductVariants(productIdNum);
                if (variantsResponse.success && variantsResponse.variants.length > 0) {
                  setVariants(variantsResponse.variants);
                  console.log('Updated variants with detailed data:', variantsResponse.variants);
                }
              } catch (variantError) {
                console.error('Error fetching detailed variant data:', variantError);
                // Continue with existing variant data from product response
              }
            }
          } else {
            console.log('Product does not have variants');
            // For non-variant products, still extract and show parent product attributes
            const availableAttrs = extractAvailableAttributes(response.product);
            console.log('Extracted available attributes for non-variant product:', availableAttrs);
            setAvailableAttributes(availableAttrs);
            
            // Initialize default selected attributes from parent product (same as Shop1/Shop3)
            const defaultSelected: Record<string, string> = {};
            
            // Get parent product attributes first
            const parentAttrs = response.product.attributes || [];
            const parentDefaults: Record<string, string> = {};
            parentAttrs.forEach(attr => {
              const attrName = attr.attribute?.name;
              const attrValue = attr.value;
              if (attrName && attrValue) {
                parentDefaults[attrName] = attrValue;
              }
            });
            
            // Set default attributes based on parent product (like Shop1/Shop3 do with defaultValue)
            availableAttrs.forEach(attr => {
              if (parentDefaults[attr.name]) {
                // Use parent product value as default
                defaultSelected[attr.name] = parentDefaults[attr.name];
              } else if (attr.values.length > 0) {
                // Fallback to first available value
                defaultSelected[attr.name] = attr.values[0];
              }
            });
            
            console.log('Default selected attributes for non-variant product:', defaultSelected);
            setSelectedAttributes(defaultSelected);
            
            // Clear variant-related state for non-variant products
            setVariants([]);
            setCurrentVariant(null);
            setStockError('');
          }
          
          // Fetch related products if available
          if (response.related_products) {
            const mappedRelated = response.related_products.map(p => ({
              id: p.product_id,
              name: p.product_name,
              price: p.special_price || p.price,
              image: p.primary_image || "https://res.cloudinary.com/do3vxz4gw/image/upload/v1753463036/public_assets_shop4/public_assets_shop4_Rectangle%205.png",
              discount: p.special_price ? Math.round(((p.price - p.special_price) / p.price) * 100) : 0
            }));
            setRelatedProducts(mappedRelated);
          }
        } else {
          setProduct(null);
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
        setRelatedProducts([]);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleAddToCart = async () => {
    if (!canPerformShopCartOperations()) {
      toast.error('Please sign in to add items to cart');
      navigate('/sign-in');
      return;
    }

    if (!product) {
      toast.error('Product not found');
      return;
    }

    // Check stock availability
    const currentProduct = currentVariant || product;
    const stockQty = currentVariant?.stock_qty || (currentProduct.is_in_stock ? 999 : 0);
    
    if (stockQty <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    try {
      setIsAddingToCart(true);
      
      // Create selected attributes object from current selections
      const cartAttributes: Record<string, string[]> = {};
      Object.entries(selectedAttributes).forEach(([key, value]) => {
        if (value) {
          cartAttributes[key] = [value];
        }
      });

      // Important: use variant product id when a variant is selected so cart gets the variant image
      const productIdToAdd = (currentVariant as any)?.variant_product_id ?? product.product_id;

      await addToShopCart(4, productIdToAdd, quantity, cartAttributes);
      toast.success('Added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistClick = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to manage your wishlist');
      navigate('/sign-in');
      return;
    }

    if (user?.role !== 'customer') {
      toast.error('Only customers can manage wishlists');
      return;
    }

    if (!product) {
      toast.error('Product not found');
      return;
    }

    try {
      const wasInWishlist = isProductInWishlist(product.product_id);
      await toggleProductInWishlist(product.product_id);
      
      if (wasInWishlist) {
        toast.success('Removed from wishlist');
      } else {
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error);
    }
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full mx-auto bg-black text-white flex items-center justify-center">
        <div className="text-white text-xl">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen w-full mx-auto bg-black text-white flex items-center justify-center">
        <div className="text-white text-xl">Product not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full mx-auto bg-black text-white">
      <div className="border-b border-gray-800 max-w-[1640px] mx-auto px-6 py-3 md:px-8 md:py-4">
        <button className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors text-sm md:text-base">
         
          <span className="text-white font-poppins text-lg sm:text-xl lg:text-[30px] font-normal leading-normal">Back to: Diya Collection</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col mx-auto px-2 max-w-[1640px]  lg:flex-row">
        {/* Left Side - Image Gallery */}
        <div className="w-full lg:w-1/2 bg-black">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Main Product Image Gallery */}
            <div className="space-y-4 md:space-y-6">
                             {/* Get all available images dynamically */}
               {(() => {
                 const allImages: string[] = [];
                
                // Get images from current variant if available
                if (currentVariant?.media?.images && currentVariant.media.images.length > 0) {
                  allImages.push(...currentVariant.media.images.map(img => img.url));
                } else if (currentVariant?.primary_image) {
                  allImages.push(currentVariant.primary_image);
                }
                
                // If no variant images, get from product
                if (allImages.length === 0) {
                  if (product.media?.images && product.media.images.length > 0) {
                    allImages.push(...product.media.images.map(img => img.url));
                  } else if (product.primary_image) {
                    allImages.push(product.primary_image);
                  }
                }
                
                // No fallback images - will show "No images available" message
                
                return (
                  <>
                    {/* Main Large Image - Selected or first image */}
                    {allImages.length > 0 ? (
                      <>
                        <div className="w-full">
                          <img
                            src={selectedMainImage || allImages[0]}
                            alt={product.product_name}
                            className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px] object-cover rounded-lg"
                          />
                        </div>
                        
                        {/* Additional Product Images - Responsive Layout */}
                        {allImages.length > 1 && (
                          <>
                            {/* Mobile/Tablet Layout (up to lg): Thumbnail row below main image */}
                            <div className="block lg:hidden">
                              <div className="flex gap-2 md:gap-3 pb-2">
                                {/* Show only first 3 images */}
                                {allImages.slice(0, 3).map((imageUrl, index) => (
                                  <div 
                                    key={index}
                                    className="flex-1 cursor-pointer transition-transform relative"
                                    onClick={() => setSelectedMainImage(imageUrl)}
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`${product.product_name} - View ${index + 1}`}
                                      className={`w-full h-20 sm:h-36 md:h-36 lg:h-28 object-cover rounded-lg border-2 transition-colors ${
                                        (!selectedMainImage && index === 0) || selectedMainImage === imageUrl 
                                          ? 'border-[#BB9D7B]' 
                                          : 'border-gray-600 hover:border-[#BB9D7B]'
                                      }`}
                                    />
                                    
                                    {/* "more images" overlay on 3rd image if more than 3 images */}
                                    {index === 2 && allImages.length > 3 && (
                                      <div 
                                        className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowImagePopup(true);
                                        }}
                                      >
                                        <span className="text-white text-sm sm:text-base font-bold text-center px-2">
                                          MORE IMAGES
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Desktop Layout (lg and up): Show only 3 images with "more images" overlay */}
                            <div className="hidden lg:block space-y-4">
                              {allImages.slice(1, 2).map((imageUrl, index) => (
                                <img
                                  key={index}
                                  src={imageUrl}
                                  alt={`${product.product_name} - View ${index + 2}`}
                                  className="w-full h-[500px] xl:h-[600px] object-cover rounded-lg"
                                />
                              ))}
                              
                              {/* Show 3rd image with "more images" overlay if more than 3 images */}
                              {allImages.length > 3 ? (
                                <div className="relative">
                                  <img
                                    src={allImages[2]}
                                    alt={`${product.product_name} - View 3`}
                                    className="w-full h-[500px] xl:h-[600px] object-cover rounded-lg"
                                  />
                                  <div 
                                    className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center cursor-pointer"
                                    onClick={() => setShowImagePopup(true)}
                                  >
                                    <span className="text-white text-lg xl:text-xl font-bold text-center px-4">
                                      MORE IMAGES
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                /* Show 3rd image normally if 3 or fewer images total */
                                allImages.length === 3 && (
                                  <img
                                    src={allImages[2]}
                                    alt={`${product.product_name} - View 3`}
                                    className="w-full h-[500px] xl:h-[600px] object-cover rounded-lg"
                                  />
                                )
                              )}
                            </div>
                          </>
                        )}

                        {/* Image Popup Modal */}
                        {showImagePopup && (
                          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                            <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                              {/* Header */}
                              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                                <h3 className="text-white text-lg font-medium">All Product Images</h3>
                                <button
                                  onClick={() => setShowImagePopup(false)}
                                  className="text-gray-400 hover:text-white transition-colors"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              
                              {/* Image Grid */}
                              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                  {allImages.map((imageUrl: string, index: number) => (
                                    <div 
                                      key={index}
                                      className="cursor-pointer transition-transform"
                                      onClick={() => {
                                        setSelectedMainImage(imageUrl);
                                        setShowImagePopup(false);
                                      }}
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={`${product.product_name} - View ${index + 1}`}
                                        className={`w-full h-32 sm:h-40 object-cover rounded-lg border-2 transition-colors ${
                                          selectedMainImage === imageUrl 
                                            ? 'border-[#BB9D7B]' 
                                            : 'border-gray-600 hover:border-[#BB9D7B]'
                                        }`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* No Images Available - Professional Message */
                      <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px] bg-gray-800 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-600">
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center">
                            <svg 
                              className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-white text-lg sm:text-xl font-medium mb-1">
                              No Images Available
                            </h3>
                            <p className="text-gray-400 text-sm sm:text-base">
                              Product images will be displayed here
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right Side - Product Details */}
        <div className="w-full lg:w-1/2 p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          {/* Product Category */}
          <div className="text-white text-sm sm:text-base font-normal leading-normal font-['Poppins']">
            {tCategory || product.category_name || 'Product Category'}
          </div>

          {/* Product Title */}
          <h1 className="text-white text-lg sm:text-xl md:text-[26px] font-normal leading-6 sm:leading-3 lg:leading-8 xl:leading-10 font-poppins min-h-[1rem] sm:min-h-0 lg:min-h-[2rem] xl:min-h-[2rem] mb-2 sm:mb-0">
            {tName || product.product_name}
          </h1>

          {/* Pricing */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            {(() => {
              if (currentVariant) {
                // Use variant pricing
                const variantPrice = currentVariant.effective_price;
                return (
                  <>
                    <span className="text-xs sm:text-sm md:text-base text-white">Price</span>
                    <span className="text-base sm:text-lg md:text-xl font-medium text-[#00FF2F]">₹{variantPrice}</span>
                  </>
                );
              } else {
                // Use product pricing
                const hasSpecialPrice = product.special_price && product.special_price < product.price;
                return hasSpecialPrice ? (
                  <>
                    <span className="text-gray-400 line-through text-xs sm:text-sm md:text-base">Actual Price ₹{product.price}</span>
                    <span className="text-xs sm:text-sm md:text-base text-white">Our price</span>
                    <span className="text-base sm:text-lg md:text-xl font-medium text-[#00FF2F]">₹{product.special_price}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs sm:text-sm md:text-base text-white">Price</span>
                    <span className="text-base sm:text-lg md:text-xl font-medium text-[#00FF2F]">₹{product.price}</span>
                  </>
                );
              }
            })()}
          </div>

          {/* Rating (real) */}
          <div className="flex items-center gap-2">
            <StarRating rating={avgRatingTop} size="md" />
            <span className="text-gray-400 text-xs md:text-sm">( {reviewCountTop} Customer review{reviewCountTop!==1?'s':''} )</span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700"></div>

          {/* Dynamic Attribute Selection - Show attributes from backend */}
          {availableAttributes.length > 0 && (
            <div className="space-y-4 md:space-y-6">
              {availableAttributes.map((attribute) => (
                <div key={attribute.name} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                    <span className="text-xs sm:text-sm md:text-base text-white capitalize">
                      {tAttrNames[attribute.name] || attribute.name} :
                    </span>
                    
                    {/* Color attributes - show color swatches */}
                    {(attribute.name.toLowerCase().includes('color') || attribute.name.toLowerCase().includes('colour')) && (
                      <div className="flex gap-2">
                        {attribute.values.map((value) => {
                          const isSelected = selectedAttributes[attribute.name] === value;
                          const colorStyle = getColorStyle(attribute.name, value);
                          const isClickable = attribute.values.length > 1; // Only clickable if multiple values
                          
                          return (
                            <button
                              key={value}
                              onClick={isClickable ? () => handleAttributeSelect(attribute.name, value) : undefined}
                              disabled={!isClickable}
                              className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all duration-200 ${
                                isSelected
                                  ? 'border-[#BB9D7B] scale-110'
                                  : isClickable 
                                  ? 'border-gray-600 hover:border-gray-400 cursor-pointer'
                                  : 'border-[#BB9D7B] cursor-default'
                              } ${!isClickable ? 'opacity-90' : ''}`}
                              style={{ 
                                backgroundColor: colorStyle || '#808080',
                                border: colorStyle === '#FFFFFF' ? '2px solid #333' : undefined
                              }}
                              title={value}
                            />
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Size and other attributes - show buttons */}
                    {!(attribute.name.toLowerCase().includes('color') || attribute.name.toLowerCase().includes('colour')) && (
                      <div className="flex gap-2">
                        {attribute.values.map((value) => {
                          const isSelected = selectedAttributes[attribute.name] === value;
                          const isClickable = attribute.values.length > 1; // Only clickable if multiple values
                          
                          return (
                            <button
                              key={value}
                              onClick={isClickable ? () => handleAttributeSelect(attribute.name, value) : undefined}
                              disabled={!isClickable}
                              className={`px-3 py-2 md:px-4 md:py-2 rounded text-xs md:text-sm font-medium transition-all ${
                                isSelected
                                  ? 'border-2 border-[#BB9D7B] bg-[#BB9D7B] text-white'
                                  : isClickable
                                  ? 'border-2 border-gray-600 bg-[#515151] text-white hover:border-gray-400 cursor-pointer'
                                  : 'border-2 border-[#BB9D7B] bg-[#BB9D7B] text-white cursor-default opacity-90'
                              }`}
                            >
                              {tAttrValues[`${attribute.name}|${value}`] || value}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Size guide link for size attributes */}
                  {attribute.name.toLowerCase().includes('size') && (
                    <button className="text-white text-xs md:text-sm underline hover:text-gray-300 transition-colors">
                      Size Chart
                    </button>
                  )}
                </div>
              ))}
              
              {/* Stock Error Message */}
              {stockError && (
                <div className={`p-3 rounded text-sm font-medium ${
                  stockError.includes('out of stock') || stockError.includes('Out of Stock')
                    ? 'bg-red-900/20 text-red-400 border border-red-800'
                    : stockError.includes('left in stock')
                    ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800'
                    : 'bg-orange-900/20 text-orange-400 border border-orange-800'
                }`}>
                  {stockError}
                </div>
              )}
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center border border-gray-600 rounded bg-[#2B2B2B] overflow-hidden">
              <button
                onClick={decrementQuantity}
                className="p-2 md:p-3 hover:bg-gray-700 transition-colors text-white border-r border-gray-600"
              >
                <Minus className="w-3 h-3 md:w-4 md:h-4"/>
              </button>
              <span className="px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-white bg-[#2B2B2B] border-r border-gray-600 min-w-[2.5rem] md:min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={incrementQuantity}
                className="p-2 md:p-3 hover:bg-gray-700 transition-colors text-white"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4"/>
              </button>
            </div>
            
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart || (() => {
                const currentProduct = currentVariant || product;
                const stockQty = currentVariant?.stock_qty || (currentProduct?.is_in_stock ? 999 : 0);
                return stockQty <= 0;
              })()}
              className={`p-2 md:p-3 rounded-full transition-colors ${
                isAddingToCart || (() => {
                  const currentProduct = currentVariant || product;
                  const stockQty = currentVariant?.stock_qty || (currentProduct?.is_in_stock ? 999 : 0);
                  return stockQty <= 0;
                })()
                  ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                  : 'bg-[#BB9D7B] hover:bg-[#a8896a] text-white'
              }`}
            >
              {isAddingToCart ? (
                <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-current border-t-transparent" />
              ) : (
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
            
            <button 
              onClick={handleWishlistClick}
              disabled={wishlistLoading}
              className={`p-2 md:p-3 border border-gray-600 rounded transition-all duration-200 ${
                product && isProductInWishlist(product.product_id)
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-[#515151] hover:bg-gray-700 text-white'
              } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={product && isProductInWishlist(product.product_id) ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {wishlistLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-current"></div>
              ) : (
                <Heart 
                  className={`w-4 h-4 md:w-5 md:h-5 ${
                    product && isProductInWishlist(product.product_id) ? 'fill-current' : ''
                  }`}
                />
              )}
            </button>
          </div>

          {/* Shipping Info */}
          <div className="text-xs md:text-sm text-gray-300 space-y-1">
            <p>Worldwide Shipping in all order ₹200, Delivery in 2-5 working days</p>
            <button className="text-white hover:text-gray-300 transition-colors underline">
              Shipping & Return
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700"></div>

          {/* About Product Section */}
          <div className="space-y-3 md:space-y-4">
            <button
              onClick={() => toggleSection('about')}
              className="flex items-center justify-between w-full text-left group"
            >
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-white">About Product</h3>
              {expandedSections.includes('about') ? (
                <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-white group-hover:text-gray-300" />
              ) : (
                <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-white group-hover:text-gray-300" />
              )}
            </button>
            
            {expandedSections.includes('about') && (
              <div className="text-gray-300 text-xs md:text-sm">
        {tAbout || product.full_description || product.product_description || product.short_description ? (
                  <div className="leading-relaxed">
          {parseMarkdown(tAbout || product.full_description || product.product_description || product.short_description)}
                  </div>
                ) : (
                  <p className="leading-relaxed text-gray-400">No product information available.</p>
                )}
              </div>
            )}
          </div>

          {/* Final Divider */}
          <div className="border-t border-gray-700"></div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Rated Badge */}
        <div className="text-center mb-6">
          <span className="inline-block bg-amber-700/20 text-amber-300 text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wider">
            Top • Rated
          </span>
        </div>

        {/* Related Products Section */}
        <div className="mb-16">
          <h2 className="text-white text-xl sm:text-2xl lg:text-3xl font-light text-center mb-8 sm:mb-12">
            Related Products
          </h2>
          
          {/* Mobile: Horizontal scrolling, Desktop: Grid layout */}
          <div className="block sm:hidden">
            {/* Mobile horizontal scroll container */}
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-4 px-4">
              {relatedProducts.slice(0, 3).map((relatedProduct) => (
                <div 
                  key={relatedProduct.id} 
                  className="flex-shrink-0 w-[calc(100vw-2rem)] transition-transform"
                >
                    <Shop4ProductCardWithWishlist 
                    product={{
                      id: relatedProduct.id,
                      name: tRelatedNames[relatedProduct.id] || relatedProduct.name,
                      price: typeof relatedProduct.price === 'string' ? parseFloat(relatedProduct.price) : relatedProduct.price,
                      discount: relatedProduct.discount,
                      image: relatedProduct.image
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop grid layout */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {relatedProducts.slice(0, 3).map((relatedProduct) => (
              <div 
                key={relatedProduct.id} 
                className="w-full h-auto transition-transform"
              >
                <Shop4ProductCardWithWishlist 
                  product={{
                    id: relatedProduct.id,
                    name: tRelatedNames[relatedProduct.id] || relatedProduct.name,
                    price: typeof relatedProduct.price === 'string' ? parseFloat(relatedProduct.price) : relatedProduct.price,
                    discount: relatedProduct.discount,
                    image: relatedProduct.image
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
  <ReviewsSection 
    productId={product.product_id} 
    allowedProductIds={[
      product.product_id,
      ...((product.variants as any[] | undefined) || [])
        .map((p: any) => p?.variant_product_id ?? p?.product_id)
        .filter((v: any) => typeof v === 'number')
    ]}
    onSummaryChange={(avg, cnt) => { setAvgRatingTop(avg); setReviewCountTop(cnt); }}
  />
    </div>
  );
};

export default ProductDetail;


