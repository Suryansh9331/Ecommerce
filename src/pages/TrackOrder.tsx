import React, { useState, useEffect } from 'react';
import { Package, Search, ArrowRight, Truck, Calendar, MapPin, RotateCcw } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface TrackingStep {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

interface ShipmentTrackingData {
  shipment_id: number;
  merchant_id: number;
  carrier_name: string;
  tracking_number: string;
  shiprocket_order_id?: number;
  tracking_data?: any;
  error?: string;
}

interface TrackingInfo {
  order_id: string;
  shiprocket_response?: any;  
  shipments?: {
    [key: string]: ShipmentTrackingData;
  };
}


const TrackOrder: React.FC = () => {
  const location = useLocation();
  const { orderId } = useParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchOrderTracking = async (orderId: string): Promise<TrackingInfo | null> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/shiprocket/tracking/db-order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch order tracking: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Check if the response has the expected structure with data property
      if (data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch order tracking');
      }
    } catch (err) {
      console.error('Error fetching order tracking:', err);
      toast.error('Failed to load order tracking information');
      return null;
    }
  };

  const getOverallStatus = (trackingInfo: TrackingInfo): string => {
    // Check if we have direct ShipRocket response
    if (trackingInfo.shiprocket_response) {
      // Handle the array format from ShipRocket
      if (Array.isArray(trackingInfo.shiprocket_response)) {
        const firstResponse = trackingInfo.shiprocket_response[0];
        if (firstResponse && firstResponse.tracking_data) {
          const trackingData = firstResponse.tracking_data;
          
          // Check if there's an error message indicating no activities
          if (trackingData.error && trackingData.error.includes("no activities found")) {
            return 'Not Shipped Yet';
          }
          
          // Get current status from shipment_track
          if (trackingData && trackingData.shipment_track && Array.isArray(trackingData.shipment_track) && trackingData.shipment_track.length > 0) {
            const currentStatus = trackingData.shipment_track[0].current_status;
            if (currentStatus) {
              return currentStatus;
            }
          }
          
          // Fallback: check if we have any tracking activities
          if (trackingData && trackingData.shipment_track_activities && Array.isArray(trackingData.shipment_track_activities) && trackingData.shipment_track_activities.length > 0) {
            // Get the most recent activity status
            const latestActivity = trackingData.shipment_track_activities[0];
            return latestActivity.status || latestActivity.status_name || 'In Transit';
          }
        }
      }
      
      return 'Processing';
    }
    
    // Fallback to old shipments format
    const shipments = Object.values(trackingInfo.shipments || {});
    
    if (shipments.length === 0) return 'Unknown';
    
    // Check if any shipment has tracking data
    const shipmentsWithData = shipments.filter(s => s.tracking_data && !s.error);
    
    if (shipmentsWithData.length === 0) return 'Processing';
    
    // Get the most recent status from all shipments
    const statuses = shipmentsWithData.map(s => s.tracking_data?.current_status || 'Processing');
    
    const finalStatus = statuses[0] || 'Processing';
    return finalStatus;
  };

  const getEstimatedDelivery = (trackingInfo: TrackingInfo): string => {
    // Check if we have direct ShipRocket response
    if (trackingInfo.shiprocket_response) {
      if (Array.isArray(trackingInfo.shiprocket_response)) {
        const firstResponse = trackingInfo.shiprocket_response[0];
        if (firstResponse && firstResponse.tracking_data) {
          const trackingData = firstResponse.tracking_data;
          
          // Check if there's an error message indicating no activities
          if (trackingData.error && trackingData.error.includes("no activities found")) {
            return 'Will be updated when shipped';
          }
          
          // Get estimated delivery from shipment_track
          if (trackingData && trackingData.shipment_track && Array.isArray(trackingData.shipment_track) && trackingData.shipment_track.length > 0) {
            const edd = trackingData.shipment_track[0].edd;
            if (edd) {
              // Format the date if it's a valid date string
              try {
                const eddDate = new Date(edd);
                if (!isNaN(eddDate.getTime())) {
                  return eddDate.toLocaleDateString();
                }
              } catch (e) {
                // If date parsing fails, return the raw string
                return edd;
              }
            }
          }
        }
      }
      
      return 'To be determined';
    }
    
    // Fallback to old shipments format
    const shipments = Object.values(trackingInfo.shipments || {});
    const shipmentsWithData = shipments.filter(s => s.tracking_data && !s.error);
    
    if (shipmentsWithData.length === 0) return 'To be determined';
    
    // Get the earliest estimated delivery
    const deliveries = shipmentsWithData
      .map(s => s.tracking_data?.estimated_delivery)
      .filter(d => d)
      .sort();
    
    const finalDelivery = deliveries[0] || 'To be determined';
    return finalDelivery;
  };

  const getCurrentLocation = (trackingInfo: TrackingInfo): string => {
    // Check if we have direct ShipRocket response
    if (trackingInfo.shiprocket_response) {
      if (Array.isArray(trackingInfo.shiprocket_response)) {
        const firstResponse = trackingInfo.shiprocket_response[0];
        if (firstResponse && firstResponse.tracking_data) {
          const trackingData = firstResponse.tracking_data;
          
          // Check if there's an error message indicating no activities
          if (trackingData.error && trackingData.error.includes("no activities found")) {
            return 'Order not shipped yet';
          }
          
          // Get current location from shipment_track
          if (trackingData && trackingData.shipment_track && Array.isArray(trackingData.shipment_track) && trackingData.shipment_track.length > 0) {
            const track = trackingData.shipment_track[0];
            
            // Try to get current location from various possible fields
            const currentLocation = track.current_status_location || 
                                  track.current_location || 
                                  track.location || 
                                  track.destination || 
                                  track.origin;
            
            if (currentLocation) {
              return currentLocation;
            }
          }
          
          // Fallback: check latest tracking activity for location
          if (trackingData && trackingData.shipment_track_activities && Array.isArray(trackingData.shipment_track_activities) && trackingData.shipment_track_activities.length > 0) {
            const latestActivity = trackingData.shipment_track_activities[0];
            const activityLocation = latestActivity.location || latestActivity.city;
            if (activityLocation) {
              return activityLocation;
            }
          }
        }
      }
      
      return 'Unknown';
    }
    
    // Fallback to old shipments format
    const shipments = Object.values(trackingInfo.shipments || {});
    const shipmentsWithData = shipments.filter(s => s.tracking_data && !s.error);
    
    if (shipmentsWithData.length === 0) return 'Unknown';
    
    // Get the most recent location
    const locations = shipmentsWithData
      .map(s => s.tracking_data?.current_location)
      .filter(l => l);
    
    const finalLocation = locations[0] || 'Unknown';
    return finalLocation;
  };

  const getTrackingSteps = (trackingInfo: TrackingInfo): TrackingStep[] => {
    // Check if we have direct ShipRocket response
    if (trackingInfo.shiprocket_response) {
      if (Array.isArray(trackingInfo.shiprocket_response)) {
        const firstResponse = trackingInfo.shiprocket_response[0];
        if (firstResponse && firstResponse.tracking_data) {
          const trackingData = firstResponse.tracking_data;
          
          // Check if there's an error message indicating no activities
          if (trackingData.error && trackingData.error.includes("no activities found")) {
            return [
              {
                status: 'Order Placed',
                location: 'Online',
                timestamp: new Date().toLocaleString(),
                description: 'Your order has been placed successfully and will be shipped soon'
              },
              {
                status: 'Not Shipped Yet',
                location: 'Processing',
                timestamp: new Date().toLocaleString(),
                description: 'Your order is being processed and will be shipped soon. Tracking information will be updated once shipped.'
              }
            ];
          }
          
          // Handle real ShipRocket tracking activities
          if (trackingData && trackingData.shipment_track_activities && Array.isArray(trackingData.shipment_track_activities)) {
            return trackingData.shipment_track_activities.map((activity: any) => {
              // Map technical statuses to user-friendly statuses
              const statusMapping: { [key: string]: string } = {
                'expected': 'In Transit',
                'mh_received': 'At Sorting Facility',
                'shipped': 'Shipped',
                'lpd_generated': 'Out for Delivery',
                'shipment_pickup_complete': 'Picked Up',
                'pickup_out_for_pickup': 'Out for Pickup',
                'created': 'Order Processed',
                'delivered': 'Delivered',
                'returned': 'Returned',
                'cancelled': 'Cancelled'
              };

              // Map technical descriptions to user-friendly descriptions
              const descriptionMapping: { [key: string]: string } = {
                'expected': 'Package is in transit to the next facility',
                'mh_received': 'Package has arrived at the sorting facility',
                'shipped': 'Package has been dispatched from the origin',
                'lpd_generated': 'Package is out for delivery',
                'shipment_pickup_complete': 'Package has been successfully picked up',
                'pickup_out_for_pickup': 'Package is ready for pickup',
                'created': 'Order has been processed and is being prepared',
                'delivered': 'Package has been delivered successfully',
                'returned': 'Package has been returned',
                'cancelled': 'Package delivery has been cancelled'
              };

              const technicalStatus = activity.status || activity['sr-status-label'] || 'Unknown';
              const userFriendlyStatus = statusMapping[technicalStatus] || technicalStatus;
              const userFriendlyDescription = descriptionMapping[technicalStatus] || 
                                           activity.activity || 
                                           activity.comment || 
                                           activity.status_comment || 
                                           activity.description || 
                                           'Tracking update';

              // Format timestamp for better readability
              const formatTimestamp = (timestamp: string) => {
                try {
                  const date = new Date(timestamp);
                  if (!isNaN(date.getTime())) {
                    return date.toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                  }
                } catch (e) {
                  // If parsing fails, return original
                }
                return timestamp;
              };

              return {
                status: userFriendlyStatus,
                location: activity.location || activity.city || 'Unknown',
                timestamp: formatTimestamp(activity.date || activity.updated_date || activity.timestamp || new Date().toLocaleString()),
                description: userFriendlyDescription
              };
            });
          }
          
          // Fallback: if we have shipment_track but no activities, create basic steps
          if (trackingData && trackingData.shipment_track && Array.isArray(trackingData.shipment_track) && trackingData.shipment_track.length > 0) {
            const track = trackingData.shipment_track[0];
            const steps = [];
            
            // Add order placed step
            steps.push({
              status: 'Order Placed',
              location: 'Online',
              timestamp: new Date().toLocaleString(),
              description: 'Your order has been placed successfully'
            });
            
            // Add current status if available
            if (track.current_status) {
              steps.push({
                status: track.current_status,
                location: track.destination || track.origin || 'Unknown',
                timestamp: track.updated_time_stamp || track.updated_date || new Date().toLocaleString(),
                description: `Package is ${track.current_status.toLowerCase()}`
              });
            }
            
            return steps;
          }
        }
      }
      
      return [
        {
          status: 'Order Placed',
          location: 'Online',
          timestamp: new Date().toLocaleString(),
          description: 'Your order has been placed successfully'
        }
      ];
    }
    
    // Fallback to old shipments format
    const shipments = Object.values(trackingInfo.shipments || {});
    const shipmentsWithData = shipments.filter(s => s.tracking_data && !s.error);
    
    if (shipmentsWithData.length === 0) {
      return [
        {
          status: 'Order Placed',
          location: 'Online',
          timestamp: new Date().toLocaleString(),
          description: 'Your order has been placed successfully'
        }
      ];
    }
    
    // Get steps from the first shipment with data
    const firstShipment = shipmentsWithData[0];
    
    if (firstShipment.tracking_data?.steps) {
      return firstShipment.tracking_data.steps.map((step: any) => ({
        status: step.status || 'Unknown',
        location: step.location || 'Unknown',
        timestamp: step.timestamp || new Date().toLocaleString(),
        description: step.description || 'Tracking update'
      }));
    }
    
    return [
      {
        status: 'Order Placed',
        location: 'Online',
        timestamp: new Date().toLocaleString(),
        description: 'Your order has been placed successfully'
      }
    ];
  };

  useEffect(() => {
    // Check for order ID in URL params first
    if (orderId) {
      setOrderNumber(orderId);
      handleTrackOrder(undefined, orderId);
    } 
    // If no URL param, check navigation state
    else {
      const state = location.state as { orderNumber?: string } | null;
      if (state?.orderNumber) {
        setOrderNumber(state.orderNumber);
        handleTrackOrder(undefined, state.orderNumber);
      }
    }
  }, [location.state, orderId]);

  const handleTrackOrder = async (e?: React.FormEvent, prefilledOrderNumber?: string) => {
    if (e) {
      e.preventDefault();
    }
    setError(null);
    setLoading(true);

    const orderNumberToTrack = prefilledOrderNumber || orderNumber;

    if (!orderNumberToTrack.trim()) {
      setError('Please enter an order number');
      setLoading(false);
      return;
    }

    try {
      const trackingData = await fetchOrderTracking(orderNumberToTrack);
      
      if (trackingData) {
        setTrackingInfo(trackingData);
        setError(null);
      } else {
        setError('Order not found. Please check the order number and try again.');
        setTrackingInfo(null);
      }
    } catch (err) {
      console.error('Error in handleTrackOrder:', err);
      setError('Failed to fetch tracking information. Please try again.');
      setTrackingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'delivered':
      case 'delivery completed':
        return 'bg-green-500';
      case 'in transit':
      case 'in_transit':
      case 'shipped':
      case 'at sorting facility':
        return 'bg-[#FF4D00]';
      case 'processing':
      case 'pending':
      case 'confirmed':
      case 'label_created':
      case 'order processed':
      case 'picked up':
      case 'picked_up':
      case 'dispatched':
        return 'bg-yellow-500';
      case 'out for delivery':
      case 'out_for_delivery':
      case 'out for pickup':
      case 'out_for_pickup':
      case 'lpd_generated':
        return 'bg-blue-500';
      case 'not shipped yet':
      case 'not_shipped_yet':
      case 'pending_pickup':
      case 'created':
        return 'bg-gray-500';
      case 'cancelled':
      case 'returned':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your order number to track your package</p>
          
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <form onSubmit={handleTrackOrder} className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Enter your order number"
                className="w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00]"
                disabled={loading}
              />
              {/* <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /> */}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#FF4D00] text-white rounded-lg hover:bg-[#FF4D00]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Tracking...
                </>
              ) : (
                <>
                  <Truck size={20} />
                  Track Order
                </>
              )}
            </button>
          </form>
          {error && (
            <p className="mt-4 text-red-500 text-sm">{error}</p>
          )}
        </div>

        {trackingInfo && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Tracking Results</h2>
              <button
                onClick={() => handleTrackOrder(undefined, orderNumber)}
                disabled={loading}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="text-[#FF4D00]" size={24} />
                  <h3 className="font-medium">Order Status</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(getOverallStatus(trackingInfo))}`}></span>
                  <span className="font-medium">{getOverallStatus(trackingInfo)}</span>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="text-[#FF4D00]" size={24} />
                  <h3 className="font-medium">Estimated Delivery</h3>
                </div>
                <p>{getEstimatedDelivery(trackingInfo)}</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="text-[#FF4D00]" size={24} />
                  <h3 className="font-medium">Current Location</h3>
                </div>
                <p>{getCurrentLocation(trackingInfo)}</p>
              </div>
            </div>

            {/* Shipments Information */}
            <div className="mb-8">
              <h3 className="font-medium mb-4">Tracking Information</h3>
              <div className="space-y-4">
                {trackingInfo.shiprocket_response ? (
                  // Show ShipRocket direct response
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Logistics Service Tracking</h4>
                      <span className="text-blue-600 font-mono text-sm">
                        #{trackingInfo.order_id}
                      </span>
                    </div>
                    {Array.isArray(trackingInfo.shiprocket_response) && trackingInfo.shiprocket_response[0] && trackingInfo.shiprocket_response[0].tracking_data ? (
                      <div className="text-sm text-gray-600">
                        <p>Order ID: {trackingInfo.order_id}</p>
                        {trackingInfo.shiprocket_response[0].tracking_data.error ? (
                          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 font-medium">📦 Order Not Shipped Yet</p>
                            <p className="text-yellow-700 text-xs mt-1">
                              Your order has been placed successfully and is being processed. 
                              Tracking information will be updated once your order is shipped.
                            </p>
                          </div>
                        ) : (
                          <div>
                            {trackingInfo.shiprocket_response[0].tracking_data.shipment_track && 
                             trackingInfo.shiprocket_response[0].tracking_data.shipment_track.length > 0 && (
                              <div className="space-y-1">
                                <p><strong>Status:</strong> {trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].current_status || 'Unknown'}</p>
                                <p><strong>Destination:</strong> {trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].destination || 'Unknown'}</p>
                                <p><strong>Estimated Delivery:</strong> {trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].edd || 'To be determined'}</p>
                                {trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].courier_name && (
                                  <p><strong>Courier:</strong> {trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].courier_name}</p>
                                )}
                                {trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].awb_code && (
                                  <p><strong>Tracking Number:</strong> {trackingInfo.shiprocket_response[0].tracking_data.shipment_track[0].awb_code}</p>
                                )}
                              </div>
                            )}
                            
                            {/* Show tracking activities count if available */}
                            {trackingInfo.shiprocket_response[0].tracking_data.shipment_track_activities && 
                             trackingInfo.shiprocket_response[0].tracking_data.shipment_track_activities.length > 0 && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-blue-800 text-xs">
                                  📍 {trackingInfo.shiprocket_response[0].tracking_data.shipment_track_activities.length} tracking updates available
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No tracking data available</p>
                    )}
                  </div>
                ) : trackingInfo.shipments ? (
                  // Fallback to old shipments format
                  Object.values(trackingInfo.shipments).map((shipment) => (
                    <div key={shipment.shipment_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{shipment.carrier_name}</h4>
                        {shipment.tracking_number && (
                          <span className="text-blue-600 font-mono text-sm">
                            #{shipment.tracking_number}
                          </span>
                        )}
                      </div>
                      {shipment.error ? (
                        <p className="text-red-600 text-sm">{shipment.error}</p>
                      ) : shipment.tracking_data ? (
                        <div className="text-sm text-gray-600">
                          <p>Logistics Service Order ID: {shipment.shiprocket_order_id}</p>
                          {shipment.tracking_data.status && (
                            <p>Status: {shipment.tracking_data.status}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No tracking data available</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No tracking information available</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-6">Tracking History</h3>
              <div className="space-y-8">
                {getTrackingSteps(trackingInfo).map((step, index) => (
                  <div key={index} className="relative flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full ${index === getTrackingSteps(trackingInfo).length - 1 ? 'bg-[#FF4D00]' : 'bg-green-500'}`}></div>
                      {index !== getTrackingSteps(trackingInfo).length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 absolute top-4"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{step.status}</h4>
                        <span className="text-sm text-gray-500">• {step.location}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{step.description}</p>
                      <p className="text-sm text-gray-500">{step.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/orders')}
            className="text-[#FF4D00] hover:text-[#FF4D00]/80 transition-colors flex items-center gap-2 mx-auto"
          >
            View All Orders
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder; 