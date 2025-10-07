'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { addConnectionListeners, isOnline } from '@/lib/pwa-utils';
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

export function ConnectionStatus() {
  const [online, setOnline] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Set initial status
    setOnline(isOnline());

    // Listen for changes
    const cleanup = addConnectionListeners(
      () => {
        setOnline(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      },
      () => {
        setOnline(false);
        setShowToast(true);
      }
    );

    return cleanup;
  }, []);

  if (!showToast) {
    return null;
  }

  return (
    <ToastProvider>
      <Toast>
        <div className="flex items-center gap-2">
          {online ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          <div>
            <ToastTitle>
              {online ? 'Back Online' : 'You\'re Offline'}
            </ToastTitle>
            <ToastDescription>
              {online
                ? 'Your connection has been restored'
                : 'Changes will sync when you\'re back online'}
            </ToastDescription>
          </div>
        </div>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}
