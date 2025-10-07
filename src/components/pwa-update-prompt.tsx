'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowPrompt(true);
      }
    };

    // Check for updates on load
    navigator.serviceWorker.ready.then(handleUpdate);

    // Listen for new service worker waiting to activate
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    // Check for updates periodically (every hour)
    const intervalId = setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }, 60 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleUpdate = () => {
    if (!waitingWorker) return;

    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-5">
      <Card className="shadow-lg border-2 bg-primary text-primary-foreground">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            <CardTitle className="text-lg">Update Available</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            A new version of Studio1 is ready to install
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={handleUpdate} 
              className="flex-1 bg-background text-foreground hover:bg-background/90"
            >
              Update Now
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
