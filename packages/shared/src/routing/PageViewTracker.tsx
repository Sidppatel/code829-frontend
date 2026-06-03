import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPortalId } from '../lib/axios';

export function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    const reportVisit = async () => {
      try {
        const portal = getPortalId() || 'public';
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
        const envObj = (import.meta as unknown as { env?: Record<string, string> }).env;
        const baseUrl = isLocal ? (envObj?.VITE_API_URL || '/api/v1') : '/api/v1';
        const url = baseUrl.endsWith('/') ? `${baseUrl}telemetry/visit` : `${baseUrl}/telemetry/visit`;

        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Portal': portal,
          },
          credentials: 'include',
          body: JSON.stringify({
            Path: location.pathname,
            Referrer: document.referrer || null,
            ScreenResolution: `${window.screen.width}x${window.screen.height}`,
            Portal: portal,
          }),
        });
      } catch {
        // Fail silently to avoid interrupting the user's browsing experience
      }
    };

    reportVisit();
  }, [location.pathname]);

  return null;
}
