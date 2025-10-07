'use client';

import { useEffect, useState } from 'react';
import { isOnline } from '@/lib/pwa-utils';

interface UseOfflineOptions {
  onOnline?: () => void;
  onOffline?: () => void;
}

export function useOffline(options: UseOfflineOptions = {}) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Set initial status
    setOffline(!isOnline());

    const handleOnline = () => {
      setOffline(false);
      options.onOnline?.();
    };

    const handleOffline = () => {
      setOffline(true);
      options.onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [options]);

  return {
    offline,
    online: !offline,
  };
}
