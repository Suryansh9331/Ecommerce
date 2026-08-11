import React, { useState, useRef, useEffect } from 'react';
import { FaShare } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/useAuth';
// Remove socket.io import
// import io, { Socket } from 'socket.io-client';

interface ProductMedia {
  media_id: number;
  url: string;
  type: string;
}

interface ProductAttribute {
  attribute_id: number;
  attribute_name: string;
  value_text: string | null;
}

interface Product {
  product_id: number;
  name: string;
  media: ProductMedia[];
  attributes: ProductAttribute[];
  description: string | null;
  product_name?: string; // For backward compatibility
  sku?: string; // For backward compatibility
  selling_price?: number; // For backward compatibility
  approval_status?: string; // For backward compatibility

}

interface LiveStreamForm {
  streamTitle: string;
  productId: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  thumbnail: File | null;
}

interface LiveStream {
  stream_id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  scheduled_time: string;
  start_time?: string;
  end_time?: string;
  is_live: boolean;
  status: 'LIVE' | 'SCHEDULED' | 'ENDED';
  viewers_count: number;
  likes_count: number;
  stream_key: string;
  stream_url?: string;
  yt_livestream_id?: string;
  product: Product;
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
  };
}

interface ChatMessage {
  comment_id: number;
  user: {
    first_name: string;
    last_name: string;
    role: string;
  };
  content: string;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Aoinlive: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [formData, setFormData] = useState<LiveStreamForm>({
    streamTitle: '',
    productId: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    thumbnail: null,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [customSlot, setCustomSlot] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [streams, setStreams] = useState<{ scheduled: LiveStream[]; live: LiveStream[]; ended: LiveStream[] }>({ scheduled: [], live: [], ended: [] });
  const [deletingStreamId, setDeletingStreamId] = useState<number | null>(null);
  const [rtmpInfo, setRtmpInfo] = useState<any | null>(null);
  const [showRtmpModal, setShowRtmpModal] = useState(false);
  const [rtmpModalStream, setRtmpModalStream] = useState<any | null>(null);
  const [currentLiveStream, setCurrentLiveStream] = useState<LiveStream | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Fetch all streams (grouped by status)
  const fetchAllStreams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/live-streams/all`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch streams');
      const data = await response.json();
      setStreams({
        scheduled: data.scheduled || [],
        live: data.live || [],
        ended: data.ended || [],
      });
      if (data.live && data.live.length > 0) {
        setCurrentLiveStream(data.live[0]); // or let merchant pick if multiple
      } else {
        setCurrentLiveStream(null);
      }
    } catch (error) {
      setStreams({ scheduled: [], live: [], ended: [] });
      toast.error('Failed to load streams');
    }
  };

  // Fetch all streams on mount and when a stream is scheduled/ended
  useEffect(() => {
    if (accessToken) {
      fetchAllStreams();
    }
  }, [accessToken]);

  // Fetch the latest status for a stream from the backend
  const fetchStreamStatus = async (streamId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/live-streams/${streamId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stream status');
      const data = await response.json();
      console.log('Stream status API response:', data); // <-- Debug log
      // setCurrentStream(data); // This line was removed
    } catch (error) {
      // Optionally handle error
    }
  };

  // After scheduling, starting, or ending a stream, fetch the latest status
  const handleGoLive = async (stream: any) => {
    // setCurrentStream(stream); // This line was removed
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/live-streams/${stream.stream_id}/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        // Check for redundantTransition error in response
        let err;
        try {
          err = await response.json();
        } catch (e) {
          err = { error: 'Failed to start stream' };
        }
        // If error contains redundantTransition, treat as success
        if (
          typeof err.error === 'string' && err.error.includes('redundantTransition')
        ) {
          toast.success('Stream is already live!');
          fetchStreamStatus(stream.stream_id);
          fetchAllStreams();
          return;
        }
        // Show a user-friendly message for YouTube inactive stream error
        if (
          (typeof err.error === 'string' && err.error.includes('Stream is inactive')) ||
          (typeof err.error === 'string' && err.error.includes('errorStreamInactive'))
        ) {
          toast.error('Please wait while the admin configures YouTube. Try again in a few moments.');
          return;
        }
        toast.error(err.error || 'Failed to start stream');
        return;
      }
      const data = await response.json();
      // setCurrentStream(data.data); // This line was removed
      // Fetch latest status from backend (which now checks YouTube)
      fetchStreamStatus(data.data.stream_id);
      toast.success('Live stream started!');
      fetchAllStreams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to start stream');
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchProducts();
    }
  }, [accessToken]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (formData.scheduledDate) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/merchant-dashboard/live-streams/available-slots?date=${formData.scheduledDate}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          if (!response.ok) throw new Error('Failed to fetch slots');
          const data = await response.json();
          let availableSlots = [];
          if (data.available_slots) {
            availableSlots = data.available_slots;
          } else if (Array.isArray(data)) {
            availableSlots = data;
          }
          setAvailableSlots(availableSlots);
        } catch (error) {
          console.error('Error fetching slots:', error);
          setAvailableSlots([]);
          toast.error('Failed to load available slots');
        }
      } else {
        setAvailableSlots([]);
      }
      // setSelectedSlot(''); // This line was removed
    };
    fetchSlots();
  }, [formData.scheduledDate, accessToken, API_BASE_URL]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // if (name === 'productId' || name === 'scheduledDate') { // This line was removed
    //   setSelectedSlot(''); // This line was removed
    // } // This line was removed
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({
        ...prev,
        thumbnail: file,
      }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  const handleSlotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSlot(e.target.value);
    if (e.target.value !== 'other') {
      setCustomSlot('');
    }
  };

  const handleCustomSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSlot(e.target.value);
    setSelectedSlot('other');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true); // <-- Start loading
    let slotToUse = selectedSlot === 'other' ? customSlot : selectedSlot;
    if (!slotToUse) {
      toast.error('Please select or enter a time slot');
      setIsScheduling(false); // <-- Stop loading on error
      return;
    }
    const scheduled_time = `${formData.scheduledDate}T${slotToUse}:00`;
    try {
      let response;
      if (formData.thumbnail) {
        // Use multipart/form-data if thumbnail is present
        const form = new FormData();
        form.append('title', formData.streamTitle);
        form.append('product_id', formData.productId);
        form.append('description', formData.description);
        form.append('scheduled_time', scheduled_time);
        form.append('thumbnail', formData.thumbnail);
        form.append('allow_embedding', 'true');
        response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/live-streams`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          body: form
        });
      } else {
        // Use JSON if no thumbnail file
        const payload = {
          title: formData.streamTitle,
          product_id: Number(formData.productId),
          description: formData.description,
          scheduled_time,
          allow_embedding: true,
        };
        response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/live-streams`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || err.message || 'Failed to schedule stream');
      }
      const data = await response.json();
      console.log('Schedule Live Stream API response:', data); // <-- Debug log
      // setCurrentStream(data.data); // This line was removed
      setRtmpInfo(data.rtmp_info || null);
      toast.success('Live stream scheduled successfully!');
      // Refresh scheduled streams after scheduling
      fetchAllStreams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule stream');
    } finally {
      setIsScheduling(false); // <-- Stop loading after response
    }
  };

  // Remove sendMessage and likeStream logic that used socket
  // const sendMessage = () => {
  //   if (!newMessage.trim() || !currentStream || !socket) return;

  //   socket.emit('send_message', {
  //     user_id: user?.id,
  //     stream_id: currentStream.stream_id,
  //     content: newMessage.trim()
  //   });

  //   setNewMessage('');
  // };

  // const likeStream = () => {
  //   if (!currentStream || !socket) return;

  //   socket.emit('like_stream', {
  //     stream_id: currentStream.stream_id
  //   });
  // };

  const shareStream = () => {
    // if (!currentStream) return; // This line was removed
    
    // const shareUrl = `${window.location.origin}/live-stream/${currentStream.stream_id}`; // This line was removed
    // navigator.clipboard.writeText(shareUrl); // This line was removed
    // toast.success('Stream link copied to clipboard!'); // This line was removed
  };

  // Helper for copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Fetch RTMP info for a scheduled stream
  const fetchRtmpInfoForStream = async (stream: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/live-streams/${stream.stream_id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stream details');
      const data = await response.json();
      // If backend returns rtmp_info, use it; else, fallback to stream.stream_url/stream_key
      let rtmp = null;
      if (data.rtmp_info) {
        rtmp = data.rtmp_info;
      } else if (data.stream_url && data.stream_key) {
        rtmp = {
          ingestionAddress: data.stream_url,
          streamName: data.stream_key,
          streamUrl: `${data.stream_url}/${data.stream_key}`,
        };
      }
      setRtmpInfo(rtmp);
      setRtmpModalStream(data);
      setShowRtmpModal(true);
    } catch (error) {
      toast.error('Failed to fetch RTMP info');
    }
  };

  const deleteStream = async (streamId: number) => {
    if (!window.confirm('Are you sure you want to delete this stream?')) return;
    setDeletingStreamId(streamId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/live-streams/${streamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || err.message || 'Failed to delete stream');
      }
      toast.success('Stream deleted');
      fetchAllStreams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete stream');
    } finally {
      setDeletingStreamId(null);
    }
  };

  const handleEndStream = async (stream: LiveStream) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/live-streams/${stream.stream_id}/end`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to end stream');
      }
      toast.success('Live stream ended');
      fetchAllStreams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to end stream');
    }
  };

  // Move renderStreamCard inside the component
  const renderStreamCard = (stream: LiveStream) => (
    <div key={stream.stream_id} className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 last:border-b-0 last:pb-0">
      <div className="flex-1">
        <div className="flex items-start space-x-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
            {stream.thumbnail_url ? (
              <img 
                src={stream.thumbnail_url} 
                alt={stream.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.68v6.64a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div className="flex-1">
            <div className="font-medium text-lg flex items-center">
              {stream.title}
              <span className={`ml-2 px-2 py-1 text-xs font-semibold text-white rounded-full ${
                stream.status && stream.status.toUpperCase() === 'LIVE' 
                  ? 'bg-red-500' 
                  : stream.status && stream.status.toUpperCase() === 'SCHEDULED' 
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
              }`}>
                {stream.status}
              </span>
            </div>
            
            {/* Product Details */}
            {stream.product && (
              <div className="mt-2 space-y-1">
                <div className="text-sm text-gray-600">
                  Product: {stream.product.name || stream.product.product_name}
                </div>
                {stream.product.description && (
                  <div className="text-sm text-gray-500 line-clamp-2">
                    {stream.product.description}
                  </div>
                )}
                {stream.product.media && stream.product.media.length > 0 && (
                  <div className="flex gap-2 mt-1">
                    {stream.product.media.slice(0, 3).map((media) => (
                      <img 
                        key={media.media_id}
                        src={media.url}
                        alt="Product"
                        className="w-8 h-8 rounded object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stream Details */}
            <div className="mt-2 text-sm text-gray-600">
              {stream.status === 'LIVE' && (
                <>
                  <div>Started: {new Date(stream.start_time!).toLocaleString()}</div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.68v6.64a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                      {stream.viewers_count} watching
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4a3 3 0 003-3V4a2 2 0 00-2-2H6a2 2 0 00-2 2v3a3 3 0 003 3h4a2 2 0 012 2v7a2 2 0 002 2h2a2 2 0 002-2v-7a2 2 0 012-2z"></path></svg>
                      {stream.likes_count} likes
                    </span>
                  </div>
                </>
              )}
              {stream.status && stream.status.toUpperCase() === 'SCHEDULED' && stream.scheduled_time && (
                <div className="text-sm text-gray-600 mt-1">
                  Scheduled for: {new Date(stream.scheduled_time).toLocaleString()}
                </div>
              )}
              {stream.status === 'ENDED' && stream.end_time && (
                <div>Ended: {new Date(stream.end_time).toLocaleString()}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 md:mt-0 flex gap-2">
        {stream.status && stream.status.toUpperCase() === 'SCHEDULED' && (
          <>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => fetchRtmpInfoForStream(stream)}
            >
              Get RTMP Key
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              onClick={() => handleGoLive(stream)}
            >
              Go Live
            </button>
          </>
        )}
        {stream.status && stream.status.toUpperCase() === 'LIVE' && (
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => handleEndStream(stream)}
          >
            End Stream
          </button>
        )}
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          onClick={() => deleteStream(stream.stream_id)}
          disabled={deletingStreamId === stream.stream_id}
        >
          {deletingStreamId === stream.stream_id ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-900">Aoin Live Streaming</h1>
        
        {isScheduling && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
          </div>
        )}

        {/* RTMP Modal for Go Live */}
        {showRtmpModal && rtmpInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setShowRtmpModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Go Live with OBS Studio</h2>
              <div className="mb-3">
                <span className="font-semibold">RTMP URL:</span>
                <span className="ml-2 font-mono text-sm select-all">{rtmpInfo.ingestionAddress || 'N/A'}</span>
                {rtmpInfo.ingestionAddress && (
                  <button onClick={() => handleCopy(rtmpInfo.ingestionAddress)} className="ml-2 text-blue-600 underline text-xs">Copy</button>
                )}
              </div>
              <div className="mb-3">
                <span className="font-semibold">Stream Key:</span>
                <span className="ml-2 font-mono text-sm select-all">{rtmpInfo.streamName || 'N/A'}</span>
                {rtmpInfo.streamName && (
                  <button onClick={() => handleCopy(rtmpInfo.streamName)} className="ml-2 text-blue-600 underline text-xs">Copy</button>
                )}
              </div>
              {rtmpInfo.streamUrl && (
                <div className="mb-3">
                  <span className="font-semibold">Full RTMP:</span>
                  <span className="ml-2 font-mono text-sm select-all">{rtmpInfo.streamUrl}</span>
                  <button onClick={() => handleCopy(rtmpInfo.streamUrl)} className="ml-2 text-blue-600 underline text-xs">Copy</button>
                </div>
              )}
              <div className="mt-4 text-gray-700 text-sm">
                <strong>How to use in OBS Studio:</strong>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li>Open <b>OBS Studio</b> and go to <b>Settings &gt; Stream</b>.</li>
                  <li>Set <b>Service</b> to <b>Custom...</b></li>
                  <li>Paste the <b>RTMP URL</b> above into the <b>Server</b> field.</li>
                  <li>Paste the <b>Stream Key</b> above into the <b>Stream Key</b> field.</li>
                  <li>Click <b>Apply</b> and <b>OK</b>, then click <b>Start Streaming</b> in OBS.</li>
                </ol>
                <div className="mt-2 text-green-700">You are now ready to go live on YouTube!</div>
              </div>
            </div>
          </div>
        )}

        {/* Show RTMP info after scheduling a stream */}
        {rtmpInfo && (rtmpInfo.ingestionAddress || rtmpInfo.streamName) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Your RTMP Stream Details</h2>
            <div className="mb-2">
              <span className="font-semibold">RTMP URL:</span>
              <span className="ml-2 font-mono text-sm select-all">{rtmpInfo.ingestionAddress || 'N/A'}</span>
              {rtmpInfo.ingestionAddress && (
                <button onClick={() => handleCopy(rtmpInfo.ingestionAddress)} className="ml-2 text-blue-600 underline text-xs">Copy</button>
              )}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Stream Key:</span>
              <span className="ml-2 font-mono text-sm select-all">{rtmpInfo.streamName || 'N/A'}</span>
              {rtmpInfo.streamName && (
                <button onClick={() => handleCopy(rtmpInfo.streamName)} className="ml-2 text-blue-600 underline text-xs">Copy</button>
              )}
            </div>
            {rtmpInfo.streamUrl && (
              <div className="mb-2">
                <span className="font-semibold">Full RTMP:</span>
                <span className="ml-2 font-mono text-sm select-all">{rtmpInfo.streamUrl}</span>
                <button onClick={() => handleCopy(rtmpInfo.streamUrl)} className="ml-2 text-blue-600 underline text-xs">Copy</button>
              </div>
            )}
            <div className="text-green-700 text-sm mt-2">Use these details in your streaming software (e.g., OBS, Streamlabs) to go live on YouTube.</div>
          </div>
        )}

        {/* Live Streams Section */}
        {currentLiveStream && currentLiveStream.stream_url && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Live Stream</h2>
            <div className="mb-4">
              <iframe
                title="YouTube Live Stream"
                src={`https://www.youtube.com/embed/${currentLiveStream.stream_url.split('v=')[1]}`}
                width="100%"
                height="400"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-96 rounded-lg border"
              />
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => handleEndStream(currentLiveStream)}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                End Stream
              </button>
            </div>
          </div>
        )}

        {/* Update the streams display section */}
        {streams.live.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Streams</h2>
            <div className="space-y-6">
              {streams.live.map((stream) => (
                <div key={stream.stream_id} className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
                        {stream.thumbnail_url ? (
                          <img 
                            src={stream.thumbnail_url} 
                            alt={stream.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.68v6.64a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          </div>
                        )}
                      </div>

                      {/* Stream Info */}
                      <div className="flex-1">
                        <div className="font-medium text-lg flex items-center">
                          {stream.title}
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold text-white rounded-full ${
                            stream.status === 'LIVE' 
                              ? 'bg-red-500' 
                              : stream.status === 'SCHEDULED' 
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                          }`}>
                            {stream.status}
                          </span>
                        </div>
                        
                        {/* Product Details */}
                        {stream.product && (
                          <div className="mt-2 space-y-1">
                            <div className="text-sm text-gray-600">
                              Product: {stream.product.name || stream.product.product_name}
                            </div>
                            {stream.product.description && (
                              <div className="text-sm text-gray-500 line-clamp-2">
                                {stream.product.description}
                              </div>
                            )}
                            {stream.product.media && stream.product.media.length > 0 && (
                              <div className="flex gap-2 mt-1">
                                {stream.product.media.slice(0, 3).map((media) => (
                                  <img 
                                    key={media.media_id}
                                    src={media.url}
                                    alt="Product"
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Stream Details */}
                        <div className="mt-2 text-sm text-gray-600">
                          {stream.status === 'LIVE' && (
                            <>
                              <div>Started: {new Date(stream.start_time!).toLocaleString()}</div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.68v6.64a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                  {stream.viewers_count} watching
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4a3 3 0 003-3V4a2 2 0 00-2-2H6a2 2 0 00-2 2v3a3 3 0 003 3h4a2 2 0 012 2v7a2 2 0 002 2h2a2 2 0 002-2v-7a2 2 0 012-2z"></path></svg>
                                  {stream.likes_count} likes
                                </span>
                              </div>
                            </>
                          )}
                          {stream.status === 'SCHEDULED' && (
                            <div>Scheduled for: {new Date(stream.scheduled_time).toLocaleString()}</div>
                          )}
                          {stream.status === 'ENDED' && stream.end_time && (
                            <div>Ended: {new Date(stream.end_time).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 md:mt-0 flex gap-2">
                    {stream.status === 'SCHEDULED' && (
                      <>
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          onClick={() => fetchRtmpInfoForStream(stream)}
                        >
                          Get RTMP Key
                        </button>
                        <button
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          onClick={() => handleGoLive(stream)}
                        >
                          Go Live
                        </button>
                      </>
                    )}
                    {stream.status === 'LIVE' && (
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        onClick={() => handleEndStream(stream)}
                      >
                        End Stream
                      </button>
                    )}
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      onClick={() => deleteStream(stream.stream_id)}
                      disabled={deletingStreamId === stream.stream_id}
                    >
                      {deletingStreamId === stream.stream_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Streams Section */}
        {streams.scheduled.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Streams</h2>
            <div className="space-y-6">
              {streams.scheduled.map(renderStreamCard)}
            </div>
          </div>
        )}

        {/* Ended Streams Section */}
        {streams.ended.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Streams</h2>
            <div className="space-y-6">
              {streams.ended.map(renderStreamCard)}
            </div>
          </div>
        )}

        {/* Schedule Live Stream Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="streamTitle" className="block text-sm font-medium text-gray-700">
                  Stream Title
                </label>
                <input
                  type="text"
                  id="streamTitle"
                  name="streamTitle"
                  value={formData.streamTitle}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Enter stream title"
                  required
                />
              </div>

              <div>
                <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
                  Select Product
                </label>
                <select
                  id="productId"
                  name="productId"
                  value={formData.productId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                >
                  <option value="">Select a product</option>
                  {products
                  .filter((product) => product.approval_status === "approved") // ✅ Only show approved products
                  .map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.name || product.product_name} - {product.sku}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Enter stream description"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    id="scheduledDate"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="slot" className="block text-sm font-medium text-gray-700">
                    Time Slot
                  </label>
                  <select
                    id="slot"
                    name="slot"
                    value={selectedSlot}
                    onChange={handleSlotChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a slot</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot} - {`${parseInt(slot.split(':')[0]) + 1}:00`}</option>
                    ))}
                    <option value="other">Other (enter custom time)</option>
                  </select>
                  {selectedSlot === 'other' && (
                    <input
                      type="time"
                      value={customSlot}
                      onChange={handleCustomSlotChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">
                  Thumbnail
                </label>
                <input
                  type="file"
                  id="thumbnail"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100"
                  required
                />
              </div>

              {/* Thumbnail Preview */}
              {thumbnailPreview && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail Preview
                  </label>
                  <div className="relative w-full max-w-xs mx-auto">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-primary-200 shadow-sm">
                      <img 
                        src={thumbnailPreview} 
                        alt="Thumbnail preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200">
                        Preview
                      </span>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-500">
                        This is how your thumbnail will appear to viewers
                      </p>
                    </div>
                  </div>
                </div>
              )}


            </div>

            <button
              type="submit"
              disabled={isScheduling}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScheduling ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scheduling...
                </>
              ) : (
                'Schedule Live Stream'
              )}
            </button>
          </form>
      </div>
    </div>
  );
};

export default Aoinlive;