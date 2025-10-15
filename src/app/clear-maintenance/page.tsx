'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function ClearMaintenancePage() {
  const router = useRouter();

  useEffect(() => {
    // Clear the maintenance_mode cookie
    document.cookie = 'maintenance_mode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to home after 2 seconds
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-96 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Maintenance Cookie Cleared!
          </CardTitle>
          <CardDescription>
            The maintenance mode cookie has been successfully removed from your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecting you to the home page...</span>
          </div>
          <p className="text-xs text-muted-foreground">
            If you're not redirected automatically, <a href="/" className="text-primary underline">click here</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
