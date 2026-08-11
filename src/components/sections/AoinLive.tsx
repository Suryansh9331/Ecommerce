import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LiveCard from '../../data/LiveCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
}

interface AoinLiveProps {
  layout?: 'row' | 'grid';
}

const AoinLive: React.FC<AoinLiveProps> = ({ layout = 'row' }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [liveContent, setLiveContent] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStreams = async () => {
      setLoading(true);
      setError(null);
      try {
        // console.log('Fetching streams from:', `${API_BASE_URL}/api/live-streams`);
        const response = await fetch(`${API_BASE_URL}/api/live-streams`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch live streams');
        }
        const data = await response.json();
        // console.log('Received streams data:', data);
        setLiveContent(data);
      } catch (err) {
        console.error('Error fetching streams:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch live streams');
      } finally {
        setLoading(false);
      }
    };
    fetchStreams();
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 280 + 24; // Updated card width (280px) + gap (24px)
    const scrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  };

  const handleStreamClick = (streamId: number) => {
    // console.log('Selected stream:', streamId);
    // console.log('Stream details:', liveContent.find(stream => stream.stream_id === streamId));
    navigate(`/live-shop/product/${streamId}`);
  };

  const renderStreamCard = (item: LiveStream, index: number, isRowLayout: boolean = false) => {
    // Card style to match ComingSoon.tsx LiveCard
    return (
      <div key={`${item.stream_id}-${index}`} className="relative flex-shrink-0 w-[240px] group cursor-pointer" onClick={() => handleStreamClick(item.stream_id)}>
        {/* Status Badge at Top */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`px-2 py-0.5 text-xs font-medium rounded ${
            item.status === 'LIVE'
              ? 'bg-red-500 text-white'
              : item.status === 'SCHEDULED'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-300 text-gray-700'
          }`}>
            {item.status}
          </div>
        </div>
        {/* Image Container */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
          {item.thumbnail_url ? (
            <img
              src={item.thumbnail_url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
              <Play className="w-10 h-10 opacity-50" />
            </div>
          )}
        </div>
        {/* Content */}
        <div className="mt-3 px-1">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1" title={item.title}>{item.title}</h3>
          <p className="text-xs text-gray-500 mt-1">{item.merchant?.business_name || 'Unknown Merchant'}</p>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2" title={item.description}>{item.description}</p>
          {item.scheduled_time && (
            <p className="text-[11px] text-gray-400 mt-1">
              Scheduled: {new Date(item.scheduled_time).toLocaleDateString()} at {new Date(item.scheduled_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Row layout (for LiveShop page)
  if (layout === 'row') {
    return (
      <div className="py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-600 bg-clip-text text-transparent">
              AOIN LIVE
            </h2>
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>{liveContent.filter(stream => stream.status === 'LIVE').length} Live Now</span>
            </div>
          </div>
          <a 
            href="/live-shop/aoin-live" 
            className="text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200 flex items-center gap-1"
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 font-semibold mb-2">{error}</div>
            <p className="text-gray-500">Please try again later</p>
          </div>
        ) : liveContent.length === 0 ? (
          <div className="text-center py-12">
            <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No live streams found.</p>
            <p className="text-gray-400 text-sm">Check back soon for exciting live content!</p>
          </div>
        ) : (
          <div className="relative">
            <button 
              className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg border border-gray-200 z-10 transition-all duration-200 hover:scale-110"
              aria-label="Previous"
              onClick={() => handleScroll('left')}
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth px-16"
            >
              {liveContent.map((item, index) => renderStreamCard(item, index, true))}
            </div>
            
            <button 
              className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg border border-gray-200 z-10 transition-all duration-200 hover:scale-110"
              aria-label="Next"
              onClick={() => handleScroll('right')}
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Grid layout (for standalone page)
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-600 bg-clip-text text-transparent mb-4">
            AOIN LIVE
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover amazing live shopping experiences from top merchants around the world
          </p>
          {!loading && liveContent.length > 0 && (
            <div className="flex justify-center gap-6 mt-6">
              <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  {liveContent.filter(stream => stream.status === 'LIVE').length} Live Streams
                </span>
              </div>
              <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  {liveContent.filter(stream => stream.status === 'SCHEDULED').length} Scheduled
                </span>
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-500 font-semibold text-lg mb-2">{error}</div>
            <p className="text-gray-500">Please try again later</p>
          </div>
        ) : liveContent.length === 0 ? (
          <div className="text-center py-16">
            <Play className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No live streams found</h3>
            <p className="text-gray-500 text-lg">Check back soon for exciting live content!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-12">
              {liveContent.map((item, index) => renderStreamCard(item, index, false))}
            </div>
            
            <div className="flex justify-center">
              <button className="bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-800 text-white px-12 py-4 rounded-full font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3">
                <Play className="w-5 h-5 fill-white" />
                Load More Streams
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AoinLive;