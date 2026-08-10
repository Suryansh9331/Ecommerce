import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name_at_purchase: string;
  quantity: number;
  unit_price_inclusive_gst: string;
  final_price_for_item: string;
  product_image: string;
  item_status: string;
}

interface Order {
  order_id: string;
  order_status: string;
  order_date: string;
  total_amount: string;
  currency: string;
  items: OrderItem[];
  shipping_address_details: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  status_history?: {
    status: string;
    changed_at: string;
    notes: string;
  }[];
}

interface ReviewResponse {
  status: string;
  message?: string;
  data: {
    review_id: number;
    product_id: number;
    user_id: number;
    order_id: string;
    rating: number;
    title: string;
    body: string;
    created_at: string;
    updated_at: string;
    images: Array<{
      image_id: number;
      image_url: string;
      sort_order: number;
      type: string;
      created_at: string;
      updated_at: string;
    }>;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

const Review: React.FC = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const order = location.state?.order as Order;

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }

    // If no order data in location state, try to fetch it
    if (!order && orderId) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, navigate, order, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please sign in to view order details');
        navigate('/sign-in');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      if (data.status === 'success') {
        // Update location state with order data
        navigate(`/review/${orderId}`, { 
          state: { order: data.data },
          replace: true 
        });
      } else {
        throw new Error(data.message || 'Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch order details');
      navigate('/orders');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Check if adding new images would exceed the limit of 5
      if (images.length + files.length > 5) {
        toast.error('You can only upload up to 5 images');
        return;
      }

      // Convert FileList to Array and add to state
      const newImages = Array.from(files);
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!order || !orderId) {
        toast.error('Order information is missing');
        return;
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please sign in to submit a review');
        navigate('/sign-in');
        return;
      }

      // Validate required fields
      if (!rating) {
        toast.error('Please select a rating');
        return;
      }
      if (!title.trim()) {
        toast.error('Please enter a review title');
        return;
      }
      if (!reviewText.trim()) {
        toast.error('Please enter your review');
        return;
      }

      // Convert images to base64
      const base64Images = await Promise.all(
        images.map(image => convertImageToBase64(image))
      );

      // Prepare review data
      const reviewData = {
        order_id: orderId,
        product_id: order.items[0].product_id,
        rating: rating,
        title: title.trim(),
        body: reviewText.trim(),
        images: base64Images
      };

      // Submit review
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json() as ReviewResponse;

      if (response.ok && data.status === 'success') {
        toast.success('Review submitted successfully!');
        navigate('/orders', {
          state: { message: 'Review submitted successfully!' }
        });
      } else {
        throw new Error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
          <button 
            onClick={() => navigate('/orders')}
            className="px-6 py-2 bg-[#FF4D00] text-white rounded-lg hover:bg-[#FF4D00]/90 transition-colors"
          >
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  // Get delivery date from status history
  const getDeliveryDate = () => {
    if (!order.status_history || order.status_history.length === 0) {
      return 'Not delivered yet';
    }
    const deliveredStatus = order.status_history.find(s => s.status === 'delivered');
    return deliveredStatus?.changed_at 
      ? new Date(deliveredStatus.changed_at).toLocaleDateString()
      : 'Not delivered yet';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Write a Review</h1>
          <p className="text-gray-600">Order #{order.order_id}</p>
        </div>
      </div>

      {/* Product Details */}
      <div className="bg-white rounded-lg p-6 mb-6 border">
        <div className="flex gap-4">
          <img
            src={order.items[0].product_image || '/placeholder-image.jpg'}
            alt={order.items[0].product_name_at_purchase}
            className="w-24 h-24 object-cover rounded-lg"
            onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                // Guard against a loop: if the placeholder itself fails to load,
                // onError fires again and reassigns the same missing src forever.
                // That produced thousands of requests and a page that never
                // finished loading. One swap per element, then give up.
                if (img.dataset.fallbackApplied === "1") return;
                img.dataset.fallbackApplied = "1";
                img.src = "/placeholder-image.jpg";
              }}
          />
          <div>
            <h3 className="font-medium">{order.items[0].product_name_at_purchase}</h3>
            <p className="text-gray-600 text-sm">Ordered on {new Date(order.order_date).toLocaleDateString()}</p>
            <p className="text-gray-600 text-sm">
              Delivered on {getDeliveryDate()}
            </p>
          </div>
        </div>
      </div>

      {/* Review Form */}
      <div className="bg-white rounded-lg p-6 border">
        {/* Rating */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Overall Rating</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="text-2xl focus:outline-none"
              >
                <Star
                  size={32}
                  className={`${
                    star <= (hoveredRating || rating)
                      ? 'fill-[#FF4D00] text-[#FF4D00]'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review Title */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Review Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sum up your experience in a few words"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
          />
        </div>

        {/* Review Text */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Your Review</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
          />
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Add Photos</label>
          <div className="flex flex-wrap gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Review ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FF4D00] transition-colors">
                <Upload size={24} className="text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">Upload up to 5 images (optional)</p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!rating || !reviewText.trim() || !title.trim() || loading}
          className="w-full py-3 bg-[#FF4D00] text-white rounded-lg hover:bg-[#FF4D00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
};

export default Review; 