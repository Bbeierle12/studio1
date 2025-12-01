import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { DynamicBreadcrumbs } from '@/components/dynamic-breadcrumbs';
import { Sidebar } from '@/components/sidebar';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import { ClientSessionProvider } from '@/components/client-session-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { QueryProvider } from '@/components/query-provider';

export const metadata: Metadata = {
  title: 'Recipe App',
  description: 'Simple recipe storage and meal planning',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@400&display=swap'
          rel='stylesheet'
        />
      </head>
      <body className='font-body antialiased'>
        <ErrorBoundary>
          <ClientSessionProvider>
            <QueryProvider>
              <ThemeProvider
                attribute='class'
                defaultTheme='system'
                enableSystem
                disableTransitionOnChange
              >
                <AuthProvider>
                  <div className='relative flex min-h-screen w-full'>
                    <Sidebar />
                    <div className='flex flex-col flex-1 md:pl-64 transition-all duration-300'>
                      <Header />
                      <DynamicBreadcrumbs />
                      <main className='flex-1'>{children}</main>
                    </div>
                  </div>
                  <Toaster />
                </AuthProvider>
              </ThemeProvider>
            </QueryProvider>
          </ClientSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
