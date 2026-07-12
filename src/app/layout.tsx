import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from '@/components/app-shell';
import { AuthProvider } from '@/context/auth-context';
import { NavigationCountsProvider } from '@/context/navigation-counts-context';
import { ShoppingListProvider } from '@/context/shopping-list-context';
import { PrintProvider } from '@/context/print-context';
import { PrintDialog } from '@/components/print-dialog';
import { ThemeProvider } from '@/context/theme-context';
import { UnitProvider } from '@/context/unit-context';
import { SavedRecipesProvider } from '@/context/saved-recipes-context';
import { ClientSessionProvider } from '@/components/client-session-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { QueryProvider } from '@/components/query-provider';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { PWAUpdatePrompt } from '@/components/pwa-update-prompt';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { MaintenanceModeChecker } from '@/components/maintenance-mode-checker';
import { Hotkeys } from '@/app/providers/Hotkeys';
import { Playfair_Display, Roboto } from 'next/font/google';

// Self-hosted via next/font (no layout shift). Loads the weights the type scale
// actually uses — previously only Playfair 700 + Roboto 400 were loaded, so
// font-medium/semibold body text was browser-synthesized faux-bold.
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-headline-src',
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-body-src',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Our Family Table',
  description: 'A warm home for your family’s recipes and weekly meal planning.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f3ef' },
    { media: '(prefers-color-scheme: dark)', color: '#251b13' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={`${playfair.variable} ${roboto.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel='apple-touch-icon' href='/icons/icon-192x192.png' />
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
                  <NavigationCountsProvider>
                    <MaintenanceModeChecker>
                      <ShoppingListProvider>
                        <SavedRecipesProvider>
                          <UnitProvider>
                            <PrintProvider>
                              <AppShell>{children}</AppShell>
                              <Toaster />
                              <PrintDialog />
                              <PWAInstallPrompt />
                              <PWAUpdatePrompt />
                              <Hotkeys />
                            </PrintProvider>
                          </UnitProvider>
                        </SavedRecipesProvider>
                      </ShoppingListProvider>
                    </MaintenanceModeChecker>
                  </NavigationCountsProvider>
                </AuthProvider>
              </ThemeProvider>
            </QueryProvider>
          </ClientSessionProvider>
        </ErrorBoundary>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
