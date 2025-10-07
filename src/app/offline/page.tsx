'use client';

import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <WifiOff className="h-24 w-24 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">You're Offline</h1>
          <p className="text-muted-foreground text-lg">
            It looks like you've lost your internet connection.
          </p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          <p className="text-sm text-muted-foreground">
            Don't worry! You can still view your cached meal plans and recipes. 
            Any changes you make will be synced when you're back online.
          </p>

          <Button
            onClick={handleReload}
            className="w-full"
          >
            Try Again
          </Button>

          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full"
          >
            Go Back
          </Button>
        </div>

        <div className="pt-8 space-y-2">
          <h3 className="font-semibold">Offline Features Available:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ View cached meal plans</li>
            <li>✓ Browse saved recipes</li>
            <li>✓ View shopping lists</li>
            <li>✓ View meal templates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
