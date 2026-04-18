// src/components/layout.tsx

'use client';

import {Navbar} from '@/components/Navbar';
import {ThemeProvider} from '@/components/ThemeProvider';
import {LanguageProvider} from '@/i18n/LanguageProvider';
import localFont from 'next/font/local';
import {usePathname} from 'next/navigation';
import {Toaster} from 'sonner';
import Link from 'next/link';
import '@/styles/globals.scss';
import {Providers} from './providers';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';

const apfel = localFont({
  src: [
    {
      path: '../../public/fonts/Satoshi-Regular.woff2',
      weight: '400',
    },
    {
      path: '../../public/fonts/Satoshi-Medium.woff2',
      weight: '500',
    },
    {
      path: '../../public/fonts/CabinetGrotesk-Bold.woff2',
      weight: '700',
    },
  ],
  variable: '--font-apfel',
});

export default function RootLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth/');
  const isMapsPage = pathname === '/maps' || pathname?.startsWith('/maps/');
  const isTestPage = pathname?.startsWith('/test');
  const isSharedMapPage = pathname?.startsWith('/share/map/');
  
  // Check if this is a shared list (new consolidated URL)
  const isSharedListPage = typeof window !== 'undefined' && 
    pathname?.startsWith('/lists/') && 
    new URLSearchParams(window.location.search).get('shared') === 'true';

  return (
    <html lang="en">
      <body className={`${apfel.variable} antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
          <Providers>
            {!isAuthPage && !isMapsPage && !isSharedMapPage && !isSharedListPage && !isTestPage && <Navbar />}
            {children}
            {!isMapsPage && !isSharedMapPage && !isSharedListPage && !isTestPage && (
              <ProtectedRoute>
                <div className="flex flex-row justify-between items-center p-8 pb-8">
                  <div className="nav-logo text-2xl text-accent">
                    Gramjegerne
                  </div>
                  <Link href="mailto:gramjegerne@gmail.com" className="menu-item text-lg">
                    Contact
                  </Link>
                </div>
              </ProtectedRoute>
            )}
          </Providers>
          </LanguageProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
