import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LiveCard from '../../data/LiveCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ScheduledStream {
  stream_id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  scheduled_time: string | null;
  merchant: {
    business_name: string;
    user: {
      first_name: string;
      last_name: string;
    };
  } | null;
}

interface ComingSoonProps {
  layout?: 'row' | 'grid';
}

const ComingSoon: React.FC<ComingSoonProps> = ({ layout = 'row' }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scheduledStreams, setScheduledStreams] = useState<ScheduledStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScheduledStreams = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/live-streams/status/scheduled`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch scheduled streams');
        }
        const data = await response.json();
        setScheduledStreams(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch scheduled streams');
      } finally {
        setLoading(false);
      }
    };
    fetchScheduledStreams();
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 220 + 24; // card width (220px) + gap (24px)
    const scrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  };

  // Row layout (for LiveShop page)
  if (layout === 'row') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[28px] font-medium text-gray-900">Coming Soon</h2>
          <a href="/live-shop/coming-soon" className="text-sm text-gray-600 hover:text-gray-900">
            See All
          </a>
        </div>
        <div className="relative px-12">
          <button 
            className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary-600 hover:bg-primary-600/90 rounded-full flex items-center justify-center shadow-md z-10 transition-colors duration-200"
            aria-label="Previous"
            onClick={() => handleScroll('left')}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
          >
            {loading ? (
              <div className="flex justify-center items-center min-h-[120px] w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center font-semibold w-full">{error}</div>
            ) : scheduledStreams.length === 0 ? (
              <div className="text-gray-500 text-center w-full">No scheduled streams found.</div>
            ) : (
              scheduledStreams.map((item) => (
                <LiveCard
                  key={item.stream_id}
                  id={item.stream_id}
                  title={item.title}
                  host={item.merchant?.business_name || 'Unknown Host'}
                  thumbnail={item.thumbnail_url || ''}
                  type={item.description || ''}
                  scheduled_time={item.scheduled_time}
                />
              ))
            )}
          </div>

          <button 
            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary-600 hover:bg-primary-600/90 rounded-full flex items-center justify-center shadow-md z-10 transition-colors duration-200"
            aria-label="Next"
            onClick={() => handleScroll('right')}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // Grid layout (for standalone page)
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-16 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[36px] font-medium text-primary-600">Coming Soon</h1>
        </div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[120px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center font-semibold">{error}</div>
        ) : scheduledStreams.length === 0 ? (
          <div className="text-gray-500 text-center">No scheduled streams found.</div>
        ) : (
          <div className="grid grid-cols-5 gap-6 mb-8">
            {scheduledStreams.map((item) => (
              <LiveCard
                key={item.stream_id}
                id={item.stream_id}
                title={item.title}
                host={item.merchant?.business_name || 'Unknown Host'}
                thumbnail={item.thumbnail_url || ''}
                type={item.description || ''}
                scheduled_time={item.scheduled_time}
              />
            ))}
          </div>
        )}
        <div className="flex justify-center">
          <button className="bg-primary-600 hover:bg-primary-600/90 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200">
            See More
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon; 