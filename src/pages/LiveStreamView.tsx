import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Play, Clock, User, Eye, ShoppingBag, Heart, Share2, MessageCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ProductAttribute {
  attribute_id: number;
  attribute_name: string;
  value_code: string | null;
  value_text: string | null;
  value_label: string | null;
  input_type: string;
}

interface Product {
  product_id: number;
  name: string;
  image: string | null;
  attributes: ProductAttribute[];
  description: string | null;
}

interface LiveStream {
  stream_id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  scheduled_time: string | null;
  is_live: boolean;
  status: string;
  merchant: {
    id: number;
    business_name: string;
    business_email: string;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  } | null;
  stream_url: string | null;
  product: Product | null;
}

const LiveStreamView: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const location = useLocation();
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        // Check if we already have the data from navigation state
        if (location.state?.stream) {
          setStream(location.state.stream);
          setLoading(false);
          return;
        }

        // Otherwise fetch it
        const response = await fetch(`${API_BASE_URL}/api/live-streams/${streamId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stream details');
        }

        const data = await response.json();
        setStream(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stream');
      } finally {
        setLoading(false);
      }
    };

    fetchStreamData();
  }, [streamId, location.state]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Eye className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-xl">{error || 'Stream not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stream Section */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-2xl overflow-hidden">
              {stream.stream_url ? (
                <iframe
                  src={stream.stream_url}
                  className="w-full aspect-video"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
                  {stream.status === 'SCHEDULED' ? (
                    <div className="text-center text-white">
                      <Clock className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-xl font-semibold">Stream starts at</p>
                      <p className="text-lg">{new Date(stream.scheduled_time!).toLocaleString()}</p>
                    </div>
                  ) : (
                    <Eye className="w-16 h-16 text-gray-600" />
                  )}
                </div>
              )}
            </div>

            {/* Stream Info */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{stream.title}</h1>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">0 watching</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">0 likes</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-gray-600 whitespace-pre-wrap">{stream.description}</p>
              </div>

              {/* Merchant Info */}
              {stream.merchant && (
                <div className="flex items-center gap-4 mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{stream.merchant.business_name}</h3>
                    <p className="text-sm text-gray-500">{stream.merchant.business_email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Section */}
          {stream.product && (
            <div className="bg-white rounded-2xl p-6 shadow-sm h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Featured Product</h2>
              
              {stream.product.image && (
                <img
                  src={stream.product.image}
                  alt={stream.product.name}
                  className="w-full h-64 object-cover rounded-xl mb-4"
                />
              )}

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{stream.product.name}</h3>
              
              {stream.product.description && (
                <p className="text-gray-600 mb-4">{stream.product.description}</p>
              )}

              {/* Product Attributes */}
              {stream.product.attributes && stream.product.attributes.length > 0 && (
                <div className="space-y-4 mb-6">
                  {stream.product.attributes.map((attr) => (
                    <div key={attr.attribute_id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {attr.attribute_name}
                      </label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option value="">{attr.value_label || attr.value_text}</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <button className="w-full bg-gradient-to-r from-primary-600 to-primary-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:from-primary-700 hover:to-primary-800 transition-all duration-300">
                <ShoppingBag className="w-5 h-5" />
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveStreamView; 