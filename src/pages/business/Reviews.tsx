import React, { useState, useEffect } from 'react';
import { Star, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAmazonTranslate } from '../../hooks/useAmazonTranslate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Review {
  review_id: number;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
  product: {
    product_id: number;
    name: string;
  };
  images: Array<{
    image_id: number;
    image_url: string;
  }>;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    [key: string]: number;
  };
}

interface ReviewResponse {
  reviews: Review[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    pages: number;
  };
  stats: ReviewStats;
}

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    rating: '',
    startDate: '',
    endDate: '',
  });
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();
  const [tTitles, setTTitles] = useState<Record<number, string>>({});
  const [tBodies, setTBodies] = useState<Record<number, string>>({});
  const [tProdNames, setTProdNames] = useState<Record<number, string>>({});

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
      });

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/product-reviews?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }

      const data: ReviewResponse = await response.json();
      setReviews(data.reviews);
      setStats(data.stats);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, filters]);

  // Translate dynamic review texts for display only
  useEffect(() => {
    const lang = (i18n.language || 'en').split('-')[0];
    if (!reviews.length || lang === 'en') { setTTitles({}); setTBodies({}); setTProdNames({}); return; }
    const run = async () => {
      try {
        const titleItems: { id: string; text: string }[] = [];
        const bodyItems: { id: string; text: string }[] = [];
        const prodItems: { id: string; text: string }[] = [];
        reviews.forEach(r => {
          if (r.title) titleItems.push({ id: `t:${r.review_id}`, text: r.title });
          if (r.body) bodyItems.push({ id: `b:${r.review_id}`, text: r.body });
          if (r.product?.name) prodItems.push({ id: `p:${r.product.product_id}`, text: r.product.name });
        });
        const [tMap, bMap, pMap] = await Promise.all([
          translateBatch(titleItems, lang, 'text/plain'),
          translateBatch(bodyItems, lang, 'text/plain'),
          translateBatch(prodItems, lang, 'text/plain'),
        ]);
        const tOut: Record<number, string> = {}; Object.keys(tMap).forEach(k => { if (k.startsWith('t:')) tOut[Number(k.split(':')[1])] = tMap[k]; });
        const bOut: Record<number, string> = {}; Object.keys(bMap).forEach(k => { if (k.startsWith('b:')) bOut[Number(k.split(':')[1])] = bMap[k]; });
        const pOut: Record<number, string> = {}; Object.keys(pMap).forEach(k => { if (k.startsWith('p:')) pOut[Number(k.split(':')[1])] = pMap[k]; });
        setTTitles(tOut); setTBodies(bOut); setTProdNames(pOut);
      } catch { /* fail open */ }
    };
    run();
  }, [reviews, i18n.language, translateBatch]);

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'fill-primary-600 text-primary-600' : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderRatingDistribution = () => {
    if (!stats) return null;

    return (
      <div className="bg-white rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Rating Overview</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold text-primary-600">
            {stats.average_rating}
          </div>
          <div>
            <div className="flex items-center gap-1">
              {renderStars(Math.round(stats.average_rating))}
            </div>
            <div className="text-sm text-gray-500">
              {stats.total_reviews} reviews
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(stats.rating_distribution).reverse().map(([rating, count]) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-20">
                <span className="text-sm font-medium">{rating}</span>
                <Star className="w-3 h-3 fill-primary-600 text-primary-600" />
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{
                    width: `${stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 bg-[#f8f9fa]">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-black">Product Reviews</h1>
        <div className="flex gap-4">
  <div className="relative inline-block">
    <select
      className="appearance-none bg-white border border-gray-200 rounded-lg py-2 px-4 pr-6 leading-tight focus:outline-none focus:border-primary-600 text-sm"
      value={filters.rating}
      onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
    >
      <option value="">All Ratings</option>
      {[5, 4, 3, 2, 1].map((rating) => (
        <option key={rating} value={rating}>
          {rating} Stars
        </option>
      ))}
    </select>
    {/* <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-600 pointer-events-none" /> */}
  </div>
</div>

      </div>

      {renderRatingDistribution()}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No reviews found</div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.review_id}
              className="border-b border-gray-100 p-6 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-black">
                      {review.user.first_name} {review.user.last_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <button className="text-gray-400 hover:text-primary-600 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-2">{tProdNames[review.product.product_id] || review.product.name}</p>
              {review.title && (
                <h3 className="font-medium text-gray-900 mb-2">{tTitles[review.review_id] || review.title}</h3>
              )}
              <p className="text-gray-700 mb-4">{tBodies[review.review_id] || review.body}</p>

              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {review.images.map((image) => (
                    <img
                      key={image.image_id}
                      src={image.image_url}
                      alt="Review"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Reviews; 