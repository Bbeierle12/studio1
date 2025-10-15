'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MaintenancePage() {
  const [message, setMessage] = useState(
    'We are currently performing maintenance. Please check back soon!'
  );

  useEffect(() => {
    // Fetch the custom maintenance message
    fetch('/api/maintenance/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message);
        }
      })
      .catch(() => {
        // Use default message if fetch fails
      });
  }, []);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4'>
      <Card className='max-w-2xl w-full shadow-xl'>
        <CardHeader className='text-center pb-4'>
          <div className='mx-auto mb-4 w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center'>
            <Wrench className='h-10 w-10 text-orange-600' />
          </div>
          <CardTitle className='text-3xl font-bold mb-2'>
            Site Under Maintenance
          </CardTitle>
          <CardDescription className='text-lg'>
            We&apos;ll be back shortly
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center space-y-6'>
          <div className='bg-muted/50 p-6 rounded-lg border'>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              {message}
            </p>
          </div>

          <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
            <Clock className='h-4 w-4' />
            <span>Expected downtime: Minimal</span>
          </div>

          <div className='pt-4 space-y-3'>
            <p className='text-sm text-muted-foreground'>
              If you&apos;re an administrator, you can still access the site:
            </p>
            <Button asChild variant='outline' className='w-full sm:w-auto'>
              <Link href='/login'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Go to Login
              </Link>
            </Button>
          </div>

          <div className='pt-6 border-t'>
            <p className='text-xs text-muted-foreground'>
              Thank you for your patience while we improve your experience.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
