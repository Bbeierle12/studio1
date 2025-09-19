import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { AuthProvider } from '@/context/auth-context';
import { ShoppingListProvider } from '@/context/shopping-list-context';
import { PrintProvider } from '@/context/print-context';
import { PrintDialog } from '@/components/print-dialog';
import { ThemeProvider } from '@/context/theme-context';
import { UnitProvider } from '@/context/unit-context';
import { SavedRecipesProvider } from '@/context/saved-recipes-context';
import { ClientSessionProvider } from '@/components/client-session-provider';

export const metadata: Metadata = {
  title: 'Our Family Table',
  description: 'Preserving culinary heritage, one recipe at a time.',
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
        <ClientSessionProvider>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <ShoppingListProvider>
                <SavedRecipesProvider>
                  <UnitProvider>
                    <PrintProvider>
                      <div className='relative flex min-h-screen w-full flex-col overflow-x-hidden'>
                        <Header />
                        {children}
                      </div>
                      <Toaster />
                      <PrintDialog />
                    </PrintProvider>
                  </UnitProvider>
                </SavedRecipesProvider>
              </ShoppingListProvider>
            </AuthProvider>
          </ThemeProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
