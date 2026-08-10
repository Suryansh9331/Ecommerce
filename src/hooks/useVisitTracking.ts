import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

// Add excluded routes
const EXCLUDED_ROUTES = [
  '/superadmin',
  '/business',
  '/admin'
];

// Function to check if route should be excluded
const isExcludedRoute = (path: string): boolean => {
  return EXCLUDED_ROUTES.some(route => path.startsWith(route));
};

interface VisitData {
  session_id: string;
  ip_address: string;
  landing_page: string;
  user_agent: string;
  referrer_url?: string;
  device_type?: string;
  browser?: string;
  os?: string;
}

interface ExitData {
  session_id: string;
  exited_page: string;
  time_spent: number;
}

export const useVisitTracking = () => {
  const location = useLocation();
  const sessionId = useRef(uuidv4());
  const startTime = useRef(Date.now());
  const visitId = useRef<string | null>(null);
  const lastPath = useRef(location.pathname);

  // Function to get device info
  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let deviceType = 'desktop';
    let browser = 'unknown';
    let os = 'unknown';

    // Detect device type
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      deviceType = 'tablet';
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      deviceType = 'mobile';
    }

    // Detect browser
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'Internet Explorer';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    return { deviceType, browser, os };
  };

  // Function to track new visit
  const trackVisit = async () => {
    // Skip tracking for excluded routes
    if (isExcludedRoute(location.pathname)) {
      // console.log('Skipping visit tracking for excluded route:', location.pathname);
      return;
    }

    try {
      const deviceInfo = getDeviceInfo();
      const visitData: VisitData = {
        session_id: sessionId.current,
        ip_address: '', // This should be handled by the backend
        landing_page: location.pathname,
        user_agent: navigator.userAgent,
        referrer_url: document.referrer,
        ...deviceInfo
      };

      // console.log('Tracking visit:', visitData);

      const response = await fetch(`${API_BASE_URL}/api/analytics/track-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitData),
        credentials: 'include'
      });

      const data = await response.json();
      // console.log('Visit tracking response:', data);

      if (data.status === 'success') {
        visitId.current = data.visit_id;
      }
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  // Function to update visit on exit
  const updateVisit = async () => {
    // Skip update for excluded routes
    if (isExcludedRoute(lastPath.current)) {
      // console.log('Skipping visit update for excluded route:', lastPath.current);
      return;
    }

    if (!visitId.current) return;

    try {
      const exitData: ExitData = {
        session_id: sessionId.current,
        exited_page: lastPath.current,
        time_spent: Math.floor((Date.now() - startTime.current) / 1000), // Convert to seconds
      };

      // console.log('Updating visit:', exitData);

      // Use sendBeacon for more reliable exit tracking
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(exitData)], { type: 'application/json' });
        navigator.sendBeacon(`${API_BASE_URL}/api/analytics/update-visit`, blob);
      } else {
        // Fallback to fetch if sendBeacon is not available
        const response = await fetch(`${API_BASE_URL}/api/analytics/update-visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exitData),
          credentials: 'include'
        });

        const data = await response.json();
        // console.log('Visit update response:', data);
      }
    } catch (error) {
      console.error('Error updating visit:', error);
    }
  };

  // Function to mark visit as converted
  const markAsConverted = async (userId: string) => {
    // Skip conversion tracking for excluded routes
    if (isExcludedRoute(location.pathname)) {
      // console.log('Skipping conversion tracking for excluded route:', location.pathname);
      return;
    }

    if (!visitId.current) return;

    try {
      // console.log('Marking visit as converted:', { sessionId: sessionId.current, userId });

      const response = await fetch(`${API_BASE_URL}/api/analytics/mark-converted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId.current,
          user_id: userId,
        }),
        credentials: 'include'
      });

      const data = await response.json();
      // console.log('Conversion response:', data);
    } catch (error) {
      console.error('Error marking visit as converted:', error);
    }
  };

  useEffect(() => {
    // Only track visit if not on excluded route
    if (!isExcludedRoute(location.pathname)) {
      trackVisit();
    }

    // Update lastPath when location changes
    lastPath.current = location.pathname;

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateVisit();
      }
    };

    // Handle beforeunload event
    const handleBeforeUnload = () => {
      updateVisit();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateVisit();
    };
  }, [location.pathname]); // Re-run effect when path changes

  return {
    sessionId: sessionId.current,
    markAsConverted,
  };
}; 