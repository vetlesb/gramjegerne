// src/components/layout.tsx

'use client';

import {Navbar} from '@/components/Navbar';
import {signOut} from 'next-auth/react';
import {ThemeSelector} from '@/components/ThemeSelector';
import {ThemeProvider} from '@/components/ThemeProvider';
import localFont from 'next/font/local';
import {usePathname} from 'next/navigation';
import {Toaster} from 'sonner';
import Link from 'next/link';
import './globals.css';
import {Providers} from './providers';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';

const apfel = localFont({
  src: [
    {
      path: '../../public/fonts/ApfelGrotezk-Regular.woff2',
      weight: '400',
    },
    {
      path: '../../public/fonts/ApfelGrotezk-Mittel.woff2',
      weight: '500',
    },
    {
      path: '../../public/fonts/ApfelGrotezk-Fett.woff2',
      weight: '700',
    },
  ],
  variable: '--font-apfel',
});

export default function RootLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth/');

  return (
    <html lang="en">
      <body className={`${apfel.variable} antialiased`}>
        <ThemeProvider>
          <Providers>
            {!isAuthPage && <Navbar />}
            {children}
            <ProtectedRoute>
              <div className="flex flex-col md:flex-row justify-between">
                <div className="text-center text-2xl text-accent pb-8 flex flex-row gap-1 p-8 justify-start">
                  Gramjegerne
                </div>
                <div className="text-center text-lg pb-8 flex flex-col gap-y-4 md:flex-row gap-1 p-8 justify-end">
                  <ThemeSelector />
                  <Link href="mailto:gramjegerne@gmail.com" className="menu-item">
                    Contact
                  </Link>{' '}
                  <button
                    onClick={() => signOut()}
                    className="menu-item text-lg flex items-center w-full md:w-auto gap-x-1 justify-center"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </ProtectedRoute>
          </Providers>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
